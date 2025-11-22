import { Router } from 'express';
import { followUser, unfollowUser, getFollowStatus, getFollowers, getFollowing } from '../controllers/follow.js';
import { authenticateToken } from '../middleware/auth.js';
import { asyncHandler, handleError } from '../middleware/handlingError.js';

const router = Router();

// All follow routes require authentication
router.use(authenticateToken);

// Routes with error handling
router.post('/:id/follow', asyncHandler(followUser));
router.delete('/:id/unfollow', asyncHandler(unfollowUser));
router.get('/:id/status', asyncHandler(getFollowStatus));
router.get('/:id/followers', asyncHandler(getFollowers));
router.get('/:id/following', asyncHandler(getFollowing));

// Use error handling middleware
router.use(handleError);

export default router;
