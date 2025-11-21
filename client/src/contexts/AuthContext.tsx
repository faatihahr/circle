import React, { createContext, useContext, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useAppDispatch, useAppSelector } from '../stores/hooks';
import { initializeAuth, login, register, forgotPassword, resetPassword, logout, getProfile } from '../stores/userSlice';
import { addNewThread, updateThreadReplyCount } from '../stores/postsSlice';
import { toast } from 'sonner';

interface User {
  id: string;
  username: string;
  email: string;
  name?: string;
  profilePicture?: string;
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
  const initializedRef = useRef(false);

  // Auto-initialize auth on app mount if token exists
  useEffect(() => {
    if (!initializedRef.current) {
      const token = localStorage.getItem('token');
      if (token) {
        dispatch(initializeAuth());
      }
      initializedRef.current = true;
    }
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

  // WebSocket setup DISABLED for debugging
  // const wsRef = useRef<WebSocket | null>(null);
  // const reconnectTimeoutRef = useRef<number | null>(null);
  // const connectingRef = useRef<boolean>(false);

  // useEffect(() => {
  //   console.log('🔧 WebSocket useEffect triggered', { isAuthenticated, userId: user?.id });
  // }, [isAuthenticated, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
