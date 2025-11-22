import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import { useDispatch } from 'react-redux';
// import { useAuth } from '../contexts/AuthContext';
import { useFollow } from '../contexts/FollowContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { followAPI, authAPI } from '../lib/api';
// import { updateFollowerCounts } from '../stores/userSlice';
import { toast } from 'sonner';

interface SuggestedUser {
  id: number;
  name: string;
  username: string;
  profilePicture: string;
  isFollowing: boolean;
}

const SuggestedFriendsCard: React.FC = () => {
  const navigate = useNavigate();
  // const dispatch = useDispatch();
  // const { user: currentUser } = useAuth();
  const { followUser, unfollowUser } = useFollow();
  const [users, setUsers] = useState<SuggestedUser[]>([]);

  useEffect(() => {
    const fetchUsersAndStatuses = async () => {
      try {
        const response = await authAPI.getUsers();
        const fetchedUsers = response.users as Omit<SuggestedUser, 'isFollowing'>[];
        const updatedUsers = await Promise.all(
          fetchedUsers.map(async (user) => {
            try {
              const statusResponse = await followAPI.getFollowStatus(user.id.toString());
              const isFollowing = statusResponse.data.isFollowing;
              return { ...user, isFollowing };
            } catch (error) {
              console.error(`Failed to fetch follow status for user ${user.id}`, error);
              return { ...user, isFollowing: false };
            }
          })
        );
        setUsers(updatedUsers);
      } catch (error) {
        console.error('Failed to fetch suggested users', error);
      }
    };

    fetchUsersAndStatuses();
  }, []);

  const handleFollowToggle = async (userId: number) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const wasFollowing = user.isFollowing;
    const shouldFollow = !wasFollowing;

    // Optimistic update
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === userId
          ? { ...user, isFollowing: shouldFollow }
          : user
      )
    );

    try {
      if (shouldFollow) {
        await followUser(userId);
        toast.success(`Followed ${user.name}`);
      } else {
        await unfollowUser(userId);
        toast.success(`Unfollowed ${user.name}`);
      }
    } catch (error) {
      // Revert on error
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId
            ? { ...user, isFollowing: wasFollowing }
            : user
        )
      );
      toast.error('Failed to update follow status. Please try again.');
    }
  };

  const handleProfileClick = (userId: number) => {
    navigate(`/profile/${userId}`);
  };

  return (
    <Card className="w-full max-w-sm bg-card border-white hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-foreground">
          Suggested for you
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0" onClick={() => handleProfileClick(user.id)} style={{ cursor: 'pointer' }}>
              <img
                src={user.profilePicture}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {user.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.username}
                </p>
              </div>
            </div>
            <Button
              variant={user.isFollowing ? 'outline' : 'default'}
              size="sm"
              onClick={() => handleFollowToggle(user.id)}
              className={`shrink-0 min-w-20 ${
                user.isFollowing
                  ? 'bg-transparent border-border text-foreground hover:bg-accent'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              {user.isFollowing ? 'Following' : 'Follow'}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default SuggestedFriendsCard;
