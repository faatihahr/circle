import type { Request, Response } from 'express';
import prisma from '../connection/client.js';
import redisClient from '../connection/redis.js';

export const searchUsers = async (req: Request, res: Response): Promise<void> => {
  const { q: query } = req.query;
  const currentUserId = parseInt(req.user?.userId || '0');

  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    const error = new Error('Search query is required');
    (error as any).status = 400;
    throw error;
  }

  const trimmedQuery = query.trim();

  const cacheKey = `search:users:${trimmedQuery}:${currentUserId}`;

  try {
    // Check cache first
    const cachedResults = await redisClient.get(cacheKey);
    if (cachedResults) {
      console.log('Serving search users from cache');
      res.json(JSON.parse(cachedResults));
      return;
    }
  } catch (cacheError) {
    console.log('Redis cache error for search users:', cacheError);
  }

  // Search users by username or name (case insensitive)
  const users = await prisma.user.findMany({
    where: {
      AND: [
        {
          OR: [
            { username: { contains: trimmedQuery, mode: 'insensitive' } },
            { name: { contains: trimmedQuery, mode: 'insensitive' } }
          ]
        },
        // Exclude current user if they are searching
        ...(currentUserId ? [{ id: { not: currentUserId } }] : [])
      ]
    },
    select: {
      id: true,
      username: true,
      name: true,
      bio: true,
      profilePicture: true,
      _count: {
        select: {
          followers: true,
          following: true
        }
      }
    },
    take: 20, // Limit results
    orderBy: [
      { name: { sort: 'asc', nulls: 'last' } },
      { username: 'asc' }
    ]
  });

  const formattedUsers = users.map(user => ({
    id: user.id,
    username: user.username,
    name: user.name || user.username,
    bio: user.bio,
    profilePicture: user.profilePicture,
    followersCount: user._count.followers,
    followingCount: user._count.following
  }));

  const response = {
    code: 200,
    status: "success",
    message: "Search users successfully",
    data: {
      users: formattedUsers,
      total: formattedUsers.length
    }
  };

  try {
    // Cache for 10 minutes
    await redisClient.setEx(cacheKey, 600, JSON.stringify(response));
  } catch (cacheError) {
    console.log('Failed to cache search users:', cacheError);
  }

  res.json(response);
};

export const searchPosts = async (req: Request, res: Response): Promise<void> => {
  const { q: query } = req.query;
  const currentUserId = parseInt(req.user?.userId || '0');

  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    const error = new Error('Search query is required');
    (error as any).status = 400;
    throw error;
  }

  const trimmedQuery = query.trim();

  const cacheKey = `search:posts:${trimmedQuery}:${currentUserId}`;

  try {
    const cachedResults = await redisClient.get(cacheKey);
    if (cachedResults) {
      console.log('Serving search posts from cache');
      res.json(JSON.parse(cachedResults));
      return;
    }
  } catch (cacheError) {
    console.log('Redis cache error for search posts:', cacheError);
  }

  // Search threads by content
  const posts = await prisma.threads.findMany({
    where: {
      content: {
        contains: trimmedQuery,
        mode: 'insensitive'
      }
    },
    include: {
      user_created: {
        select: {
          id: true,
          username: true,
          name: true,
          profilePicture: true
        }
      },
      _count: {
        select: {
          likes: true,
          comments: true
        }
      },
      likes: {
        where: { user_id: currentUserId },
        select: { id: true }
      }
    },
    take: 20, // Limit results
    orderBy: { created_at: 'desc' }
  });

  const threads = posts.map(post => ({
    id: post.id,
    content: post.content,
    image: post.image,
    user: {
      id: post.user_created.id,
      username: post.user_created.username,
      name: post.user_created.name || post.user_created.username,
      profile_picture: post.user_created.profilePicture
    },
    created_at: post.created_at,
    likes: post._count.likes,
    reply: post._count.comments,
    isLiked: post.likes.length > 0
  }));

  const response = {
    code: 200,
    status: "success",
    message: "Search posts successfully",
    data: {
      threads,
      total: threads.length
    }
  };

  try {
    // Cache for 10 minutes
    await redisClient.setEx(cacheKey, 600, JSON.stringify(response));
  } catch (cacheError) {
    console.log('Failed to cache search posts:', cacheError);
  }

  res.json(response);
};

export const searchAll = async (req: Request, res: Response): Promise<void> => {
  const { q: query } = req.query;
  const currentUserId = parseInt(req.user?.userId || '0');

  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    const error = new Error('Search query is required');
    (error as any).status = 400;
    throw error;
  }

  const trimmedQuery = query.trim();

  const cacheKey = `search:all:${trimmedQuery}:${currentUserId}`;

  try {
    const cachedResults = await redisClient.get(cacheKey);
    if (cachedResults) {
      console.log('Serving search all from cache');
      res.json(JSON.parse(cachedResults));
      return;
    }
  } catch (cacheError) {
    console.log('Redis cache error for search all:', cacheError);
  }

  // Search both users and posts simultaneously
  const [users, posts] = await Promise.all([
    // Search users
    prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { username: { contains: trimmedQuery, mode: 'insensitive' } },
              { name: { contains: trimmedQuery, mode: 'insensitive' } }
            ]
          },
          ...(currentUserId ? [{ id: { not: currentUserId } }] : [])
        ]
      },
      select: {
        id: true,
        username: true,
        name: true,
        bio: true,
        profilePicture: true,
        _count: {
          select: {
            followers: true,
            following: true
          }
        }
      },
      take: 10, // Limit each type
      orderBy: [
        { name: { sort: 'asc', nulls: 'last' } },
        { username: 'asc' }
      ]
    }),
    // Search posts
    prisma.threads.findMany({
      where: {
        content: {
          contains: trimmedQuery,
          mode: 'insensitive'
        }
      },
      include: {
        user_created: {
          select: {
            id: true,
            username: true,
            name: true,
            profilePicture: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        },
        likes: {
          where: { user_id: currentUserId },
          select: { id: true }
        }
      },
      take: 10,
      orderBy: { created_at: 'desc' }
    })
  ]);

  const formattedUsers = users.map(user => ({
    type: 'user' as const,
    id: user.id,
    username: user.username,
    name: user.name || user.username,
    bio: user.bio,
    profilePicture: user.profilePicture,
    followersCount: user._count.followers,
    followingCount: user._count.following
  }));

  const threads = posts.map(post => ({
    type: 'post' as const,
    id: post.id,
    content: post.content,
    image: post.image,
    user: {
      id: post.user_created.id,
      username: post.user_created.username,
      name: post.user_created.name || post.user_created.username,
      profile_picture: post.user_created.profilePicture
    },
    created_at: post.created_at,
    likes: post._count.likes,
    reply: post._count.comments,
    isLiked: post.likes.length > 0
  }));

  const response = {
    code: 200,
    status: "success",
    message: "Search all successfully",
    data: {
      users: formattedUsers,
      threads,
      totalUsers: formattedUsers.length,
      totalThreads: threads.length
    }
  };

  try {
    // Cache for 10 minutes
    await redisClient.setEx(cacheKey, 600, JSON.stringify(response));
  } catch (cacheError) {
    console.log('Failed to cache search all:', cacheError);
  }

  res.json(response);
};
