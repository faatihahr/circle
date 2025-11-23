import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from './ui/button';
import { LogOut, Home, Search as SearchIcon, Heart, UserCircle, Bell } from 'lucide-react';
import { selectUser, deselectThread, deselectUser, setSearchMode } from '../stores/postsSlice';
import { useAuth } from '../contexts/AuthContext';

interface LeftSidebarProps {
  onLogout: () => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const [isNavigatingHome, setIsNavigatingHome] = useState(false);
  const unreadCount = useSelector((state: any) => state.notifications.unreadCount);

  const handleHomeClick = () => {
    setIsNavigatingHome(true);
    if (location.pathname === '/home') {
      window.location.reload();
    } else {
      dispatch(deselectUser());
      dispatch(deselectThread());
      navigate('/home');
    }
  };

  const handleProfileClick = () => {
    if (user?.id) {
      navigate(`/profile/${user.id}`);
    }
  };

  const handleFollowsClick = () => {
    navigate('/follows');
  };

  const handleSearchClick = () => {
    // Reset other selections and enable search mode
    dispatch(deselectUser());
    dispatch(deselectThread());
    dispatch(setSearchMode(true));
    navigate('/home'); // Ensure we're on home page
  };

  const handleNotificationsClick = () => {
    navigate('/notifications');
  };

  return (
    <aside className="w-80 bg-card overflow-y-auto md:block flex flex-col h-screen fixed left-0 border-r border-white">
      <div className="p-4 flex flex-col h-full">
        <div className="mb-4 text-6xl text-primary">circle</div>
        <nav className="space-y-2">
          <button className="!bg-transparent !border-0 rounded-lg w-full flex items-center justify-start h-12 px-6 !text-card-foreground hover:!bg-primary/10 hover:!text-primary !transition-colors !duration-200" onClick={handleHomeClick}>
            <Home className="w-5 h-5 mr-2" />
            Home
          </button>
          <button className="!bg-transparent !border-0 rounded-lg w-full flex items-center justify-start h-12 px-6 !text-card-foreground hover:!bg-primary/10 hover:!text-primary !transition-colors !duration-200" onClick={handleSearchClick}>
            <SearchIcon className="w-5 h-5 mr-2" />
            Search
          </button>
          <button
            className="!bg-transparent !border-0 rounded-lg w-full flex items-center justify-start h-12 px-6 !text-card-foreground hover:!bg-primary/10 hover:!text-primary !transition-colors !duration-200"
            onClick={handleFollowsClick}
          >
            <Heart className="w-5 h-5 mr-2" />
            Follows
          </button>
          <button
            className="!bg-transparent !border-0 rounded-lg w-full flex items-center justify-start h-12 px-6 !text-card-foreground hover:!bg-primary/10 hover:!text-primary !transition-colors !duration-200 relative"
            onClick={handleNotificationsClick}
          >
            <Bell className="w-5 h-5 mr-2" />
            Notifications
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          <button
            className="!bg-transparent !border-0 rounded-lg w-full flex items-center justify-start h-12 px-6 !text-card-foreground hover:!bg-primary/10 hover:!text-primary !transition-colors !duration-200"
            onClick={handleProfileClick}
          >
            <UserCircle className="w-5 h-5 mr-2" />
            Profile
          </button>
        </nav>
        <div className="grow"></div>
        <div className="text-center">
          <Button onClick={onLogout} variant="ghost" size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default LeftSidebar;
