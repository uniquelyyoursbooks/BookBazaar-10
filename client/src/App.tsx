import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { Navbar } from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import Home from "@/pages/home";
import BookDetails from "@/pages/book-details";
import ReadBook from "@/pages/read-book";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import AuthorDashboard from "@/pages/dashboard/author-dashboard";
import UploadBook from "@/pages/dashboard/upload-book";
import EditBook from "@/pages/dashboard/edit-book";
import Analytics from "@/pages/dashboard/analytics";
import MoodBoard from "@/pages/dashboard/mood-board";
import Discover from "@/pages/discover";
import { OnboardingProvider, OnboardingTour, WelcomeDialog } from "@/components/onboarding";
import { useState, useEffect } from "react";

function App() {
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  
  // For development/demo purposes, always show the welcome dialog on each app start
  useEffect(() => {
    // Clear localStorage to simulate first visit every time (for demo purposes)
    localStorage.removeItem('booknest_visited');
    localStorage.removeItem('booknest_onboarding');
    
    // Set a small delay to ensure the UI is fully loaded
    const timer = setTimeout(() => {
      setShowWelcomeDialog(true);
      // We'll set this flag when dialog is closed, not here
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <OnboardingProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/books/:id" component={BookDetails} />
            <Route path="/read/:id" component={ReadBook} />
            <Route path="/login" component={Login} />
            <Route path="/register" component={Register} />
            <Route path="/dashboard" component={AuthorDashboard} />
            <Route path="/dashboard/upload" component={UploadBook} />
            <Route path="/dashboard/edit/:id" component={EditBook} />
            <Route path="/dashboard/analytics" component={Analytics} />
            <Route path="/dashboard/mood-board" component={MoodBoard} />
            <Route path="/discover" component={Discover} />
            <Route component={NotFound} />
          </Switch>
          
          {/* Test button to manually trigger dialog (for development only) */}
          <div className="fixed bottom-4 right-4 z-50">
            <button 
              onClick={() => setShowWelcomeDialog(true)} 
              className="bg-secondary text-white px-4 py-2 rounded-md shadow-md"
            >
              Show Onboarding
            </button>
          </div>
        </main>
        <Footer />
        <Toaster />
        
        {/* Onboarding components */}
        <WelcomeDialog 
          open={showWelcomeDialog} 
          onOpenChange={setShowWelcomeDialog} 
        />
        <OnboardingTour />
      </div>
    </OnboardingProvider>
  );
}

export default App;
