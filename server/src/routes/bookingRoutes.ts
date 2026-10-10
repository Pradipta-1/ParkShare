import { Router } from 'express';
import {
  createBooking,
  getBookings,
  getBookingById,
  cancelBooking,
  checkInBooking,
  checkOutBooking,
} from '../controllers/bookingController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/', authenticate, createBooking);
router.get('/', authenticate, getBookings);
router.get('/:id', authenticate, getBookingById);
router.put('/:id/cancel', authenticate, cancelBooking);
router.post('/:id/checkin', authenticate, checkInBooking);
router.post('/:id/checkout', authenticate, checkOutBooking);

export default router;
