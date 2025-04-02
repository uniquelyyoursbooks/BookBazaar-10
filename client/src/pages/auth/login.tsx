import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Form schema
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginValues = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  // Form initialization
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginValues) => {
      return await apiRequest("POST", "/api/auth/login", data);
    },
    onSuccess: () => {
      toast({
        title: "Login successful",
        description: "You have been logged in successfully.",
        duration: 3000,
      });
      
      // Redirect to dashboard or previous page
      navigate("/dashboard");
    },
    onError: () => {
      toast({
        title: "Login failed",
        description: "Invalid username or password. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    },
  });
  
  // Form submission handler
  function onSubmit(data: LoginValues) {
    loginMutation.mutate(data);
  }
  
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-primary serif text-center">Welcome Back</CardTitle>
          <CardDescription className="text-center">
            Sign in to continue to your BookNest account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full bg-secondary hover:bg-secondary-dark"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </Form>
          
          <div className="mt-4 text-center text-sm">
            <a href="#" className="text-secondary hover:underline">
              Forgot password?
            </a>
          </div>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-neutral-600">
            Don't have an account? {" "}
            <Link href="/register">
              <a className="text-secondary hover:underline">
                Register
              </a>
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
