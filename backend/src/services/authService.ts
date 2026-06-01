import bcrypt from 'bcryptjs';
import prisma from '../config/db';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { Role } from '@prisma/client';
import { AppError } from '../utils/errors';

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export class AuthService {
  static async register(data: { email: string; password: string; role?: Role }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new AppError('Email already in use', 409, 'USER_EXISTS');

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: { email: data.email, password: hashedPassword, role: data.role ?? Role.MEMBER },
    });

    const { accessToken, refreshToken } = await this.issueTokens(user);
    return { user: { id: user.id, email: user.email, role: user.role }, accessToken, refreshToken };
  }

  static async login(data: { email: string; password: string }) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');

    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');

    // Rotate: delete all previous refresh tokens for this user
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
    const { accessToken, refreshToken } = await this.issueTokens(user);
    return { user: { id: user.id, email: user.email, role: user.role }, accessToken, refreshToken };
  }

  static async refresh(token: string) {
    const stored = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new AppError('Refresh token invalid or expired', 401, 'INVALID_REFRESH_TOKEN');
    }

    // Verify the JWT signature as an extra security layer
    try {
      verifyRefreshToken(token);
    } catch {
      await prisma.refreshToken.delete({ where: { token } });
      throw new AppError('Refresh token invalid or expired', 401, 'INVALID_REFRESH_TOKEN');
    }

    const accessToken = generateAccessToken({
      id: stored.user.id,
      email: stored.user.email,
      role: stored.user.role,
    });

    return { accessToken };
  }

  static async logout(token: string) {
    await prisma.refreshToken.deleteMany({ where: { token } });
  }

  private static async issueTokens(user: { id: string; email: string; role: Role }) {
    const accessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role });
    const refreshToken = generateRefreshToken({ id: user.id });

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
    });

    return { accessToken, refreshToken };
  }
}
