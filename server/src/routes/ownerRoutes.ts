import { Router } from 'express';
import {
  getOwnerMetrics,
  getOwnerSpaces,
  toggleSpaceStatus,
  updateCalendar,
  getOwnerPayouts,
  requestPayout,
} from '../controllers/ownerController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/metrics', authenticate, getOwnerMetrics);
router.get('/spaces', authenticate, getOwnerSpaces);
router.put('/spaces/:spaceId/status', authenticate, toggleSpaceStatus);
router.put('/calendar/:spaceId', authenticate, updateCalendar);
router.put('/spaces/:spaceId/calendar', authenticate, updateCalendar);
router.get('/payouts', authenticate, getOwnerPayouts);
router.post('/payouts/request', authenticate, requestPayout);

export default router;
