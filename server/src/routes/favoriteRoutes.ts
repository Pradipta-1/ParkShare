import { Router } from 'express';
import { getFavorites, toggleFavorite } from '../controllers/favoriteController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', authenticate, getFavorites);
router.post('/', authenticate, toggleFavorite);

export default router;
