import type { Request, Response, NextFunction } from 'express';

// CORS middleware for allowing specific origins
export const corsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const allowedOrigins = [
    'http://localhost:3000', // React dev server
    'http://localhost:5173', // Vite dev server
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'https://yourdomain.com', 
  ];

  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin || '')) {
    res.header('Access-Control-Allow-Origin', origin);
  }

  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-auth-token');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
};
