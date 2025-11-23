import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import LeftSidebar from '../components/LeftSidebar';
import RightSidebar from '../components/RightSidebar';
import SearchView from '../components/SearchView';

export default function SearchPage() {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      <LeftSidebar onLogout={handleLogout} />
      <div className="min-h-screen bg-card ml-80 flex">
        <div className="flex-1 border-l border-r border-white px-4 py-0">
          <SearchView />
        </div>
        <RightSidebar shouldShowProfileCard={false} />
      </div>
    </>
  );
}
