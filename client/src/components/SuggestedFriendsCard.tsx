import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../stores/hooks';
import { useFollow } from '../contexts/FollowContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { followAPI, authAPI } from '../lib/api';
import { updateFollowStatus, updateMultipleFollowStatuses } from '../stores/followSlice';
import { toast } from 'sonner';
import type { RootState } from '../stores/store';

interface SuggestedUser {
  id: number;
  name: string;
  username: string;
  profilePicture: string;
}

const SuggestedFriendsCard: React.FC = () => {
  const navigate = useNavigate();
  const reduxDispatch = useAppDispatch();
  const { followUser, unfollowUser } = useFollow();
  const [users, setUsers] = useState<SuggestedUser[]>([]);

  // Get follow statuses from Redux
  const followStatuses = useAppSelector((state: RootState) => state.follow.followStatuses);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await authAPI.getUsers();
        const fetchedUsers = response.users as SuggestedUser[];
        setUsers(fetchedUsers);

        // Also refresh follow statuses in Redux
        if (fetchedUsers.length > 0) {
          const statusPromises = fetchedUsers.map(async (user) => {
            try {
              const statusResponse = await followAPI.getFollowStatus(user.id.toString());
              return { userId: user.id, isFollowing: statusResponse.data.isFollowing };
            } catch (error) {
              console.error(`Failed to fetch follow status for user ${user.id}`, error);
              return { userId: user.id, isFollowing: false };
            }
          });

          const statuses = await Promise.all(statusPromises);
          const statusMap: Record<number, boolean> = {};
          statuses.forEach(({ userId, isFollowing }) => {
            statusMap[userId] = isFollowing;
          });

          reduxDispatch(updateMultipleFollowStatuses(statusMap));
        }
      } catch (error) {
        console.error('Failed to fetch suggested users', error);
      }
    };

    fetchUsers();
  }, [reduxDispatch]);

  const handleFollowToggle = async (userId: number, userName: string) => {
    const isCurrentlyFollowing = followStatuses[userId] || false;
    const actionText = isCurrentlyFollowing ? 'Unfollowing' : 'Following';

    // Optimistic update - immediately update UI
    reduxDispatch(updateFollowStatus({ userId, isFollowing: !isCurrentlyFollowing }));

    try {
      if (isCurrentlyFollowing) {
        await unfollowUser(userId);
        toast.success(`Unfollowed ${userName}`);
      } else {
        await followUser(userId);
        toast.success(`Followed ${userName}`);
      }
    } catch (error) {
      // Revert on error
      reduxDispatch(updateFollowStatus({ userId, isFollowing: isCurrentlyFollowing }));
      toast.error(`Failed to ${actionText.toLowerCase()} user`);
    }
  };

  const handleProfileClick = (userId: number) => {
    navigate(`/profile/${userId}`);
  };

  const getUserCard = (user: SuggestedUser) => {
    const isFollowing = followStatuses[user.id] || false;

    return (
      <div
        key={user.id}
        className="flex items-center justify-between gap-3"
      >
        <div
          className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
          onClick={() => handleProfileClick(user.id)}
        >
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
          variant={isFollowing ? 'outline' : 'default'}
          size="sm"
          onClick={() => handleFollowToggle(user.id, user.name)}
          className={`shrink-0 min-w-20 ${
            isFollowing
              ? 'bg-transparent border-border text-foreground hover:bg-accent'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          {isFollowing ? 'Following' : 'Follow'}
        </Button>
      </div>
    );
  };

  return (
    <Card className="w-full max-w-sm bg-card border-white hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-foreground">
          Suggested for you
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {users.map(getUserCard)}
      </CardContent>
    </Card>
  );
};

export default SuggestedFriendsCard;
