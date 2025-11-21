import prisma from "../connection/client.js";
import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Joi from "joi";
import path from "path";

// Joi validation schemas
const registerSchema = Joi.object({
  username: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).pattern(/^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/).required(),
  name: Joi.string().optional()
});

const loginSchema = Joi.object({
  login: Joi.string().required(), // username or email
  password: Joi.string().required()
});

// Controller functions
export const register = async (req: Request, res: Response) => {
  const { error } = registerSchema.validate(req.body);
  if (error) {
    const validationError = new Error(error.details?.[0]?.message || 'Validation error');
    (validationError as any).status = 400;
    throw validationError;
  }

  const { username, email, password, name } = req.body;

  // Check if username is already taken
  const existingUsername = await prisma.user.findUnique({
    where: { username }
  });

  if (existingUsername) {
    const usernameError = new Error("Username is already taken");
    (usernameError as any).status = 409;
    throw usernameError;
  }

  // Check if email is already taken
  const existingEmail = await prisma.user.findUnique({
    where: { email }
  });

  if (existingEmail) {
    const emailError = new Error("Email is already taken");
    (emailError as any).status = 409;
    throw emailError;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const user = await prisma.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
      name
    }
  });

  res.status(201).json({
    message: "User registered successfully",
    user: { id: user.id, username: user.username, email: user.email }
  });
};

export const login = async (req: Request, res: Response) => {
  const { error } = loginSchema.validate(req.body);
  if (error) {
    const validationError = new Error(error.details?.[0]?.message || 'Validation error');
    (validationError as any).status = 400;
    throw validationError;
  }

  const { login, password } = req.body;

  // Find user by username or email
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ username: login }, { email: login }]
    }
  });

  if (!user) {
    const credError = new Error("Invalid credentials");
    (credError as any).status = 401;
    throw credError;
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    const credError = new Error("Invalid credentials");
    (credError as any).status = 401;
    throw credError;
  }

  // Generate JWT
  const token = jwt.sign(
    { userId: user.id, username: user.username },
    process.env.JWT_SECRET || 'default_secret',
    { expiresIn: '7d' }
  );

  // Set token in cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: false, // Set to true in production with HTTPS
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: 'lax'
  });

  res.json({
    message: "Login successful",
    token,
    user: { id: user.id, username: user.username, email: user.email }
  });
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    const notFoundError = new Error("Email not found");
    (notFoundError as any).status = 404;
    throw notFoundError;
  }

  // Generate reset token
  const resetToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET || 'default_secret',
    { expiresIn: '1h' }
  );

  // Log the reset token for development/testing purposes
  console.log('Password reset token generated:', resetToken);

  // Return success without sending email
  res.json({ message: "Password reset request processed. Check console for reset token (development mode)." });
};

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(8).pattern(/^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/).required()
});

export const resetPassword = async (req: Request, res: Response) => {
  const { error } = resetPasswordSchema.validate(req.body);
  if (error) {
    const validationError = new Error(error.details?.[0]?.message || 'Validation error');
    (validationError as any).status = 400;
    throw validationError;
  }

  const { token, newPassword } = req.body;

  // Verify reset token
  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as { userId: string };
  const userId = parseInt(decoded.userId);

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  // Update user's password in the database
  await prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } });
  res.json({ message: "Password has been reset successfully" });
};

export const logout = async (req: Request, res: Response) => {
  // For JWT, logout is handled client-side by removing the token
  // Server-side can invalidate if needed (requires token storage/cache)
  res.json({ message: "Logout successful" });
};

export const getProfile = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;

  if (!userId) {
    const error = new Error("User not authenticated");
    (error as any).status = 401;
    throw error;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      followers: true,
      following: true,
    },
  });

  if (!user) {
    const notFoundError = new Error("User not found");
    (notFoundError as any).status = 404;
    throw notFoundError;
  }

  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    name: user.name,
    bio: user.bio,
    profilePicture: user.profilePicture,
    image_headers: user.image_headers,
    followersCount: user.followers.length,
    followingCount: user.following.length,
  });
};

const updateProfileSchema = Joi.object({
  name: Joi.string().optional(),
  bio: Joi.string().optional(),
  profilePicture: Joi.string().optional(),
  image_headers: Joi.string().optional()
});

export const updateProfile = async (req: Request, res: Response) => {
  const { error } = updateProfileSchema.validate(req.body);
  if (error) {
    const validationError = new Error(error.details?.[0]?.message || 'Validation error');
    (validationError as any).status = 400;
    throw validationError;
  }

  const userId = (req as any).user?.userId;

  if (!userId) {
    const error = new Error("User not authenticated");
    (error as any).status = 401;
    throw error;
  }

  const { name, bio, profilePicture, image_headers } = req.body;

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(name !== undefined && { name }),
      ...(bio !== undefined && { bio }),
      ...(profilePicture !== undefined && { profilePicture }),
      ...(image_headers !== undefined && { image_headers }),
      updatedAt: new Date()
    },
    include: {
      followers: true,
      following: true,
    },
  });

  res.json({
    message: "Profile updated successfully",
    user: {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      name: updatedUser.name,
      bio: updatedUser.bio,
      profilePicture: updatedUser.profilePicture,
      image_headers: updatedUser.image_headers,
      followersCount: updatedUser.followers.length,
      followingCount: updatedUser.following.length,
    }
  });
};

export const getProfileById = async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id || '');

  if (!userId || isNaN(userId)) {
    const error = new Error("Invalid user ID");
    (error as any).status = 400;
    throw error;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      followers: true,
      following: true,
    },
  });

  if (!user) {
    const notFoundError = new Error("User not found");
    (notFoundError as any).status = 404;
    throw notFoundError;
  }

  res.json({
    id: user.id,
    username: user.username,
    name: user.name,
    bio: user.bio,
    profilePicture: user.profilePicture,
    image_headers: user.image_headers,
    followersCount: user.followers.length,
    followingCount: user.following.length,
  });
};

export const uploadImage = async (req: Request, res: Response) => {
  if (!req.file) {
    const noFileError = new Error("No file uploaded");
    (noFileError as any).status = 400;
    throw noFileError;
  }

  const imageUrl = '/uploads/' + req.file.filename;
  res.json({
    message: "Image uploaded successfully",
    imageUrl
  });
};

export const getUsers = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;

  if (!userId) {
    const error = new Error("User not authenticated");
    (error as any).status = 401;
    throw error;
  }

  // Get users except self, limit to 5 for suggestions
  const users = await prisma.user.findMany({
    where: {
      id: { not: userId as number }
    },
    select: {
      id: true,
      username: true,
      name: true,
      profilePicture: true,
    },
    take: 5, // limit to 5 suggestions
  });

  res.json({
    users
  });
};
