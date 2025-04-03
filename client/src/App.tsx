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
import Discover from "@/pages/discover";
import { OnboardingProvider, OnboardingTour, WelcomeDialog } from "@/components/onboarding";
import { useState, useEffect } from "react";

function App() {
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  
  // Check if user is new (for demo purposes, we'll show welcome dialog on first visit)
  useEffect(() => {
    const hasVisitedBefore = localStorage.getItem('booknest_visited');
    if (!hasVisitedBefore) {
      // Set a small delay to ensure the UI is fully loaded
      const timer = setTimeout(() => {
        setShowWelcomeDialog(true);
        localStorage.setItem('booknest_visited', 'true');
      }, 1000);
      
      return () => clearTimeout(timer);
    }
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
            <Route path="/discover" component={Discover} />
            <Route component={NotFound} />
          </Switch>
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
