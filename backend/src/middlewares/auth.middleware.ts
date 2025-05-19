import { Request, Response, NextFunction } from 'express';
const jwt = require('jsonwebtoken');
import { JWT_SECRET } from '../config/env';

// Struktur token payload
interface JwtPayload {
  id: number;
  username: string;
}

// Extend Request agar ada `user`
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

// Middleware fungsi (⚠️ tanpa RequestHandler, karena kita pakai AuthRequest custom)
export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: Token missing' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err) {
    console.error('JWT verification failed:', err);
    return res.status(401).json({ message: 'Invalid token' });
  }
};
