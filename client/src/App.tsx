import { useEffect, useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "./lib/queryClient";

// Pages
import Home from "@/pages/Home";
import BookDetail from "@/pages/BookDetail";
import Reader from "@/pages/Reader";
import AuthorProfile from "@/pages/AuthorProfile";
import AuthorDashboard from "@/pages/AuthorDashboard";
import Upload from "@/pages/Upload";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Search from "@/pages/Search";
import NotFound from "@/pages/not-found";

// Components
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export type UserType = {
  id: number;
  username: string;
  email: string;
  displayName: string;
  bio?: string;
  profileImage?: string;
  bannerImage?: string;
  createdAt: string;
};

function App() {
  const [user, setUser] = useState<UserType | null>(null);
  const [, navigate] = useLocation();

  // Check if there's a user in localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem("user");
      }
    }
  }, []);
  
  const handleLogin = (userData: UserType) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };
  
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F6F2]">
      <Header user={user} onLogout={handleLogout} />
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={() => <Home />} />
          <Route path="/books/:id" component={BookDetail} />
          <Route path="/read/:id" component={(params) => <Reader user={user} bookId={parseInt(params.id)} />} />
          <Route path="/author/:id" component={AuthorProfile} />
          <Route path="/dashboard" component={() => user ? <AuthorDashboard user={user} /> : <Login onLogin={handleLogin} />} />
          <Route path="/upload" component={() => user ? <Upload user={user} /> : <Login onLogin={handleLogin} />} />
          <Route path="/login" component={() => <Login onLogin={handleLogin} />} />
          <Route path="/register" component={() => <Register onRegister={handleLogin} />} />
          <Route path="/search" component={Search} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

export default App;
