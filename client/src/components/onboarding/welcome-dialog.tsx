import React from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useOnboarding } from './onboarding-context';

interface WelcomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const WelcomeDialog: React.FC<WelcomeDialogProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const { startOnboarding, skipOnboarding } = useOnboarding();

  const handleRoleSelection = (role: 'author' | 'reader') => {
    startOnboarding(role);
    onOpenChange(false);
    // For demo purposes, mark as visited when dialog is closed after selection
    localStorage.setItem('booknest_visited', 'true');
    console.log(`Selected role: ${role}, starting onboarding tour...`);
  };

  const handleSkip = () => {
    skipOnboarding();
    onOpenChange(false);
    // For demo purposes, mark as visited when dialog is closed after skipping
    localStorage.setItem('booknest_visited', 'true');
    console.log('Skipped onboarding');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center mb-2">
            Welcome to BookNest!
          </DialogTitle>
          <DialogDescription className="text-center text-lg">
            Your gateway to publishing and discovering great books
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 gap-8 py-6">
          <motion.div 
            className="flex flex-col items-center space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-center">
              Tell us how you plan to use BookNest, and we'll customize your experience accordingly.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.05 }}
              className="flex flex-col items-center"
            >
              <Button 
                onClick={() => handleRoleSelection('author')}
                className="w-full h-24 flex flex-col items-center justify-center space-y-2 bg-gradient-to-br from-primary to-primary/70"
              >
                <i className="fas fa-pen-fancy text-xl"></i>
                <span className="font-medium">I'm an Author</span>
              </Button>
              <p className="text-sm text-center mt-2 text-neutral-600">
                I want to publish and share my books with readers
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.05 }}
              className="flex flex-col items-center"
            >
              <Button 
                onClick={() => handleRoleSelection('reader')}
                className="w-full h-24 flex flex-col items-center justify-center space-y-2 bg-gradient-to-br from-secondary to-secondary/70"
              >
                <i className="fas fa-book-reader text-xl"></i>
                <span className="font-medium">I'm a Reader</span>
              </Button>
              <p className="text-sm text-center mt-2 text-neutral-600">
                I want to discover and read great books
              </p>
            </motion.div>
          </div>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-center">
          <Button 
            variant="link" 
            onClick={handleSkip}
            className="text-neutral-500"
          >
            Skip for now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};