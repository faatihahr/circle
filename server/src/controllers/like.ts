import type { Request, Response } from 'express';
import prisma from '../connection/client.js';
import { addNotificationJob } from '../services/queue.js';

export const toggleLike = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  if (!id || isNaN(Number(id))) {
    const idError = new Error('Invalid post id');
    (idError as any).status = 400;
    throw idError;
  }
  const userId = parseInt(req.user?.userId || '0');

  // Check if post exists
  const existingPost = await prisma.threads.findUnique({
    where: { id: parseInt(id) },
    include: { likes: true }
  });

  if (!existingPost) {
    const notFoundError = new Error('Post not found');
    (notFoundError as any).status = 404;
    throw notFoundError;
  }

  // Check if user already liked this post
  const existingLike = await prisma.likes.findUnique({
    where: {
      user_id_thread_id: {
        user_id: userId,
        thread_id: parseInt(id)
      }
    }
  });

  let isLiked = false;
  let likesCount = existingPost.likes.length;

  if (existingLike) {
    // Unlike: delete the like
    await prisma.likes.delete({
      where: { id: existingLike.id }
    });
    likesCount--;
  } else {
    // Like: create the like
    await prisma.likes.create({
      data: {
        user_id: userId,
        thread_id: parseInt(id),
        created_by: userId,
        updated_by: userId
      }
    });
    likesCount++;
    isLiked = true;

    // Send notification to post owner if not the same user
    if (existingPost.created_by !== userId) {
      await addNotificationJob({
        userId: existingPost.created_by,
        type: 'like',
        message: `Someone liked your post`,
        relatedId: existingPost.id,
      });
    }
  }

  res.json({
    code: 200,
    status: "success",
    message: existingLike ? "Post unliked successfully" : "Post liked successfully",
    data: {
      isLiked,
      likesCount
    }
  });
};
