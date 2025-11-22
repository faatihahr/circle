import type { Request, Response } from 'express';
import prisma from '../connection/client.js';
import { broadcastWebSocketNotificationExcept } from '../app.js';

export const followUser = async (req: Request, res: Response): Promise<void> => {
  const userId = parseInt(req.user?.userId || '0');
  const { id } = req.params;
  if (!id) {
    const idError = new Error('User id param missing');
    (idError as any).status = 400;
    throw idError;
  }
  const followingId = parseInt(id);

  if (!followingId || isNaN(followingId)) {
    const idError = new Error('Invalid user id');
    (idError as any).status = 400;
    throw idError;
  }

  if (userId === followingId) {
    const selfFollowError = new Error('Cannot follow yourself');
    (selfFollowError as any).status = 400;
    throw selfFollowError;
  }

  // Check if user exists
  const followingUser = await prisma.user.findUnique({
    where: { id: followingId }
  });

  if (!followingUser) {
    const notFoundError = new Error('User not found');
    (notFoundError as any).status = 404;
    throw notFoundError;
  }

  // Check if already following
  const existingFollow = await prisma.following.findUnique({
    where: {
      follower_id_following_id: {
        follower_id: userId,
        following_id: followingId
      }
    }
  });

  if (existingFollow) {
    const alreadyError = new Error('Already following this user');
    (alreadyError as any).status = 400;
    throw alreadyError;
  }

  // Create follow
  const follow = await prisma.following.create({
    data: {
      follower_id: userId,
      following_id: followingId
    },
    include: {
      follower: { select: { id: true, username: true, name: true, profilePicture: true } },
      following: { select: { id: true, username: true, name: true, profilePicture: true } }
    }
  });

  // Broadcast follow event via WebSocket
  broadcastWebSocketNotificationExcept(userId, {
    type: 'follow_update',
    data: { followerId: userId, followedId: followingId, action: 'follow' }
  });

  res.status(201).json({
    code: 201,
    status: "success",
    message: "User followed successfully",
    data: follow
  });
};

export const unfollowUser = async (req: Request, res: Response): Promise<void> => {
  const userId = parseInt(req.user?.userId || '0');
  const { id } = req.params;
  if (!id) {
    const idError = new Error('User id param missing');
    (idError as any).status = 400;
    throw idError;
  }
  const followingId = parseInt(id);

  if (!followingId || isNaN(followingId)) {
    const idError = new Error('Invalid user id');
    (idError as any).status = 400;
    throw idError;
  }

  // Check if currently following
  const existingFollow = await prisma.following.findUnique({
    where: {
      follower_id_following_id: {
        follower_id: userId,
        following_id: followingId
      }
    }
  });

  if (!existingFollow) {
    const notFollowingError = new Error('Not following this user');
    (notFollowingError as any).status = 400;
    throw notFollowingError;
  }

  // Delete follow
  await prisma.following.delete({
    where: {
      follower_id_following_id: {
        follower_id: userId,
        following_id: followingId
      }
    }
  });

  // Broadcast unfollow event via WebSocket
  broadcastWebSocketNotificationExcept(userId, {
    type: 'follow_update',
    data: { followerId: userId, followedId: followingId, action: 'unfollow' }
  });

  res.json({
    code: 200,
    status: "success",
    message: "User unfollowed successfully",
    data: null
  });
};

export const getFollowStatus = async (req: Request, res: Response): Promise<void> => {
  const userId = parseInt(req.user?.userId || '0');
  const { id } = req.params;
  if (!id) {
    const idError = new Error('User id param missing');
    (idError as any).status = 400;
    throw idError;
  }
  const followingId = parseInt(id);

  if (!followingId || isNaN(followingId)) {
    const idError = new Error('Invalid user id');
    (idError as any).status = 400;
    throw idError;
  }

  const follow = await prisma.following.findUnique({
    where: {
      follower_id_following_id: {
        follower_id: userId,
        following_id: followingId
      }
    }
  });

  const isFollowing = !!follow;

  res.json({
    code: 200,
    status: "success",
    message: "Follow status retrieved successfully",
    data: { isFollowing }
  });
};

export const getFollowers = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  if (!id) {
    const idError = new Error('User id param missing');
    (idError as any).status = 400;
    throw idError;
  }
  const userId = parseInt(id);

  if (!userId || isNaN(userId)) {
    const idError = new Error('Invalid user id');
    (idError as any).status = 400;
    throw idError;
  }

  // Get all followers for this user
  const followers = await prisma.following.findMany({
    where: {
      following_id: userId
    },
    include: {
      follower: {
        select: {
          id: true,
          username: true,
          name: true,
          profilePicture: true
        }
      }
    },
    orderBy: { created_at: 'desc' }
  });

  const followerUsers = followers.map(f => f.follower);

  res.json({
    code: 200,
    status: "success",
    message: "Followers retrieved successfully",
    data: followerUsers
  });
};

export const getFollowing = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  if (!id) {
    const idError = new Error('User id param missing');
    (idError as any).status = 400;
    throw idError;
  }
  const userId = parseInt(id);

  if (!userId || isNaN(userId)) {
    const idError = new Error('Invalid user id');
    (idError as any).status = 400;
    throw idError;
  }

  // Get all users this user is following
  const following = await prisma.following.findMany({
    where: {
      follower_id: userId
    },
    include: {
      following: {
        select: {
          id: true,
          username: true,
          name: true,
          profilePicture: true
        }
      }
    },
    orderBy: { created_at: 'desc' }
  });

  const followingUsers = following.map(f => f.following);

  res.json({
    code: 200,
    status: "success",
    message: "Following retrieved successfully",
    data: followingUsers
  });
};
