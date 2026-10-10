import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbStore } from '../store/dbStore.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { PayoutItem } from '../models/types.js';

export const getOwnerMetrics = (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user;
  const ownerId = (user && user.role === 'owner') ? user.id : 'usr_owner_1';

  const mySpaces = dbStore.parkingSpaces.filter((p) => p.ownerId === ownerId);
  const myBookings = dbStore.bookings.filter((b) => b.ownerId === ownerId);
  const myPayouts = dbStore.payouts.filter((p) => p.ownerId === ownerId);

  const totalEarnings = myBookings.reduce((sum, b) => sum + (b.subtotal || b.totalAmount || 0), 0);
  const todayStr = new Date().toISOString().split('T')[0];
  const todayEarnings = myBookings
    .filter((b) => b.date === todayStr)
    .reduce((sum, b) => sum + (b.subtotal || b.totalAmount || 0), 0);

  const activeBookingsCount = myBookings.filter(
    (b) => b.bookingStatus === 'active' || b.bookingStatus === 'confirmed'
  ).length;

  const avgOccupancy = mySpaces.length > 0
    ? Math.round(mySpaces.reduce((acc, curr) => acc + (curr.occupancyPercent || 0), 0) / mySpaces.length)
    : 0;

  const avgRating = mySpaces.length > 0
    ? Number((mySpaces.reduce((acc, curr) => acc + (curr.rating || 5), 0) / mySpaces.length).toFixed(1))
    : 5.0;

  const pendingPayout = myPayouts
    .filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  const paidOut = myPayouts
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  // Dynamic revenue chart by day of the week
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const earningsChart = days.map((day) => ({
    day,
    revenue: 0,
    bookings: 0,
  }));

  // Occupancy heatmap by hour
  const hours = ['08 AM', '10 AM', '12 PM', '02 PM', '04 PM', '06 PM', '08 PM', '10 PM'];
  const occupancyChart = hours.map((time) => ({
    time,
    occupancy: avgOccupancy,
  }));

  res.json({
    success: true,
    data: {
      metrics: {
        todayEarnings,
        thisMonthEarnings: totalEarnings,
        totalEarnings,
        pendingPayout,
        paidOut,
        activeBookings: activeBookingsCount,
        occupancy: avgOccupancy,
        rating: avgRating,
        totalSpaces: mySpaces.length,
      },
      earningsChart,
      occupancyChart,
      recentBookings: myBookings.slice(0, 5),
    },
  });
};

export const getOwnerSpaces = (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user;
  const ownerId = (user && user.role === 'owner') ? user.id : 'usr_owner_1';

  const spaces = dbStore.parkingSpaces.filter((p) => p.ownerId === ownerId);
  res.json({
    success: true,
    count: spaces.length,
    data: spaces,
  });
};

export const toggleSpaceStatus = (req: AuthenticatedRequest, res: Response): void => {
  const { spaceId } = req.params;
  const space = dbStore.parkingSpaces.find((p) => p.id === spaceId);

  if (!space) {
    res.status(404).json({ success: false, message: 'Parking space not found' });
    return;
  }

  space.status = space.status === 'active' ? 'paused' : 'active';
  res.json({
    success: true,
    message: `Parking space is now ${space.status}`,
    data: space,
  });
};

export const updateCalendar = (req: AuthenticatedRequest, res: Response): void => {
  const { spaceId } = req.params;
  const { blockedDates, pricingCalendar } = req.body;

  const space = dbStore.parkingSpaces.find((p) => p.id === spaceId);
  if (!space) {
    res.status(404).json({ success: false, message: 'Parking space not found' });
    return;
  }

  if (blockedDates) space.blockedDates = blockedDates;
  if (pricingCalendar) space.pricingCalendar = pricingCalendar;

  res.json({
    success: true,
    message: 'Availability and pricing calendar updated',
    data: space,
  });
};

export const getOwnerPayouts = (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user;
  const ownerId = (user && user.role === 'owner') ? user.id : 'usr_owner_1';

  const payouts = dbStore.payouts.filter((p) => p.ownerId === ownerId);
  const myBookings = dbStore.bookings.filter((b) => b.ownerId === ownerId);
  const totalEarnings = myBookings.reduce((sum, b) => sum + (b.subtotal || b.totalAmount || 0), 0);
  const pendingPayout = payouts.filter((p) => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
  const paidOut = payouts.filter((p) => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);

  res.json({
    success: true,
    data: payouts,
    summary: {
      totalEarnings,
      thisMonth: totalEarnings,
      pendingPayout,
      paidOut,
    },
  });
};

export const requestPayout = (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user;
  const ownerId = (user && user.role === 'owner') ? user.id : 'usr_owner_1';
  const { amount = 2100 } = req.body;

  const newPayout: PayoutItem = {
    id: `pay_${uuidv4().substring(0, 8)}`,
    ownerId,
    amount: Number(amount),
    status: 'pending',
    method: 'HDFC Bank (NEFT) ****4921',
    date: new Date().toISOString().split('T')[0],
  };

  dbStore.payouts.unshift(newPayout);

  res.status(201).json({
    success: true,
    message: 'Payout request initiated successfully',
    data: newPayout,
  });
};
