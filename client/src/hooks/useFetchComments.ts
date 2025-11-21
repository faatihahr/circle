import { useState, useEffect } from 'react';
import { commentsAPI } from '../lib/api';

export interface Comment {
  id: number;
  content: string;
  image?: string;
  created_at: string;
  user: {
    id: number;
    username: string;
    name: string;
    profilePicture?: string;
  };
}

export const useFetchComments = (threadId: number, triggerRefetch: boolean = false) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = async () => {
    if (!threadId) return;

    setLoading(true);
    try {
      const response = await commentsAPI.getCommentsByThread(threadId.toString());
      if (response.code === 200) {
        setComments(response.data.comments);
        setError(null);
      } else {
        throw new Error('Failed to fetch comments');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (triggerRefetch) {
      fetchComments();
    }
  }, [threadId, triggerRefetch]);

  return { comments, loading, error, refetch: fetchComments };
};
