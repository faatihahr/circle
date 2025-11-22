import type { Request, Response } from 'express';
import prisma from '../connection/client.js';
import fs from 'fs';
import path from 'path';
import { createPostSchema, updatePostSchema } from '../models/post.js';
import { broadcastWebSocketNotificationExcept } from '../app.js';
import { addImageProcessingJob } from '../services/queue.js';
import redisClient from '../connection/redis.js';  

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

  // Invalidate cache untuk semua user setelah create post baru
  try {
    await redisClient.keys('posts:all:*').then(async (keys) => {
      if (keys.length > 0) {
        await redisClient.del(keys);
        console.log(`Invalidated cache for ${keys.length} keys after create post`);
      }
    });
  } catch (cacheError) {
    console.log('Failed to invalidate cache after create post:', cacheError);
  }

  // Broadcast new post notification via WebSocket, excluding the creator
  broadcastWebSocketNotificationExcept(userId, {
    type: 'new_post',
    data: thread
  });

  // Queue image processing for background processing if there's an image
  if (image) {
    try {
      await addImageProcessingJob({
        threadId: post.id,
        imagePath: image,
        userId: userId
      });
      console.log(`Image processing job queued for thread ${post.id}, image: ${image}`);
    } catch (queueError) {
      console.error('Failed to queue image processing job:', queueError);
    }
  }

  res.status(201).json({
    code: 201,
    status: "success",
    message: "Thread successfully posted",
    data: post
  });
};

export const getAllPosts = async (req: Request, res: Response): Promise<void> => {
  const userId = parseInt(req.user?.userId || '0');
  const cursor = req.query.cursor as string; // cursor is last post ID
  const limit = parseInt(req.query.limit as string) || 10; // default 10 posts
  
  const cacheKey = `posts:all:${userId}:${cursor || 'start'}:${limit}`;

  try {
    const cachedPosts = await redisClient.get(cacheKey);
    if (cachedPosts) {
      console.log(`Serving paginated posts from Redis cache for user ${userId}`);
      res.json(JSON.parse(cachedPosts));
      return;
    }
  } catch (cacheError) {
    console.log('Redis cache error for paginated posts:', cacheError);
  }

  const posts = await prisma.threads.findMany({
    include: {
      user_created: { select: { username: true, id: true, name: true, profilePicture: true } },
      _count: {
        select: {
          likes: true,
          comments: true
        }
      },
      likes: { include: { user: { select: { id: true } } }, where: { user_id: userId } }
    },
    orderBy: { created_at: 'desc' },
    take: limit + 1, // Take N+1 to check if there are more
    ...(cursor && !isNaN(Number(cursor)) && {
      cursor: { id: parseInt(cursor) },
      skip: 1 // Skip the cursor itself
    })
  });

  const hasMore = posts.length > limit;
  const threadsToReturn = hasMore ? posts.slice(0, -1) : posts; // Remove the extra post if hasMore
  const nextCursor = hasMore ? threadsToReturn[threadsToReturn.length - 1]?.id : null;

  const threads = threadsToReturn.map((post: any) => ({
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
    likes: post._count.likes,
    reply: post._count.comments,
    comments: [],
    isLiked: post.likes.length > 0
  }));

  const response = {
    code: 200,
    status: "success", 
    message: "Get Paginated Thread Successfully",
    data: {
      threads,
      hasMore,
      nextCursor
    }
  };

  try {
    await redisClient.setEx(cacheKey, 300, JSON.stringify(response)); // Cache 5 min
  } catch (cacheError) {
    console.log('Failed to cache paginated posts:', cacheError);
  }

  res.json(response);
};

// export const getAllPosts = async (req: Request, res: Response): Promise<void> => {
//   const userId = parseInt(req.user?.userId || '0');
//   const cacheKey = `posts:all:${userId}`;

