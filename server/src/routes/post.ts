import { Router } from 'express';
import multer from 'multer';
import {
  createPost,
  getAllPosts,
  getPostById,
  getPostsByUserId,
  updatePost,
  deletePost
} from '../controllers/post.js';
import { toggleLike } from '../controllers/like.js';
import { authenticateToken } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { asyncHandler, handleError } from '../middleware/handlingError.js';

const router = Router();

// All post routes require authentication
router.use(authenticateToken);

// Routes with error handling
router.post('/create', upload.single('image'), asyncHandler(createPost));
router.post('/:id/like', asyncHandler(toggleLike));
router.get('/', rateLimit, asyncHandler(getAllPosts));
router.get('/user/:id', asyncHandler(getPostsByUserId));
router.get('/:id', asyncHandler(getPostById));
router.put('/:id', upload.single('image'), asyncHandler(updatePost));
router.delete('/:id', asyncHandler(deletePost));

// Use error handling middleware
router.use(handleError);

export default router;
