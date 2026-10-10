import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbStore } from '../store/dbStore.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { MessageItem } from '../models/types.js';

export const getMessagesByBooking = (req: AuthenticatedRequest, res: Response): void => {
  const { bookingId } = req.params;
  const booking = dbStore.bookings.find((b) => b.id === bookingId || b.bookingCode === bookingId);

  const messages = dbStore.messages.filter((m) => m.bookingId === bookingId || (booking && m.bookingId === booking.id));

  res.json({
    success: true,
    bookingContext: booking
      ? {
          bookingId: booking.id,
          bookingCode: booking.bookingCode,
          parkingTitle: booking.parkingTitle,
          date: booking.date,
          arrivalTime: booking.arrivalTime,
          departureTime: booking.departureTime,
          spotNumber: booking.spotNumber,
          driverName: booking.userName,
          ownerId: booking.ownerId,
        }
      : null,
    data: messages,
  });
};

export const sendMessage = (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const { bookingId, text, receiverId } = req.body;
  if (!text || !bookingId) {
    res.status(400).json({ success: false, message: 'Message text and bookingId are required' });
    return;
  }

  const now = new Date();
  const timestamp = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const newMessage: MessageItem = {
    id: `msg_${uuidv4().substring(0, 8)}`,
    bookingId,
    senderId: user.id,
    senderName: user.name,
    senderRole: user.role,
    receiverId: receiverId || 'usr_owner_1',
    text,
    timestamp,
  };

  dbStore.messages.push(newMessage);

  res.status(201).json({
    success: true,
    data: newMessage,
  });
};
