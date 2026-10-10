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

  const totalEarnings = 24860;
  const todayEarnings = 1240;
  const activeBookingsCount = myBookings.filter((b) => b.bookingStatus === 'active' || b.bookingStatus === 'confirmed').length || 8;
  const avgOccupancy = mySpaces.length > 0
    ? Math.round(mySpaces.reduce((acc, curr) => acc + curr.occupancyPercent, 0) / mySpaces.length)
    : 74;
  const avgRating = mySpaces.length > 0
    ? Number((mySpaces.reduce((acc, curr) => acc + curr.rating, 0) / mySpaces.length).toFixed(1))
    : 4.8;

  // Revenue chart by day of the week
  const earningsChart = [
    { day: 'Mon', revenue: 980, bookings: 7 },
    { day: 'Tue', revenue: 1150, bookings: 9 },
    { day: 'Wed', revenue: 1420, bookings: 11 },
    { day: 'Thu', revenue: 1280, bookings: 10 },
    { day: 'Fri', revenue: 1850, bookings: 14 },
    { day: 'Sat', revenue: 2340, bookings: 18 },
    { day: 'Sun', revenue: 2190, bookings: 16 },
  ];

  // Occupancy heatmap by hour
  const occupancyChart = [
    { time: '08 AM', occupancy: 35 },
    { time: '10 AM', occupancy: 78 },
    { time: '12 PM', occupancy: 88 },
    { time: '02 PM', occupancy: 92 },
    { time: '04 PM', occupancy: 85 },
    { time: '06 PM', occupancy: 70 },
    { time: '08 PM', occupancy: 52 },
    { time: '10 PM', occupancy: 28 },
  ];

  res.json({
    success: true,
    data: {
      metrics: {
        todayEarnings,
        thisMonthEarnings: 8420,
        totalEarnings,
        pendingPayout: 2100,
        paidOut: 22760,
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
  res.json({
    success: true,
    data: payouts,
    summary: {
      totalEarnings: 24860,
      thisMonth: 8420,
      pendingPayout: 2100,
      paidOut: 22760,
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
