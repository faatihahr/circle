import type { Request, Response } from 'express';
import prisma from '../connection/client.js';
import fs from 'fs';
import path from 'path';
import { createCommentSchema, updateCommentSchema } from '../models/comment.js';
import { addNotificationJob } from '../services/queue.js';
import redisClient from '../connection/redis.js';

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
      parent_id: validatedValue.parent_id || null, // Support nested comments
      image,
      content: validatedValue.content,
      created_by: userId,
      updated_by: userId
    },
    include: {
      user: { select: { username: true, id: true, name: true, profilePicture: true } },
      thread: { select: { id: true, content: true } },
      parent: { // Include parent comment info
        select: {
          id: true,
          content: true,
          user: { select: { username: true, name: true } }
        }
      }
    }
  });

  // Invalidate cache untuk thread setelah create comment
  try {
    await redisClient.keys(`posts:${validatedValue.thread_id}:*`).then(async (keys) => {
      if (keys.length > 0) {
        await redisClient.del(keys);
        console.log(`Invalidated cache for thread ${validatedValue.thread_id} after create comment`);
      }
    });
    // Juga invalidate feed cache agar reply count di homepage terupdate
    await redisClient.keys('posts:all:*').then(async (keys) => {
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    });
  } catch (cacheError) {
    console.log('Failed to invalidate cache after create comment:', cacheError);
  }

  // Broadcast WebSocket notification to all connected clients except the commenter
  const { broadcastWebSocketNotificationExcept } = await import('../app.js');
  broadcastWebSocketNotificationExcept(userId, {
    type: 'new_comment',
    data: comment
  });

  // Send notification to post owner if not self-comment
  if (comment.user_id !== thread.created_by) {
    await addNotificationJob({
      userId: thread.created_by,
      type: 'comment',
      message: `${comment.user.username} commented on your post`,
      relatedId: comment.thread_id,
    });

    // Send real-time notification via WebSocket
    const { sendWebSocketNotification } = await import('../app.js');
    sendWebSocketNotification(thread.created_by, {
      type: 'notification',
      data: {
        id: `temp-comment-${Date.now()}`,
        type: 'comment',
        message: `${comment.user.username} commented on your post`,
        is_read: false,
        related_id: comment.thread_id,
        created_at: new Date().toISOString()
      }
    });
  }

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

  // Get only top-level comments (no parent)
  const topLevelComments = await prisma.comments.findMany({
    where: {
      thread_id: parseInt(threadId),
      parent_id: null // Only top-level comments
    },
    include: {
      user: { select: { username: true, id: true, name: true, profilePicture: true } },
      replies: {
        include: {
          user: { select: { username: true, id: true, name: true, profilePicture: true } },
          parent: {
            select: {
              id: true,
              user: { select: { username: true } }
            }
          },
          replies: {
            include: {
              user: { select: { username: true, id: true, name: true, profilePicture: true } },
              parent: {
                select: {
                  id: true,
                  user: { select: { username: true } }
                }
              }
            },
            orderBy: { created_at: 'asc' }
          } // Support nested replies up to 2 levels
        },
        orderBy: { created_at: 'asc' }
      },
      comment_likes: true
    },
    orderBy: { created_at: 'desc' }
  });

  res.json({
    code: 200,
    status: "success",
    message: "Get comments successfully",
    data: {
      comments: topLevelComments,
      count: topLevelComments.length
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

  // Get thread ID before deleting comment for cache invalidation
  const threadId = existingComment.thread_id;

  // Delete comment
  await prisma.comments.delete({
    where: { id: parseInt(id) }
  });

  // Invalidate cache untuk thread setelah delete comment
  try {
    await redisClient.keys(`posts:${threadId}:*`).then(async (keys) => {
      if (keys.length > 0) {
        await redisClient.del(keys);
        console.log(`Invalidated cache for thread ${threadId} after delete comment`);
      }
    });
    // Juga invalidate feed cache agar reply count di homepage terupdate
    await redisClient.keys('posts:all:*').then(async (keys) => {
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    });
  } catch (cacheError) {
    console.log('Failed to invalidate cache after delete comment:', cacheError);
  }

  res.json({
    code: 200,
    status: "success",
    message: 'Comment deleted successfully'
  });
};

export const toggleCommentLike = async (req: Request, res: Response): Promise<void> => {
  const userId = parseInt(req.user?.userId || '0');
  const { commentId } = req.params;

  if (!commentId || isNaN(Number(commentId))) {
    const idError = new Error('Invalid comment id');
    (idError as any).status = 400;
    throw idError;
  }

  // Check if comment exists
  const comment = await prisma.comments.findUnique({
    where: { id: parseInt(commentId) }
  });

  if (!comment) {
    const commentError = new Error('Comment not found');
    (commentError as any).status = 404;
    throw commentError;
  }

  // Check if user already liked this comment
  const existingLike = await prisma.commentLikes.findUnique({
    where: {
      user_id_comment_id: {
        user_id: userId,
        comment_id: parseInt(commentId)
      }
    }
  });

  let isLiked: boolean;
  if (existingLike) {
    // Unlike - delete the like
    await prisma.commentLikes.delete({
      where: { id: existingLike.id }
    });
    isLiked = false;
  } else {
    // Like - create new like
    await prisma.commentLikes.create({
      data: {
        user_id: userId,
        comment_id: parseInt(commentId)
      }
    });
    isLiked = true;

    // Send notification to comment owner if not self-like
    if (comment.user_id !== userId) {
      // Get liker user data for personalized message
      const likerUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { username: true }
      });

      await addNotificationJob({
        userId: comment.user_id,
        type: 'comment_like',
        message: `${likerUser?.username || 'Someone'} liked your comment`,
        relatedId: comment.thread_id, // link to thread
      });

      // Send real-time notification via WebSocket
      const { sendWebSocketNotification } = await import('../app.js');
      sendWebSocketNotification(comment.user_id, {
        type: 'notification',
        data: {
          id: `temp-comment-like-${Date.now()}`,
          type: 'comment_like',
          message: `${likerUser?.username || 'Someone'} liked your comment`,
          is_read: false,
          related_id: comment.thread_id, // link to thread
          created_at: new Date().toISOString()
        }
      });
    }
  }

  // Get updated like count
  const likeCount = await prisma.commentLikes.count({
    where: { comment_id: parseInt(commentId) }
  });

  // Broadcast WebSocket notification
  const { broadcastWebSocketNotificationExcept } = await import('../app.js');
  broadcastWebSocketNotificationExcept(userId, {
    type: existingLike ? 'unliked_comment' : 'liked_comment',
    data: { commentId, isLiked, likesCount: likeCount }
  });

  res.json({
    code: 200,
    status: "success",
    message: isLiked ? "Comment liked successfully" : "Comment unliked successfully",
    data: {
      commentId: parseInt(commentId),
      isLiked,
      likesCount: likeCount
    }
  });
};
