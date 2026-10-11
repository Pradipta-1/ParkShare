import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbStore } from '../store/dbStore.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { MessageItem, NotificationItem } from '../models/types.js';

// GET /api/messages/conversations - Multi-customer conversation list (real-time only)
export const getConversations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user || dbStore.users[0];
  if (!user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }
  const isOwner = user.role === 'owner';

  // Ensure latest sync from MongoDB so deleted messages are immediately gone
  if (dbStore.isMongoConnected) {
    await dbStore.syncCollection('messages');
  }

  // Find all messages involving this user
  const userMessages = dbStore.messages.filter(
    (m) => m.senderId === user.id || m.receiverId === user.id
  );

  const conversationMap = new Map<string, any>();

  for (const m of userMessages) {
    const convKey = (m as any).conversationId || m.bookingId || 'chat';
    if (!conversationMap.has(convKey)) {
      const otherId = m.senderId === user.id ? m.receiverId : m.senderId;
      const otherUserObj = dbStore.users.find((u) => u.id === otherId);
      const booking = dbStore.bookings.find(
        (b) => b.id === m.bookingId || b.id === (m as any).conversationId || b.bookingCode === m.bookingId
      );

      const otherUser = {
        id: otherId,
        name: otherUserObj?.name || (m.senderId === user.id ? (isOwner ? 'Driver Customer' : 'Parking Host') : m.senderName),
        role: otherUserObj?.role || (isOwner ? 'driver' : 'owner'),
        phone: otherUserObj?.phone || (booking as any)?.userPhone || '+91 98301 23456',
        avatar: otherUserObj?.avatar || (isOwner ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'),
      };

      const allMsgsForConv = dbStore.messages.filter(
        (msg) =>
          (msg as any).conversationId === convKey ||
          msg.bookingId === convKey ||
          (booking && (msg.bookingId === booking.id || (msg as any).conversationId === booking.id))
      );

      const unreadCount = allMsgsForConv.filter(
        (msg) => msg.receiverId === user.id && !msg.isRead && !(msg as any).read
      ).length;

      const lastMsg = allMsgsForConv[allMsgsForConv.length - 1] || m;

      conversationMap.set(convKey, {
        id: convKey,
        bookingId: booking?.id || m.bookingId || convKey,
        bookingCode: booking?.bookingCode || 'INQUIRY',
        parkingTitle: booking?.parkingTitle || 'Reserved Parking Bay',
        parkingAddress: booking?.parkingAddress || 'Kolkata',
        spotNumber: booking?.spotNumber || 'P-Bay',
        status: booking?.bookingStatus || 'active',
        otherUser,
        lastMessage: {
          text: lastMsg.text || (lastMsg as any).messageText || '',
          timestamp: lastMsg.timestamp || 'Recent',
          senderId: lastMsg.senderId,
          senderName: lastMsg.senderName,
          isMe: lastMsg.senderId === user.id,
        },
        unreadCount,
        updatedAt: (lastMsg as any)?.createdAt || new Date().toISOString(),
      });
    }
  }

  const list = Array.from(conversationMap.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  res.json({
    success: true,
    count: list.length,
    data: list,
  });
};

// GET /api/messages/:bookingId - Get messages for specific conversation/booking & mark as read
export const getMessagesByBooking = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { bookingId } = req.params;
  const user = req.user || dbStore.users[0];

  // Ensure latest sync from MongoDB so deleted messages are immediately gone
  if (dbStore.isMongoConnected) {
    await dbStore.syncCollection('messages');
  }

  // Match booking or conversation
  let booking = dbStore.bookings.find(
    (b) => b.id === bookingId || b.bookingCode === bookingId || `conv_${b.id}` === bookingId
  );

  if (!booking && (bookingId === 'latest' || !bookingId)) {
    booking = dbStore.bookings.find((b) => b.userId === user?.id) || dbStore.bookings[0];
  }

  const messages = dbStore.messages.filter(
    (m) =>
      m.bookingId === bookingId ||
      (m as any).conversationId === bookingId ||
      (booking && (m.bookingId === booking.id || m.bookingId === booking.bookingCode || (m as any).conversationId === booking.id))
  );

  // Mark all unread messages delivered to this user as read
  for (const m of messages) {
    if (m.receiverId === user.id && (!m.isRead || !(m as any).read)) {
      m.isRead = true;
      (m as any).read = true;
      dbStore.saveMessage(m);
    }
  }

  // Mark corresponding notifications for this conversation as read
  dbStore.notifications
    .filter(
      (n) =>
        n.userId === user.id &&
        ((n as any).conversationId === bookingId ||
          (n as any).link?.includes(bookingId) ||
          (booking && (n as any).link?.includes(booking.id)))
    )
    .forEach((n) => {
      n.read = true;
      (n as any).isRead = true;
      dbStore.saveNotification(n);
    });

  const owner = booking ? dbStore.users.find((u) => u.id === booking.ownerId) : null;
  const driver = booking ? dbStore.users.find((u) => u.id === booking.userId) : null;

  const bookingContext = booking
    ? {
        bookingId: booking.id,
        bookingCode: booking.bookingCode,
        parkingTitle: booking.parkingTitle,
        parkingAddress: booking.parkingAddress,
        date: booking.date,
        arrivalTime: booking.arrivalTime,
        departureTime: booking.departureTime,
        spotNumber: booking.spotNumber,
        driverName: driver?.name || booking.userName || 'Driver Customer',
        driverId: booking.userId,
        ownerId: booking.ownerId || 'usr_owner_1',
        ownerName: owner?.name || (booking as any).ownerName || 'Vikramaditya Roy',
      }
    : null;

  res.json({
    success: true,
    bookingContext,
    data: messages,
  });
};

