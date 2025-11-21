import React, { useState, useRef, useEffect } from 'react';
import { X, Camera } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../stores/hooks';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { authAPI } from '../lib/api';
import { getProfile, updateProfile } from '../stores/userSlice';
import type { UserState } from '../stores/userSlice';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  
  // Selector langsung dari Redux
  const { user, profile, loading, isAuthenticated } = useSelector((state: { user: UserState }) => state.user);
  
  const [saving, setSaving] = useState(false);
  const [editedData, setEditedData] = useState({
    name: '',
    bio: '',
    profilePicture: '',
    image_headers: ''
  });
  const [uploadingProfilePicture, setUploadingProfilePicture] = useState(false);
  const [uploadingHeaderImage, setUploadingHeaderImage] = useState(false);
  const profilePictureInputRef = useRef<HTMLInputElement>(null);
  const headerImageInputRef = useRef<HTMLInputElement>(null);

  // Fetch profile if modal is opened and no profile exists
  useEffect(() => {
    if (isOpen && isAuthenticated && !profile && !loading) {
      dispatch(getProfile());
    }
  }, [isOpen, isAuthenticated, profile, loading, dispatch]);

  useEffect(() => {
    if (profile) {
      setEditedData({
        name: profile.name || '',
        bio: profile.bio || '',
        profilePicture: profile.profilePicture || '',
        image_headers: (profile as any).image_headers || ''
      });
    }
  }, [profile]);

  useEffect(() => {
    if (isOpen && profile) {
      setEditedData({
        name: profile.name || '',
        bio: profile.bio || '',
        profilePicture: profile.profilePicture || '',
        image_headers: (profile as any).image_headers || ''
      });
    }
  }, [isOpen, profile]);

  const handleProfilePictureChange = () => {
    profilePictureInputRef.current?.click();
  };

  const handleHeaderImageChange = () => {
    headerImageInputRef.current?.click();
  };

  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingProfilePicture(true);
    try {
      const uploadResponse = await authAPI.uploadImage(file);
      setEditedData(prev => ({ ...prev, profilePicture: uploadResponse.imageUrl }));
    } catch (error) {
      console.error('Failed to upload profile picture:', error);
      alert('Failed to upload profile picture. Please try again.');
    } finally {
      setUploadingProfilePicture(false);
    }
  };

  const handleHeaderImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingHeaderImage(true);
    try {
      const uploadResponse = await authAPI.uploadImage(file);
      setEditedData(prev => ({ ...prev, image_headers: uploadResponse.imageUrl }));
    } catch (error) {
      console.error('Failed to upload header image:', error);
      alert('Failed to upload header image. Please try again.');
    } finally {
      setUploadingHeaderImage(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      // Collect values from the form inputs
      const nameInput = document.getElementById('name') as HTMLInputElement;
      const bioInput = document.getElementById('bio') as HTMLTextAreaElement;

      const updateData = {
        name: nameInput?.value || editedData.name,
        bio: bioInput?.value || editedData.bio,
        ...(editedData.profilePicture !== profile.profilePicture && { profilePicture: editedData.profilePicture }),
        ...(editedData.image_headers !== (profile as any).image_headers && { image_headers: editedData.image_headers })
      };

      // Dispatch updateProfile action - this will update state automatically after success
      await dispatch(updateProfile(updateData));
      onClose(); // Close the modal
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form data and close modal
    if (profile) {
      setEditedData({
        name: profile.name || '',
        bio: profile.bio || '',
        profilePicture: profile.profilePicture || '',
        image_headers: (profile as any).image_headers || ''
      });
    }
    onClose();
  };

  if (!isOpen) return null;

  if (loading) {
    return null; // Don't show loading in modal
  }

  if (!profile) {
    return null; // Don't render modal if no profile
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative max-w-lg w-full mx-4 bg-background rounded-lg shadow-xl overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 hover:bg-muted rounded-full transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header Banner with change image overlay */}
        <div
          className="h-32 bg-gradient-to-r from-primary to-accent relative cursor-pointer group"
          onClick={handleHeaderImageChange}
        >
          {editedData.image_headers && (
            <img
              src={`http://localhost:3000${editedData.image_headers}`}
              alt="Profile header"
              className="w-full h-full object-cover absolute inset-0 transition-opacity group-hover:opacity-75"
            />
          )}
          {/* Change header image overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
            <Camera className="h-8 w-8" />
          </div>
        </div>

        {/* Avatar with change image overlay */}
        <div className="flex px-6 pb-6 pt-4">
          {/* Avatar positioned over header */}
          <div
            className="-mt-12 relative mr-4 w-20 h-20 cursor-pointer group"
            onClick={handleProfilePictureChange}
          >
            <Avatar className="w-20 h-20 border-4 border-background transition-opacity group-hover:opacity-75">
              <AvatarImage
                src={editedData.profilePicture ? `http://localhost:3000${editedData.profilePicture}` : undefined}
                alt={profile.name || profile.username}
              />
              <AvatarFallback className="text-2xl">
                {(profile.name || profile.username).charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {/* Change avatar image overlay */}
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black/50 rounded-full text-white">
              <Camera className="h-4 w-4" />
            </div>
          </div>

          {/* Profile info */}
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground">{profile.name}</h2>
            <p className="text-muted-foreground text-sm">@{profile.username}</p>

            {/* Editable Display Name */}
            <Input
              id="name"
              className="mt-3"
              defaultValue={editedData.name}
              placeholder="Enter your display name"
              onChange={(e) => setEditedData(prev => ({ ...prev, name: e.target.value }))}
            />

            {/* Editable Bio */}
            <textarea
              id="bio"
              className="w-full mt-3 p-2 text-sm resize-none border rounded"
              defaultValue={editedData.bio || ''}
              placeholder="Tell something about yourself..."
              rows={3}
              maxLength={500}
              onChange={(e) => setEditedData(prev => ({ ...prev, bio: e.target.value }))}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-2 p-4 border-t">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={profilePictureInputRef}
        type="file"
        accept="image/*"
        onChange={handleProfilePictureUpload}
        className="hidden"
      />
      <input
        ref={headerImageInputRef}
        type="file"
        accept="image/*"
        onChange={handleHeaderImageUpload}
        className="hidden"
      />
    </div>
  );
};

