import { Router } from 'express';
import { register, login, logout, forgotPassword, resetPassword, getProfile, getProfileById, updateProfile, uploadImage, getUsers } from '../controllers/auth.js';
import { authenticateToken } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { asyncHandler, handleError } from '../middleware/handlingError.js';

const router = Router();

// Public auth routes with error handling
router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.post('/logout', authenticateToken, asyncHandler(logout));
router.post('/upload', authenticateToken, upload.single('image'), asyncHandler(uploadImage));
router.get('/profile', authenticateToken, asyncHandler(getProfile));
router.get('/profile/:id', asyncHandler(getProfileById));
router.get('/users', authenticateToken, asyncHandler(getUsers));
router.put('/profile', authenticateToken, asyncHandler(updateProfile));
router.put('/forgot-password', asyncHandler(forgotPassword));
router.put('/reset-password', asyncHandler(resetPassword));
router.put('/reset-password', asyncHandler(resetPassword));

// Use error handling mirouter.use(handleError);

export default router;
