import React, { createContext, useContext, useCallback } from 'react';
import { updateFollowStatus } from '../stores/followSlice';
import { updateFollowerCounts } from '../stores/userSlice';
import { useAppDispatch } from '../stores/hooks';
import { useAuth } from './AuthContext';

interface FollowContextType {
  followUser: (userId: number) => Promise<void>;
  unfollowUser: (userId: number) => Promise<void>;
  refreshProfile: () => void;
}

const FollowContext = createContext<FollowContextType | undefined>(undefined);

export const FollowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // We need to get dispatch inside the component, but hooks can't be used at module level
  // So we'll create a component that uses dispatch
  const FollowContextInner = ({ children }: { children: React.ReactNode }) => {
    const dispatch = useAppDispatch();
    const { user: currentUser } = useAuth();

    const followUser = useCallback(async (userId: number) => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/follow/${userId}/follow`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          // Dispatch follow events for all listeners
          window.dispatchEvent(new CustomEvent('profileUpdate'));
          window.dispatchEvent(new CustomEvent('followUpdate', { detail: { userId, action: 'follow' } }));

          // Update Redux state immediately
          dispatch(updateFollowStatus({ userId, isFollowing: true }));
          dispatch(updateFollowerCounts({
            userId: currentUser?.id || '',
            followingDelta: 1,
            followersDelta: 0
          }));

          return;
        }
        throw new Error('Failed to follow user');
      } catch (error) {
        console.error('Error following user:', error);
        throw error;
      }
    }, [dispatch]);

    const unfollowUser = useCallback(async (userId: number) => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/follow/${userId}/unfollow`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          // Dispatch follow events for all listeners
          window.dispatchEvent(new CustomEvent('profileUpdate'));
          window.dispatchEvent(new CustomEvent('followUpdate', { detail: { userId, action: 'unfollow' } }));

          // Update Redux state immediately
          dispatch(updateFollowStatus({ userId, isFollowing: false }));
          dispatch(updateFollowerCounts({
            userId: currentUser?.id || '',
            followingDelta: -1,
            followersDelta: 0
          }));

          return;
        }
        throw new Error('Failed to unfollow user');
      } catch (error) {
        console.error('Error unfollowing user:', error);
        throw error;
      }
    }, [dispatch]);

    const refreshProfile = useCallback(() => {
      window.dispatchEvent(new CustomEvent('profileUpdate'));
      window.dispatchEvent(new CustomEvent('followUpdate'));
    }, []);

    return (
      <FollowContext.Provider value={{ followUser, unfollowUser, refreshProfile }}>
        {children}
      </FollowContext.Provider>
    );
  };

  return <FollowContextInner>{children}</FollowContextInner>;
};

export const useFollow = () => {
  const context = useContext(FollowContext);
  if (!context) {
    throw new Error('useFollow must be used within FollowProvider');
  }
  return context;
};


// import React, { createContext, useContext, useState, useCallback } from 'react';

// interface FollowContextType {
//   followUser: (userId: number) => Promise<void>;
//   unfollowUser: (userId: number) => Promise<void>;
//   refreshProfile: () => void;
//   profileRefreshTrigger: number;
// }

// const FollowContext = createContext<FollowContextType | undefined>(undefined);

// export const FollowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const [profileRefreshTrigger, setProfileRefreshTrigger] = useState(0);

//   const followUser = useCallback(async (userId: number) => {
//     try {
//       const token = localStorage.getItem('token');
//       const response = await fetch(`http://localhost:3000/api/follow/${userId}/follow`, {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//       });

//       if (response.ok) {
//         setProfileRefreshTrigger(prev => prev + 1);
//         return;
//       }
//       throw new Error('Failed to follow user');
//     } catch (error) {
//       console.error('Error following user:', error);
//       throw error;
//     }
//   }, []);

//   const unfollowUser = useCallback(async (userId: number) => {
//     try {
//       const token = localStorage.getItem('token');
//       const response = await fetch(`http://localhost:3000/api/follow/${userId}/unfollow`, {
//         method: 'DELETE',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//       });

//       if (response.ok) {
//         setProfileRefreshTrigger(prev => prev + 1);
//         return;
//       }
//       throw new Error('Failed to unfollow user');
//     } catch (error) {
//       console.error('Error unfollowing user:', error);
//       throw error;
//     }
//   }, []);

//   const refreshProfile = useCallback(() => {
//     setProfileRefreshTrigger(prev => prev + 1);
//   }, []);

//   return (
//     <FollowContext.Provider
//       value={{
//         followUser,
//         unfollowUser,
//         refreshProfile,
//         profileRefreshTrigger
//       }}
//     >
//       {children}
//     </FollowContext.Provider>
//   );
// };

// export const useFollow = () => {
//   const context = useContext(FollowContext);
//   if (!context) {
//     throw new Error('useFollow must be used within FollowProvider');
//   }
//   return context;
// };
