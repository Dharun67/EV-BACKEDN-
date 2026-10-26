import { Router } from 'express';
import { register, login, getMe } from '../controllers/authController';
import { authLimiter } from '../middleware/rateLimiter';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Used when a new user registers on frontend
router.post('/register', authLimiter, register);

// Used when user logs in with email/password
router.post('/login', authLimiter, login);

// Used when frontend needs the DB profile for the logged in user
router.get('/me', authenticate, getMe);

export default router;
