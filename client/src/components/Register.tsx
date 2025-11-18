import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { toast } from 'sonner';
import { useAppSelector, useAppDispatch } from '../stores/hooks';
import { clearError } from '../stores/userSlice';

interface RegisterProps {
  onRegister: (data: { username: string; email: string; password: string; name: string }) => void;
}

const Register: React.FC<RegisterProps> = ({ onRegister }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    name: '',
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
      await onRegister(formData);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto p-8 bg-white/80 backdrop-blur-sm border-white/80 hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader className="p-0 mb-2">
        <CardTitle className="text-primary text-4xl">circle</CardTitle>
        <CardDescription className="text-xl">Create Circle account</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-lg">Name (Optional)</Label>
              <Input
                id="name"
                name="name"
                type="text"
                className="h-12 text-lg"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="username" className="text-lg">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                className="h-12 text-lg"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-lg">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                className="h-12 text-lg"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-lg">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                className="h-12 text-lg"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className='flex flex-col items-center p-0 mt-6'>
        <Button type="submit" onClick={handleSubmit} className="w-full h-12 text-lg hover:will-change-transform" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </Button>
        <p className="text-lg mt-4">
          Already have an account? <Link to="/login" className="text-blue-500 underline">Login here</Link>
        </p>
      </CardFooter>
    </Card>
  );
};

export default Register;
