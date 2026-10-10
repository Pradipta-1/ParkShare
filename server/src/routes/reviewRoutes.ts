import { Router } from 'express';
import { getReviewsByParkingId, addReview, respondToReview } from '../controllers/reviewController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/:parkingId', getReviewsByParkingId);
router.post('/', authenticate, addReview);
router.post('/:id/respond', authenticate, respondToReview);

export default router;
