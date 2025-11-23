import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppDispatch } from '../stores/hooks';
import { addNewThread, updateThreadReplyCount } from '../stores/postsSlice';
import { getProfile } from '../stores/userSlice';
import { addNotification } from '../stores/notificationsSlice';

export const useWebSocket = () => {
  const { user, isAuthenticated } = useAuth();
  const dispatch = useAppDispatch();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const userIdRef = useRef<number | null>(null);

  useEffect(() => {
    userIdRef.current = user?.id ? parseInt(user.id.toString()) : null;
  }, [user?.id]);

  // Create a stable message handler to avoid recreation on each render
  const handleMessage = useCallback((event: MessageEvent) => {
    const currentUserId = userIdRef.current;
    if (!currentUserId) return;

    try {
      const message = JSON.parse(event.data);
      if (message.type === 'new_post' && message.data) {
        // Only add posts from other users to avoid any potential duplicates (server excludes creator)
        if (message.data.user.id !== currentUserId) {
          dispatch(addNewThread(message.data));
          console.log('New post received via WebSocket from another user:', message.data);
        }
      } else if (message.type === 'new_comment' && message.data) {
        // Update reply count for the thread only if the comment is not from the current user
        // (since own comments are already updated locally)
        if (message.data.user.id !== currentUserId) {
          const threadId = message.data.thread.id;
          dispatch(updateThreadReplyCount({ threadId, increment: 1 }));
          console.log('New comment received via WebSocket:', message.data);
        }
      } else if (message.type === 'follow_update' && message.data) {
        const { followerId, followedId, action } = message.data;
        // If the current user is affected, refetch profile
        if (followerId === currentUserId || followedId === currentUserId) {
          console.log('Follow update affects current user, refetching profile');
          dispatch(getProfile() as any);
        }
        // Emit custom event for viewed user refetch
        const customEvent = new CustomEvent('followUpdate', { detail: { followedId, followerId, action } });
        window.dispatchEvent(customEvent);
      } else if (message.type === 'notification' && message.data) {
        // Add real-time notification to the store
        dispatch(addNotification(message.data));
        console.log('🐛 DEBUG WebSocket notification received:', message.data.message);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }, [dispatch]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      return;
    }

    // If already connected, no need to reconnect
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return;
    }

    const connectWebSocket = () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      const wsUrl = `ws://localhost:3000/ws?token=${token}`;
      console.log('Attempting WebSocket connection to:', wsUrl.replace(/token=.*/, 'token=[HIDDEN]'));
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected successfully');
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = handleMessage;

      ws.onclose = (event) => {
        console.log('WebSocket disconnected', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean
        });
        wsRef.current = null;
        // Only reconnect if this wasn't due to a clean close (navigating away or logout)
        if (event.code !== 1000) {
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
        }
      };

      ws.onerror = (errorEvent) => {
        console.error('WebSocket error:', {
          readyState: ws.readyState,
          url: ws.url,
          errorEvent: errorEvent,
          message: (errorEvent as ErrorEvent).message,
          code: (errorEvent as CloseEvent).code,
          reason: (errorEvent as CloseEvent).reason
        });
      };

      wsRef.current = ws;
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component cleanup');
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [isAuthenticated, user, handleMessage]);

  return wsRef.current;
};
