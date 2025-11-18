import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Register from '../components/Register';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleRegister = async (data: { username: string; email: string; password: string; name?: string }) => {
    await register(data);
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#d4af9f] via-[#aad31e] via-[#9f7560] to-[#525034] flex items-center justify-center p-4">
        <Register onRegister={handleRegister} />
    </div>
  );
};

export default RegisterPage;
