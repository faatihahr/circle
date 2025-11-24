import React, { useState, useEffect } from 'react';
import { Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../stores/hooks';
import { useFetchUserPosts } from '../hooks/useFetchUserPosts';
import { useAuth } from '../contexts/AuthContext';
import { useFollow } from '../contexts/FollowContext';
import PostCard from './PostCard';
import PostCardSkeleton from './PostCardSkeleton';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import ThreadModal from './ThreadModal';
import { getProfileById } from '../stores/userSlice';
import { followAPI } from '../lib/api';

// ProfileHeader component
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
  isOwnProfile: boolean;
  isFollowing?: boolean | null;
  followLoading?: boolean;
  onFollow?: () => void;
  onUnfollow?: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ 
  user, 
  activeTab, 
  setActiveTab, 
  onEditProfile, 
  isOwnProfile, 
  isFollowing, 
  onFollow, 
  onUnfollow 
}) => {
  const navigate = useNavigate();
  return (
    <Card className="w-full shadow-lg border-0 overflow-hidden p-0">
      <CardContent className="p-0">
        <div className="h-32 bg-linear-to-r from-primary to-accent relative">
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
          
          {/* Follow/Unfollow Button - positioned at top right, aligned with header */}
          {!isOwnProfile && (
            <Button
              variant={isFollowing ? "outline" : "default"}
              size="sm"
              onClick={isFollowing ? onUnfollow : onFollow}
              disabled={isFollowing === null}
              className="absolute top-4 right-4 bg-background/90 hover:bg-background border-foreground text-foreground"
            >
              {isFollowing === null ? 'Loading...' : (isFollowing ? 'Unfollow' : 'Follow')}
            </Button>
          )}
          
          {/* Edit Button - only for own profile */}
          {onEditProfile && isOwnProfile && (
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
            <span
              className="text-foreground cursor-pointer hover:text-primary"
              onClick={() => navigate('/follows?type=following')}
            >
              <strong>{user.followingCount ?? 0}</strong> <span className="text-muted-foreground">Following</span>
            </span>
            <span
              className="text-foreground cursor-pointer hover:text-primary"
              onClick={() => navigate('/follows?type=followers')}
            >
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
  const { followUser, unfollowUser, refreshProfile } = useFollow();
  const navigate = useNavigate();
  
  // New state for follow status
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);
  const [followLoading, setFollowLoading] = useState<boolean>(false);
  
  const { threads: userPosts, loading: postsLoading, updateLikeStatus, updateReplyCount } = useFetchUserPosts(selectedUserId);

  const isOwnProfile = currentUser && selectedUserId?.toString() === currentUser.id.toString();

  // Fetch follow status for viewed profile (if not own profile)
  useEffect(() => {
    const fetchFollowStatus = async () => {
      if (!selectedUserId || isOwnProfile || !currentUser) return;
      
      try {
        const status = await followAPI.getFollowStatus(selectedUserId.toString());
        // set following state to true/false or null if unknown
        setIsFollowing(status.data.isFollowing ?? null);
      } catch (error) {
        console.error('Error fetching follow status:', error);
      }
    };

    fetchFollowStatus();
  }, [selectedUserId, isOwnProfile, currentUser]);

  useEffect(() => {
    if (selectedUserId) {
      dispatch(getProfileById(selectedUserId.toString()));
    }
  }, [selectedUserId, dispatch]);

  // Listen for profile updates (including follow changes)
  useEffect(() => {
    const handleProfileUpdate = () => {
      // When profile is updated (including count changes from follows/unfollows)
      if (selectedUserId) {
        // Add small delay to let backend update counts
        setTimeout(() => {
          dispatch(getProfileById(selectedUserId.toString()));
        }, 500);
      }
    };

    const handleFollowUpdate = () => {
      // When any follow/unfollow happens, refresh this profile (in case someone followed/unfollowed this user)
      if (selectedUserId) {
        // Add small delay to let backend update counts
        setTimeout(() => {
          dispatch(getProfileById(selectedUserId.toString()));
        }, 500);
      }
    };

    window.addEventListener('profileUpdate', handleProfileUpdate);
    window.addEventListener('followUpdate', handleFollowUpdate);
    return () => {
      window.removeEventListener('profileUpdate', handleProfileUpdate);
      window.removeEventListener('followUpdate', handleFollowUpdate);
    };
  }, [selectedUserId, dispatch]);

  const filteredPosts = userPosts.filter(post => {
    if (activeTab === 'media') {
      return post.image;
    }
    return true;
  });

  // Handle follow action
  const handleFollow = async () => {
    if (!selectedUserId || !currentUser || isOwnProfile) return;
    
    setFollowLoading(true);
    try {
      await followUser(Number(selectedUserId));
      setIsFollowing(true);
      refreshProfile();
    } catch (error) {
      console.error('Error following user:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  // Handle unfollow action
  const handleUnfollow = async () => {
    if (!selectedUserId || !currentUser || isOwnProfile) return;
    
    setFollowLoading(true);
    try {
      await unfollowUser(Number(selectedUserId));
      setIsFollowing(false);
      refreshProfile();
    } catch (error) {
      console.error('Error unfollowing user:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleLikeUpdate = (threadId: number, isLiked: boolean, likesCount: number) => {
    updateLikeStatus(threadId, isLiked, likesCount);
  };

  const handleReplyUpdate = (threadId: number, replyCount: number) => {
    updateReplyCount(threadId, replyCount);
  };

  const openThreadModal = (thread: Post) => {
    if (activeTab === 'media') {
      setSelectedThread(thread);
    } else {
      navigate(`/thread/${thread.id}`);
    }
  };

  const closeThreadModal = () => {
    setSelectedThread(null);
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
        isOwnProfile={!!isOwnProfile}
        isFollowing={isFollowing}
        onFollow={handleFollow}
        onUnfollow={handleUnfollow}
        followLoading={followLoading}
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
