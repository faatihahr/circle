import React, { useState, useEffect } from 'react';
import { Edit } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../stores/hooks';
import { authAPI } from '../lib/api';
import { useFetchUserPosts } from '../hooks/useFetchUserPosts';
import { useAuth } from '../contexts/AuthContext';
import { useFollow } from '../contexts/FollowContext';
import PostCard from './PostCard';
import PostCardSkeleton from './PostCardSkeleton';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import ThreadModal from './ThreadModal';
import { getProfileById } from '../stores/userSlice';

// ProfileHeader component from the provided syntax
interface ProfileHeaderProps {
  user: {
    id: string;
    username: string;
    name?: string;
    bio?: string;
    profilePicture?: string;
    image_headers?: string;
    followersCount?: number;
    followingCount?: number;
  };
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onEditProfile?: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user, activeTab, setActiveTab, onEditProfile }) => {
  return (
    <Card className="w-full shadow-lg border-0 overflow-hidden p-0">
      <CardContent className="p-0">
        <div className="h-32 bg-gradient-to-r from-primary to-accent relative">
          {user.image_headers && (
            <img
              src={`http://localhost:3000${user.image_headers}`}
              alt="Profile header"
              className="w-full h-full object-cover absolute inset-0"
            />
          )}
          <img
            src={user.profilePicture ? `http://localhost:3000${user.profilePicture}` : '/default-avatar.png'}
            alt={user.name || user.username}
            className="w-20 h-20 rounded-full border-4 border-background absolute -bottom-10 left-6"
          />
          {onEditProfile && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEditProfile}
              className="absolute top-4 right-4 bg-background/90 hover:bg-background border-foreground text-foreground"
            >
              <Edit className="w-4 h-4 mr-1" />
              <span>Edit</span>
            </Button>
          )}
        </div>

        <div className="pt-12 px-6 pb-4">
          <h2 className="text-xl font-bold text-foreground mb-1">{user.name || user.username}</h2>
          <p className="text-muted-foreground text-sm mb-3">@{user.username}</p>
          {user.bio && (
            <p className="text-foreground mb-3">{user.bio}</p>
          )}

          <div className="flex space-x-4 text-sm mb-4">
            <span className="text-foreground">
              <strong>{user.followingCount ?? 0}</strong> <span className="text-muted-foreground">Following</span>
            </span>
            <span className="text-foreground">
              <strong>{user.followersCount ?? 0}</strong> <span className="text-muted-foreground">Followers</span>
            </span>
          </div>

          <div className="flex">
            <button
              onClick={() => setActiveTab('all-post')}
              className={`flex-1 py-3 text-center ${activeTab === 'all-post' ? 'text-foreground border-b-2 border-primary' : 'text-muted-foreground'}`}
            >
              All Post
            </button>
            <button
              onClick={() => setActiveTab('media')}
              className={`flex-1 py-3 text-center ${activeTab === 'media' ? 'text-foreground border-b-2 border-primary' : 'text-muted-foreground'}`}
            >
              Media
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface Post {
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

interface ProfileViewProps {
  onEditProfile?: () => void;
  showBackButton?: boolean;
  onBack?: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ onEditProfile, showBackButton, onBack }) => {
  const selectedUserId = useAppSelector((state) => state.posts.selectedUserId);
  const user = useAppSelector((state) => state.user.viewedProfile) as any;
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState('all-post');
  const [selectedThread, setSelectedThread] = useState<Post | null>(null);
  const { user: currentUser } = useAuth();
  const { profileRefreshTrigger } = useFollow();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { threads: userPosts, loading: postsLoading, error, updateLikeStatus, updateReplyCount } = useFetchUserPosts(selectedUserId);

  const isOwnProfile = currentUser && selectedUserId?.toString() === currentUser.id.toString();

  useEffect(() => {
    if (selectedUserId) {
      dispatch(getProfileById(selectedUserId.toString()));
    }
  }, [selectedUserId, dispatch]);

  // Listen for profile updates
  useEffect(() => {
    const handleProfileUpdate = (event: CustomEvent) => {
      const { action, userId } = event.detail;
      if (selectedUserId && userId === selectedUserId.toString()) {
        dispatch(getProfileById(selectedUserId.toString()));
      }
    };
    window.addEventListener('profileUpdate', handleProfileUpdate as EventListener);
    return () => {
      window.removeEventListener('profileUpdate', handleProfileUpdate as EventListener);
    };
  }, [selectedUserId, dispatch]);

  useEffect(() => {
    // Check if there's a threadId in URL params when component mounts
    const threadId = searchParams.get('thread');
    if (threadId && userPosts.length > 0) {
      const threadToShow = userPosts.find(post => post.id.toString() === threadId);
      if (threadToShow) {
        setSelectedThread(threadToShow);
      }
    }
  }, [searchParams, userPosts]);

  const filteredPosts = userPosts.filter(post => {
    if (activeTab === 'media') {
      return post.image; // Only posts with images
    }
    return true; // All posts for 'all-post' tab
  });

  const handleLikeUpdate = (threadId: number, isLiked: boolean, likesCount: number) => {
    updateLikeStatus(threadId, isLiked, likesCount);
  };

  const handleReplyUpdate = (threadId: number, replyCount: number) => {
    updateReplyCount(threadId, replyCount);
  };

  const openThreadModal = (thread: Post) => {
    setSelectedThread(thread);
    // Update URL to include thread ID
    setSearchParams({ thread: thread.id.toString() });
  };

  const closeThreadModal = () => {
    setSelectedThread(null);
    // Remove thread param from URL
    setSearchParams({});
  };

  if (!selectedUserId || !user) {
    return <div>Loading profile...</div>;
  }

  return (
    <div className="w-full py-6">
      {showBackButton && onBack && (
        <div onClick={onBack} className="mb-4 cursor-pointer text-xl text-foreground hover:text-foreground">
          &larr; {user?.name}
        </div>
      )}
      <ProfileHeader
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onEditProfile={isOwnProfile ? onEditProfile : undefined}
      />

      <div className="mt-6">
        {postsLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <PostCardSkeleton key={i} />
            ))}
          </div>
        ) : activeTab === 'all-post' ? (
          filteredPosts.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No posts yet
            </div>
          ) : (
            <div className="space-y-4 w-full max-w-none">
              {filteredPosts.map(post => (
                <PostCard key={post.id} thread={post} onLikeUpdate={handleLikeUpdate} onReplyUpdate={handleReplyUpdate} />
              ))}
            </div>
          )
        ) : (
          // Media tab - grid view
          filteredPosts.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No media posts yet
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {filteredPosts.map(post => (
                post.image && (
                  <div key={post.id} className="aspect-square rounded-lg overflow-hidden bg-muted" onClick={() => openThreadModal(post)}>
                    <img
                      src={`http://localhost:3000${post.image}`}
                      alt="Post media"
                      className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                    />
                  </div>
                )
              ))}
            </div>
          )
        )}
      </div>
      <ThreadModal thread={selectedThread} isOpen={!!selectedThread} onClose={closeThreadModal} />
    </div>
  );
};

export default ProfileView;
