import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PostsProvider, usePosts } from '../contexts/PostsContext';
import PostCard from '../components/PostCard';
import CreatePost from '../components/CreatePost';
import { Button } from '../components/ui/button';
import { LogOut } from 'lucide-react';
import PostCardSkeleton from '@/components/PostCardSkeleton';
import { useWebSocket } from '../hooks/useWebSocket';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Establish WebSocket connection for real-time updates
  useWebSocket();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <PostsProvider>
      <div className="min-h-screen bg-card grid grid-cols-12 gap-4 p-4">
        {/* Left sidebar */}
        <aside className="col-span-2 bg-card p-4 rounded md:block flex flex-col">
          <div className="mb-4 text-6xl text-primary">circle</div>
          <div className="grow"></div>
          <div className="text-center">
            <Button onClick={handleLogout} variant="ghost" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </aside>

        {/* Posts  */}
        <main className="col-span-12 md:col-span-8 overflow-y-auto bg-card">
          <div className="max-w-2xl mx-auto space-y-4 p-4">
            <div className="flex justify-between items-center">
              <h1 className="text-sm font-bold">Home</h1>
            </div>
            <CreatePost />
            <PostsList />
          </div>
        </main>

        {/* Right sidebar */}
        <aside className="col-span-2 bg-card p-4 rounded hidden md:block">
          <div className="mb-4 text-sm text-muted-foreground">Welcome, {user?.username}</div>
        </aside>

        {/* Footer */}
        <footer className="col-span-12 bg-card p-4 border-t border-border rounded text-center">
          <p className="text-sm text-muted-foreground">© 2025 Circle-Creted with ❤ by Faatihah</p>
        </footer>
      </div>
    </PostsProvider>
  );
};

const PostsList: React.FC = () => {
  const { threads, loading, error } = usePosts();
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    if (loading) {
      setShowSkeleton(true);
    } else {
      const timer = setTimeout(() => setShowSkeleton(false), 1500);
      return () => clearTimeout(timer);
    }
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

  if (threads.length === 0) return <div className="text-center p-4">No posts yet.</div>;

  return (
    <>
      {threads.map((thread) => (
        <PostCard key={thread.id} thread={thread} />
      ))}
    </>
  );
};

export default HomePage;
