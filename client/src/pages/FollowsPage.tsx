import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { followAPI } from '../lib/api';
import LeftSidebar from '../components/LeftSidebar';
import RightSidebar from '../components/RightSidebar';
import { Button } from '../components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { toast } from 'sonner';

interface User {
  id: number;
  username: string;
  name: string;
  profilePicture: string | null;
}

const FollowsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'following' | 'followers'>('following');
  const [following, setFollowing] = useState<User[]>([]);
  const [followers, setFollowers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [followStatus, setFollowStatus] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user?.id, activeTab]);

  // Listen for follow updates to refresh lists
  useEffect(() => {
    const handleFollowUpdate = () => {
      fetchData();
    };
    window.addEventListener('followUpdate', handleFollowUpdate);
    return () => {
      window.removeEventListener('followUpdate', handleFollowUpdate);
    };
  }, []);

  const fetchData = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const userId = user.id.toString();

      // Fetch both lists in parallel
      const [followingResponse, followersResponse] = await Promise.all([
        followAPI.getFollowing(userId),
        followAPI.getFollowers(userId)
      ]);

      setFollowing(followingResponse.data);
      setFollowers(followersResponse.data);

      // Get follow status for each user to show follow/unfollow buttons
      const statusPromises = [
        ...followingResponse.data.map(async (u: User) => {
          const status = await followAPI.getFollowStatus(u.id.toString());
          return { id: u.id, isFollowing: status.data.isFollowing };
        }),
        ...followersResponse.data.map(async (u: User) => {
          const status = await followAPI.getFollowStatus(u.id.toString());
          return { id: u.id, isFollowing: status.data.isFollowing };
        })
      ];

      const statuses = await Promise.all(statusPromises);
      const statusMap = statuses.reduce((acc, status) => {
        acc[status.id] = status.isFollowing;
        return acc;
      }, {} as Record<number, boolean>);

      setFollowStatus(statusMap);
    } catch (error) {
      console.error('Error fetching follow data:', error);
      toast.error('Failed to load follow data');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (targetUserId: number) => {
    try {
      await followAPI.followUser(targetUserId.toString());
      toast.success('User followed!');
      fetchData(); // Refresh the lists and status
    } catch (error) {
      console.error('Error following user:', error);
      toast.error('Failed to follow user');
    }
  };

  const handleUnfollow = async (targetUserId: number) => {
    try {
      await followAPI.unfollowUser(targetUserId.toString());
      toast.success('User unfollowed!');
      fetchData(); // Refresh the lists and status
    } catch (error) {
      console.error('Error unfollowing user:', error);
      toast.error('Failed to unfollow user');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const renderUserList = (users: User[]) => {
    if (users.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No users to show</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {users.map((u) => (
          <div key={u.id} className="flex items-center justify-between p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={`http://localhost:3000${u.profilePicture}`} alt={u.name || u.username} />
                <AvatarFallback>{(u.name || u.username).charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{u.name || u.username}</p>
                <p className="text-sm text-muted-foreground">@{u.username}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/profile/${u.id}`)}
              >
                View Profile
              </Button>

              {u.id !== Number(user?.id) && (
                followStatus[u.id] ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnfollow(u.id)}
                  >
                    Unfollow
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleFollow(u.id)}
                  >
                    Follow
                  </Button>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <LeftSidebar onLogout={handleLogout} />
      <div className="min-h-screen bg-card ml-80 flex">
        {/* Main content */}
        <div className="flex-1 border-l border-r border-white px-4 py-0">
          <div className="max-w-full mx-auto">
            <div className="pt-4">
              <h1 className="text-2xl font-bold mb-6">Follows</h1>

              {/* Tab buttons */}
              <div className="flex border-b border-white mb-6">
                <button
                  className={`flex-1 py-4 text-center font-medium text-sm ${
                    activeTab === 'following'
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setActiveTab('following')}
                >
                  Following ({following.length})
                </button>
                <button
                  className={`flex-1 py-4 text-center font-medium text-sm ${
                    activeTab === 'followers'
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setActiveTab('followers')}
                >
                  Followers ({followers.length})
                </button>
              </div>

              {/* Content */}
              {loading ? (
                <div className="text-center py-12">
                  <div className="text-lg">Loading...</div>
                </div>
              ) : (
                renderUserList(activeTab === 'following' ? following : followers)
              )}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="shrink-0">
          <RightSidebar shouldShowProfileCard={false} />
        </div>
      </div>
    </>
  );
};

export default FollowsPage;
