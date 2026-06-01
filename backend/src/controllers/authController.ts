import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  role: z.enum(['ADMIN', 'MANAGER', 'MEMBER']).optional(),
});

const loginSchema = z.object({
  email: z.email(),
  password: z.string(),
});

export class AuthController {
  static async register(req: Request, res: Response) {
    const validatedData = registerSchema.parse(req.body);
    const result = await AuthService.register(validatedData);
    res.status(201).json(result);
  }

  static async login(req: Request, res: Response) {
    const validatedData = loginSchema.parse(req.body);
    const result = await AuthService.login(validatedData);
    res.json(result);
  }

  static async refresh(req: Request, res: Response) {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ status: 400, code: 'REFRESH_TOKEN_REQUIRED', message: 'Refresh token is required' });
    }
    const result = await AuthService.refresh(refreshToken);
    res.json(result);
  }

  static async logout(req: Request, res: Response) {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ status: 400, code: 'REFRESH_TOKEN_REQUIRED', message: 'Refresh token is required' });
    }
    await AuthService.logout(refreshToken);
    res.status(204).send();
  }
}
