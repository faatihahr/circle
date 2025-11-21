import type { Request, Response } from 'express';
import prisma from '../connection/client.js';
import fs from 'fs';
import path from 'path';
import { createCommentSchema, updateCommentSchema } from '../models/comment.js';
import { addNotificationJob } from '../services/queue.js';

export const createComment = async (req: Request, res: Response): Promise<void> => {
  const userId = parseInt(req.user?.userId || '0');

  // Validate request body
  const { error, value } = createCommentSchema.validate(req.body);
  if (error) {
    const validationError = new Error(error.details?.[0]?.message || 'Validation failed');
    (validationError as any).status = 400;
    throw validationError;
  }
  const validatedValue = value;

  // Check if thread exists
  const thread = await prisma.threads.findUnique({
    where: { id: validatedValue.thread_id },
    select: { id: true, created_by: true }
  });

  if (!thread) {
    const threadError = new Error('Thread not found');
    (threadError as any).status = 404;
    throw threadError;
  }

  const image = req.file ? '/uploads/' + req.file.filename : validatedValue.image;

  const comment = await prisma.comments.create({
    data: {
      user_id: validatedValue.user_id,
      thread_id: validatedValue.thread_id,
      image,
      content: validatedValue.content,
      created_by: userId,
      updated_by: userId
    },
    include: {
      user: { select: { username: true, id: true, name: true, profilePicture: true } },
      thread: { select: { id: true, content: true } }
    }
  });

  // Broadcast WebSocket notification to all connected clients except the commenter
  const { broadcastWebSocketNotificationExcept } = await import('../app.js');
  broadcastWebSocketNotificationExcept(userId, {
    type: 'new_comment',
    data: comment
  });

  res.status(201).json({
    code: 201,
    status: "success",
    message: "Comment created successfully",
    data: comment
  });
};

export const getCommentsByThread = async (req: Request, res: Response): Promise<void> => {
  const { threadId } = req.params;
  if (!threadId || isNaN(Number(threadId))) {
    const idError = new Error('Invalid thread id');
    (idError as any).status = 400;
    throw idError;
  }

  // Check if thread exists
  const threadExists = await prisma.threads.findUnique({
    where: { id: parseInt(threadId) }
  });

  if (!threadExists) {
    const notFoundError = new Error('Thread not found');
    (notFoundError as any).status = 404;
    throw notFoundError;
  }

  const comments = await prisma.comments.findMany({
    where: { thread_id: parseInt(threadId) },
    include: {
      user: { select: { username: true, id: true, name: true, profilePicture: true } }
    },
    orderBy: { created_at: 'desc' }
  });

  res.json({
    code: 200,
    status: "success",
    message: "Get comments successfully",
    data: {
      comments,
      count: comments.length
    }
  });
};

export const getCommentById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  if (!id || isNaN(Number(id))) {
    const idError = new Error('Invalid comment id');
    (idError as any).status = 400;
    throw idError;
  }

  const comment = await prisma.comments.findUnique({
    where: { id: parseInt(id) },
    include: {
      user: { select: { username: true, id: true, name: true, profilePicture: true } },
      thread: { select: { id: true, content: true } }
    }
  });

  if (!comment) {
    const notFoundError = new Error('Comment not found');
    (notFoundError as any).status = 404;
    throw notFoundError;
  }

  res.json({
    code: 200,
    status: "success",
    message: "Get comment successfully",
    data: comment
  });
};

export const updateComment = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  if (!id || isNaN(Number(id))) {
    const idError = new Error('Invalid comment id');
    (idError as any).status = 400;
    throw idError;
  }
  const userId = parseInt(req.user?.userId || '0');

  // Check if comment exists and user is owner
  const existingComment = await prisma.comments.findUnique({
    where: { id: parseInt(id) }
  });

  if (!existingComment) {
    const notFoundError = new Error('Comment not found');
    (notFoundError as any).status = 404;
    throw notFoundError;
  }

  if (existingComment.created_by !== userId) {
    const authError = new Error('Not authorized to update this comment');
    (authError as any).status = 403;
    throw authError;
  }

  // Validate request body
  const { error, value } = updateCommentSchema.validate(req.body);
  if (error) {
    const validationError = new Error(error.details?.[0]?.message || 'Validation failed');
    (validationError as any).status = 400;
    throw validationError;
  }
  const validatedValue = value;

  // Handle image update
  let image = existingComment.image;
  if (req.file) {
    // Delete old image
    if (existingComment.image) {
      const oldImagePath = path.join(process.cwd(), 'src', existingComment.image);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }
    image = '/uploads/' + req.file.filename;
  }

  const updateData: any = {
    updated_by: userId
  };

  if (req.file || validatedValue.image !== undefined || validatedValue.content !== undefined) {
    updateData.image = image;
    if (validatedValue.content !== undefined) {
      updateData.content = validatedValue.content;
    }
  }

  const updatedComment = await prisma.comments.update({
    where: { id: parseInt(id) },
    data: updateData,
    include: {
      user: { select: { username: true, id: true, name: true, profilePicture: true } },
      thread: { select: { id: true, content: true } }
    }
  });

  res.json({
    code: 200,
    status: "success",
    message: "Comment updated successfully",
    data: updatedComment
  });
};

export const deleteComment = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  if (!id || isNaN(Number(id))) {
    const idError = new Error('Invalid comment id');
    (idError as any).status = 400;
    throw idError;
  }
  const userId = parseInt(req.user?.userId || '0');

  // Check if comment exists and user is owner
  const existingComment = await prisma.comments.findUnique({
    where: { id: parseInt(id) }
  });

  if (!existingComment) {
    const notFoundError = new Error('Comment not found');
    (notFoundError as any).status = 404;
    throw notFoundError;
  }

  if (existingComment.created_by !== userId) {
    const authError = new Error('Not authorized to delete this comment');
    (authError as any).status = 403;
    throw authError;
  }

  // Delete associated image file
  if (existingComment.image) {
    const imagePath = path.join(process.cwd(), 'src', existingComment.image);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
  }

  // Delete comment
  await prisma.comments.delete({
    where: { id: parseInt(id) }
  });

  res.json({
    code: 200,
    status: "success",
    message: 'Comment deleted successfully'
  });
};
