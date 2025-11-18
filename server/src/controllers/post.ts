import type { Request, Response } from 'express';
import prisma from '../connection/client.js';
import fs from 'fs';
import path from 'path';
import { createPostSchema, updatePostSchema } from '../models/post.js';
import { broadcastWebSocketNotificationExcept } from '../app.js';

export const createPost = async (req: Request, res: Response): Promise<void> => {
  const userId = parseInt(req.user?.userId || '0');

  // Validate request body without file
  const body = { ...req.body };
  const { error, value } = createPostSchema.validate(body);
  if (error || !value) {
    const validationError = new Error(error?.details?.[0]?.message || 'Validation failed');
    (validationError as any).status = 400;
    throw validationError;
  }
  const validatedValue = value;

  const image = req.file ? '/uploads/' + req.file.filename : null;

  const post = await prisma.threads.create({
    data: {
      created_by: userId,
      updated_by: userId,
      image,
      content: validatedValue.content
    },
    include: {
      user_created: { select: { username: true, id: true, name: true, profilePicture: true } },
      likes: { include: { user: { select: { id: true } } } },
      comments: {
        include: { user: { select: { username: true, id: true, name: true, profilePicture: true } } },
        orderBy: { created_at: 'desc' }
      }
    }
  });

  // Format the thread data as expected by client
  const thread = {
    id: post.id,
    content: post.content,
    image: post.image,
    user: {
      id: post.user_created.id,
      username: post.user_created.username,
      name: post.user_created.name,
      profile_picture: post.user_created.profilePicture
    },
    created_at: post.created_at,
    likes: post.likes.length,
    reply: post.comments.length,
    comments: post.comments,
    isLiked: false // new post, user hasn't liked it yet
  };

  // Broadcast new post notification via WebSocket, excluding the creator
  broadcastWebSocketNotificationExcept(userId, {
    type: 'new_post',
    data: thread
  });

  res.status(201).json({
    code: 201,
    status: "success",
    message: "Thread successfully posted",
    data: post
  });
};

export const getAllPosts = async (req: Request, res: Response): Promise<void> => {
  const userId = parseInt(req.user?.userId || '0');

  const posts = await prisma.threads.findMany({
    include: {
      user_created: { select: { username: true, id: true, name: true, profilePicture: true } },
      likes: { include: { user: { select: { id: true } } } },
      comments: {
        include: { user: { select: { username: true, id: true, name: true, profilePicture: true } } },
        orderBy: { created_at: 'desc' }
      }
    },
    orderBy: { created_at: 'desc' },
    take: 25
  });

  const threads = posts.map(post => ({
    id: post.id,
    content: post.content,
    image: post.image,
    user: {
      id: post.user_created.id,
      username: post.user_created.username,
      name: post.user_created.name,
      profile_picture: post.user_created.profilePicture
    },
    created_at: post.created_at,
    likes: post.likes.length,
    reply: post.comments.length,
    comments: post.comments,
    isLiked: post.likes.some(like => like.user_id === userId)
  }));

  res.json({
    code: 200,
    status: "success",
    message: "Get Data Thread Successfully",
    data: {
      threads
    }
  });
};

export const getPostById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  if (!id || isNaN(Number(id))) {
    const idError = new Error('Invalid post id');
    (idError as any).status = 400;
    throw idError;
  }
  const post = await prisma.threads.findUnique({
    where: { id: parseInt(id) },
    include: {
      user_created: { select: { username: true, id: true } },
      likes: { include: { user: { select: { username: true, id: true } } } },
      comments: { include: { user: { select: { username: true, id: true } } } }
    }
  });

  if (!post) {
    const notFoundError = new Error('Post not found');
    (notFoundError as any).status = 404;
    throw notFoundError;
  }

  res.json(post);
};

export const updatePost = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  if (!id || isNaN(Number(id))) {
    const idError = new Error('Invalid post id');
    (idError as any).status = 400;
    throw idError;
  }
  const userId = parseInt(req.user?.userId || '0');

  // Check if post exists and user is owner
  const existingPost = await prisma.threads.findUnique({
    where: { id: parseInt(id) }
  });

  if (!existingPost) {
    const notFoundError = new Error('Post not found');
    (notFoundError as any).status = 404;
    throw notFoundError;
  }

  if (existingPost.created_by !== userId) {
    const authError = new Error('Not authorized to update this post');
    (authError as any).status = 403;
    throw authError;
  }

  // Validate request body without file
  const body = { ...req.body };
  const { error, value } = updatePostSchema.validate(body);
  if (error) {
    const validationError = new Error(error?.details?.[0]?.message || 'Validation failed');
    (validationError as any).status = 400;
    throw validationError;
  }
  const validatedValue = value!;

  // Handle image update
  let image = existingPost.image;
  if (req.file) {
    // Delete old image
    if (existingPost.image) {
      const oldImagePath = path.join(process.cwd(), 'src', existingPost.image);
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

  const updatedPost = await prisma.threads.update({
    where: { id: parseInt(id) },
    data: updateData,
    include: {
      user_created: { select: { username: true, id: true } },
      likes: { include: { user: { select: { username: true, id: true } } } },
      comments: { include: { user: { select: { username: true, id: true } } } }
    }
  });

  res.json(updatedPost);
};

export const deletePost = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  if (!id || isNaN(Number(id))) {
    const idError = new Error('Invalid post id');
    (idError as any).status = 400;
    throw idError;
  }
  const userId = parseInt(req.user?.userId || '0');

  // Check if post exists and user is owner
  const existingPost = await prisma.threads.findUnique({
    where: { id: parseInt(id) }
  });

  if (!existingPost) {
    const notFoundError = new Error('Post not found');
    (notFoundError as any).status = 404;
    throw notFoundError;
  }

  if (existingPost.created_by !== userId) {
    const authError = new Error('Not authorized to delete this post');
    (authError as any).status = 403;
    throw authError;
  }

  // Delete associated image file
  if (existingPost.image) {
    const imagePath = path.join(process.cwd(), 'src', existingPost.image);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
  }

  // Delete post (cascade will handle likes and comments if set)
  await prisma.threads.delete({
    where: { id: parseInt(id) }
  });

  res.json({ message: 'Post deleted successfully' });
};
