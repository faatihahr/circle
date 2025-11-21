import { useState, useEffect } from 'react';
import { postsAPI } from '../lib/api';
import { useAppSelector, useAppDispatch } from '../stores/hooks';
import { updateThreadLikeStatus, updateThreadReplyCount, setThreads } from '../stores/postsSlice';
import { useAuth } from '../contexts/AuthContext';
import type { Thread as ReduxThread } from '../hooks/useFetchPosts';

interface Thread {
  id: number;
  content: string;
  image: string | null;
  user: {
    id: number;
    username: string;
    name: string;
    profile_picture: string | null;
  };
  created_at: string;
  likes: number;
  reply: number;
  comments: any[];
  isLiked: boolean;
}

export const useFetchUserPosts = (userId: number | null) => {
  const { user: currentUser } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserPosts = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);
    try {
      const response = await postsAPI.getPostsByUserId(userId.toString());
      if (response.code === 200 && response.data?.threads) {
        setThreads(response.data.threads);
        // Note: Removed Redux storage to avoid conflicts with profile-specific state management
        // Each context (main feed vs profile) manages its own state now
      } else {
        setError('Failed to fetch posts');
      }
    } catch (error: any) {
      console.error('Error fetching user posts:', error);
      setError(error.response?.data?.message || 'Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  const dispatch = useAppDispatch();

  useEffect(() => {
    if (userId) {
      fetchUserPosts();
    }
  }, [userId]);

  // Listen for real-time WebSocket updates (new posts, comments from other users)
  useEffect(() => {
    const handleWebSocketMessage = (event: CustomEvent) => {
      if (event.detail) {
        const message = event.detail;
        if (message.type === 'new_post' && message.data && message.data.user.id !== currentUser?.id) {
          // New post from another user - refetch this user's posts
          if (message.data.user.id.toString() === userId?.toString()) {
            fetchUserPosts();
          }
        } else if (message.type === 'new_comment' && message.data && message.data.user.id !== currentUser?.id) {
          // New comment from another user - update reply count
          const threadId = message.data.thread.id;
          setThreads(currentThreads => {
            return currentThreads.map(thread => {
              if (thread.id === threadId && message.data.thread.user_id?.toString() === userId?.toString()) {
                return { ...thread, reply: thread.reply + 1 };
              }
              return thread;
            });
          });
        }
      }
    };

    window.addEventListener('wsMessage', handleWebSocketMessage as EventListener);
    return () => window.removeEventListener('wsMessage', handleWebSocketMessage as EventListener);
  }, [userId, currentUser?.id]);

  const updateLikeStatus = (threadId: number, isLiked: boolean, likesCount: number) => {
    setThreads(currentThreads =>
      currentThreads.map(thread =>
        thread.id === threadId ? { ...thread, isLiked, likes: likesCount } : thread
      )
    );
  };

  const updateReplyCount = (threadId: number, replyCount: number) => {
    setThreads(currentThreads =>
      currentThreads.map(thread =>
        thread.id === threadId ? { ...thread, reply: replyCount } : thread
      )
    );
  };

  return {
    threads,
    loading,
    error,
    refetch: fetchUserPosts,
    updateLikeStatus,
    updateReplyCount
  };
};
