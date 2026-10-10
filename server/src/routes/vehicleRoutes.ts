import { Router } from 'express';
import { getVehicles, addVehicle, deleteVehicle } from '../controllers/vehicleController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', authenticate, getVehicles);
router.post('/', authenticate, addVehicle);
router.delete('/:id', authenticate, deleteVehicle);

export default router;
