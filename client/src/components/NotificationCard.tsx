import React from 'react';
import { Heart, MessageCircle, User, UserPlus } from 'lucide-react';
import type { Notification } from '../stores/notificationsSlice';

const formatDistanceToNow = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
};

interface NotificationCardProps {
  notification: Notification;
  onClick: () => void;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({ notification, onClick }) => {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-4 h-4 text-red-500" fill="currentColor" />;
      case 'comment':
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'follow':
        return <UserPlus className="w-4 h-4 text-green-500" />;
      case 'comment_like':
        return <Heart className="w-4 h-4 text-red-500" fill="currentColor" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getNotificationText = () => {
    // Use personalized message from server if available
    if (notification.message && notification.message !== 'Someone liked your post' &&
        notification.message !== 'Someone commented on your post' &&
        notification.message !== 'Someone started following you' &&
        notification.message !== 'Someone liked your comment') {
      return notification.message;
    }

    // Fallback to generic messages (for backward compatibility)
    switch (notification.type) {
      case 'like':
        return 'Someone liked your post';
      case 'comment':
        return 'Someone commented on your post';
      case 'follow':
        return 'Someone started following you';
      case 'comment_like':
        return 'Someone liked your comment';
      default:
        return notification.message;
    }
  };

  return (
    <div
      className={`p-4 border border-border rounded-lg cursor-pointer transition-colors ${
        !notification.is_read ? 'bg-blue-50 border-blue-200' : 'hover:bg-muted/50'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start space-x-3">
        <div className="shrink-0 mt-1">
          {getNotificationIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-card-foreground">
            {getNotificationText()}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(notification.created_at))}
          </p>
        </div>
        {!notification.is_read && (
          <div className="shrink-0 w-2 h-2 bg-blue-500 rounded-full"></div>
        )}
      </div>
    </div>
  );
};
