import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbStore } from '../store/dbStore.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { Booking, NotificationItem } from '../models/types.js';

export const createBooking = (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const {
    parkingId,
    date,
    arrivalTime,
    departureTime,
    durationHours = 3,
    vehicle,
    paymentMethod = 'UPI',
  } = req.body;

  const parking = dbStore.parkingSpaces.find((p) => p.id === parkingId);
  if (!parking) {
    res.status(404).json({ success: false, message: 'Parking space not found' });
    return;
  }

  const hours = Number(durationHours) || 3;
  const subtotal = parking.pricePerHour * hours;
  const serviceFee = 10;
  const totalAmount = subtotal + serviceFee;
  const bookingCode = `PS-${Math.floor(100000 + Math.random() * 900000)}`;
  const spotNumber = `P-${Math.floor(10 + Math.random() * 89)}`;

  const newBooking: Booking = {
    id: `book_${uuidv4().substring(0, 8)}`,
    bookingCode,
    parkingId: parking.id,
    parkingTitle: parking.title,
    parkingAddress: parking.address,
    parkingImage: parking.images[0] || 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&auto=format&fit=crop&q=80',
    parkingLocation: parking.location,
    userId: user.id,
    userName: user.name,
    userPhone: user.phone || '+91 98301 23456',
    ownerId: parking.ownerId,
    vehicle: vehicle || {
      numberPlate: 'WB 01 AB 1234',
      brand: 'Honda',
      model: 'City ZX',
      color: 'Obsidian Black',
      type: 'Car',
    },
    date: date || new Date().toISOString().split('T')[0],
    arrivalTime: arrivalTime || '02:00 PM',
    departureTime: departureTime || '05:00 PM',
    durationHours: hours,
    pricePerHour: parking.pricePerHour,
    subtotal,
    serviceFee,
    totalAmount,
    paymentStatus: 'paid',
    bookingStatus: 'confirmed',
    paymentMethod,
    transactionId: `TXN-${Math.floor(100000000 + Math.random() * 900000000)}`,
    qrCodeData: `PARKSHARE::${bookingCode}::USER_${user.id}::SPOT_${spotNumber}`,
    spotNumber,
    createdAt: new Date().toISOString(),
  };

  dbStore.bookings.unshift(newBooking);

  // Update space available spots upon reservation
  if (parking.availableSpots > 0) {
    parking.availableSpots = Math.max(0, parking.availableSpots - 1);
  }
  if (parking.availableSpots === 0) {
    parking.status = 'allotted';
  }
  const maxSpots = parking.totalSpots || 1;
  parking.occupancyPercent = Math.min(100, Math.round(((maxSpots - parking.availableSpots) / maxSpots) * 100));

  // Send notification to user
  const userNotif: NotificationItem = {
    id: `notif_${uuidv4().substring(0, 8)}`,
    userId: user.id,
    type: 'booking_confirmed',
    title: 'Booking Confirmed!',
    message: `Your spot ${spotNumber} at ${parking.title} is reserved for ${newBooking.date} at ${newBooking.arrivalTime}.`,
    dateGroup: 'Today',
    read: false,
    createdAt: new Date().toISOString(),
  };
  dbStore.notifications.unshift(userNotif);

  // Send notification to owner
  const ownerNotif: NotificationItem = {
    id: `notif_${uuidv4().substring(0, 8)}`,
    userId: parking.ownerId,
    type: 'booking_confirmed',
    title: 'New Reservation Received',
    message: `${user.name} booked a space at ${parking.title} for ${newBooking.date}.`,
    dateGroup: 'Today',
    read: false,
    createdAt: new Date().toISOString(),
  };
  dbStore.notifications.unshift(ownerNotif);

  res.status(201).json({
    success: true,
    message: 'Booking created successfully',
    data: newBooking,
  });
};

export const getBookings = (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const { status, asOwner } = req.query;

  let bookings = [...dbStore.bookings];

  if (asOwner === 'true' || user.role === 'owner') {
    bookings = bookings.filter((b) => b.ownerId === user.id);
  } else if (user.role === 'driver') {
    bookings = bookings.filter((b) => b.userId === user.id);
  }

  if (status && typeof status === 'string' && status !== 'all') {
    bookings = bookings.filter((b) => b.bookingStatus === status);
  }

  res.json({
    success: true,
    count: bookings.length,
    data: bookings,
  });
};

export const getBookingById = (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const booking = dbStore.bookings.find((b) => b.id === id || b.bookingCode === id);

  if (!booking) {
    res.status(404).json({ success: false, message: 'Booking not found' });
    return;
  }

  res.json({
    success: true,
    data: booking,
  });
};