//   try {
//     // Coba ambil dari cache dulu
//     const cachedPosts = await redisClient.get(cacheKey);
//     if (cachedPosts) {
//       console.log(`Serving posts from Redis cache for user ${userId}`);
//       res.json(JSON.parse(cachedPosts));
//       return;
//     }
//     console.log(`Cache miss for user ${userId}, fetching from database`);
//   } catch (cacheError) {
//     console.log('Redis cache error, proceeding to DB:', cacheError);
//   }

//   const posts = await prisma.threads.findMany({
//     include: {
//       user_created: { select: { username: true, id: true, name: true, profilePicture: true } },
//       _count: {
//         select: {
//           likes: true,
//           comments: true
//         }
//       },
//       likes: { include: { user: { select: { id: true } } }, where: { user_id: userId } }
//     },
//     orderBy: { created_at: 'desc' },
//     take: 25
//   });

//   const threads = posts.map((post: any) => ({
//     id: post.id,
//     content: post.content,
//     image: post.image,
//     user: {
//       id: post.user_created.id,
//       username: post.user_created.username,
//       name: post.user_created.name,
//       profile_picture: post.user_created.profilePicture
//     },
//     created_at: post.created_at,
//     likes: post._count.likes,
//     reply: post._count.comments,
//     comments: [],
//     isLiked: post.likes.length > 0
//   }));

//   const response = {
//     code: 200,
//     status: "success",
//     message: "Get Data Thread Successfully",
//     data: {
//       threads
//     }
//   };

//   try {
//     // Cache hasil selama 5 menit
//     await redisClient.setEx(cacheKey, 300, JSON.stringify(response));
//     console.log(`Cached posts in Redis for user ${userId}`);
//   } catch (cacheError) {
//     console.log('Failed to cache posts:', cacheError);
//   }

//   res.json(response);
// };

export const getPostById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = parseInt(req.user?.userId || '0');
  const cacheKey = `posts:${id}:${userId}`;

  try {
    const cachedPost = await redisClient.get(cacheKey);
    if (cachedPost) {
      console.log(`Serving post ${id} from Redis cache`);
      res.json(JSON.parse(cachedPost));
      return;
    }
  } catch (cacheError) {
    console.log('Redis cache error for single post:', cacheError);
  }

  if (!id || isNaN(Number(id))) {
    const idError = new Error('Invalid post id');
    (idError as any).status = 400;
    throw idError;
  }
  const post = await prisma.threads.findUnique({
    where: { id: parseInt(id) },
    include: {
      user_created: { select: { username: true, id: true, name: true, profilePicture: true } },
      _count: {
        select: {
          likes: true,
          comments: true
        }
      },
      likes: { include: { user: { select: { id: true } } } },
      comments: {
        include: { user: { select: { username: true, id: true, name: true, profilePicture: true } } },
        orderBy: { created_at: 'desc' }
      }
    }
  });

  if (!post) {
    const notFoundError = new Error('Post not found');
    (notFoundError as any).status = 404;
    throw notFoundError;
  }

  const thread = {
    id: post.id,
    content: post.content,
    image: post.image,
    user: {
      id: post.user_created.id,
      username: post.user_created.username,
      name: post.user_created.name != null ? post.user_created.name : post.user_created.username,
      profile_picture: post.user_created.profilePicture
    },
    created_at: post.created_at,
    likes: post._count.likes,
    reply: post._count.comments,
    comments: post.comments,
    isLiked: post.likes.some((like: { user_id: number }) => like.user_id === userId)
  };

  const response = {
    code: 200,
    status: "success",
    message: "Get Thread Successfully",
    data: thread
  };

  try {
    // Cache single post selama 5 menit
    await redisClient.setEx(cacheKey, 300, JSON.stringify(response));
  } catch (cacheError) {
    console.log('Failed to cache single post:', cacheError);
  }

  res.json(response);
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

  // Invalidate cache untuk post yang diupdate
  try {
    await redisClient.keys(`posts:${id}:*`).then(async (keys) => {
      if (keys.length > 0) {
        await redisClient.del(keys);
        console.log(`Invalidated cache for post ${id}`);
      }
    });
    // Juga invalidate feed cache
    await redisClient.keys('posts:all:*').then(async (keys) => {
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    });
  } catch (cacheError) {
    console.log('Failed to invalidate cache after update:', cacheError);
  }

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

  // Invalidate cache untuk post yang didelete
  try {
    await redisClient.keys(`posts:${id}:*`).then(async (keys) => {
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    });
    // Juga invalidate feed cache
    await redisClient.keys('posts:all:*').then(async (keys) => {
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    });
  } catch (cacheError) {
    console.log('Failed to invalidate cache after delete:', cacheError);
  }

  res.json({ message: 'Post deleted successfully' });
};

