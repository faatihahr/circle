import { Router } from 'express';
import { searchUsers, searchPosts, searchAll } from '../controllers/search.js';
import { authenticateToken } from '../middleware/auth.js';
import { asyncHandler, handleError } from '../middleware/handlingError.js';

const router = Router();

// All search routes require authentication
router.use(authenticateToken);

// Search routes with error handling
router.get('/users', asyncHandler(searchUsers));
router.get('/posts', asyncHandler(searchPosts));
router.get('/all', asyncHandler(searchAll));

// Use error handling middleware
router.use(handleError);

export default router;
