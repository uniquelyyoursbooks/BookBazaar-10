import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { UserType } from "@/App";
import { apiRequest } from "@/lib/queryClient";

type RegisterProps = {
  onRegister: (user: UserType) => void;
};

export default function Register({ onRegister }: RegisterProps) {
  const [, navigate] = useLocation();
  
  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });
  
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  const registerMutation = useMutation({
    mutationFn: async () => {
      // Validate form
      const newErrors: {[key: string]: string} = {};
      
      if (!registerForm.username.trim()) newErrors.username = 'Username is required';
      if (!registerForm.email.trim()) newErrors.email = 'Email is required';
      if (!registerForm.password.trim()) newErrors.password = 'Password is required';
      if (!registerForm.displayName.trim()) newErrors.displayName = 'Display name is required';
      
      if (registerForm.password !== registerForm.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        throw new Error('Please fix the errors in the form');
      }
      
      // Submit form if validation passes
      const response = await apiRequest('POST', '/api/auth/register', {
        username: registerForm.username,
        email: registerForm.email,
        password: registerForm.password,
        displayName: registerForm.displayName
      });
      
      return response.json();
    },
    onSuccess: (data) => {
      onRegister(data);
      navigate('/dashboard');
    },
    onError: (error) => {
      if (error instanceof Error) {
        // Check if the error message contains specific errors
        if (error.message.includes('Username already exists')) {
          setErrors({...errors, username: 'Username already exists'});
        } else if (error.message.includes('Email already in use')) {
          setErrors({...errors, email: 'Email already in use'});
        } else {
          setErrors({...errors, general: error.message});
        }
      } else {
        setErrors({...errors, general: 'Registration failed. Please try again.'});
      }
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    registerMutation.mutate();
  };
  
  return (
    <div className="bg-[#F9F6F2] min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold font-['Merriweather']">Create Your Author Account</CardTitle>
              <CardDescription>Begin your publishing journey with BookVerse</CardDescription>
            </CardHeader>
            
            <CardContent>
              {errors.general && (
                <Alert className="mb-6 bg-red-50 border-red-200 text-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.general}</AlertDescription>
                </Alert>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName" className={errors.displayName ? 'text-red-500' : ''}>Display Name</Label>
                  <Input
                    id="displayName"
                    type="text"
                    value={registerForm.displayName}
                    onChange={(e) => setRegisterForm({...registerForm, displayName: e.target.value})}
                    placeholder="Enter your author name"
                    className={errors.displayName ? 'border-red-500' : ''}
                    required
                  />
                  {errors.displayName && <p className="text-red-500 text-sm">{errors.displayName}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="username" className={errors.username ? 'text-red-500' : ''}>Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={registerForm.username}
                    onChange={(e) => setRegisterForm({...registerForm, username: e.target.value})}
                    placeholder="Choose a username"
                    className={errors.username ? 'border-red-500' : ''}
                    required
                  />
                  {errors.username && <p className="text-red-500 text-sm">{errors.username}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className={errors.email ? 'text-red-500' : ''}>Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                    placeholder="Enter your email address"
                    className={errors.email ? 'border-red-500' : ''}
                    required
                  />
                  {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className={errors.password ? 'text-red-500' : ''}>Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                    placeholder="Create a password"
                    className={errors.password ? 'border-red-500' : ''}
                    required
                  />
                  {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className={errors.confirmPassword ? 'text-red-500' : ''}>Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={registerForm.confirmPassword}
                    onChange={(e) => setRegisterForm({...registerForm, confirmPassword: e.target.value})}
                    placeholder="Confirm your password"
                    className={errors.confirmPassword ? 'border-red-500' : ''}
                    required
                  />
                  {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword}</p>}
                </div>
                
                <div className="pt-2">
                  <Button 
                    type="submit" 
                    className="w-full bg-[#E67E22] hover:bg-[#E67E22]/90"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </div>
              </form>
            </CardContent>
            
            <CardFooter className="flex justify-center">
              <p className="text-sm text-[#777777]">
                Already have an account?{' '}
                <Link href="/login" className="text-primary hover:underline">
                  Sign In
                </Link>
              </p>
            </CardFooter>
          </Card>
          
          <div className="mt-8 text-center">
            <Link href="/" className="text-sm text-[#777777] hover:underline">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