export const getPostsByUserId = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const currentUserId = parseInt(req.user?.userId || '0');
  const cacheKey = `posts:byuser:${id}:${currentUserId}`;

  try {
    const cachedPosts = await redisClient.get(cacheKey);
    if (cachedPosts) {
      console.log(`Serving user posts from cache for user ${id}`);
      res.json(JSON.parse(cachedPosts));
      return;
    }
  } catch (cacheError) {
    console.log('Redis cache error for user posts:', cacheError);
  }

  if (!id || isNaN(Number(id))) {
    const idError = new Error('Invalid user id');
    (idError as any).status = 400;
    throw idError;
  }

  const posts = await prisma.threads.findMany({
    where: { created_by: parseInt(id) },
    include: {
      user_created: { select: { username: true, id: true, name: true, profilePicture: true } },
      _count: {
        select: {
          likes: true,
          comments: true
        }
      },
      likes: { include: { user: { select: { id: true } } }, where: { user_id: currentUserId } }
    },
    orderBy: { created_at: 'desc' }
  });

  const threads = posts.map((post: any) => ({
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
    likes: post._count.likes,
    reply: post._count.comments,
    comments: post.comments,
    isLiked: post.likes.length > 0
  }));

  const response = {
    code: 200,
    status: "success",
    message: "Get User Posts Successfully",
    data: {
      threads
    }
  };

  try {
    // Cache posts by user selama 5 menit
    await redisClient.setEx(cacheKey, 300, JSON.stringify(response));
  } catch (cacheError) {
    console.log('Failed to cache user posts:', cacheError);
  }

  res.json(response);
};

// import type { Request, Response } from 'express';
// import prisma from '../connection/client.js';
// import fs from 'fs';
// import path from 'path';
// import { createPostSchema, updatePostSchema } from '../models/post.js';
// import { broadcastWebSocketNotificationExcept } from '../app.js';
// import { addImageProcessingJob } from '../services/queue.js';

// export const createPost = async (req: Request, res: Response): Promise<void> => {
//   const userId = parseInt(req.user?.userId || '0');

//   // Validate request body without file
//   const body = { ...req.body };
//   const { error, value } = createPostSchema.validate(body);
//   if (error || !value) {
//     const validationError = new Error(error?.details?.[0]?.message || 'Validation failed');
//     (validationError as any).status = 400;
//     throw validationError;
//   }
//   const validatedValue = value;

//   const image = req.file ? '/uploads/' + req.file.filename : null;

//   const post = await prisma.threads.create({
//     data: {
//       created_by: userId,
//       updated_by: userId,
//       image,
//       content: validatedValue.content
//     },
//     include: {
//       user_created: { select: { username: true, id: true, name: true, profilePicture: true } },
//       likes: { include: { user: { select: { id: true } } } },
//       comments: {
//         include: { user: { select: { username: true, id: true, name: true, profilePicture: true } } },
//         orderBy: { created_at: 'desc' }
//       }
//     }
//   });

