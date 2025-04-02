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

type LoginProps = {
  onLogin: (user: UserType) => void;
};

export default function Login({ onLogin }: LoginProps) {
  const [, navigate] = useLocation();
  
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: ''
  });
  
  const [loginError, setLoginError] = useState<string | null>(null);
  
  const loginMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/auth/login', loginForm);
      return response.json();
    },
    onSuccess: (data) => {
      onLogin(data);
      
      // Check if there's a redirect in the URL
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect');
      
      // Navigate to the redirect path or dashboard
      navigate(redirect || '/dashboard');
    },
    onError: (error) => {
      if (error instanceof Error) {
        setLoginError(error.message);
      } else {
        setLoginError('Invalid username or password');
      }
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    loginMutation.mutate();
  };
  
  return (
    <div className="bg-[#F9F6F2] min-h-screen py-16 flex items-center">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold font-['Merriweather']">Sign In to BookVerse</CardTitle>
              <CardDescription>Continue your publishing journey</CardDescription>
            </CardHeader>
            
            <CardContent>
              {loginError && (
                <Alert className="mb-6 bg-red-50 border-red-200 text-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{loginError}</AlertDescription>
                </Alert>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                    placeholder="Enter your username"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link href="#" className="text-sm text-primary hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                    placeholder="Enter your password"
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-[#E67E22] hover:bg-[#E67E22]/90"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </CardContent>
            
            <CardFooter className="flex justify-center">
              <p className="text-sm text-[#777777]">
                Don't have an account?{' '}
                <Link href="/register" className="text-primary hover:underline">
                  Register
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
