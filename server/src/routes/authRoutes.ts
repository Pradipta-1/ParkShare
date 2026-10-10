import { Router } from 'express';
import { register, login, demoLogin, getMe, updateProfile } from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/demo', demoLogin);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);

export default router;
