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
    console.log('🔄 Starting to fetch posts...');
    const fetchThreadsData = async () => {
      try {
        console.log('🚀 Calling postsAPI.getAllPosts()...');
        const response = await postsAPI.getAllPosts();
        console.log('📨 API Response:', response);

        if (response.code === 200) {
          console.log('✅ Setting threads:', response.data.threads.length, 'posts');
          setThreads(response.data.threads);
        } else {
          console.log('❌ API returned code:', response.code);
          setError('Failed to fetch threads');
        }
      } catch (err) {
        console.error('💥 Error fetching threads:', err);
        setError('Error fetching threads data');
      } finally {
        console.log('🏁 Finished loading, setting loading to false');
        setLoading(false);
      }
    };

    fetchThreadsData();
  }, []);

  console.log('🔍 useFetchPosts state:', { threads: threads.length, loading, error });

  return { threads, loading, error };
};