// POST /api/messages - Send message & deliver real-time unread notification in MongoDB
export const sendMessage = (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user || dbStore.users[0];
  if (!user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const { bookingId, text, messageText, receiverId, conversationId } = req.body;
  const content = (text || messageText || '').trim();
  if (!content) {
    res.status(400).json({ success: false, message: 'Message text is required' });
    return;
  }

  const effectiveBookingId = bookingId || conversationId || 'inquiry_chat';
  const effectiveConvId = conversationId || bookingId || 'inquiry_chat';

  // Determine receiver using booking context if not explicitly provided
  const booking = dbStore.bookings.find(
    (b) => b.id === effectiveBookingId || b.id === effectiveConvId || b.bookingCode === effectiveBookingId
  );
  let targetReceiver = receiverId;
  if (!targetReceiver || targetReceiver === user.id) {
    if (user.role === 'owner') {
      targetReceiver = booking?.userId || 'usr_driver_1';
    } else {
      targetReceiver = booking?.ownerId || 'usr_owner_1';
    }
  }

  const now = new Date();
  const timestamp = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const newMessage: MessageItem = {
    id: `msg_${uuidv4().substring(0, 8)}`,
    bookingId: effectiveBookingId,
    conversationId: effectiveConvId,
    senderId: user.id,
    senderName: user.name,
    senderRole: user.role,
    receiverId: targetReceiver,
    text: content,
    messageText: content,
    timestamp,
    isRead: false,
    createdAt: now.toISOString(),
  } as any;

  // 1. Save message directly into MongoDB Atlas & dbStore
  dbStore.saveMessage(newMessage);

  // 2. Deliver unread notification for recipient in MongoDB Atlas & dbStore
  const newNotif: NotificationItem = {
    id: `notif_${uuidv4().substring(0, 8)}`,
    userId: targetReceiver,
    type: 'message' as any,
    title: `New message from ${user.name}`,
    message: content.length > 80 ? `${content.substring(0, 80)}...` : content,
    dateGroup: 'Today',
    read: false,
    createdAt: now.toISOString(),
  };
  (newNotif as any).isRead = false;
  (newNotif as any).conversationId = effectiveConvId;
  (newNotif as any).link = `/messages?bookingId=${effectiveConvId}`;

  dbStore.saveNotification(newNotif);

  res.status(201).json({
    success: true,
    data: newMessage,
    notification: newNotif,
  });
};
