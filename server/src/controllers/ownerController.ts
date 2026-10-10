import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbStore } from '../store/dbStore.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { PayoutItem } from '../models/types.js';

const reconcileSpaces = () => {
  for (const space of dbStore.parkingSpaces) {
    const activeBookings = dbStore.bookings.filter(
      (b) => b.parkingId === space.id && (b.bookingStatus === 'active' || b.bookingStatus === 'confirmed')
    );
    const occupied = activeBookings.length;
    const total = space.totalSpots || 1;
    space.availableSpots = Math.max(0, total - occupied);
    space.occupancyPercent = Math.min(100, Math.round((occupied / total) * 100));
    if (space.availableSpots > 0 && space.status === 'allotted') {
      space.status = 'active';
    } else if (space.availableSpots === 0 && space.status === 'active') {
      space.status = 'allotted';
    }
  }
};

export const getOwnerMetrics = (req: AuthenticatedRequest, res: Response): void => {
  reconcileSpaces();
  const user = req.user;
  const ownerId = (user && user.role === 'owner') ? user.id : 'usr_owner_1';

  const mySpaces = dbStore.parkingSpaces.filter(
    (p) => p.ownerId === ownerId || p.ownerId === 'usr_owner_1' || !p.ownerId
  );
  const myBookings = dbStore.bookings.filter(
    (b) =>
      b.ownerId === ownerId ||
      b.ownerId === 'usr_owner_1' ||
      !b.ownerId ||
      mySpaces.some((s) => s.id === b.parkingId)
  );
  const validBookings = myBookings.filter((b) => b.bookingStatus !== 'cancelled');
  const myPayouts = dbStore.payouts.filter((p) => p.ownerId === ownerId || p.ownerId === 'usr_owner_1');

  const totalEarnings = validBookings.reduce((sum, b) => sum + (b.subtotal || b.totalAmount || 0), 0);
  const todayStr = new Date().toISOString().split('T')[0];
  const todayEarnings = validBookings
    .filter((b) => b.date === todayStr)
    .reduce((sum, b) => sum + (b.subtotal || b.totalAmount || 0), 0);

  const activeBookings = validBookings.filter(
    (b) => b.bookingStatus === 'active' || b.bookingStatus === 'confirmed'
  );
  const activeBookingsCount = activeBookings.length;

  const avgOccupancy = mySpaces.length > 0
    ? Math.round(mySpaces.reduce((acc, curr) => acc + (curr.occupancyPercent || 0), 0) / mySpaces.length)
    : 0;

  const avgRating = mySpaces.length > 0
    ? Number((mySpaces.reduce((acc, curr) => acc + (curr.rating || 5), 0) / mySpaces.length).toFixed(1))
    : 5.0;

  const paidOut = myPayouts
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const explicitPending = myPayouts
    .filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingPayout = explicitPending > 0 ? explicitPending : Math.max(0, totalEarnings - paidOut);

  // Dynamic revenue chart by day of the week computed from active & completed bookings
  const dayMap: Record<string, { revenue: number; bookings: number }> = {
    Mon: { revenue: 0, bookings: 0 },
    Tue: { revenue: 0, bookings: 0 },
    Wed: { revenue: 0, bookings: 0 },
    Thu: { revenue: 0, bookings: 0 },
    Fri: { revenue: 0, bookings: 0 },
    Sat: { revenue: 0, bookings: 0 },
    Sun: { revenue: 0, bookings: 0 },
  };
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  validBookings.forEach((b) => {
    const d = new Date(b.date);
    const dayName = !isNaN(d.getTime()) ? dayNames[d.getDay()] : 'Mon';
    if (dayMap[dayName]) {
      dayMap[dayName].revenue += b.subtotal || b.totalAmount || 0;
      dayMap[dayName].bookings += 1;
    }
  });

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const earningsChart = days.map((day) => ({
    day,
    revenue: dayMap[day].revenue,
    bookings: dayMap[day].bookings,
  }));

  // Helper to parse time strings like "09:00 AM", "14:30", "2:00 PM" into 24-hr integer
  const parseTimeToHour = (timeStr?: string): number => {
    if (!timeStr) return 12;
    const match = timeStr.match(/(\d+)(?::\d+)?\s*(AM|PM)?/i);
    if (!match) return 12;
    let h = parseInt(match[1], 10);
    const period = match[2]?.toUpperCase();
    if (period === 'PM' && h < 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return h;
  };

  // Real hourly occupancy profile based on actual active/confirmed booking times
  const totalOwnerSpots = Math.max(1, mySpaces.reduce((sum, s) => sum + (s.totalSpots || 1), 0));
  const hourSlots = [
    { time: '08 AM', hour: 8 },
    { time: '10 AM', hour: 10 },
    { time: '12 PM', hour: 12 },
    { time: '02 PM', hour: 14 },
    { time: '04 PM', hour: 16 },
    { time: '06 PM', hour: 18 },
    { time: '08 PM', hour: 20 },
    { time: '10 PM', hour: 22 },
  ];

  const occupancyChart = hourSlots.map(({ time, hour }) => {
    const occupiedCount = activeBookings.filter((b) => {
      const arr = parseTimeToHour(b.arrivalTime);
      const dep = b.departureTime ? parseTimeToHour(b.departureTime) : arr + (b.durationHours || 3);
      const safeDep = dep <= arr ? arr + 3 : dep;
      return hour >= arr && hour < safeDep;
    }).length;

    const occupancy = Math.min(100, Math.round((occupiedCount / totalOwnerSpots) * 100));
    return {
      time,
      occupancy: activeBookings.length > 0 ? occupancy : 0,
      occupiedSpots: occupiedCount,
    };
  });

  // Dynamic trailing 5 months earnings growth
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const trailingMonths: { month: string; year: number; monthIdx: number }[] = [];
  for (let i = 4; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    trailingMonths.push({
      month: monthNames[d.getMonth()],
      year: d.getFullYear(),
      monthIdx: d.getMonth(),
    });
  }

  const monthlyGrowth = trailingMonths.map(({ month, year, monthIdx }) => {
    const list = validBookings.filter((b) => {
      const d = new Date(b.date);
      if (isNaN(d.getTime())) return false;
      return d.getMonth() === monthIdx && d.getFullYear() === year;
    });
    return {
      month,
      amount: list.reduce((sum, b) => sum + (b.subtotal || b.totalAmount || 0), 0),
      bookings: list.length,
    };
  });

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
      monthlyGrowth,
      recentBookings: validBookings.slice(0, 5),
    },
  });
};

