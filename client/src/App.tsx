import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { PostsProvider } from './contexts/PostsContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/forgotPassword';
import HomePage from './pages/HomePage';
import ResetPasswordPage from './pages/resetPassword';
import LandingPage from './pages/LandingPage';
import ThreadPage from './pages/ThreadPage';
import EditProfilePage from './pages/EditProfilePage';
import ProfileViewPage from './pages/ProfilePage';
import { Toaster } from './components/ui/sonner';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  console.log('PrivateRoute: isAuthenticated:', isAuthenticated, 'loading:', loading);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <LoginPage />;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  return isAuthenticated == true ? <Navigate to="/home" replace /> : <>{children}</>;
};

const App = () => {
  return (
    <Router>
      <PostsProvider> 
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/forgotPassword" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/" element={<LandingPage />} />
          
          {/* Private routes */}
          <Route path="/home" element={<PrivateRoute><HomePage /></PrivateRoute>} />
          <Route path="/profile/:userId" element={<PrivateRoute><ProfileViewPage /></PrivateRoute>} />
          <Route path="/editprofile" element={<PrivateRoute><EditProfilePage /></PrivateRoute>} />
          <Route path="/thread/:id" element={<PrivateRoute><ThreadPage /></PrivateRoute>} />
        </Routes>
      </PostsProvider>
      <Toaster />
    </Router>
  );
};

export default App;
