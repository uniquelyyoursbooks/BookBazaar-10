import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { UserType } from "@/App";
import { BookOpen, Menu, Search as SearchIcon, User, Upload, BookMarked, LogOut } from "lucide-react";

type HeaderProps = {
  user: UserType | null;
  onLogout: () => void;
};

export default function Header({ user, onLogout }: HeaderProps) {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };
  
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <Link href="/">
              <div className="text-3xl font-bold font-['Merriweather'] text-primary flex items-center cursor-pointer">
                <BookOpen className="mr-2" />
                <span>BookVerse</span>
              </div>
            </Link>
            <span className="ml-2 text-xs bg-[#2ECC71] text-white px-2 py-1 rounded-full">Beta</span>
          </div>

          {/* Search Bar - Desktop */}
          <div className="w-full md:w-1/3 mb-4 md:mb-0">
            <form onSubmit={handleSearch} className="relative">
              <Input 
                type="text" 
                placeholder="Search books or authors..." 
                className="w-full px-4 py-2 rounded-full border focus:outline-none focus:border-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button 
                type="submit"
                variant="ghost" 
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#777777]"
              >
                <SearchIcon size={18} />
              </Button>
            </form>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-2">
            <Link href="/search">
              <Button variant="ghost" className="text-[#777777] hover:text-primary">Explore</Button>
            </Link>
            <Link href="/register">
              <Button variant="ghost" className="text-[#777777] hover:text-primary">Learn</Button>
            </Link>
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="p-0 ml-2">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.profileImage} alt={user.displayName} />
                      <AvatarFallback className="bg-primary text-white">
                        {user.displayName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/author/${user.id}`}>My Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/upload">Upload Book</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onLogout} className="text-red-500">
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-[#E67E22] text-white hover:bg-[#E67E22]/90">
                    Publish
                  </Button>
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center ml-auto">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-[#777777]">
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="flex flex-col h-full py-6">
                  <div className="text-2xl font-bold font-['Merriweather'] text-primary mb-8">BookVerse</div>
                  
                  {user ? (
                    <div className="flex items-center mb-6 pb-6 border-b">
                      <Avatar className="h-12 w-12 mr-4">
                        <AvatarImage src={user.profileImage} alt={user.displayName} />
                        <AvatarFallback className="bg-primary text-white">
                          {user.displayName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-bold">{user.displayName}</h3>
                        <p className="text-sm text-[#777777]">@{user.username}</p>
                      </div>
                    </div>
                  ) : null}
                  
                  <nav className="flex-1 space-y-4">
                    <Link href="/search">
                      <Button variant="ghost" className="w-full justify-start text-[#777777]">
                        <SearchIcon className="mr-3" size={18} /> Explore Books
                      </Button>
                    </Link>
                    
                    {user ? (
                      <>
                        <Link href="/dashboard">
                          <Button variant="ghost" className="w-full justify-start text-[#777777]">
                            <BookMarked className="mr-3" size={18} /> Dashboard
                          </Button>
                        </Link>
                        <Link href={`/author/${user.id}`}>
                          <Button variant="ghost" className="w-full justify-start text-[#777777]">
                            <User className="mr-3" size={18} /> My Profile
                          </Button>
                        </Link>
                        <Link href="/upload">
                          <Button variant="ghost" className="w-full justify-start text-[#777777]">
                            <Upload className="mr-3" size={18} /> Upload Book
                          </Button>
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link href="/login">
                          <Button variant="ghost" className="w-full justify-start text-[#777777]">
                            <User className="mr-3" size={18} /> Sign In
                          </Button>
                        </Link>
                        <Link href="/register">
                          <Button variant="ghost" className="w-full justify-start text-[#777777]">
                            <Upload className="mr-3" size={18} /> Publish Book
                          </Button>
                        </Link>
                      </>
                    )}
                  </nav>
                  
                  {user && (
                    <Button 
                      variant="ghost" 
                      className="justify-start text-red-500 hover:bg-red-50 hover:text-red-600 mt-6"
                      onClick={onLogout}
                    >
                      <LogOut className="mr-3" size={18} /> Logout
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
