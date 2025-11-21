import React from 'react';
import { useAppSelector } from '../stores/hooks';
// import ProfileCard from './ProfileCard';
import SuggestedFriendsCard from './SuggestedFriendsCard';

interface RightSidebarProps {
  shouldShowProfileCard?: boolean;
}

const RightSidebar: React.FC<RightSidebarProps> = ({ shouldShowProfileCard = true }) => {
  const selectedThreadId = useAppSelector((state) => state.posts.selectedThreadId);
  const selectedUserId = useAppSelector((state) => state.posts.selectedUserId);

  // Hanya tampilkan ProfileCard jika tidak di profile view
  const shouldShowProfileCardLocal = selectedThreadId !== null || selectedUserId === null;

  return (
    <aside className="w-80 p-4 space-y-4">
      {/* ProfileCard - scroll normal, tidak sticky */}
      {shouldShowProfileCardLocal && (
        <div>
          {/* <ProfileCard /> */}
        </div>
      )}

      {/* Suggested Friends - sticky saat scroll */}
      <div className="sticky top-4">
        <SuggestedFriendsCard />
      </div>
    </aside>
  );
};

export default RightSidebar;
