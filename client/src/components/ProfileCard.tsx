import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../stores/hooks';
import { Pencil } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { getProfile } from '../stores/userSlice';
import { useFollow } from '../contexts/FollowContext';
import type { UserState } from '../stores/userSlice';

interface ProfileCardProps {}

const ProfileCard: React.FC<ProfileCardProps> = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { profileRefreshTrigger } = useFollow();
  
  // Selector langsung dari Redux
  const { user, profile, loading, error, isAuthenticated } = useSelector((state: { user: UserState }) => state.user);

  // Fetch profile saat mount dan jika profileRefreshTrigger berubah
  useEffect(() => {
    if (isAuthenticated && !profile && !loading) {
      dispatch(getProfile());
    }
  }, [dispatch, isAuthenticated, profile, loading]);

  useEffect(() => {
    if (isAuthenticated && profileRefreshTrigger) {
      dispatch(getProfile()); // Refresh profile when profileRefreshTrigger changes
    }
  }, [profileRefreshTrigger, dispatch, isAuthenticated]);

  const handleProfileClick = () => {
    if (profile?.id) {
      navigate(`/profile/${profile.id}`);
    }
  };

  if (error) {
    return <div>Failed to load profile: {error}</div>;
  }

  if (!profile) {
    return <div>Profile not available</div>;
  }

  if (loading) {
    return (
      <Card className="bg-gradient-to-b from-background to-accent text-foreground shadow-lg">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-20 h-20 bg-muted rounded-full"></div>
              <div className="w-32 h-4 bg-muted rounded"></div>
              <div className="w-24 h-4 bg-muted rounded"></div>
              <div className="w-40 h-3 bg-muted rounded"></div>
              <div className="flex space-x-4">
                <div className="w-16 h-4 bg-muted rounded"></div>
                <div className="w-16 h-4 bg-muted rounded"></div>
              </div>
              <div className="w-24 h-8 bg-muted rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="relative z-10 bg-gradient-to-b from-background to-accent text-foreground shadow-lg border-0 pt-0 cursor-pointer hover:shadow-xl transition-shadow"
      onClick={handleProfileClick}
    >
      <CardContent className="p-0">
        {/* Header/Banner Image */}
        {(profile as any).image_headers && (
          <div className="h-32 w-full overflow-hidden rounded-t-lg">
            <img
              src={`http://localhost:3000${(profile as any).image_headers}`}
              alt="Profile header"
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="p-6">
          <div className="flex flex-col items-center space-y-4">
            {/* Avatar */}
            <div className={`relative ${(profile as any).image_headers ? '-mt-12' : ''}`}>
              <Avatar className="w-20 h-20 border-4 border-primary shadow-lg z-20">
                <AvatarImage 
                  src={profile.profilePicture ? `http://localhost:3000${profile.profilePicture}` : undefined} 
                  alt={profile.name || profile.username} 
                />
                <AvatarFallback className="text-primary-foreground font-bold text-xl bg-primary">
                  {(profile.name || profile.username).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Edit Profile Button */}
            <Button
              variant="outline"
              size="sm"
              className="text-foreground border-foreground bg-background hover:bg-muted"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/editprofile');
              }}
            >
              <Pencil className="w-4 h-4" />
            </Button>

            {/* Display Name */}
            <div className="text-center">
              <h2 className="text-xl font-bold text-foreground">{profile.name || profile.username}</h2>
            </div>

            {/* Username */}
            <div className="text-center text-primary-foreground">
              @{profile.username}
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="text-center text-sm max-w-xs text-primary-foreground">
                {profile.bio}
              </div>
            )}

            {/* Followers/Following Count */}
            <div className="flex space-x-6 text-sm">
              <div className="text-center">
                <div className="font-bold text-foreground">{profile.followersCount || 0}</div>
                <div className="text-primary-foreground">Followers</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-foreground">{profile.followingCount || 0}</div>
                <div className="text-primary-foreground">Following</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileCard;

// import React, { useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useDispatch } from 'react-redux';
// import { Pencil } from 'lucide-react';
// import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
// import { Button } from './ui/button';
// import { Card, CardContent } from './ui/card';
// import { selectUser, deselectThread } from '../stores/postsSlice';
// // import { useFetchProfile } from '../hooks/useFetchProfile';
// import { useFollow } from '../contexts/FollowContext';
// import type { User } from '../stores/userSlice';

// interface ProfileCardProps {}