//   // Format the thread data as expected by client
//   const thread = {
//     id: post.id,
//     content: post.content,
//     image: post.image,
//     user: {
//       id: post.user_created.id,
//       username: post.user_created.username,
//       name: post.user_created.name,
//       profile_picture: post.user_created.profilePicture
//     },
//     created_at: post.created_at,
//     likes: post.likes.length,
//     reply: post.comments.length,
//     comments: post.comments,
//     isLiked: false // new post, user hasn't liked it yet
//   };

//   // Broadcast new post notification via WebSocket, excluding the creator
//   broadcastWebSocketNotificationExcept(userId, {
//     type: 'new_post',
//     data: thread
//   });

//   // Queue image processing for background processing if there's an image
//   if (image) {
//     try {
//       await addImageProcessingJob({
//         threadId: post.id,
//         imagePath: image,
//         userId: userId
//       });
//       console.log(`Image processing job queued for thread ${post.id}, image: ${image}`);
//     } catch (queueError) {
//       console.error('Failed to queue image processing job:', queueError);
//     }
//   }

//   res.status(201).json({
//     code: 201,
//     status: "success",
//     message: "Thread successfully posted",
//     data: post
//   });
// };

// export const getAllPosts = async (req: Request, res: Response): Promise<void> => {
//   const userId = parseInt(req.user?.userId || '0');

//   const posts = await prisma.threads.findMany({
//     include: {
//       user_created: { select: { username: true, id: true, name: true, profilePicture: true } },
//       // OPTIMASI: Gunakan _count untuk hitung likes dan comments tanpa fetch data penuh
//       _count: {
//         select: {
//           likes: true,
//           comments: true
//         }
//       },
//       // Tetap include likes untuk cek isLiked per user, tapi ini bisa dioptimasi dengan query khusus jika perlu
//       likes: { include: { user: { select: { id: true } } }, where: { user_id: userId } }
//     },
//     orderBy: { created_at: 'desc' },
//     take: 25
//   });

//   const threads = posts.map((post: any) => ({
//     id: post.id,
//     content: post.content,
//     image: post.image,
//     user: {
//       id: post.user_created.id,
//       username: post.user_created.username,
//       name: post.user_created.name,
//       profile_picture: post.user_created.profilePicture
//     },
//     created_at: post.created_at,
//     // OPTIMASI: Gunakan _count untuk performa
//     likes: post._count.likes,
//     reply: post._count.comments,
//     comments: [], // Kosong untuk list view
//     isLiked: post.likes.length > 0 // Jika ada like dari user tertentu
//   }));

//   res.json({
//     code: 200,
//     status: "success",
//     message: "Get Data Thread Successfully",
//     data: {
//       threads
//     }
//   });
// };

// export const getPostById = async (req: Request, res: Response): Promise<void> => {
//   const { id } = req.params;
//   const userId = parseInt(req.user?.userId || '0');

//   if (!id || isNaN(Number(id))) {
//     const idError = new Error('Invalid post id');
//     (idError as any).status = 400;
//     throw idError;
//   }
//   const post = await prisma.threads.findUnique({
//     where: { id: parseInt(id) },
//     include: {
//       user_created: { select: { username: true, id: true, name: true, profilePicture: true } },
//       // OPTIMASI: Gunakan _count untuk performa di detail view juga
//       _count: {
//         select: {
//           likes: true,
//           comments: true
//         }
//       },
//       likes: { include: { user: { select: { id: true } } } },
//       comments: {
//         include: { user: { select: { username: true, id: true, name: true, profilePicture: true } } },
//         orderBy: { created_at: 'desc' }
//       }
//     }
//   });

//   if (!post) {
//     const notFoundError = new Error('Post not found');
//     (notFoundError as any).status = 404;
//     throw notFoundError;
//   }

//   const thread = {
//     id: post.id,
//     content: post.content,
//     image: post.image,
//     user: {
//       id: post.user_created.id,
//       username: post.user_created.username,
//       name: post.user_created.name != null ? post.user_created.name : post.user_created.username,
//       profile_picture: post.user_created.profilePicture
//     },
//     created_at: post.created_at,
//     likes: post._count.likes,  // OPTIMASI
//     reply: post._count.comments,  // OPTIMASI
//     comments: post.comments,
//     isLiked: post.likes.some((like: { user_id: number }) => like.user_id === userId)
//   };

