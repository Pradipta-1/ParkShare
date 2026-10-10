import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbStore } from '../store/dbStore.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { MessageItem, NotificationItem } from '../models/types.js';

export const getMessagesByBooking = (req: AuthenticatedRequest, res: Response): void => {
  const { bookingId } = req.params;
  const user = req.user;
  let booking = dbStore.bookings.find((b) => b.id === bookingId || b.bookingCode === bookingId);
  if (!booking && user) {
    booking = dbStore.bookings.find((b) => b.userId === user.id || b.ownerId === user.id) || dbStore.bookings[0];
  }

  const messages = dbStore.messages.filter(
    (m) =>
      m.bookingId === bookingId ||
      (m as any).conversationId === bookingId ||
      (booking && (m.bookingId === booking.id || m.bookingId === booking.bookingCode || (m as any).conversationId === booking.id))
  );

  const owner = booking ? dbStore.users.find((u) => u.id === booking.ownerId) : null;

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
          ownerName: owner?.name || 'Vikramaditya Roy',
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

  const { bookingId, text, messageText, receiverId, conversationId } = req.body;
  const content = text || messageText;
  if (!content || !bookingId) {
    res.status(400).json({ success: false, message: 'Message text and bookingId are required' });
    return;
  }

  const now = new Date();
  const timestamp = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const booking = dbStore.bookings.find((b) => b.id === bookingId || b.bookingCode === bookingId);
  const targetReceiver =
    receiverId ||
    (booking
      ? user.role === 'driver'
        ? booking.ownerId
        : booking.userId
      : user.role === 'driver'
      ? 'usr_owner_1'
      : 'usr_driver_1');

  const newMessage: MessageItem = {
    id: `msg_${uuidv4().substring(0, 8)}`,
    bookingId: booking ? booking.id : bookingId,
    conversationId: conversationId || (booking ? booking.id : bookingId),
    senderId: user.id,
    senderName: user.name,
    senderRole: user.role,
    receiverId: targetReceiver,
    text: content,
    messageText: content,
    timestamp,
    isRead: false,
  } as any;

  dbStore.saveMessage(newMessage);

  // Dispatch real-time notification to receiver and persist
  const newNotif: NotificationItem = {
    id: `notif_${uuidv4().substring(0, 8)}`,
    userId: targetReceiver,
    type: 'general',
    title: `New message from ${user.name}`,
    message: content.length > 70 ? `${content.substring(0, 70)}...` : content,
    dateGroup: 'Today',
    read: false,
    createdAt: new Date().toISOString(),
  };

  dbStore.saveNotification(newNotif);

  res.status(201).json({
    success: true,
    data: newMessage,
  });
};
