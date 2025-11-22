import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../stores/hooks';
import { authAPI } from '../lib/api';
import { deselectThread, deselectUser, selectUser } from '../stores/postsSlice';
import { useAuth } from '../contexts/AuthContext';
import LeftSidebar from '../components/LeftSidebar';
import RightSidebar from '../components/RightSidebar';
import ProfileView from '../components/ProfileView';
import EditProfileModal from '../components/EditProfileModal';

const ProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const selectedUserId = useAppSelector((state) => state.posts.selectedUserId);
  const [ setProfileUser] = useState<any>(null);
  const isOwnProfile = user?.id?.toString() === userId;
  const isEditModalOpen = searchParams.get('edit') === 'true';

  // Listen for follow updates to refetch viewed user's profile
  useEffect(() => {
    const handleFollowUpdate = (event: CustomEvent) => {
      const { followedId } = event.detail;
      if (followedId.toString() === selectedUserId?.toString()) {
        fetchProfileUser();
      }
    };
    window.addEventListener('followUpdate', handleFollowUpdate as EventListener);
    return () => {
      window.removeEventListener('followUpdate', handleFollowUpdate as EventListener);
    };
  }, [selectedUserId]);

  const openEditModal = () => {
    if (!isOwnProfile) return; // Ensure only own profile can edit
    setSearchParams({ edit: 'true' });
  };

  const closeEditModal = () => {
    setSearchParams({});
  };

  useEffect(() => {
    if (userId) {
      dispatch(selectUser(parseInt(userId)));
      fetchProfileUser();
      // Scroll to top when navigating to a new profile
      window.scrollTo(0, 0);
    }

    // Cleanup on unmount
    return () => {
      // Only deselect if we're leaving the profile page
      // This prevents deselecting when navigating within the app
    };
  }, [userId, dispatch]);

  const fetchProfileUser = async () => {
    if (!userId) return;
    try {
      const profileData = await authAPI.getProfileById(userId);
      setProfileUser(profileData);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
  const handleBack = () => {
      dispatch(deselectUser());
      dispatch(deselectThread());
      navigate('/home'); 
    };

  if (!userId) {
    return <div>User ID not found</div>;
  }

  return (
    <>
      <LeftSidebar onLogout={handleLogout} />
      <div className="min-h-screen bg-card ml-80 flex">
        {/* Main content */}
        <div className="flex-1 border-l border-r border-white px-4 py-0">
          <div className="max-w-2xl mx-auto">
            <ProfileView onEditProfile={isOwnProfile ? openEditModal : undefined} showBackButton={true} onBack={handleBack} />
          </div>
          <EditProfileModal isOpen={isEditModalOpen} onClose={closeEditModal} />
        </div>

        {/* Right sidebar */}
        <div className="shrink-0">
          <RightSidebar shouldShowProfileCard={false}/>
        </div>

      </div>
    </>
  );
};

export default ProfilePage;
