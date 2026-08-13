import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-to-a-random-secret-in-production-2024';

export interface AuthRequest extends Request {
  userId?: string;
  username?: string;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: '未授权访问' });
  }

  const token = authHeader.split(' ')[1];

  if (!token || token.length > 1000) {
    return res.status(401).json({ success: false, error: 'Token 无效或已过期' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = (decoded as { userId: string }).userId;
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Token 无效或已过期' });
  }
};

export const optionalAuth = (req: AuthRequest, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (token && token.length <= 1000) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = (decoded as { userId: string }).userId;
      } catch {}
    }
  }

  next();
};

export { JWT_SECRET };
