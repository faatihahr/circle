import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ForgotPassword from '../components/forgotPass';

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { forgotPassword } = useAuth();
    const handleForgotPassword = async (data: { email: string }) => {
    await forgotPassword(data);
    navigate('/resetPassword');
  }

  return <ForgotPassword onSubmit={handleForgotPassword} />;
};

export default ForgotPasswordPage;
