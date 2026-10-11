import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import {
  registerRules,
  loginRules,
  changePasswordRules,
  forgotPasswordRules,
  resetPasswordRules,
} from '../validators/authValidators.js';

const router = Router();

router.post('/register', authLimiter, registerRules, validate, authController.register);
router.post('/login', authLimiter, loginRules, validate, authController.login);
router.post('/logout', authController.logout);
router.post('/forgot-password', authLimiter, forgotPasswordRules, validate, authController.forgotPassword);
router.patch('/reset-password/:token', authLimiter, resetPasswordRules, validate, authController.resetPassword);

router.get('/me', protect, authController.getMe);
router.patch('/me', protect, authController.updateMe);
router.patch('/change-password', protect, changePasswordRules, validate, authController.changePassword);

export default router;
