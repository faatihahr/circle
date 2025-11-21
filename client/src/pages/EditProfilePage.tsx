import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const EditProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate(`/profile/${user.id}?edit=true`, { replace: true });
    }
  }, [user, navigate]);

  return null;
};

export default EditProfilePage;
