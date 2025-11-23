import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '../stores/store';
import {
  fetchNotifications,
  markAsRead as markAsReadAction,
  markAllAsRead
} from '../stores/notificationsSlice';
import type { Notification } from '../stores/notificationsSlice';
import { NotificationCard } from '../components/NotificationCard';
import { Button } from '../components/ui/button';
import { Check } from 'lucide-react';
import LeftSidebar from '../components/LeftSidebar';
import RightSidebar from '../components/RightSidebar';
import { useAuth } from '../contexts/AuthContext';

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { logout } = useAuth();

  const {
    list: notifications,
    loading,
    unreadCount,
    pagination
  } = useSelector((state: any) => state.notifications);

  useEffect(() => {
    // Only fetch notifications if we don't have any in state (no real-time notifications yet)
    if (notifications.length === 0) {
      dispatch(fetchNotifications({ page: 1, limit: 20 }));
    }
  }, [dispatch, notifications.length]);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      dispatch(markAsReadAction(notification.id));
    }
    // Navigate based on type and related_id
    if (notification.type === 'like' || notification.type === 'comment' || notification.type === 'comment_like') {
      if (notification.related_id) {
        navigate(`/thread/${notification.related_id}`);
      }
    } else if (notification.type === 'follow') {
      if (notification.related_id) {
        navigate(`/profile/${notification.related_id}`);
      }
    }
  };

  const handleMarkAllAsRead = () => {
    if (unreadCount > 0) {
      dispatch(markAllAsRead());
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <>
        <LeftSidebar onLogout={handleLogout} />
        <div className="min-h-screen bg-card ml-80 flex">
          <div className="flex-1 border-l border-r border-white px-4 py-0">
            <div className="flex items-center justify-center h-full">
              <div className="text-lg">Loading notifications...</div>
            </div>
          </div>
          <div className="shrink-0">
            <RightSidebar shouldShowProfileCard={true} />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <LeftSidebar onLogout={handleLogout} />
      <div className="min-h-screen bg-card ml-80 flex">
        {/* Main content */}
        <div className="flex-1 border-l border-r border-white px-4 py-0">
          <div className="max-w-full mx-auto">
            <div className="pt-4">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Notifications</h1>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  disabled={unreadCount === 0}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Mark all as read
                </Button>
              </div>

              {notifications.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No notifications yet
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notification: Notification) => (
                    <NotificationCard
                      key={notification.id}
                      notification={notification}
                      onClick={() => handleNotificationClick(notification)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="shrink-0">
          <RightSidebar shouldShowProfileCard={true} />
        </div>
      </div>
    </>
  );
};

export default NotificationsPage;
