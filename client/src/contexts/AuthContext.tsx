import React, { createContext, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAppDispatch, useAppSelector } from '../stores/hooks';
import { initializeAuth, login, register, forgotPassword, resetPassword, logout } from '../stores/userSlice';
import { toast } from 'sonner';

interface User {
  id: string;
  username: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (data: { login: string; password: string }) => Promise<void>;
  register: (data: { username: string; email: string; password: string; name?: string }) => Promise<void>;
  forgotPassword: (data: { email: string }) => Promise<{ message: string; resetToken?: string }>;
  resetPassword: (data: { token: string; newPassword: string }) => Promise<{ message: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, loading } = useAppSelector((state) => state.user);

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  const handleLogin = async (data: { login: string; password: string }) => {
    await dispatch(login(data));
  };

  const handleRegister = async (data: { username: string; email: string; password: string; name?: string }) => {
    await dispatch(register(data));
    toast.success('Registration successful! Please login.');
  };

  const handleForgotPassword = async (data: { email: string }) => {
    const result = await dispatch(forgotPassword(data));
    return result.payload as { message: string; resetToken?: string };
  };

  const handleResetPassword = async (data: { token: string; newPassword: string }) => {
    const result = await dispatch(resetPassword(data));
    return result.payload as { message: string };
  };

  const handleLogout = async () => {
    await dispatch(logout());
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    loading,
    login: handleLogin,
    register: handleRegister,
    forgotPassword: handleForgotPassword,
    resetPassword: handleResetPassword,
    logout: handleLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
