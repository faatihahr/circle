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

/**
 * @swagger
 * /api/comments/create:
 *   post:
 *     summary: Create a new comment on a post or reply to a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *               - threadId
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 description: Comment text content
 *               threadId:
 *                 type: integer
 *                 description: ID of the post/thread to comment on
 *               parentId:
 *                 type: integer
 *                 description: Optional ID of parent comment for nested replies
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Optional image file to attach to comment
 *     responses:
 *       201:
 *         description: Comment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 201
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "Comment created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Validation error or invalid thread ID
 *       401:
 *         description: Unauthorized - authentication required
 *       404:
 *         description: Thread not found
 */
router.post('/create', upload.single('image'), asyncHandler(createComment));

/**
 * @swagger
 * /api/comments/threads/{threadId}:
 *   get:
 *     summary: Get all comments for a specific post/thread (with nested replies)
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: threadId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Post/thread ID to get comments for
 *     responses:
 *       200:
 *         description: Comments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "Get comments successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     comments:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/CommentWithNestedReplies'
 *                     count:
 *                       type: integer
 *                       description: Number of top-level comments
 *       400:
 *         description: Invalid thread ID
 *       401:
 *         description: Unauthorized - authentication required
 *       404:
 *         description: Thread not found
 */
router.get('/threads/:threadId', asyncHandler(getCommentsByThread));

/**
 * @swagger
 * /api/comments/{id}:
 *   get:
 *     summary: Get a specific comment by ID
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Comment ID to retrieve
 *     responses:
 *       200:
 *         description: Comment retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "Get comment successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Invalid comment ID
 *       401:
 *         description: Unauthorized - authentication required
 *       404:
 *         description: Comment not found
 */
router.get('/:id', asyncHandler(getCommentById));

/**
 * @swagger
 * /api/comments/{id}:
 *   put:
 *     summary: Update a comment (only by comment owner)
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Comment ID to update
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: Updated comment content
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: New image file to replace existing one (optional)
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "Comment updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Invalid comment ID or validation error
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - only comment owner can update
 *       404:
 *         description: Comment not found
 */
router.put('/:id', upload.single('image'), asyncHandler(updateComment));

/**
 * @swagger
 * /api/comments/{id}:
 *   delete:
 *     summary: Delete a comment (only by comment owner)
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Comment ID to delete
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "Comment deleted successfully"
 *       400:
 *         description: Invalid comment ID
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - only comment owner can delete
 *       404:
 *         description: Comment not found
 */
router.delete('/:id', asyncHandler(deleteComment));

/**
 * @swagger
 * /api/comments/{commentId}/like:
 *   post:
 *     summary: Toggle like/unlike on a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Comment ID to like/unlike
 *     responses:
 *       200:
 *         description: Comment like toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "Comment liked successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     commentId:
 *                       type: integer
 *                       description: Comment ID that was liked
 *                     isLiked:
 *                       type: boolean
 *                       description: Whether the comment is liked after toggle
 *                     likesCount:
 *                       type: integer
 *                       description: Total number of likes after toggle
 *       400:
 *         description: Invalid comment ID
 *       401:
 *         description: Unauthorized - authentication required
 *       404:
 *         description: Comment not found
 */
router.post('/:commentId/like', asyncHandler(toggleCommentLike));

// Use error handling middleware
router.use(handleError);

export default router;

// import { Router } from 'express';
// import multer from 'multer';
// import {
//   createComment,
//   getCommentsByThread,
//   getCommentById,
//   updateComment,
//   deleteComment,
//   toggleCommentLike
// } from '../controllers/comment.js';
// import { authenticateToken } from '../middleware/auth.js';
// import { upload } from '../middleware/upload.js';
// import { asyncHandler, handleError } from '../middleware/handlingError.js';

// const router = Router();

// // All comment routes require authentication
// router.use(authenticateToken);

// // Routes with error handling
// router.post('/create', upload.single('image'), asyncHandler(createComment));
// router.get('/threads/:threadId', asyncHandler(getCommentsByThread));
// router.get('/:id', asyncHandler(getCommentById));
// router.put('/:id', upload.single('image'), asyncHandler(updateComment));
// router.delete('/:id', asyncHandler(deleteComment));
// router.post('/:commentId/like', asyncHandler(toggleCommentLike));

// // Use error handling middleware
// router.use(handleError);

// export default router;
