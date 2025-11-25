import { Router } from 'express';
import { searchUsers, searchPosts, searchAll } from '../controllers/search.js';
import { authenticateToken } from '../middleware/auth.js';
import { asyncHandler, handleError } from '../middleware/handlingError.js';

const router = Router();

// All search routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /api/search/users:
 *   get:
 *     summary: Search for users by username or name
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *         description: Search query for username or display name (case insensitive)
 *     responses:
 *       200:
 *         description: Users search completed successfully
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
 *                   example: "Search users successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/UserBasic'
 *                           - type: object
 *                             properties:
 *                               bio:
 *                                 type: string
 *                                 nullable: true
 *                                 description: User biography
 *                               followersCount:
 *                                 type: integer
 *                                 description: Number of followers
 *                               followingCount:
 *                                 type: integer
 *                                 description: Number of users being followed
 *                     total:
 *                       type: integer
 *                       description: Total number of matching users
 *                       example: 5
 *       400:
 *         description: Search query is required or invalid
 *       401:
 *         description: Unauthorized - authentication required
 */
router.get('/users', asyncHandler(searchUsers));

/**
 * @swagger
 * /api/search/posts:
 *   get:
 *     summary: Search for posts by content
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *         description: Search query for post content (case insensitive)
 *     responses:
 *       200:
 *         description: Posts search completed successfully
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
 *                   example: "Search posts successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     threads:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/PostSummary'
 *                     total:
 *                       type: integer
 *                       description: Total number of matching posts
 *                       example: 12
 *       400:
 *         description: Search query is required or invalid
 *       401:
 *         description: Unauthorized - authentication required
 */
router.get('/posts', asyncHandler(searchPosts));

/**
 * @swagger
 * /api/search/all:
 *   get:
 *     summary: Search for both users and posts simultaneously
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *         description: Search query that will be applied to both users (username/name) and posts (content)
 *     responses:
 *       200:
 *         description: Combined search completed successfully
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
 *                   example: "Search all successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - type: object
 *                             properties:
 *                               type:
 *                                 type: string
 *                                 example: "user"
 *                           - $ref: '#/components/schemas/UserBasic'
 *                           - type: object
 *                             properties:
 *                               bio:
 *                                 type: string
 *                                 nullable: true
 *                               followersCount:
 *                                 type: integer
 *                               followingCount:
 *                                 type: integer
 *                     threads:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - type: object
 *                             properties:
 *                               type:
 *                                 type: string
 *                                 example: "post"
 *                           - $ref: '#/components/schemas/PostSummary'
 *                     totalUsers:
 *                       type: integer
 *                       description: Total number of matching users
 *                     totalThreads:
 *                       type: integer
 *                       description: Total number of matching posts
 *       400:
 *         description: Search query is required or invalid
 *       401:
 *         description: Unauthorized - authentication required
 */
router.get('/all', asyncHandler(searchAll));

// Use error handling middleware
router.use(handleError);

export default router;

// import { Router } from 'express';
// import { searchUsers, searchPosts, searchAll } from '../controllers/search.js';
// import { authenticateToken } from '../middleware/auth.js';
// import { asyncHandler, handleError } from '../middleware/handlingError.js';

// const router = Router();

// // All search routes require authentication
// router.use(authenticateToken);

// // Search routes with error handling
// router.get('/users', asyncHandler(searchUsers));
// router.get('/posts', asyncHandler(searchPosts));
// router.get('/all', asyncHandler(searchAll));

// // Use error handling middleware
// router.use(handleError);

// export default router;
