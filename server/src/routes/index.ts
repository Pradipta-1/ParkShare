import { Router } from 'express';
import authRoutes from './authRoutes.js';
import parkingRoutes from './parkingRoutes.js';
import bookingRoutes from './bookingRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import reviewRoutes from './reviewRoutes.js';
import favoriteRoutes from './favoriteRoutes.js';
import vehicleRoutes from './vehicleRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import messageRoutes from './messageRoutes.js';
import ownerRoutes from './ownerRoutes.js';
import adminRoutes from './adminRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/parking', parkingRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/reviews', reviewRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/notifications', notificationRoutes);
router.use('/messages', messageRoutes);
router.use('/owner', ownerRoutes);
router.use('/admin', adminRoutes);

// Health check endpoint
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'ParkShare REST API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

export default router;