//   res.json({
//     code: 200,
//     status: "success",
//     message: "Get Thread Successfully",
//     data: thread
//   });
// };

// // updatePost dan deletePost tetap sama karena tidak ada perubahan query utama

// export const updatePost = async (req: Request, res: Response): Promise<void> => {
//   const { id } = req.params;
//   if (!id || isNaN(Number(id))) {
//     const idError = new Error('Invalid post id');
//     (idError as any).status = 400;
//     throw idError;
//   }
//   const userId = parseInt(req.user?.userId || '0');

//   // Check if post exists and user is owner
//   const existingPost = await prisma.threads.findUnique({
//     where: { id: parseInt(id) }
//   });

//   if (!existingPost) {
//     const notFoundError = new Error('Post not found');
//     (notFoundError as any).status = 404;
//     throw notFoundError;
//   }

//   if (existingPost.created_by !== userId) {
//     const authError = new Error('Not authorized to update this post');
//     (authError as any).status = 403;
//     throw authError;
//   }

//   // Validate request body without file
//   const body = { ...req.body };
//   const { error, value } = updatePostSchema.validate(body);
//   if (error) {
//     const validationError = new Error(error?.details?.[0]?.message || 'Validation failed');
//     (validationError as any).status = 400;
//     throw validationError;
//   }
//   const validatedValue = value!;

//   // Handle image update
//   let image = existingPost.image;
//   if (req.file) {
//     // Delete old image
//     if (existingPost.image) {
//       const oldImagePath = path.join(process.cwd(), 'src', existingPost.image);
//       if (fs.existsSync(oldImagePath)) {
//         fs.unlinkSync(oldImagePath);
//       }
//     }
//     image = '/uploads/' + req.file.filename;
//   }

//   const updateData: any = {
//     updated_by: userId
//   };

//   if (req.file || validatedValue.image !== undefined || validatedValue.content !== undefined) {
//     updateData.image = image;
//     if (validatedValue.content !== undefined) {
//       updateData.content = validatedValue.content;
//     }
//   }

//   const updatedPost = await prisma.threads.update({
//     where: { id: parseInt(id) },
//     data: updateData,
//     include: {
//       user_created: { select: { username: true, id: true } },
//       likes: { include: { user: { select: { username: true, id: true } } } },
//       comments: { include: { user: { select: { username: true, id: true } } } }
//     }
//   });

//   res.json(updatedPost);
// };

// export const deletePost = async (req: Request, res: Response): Promise<void> => {
//   const { id } = req.params;
//   if (!id || isNaN(Number(id))) {
//     const idError = new Error('Invalid post id');
//     (idError as any).status = 400;
//     throw idError;
//   }
//   const userId = parseInt(req.user?.userId || '0');

//   // Check if post exists and user is owner
//   const existingPost = await prisma.threads.findUnique({
//     where: { id: parseInt(id) }
//   });

//   if (!existingPost) {
//     const notFoundError = new Error('Post not found');
//     (notFoundError as any).status = 404;
//     throw notFoundError;
//   }

//   if (existingPost.created_by !== userId) {
//     const authError = new Error('Not authorized to delete this post');
//     (authError as any).status = 403;
//     throw authError;
//   }

//   // Delete associated image file
//   if (existingPost.image) {
//     const imagePath = path.join(process.cwd(), 'src', existingPost.image);
//     if (fs.existsSync(imagePath)) {
//       fs.unlinkSync(imagePath);
//     }
//   }

//   // Delete post (cascade will handle likes and comments if set)
//   await prisma.threads.delete({
//     where: { id: parseInt(id) }
//   });

//   res.json({ message: 'Post deleted successfully' });
// };

