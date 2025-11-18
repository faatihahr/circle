import type { Request, Response, NextFunction } from 'express';

// Define error interface to include custom status
interface CustomError extends Error {
  status?: number;
}

// Async handler wrapper to catch async errors
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// Error handling middleware
export const handleError = (err: CustomError, req: Request, res: Response, next: NextFunction): void => {
  // Default to 500 if no status is set
  const statusCode = err.status || 500;
  // Default message for server errors
  const message = statusCode >= 500 ? 'Internal server error' : err.message;

  console.error(err); // Log the error for debugging

  res.status(statusCode).json({
    success: false,
    message: message,
    // Include stack trace in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
