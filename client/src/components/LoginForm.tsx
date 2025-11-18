import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { toast } from 'sonner';
import { useAppSelector, useAppDispatch } from '../stores/hooks';
import { clearError } from '../stores/userSlice';

interface LoginFormProps {
  onLogin: (data: { login: string; password: string }) => Promise<void>;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    login: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();
  const error = useAppSelector((state) => state.user.error);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onLogin(formData);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto p-8 bg-white/80 backdrop-blur-sm border-white/80 cursor-pointer hover:shadow-lg transition-shadow">
      <CardHeader className="p-0 mb-2">
        <CardTitle className="text-primary text-4xl">circle</CardTitle>
        <CardDescription className="text-xl">Login to your Circle</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <Label htmlFor="login" className="text-lg">Username or Email</Label>
              <Input
                id="login"
                name="login"
                type="text"
                value={formData.login}
                onChange={handleChange}
                className="h-12 text-lg"
                required
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-lg">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="h-12 text-lg"
                required
              />
            </div>
          </div>
        </form> 
      </CardContent>
      <CardFooter className="flex flex-col items-center p-0 mt-6">
        <p className="text-xs mt-4 mb-2">
          Forgot your password? <Link to="/forgotPassword" className="text-blue-500 underline">reset password</Link>
        </p>
        <Button type="submit" onClick={handleSubmit} className="w-full h-12 text-lg hover:will-change-transform" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </Button>
        <p className="text-lg mt-4">
          Don't have an account? <Link to="/register" className="text-blue-500 underline">Register here</Link>
        </p>
      </CardFooter>
    </Card>
  );
};

export default LoginForm;
