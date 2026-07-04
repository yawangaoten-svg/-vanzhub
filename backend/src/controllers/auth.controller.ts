import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';

const authService = new AuthService();

export class AuthController {
  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await authService.register(req.body);
      res.status(201).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await authService.logout(req.user!.userId);
      res.status(200).json({ status: 'success', message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  };

  getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await authService.getMe(req.user!.userId);
      res.status(200).json({ status: 'success', data: user });
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  };

  verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token } = req.body;
      await authService.verifyEmail(token);
      res.status(200).json({ status: 'success', message: 'Email verified successfully' });
    } catch (error) {
      next(error);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body;
      await authService.forgotPassword(email);
      res.status(200).json({ status: 'success', message: 'Password reset email sent if account exists' });
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token, password } = req.body;
      await authService.resetPassword(token, password);
      res.status(200).json({ status: 'success', message: 'Password reset successfully' });
    } catch (error) {
      next(error);
    }
  };

  enableTwoFactor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await authService.enableTwoFactor(req.user!.userId);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  };

  verifyTwoFactor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token } = req.body;
      await authService.verifyTwoFactor(req.user!.userId, token);
      res.status(200).json({ status: 'success', message: 'Two-factor authentication enabled' });
    } catch (error) {
      next(error);
    }
  };

  disableTwoFactor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await authService.disableTwoFactor(req.user!.userId);
      res.status(200).json({ status: 'success', message: 'Two-factor authentication disabled' });
    } catch (error) {
      next(error);
    }
  };
}
