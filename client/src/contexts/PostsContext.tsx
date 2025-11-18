import React, { createContext, useContext, useEffect } from 'react';
import { useFetchPosts } from '../hooks/useFetchPosts';
import type { Thread } from '../hooks/useFetchPosts';
import { useAppDispatch, useAppSelector } from '../stores/hooks';
import { setThreads, setLoading, setError } from '../stores/postsSlice';
import type { PostsState } from '../stores/postsSlice';

interface PostsContextType {
  threads: Thread[];
  loading: boolean;
  error: string | null;
}

const PostsContext = createContext<PostsContextType | undefined>(undefined);

export const usePosts = () => {
  const context = useContext(PostsContext);
  if (!context) {
    throw new Error('usePosts must be used within a PostsProvider');
  }
  return context;
};

interface PostsProviderProps {
  children: React.ReactNode;
}

export const PostsProvider: React.FC<PostsProviderProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const postsState = useAppSelector(state => state.posts as PostsState);
  const { threads: reduxThreads, loading, error } = postsState;
  const { threads: fetchedThreads, loading: fetchLoading, error: fetchError } = useFetchPosts();

  useEffect(() => {
    dispatch(setLoading(fetchLoading));
    if (fetchError) {
      dispatch(setError(fetchError));
    }
  }, [fetchLoading, fetchError, dispatch]);

  useEffect(() => {
    if (fetchedThreads.length > 0) {
      dispatch(setThreads(fetchedThreads));
    }
  }, [fetchedThreads, dispatch]);

  const value: PostsContextType = {
    threads: reduxThreads,
    loading,
    error,
  };

  return <PostsContext.Provider value={value}>{children}</PostsContext.Provider>;
};
