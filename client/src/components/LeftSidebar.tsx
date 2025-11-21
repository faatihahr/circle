import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Button } from './ui/button';
import { LogOut, Home, User, Heart, UserCircle } from 'lucide-react';
import { selectUser, deselectThread, deselectUser } from '../stores/postsSlice';
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

  return (
    <aside className="w-80 bg-card overflow-y-auto md:block flex flex-col h-screen fixed left-0 border-r border-white">
      <div className="p-4 flex flex-col h-full">
        <div className="mb-4 text-6xl text-primary">circle</div>
        <nav className="space-y-2">
          <button className="!bg-transparent !border-0 rounded-lg w-full flex items-center justify-start h-12 px-6 !text-card-foreground hover:!bg-primary/10 hover:!text-primary !transition-colors !duration-200" onClick={handleHomeClick}>
            <Home className="w-5 h-5 mr-2" />
            Home
          </button>
          <button className="!bg-transparent !border-0 rounded-lg w-full flex items-center justify-start h-12 px-6 !text-card-foreground hover:!bg-primary/10 hover:!text-primary !transition-colors !duration-200">
            <User className="w-5 h-5 mr-2" />
            Search
          </button>
          <button className="!bg-transparent !border-0 rounded-lg w-full flex items-center justify-start h-12 px-6 !text-card-foreground hover:!bg-primary/10 hover:!text-primary !transition-colors !duration-200">
            <Heart className="w-5 h-5 mr-2" />
            Follows
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
