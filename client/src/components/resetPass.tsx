import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';

interface ResetPassProps {
    onSubmit: (data: { email: string; resetToken: string; newPassword: string }) => Promise<void>;
    initialToken?: string;
}

const ResetPass: React.FC<ResetPassProps> = ({ onSubmit, initialToken }) => {
    const [formData, setFormData] = useState({
        email: '',
        resetToken: initialToken || '',
        newPassword: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await onSubmit(formData);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Password reset failed');
        } finally {
            setLoading(false);
        }   
    };

    return (
        <Card className="max-w-3xl mx-auto p-8 mt-2 bg-white/80 backdrop-blur-sm border-white/80">
            <CardHeader className="p-0 mb-2">
                <CardTitle className="text-primary text-4xl">circle</CardTitle>
                <CardDescription className="text-xl">Reset your password</CardDescription>
            </CardHeader>
            <CardContent className="p-0">   
                <form onSubmit={handleSubmit}>
                    <div className="space-y-6">
                        <div>   
                            <Label htmlFor="email" className="text-lg">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="h-12 text-lg"
                                required
                            />
                        </div>  
                        <div>   
                            <Label htmlFor="resetToken" className="text-lg">Reset Token</Label>
                            <Input
                                id="resetToken"
                                name="resetToken"
                                type="text"
                                value={formData.resetToken}
                                onChange={handleChange}
                                className="h-12 text-lg"
                                required
                            />
                        </div>  
                        <div>   
                            <Label htmlFor="newPassword" className="text-lg">New Password</Label>
                            <Input
                                id="newPassword"
                                name="newPassword"
                                type="password"
                                value={formData.newPassword}
                                onChange={handleChange}
                                className="h-12 text-lg"
                                required
                            />
                        </div>  
                    </div>
                    {error && <p className="text-red-500 mt-4">{error}</p>}
                    <CardFooter className="p-0 mt-6">
                        <Button type="submit" className="w-full h-12 text-lg" disabled={loading}>   
                            {loading ? 'Submitting...' : 'Reset Password'}
                        </Button>   
                    </CardFooter>
                </form>
            </CardContent>
        </Card>
    );
};

export default ResetPass;