// export const getPostsByUserId = async (req: Request, res: Response): Promise<void> => {
//   const { id } = req.params;
//   const currentUserId = parseInt(req.user?.userId || '0');

//   if (!id || isNaN(Number(id))) {
//     const idError = new Error('Invalid user id');
//     (idError as any).status = 400;
//     throw idError;
//   }

//   const posts = await prisma.threads.findMany({
//     where: { created_by: parseInt(id) },
//     include: {
//       user_created: { select: { username: true, id: true, name: true, profilePicture: true } },
//       // OPTIMASI: Sama seperti getAllPosts
//       _count: {
//         select: {
//           likes: true,
//           comments: true
//         }
//       },
//       likes: { include: { user: { select: { id: true } } }, where: { user_id: currentUserId } }
//     },
//     orderBy: { created_at: 'desc' }
//   });

//   const threads = posts.map((post: any) => ({
//     id: post.id,
//     content: post.content,
//     image: post.image,
//     user: {
//       id: post.user_created.id,
//       username: post.user_created.username,
//       name: post.user_created.name,
//       profile_picture: post.user_created.profilePicture
//     },
//     created_at: post.created_at,
//     likes: post._count.likes,  // OPTIMASI
//     reply: post._count.comments,  // OPTIMASI
//     comments: post.comments,
//     isLiked: post.likes.length > 0
//   }));

//   res.json({
//     code: 200,
//     status: "success",
//     message: "Get User Posts Successfully",
//     data: {
//       threads
//     }
//   });
// };


// import type { Request, Response } from 'express';
// import prisma from '../connection/client.js';
// import fs from 'fs';
// import path from 'path';
// import { createPostSchema, updatePostSchema } from '../models/post.js';
// import { broadcastWebSocketNotificationExcept } from '../app.js';
// import { addImageProcessingJob } from '../services/queue.js';

// export const createPost = async (req: Request, res: Response): Promise<void> => {
//   const userId = parseInt(req.user?.userId || '0');

//   // Validate request body without file
//   const body = { ...req.body };
//   const { error, value } = createPostSchema.validate(body);
//   if (error || !value) {
//     const validationError = new Error(error?.details?.[0]?.message || 'Validation failed');
//     (validationError as any).status = 400;
//     throw validationError;
//   }
//   const validatedValue = value;

//   const image = req.file ? '/uploads/' + req.file.filename : null;

//   const post = await prisma.threads.create({
//     data: {
//       created_by: userId,
//       updated_by: userId,
//       image,
//       content: validatedValue.content
//     },
//     include: {
//       user_created: { select: { username: true, id: true, name: true, profilePicture: true } },
//       likes: { include: { user: { select: { id: true } } } },
//       comments: {
//         include: { user: { select: { username: true, id: true, name: true, profilePicture: true } } },
//         orderBy: { created_at: 'desc' }
//       }
//     }
//   });

//   // Format the thread data as expected by client
//   const thread = {
//     id: post.id,
//     content: post.content,
//     image: post.image,
//     user: {
//       id: post.user_created.id,
//       username: post.user_created.username,
//       name: post.user_created.name,
//       profile_picture: post.user_created.profilePicture
//     },
//     created_at: post.created_at,
//     likes: post.likes.length,
//     reply: post.comments.length,
//     comments: post.comments,
//     isLiked: false // new post, user hasn't liked it yet
//   };

//   // Broadcast new post notification via WebSocket, excluding the creator
//   broadcastWebSocketNotificationExcept(userId, {
//     type: 'new_post',
//     data: thread
//   });

//   // Queue image processing for background processing if there's an image
//   if (image) {
//     try {
//       await addImageProcessingJob({
//         threadId: post.id,
//         imagePath: image,
//         userId: userId
//       });
//       console.log(`Image processing job queued for thread ${post.id}, image: ${image}`);
//     } catch (queueError) {
//       console.error('Failed to queue image processing job:', queueError);
//     }
//   }

