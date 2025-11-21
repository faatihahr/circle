import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LeftSidebar from '../components/LeftSidebar';
import RightSidebar from '../components/RightSidebar';
import ThreadDetail from '../components/ThreadDetail';
import { useAuth } from '../contexts/AuthContext';
import { useAppDispatch, useAppSelector } from '../stores/hooks';
import { selectThread } from '../stores/postsSlice';

const ThreadPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const dispatch = useAppDispatch();
  const selectedUserId = useAppSelector((state) => state.posts.selectedUserId);

  // Establish WebSocket connection for real-time updates

  // Set the selected thread from URL parameter
  React.useEffect(() => {
    if (id) {
      dispatch(selectThread(parseInt(id)));
    }
  }, [id, dispatch]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Determine if we should show profile card: show in thread details
  const shouldShowProfileCard = true;

  return (
    <>
      <LeftSidebar onLogout={handleLogout} />
      <div className="min-h-screen bg-card px-4 py-0 flex ml-80 border-r border-white">
        <ThreadDetail />
        <RightSidebar shouldShowProfileCard={shouldShowProfileCard} />
      </div>
    </>
  );
};

export default ThreadPage;
