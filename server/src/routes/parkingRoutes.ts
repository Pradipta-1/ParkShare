import { Router } from 'express';
import {
  getParkingList,
  getParkingById,
  createParkingSpace,
  updateParkingSpace,
  deleteParkingSpace,
} from '../controllers/parkingController.js';
import { authenticate, optionalAuthenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', getParkingList);
router.get('/:id', getParkingById);
router.post('/', optionalAuthenticate, createParkingSpace);
router.put('/:id', optionalAuthenticate, updateParkingSpace);
router.delete('/:id', optionalAuthenticate, deleteParkingSpace);

export default router;