export default EditProfileModal;


// import React, { useState, useRef, useEffect } from 'react';
// import { X, Camera } from 'lucide-react';
// // import { useFetchProfile } from '../hooks/useFetchProfile';
// import { Button } from './ui/button';
// import { Input } from './ui/input';
// import { Label } from './ui/label';
// import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
// import { authAPI } from '../lib/api';

// interface EditProfileModalProps {
//   isOpen: boolean;
//   onClose: () => void;
// }

// const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
//   const { profile, loading, refetch } = useFetchProfile();
//   const [saving, setSaving] = useState(false);
//   const [editedData, setEditedData] = useState({
//     name: '',
//     bio: '',
//     profilePicture: '',
//     image_headers: ''
//   });
//   const [uploadingProfilePicture, setUploadingProfilePicture] = useState(false);
//   const [uploadingHeaderImage, setUploadingHeaderImage] = useState(false);
//   const profilePictureInputRef = useRef<HTMLInputElement>(null);
//   const headerImageInputRef = useRef<HTMLInputElement>(null);

//   useEffect(() => {
//     if (profile) {
//       setEditedData({
//         name: profile.name || '',
//         bio: profile.bio || '',
//         profilePicture: profile.profilePicture || '',
//         image_headers: (profile as any).image_headers || ''
//       });
//     }
//   }, [profile]);

//   useEffect(() => {
//     if (isOpen && profile) {
//       setEditedData({
//         name: profile.name || '',
//         bio: profile.bio || '',
//         profilePicture: profile.profilePicture || '',
//         image_headers: (profile as any).image_headers || ''
//       });
//     }
//   }, [isOpen, profile]);

//   const handleProfilePictureChange = () => {
//     profilePictureInputRef.current?.click();
//   };

//   const handleHeaderImageChange = () => {
//     headerImageInputRef.current?.click();
//   };

//   const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (!file) return;

//     setUploadingProfilePicture(true);
//     try {
//       const uploadResponse = await authAPI.uploadImage(file);
//       setEditedData(prev => ({ ...prev, profilePicture: uploadResponse.imageUrl }));
//     } catch (error) {
//       console.error('Failed to upload profile picture:', error);
//       alert('Failed to upload profile picture. Please try again.');
//     } finally {
//       setUploadingProfilePicture(false);
//     }
//   };

//   const handleHeaderImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (!file) return;

//     setUploadingHeaderImage(true);
//     try {
//       const uploadResponse = await authAPI.uploadImage(file);
//       setEditedData(prev => ({ ...prev, image_headers: uploadResponse.imageUrl }));
//     } catch (error) {
//       console.error('Failed to upload header image:', error);
//       alert('Failed to upload header image. Please try again.');
//     } finally {
//       setUploadingHeaderImage(false);
//     }
//   };

//   const handleSave = async () => {
//     if (!profile) return;

//     setSaving(true);
//     try {
//       // Collect values from the form inputs
//       const nameInput = document.getElementById('name') as HTMLInputElement;
//       const bioInput = document.getElementById('bio') as HTMLTextAreaElement;

