import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LeftSidebar from '../components/LeftSidebar';
import RightSidebar from '../components/RightSidebar';
import PostList from '../components/PostList';
import ThreadDetail from '../components/ThreadDetail';
import ProfileView from '../components/ProfileView';
import EditProfileModal from '../components/EditProfileModal';
import { useAppSelector, useAppDispatch } from '../stores/hooks';
import { deselectThread, deselectUser } from '../stores/postsSlice';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);

  const dispatch = useAppDispatch();
  const selectedThreadId = useAppSelector((state) => state.posts.selectedThreadId);
  const selectedUserId = useAppSelector((state) => state.posts.selectedUserId);

  // Handle profile modal based on route
  useEffect(() => {
    if (location.pathname === '/profile') {
      setShowEditProfileModal(true);
    } else {
      setShowEditProfileModal(false);
    }
  }, [location.pathname]);

  const handleProfileModalClose = () => {
    setShowEditProfileModal(false);
    navigate('/home'); // Navigate back to home when closing modal
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleBack = () => {
    dispatch(deselectUser());
    dispatch(deselectThread());
  };

  const renderMainContent = () => {
    if (selectedThreadId !== null) {
      return (
        <>
          <div onClick={handleBack} className="pt-5 mb-4 cursor-pointer text-xl text-foreground hover:text-foreground">
            &larr; Back to posts
          </div>
          <ThreadDetail />
        </>
      );
    }
    if (selectedUserId !== null) {
      return (
        <div className="max-w-2xl mx-auto">
          <ProfileView showBackButton={true} onBack={handleBack} />
        </div>
      );
    }
    return <PostList />;
  };

  // Determine if we should show profile card in sidebar: hide if viewing profile
  const shouldShowProfileCard = selectedUserId === null || selectedThreadId !== null;

  return (
    <>
      <LeftSidebar onLogout={handleLogout} />

      {/* Main container - HAPUS overflow dan gunakan flex row */}
      <div className="min-h-screen bg-card ml-80 flex">

        {/* Main content area - flex-1 agar mengambil sisa space */}
        <div className="flex-1 border-l border-r border-white px-4 py-0">
          {renderMainContent()}
        </div>

        {/* Right sidebar - posisi relative untuk sticky children */}
        <div className="shrink-0">
          <RightSidebar shouldShowProfileCard={shouldShowProfileCard} />
        </div>

      </div>

      {/* {Edit Profile Modal */} 
       <EditProfileModal
        isOpen={showEditProfileModal}
        onClose={handleProfileModalClose}
      />
    </>
  );
};

export default HomePage;
