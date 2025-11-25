// Load environment variables as early as possible
import './loadEnv.js';

import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import authRoute from './routes/auth.js';
import postRoute from './routes/post.js';
import commentRoute from './routes/comment.js';
import followRoute from './routes/follow.js';
import searchRoute from './routes/search.js';
import notificationRoute from './routes/notification.js';
import { notificationQueue, imageProcessingQueue } from './services/queue.js';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import jwt from 'jsonwebtoken';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';

const app = express();
const PORT = process.env.PORT || 3000;

// WebSocket connections map
const clients = new Map<number, WebSocket>();

// Swagger options
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Social Media API',
      version: '1.0.0',
      description: 'API documentation untuk aplikasi social media dengan fitur posts, comments, likes, dan notifications'
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        // ===== USER/AUTH SCHEMAS =====
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', description: 'User ID' },
            username: { type: 'string', description: 'Unique username' },
            email: { type: 'string', format: 'email', description: 'User email' },
            name: { type: 'string', nullable: true, description: 'Display name' },
            bio: { type: 'string', nullable: true, description: 'User biography' },
            profilePicture: { type: 'string', nullable: true, description: 'Profile picture URL' },
            image_headers: { type: 'string', nullable: true, description: 'Image headers metadata' },
            followersCount: { type: 'integer', description: 'Number of followers' },
            followingCount: { type: 'integer', description: 'Number of users being followed' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },

        UserBasic: {
          type: 'object',
          description: 'Basic user information',
          properties: {
            id: { type: 'integer', description: 'User ID' },
            username: { type: 'string', description: 'Username' },
            name: { type: 'string', nullable: true, description: 'Display name' },
            profilePicture: { type: 'string', nullable: true, description: 'Profile picture URL' }
          }
        },

        UserProfile: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            username: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string', nullable: true },
            bio: { type: 'string', nullable: true },
            profilePicture: { type: 'string', nullable: true },
            image_headers: { type: 'string', nullable: true },
            followersCount: { type: 'integer' },
            followingCount: { type: 'integer' }
          }
        },

        // ===== POST/THREAD SCHEMAS =====
        Post: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            content: { type: 'string' },
            image: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            created_by: { type: 'integer' },
            updated_by: { type: 'integer' },
            user_created: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                username: { type: 'string' },
                name: { type: 'string', nullable: true },
                profilePicture: { type: 'string', nullable: true }
              }
            },
            likes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  user: { type: 'object' }
                }
              }
            },
            comments: { type: 'array', items: { type: 'object' } }
          }
        },

        PostSummary: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            content: { type: 'string' },
            image: { type: 'string', nullable: true },
            user: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                username: { type: 'string' },
                name: { type: 'string', nullable: true },
                profile_picture: { type: 'string', nullable: true }
              }
            },
            created_at: { type: 'string', format: 'date-time' },
            likes: { type: 'integer' },
            reply: { type: 'integer' },
            comments: { type: 'array' },
            isLiked: { type: 'boolean' }
          }
        },

        PostDetail: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            content: { type: 'string' },
            image: { type: 'string', nullable: true },
            user: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                username: { type: 'string' },
                name: { type: 'string', nullable: true },
                profile_picture: { type: 'string', nullable: true }
              }
            },
            created_at: { type: 'string', format: 'date-time' },
            likes: { type: 'integer' },
            reply: { type: 'integer' },
            comments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  content: { type: 'string' },
                  created_at: { type: 'string', format: 'date-time' },
                  user: {
                    type: 'object',
                    properties: {
                      username: { type: 'string' },
                      id: { type: 'integer' },
                      name: { type: 'string', nullable: true },
                      profilePicture: { type: 'string', nullable: true }
                    }
                  }
                }
              }
            },
            isLiked: { type: 'boolean' }
          }
        },

        // ===== COMMENT SCHEMAS =====
        Comment: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            content: { type: 'string' },
            image: { type: 'string', nullable: true },
            thread_id: { type: 'integer' },
            parent_id: { type: 'integer', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            created_by: { type: 'integer' },
            updated_by: { type: 'integer' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                username: { type: 'string' },
                name: { type: 'string', nullable: true },
                profilePicture: { type: 'string', nullable: true }
              }
            },
            thread: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                content: { type: 'string' }
              }
            },
            parent: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'integer' },
                content: { type: 'string' },
                user: {
                  type: 'object',
                  properties: {
                    username: { type: 'string' },
                    name: { type: 'string' }
                  }
                }
              }
            }
          }
        },

        CommentWithNestedReplies: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            content: { type: 'string' },
            image: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                username: { type: 'string' },
                name: { type: 'string', nullable: true },
                profilePicture: { type: 'string', nullable: true }
              }
            },
            replies: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  content: { type: 'string' },
                  image: { type: 'string', nullable: true },
                  created_at: { type: 'string', format: 'date-time' },
                  user: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer' },
                      username: { type: 'string' },
                      name: { type: 'string', nullable: true },
                      profilePicture: { type: 'string', nullable: true }
                    }
                  },
                  parent: {
                    type: 'object',
                    nullable: true,
                    properties: {
                      id: { type: 'integer' },
                      user: {
                        type: 'object',
                        properties: {
                          username: { type: 'string' }
                        }
                      }
                    }
                  },
                  replies: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer' },
                        content: { type: 'string' },
                        created_at: { type: 'string', format: 'date-time' },
                        user: {
                          type: 'object',
                          properties: {
                            username: { type: 'string' },
                            name: { type: 'string', nullable: true }
                          }
                        },
                        parent: {
                          type: 'object',
                          properties: {
                            id: { type: 'integer' },
                            user: {
                              type: 'object',
                              properties: {
                                username: { type: 'string' }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            comment_likes: { type: 'array', items: { type: 'object' } }
          }
        },

        // ===== FOLLOW SCHEMAS =====
        Follow: {
          type: 'object',
          properties: {
            follower_id: { type: 'integer' },
            following_id: { type: 'integer' },
            created_at: { type: 'string', format: 'date-time' },
            follower: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                username: { type: 'string' },
                name: { type: 'string', nullable: true },
                profilePicture: { type: 'string', nullable: true }
              }
            },
            following: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                username: { type: 'string' },
                name: { type: 'string', nullable: true },
                profilePicture: { type: 'string', nullable: true }
              }
            }
          }
        },

        // ===== NOTIFICATION SCHEMAS =====
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'integer', description: 'Notification ID' },
            type: { 
              type: 'string', 
              enum: ['like', 'comment', 'comment_like', 'follow'],
              description: 'Type of notification'
            },
            message: { type: 'string', description: 'Notification message' },
            is_read: { type: 'boolean', description: 'Whether notification has been read' },
            related_id: { type: 'integer', description: 'Related entity ID (post, comment, user, etc.)' },
            created_at: { type: 'string', format: 'date-time', description: 'When notification was created' },
            user: {
              type: 'object',
              description: 'User who triggered the notification',
              nullable: true,
              properties: {
                username: { type: 'string' },
                name: { type: 'string', nullable: true },
                profilePicture: { type: 'string', nullable: true }
              }
            }
          }
        },

        // ===== AUTHENTICATION SCHEMAS =====
        LoginRequest: {
          type: 'object',
          required: ['login', 'password'],
          properties: {
            login: { type: 'string', description: 'Username or email address' },
            password: { type: 'string', description: 'User password' }
          }
        },

        RegisterRequest: {
          type: 'object',
          required: ['username', 'email', 'password'],
          properties: {
            username: { type: 'string', minLength: 3, maxLength: 50, description: 'Unique username' },
            email: { type: 'string', format: 'email', description: 'Valid email address' },
            password: { type: 'string', minLength: 8, description: 'Password with requirements' },
            name: { type: 'string', description: 'Optional display name' }
          }
        },

        AuthResponse: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            token: { type: 'string', description: 'JWT authentication token' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                username: { type: 'string' },
                email: { type: 'string' }
              }
            }
          }
        },

        // ===== PAGINATION SCHEMA =====
        PaginationResponse: {
          type: 'object',
          properties: {
            page: { type: 'integer' },
            limit: { type: 'integer' },
            total: { type: 'integer', description: 'Total items' },
            totalPages: { type: 'integer' }
          }
        }
      }
    },
    security: [{
      bearerAuth: []
    }],
  },
  apis: ['./src/routes/*.ts'], // paths to files containing OpenAPI definitions
};