//       const updateData = {
//         name: nameInput?.value || editedData.name,
//         bio: bioInput?.value || editedData.bio,
//         ...(editedData.profilePicture !== profile.profilePicture && { profilePicture: editedData.profilePicture }),
//         ...(editedData.image_headers !== (profile as any).image_headers && { image_headers: editedData.image_headers })
//       };

//       await authAPI.updateProfile(updateData);
//       await refetch(); // Refresh profile data
//       onClose(); // Close the modal
//     } catch (error) {
//       console.error('Failed to update profile:', error);
//       alert('Failed to update profile. Please try again.');
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleCancel = () => {
//     // Reset form data and close modal
//     if (profile) {
//       setEditedData({
//         name: profile.name || '',
//         bio: profile.bio || '',
//         profilePicture: profile.profilePicture || '',
//         image_headers: (profile as any).image_headers || ''
//       });
//     }
//     onClose();
//   };

//   if (!isOpen) return null;

//   if (loading) {
//     return null; // Don't show loading in modal
//   }

//   if (!profile) {
//     return null; // Don't render modal if no profile
//   }

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
//       <div className="relative max-w-lg w-full mx-4 bg-background rounded-lg shadow-xl overflow-hidden">
//         {/* Close button */}
//         <button
//           onClick={onClose}
//           className="absolute top-4 right-4 z-10 p-2 hover:bg-muted rounded-full transition-colors"
//         >
//           <X className="h-4 w-4" />
//         </button>

//         {/* Header Banner with change image overlay */}
//         <div
//           className="h-32 bg-gradient-to-r from-primary to-accent relative cursor-pointer group"
//           onClick={handleHeaderImageChange}
//         >
//           {editedData.image_headers && (
//             <img
//               src={`http://localhost:3000${editedData.image_headers}`}
//               alt="Profile header"
//               className="w-full h-full object-cover absolute inset-0 transition-opacity group-hover:opacity-75"
//             />
//           )}
//           {/* Change header image overlay */}
//           <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
//             <Camera className="h-8 w-8" />
//           </div>
//         </div>

//         {/* Avatar with change image overlay */}
//         <div className="flex px-6 pb-6 pt-4">
//           {/* Avatar positioned over header */}
//           <div
//             className="-mt-12 relative mr-4 w-20 h-20 cursor-pointer group"
//             onClick={handleProfilePictureChange}
//           >
//             <Avatar className="w-20 h-20 border-4 border-background transition-opacity group-hover:opacity-75">
//               <AvatarImage
//                 src={editedData.profilePicture ? `http://localhost:3000${editedData.profilePicture}` : undefined}
//                 alt={profile.name || profile.username}
//               />
//               <AvatarFallback className="text-2xl">
//                 {(profile.name || profile.username).charAt(0).toUpperCase()}
//               </AvatarFallback>
//             </Avatar>
//             {/* Change avatar image overlay */}
//             <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black/50 rounded-full text-white">
//               <Camera className="h-4 w-4" />
//             </div>
//           </div>

//           {/* Profile info */}
//           <div className="flex-1">
//             <h2 className="text-xl font-bold text-foreground">{profile.name}</h2>
//             <p className="text-muted-foreground text-sm">@{profile.username}</p>

//             {/* Editable Display Name */}
//             <Input
//               id="name"
//               className="mt-3"
//               defaultValue={editedData.name}
//               placeholder="Enter your display name"
//               onChange={(e) => setEditedData(prev => ({ ...prev, name: e.target.value }))}
//             />

//             {/* Editable Bio */}
//             <textarea
//               id="bio"
//               className="w-full mt-3 p-2 text-sm resize-none border rounded"
//               defaultValue={editedData.bio || ''}
//               placeholder="Tell something about yourself..."
//               rows={3}
//               maxLength={500}
//               onChange={(e) => setEditedData(prev => ({ ...prev, bio: e.target.value }))}
//             />
//           </div>
//         </div>

//         {/* Action buttons */}
//         <div className="flex justify-end gap-2 p-4 border-t">
//           <Button variant="outline" onClick={handleCancel}>
//             Cancel
//           </Button>
//           <Button onClick={handleSave} disabled={saving}>
//             {saving ? 'Saving...' : 'Save'}
//           </Button>
//         </div>
//       </div>

//       {/* Hidden file inputs */}
//       <input
//         ref={profilePictureInputRef}
//         type="file"
//         accept="image/*"
//         onChange={handleProfilePictureUpload}
//         className="hidden"
//       />
//       <input
//         ref={headerImageInputRef}
//         type="file"
//         accept="image/*"
//         onChange={handleHeaderImageUpload}
//         className="hidden"
//       />
//     </div>
//   );
// };

// export default EditProfileModal;