//   res.status(201).json({
//     code: 201,
//     status: "success",
//     message: "Thread successfully posted",
//     data: post
//   });
// };

// export const getAllPosts = async (req: Request, res: Response): Promise<void> => {
//   const userId = parseInt(req.user?.userId || '0');

//   const posts = await prisma.threads.findMany({
//     include: {
//       user_created: { select: { username: true, id: true, name: true, profilePicture: true } },
//       likes: { include: { user: { select: { id: true } } } },
//       comments: {
//         include: { user: { select: { username: true, id: true, name: true, profilePicture: true } } },
//         orderBy: { created_at: 'desc' }
//       }
//     },
//     orderBy: { created_at: 'desc' },
//     take: 25
//   });

//   const threads = posts.map((post: any) => ({
//     id: post.id,
//     content: post.content,
//     image: post.image,
//     user: {
//       id: post.user_created.id,
//       username: post.user_created.username,
//       name: post.user_created.name,
//       profile_picture: post.user_created.profilePicture
//     },
//     created_at: post.created_at,
//     likes: post.likes.length,
//     reply: post.comments.length,
//     comments: post.comments,
//     isLiked: post.likes.some((like: { user_id: number }) => like.user_id === userId)
//   }));

//   res.json({
//     code: 200,
//     status: "success",
//     message: "Get Data Thread Successfully",
//     data: {
//       threads
//     }
//   });
// };

// export const getPostById = async (req: Request, res: Response): Promise<void> => {
//   const { id } = req.params;
//   const userId = parseInt(req.user?.userId || '0');

//   if (!id || isNaN(Number(id))) {
//     const idError = new Error('Invalid post id');
//     (idError as any).status = 400;
//     throw idError;
//   }
//   const post = await prisma.threads.findUnique({
//     where: { id: parseInt(id) },
//     include: {
//       user_created: { select: { username: true, id: true, name: true, profilePicture: true } },
//       likes: { include: { user: { select: { id: true } } } },
//       comments: {
//         include: { user: { select: { username: true, id: true, name: true, profilePicture: true } } },
//         orderBy: { created_at: 'desc' }
//       }
//     }
//   });

//   if (!post) {
//     const notFoundError = new Error('Post not found');
//     (notFoundError as any).status = 404;
//     throw notFoundError;
//   }

//   const thread = {
//     id: post.id,
//     content: post.content,
//     image: post.image,
//     user: {
//       id: post.user_created.id,
//       username: post.user_created.username,
//       name: post.user_created.name != null ? post.user_created.name : post.user_created.username,
//       profile_picture: post.user_created.profilePicture
//     },
//     created_at: post.created_at,
//     likes: post.likes.length,
//     reply: post.comments.length,
//     comments: post.comments,
//     isLiked: post.likes.some((like: { user_id: number }) => like.user_id === userId)
//   };

//   res.json({
//     code: 200,
//     status: "success",
//     message: "Get Thread Successfully",
//     data: thread
//   });
// };

// export const updatePost = async (req: Request, res: Response): Promise<void> => {
//   const { id } = req.params;
//   if (!id || isNaN(Number(id))) {
//     const idError = new Error('Invalid post id');
//     (idError as any).status = 400;
//     throw idError;
//   }
//   const userId = parseInt(req.user?.userId || '0');

//   // Check if post exists and user is owner
//   const existingPost = await prisma.threads.findUnique({
//     where: { id: parseInt(id) }
//   });

//   if (!existingPost) {
//     const notFoundError = new Error('Post not found');
//     (notFoundError as any).status = 404;
//     throw notFoundError;
//   }

//   if (existingPost.created_by !== userId) {
//     const authError = new Error('Not authorized to update this post');
//     (authError as any).status = 403;
//     throw authError;
//   }

//   // Validate request body without file
//   const body = { ...req.body };
//   const { error, value } = updatePostSchema.validate(body);
//   if (error) {
//     const validationError = new Error(error?.details?.[0]?.message || 'Validation failed');
//     (validationError as any).status = 400;
//     throw validationError;
//   }
//   const validatedValue = value!;

