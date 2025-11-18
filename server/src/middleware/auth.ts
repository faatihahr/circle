import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        username: string;
      };
    }
  }
}

// Middleware to authenticate JWT token
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  let token: string | undefined;

  // Check Authorization header first
  const authHeader = req.header('Authorization');
  token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : undefined;

  // If no token in header, check cookies
  if (!token) {
    token = req.cookies?.token;
  }

  // Also check x-auth-token header for compatibility
  if (!token) {
    token = req.header('x-auth-token');
  }

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as { userId: string; username: string };
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

// Middleware for requiring authentication (authorization)
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  next();
};
