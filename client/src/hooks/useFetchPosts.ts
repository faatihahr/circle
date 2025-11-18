import { useState, useEffect } from 'react';
import { postsAPI } from '../lib/api';

export interface Thread {
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
  isLiked: boolean;
}

export const useFetchPosts = () => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchThreadsData = async () => {
      try {
        const response = await postsAPI.getAllPosts();
        if (response.code === 200) {
          setThreads(response.data.threads);
        } else {
          setError('Failed to fetch threads');
        }
      } catch (err) {
        setError('Error fetching threads data');
      } finally {
        setLoading(false);
      }
    };

    fetchThreadsData();
  }, []);

  return { threads, loading, error };
};
