import { Router } from 'express';
import { getMessagesByBooking, sendMessage } from '../controllers/messageController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/:bookingId', authenticate, getMessagesByBooking);
router.post('/', authenticate, sendMessage);

export default router;
