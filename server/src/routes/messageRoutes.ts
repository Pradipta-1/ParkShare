import { Router } from 'express';
import { getConversations, getMessagesByBooking, sendMessage } from '../controllers/messageController.js';
import { optionalAuthenticate } from '../middleware/authMiddleware.js';

const router = Router();

// Conversations list endpoint must come before :bookingId param
router.get('/conversations', optionalAuthenticate, getConversations);
router.get('/:bookingId', optionalAuthenticate, getMessagesByBooking);
router.post('/', optionalAuthenticate, sendMessage);

export default router;
