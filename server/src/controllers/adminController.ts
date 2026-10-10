import { Request, Response } from 'express';
import { dbStore } from '../store/dbStore.js';

export const getAdminMetrics = (_req: Request, res: Response): void => {
  const metrics = {
    usersCount: 24820,
    parkingSpacesCount: 6431,
    bookingsCount: 18294,
    revenueTotal: '₹18.4L',
    pendingVerifications: dbStore.verificationRequests.filter((v) => v.status === 'pending').length,
    openReports: dbStore.reports.filter((r) => r.status === 'Open' || r.status === 'Investigating').length,
  };

  const bookingGrowthChart = [
    { month: 'May', bookings: 2100, revenue: 190000 },
    { month: 'Jun', bookings: 2800, revenue: 260000 },
    { month: 'Jul', bookings: 3400, revenue: 310000 },
    { month: 'Aug', bookings: 4100, revenue: 380000 },
    { month: 'Sep', bookings: 5300, revenue: 490000 },
    { month: 'Oct', bookings: 6100, revenue: 560000 },
  ];

  const occupancyDistribution = [
    { zone: 'Commercial District', occupancy: 86 },
    { zone: 'Transit Stations', occupancy: 82 },
    { zone: 'Shopping Malls', occupancy: 78 },
    { zone: 'Residential Driveways', occupancy: 61 },
    { zone: 'Airport Parking', occupancy: 74 },
  ];

  res.json({
    success: true,
    data: {
      metrics,
      bookingGrowthChart,
      occupancyDistribution,
    },
  });
};

export const getAdminUsers = (_req: Request, res: Response): void => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const safeUsers = dbStore.users.map(({ password: _, ...rest }) => rest);
  res.json({ success: true, count: safeUsers.length, data: safeUsers });
};

export const getAdminParking = (_req: Request, res: Response): void => {
  res.json({ success: true, count: dbStore.parkingSpaces.length, data: dbStore.parkingSpaces });
};

export const getAdminBookings = (_req: Request, res: Response): void => {
  res.json({ success: true, count: dbStore.bookings.length, data: dbStore.bookings });
};

export const getVerificationRequests = (_req: Request, res: Response): void => {
  res.json({ success: true, count: dbStore.verificationRequests.length, data: dbStore.verificationRequests });
};

export const approveVerification = (req: Request, res: Response): void => {
  const { id } = req.params;
  const vr = dbStore.verificationRequests.find((v) => v.id === id);

  if (!vr) {
    res.status(404).json({ success: false, message: 'Verification request not found' });
    return;
  }

  vr.status = 'approved';

  // Mark parking space as verified
  const parking = dbStore.parkingSpaces.find((p) => p.id === vr.listingId || p.title === vr.title);
  if (parking) {
    parking.isVerified = true;
  }

  // Push notification to Space Owner account
  const ownerId = parking?.ownerId || 'usr_owner_1';
  dbStore.notifications.unshift({
    id: `notif_${Date.now()}`,
    userId: ownerId,
    type: 'verification',
    title: 'Listing Verified by Admin',
    message: `Congratulations! Your space "${vr.title}" has been verified by Admin and awarded the "Verified Parking" badge.`,
    dateGroup: 'Today',
    read: false,
    createdAt: new Date().toISOString(),
  });

  res.json({
    success: true,
    message: 'Listing successfully verified with Verified Parking badge',
    data: vr,
  });
};

export const rejectVerification = (req: Request, res: Response): void => {
  const { id } = req.params;
  const { reason } = req.body;
  const vr = dbStore.verificationRequests.find((v) => v.id === id);

  if (!vr) {
    res.status(404).json({ success: false, message: 'Verification request not found' });
    return;
  }

  vr.status = 'rejected';

  // Clear verification flag on parking space
  const parking = dbStore.parkingSpaces.find((p) => p.id === vr.listingId || p.title === vr.title);
  if (parking) {
    parking.isVerified = false;
  }

  // Push notification to Space Owner account
  const ownerId = parking?.ownerId || 'usr_owner_1';
  dbStore.notifications.unshift({
    id: `notif_${Date.now()}`,
    userId: ownerId,
    type: 'general',
    title: 'Verification Request Rejected',
    message: `Your verification submission for "${vr.title}" was rejected by Admin. ${reason ? 'Reason: ' + reason : 'Reason: Clear space photos required.'} Please update and re-submit.`,
    dateGroup: 'Today',
    read: false,
    createdAt: new Date().toISOString(),
  });

  res.json({
    success: true,
    message: 'Listing verification rejected',
    data: vr,
  });
};

export const getReports = (_req: Request, res: Response): void => {
  res.json({ success: true, count: dbStore.reports.length, data: dbStore.reports });
};