export const getOwnerSpaces = (req: AuthenticatedRequest, res: Response): void => {
  reconcileSpaces();
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

  const mySpaces = dbStore.parkingSpaces.filter(
    (p) => p.ownerId === ownerId || p.ownerId === 'usr_owner_1' || !p.ownerId
  );
  const myBookings = dbStore.bookings.filter(
    (b) =>
      b.ownerId === ownerId ||
      b.ownerId === 'usr_owner_1' ||
      !b.ownerId ||
      mySpaces.some((s) => s.id === b.parkingId)
  );
  const payouts = dbStore.payouts.filter((p) => p.ownerId === ownerId || p.ownerId === 'usr_owner_1');
  const validBookings = myBookings.filter((b) => b.bookingStatus !== 'cancelled');
  const totalEarnings = validBookings.reduce((sum, b) => sum + (b.subtotal || b.totalAmount || 0), 0);
  const paidOut = payouts.filter((p) => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
  const explicitPending = payouts.filter((p) => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
  const pendingPayout = explicitPending > 0 ? explicitPending : Math.max(0, totalEarnings - paidOut);

  // Dynamic trailing 5 months earnings growth for payout overview
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const trailingMonths: { month: string; year: number; monthIdx: number }[] = [];
  for (let i = 4; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    trailingMonths.push({
      month: monthNames[d.getMonth()],
      year: d.getFullYear(),
      monthIdx: d.getMonth(),
    });
  }

  const monthlyGrowth = trailingMonths.map(({ month, year, monthIdx }) => {
    const list = validBookings.filter((b) => {
      const d = new Date(b.date);
      if (isNaN(d.getTime())) return false;
      return d.getMonth() === monthIdx && d.getFullYear() === year;
    });
    return {
      month,
      amount: list.reduce((sum, b) => sum + (b.subtotal || b.totalAmount || 0), 0),
      bookings: list.length,
    };
  });

  const thisMonthData = monthlyGrowth[monthlyGrowth.length - 1];

  res.json({
    success: true,
    data: payouts,
    summary: {
      totalEarnings,
      thisMonth: thisMonthData ? thisMonthData.amount : totalEarnings,
      pendingPayout,
      paidOut,
      monthlyGrowth,
    },
  });
};

export const requestPayout = (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user;
  const ownerId = (user && user.role === 'owner') ? user.id : 'usr_owner_1';
  const { amount = 2100, paymentMethod = 'UPI', accountDetails = 'UPI: 9874054321@okaxis' } = req.body;

  const now = new Date().toISOString();
  const newPayout: PayoutItem = {
    id: `pay_${uuidv4().substring(0, 8)}`,
    ownerId,
    amount: Number(amount),
    status: 'pending',
    method: `${paymentMethod} - ${accountDetails}`,
    date: now.split('T')[0],
  };
  (newPayout as any).paymentMethod = paymentMethod;
  (newPayout as any).accountDetails = accountDetails;
  (newPayout as any).processedAt = now;

  dbStore.savePayout(newPayout);

  res.status(201).json({
    success: true,
    message: 'Payout request initiated successfully',
    data: newPayout,
  });
};
