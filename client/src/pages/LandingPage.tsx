import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import circleSvg from '@/assets/circle.svg';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    // Simulate loading time for logo animation
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleNavigateToLogin = () => {
    setIsNavigating(true);
    setTimeout(() => {
      navigate('/login');
    }, 1500);
  };

  const handleNavigateToRegister = () => {
    setIsNavigating(true);
    setTimeout(() => {
      navigate('/register');
    }, 1500);
  };

  if (isLoading || isNavigating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <img
            src={circleSvg}
            alt="App Logo"
            className="w-72 h-72 animate-spin mx-auto mb-4"
          />
          <p className="text-lg font-semibold text-foreground">
            {isLoading ? 'Loading...' : 'Navigating...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="grid grid-cols-1 md:grid-cols-3 min-h-screen">
        {/* Left Column - Logo (larger) */}
        <div className="col-span-2 flex items-center justify-center p-8 bg-card rounded-r-lg md:rounded-r-none">
          <div className="text-center animate-fade-in">
            <img
              src={circleSvg}
              alt="App Logo"
              className="w-72 h-72 mx-auto mb-6 transition-transform duration-1000 hover:scale-105"
            />
            <h1 className="text-5xl font-bold text-primary mb-4">
              Circle
            </h1>
            <p className="text-lg text-muted-foreground">
              Connect with friends and the world around you
            </p>
          </div>
        </div>

        {/* Right Column - Introduction Card */}
        <div className="col-span-1 flex items-center justify-center p-8">
          <Card className="w-full max-w-md border-0 animate-slide-in">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">Welcome</CardTitle>
              <CardDescription className="leading-relaxed">
                Join our community of social media enthusiasts. Share your thoughts,
                connect with friends, and discover amazing content from around the world.
                Whether you're here to stay updated or share your creativity,
                our platform is designed for everyone.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <Button
                onClick={handleNavigateToLogin}
                className="w-full"
                size="lg"
              >
                Login to Your Account
              </Button>

              <Button
                onClick={handleNavigateToRegister}
                variant="secondary"
                className="w-full"
                size="lg"
              >
                Create New Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
