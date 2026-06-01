import prisma from '../config/db';
import { Role } from '@prisma/client';
import { AppError } from '../utils/errors';

export class UserService {
  static async getUsers(filter?: { role?: Role }) {
    const where = filter?.role ? { role: filter.role } : {};
    return prisma.user.findMany({
      where,
      select: { id: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  static async updateUserRole(id: string, role: Role) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
    return prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, email: true, role: true },
    });
  }

  static async deleteUser(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
    await prisma.user.delete({ where: { id } });
  }
}