//   // Handle image update
//   let image = existingPost.image;
//   if (req.file) {
//     // Delete old image
//     if (existingPost.image) {
//       const oldImagePath = path.join(process.cwd(), 'src', existingPost.image);
//       if (fs.existsSync(oldImagePath)) {
//         fs.unlinkSync(oldImagePath);
//       }
//     }
//     image = '/uploads/' + req.file.filename;
//   }

//   const updateData: any = {
//     updated_by: userId
//   };

//   if (req.file || validatedValue.image !== undefined || validatedValue.content !== undefined) {
//     updateData.image = image;
//     if (validatedValue.content !== undefined) {
//       updateData.content = validatedValue.content;
//     }
//   }

//   const updatedPost = await prisma.threads.update({
//     where: { id: parseInt(id) },
//     data: updateData,
//     include: {
//       user_created: { select: { username: true, id: true } },
//       likes: { include: { user: { select: { username: true, id: true } } } },
//       comments: { include: { user: { select: { username: true, id: true } } } }
//     }
//   });

//   res.json(updatedPost);
// };

// export const deletePost = async (req: Request, res: Response): Promise<void> => {
//   const { id } = req.params;
//   if (!id || isNaN(Number(id))) {
//     const idError = new Error('Invalid post id');
//     (idError as any).status = 400;
//     throw idError;
//   }
//   const userId = parseInt(req.user?.userId || '0');

//   // Check if post exists and user is owner
//   const existingPost = await prisma.threads.findUnique({
//     where: { id: parseInt(id) }
//   });

//   if (!existingPost) {
//     const notFoundError = new Error('Post not found');
//     (notFoundError as any).status = 404;
//     throw notFoundError;
//   }

//   if (existingPost.created_by !== userId) {
//     const authError = new Error('Not authorized to delete this post');
//     (authError as any).status = 403;
//     throw authError;
//   }

//   // Delete associated image file
//   if (existingPost.image) {
//     const imagePath = path.join(process.cwd(), 'src', existingPost.image);
//     if (fs.existsSync(imagePath)) {
//       fs.unlinkSync(imagePath);
//     }
//   }

//   // Delete post (cascade will handle likes and comments if set)
//   await prisma.threads.delete({
//     where: { id: parseInt(id) }
//   });

//   res.json({ message: 'Post deleted successfully' });
// };

// export const getPostsByUserId = async (req: Request, res: Response): Promise<void> => {
//   const { id } = req.params;
//   const currentUserId = parseInt(req.user?.userId || '0');

//   if (!id || isNaN(Number(id))) {
//     const idError = new Error('Invalid user id');
//     (idError as any).status = 400;
//     throw idError;
//   }

//   const posts = await prisma.threads.findMany({
//     where: { created_by: parseInt(id) },
//     include: {
//       user_created: { select: { username: true, id: true, name: true, profilePicture: true } },
//       likes: { include: { user: { select: { id: true } } } },
//       comments: {
//         include: { user: { select: { username: true, id: true, name: true, profilePicture: true } } },
//         orderBy: { created_at: 'desc' }
//       }
//     },
//     orderBy: { created_at: 'desc' }
//   });

//   const threads = posts.map((post: any) => ({
//     id: post.id,
//     content: post.content,
//     image: post.image,
//     user: {
//       id: post.user_created.id,
//       username: post.user_created.username,
//       name: post.user_created.name,
//       profile_picture: post.user_created.profilePicture
//     },
//     created_at: post.created_at,
//     likes: post.likes.length,
//     reply: post.comments.length,
//     comments: post.comments,
//     isLiked: post.likes.some((like: { user_id: number }) => like.user_id === currentUserId)
//   }));

//   res.json({
//     code: 200,
//     status: "success",
//     message: "Get User Posts Successfully",
//     data: {
//       threads
//     }
//   });
// };
