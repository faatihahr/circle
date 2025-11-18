import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import authRoute from './routes/auth.js';
import postRoute from './routes/post.js';
import commentRoute from './routes/comment.js';
import cors from 'cors';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import jwt from 'jsonwebtoken';

dotenv.config();

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

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// WebSocket server
const wss = new WebSocketServer({ server });

wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
  const token = request.url?.split('token=')[1]; // Assume token in URL params

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as { userId: number };
      const userId = decoded.userId;

      clients.set(userId, ws);

      ws.on('close', () => {
        clients.delete(userId);
      });

      ws.send(JSON.stringify({ type: 'connected', message: 'WebSocket connected' }));
    } catch (err) {
      ws.close(1008, 'Invalid token');
    }
  } else {
    ws.close(1008, 'No token provided');
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
