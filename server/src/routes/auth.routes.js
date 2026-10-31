import { Router } from 'express';
import { login, logout, me, refresh, register } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.js';
import { authLimiter, refreshLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, registerSchema } from '../validators/index.js';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/refresh', refreshLimiter, refresh);
router.post('/logout', logout);
router.get('/me', protect, me);

export default router;
