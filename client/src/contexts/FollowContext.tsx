import React, { createContext, useContext, useCallback } from 'react';

interface FollowContextType {
  followUser: (userId: number) => Promise<void>;
  unfollowUser: (userId: number) => Promise<void>;
  refreshProfile: () => void;
}

const FollowContext = createContext<FollowContextType | undefined>(undefined);

export const FollowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
        window.dispatchEvent(new CustomEvent('profileUpdate'));
        return;
      }
      throw new Error('Failed to follow user');
    } catch (error) {
      console.error('Error following user:', error);
      throw error;
    }
  }, []);

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
        window.dispatchEvent(new CustomEvent('profileUpdate'));
        return;
      }
      throw new Error('Failed to unfollow user');
    } catch (error) {
      console.error('Error unfollowing user:', error);
      throw error;
    }
  }, []);

  const refreshProfile = useCallback(() => {
    window.dispatchEvent(new CustomEvent('profileUpdate'));
  }, []);

  return (
    <FollowContext.Provider value={{ followUser, unfollowUser, refreshProfile }}>
      {children}
    </FollowContext.Provider>
  );
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