export const cancelBooking = (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  let booking = dbStore.bookings.find((b) => b.id === id || b.bookingCode === id);

  // If a demo pass or active booking reference was passed
  if (!booking && (id === 'demo_live_pass_01' || id.startsWith('demo_'))) {
    booking = dbStore.bookings.find((b) => b.id === 'book_active_1') || dbStore.bookings[0];
  }

  if (!booking) {
    // If not found, ensure any companion allotted space is released
    const fallbackSpace = dbStore.parkingSpaces.find((p) => p.id === 'park_allotted_1');
    if (fallbackSpace) {
      fallbackSpace.status = 'active';
      fallbackSpace.availableSpots = Math.max(1, fallbackSpace.availableSpots || fallbackSpace.totalSpots || 4);
      fallbackSpace.occupancyPercent = 0;
    }
    res.json({
      success: true,
      message: 'Booking cancelled and parking allotment released',
      data: { id, bookingStatus: 'cancelled', parkingId: 'park_allotted_1' },
    });
    return;
  }

  booking.bookingStatus = 'cancelled';
  booking.paymentStatus = 'refunded';

  // Refund credit to user's wallet
  const user = dbStore.users.find((u) => u.id === booking.userId);
  if (user) {
    user.walletBalance = (user.walletBalance || 0) + booking.totalAmount;
  }

  // Restore the parking space allotment and spots immediately
  const parking = dbStore.parkingSpaces.find((p) => p.id === booking.parkingId);
  if (parking) {
    const total = parking.totalSpots || 1;
    parking.availableSpots = Math.min(total, (parking.availableSpots || 0) + 1);
    if (parking.status === 'allotted' || parking.availableSpots > 0) {
      parking.status = 'active';
    }
    parking.occupancyPercent = Math.max(0, Math.round(((total - parking.availableSpots) / total) * 100));
  }

  // If this was the allotted Park Street bay or active booking, ensure park_allotted_1 is freed
  if (booking.parkingId === 'park_allotted_1' || booking.id === 'book_active_1' || id === 'demo_live_pass_01') {
    const allotted1 = dbStore.parkingSpaces.find((p) => p.id === 'park_allotted_1');
    if (allotted1) {
      allotted1.status = 'active';
      allotted1.availableSpots = Math.max(1, allotted1.availableSpots || allotted1.totalSpots || 4);
      allotted1.occupancyPercent = 0;
    }
  }

  // Add refund notification
  dbStore.notifications.unshift({
    id: `notif_${uuidv4().substring(0, 8)}`,
    userId: booking.userId,
    type: 'refund',
    title: 'Refund Processed',
    message: `₹${booking.totalAmount} has been credited to your wallet for cancelled booking ${booking.bookingCode}. Parking allotment has been freed.`,
    dateGroup: 'Today',
    read: false,
    createdAt: new Date().toISOString(),
  });

  res.json({
    success: true,
    message: 'Booking cancelled and parking allotment released',
    data: booking,
  });
};

export const checkInBooking = (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const booking = dbStore.bookings.find((b) => b.id === id || b.bookingCode === id);

  if (!booking) {
    res.status(404).json({ success: false, message: 'Booking not found' });
    return;
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  booking.bookingStatus = 'active';
  booking.checkInTime = timeStr;

  res.json({
    success: true,
    message: 'Check-in successful! Welcome to your parking spot.',
    data: {
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      spotNumber: booking.spotNumber,
      checkInTime: timeStr,
      status: 'active',
      parkingTitle: booking.parkingTitle,
    },
  });
};

export const checkOutBooking = (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const booking = dbStore.bookings.find((b) => b.id === id || b.bookingCode === id);

  if (!booking) {
    res.status(404).json({ success: false, message: 'Booking not found' });
    return;
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  booking.bookingStatus = 'completed';
  booking.checkOutTime = timeStr;

  // Restore the parking spot once vehicle checks out
  const parking = dbStore.parkingSpaces.find((p) => p.id === booking.parkingId);
  if (parking) {
    const total = parking.totalSpots || 1;
    parking.availableSpots = Math.min(total, (parking.availableSpots || 0) + 1);
    if (parking.status === 'allotted' || parking.availableSpots > 0) {
      parking.status = 'active';
    }
    parking.occupancyPercent = Math.max(0, Math.round(((total - parking.availableSpots) / total) * 100));
  }

  res.json({
    success: true,
    message: 'Check-out completed! Safe travels.',
    data: {
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      spotNumber: booking.spotNumber,
      checkInTime: booking.checkInTime || '02:00 PM',
      checkOutTime: timeStr,
      durationText: `${booking.durationHours} hours`,
      finalAmount: booking.totalAmount,
      status: 'completed',
    },
  });
};
