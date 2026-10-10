import { Response } from 'express';
import { dbStore } from '../store/dbStore.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

export const getNotifications = (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const notifs = dbStore.notifications.filter((n) => n.userId === user.id);
  const unreadCount = notifs.filter((n) => !n.read && !(n as any).isRead).length;

  res.json({
    success: true,
    unreadCount,
    data: notifs,
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
  const user = req.user;
  if (!user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  dbStore.notifications
    .filter((n) => n.userId === user.id)
    .forEach((n) => {
      n.read = true;
      (n as any).isRead = true;
      dbStore.saveNotification(n);
    });

  res.json({ success: true, message: 'All notifications marked as read' });
};