// Generate Swagger specs
const swaggerSpec = swaggerJSDoc(swaggerOptions);

app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(process.cwd(), 'src', 'uploads')));

app.use('/api/user', authRoute);
app.use('/api/posts', postRoute);
app.use('/api/comments', commentRoute);
app.use('/api/follow', followRoute);
app.use('/api/search', searchRoute);
app.use('/api/notifications', notificationRoute);

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// WebSocket server
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
  try {
    console.log('Incoming WS connection:', request.url);
    console.log(' - headers:', request.headers);
    const token = request.url?.split('token=')[1];

    if (!token) {
      console.warn('WebSocket rejected: no token provided');
      ws.close(1008, 'No token provided');
      return;
    }

    let decoded: any = null;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
      console.log('WebSocket token decoded for userId:', (decoded as any).userId);
    } catch (err) {
      console.warn('WebSocket rejected: invalid token', err);
      ws.close(1008, 'Invalid token');
      return;
    }

    const userId = (decoded as any).userId;

    // Close existing connection for this user
    const existingWs = clients.get(userId);
    if (existingWs && existingWs.readyState === WebSocket.OPEN) {
      console.log(`Closing existing connection for user ${userId}`);
      existingWs.close(1000, 'New connection established');
    }

    clients.set(userId, ws);

    ws.on('close', (code, reason) => {
      console.log(`WS closed for user ${userId}: code=${code} reason=${reason}`);
      clients.delete(userId);
    });

    ws.on('error', (err) => {
      console.error('WS error for user', userId, err);
    });

    ws.on('message', (msg) => {
      console.log('WS message from', userId, msg.toString());
    });

    ws.send(JSON.stringify({ type: 'connected', message: 'WebSocket connected' }));
    console.log('WebSocket connection established for user', userId);
  } catch (err) {
    console.error('Unexpected error in WS connection handler', err);
    try { ws.close(1011, 'Internal error'); } catch {}
  }
});

