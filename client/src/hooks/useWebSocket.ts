import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppDispatch } from '../stores/hooks';
import { addNewThread } from '../stores/postsSlice';

export const useWebSocket = () => {
  const { user, isAuthenticated } = useAuth();
  const dispatch = useAppDispatch();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    const connectWebSocket = () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      const wsUrl = `ws://localhost:3000?token=${token}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'new_post' && message.data) {
            // Only add posts from other users to avoid any potential duplicates (server excludes creator)
            if (message.data.user.id !== user.id) {
              dispatch(addNewThread(message.data));
              console.log('New post received via WebSocket from another user:', message.data);
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        wsRef.current = null;
        // Attempt to reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      wsRef.current = ws;
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [isAuthenticated, user, dispatch]);

  return wsRef.current;
};
