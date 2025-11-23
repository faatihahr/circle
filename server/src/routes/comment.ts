import { Router } from 'express';
import multer from 'multer';
import {
  createComment,
  getCommentsByThread,
  getCommentById,
  updateComment,
  deleteComment,
  toggleCommentLike
} from '../controllers/comment.js';
import { authenticateToken } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { asyncHandler, handleError } from '../middleware/handlingError.js';

const router = Router();

// All comment routes require authentication
router.use(authenticateToken);

// Routes with error handling
router.post('/create', upload.single('image'), asyncHandler(createComment));
router.get('/threads/:threadId', asyncHandler(getCommentsByThread));
router.get('/:id', asyncHandler(getCommentById));
router.put('/:id', upload.single('image'), asyncHandler(updateComment));
router.delete('/:id', asyncHandler(deleteComment));
router.post('/:commentId/like', asyncHandler(toggleCommentLike));

// Use error handling middleware
router.use(handleError);

export default router;
