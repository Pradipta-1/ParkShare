import { Response } from 'express';
import { dbStore } from '../store/dbStore.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

export const getNotifications = (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user || dbStore.users[0];
  if (!user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const notifs = dbStore.notifications.filter(
    (n) =>
      n.userId === user.id ||
      (user.role === 'owner' && n.userId === 'usr_owner_1') ||
      (user.role === 'driver' && n.userId === 'usr_driver_1') ||
      (user.role === 'admin' && n.userId === 'usr_admin_1')
  );

  const normalized = notifs.map((n) => {
    const isAlreadyRead = Boolean(n.read || (n as any).isRead);
    return {
      ...n,
      read: isAlreadyRead,
      isRead: isAlreadyRead,
      dateGroup: n.dateGroup || 'Today',
    };
  });

  // Sort latest first
  normalized.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const unreadCount = normalized.filter((n) => !n.read).length;

  res.json({
    success: true,
    unreadCount,
    data: normalized,
  });
};

export const markAsRead = (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const notif = dbStore.notifications.find((n) => n.id === id);

  if (notif) {
    notif.read = true;
    (notif as any).isRead = true;
    dbStore.saveNotification(notif);
  }

  res.json({ success: true, message: 'Notification marked as read' });
};

export const markAllAsRead = (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user || dbStore.users[0];
  if (!user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  dbStore.notifications
    .filter(
      (n) =>
        n.userId === user.id ||
        (user.role === 'owner' && n.userId === 'usr_owner_1') ||
        (user.role === 'driver' && n.userId === 'usr_driver_1') ||
        (user.role === 'admin' && n.userId === 'usr_admin_1')
    )
    .forEach((n) => {
      n.read = true;
      (n as any).isRead = true;
      dbStore.saveNotification(n);
    });

  res.json({ success: true, message: 'All notifications marked as read' });
};

export const deleteNotification = (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  dbStore.deleteNotification(id);
  res.json({ success: true, message: 'Notification deleted successfully' });
};

export const clearAllNotifications = (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user || dbStore.users[0];
  if (!user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }
  const userIds = [user.id];
  if (user.role === 'owner') userIds.push('usr_owner_1');
  if (user.role === 'driver') userIds.push('usr_driver_1');
  if (user.role === 'admin') userIds.push('usr_admin_1');
  dbStore.clearNotificationsForUser(userIds);
  res.json({ success: true, message: 'All notifications cleared successfully' });
};

