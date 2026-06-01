import { Response } from 'express';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { UserService } from '../services/userService';
import { AuthRequest } from '../middleware/auth';

const roleSchema = z.object({
  role: z.enum(['ADMIN', 'MANAGER', 'MEMBER']),
});

export class UserController {
  static async list(req: AuthRequest, res: Response) {
    const users = await UserService.getUsers();
    res.json({ users });
  }

  static async updateRole(req: AuthRequest, res: Response) {
    const { role } = roleSchema.parse(req.body);
    const user = await UserService.updateUserRole(req.params['id'] as string, role as Role);
    res.json(user);
  }

  static async remove(req: AuthRequest, res: Response) {
    await UserService.deleteUser(req.params['id'] as string);
    res.status(204).send();
  }
}
