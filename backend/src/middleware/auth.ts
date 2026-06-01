import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { Role } from '@prisma/client';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 401,
      code: 'UNAUTHORIZED',
      message: 'Authentication token is missing',
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyAccessToken(token) as any;
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({
      status: 401,
      code: 'UNAUTHORIZED',
      message: 'Invalid or expired token',
    });
  }
};

export const authorize = (roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }

    // Role hierarchy logic: ADMIN > MANAGER > MEMBER
    // But here we explicitly check if the role is in the allowed list
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 403,
        code: 'FORBIDDEN',
        message: 'Insufficient permissions',
      });
    }

    next();
  };
};
