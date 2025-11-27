import { jest } from '@jest/globals';
import { register, login, forgotPassword, resetPassword, logout, getProfile, updateProfile, getProfileById } from '../auth.js';
import prisma from "../../connection/client.js";
import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Joi from "joi";
import type { User } from '@prisma/client';

// Create a shared mock for validate to ensure consistent mocking across all schema instances
const mockValidate = jest.fn();

// Mock dependencies
jest.mock("../../connection/client.js", () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("bcryptjs", () => ({
  hash: jest.fn(),
}));

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

jest.mock("joi", () => ({
  object: jest.fn(() => ({
    string: jest.fn().mockReturnThis(),
    min: jest.fn().mockReturnThis(),
    max: jest.fn().mockReturnThis(),
    email: jest.fn().mockReturnThis(),
    required: jest.fn().mockReturnThis(),
    optional: jest.fn().mockReturnThis(),
    pattern: jest.fn().mockReturnThis(),
    validate: mockValidate,
  })),
}));

describe('Auth Controller - register', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = {
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn() as any,
    };
    jest.clearAllMocks();
    mockValidate.mockClear();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should register a new user successfully', async () => {
    req.body = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123!',
      name: 'Test User',
    };

    // Mock Joi validation to pass
    mockValidate.mockReturnValue({ error: null });

    // Mock Prisma: no existing user
    jest.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
    jest.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

    // Mock bcrypt
    (jest.mocked(bcrypt.hash) as any).mockResolvedValue('hashedpassword');

    // Mock user creation
    const mockUser: User = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      password: '',
      name: null,
      bio: null,
      profilePicture: null,
      image_headers: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      verified: false,
    };
    jest.mocked(prisma.user.create).mockResolvedValue(mockUser);

    await register(req as Request, res as Response);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { username: 'testuser' } });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
    expect(bcrypt.hash).toHaveBeenCalledWith('Password123!', 10);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User',
      },
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: "User registered successfully",
      user: { id: 1, username: 'testuser', email: 'test@example.com' },
    });
  });

  it('should throw error if username is taken', async () => {
    req.body = { username: 'taken', email: 'new@example.com', password: 'Pass123!' };

    mockValidate.mockReturnValue({ error: null });

    jest.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 1,
      username: 'taken',
      email: '',
      password: '',
      name: null,
      bio: null,
      profilePicture: null,
      image_headers: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      verified: false,
    } as User);

    await expect(register(req as Request, res as Response)).rejects.toThrow('Username is already taken');

    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { username: 'taken' } });
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('should throw error if email is taken', async () => {
    req.body = { username: 'newuser', email: 'taken@example.com', password: 'Pass123!' };

    mockValidate.mockReturnValue({ error: null });

    jest.mocked(prisma.user.findUnique).mockResolvedValueOnce(null); // username ok
    jest.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 1,
      username: '',
      email: 'taken@example.com',
      password: '',
      name: null,
      bio: null,
      profilePicture: null,
      image_headers: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      verified: false,
    } as User); // email taken

    await expect(register(req as Request, res as Response)).rejects.toThrow('Email is already taken');
  });

  it('should throw validation error for invalid data', async () => {
    req.body = { username: 'ab', email: 'invalid', password: 'weak' };

    const validationError = { details: [{ message: 'Invalid data' }] };
    mockValidate.mockReturnValue({ error: validationError });

    await expect(register(req as Request, res as Response)).rejects.toThrow('Invalid data');
  });
});
