import React, { useState, useEffect, useCallback } from 'react';
import PostCard from './PostCard';
import PostCardSkeleton from './PostCardSkeleton';
import CreatePost from './CreatePost';
import { useAppSelector, useAppDispatch } from '../stores/hooks';
import { fetchPosts, fetchMorePosts } from '../stores/postsSlice'; // Tambah fetchMorePosts

const PostList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { threads, loading, loadingMore, hasMore, nextCursor } = useAppSelector(state => state.posts); // Tambah pagination fields
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    if (threads.length === 0) {
      // Initial fetch posts saat komponen mount
      dispatch(fetchPosts());
    }
  }, [dispatch, threads.length]);

  useEffect(() => {
    setShowSkeleton(loading);
  }, [loading]);

  // FUNCTION BARU: Infinite scroll handler
  const loadMorePosts = useCallback(() => {
    if (hasMore && nextCursor && !loadingMore) {
      dispatch(fetchMorePosts({ cursor: nextCursor })); // Fetch more dengan cursor
    }
  }, [dispatch, hasMore, nextCursor, loadingMore]);

  // SCROLL DETECTOR
  const handleScroll = useCallback(() => {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    
    // Trigger load more ketika 100px dari bottom
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      loadMorePosts();
    }
  }, [loadMorePosts]);

  useEffect(() => {
    // Add scroll listener to window
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  return (
    <div className="max-w-2xl mx-auto p-4 grid grid-cols-1 grid-rows-[auto,auto,1fr] gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-sm font-bold">Home</h1>
      </div>
      <CreatePost />
      <div>
        <PostsContent />
        {/* LOADING INDICATOR UNTUK PAGINATION */}
        {loadingMore && (
          <div className="text-center p-4">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
            <span className="text-sm text-muted-foreground mt-2">Loading more posts...</span>
          </div>
        )}
        {/* END OF FEED MESSAGE */}
        {!hasMore && threads.length > 10 && (
          <div className="text-center p-4 text-muted-foreground text-sm">
            You've reached the end of the feed!
          </div>
        )}
      </div>
    </div>
  );
};

const PostsContent: React.FC = () => {
  const { threads, loading, error } = useAppSelector(state => state.posts);
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    setShowSkeleton(loading);
  }, [loading]);

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

  if (threads.length === 0 && !showSkeleton) return <div className="text-center p-4">No posts yet.</div>;

  return (
    <>
      {threads.map((thread) => (
        <PostCard key={thread.id} thread={thread} />
      ))}
    </>
  );
};

export default PostList;




// import React, { useState, useEffect } from 'react';
// import PostCard from './PostCard';
// import PostCardSkeleton from './PostCardSkeleton';
// import CreatePost from './CreatePost';
// import { usePosts } from '../contexts/PostsContext';

// const PostList: React.FC = () => {
//   const { loading } = usePosts();
//   const [showSkeleton, setShowSkeleton] = useState(false);

//   useEffect(() => {
//     setShowSkeleton(loading);
//   }, [loading]);

//   return (
//     <div className="max-w-2xl mx-auto p-4 grid grid-cols-1 grid-rows-[auto,auto,1fr] gap-4">
//       <div className="flex justify-between items-center">
//         <h1 className="text-sm font-bold">Home</h1>
//       </div>
//       <CreatePost />
//       <div>
//         <PostsContent />
//       </div>
//     </div>
//   );
// };

// const PostsContent: React.FC = () => {
//   const { threads, loading, error } = usePosts();
//   const [showSkeleton, setShowSkeleton] = useState(false);

//   useEffect(() => {
//     setShowSkeleton(loading);
//   }, [loading]);

//   console.log('🔍 PostList PostsContent - Show skeleton:', showSkeleton, 'threads:', threads.length, 'loading:', loading);

//   if (showSkeleton) {
//     return (
//       <>
//         {[...Array(5)].map((_, index) => (
//           <PostCardSkeleton key={index} />
//         ))}
//       </>
//     );
//   }

//   if (error) return <div className="text-center p-4 text-destructive">Error: {error}</div>;

//   if (threads.length === 0) return <div className="text-center p-4">No posts yet.</div>;

//   return (
//     <>
//       {threads.map((thread) => (
//         <PostCard key={thread.id} thread={thread} />
//       ))}
//     </>
//   );
// };

// export default PostList;
