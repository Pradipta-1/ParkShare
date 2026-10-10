import { Router } from 'express';
import {
  getAdminMetrics,
  getAdminUsers,
  getAdminParking,
  getAdminBookings,
  getVerificationRequests,
  approveVerification,
  rejectVerification,
  getReports,
  updateReportStatus,
  resetUserKey,
  updateAdminUser,
  deleteAdminUser,
} from '../controllers/adminController.js';
import { optionalAuthenticate } from '../middleware/authMiddleware.js';

const router = Router();

// Allow admin or demo viewing & operations
router.get('/metrics', optionalAuthenticate, getAdminMetrics);
router.get('/users', optionalAuthenticate, getAdminUsers);
router.post('/users/:id/reset-key', optionalAuthenticate, resetUserKey);
router.put('/users/:id', optionalAuthenticate, updateAdminUser);
router.delete('/users/:id', optionalAuthenticate, deleteAdminUser);
router.get('/parking', optionalAuthenticate, getAdminParking);
router.get('/bookings', optionalAuthenticate, getAdminBookings);
router.get('/verification', optionalAuthenticate, getVerificationRequests);
router.post('/verification/:id/approve', optionalAuthenticate, approveVerification);
router.post('/verification/:id/reject', optionalAuthenticate, rejectVerification);
router.get('/reports', optionalAuthenticate, getReports);
router.put('/reports/:id/status', optionalAuthenticate, updateReportStatus);

export default router;