// Function to send notification to a specific user
export const sendWebSocketNotification = (userId: number, data: any) => {
  const ws = clients.get(userId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
};

// Broadcast to all connected clients
export const broadcastWebSocketNotification = (data: any) => {
  clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  });
};

// Broadcast to all connected clients except the specified user
export const broadcastWebSocketNotificationExcept = (excludeUserId: number, data: any) => {
  clients.forEach((ws, userId) => {
    if (userId !== excludeUserId && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  });
};


// // Load environment variables as early as possible
// import './loadEnv.js';

// import express from 'express';
// import cookieParser from 'cookie-parser';
// import path from 'path';
// import authRoute from './routes/auth.js';
// import postRoute from './routes/post.js';
// import commentRoute from './routes/comment.js';
// import followRoute from './routes/follow.js';
// import searchRoute from './routes/search.js';
// import notificationRoute from './routes/notification.js';
// import { notificationQueue, imageProcessingQueue } from './services/queue.js';
// import cors from 'cors';
// import { WebSocketServer, WebSocket } from 'ws';
// import { IncomingMessage } from 'http';
// import jwt from 'jsonwebtoken';
// import swaggerUi from 'swagger-ui-express';
// import swaggerJSDoc from 'swagger-jsdoc';

// const app = express();
// const PORT = process.env.PORT || 3000;

// // WebSocket connections map
// const clients = new Map<number, WebSocket>();

// // Swagger options
// const swaggerOptions = {
//   definition: {
//     openapi: '3.0.0',
//     info: {
//       title: 'Social Media API',
//       version: '1.0.0',
//       description: 'API documentation untuk aplikasi social media dengan fitur posts, comments, likes, dan notifications'
//     },
//     servers: [
//       {
//         url: `http://localhost:${PORT}`,
//         description: 'Development server',
//       },
//     ],
//     components: {
//       securitySchemes: {
//         bearerAuth: {
//           type: 'http',
//           scheme: 'bearer',
//           bearerFormat: 'JWT',
//         },
//       },
//     },
//     security: [{
//       bearerAuth: []
//     }],
//   },
//   apis: ['./src/routes/*.ts'], // paths to files containing OpenAPI definitions
// };

// // Generate Swagger specs
// const swaggerSpec = swaggerJSDoc(swaggerOptions);

// app.use(cors({ origin: true, credentials: true }));
// app.use(cookieParser());
// app.use(express.json());

// // Serve static files from uploads directory
// app.use('/uploads', express.static(path.join(process.cwd(), 'src', 'uploads')));

// app.use('/api/user', authRoute);
// app.use('/api/posts', postRoute);
// app.use('/api/comments', commentRoute);
// app.use('/api/follow', followRoute);
// app.use('/api/search', searchRoute);
// app.use('/api/notifications', notificationRoute);

// // Swagger UI
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// const server = app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });


// // WebSocket server
// const wss = new WebSocketServer({ server, path: '/ws' });

// wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
//   try {
//     console.log('Incoming WS connection:', request.url);
//     console.log(' - headers:', request.headers);
//     const token = request.url?.split('token=')[1];

//     if (!token) {
//       console.warn('WebSocket rejected: no token provided');
//       ws.close(1008, 'No token provided');
//       return;
//     }

//     let decoded: any = null;
//     try {
//       decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
//       console.log('WebSocket token decoded for userId:', (decoded as any).userId);
//     } catch (err) {
//       console.warn('WebSocket rejected: invalid token', err);
//       ws.close(1008, 'Invalid token');
//       return;
//     }

//     const userId = (decoded as any).userId;

//     // Close existing connection for this user
//     const existingWs = clients.get(userId);
//     if (existingWs && existingWs.readyState === WebSocket.OPEN) {
//       console.log(`Closing existing connection for user ${userId}`);
//       existingWs.close(1000, 'New connection established');
//     }

//     clients.set(userId, ws);

//     ws.on('close', (code, reason) => {
//       console.log(`WS closed for user ${userId}: code=${code} reason=${reason}`);
//       clients.delete(userId);
//     });

//     ws.on('error', (err) => {
//       console.error('WS error for user', userId, err);
//     });

//     ws.on('message', (msg) => {
//       console.log('WS message from', userId, msg.toString());
//     });

//     ws.send(JSON.stringify({ type: 'connected', message: 'WebSocket connected' }));
//     console.log('WebSocket connection established for user', userId);
//   } catch (err) {
//     console.error('Unexpected error in WS connection handler', err);
//     try { ws.close(1011, 'Internal error'); } catch {}
//   }
// });

// // Function to send notification to a specific user
// export const sendWebSocketNotification = (userId: number, data: any) => {
//   const ws = clients.get(userId);
//   if (ws && ws.readyState === WebSocket.OPEN) {
//     ws.send(JSON.stringify(data));
//   }
// };

// // Broadcast to all connected clients
// export const broadcastWebSocketNotification = (data: any) => {
//   clients.forEach((ws) => {
//     if (ws.readyState === WebSocket.OPEN) {
//       ws.send(JSON.stringify(data));
//     }
//   });
// };

// // Broadcast to all connected clients except the specified user
// export const broadcastWebSocketNotificationExcept = (excludeUserId: number, data: any) => {
//   clients.forEach((ws, userId) => {
//     if (userId !== excludeUserId && ws.readyState === WebSocket.OPEN) {
//       ws.send(JSON.stringify(data));
//     }
//   });
// };
