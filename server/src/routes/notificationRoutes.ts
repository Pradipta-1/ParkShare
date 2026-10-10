import { Router } from 'express';
import { getNotifications, markAsRead, markAllAsRead, deleteNotification, clearAllNotifications } from '../controllers/notificationController.js';
import { optionalAuthenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', optionalAuthenticate, getNotifications);
router.put('/read-all', optionalAuthenticate, markAllAsRead);
router.put('/:id/read', optionalAuthenticate, markAsRead);
router.delete('/:id', optionalAuthenticate, deleteNotification);
router.delete('/', optionalAuthenticate, clearAllNotifications);

export default router;
