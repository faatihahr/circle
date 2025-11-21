import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginForm from '../components/LoginForm';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (data: { login: string; password: string }) => {
    await login(data);
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#d4af9f] via-[#9f7560] to-[#525034] flex items-center justify-center p-4">
        <LoginForm onLogin={handleLogin} />
    </div>
  );
};

export default LoginPage;
