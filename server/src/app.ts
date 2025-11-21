// Load environment variables as early as possible
import './loadEnv.js';

import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import authRoute from './routes/auth.js';
import postRoute from './routes/post.js';
import commentRoute from './routes/comment.js';
import followRoute from './routes/follow.js';
import { notificationQueue, imageProcessingQueue } from './services/queue.js';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = process.env.PORT || 3000;

// WebSocket connections map
const clients = new Map<number, WebSocket>();

app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(process.cwd(), 'src', 'uploads')));

app.use('/api/user', authRoute);
app.use('/api/posts', postRoute);
app.use('/api/comments', commentRoute);
app.use('/api/follow', followRoute);

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
