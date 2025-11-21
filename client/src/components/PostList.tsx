import React, { useState, useEffect } from 'react';
import PostCard from './PostCard';
import PostCardSkeleton from './PostCardSkeleton';
import CreatePost from './CreatePost';
import { ScrollArea } from './ui/scroll-area';
import { usePosts } from '../contexts/PostsContext';

const PostList: React.FC = () => {
  const { threads, loading, error } = usePosts();
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    setShowSkeleton(loading);
  }, [loading]);

  return (
    <div className="max-w-2xl mx-auto p-4 grid grid-cols-1 grid-rows-[auto,auto,1fr] gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-sm font-bold">Home</h1>
      </div>
      <CreatePost />
      <div>
        <PostsContent />
      </div>
    </div>
  );
};

const PostsContent: React.FC = () => {
  const { threads, loading, error } = usePosts();
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    setShowSkeleton(loading);
  }, [loading]);

  console.log('🔍 PostList PostsContent - Show skeleton:', showSkeleton, 'threads:', threads.length, 'loading:', loading);

  if (showSkeleton) {
    return (
      <>
        {[...Array(5)].map((_, index) => (
          <PostCardSkeleton key={index} />
        ))}
      </>
    );
  }

  if (error) return <div className="text-center p-4 text-destructive">Error: {error}</div>;

  if (threads.length === 0) return <div className="text-center p-4">No posts yet.</div>;

  return (
    <>
      {threads.map((thread) => (
        <PostCard key={thread.id} thread={thread} />
      ))}
    </>
  );
};

export default PostList;
