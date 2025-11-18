import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ResetPass from '@/components/resetPass';

const ResetPasswordPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { resetPassword } = useAuth();
    const token = searchParams.get('token') || '';
    const handleResetPassword = async (data: { email: string; resetToken: string; newPassword: string }) => {
        await resetPassword({ token: data.resetToken, newPassword: data.newPassword });
        navigate('/login');
    }
    return <ResetPass onSubmit={handleResetPassword} initialToken={token} />;
};

export default ResetPasswordPage;
