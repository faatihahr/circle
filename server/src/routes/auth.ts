import { Router } from 'express';
import { register, login, logout, forgotPassword, resetPassword, getProfile, getProfileById, updateProfile, uploadImage, getUsers } from '../controllers/auth.js';
import { authenticateToken } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { asyncHandler, handleError } from '../middleware/handlingError.js';

const router = Router();

/**
 * @swagger
 * /api/user/register:
 *   post:
 *     summary: Register a new user account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *                 pattern: '^[a-zA-Z0-9_]+$'
 *                 description: Unique username (alphanumeric and underscore only)
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Valid email address
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: Password with at least 8 characters, one uppercase letter, and one special character
 *               name:
 *                 type: string
 *                 description: Optional display name
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User registered successfully"
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: User ID
 *                     username:
 *                       type: string
 *                       description: Username
 *                     email:
 *                       type: string
 *                       description: Email address
 *       400:
 *         description: Validation error (invalid input format)
 *       409:
 *         description: Username or email already taken
 */
router.post('/register', asyncHandler(register));

/**
 * @swagger
 * /api/user/login:
 *   post:
 *     summary: Login user and get JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - login
 *               - password
 *             properties:
 *               login:
 *                 type: string
 *                 description: Username or email address
 *               password:
 *                 type: string
 *                 description: User password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Login successful"
 *                 token:
 *                   type: string
 *                   description: JWT token for authentication
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: User ID
 *                     username:
 *                       type: string
 *                       description: Username
 *                     email:
 *                       type: string
 *                       description: Email address
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials (wrong username/email or password)
 */
router.post('/login', asyncHandler(login));

/**
 * @swagger
 * /api/user/logout:
 *   post:
 *     summary: Logout current user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Logout successful"
 *       401:
 *         description: Unauthorized - valid authentication required
 */
router.post('/logout', authenticateToken, asyncHandler(logout));

/**
 * @swagger
 * /api/user/profile:
 *   get:
 *     summary: Get current authenticated user profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: User ID
 *                 username:
 *                   type: string
 *                   description: Username
 *                 email:
 *                   type: string
 *                   description: Email address
 *                 name:
 *                   type: string
 *                   nullable: true
 *                   description: Display name (optional)
 *                 bio:
 *                   type: string
 *                   nullable: true
 *                   description: User biography
 *                 profilePicture:
 *                   type: string
 *                   nullable: true
 *                   description: Profile picture URL
 *                 image_headers:
 *                   type: string
 *                   nullable: true
 *                   description: Image headers metadata
 *                 followersCount:
 *                   type: integer
 *                   description: Number of followers
 *                 followingCount:
 *                   type: integer
 *                   description: Number of users being followed
 *       401:
 *         description: Unauthorized - authentication required
 *       404:
 *         description: User not found
 */
router.get('/profile', authenticateToken, asyncHandler(getProfile));

/**
 * @swagger
 * /api/user/profile/{id}:
 *   get:
 *     summary: Get public profile of a user by ID (no authentication required)
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID to retrieve profile for
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: User ID
 *                 username:
 *                   type: string
 *                   description: Username
 *                 name:
 *                   type: string
 *                   nullable: true
 *                   description: Display name
 *                 bio:
 *                   type: string
 *                   nullable: true
 *                   description: User biography
 *                 profilePicture:
 *                   type: string
 *                   nullable: true
 *                   description: Profile picture URL
 *                 image_headers:
 *                   type: string
 *                   nullable: true
 *                   description: Image headers metadata
 *                 followersCount:
 *                   type: integer
 *                   description: Number of followers
 *                 followingCount:
 *                   type: integer
 *                   description: Number of users being followed
 *       400:
 *         description: Invalid user ID
 *       404:
 *         description: User not found
 */
router.get('/profile/:id', asyncHandler(getProfileById));

/**
 * @swagger
 * /api/user/users:
 *   get:
 *     summary: Get list of users (suggested users excluding current user)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: User ID
 *                       username:
 *                         type: string
 *                         description: Username
 *                       name:
 *                         type: string
 *                         nullable: true
 *                         description: Display name
 *                       profilePicture:
 *                         type: string
 *                         nullable: true
 *                         description: Profile picture URL
 *       401:
 *         description: Unauthorized - authentication required
 */
