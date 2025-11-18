import prisma from "../connection/client.js";
import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Joi from "joi";

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
