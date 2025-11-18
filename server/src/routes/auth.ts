import { Router } from 'express';
import { register, login, logout, forgotPassword, resetPassword } from '../controllers/auth.js';
import { authenticateToken } from '../middleware/auth.js';
import { asyncHandler, handleError } from '../middleware/handlingError.js';

const router = Router();

// Public auth routes with error handling
router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.post('/logout', authenticateToken, asyncHandler(logout)); 
router.put('/forgot-password', asyncHandler(forgotPassword));
router.put('/reset-password', asyncHandler(resetPassword));

// Use error handling middleware
router.use(handleError);

export default router;