export const updateReportStatus = (req: Request, res: Response): void => {
  const { id } = req.params;
  const { status, resolutionNote, refundAmount } = req.body;

  const report = dbStore.reports.find((r) => r.id === id);
  if (!report) {
    res.status(404).json({ success: false, message: 'Report not found' });
    return;
  }

  report.status = status;
  if (resolutionNote) {
    (report as any).resolutionNote = resolutionNote;
  }

  // If refund requested, credit customer wallet
  const refundNum = Number(refundAmount) || 0;
  if (refundNum > 0) {
    const customer = dbStore.users.find((u) => u.id === report.userId || u.name === report.userName) ||
      dbStore.users.find((u) => u.role === 'driver');
    if (customer) {
      customer.walletBalance = (customer.walletBalance || 0) + refundNum;
    }
  }

  // Notify Customer (Driver)
  const customerId = report.userId || 'usr_driver_1';
  const refundText = refundNum > 0 ? ` ₹${refundNum} has been credited to your wallet.` : '';
  const noteText = resolutionNote ? ` Note: "${resolutionNote}".` : '';

  dbStore.notifications.unshift({
    id: `notif_${Date.now()}`,
    userId: customerId,
    type: refundNum > 0 ? ('refund' as const) : ('general' as const),
    title: `Dispute Case ${status}: ${report.parkingTitle}`,
    message: `Your dispute ticket regarding "${report.parkingTitle}" was marked as ${status} by Platform Admin.${refundText}${noteText}`,
    dateGroup: 'Today',
    read: false,
    createdAt: new Date().toISOString(),
  });

  // Notify Space Owner (Host)
  dbStore.notifications.unshift({
    id: `notif_${Date.now() + 1}`,
    userId: 'usr_owner_1',
    type: 'general',
    title: `Dispute Notice: ${report.parkingTitle}`,
    message: `The incident ticket regarding "${report.parkingTitle}" was marked as ${status} by Platform Admin.${noteText}`,
    dateGroup: 'Today',
    read: false,
    createdAt: new Date().toISOString(),
  });

  res.json({
    success: true,
    message: `Dispute ticket status updated to ${status}`,
    data: report,
  });
};

export const resetUserKey = (req: Request, res: Response): void => {
  const { id } = req.params;
  const { tempKey, reason } = req.body;

  const user = dbStore.users.find((u) => u.id === id);
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  const generatedKey = tempKey || `PS-SEC-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  (user as any).temporaryKey = generatedKey;

  // Add high-priority security alert notification to user's account
  dbStore.notifications.unshift({
    id: `notif_${Date.now()}`,
    userId: user.id,
    type: 'general',
    title: 'Security Alert: Access Key Reset by Admin',
    message: `Your account credentials were reset by Super Admin (${reason || 'Administrative Security Rotation'}). Temporary Key: ${generatedKey}. Use this key to log in or verify credentials.`,
    dateGroup: 'Today',
    read: false,
    createdAt: new Date().toISOString(),
  });

  res.json({
    success: true,
    message: `Access key reset dispatched for ${user.name}`,
    temporaryKey: generatedKey,
    user: { ...user, temporaryKey: generatedKey },
  });
};

export const updateAdminUser = (req: Request, res: Response): void => {
  const { id } = req.params;
  const { name, role, phone, walletBalance, status, adminNote } = req.body;

  const user = dbStore.users.find((u) => u.id === id);
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  const oldBalance = user.walletBalance || 0;
  if (name) user.name = name;
  if (role) user.role = role as any;
  if (phone) user.phone = phone;
  if (typeof walletBalance === 'number') user.walletBalance = walletBalance;
  if (status) (user as any).status = status;

  const diff = typeof walletBalance === 'number' ? walletBalance - oldBalance : 0;
  const balanceMsg = diff !== 0 ? ` Wallet ${diff > 0 ? `credited with ₹${diff}` : `adjusted by ₹${diff}`} (New balance: ₹${user.walletBalance}).` : '';

  // Add notification to target user's account
  dbStore.notifications.unshift({
    id: `notif_${Date.now()}`,
    userId: user.id,
    type: diff > 0 ? ('refund' as const) : ('general' as const),
    title: 'Profile Permissions & Account Updated',
    message: `Administrator updated your account profile. Status: ${status || 'Active'}.${balanceMsg} ${adminNote ? `Admin note: ${adminNote}` : ''}`,
    dateGroup: 'Today',
    read: false,
    createdAt: new Date().toISOString(),
  });

  res.json({
    success: true,
    message: `Account settings updated for ${user.name}`,
    data: user,
  });
};

export const deleteAdminUser = (req: Request, res: Response): void => {
  const { id } = req.params;
  const index = dbStore.users.findIndex((u) => u.id === id);
  if (index === -1) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  const deletedUser = dbStore.users[index];
  dbStore.users.splice(index, 1);

  // Also clear any unread notifications for this user
  dbStore.notifications = dbStore.notifications.filter((n) => n.userId !== id);

  res.json({
    success: true,
    message: `Account for ${deletedUser.name} has been permanently deleted`,
    deletedId: id,
  });
};
