import type { Request, Response, NextFunction } from 'express';

const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const limitPosts = (req: Request, res: Response, next: NextFunction) => {
  (req as any).limit = 25;
  next();
};

export const rateLimit = (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.userId || 'anonymous';
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 10; // 10 requests per minute

  const now = Date.now();
  const userRequests = requestCounts.get(userId);

  if (!userRequests || now > userRequests.resetTime) {
    requestCounts.set(userId, { count: 1, resetTime: now + windowMs });
  } else {
    userRequests.count++;
    if (userRequests.count > maxRequests) {
      res.status(429).json({ error: 'Too many requests' });
      return;
    }
  }

  next();
};
