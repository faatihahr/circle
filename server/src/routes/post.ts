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

/**
 * @swagger
 * /api/posts/create:
 *   post:
 *     summary: Create a new post/thread
 *     tags: [Posts]
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
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 description: The text content of the post
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Optional image file to attach to the post
 *     responses:
 *       201:
 *         description: Post created successfully
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
 *                   example: "Thread successfully posted"
 *                 data:
 *                   $ref: '#/components/schemas/Post'
 *       400:
 *         description: Validation error - missing or invalid content
 *       401:
 *         description: Unauthorized - authentication required
 */
router.post('/create', upload.single('image'), asyncHandler(createPost));

/**
 * @swagger
 * /api/posts/{id}/like:
 *   post:
 *     summary: Toggle like/unlike on a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Post ID to like/unlike
 *     responses:
 *       200:
 *         description: Like toggled successfully
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
 *                   example: "Post liked successfully" 
 *                 data:
 *                   type: object
 *                   properties:
 *                     isLiked:
 *                       type: boolean
 *                       description: Whether the post is liked after toggle
 *                     likesCount:
 *                       type: integer
 *                       description: Total number of likes after toggle
 *       400:
 *         description: Invalid post ID
 *       401:
 *         description: Unauthorized - authentication required
 *       404:
 *         description: Post not found
 */
router.post('/:id/like', asyncHandler(toggleLike));

/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: Get all posts with pagination (cursor-based)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: Cursor for pagination (last post ID)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of posts per page
 *     responses:
 *       200:
 *         description: Posts retrieved successfully
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
 *                   example: "Get Paginated Thread Successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     threads:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/PostSummary'
 *                     hasMore:
 *                       type: boolean
 *                       description: Whether there are more posts available
 *                     nextCursor:
 *                       type: integer
 *                       nullable: true
 *                       description: Cursor for next page (null if no more posts)
 *       401:
 *         description: Unauthorized - authentication required
 */
router.get('/', rateLimit, asyncHandler(getAllPosts));

/**
 * @swagger
 * /api/posts/user/{id}:
 *   get:
 *     summary: Get all posts by a specific user
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID whose posts to retrieve
 *     responses:
 *       200:
 *         description: User posts retrieved successfully
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
 *                   example: "Get User Posts Successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     threads:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/PostSummary'
 *       400:
 *         description: Invalid user ID
 *       401:
 *         description: Unauthorized - authentication required
 */
router.get('/user/:id', asyncHandler(getPostsByUserId));

/**
 * @swagger
 * /api/posts/{id}:
 *   get:
 *     summary: Get a specific post by ID (with full details and comments)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Post ID to retrieve
 *     responses:
 *       200:
 *         description: Post retrieved successfully
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
 *                   example: "Get Thread Successfully"
 *                 data:
 *                   $ref: '#/components/schemas/PostDetail'
 *       400:
 *         description: Invalid post ID
 *       401:
 *         description: Unauthorized - authentication required
 *       404:
 *         description: Post not found
 */
router.get('/:id', asyncHandler(getPostById));

/**
 * @swagger
 * /api/posts/{id}:
 *   put:
 *     summary: Update an existing post (only by post owner)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Post ID to update
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: Updated text content (optional)
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: New image file to replace existing one (optional)
 *     responses:
 *       200:
 *         description: Post updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 content:
 *                   type: string
 *                 image:
 *                   type: string
 *                   nullable: true
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                 updated_at:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid post ID or validation error
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - only post owner can update
 *       404:
 *         description: Post not found
 */
router.put('/:id', upload.single('image'), asyncHandler(updatePost));

/**
 * @swagger
 * /api/posts/{id}:
 *   delete:
 *     summary: Delete a post (only by post owner)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Post ID to delete
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Post deleted successfully"
 *       400:
 *         description: Invalid post ID
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - only post owner can delete
 *       404:
 *         description: Post not found
 */
router.delete('/:id', asyncHandler(deletePost));

// Use error handling middleware
router.use(handleError);

export default router;
// import { Router } from 'express';
// import multer from 'multer';
// import {
//   createPost,
//   getAllPosts,
//   getPostById,
//   getPostsByUserId,
//   updatePost,
//   deletePost
// } from '../controllers/post.js';
// import { toggleLike } from '../controllers/like.js';
// import { authenticateToken } from '../middleware/auth.js';
// import { upload } from '../middleware/upload.js';
// import { rateLimit } from '../middleware/rateLimit.js';
// import { asyncHandler, handleError } from '../middleware/handlingError.js';

// const router = Router();

// // All post routes require authentication
// router.use(authenticateToken);

// // Routes with error handling
// router.post('/create', upload.single('image'), asyncHandler(createPost));
// router.post('/:id/like', asyncHandler(toggleLike));
// router.get('/', rateLimit, asyncHandler(getAllPosts));
// router.get('/user/:id', asyncHandler(getPostsByUserId));
// router.get('/:id', asyncHandler(getPostById));
// router.put('/:id', upload.single('image'), asyncHandler(updatePost));
// router.delete('/:id', asyncHandler(deletePost));

// // Use error handling middleware
// router.use(handleError);

// export default router;
