import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/forgotPassword';
import HomePage from './pages/HomePage';
import ResetPasswordPage from './pages/resetPassword';
import LandingPage from './pages/LandingPage';
import { Toaster } from './components/ui/sonner';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  console.log('PrivateRoute: isAuthenticated:', isAuthenticated, 'loading:', loading);

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  return isAuthenticated ? <>{children}</> : <LoginPage />;
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgotPassword" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/home" element={<PrivateRoute><HomePage /></PrivateRoute>} />
        <Route path="/" element={<LandingPage />} />
      </Routes>
      <Toaster />
    </Router>
  );
};

export default App;
