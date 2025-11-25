import { Router } from 'express';
import { followUser, unfollowUser, getFollowStatus, getFollowers, getFollowing } from '../controllers/follow.js';
import { authenticateToken } from '../middleware/auth.js';
import { asyncHandler, handleError } from '../middleware/handlingError.js';

const router = Router();

// All follow routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /api/follow/{id}/follow:
 *   post:
 *     summary: Follow a user
 *     tags: [Follow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID to follow
 *     responses:
 *       201:
 *         description: User followed successfully
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
 *                   example: "User followed successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Follow'
 *       400:
 *         description: Invalid user ID, trying to follow yourself, or already following
 *       401:
 *         description: Unauthorized - authentication required
 *       404:
 *         description: User not found
 */
router.post('/:id/follow', asyncHandler(followUser));

/**
 * @swagger
 * /api/follow/{id}/unfollow:
 *   delete:
 *     summary: Unfollow a user
 *     tags: [Follow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID to unfollow
 *     responses:
 *       200:
 *         description: User unfollowed successfully
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
 *                   example: "User unfollowed successfully"
 *                 data:
 *                   type: string
 *                   nullable: true
 *                   example: null
 *       400:
 *         description: Invalid user ID or not following this user
 *       401:
 *         description: Unauthorized - authentication required
 */
router.delete('/:id/unfollow', asyncHandler(unfollowUser));

/**
 * @swagger
 * /api/follow/{id}/status:
 *   get:
 *     summary: Get follow status between current user and specified user
 *     tags: [Follow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID to check follow status with
 *     responses:
 *       200:
 *         description: Follow status retrieved successfully
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
 *                   example: "Follow status retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     isFollowing:
 *                       type: boolean
 *                       description: Whether current user follows the specified user
 *                       example: true
 *       400:
 *         description: Invalid or missing user ID
 *       401:
 *         description: Unauthorized - authentication required
 */
router.get('/:id/status', asyncHandler(getFollowStatus));

/**
 * @swagger
 * /api/follow/{id}/followers:
 *   get:
 *     summary: Get all followers of a user
 *     tags: [Follow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID whose followers to retrieve
 *     responses:
 *       200:
 *         description: Followers retrieved successfully
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
 *                   example: "Followers retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserBasic'
 *       400:
 *         description: Invalid user ID
 *       401:
 *         description: Unauthorized - authentication required
 *       404:
 *         description: User not found
 */
router.get('/:id/followers', asyncHandler(getFollowers));

/**
 * @swagger
 * /api/follow/{id}/following:
 *   get:
 *     summary: Get all users that a specified user is following
 *     tags: [Follow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID whose following list to retrieve
 *     responses:
 *       200:
 *         description: Following list retrieved successfully
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
 *                   example: "Following retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserBasic'
 *       400:
 *         description: Invalid user ID
 *       401:
 *         description: Unauthorized - authentication required
 *       404:
 *         description: User not found
 */
router.get('/:id/following', asyncHandler(getFollowing));

// Use error handling middleware
router.use(handleError);

export default router;

// import { Router } from 'express';
// import { followUser, unfollowUser, getFollowStatus, getFollowers, getFollowing } from '../controllers/follow.js';
// import { authenticateToken } from '../middleware/auth.js';
// import { asyncHandler, handleError } from '../middleware/handlingError.js';

// const router = Router();

// // All follow routes require authentication
// router.use(authenticateToken);

// // Routes with error handling
// router.post('/:id/follow', asyncHandler(followUser));
// router.delete('/:id/unfollow', asyncHandler(unfollowUser));
// router.get('/:id/status', asyncHandler(getFollowStatus));
// router.get('/:id/followers', asyncHandler(getFollowers));
// router.get('/:id/following', asyncHandler(getFollowing));

// // Use error handling middleware
// router.use(handleError);

// export default router;
