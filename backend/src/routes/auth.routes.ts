import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  twoFactorValidator,
} from '../validators/auth.validator';

const router = Router();
const controller = new AuthController();

router.post('/register', registerValidator, validate, controller.register);
router.post('/login', loginValidator, validate, controller.login);
router.post('/logout', authenticate, controller.logout);
router.get('/me', authenticate, controller.getMe);
router.post('/refresh', controller.refreshToken);
router.post('/verify-email', controller.verifyEmail);
router.post('/forgot-password', forgotPasswordValidator, validate, controller.forgotPassword);
router.post('/reset-password', resetPasswordValidator, validate, controller.resetPassword);
router.post('/enable-2fa', authenticate, controller.enableTwoFactor);
router.post('/verify-2fa', authenticate, twoFactorValidator, validate, controller.verifyTwoFactor);
router.post('/disable-2fa', authenticate, controller.disableTwoFactor);

export default router;