router.get('/users', authenticateToken, asyncHandler(getUsers));

/**
 * @swagger
 * /api/user/profile:
 *   put:
 *     summary: Update current user's profile information
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Display name
 *               bio:
 *                 type: string
 *                 description: User biography
 *               profilePicture:
 *                 type: string
 *                 description: Profile picture URL
 *               image_headers:
 *                 type: string
 *                 description: Image headers metadata
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Profile updated successfully"
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: User ID
 *                     username:
 *                       type: string
 *                       description: Username
 *                     email:
 *                       type: string
 *                       description: Email address
 *                     name:
 *                       type: string
 *                       nullable: true
 *                       description: Display name
 *                     bio:
 *                       type: string
 *                       nullable: true
 *                       description: User biography
 *                     profilePicture:
 *                       type: string
 *                       nullable: true
 *                       description: Profile picture URL
 *                     image_headers:
 *                       type: string
 *                       nullable: true
 *                       description: Image headers metadata
 *                     followersCount:
 *                       type: integer
 *                       description: Number of followers
 *                     followingCount:
 *                       type: integer
 *                       description: Number of users being followed
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - authentication required
 *       404:
 *         description: User not found
 */
router.put('/profile', authenticateToken, asyncHandler(updateProfile));

/**
 * @swagger
 * /api/user/forgot-password:
 *   put:
 *     summary: Request password reset (development mode - logs reset token)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address of the account
 *     responses:
 *       200:
 *         description: Password reset request processed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Password reset request processed. Check console for reset token (development mode)."
 *       400:
 *         description: Invalid email format
 *       404:
 *         description: Email not found
 */
router.put('/forgot-password', asyncHandler(forgotPassword));

/**
 * @swagger
 * /api/user/reset-password:
 *   put:
 *     summary: Reset password using reset token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 description: Reset token received via forgot-password request
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 description: New password with at least 8 characters, one uppercase letter, and one special character
 *     responses:
 *       200:
 *         description: Password has been reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Password has been reset successfully"
 *       400:
 *         description: Invalid token or password format
 *       401:
 *         description: Invalid or expired reset token
 */
router.put('/reset-password', asyncHandler(resetPassword));

/**
 * @swagger
 * /api/user/upload:
 *   post:
 *     summary: Upload image file for user
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file to upload
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Image uploaded successfully"
 *                 imageUrl:
 *                   type: string
 *                   description: URL of the uploaded image
 *                   example: "/uploads/1763388184609.avif"
 *       400:
 *         description: No file uploaded or invalid file type
 *       401:
 *         description: Unauthorized - authentication required
 */
router.post('/upload', authenticateToken, upload.single('image'), asyncHandler(uploadImage));

// Use error handling middleware
router.use(handleError);

export default router;



// import { Router } from 'express';
// import { register, login, logout, forgotPassword, resetPassword, getProfile, getProfileById, updateProfile, uploadImage, getUsers } from '../controllers/auth.js';
// import { authenticateToken } from '../middleware/auth.js';
// import { upload } from '../middleware/upload.js';
// import { asyncHandler, handleError } from '../middleware/handlingError.js';

// const router = Router();

// // Public auth routes with error handling
// router.post('/register', asyncHandler(register));
// router.post('/login', asyncHandler(login));
// router.post('/logout', authenticateToken, asyncHandler(logout));
// router.post('/upload', authenticateToken, upload.single('image'), asyncHandler(uploadImage));
// router.get('/profile', authenticateToken, asyncHandler(getProfile));
// router.get('/profile/:id', asyncHandler(getProfileById));
// router.get('/users', authenticateToken, asyncHandler(getUsers));
// router.put('/profile', authenticateToken, asyncHandler(updateProfile));
// router.put('/forgot-password', asyncHandler(forgotPassword));
// router.put('/reset-password', asyncHandler(resetPassword));
// router.put('/reset-password', asyncHandler(resetPassword));

// // Use error handling mirouter.use(handleError);

// export default router;