// const ProfileCard: React.FC<ProfileCardProps> = () => {
//   const navigate = useNavigate();
//   const dispatch = useDispatch();
//   // const { profile, loading, error, refetch } = useFetchProfile();
//   const { profileRefreshTrigger } = useFollow();

//   useEffect(() => {
//     const handleProfileUpdate = () => {
//       refetch();
//     };
//     window.addEventListener('profileUpdate', handleProfileUpdate);
//     return () => {
//       window.removeEventListener('profileUpdate', handleProfileUpdate);
//     };
//   }, [refetch]);

//   useEffect(() => {
//     refetch();
//   }, [profileRefreshTrigger, refetch]);

//   const handleProfileClick = () => {
//     if (profile?.id) {
//       navigate(`/profile/${profile.id}`);
//     }
//   };

//   if (error) {
//     return <div>Failed to load profile: {error}</div>;
//   }

//   if (!profile) {
//     return <div>Profile not available</div>;
//   }

//   if (loading) {
//     return (
//       <Card className="bg-gradient-to-b from-background to-accent text-foreground shadow-lg">
//         <CardContent className="p-6">
//           <div className="animate-pulse">
//             <div className="flex flex-col items-center space-y-4">
//               <div className="w-20 h-20 bg-muted rounded-full"></div>
//               <div className="w-32 h-4 bg-muted rounded"></div>
//               <div className="w-24 h-4 bg-muted rounded"></div>
//               <div className="w-40 h-3 bg-muted rounded"></div>
//               <div className="flex space-x-4">
//                 <div className="w-16 h-4 bg-muted rounded"></div>
//                 <div className="w-16 h-4 bg-muted rounded"></div>
//               </div>
//               <div className="w-24 h-8 bg-muted rounded"></div>
//             </div>
//           </div>
//         </CardContent>
//       </Card>
//     );
//   }

//   return (
//     <Card
//       className="relative z-10 bg-gradient-to-b from-background to-accent text-foreground shadow-lg border-0 pt-0 cursor-pointer hover:shadow-xl transition-shadow"
//       onClick={handleProfileClick}
//     >
//       <CardContent className="p-0">
//         {/* Header/Banner Image - Full width spanning top of card */}
//         {(profile as any).image_headers && (
//           <div className="h-32 w-full overflow-hidden rounded-t-lg">
//             <img
//               src={`http://localhost:3000${(profile as any).image_headers}`}
//               alt="Profile header"
//               className="w-full h-full object-cover"
//             />
//           </div>
//         )}
//         <div className="p-6">
//           <div className="flex flex-col items-center space-y-4">
//             {/* Header Area with Avatar */}
//             <div className={`relative ${(profile as any).image_headers ? '-mt-12' : ''}`}>
//               <Avatar className="w-20 h-20 border-4 border-primary shadow-lg z-20">
//                 <AvatarImage src={profile.profilePicture ? `http://localhost:3000${profile.profilePicture}` : undefined} alt={profile.name || profile.username} />
//                 <AvatarFallback className="text-primary-foreground font-bold text-xl bg-primary">
//                   {(profile.name || profile.username).charAt(0).toUpperCase()}
//                 </AvatarFallback>
//               </Avatar>
//             </div>

//             {/* Edit Profile Button */}
//             <Button
//               variant="outline"
//               size="sm"
//               className="text-foreground border-foreground bg-background hover:bg-muted"
//               onClick={(e) => {
//                 e.stopPropagation();
//                 navigate('/editprofile');
//               }}
//             >
//               <Pencil className="w-4 h-4" />
//             </Button>

//             {/* Display Name */}
//             <div className="text-center">
//               <h2 className="text-xl font-bold text-foreground">{profile.name || profile.username}</h2>
//             </div>

//             {/* Username */}
//             <div className="text-center text-primary-foreground">
//               @{profile.username}
//             </div>

//             {/* Bio */}
//             {profile.bio && (
//               <div className="text-center text-sm max-w-xs text-primary-foreground">
//                 {profile.bio}
//               </div>
//             )}

//             {/* Followers/Following Count */}
//             <div className="flex space-x-6 text-sm">
//               <div className="text-center">
//                 <div className="font-bold text-foreground">{profile.followersCount || 0}</div>
//                 <div className="text-primary-foreground">Followers</div>
//               </div>
//               <div className="text-center">
//                 <div className="font-bold text-foreground">{profile.followingCount || 0}</div>
//                 <div className="text-primary-foreground">Following</div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </CardContent>
//     </Card>
//   );
// };

// export default ProfileCard;
