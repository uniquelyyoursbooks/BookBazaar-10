import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

export const Navbar: React.FC = () => {
  const [location, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Mock checking for logged-in user - in a real app this would come from auth context or similar
  const { data: user } = useQuery<User | null>({
    queryKey: ['/api/auth/me'],
    queryFn: async () => null, // This would normally fetch the current user
    // We'll just return null for now as we don't have auth implemented fully
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/discover?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const isActive = (path: string) => {
    return location === path ? "text-neutral-900" : "text-neutral-600 hover:text-neutral-900";
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/">
                <div className="flex items-center cursor-pointer">
                  <i className="fas fa-book-open text-secondary text-xl mr-2"></i>
                  <span className="text-xl font-bold text-primary serif">BookNest</span>
                </div>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-8">
              <Link href="/discover">
                <a className={`px-3 py-2 text-sm font-medium books-discovery ${isActive("/discover")}`}>
                  Discover
                </a>
              </Link>
              <Link href="/discover?category=all">
                <a className={`px-3 py-2 text-sm font-medium ${isActive("/discover?category=all")}`}>
                  Browse
                </a>
              </Link>
              <Link href="/discover?view=authors">
                <a className={`px-3 py-2 text-sm font-medium ${isActive("/discover?view=authors")}`}>
                  Authors
                </a>
              </Link>
              <Link href="/recommendations">
                <a className={`px-3 py-2 text-sm font-medium ${isActive("/recommendations")}`}>
                  Recommendations
                </a>
              </Link>
              <Link href="/dashboard/upload">
                <a className={`px-3 py-2 text-sm font-medium upload-book ${isActive("/dashboard/upload")}`}>
                  Publish
                </a>
              </Link>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <form onSubmit={handleSearch} className="relative">
              <Input
                type="text"
                placeholder="Search books, authors..."
                className="w-64 pl-10 pr-3 py-2 rounded-md border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="fas fa-search text-neutral-400"></i>
              </div>
            </form>
            <div className="ml-4 flex items-center">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full user-profile">
                      <span className="sr-only">Open user menu</span>
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-secondary text-white">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/dashboard")} className="author-dashboard">
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/dashboard/upload")}>
                      Upload Book
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/dashboard/mood-board")}>
                      Writing Mood Board
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/dashboard/cover-designer")}>
                      Cover Designer
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/login")}>
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/login">
                  <Button className="bg-secondary hover:bg-secondary-dark text-white user-profile">
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center sm:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-neutral-400 hover:text-neutral-500 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-secondary"
              onClick={toggleMobileMenu}
            >
              <i className="fas fa-bars text-xl"></i>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <Link href="/discover">
              <a className="block pl-3 pr-4 py-2 border-l-4 border-secondary text-neutral-700 bg-neutral-50 font-medium">
                Discover
              </a>
            </Link>
            <Link href="/discover?category=all">
              <a className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-neutral-600 hover:bg-neutral-50 hover:border-neutral-300 hover:text-neutral-700 font-medium">
                Browse
              </a>
            </Link>
            <Link href="/discover?view=authors">
              <a className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-neutral-600 hover:bg-neutral-50 hover:border-neutral-300 hover:text-neutral-700 font-medium">
                Authors
              </a>
            </Link>
            <Link href="/recommendations">
              <a className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-neutral-600 hover:bg-neutral-50 hover:border-neutral-300 hover:text-neutral-700 font-medium">
                Recommendations
              </a>
            </Link>
            <Link href="/dashboard/upload">
              <a className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-neutral-600 hover:bg-neutral-50 hover:border-neutral-300 hover:text-neutral-700 font-medium">
                Publish
              </a>
            </Link>
            <Link href="/dashboard/mood-board">
              <a className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-neutral-600 hover:bg-neutral-50 hover:border-neutral-300 hover:text-neutral-700 font-medium">
                Mood Board
              </a>
            </Link>
            <Link href="/dashboard/cover-designer">
              <a className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-neutral-600 hover:bg-neutral-50 hover:border-neutral-300 hover:text-neutral-700 font-medium">
                Cover Designer
              </a>
            </Link>
          </div>
          <div className="pt-4 pb-3 border-t border-neutral-200">
            <div className="flex items-center px-4">
              <form onSubmit={handleSearch} className="relative w-full">
                <Input
                  type="text"
                  placeholder="Search books, authors..."
                  className="w-full pl-10 pr-3 py-2 rounded-md border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-search text-neutral-400"></i>
                </div>
              </form>
            </div>
            <div className="mt-3 space-y-1">
              <Link href="/login">
                <a className="block px-4 py-2 text-center bg-secondary text-white rounded-md">
                  Sign In
                </a>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
