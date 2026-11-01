import { Router } from 'express';
import {
  changePassword,
  login,
  logout,
  me,
  refresh,
  register,
  requestPasswordReset,
  resetPassword,
  updateAccount,
} from '../controllers/auth.controller.js';
import { removeUserAvatar, uploadUserAvatar } from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.js';
import { authLimiter, avatarUploadLimiter, passwordResetLimiter, refreshLimiter } from '../middleware/rateLimiter.js';
import { uploadAvatarFile } from '../middleware/avatarUpload.js';
import { validate } from '../middleware/validate.js';
import {
  accountUpdateSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from '../validators/index.js';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/forgot-password', passwordResetLimiter, validate(forgotPasswordSchema), requestPasswordReset);
router.post('/reset-password', passwordResetLimiter, validate(resetPasswordSchema), resetPassword);
router.post('/refresh', refreshLimiter, refresh);
router.post('/logout', logout);
router.get('/me', protect, me);
router.post('/avatar', protect, avatarUploadLimiter, uploadAvatarFile, uploadUserAvatar);
router.delete('/avatar', protect, removeUserAvatar);
router.patch('/account', protect, validate(accountUpdateSchema), updateAccount);
router.patch('/password', protect, validate(changePasswordSchema), changePassword);

export default router;
