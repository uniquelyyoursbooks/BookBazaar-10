import React, { createContext, useContext, useState, useEffect } from 'react';

type UserRole = 'author' | 'reader' | null;

interface OnboardingContextType {
  isOnboarding: boolean;
  userRole: UserRole;
  startOnboarding: (role: UserRole) => void;
  completeOnboarding: () => void;
  skipOnboarding: () => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  totalSteps: number;
}

const LOCAL_STORAGE_KEY = 'booknest_onboarding';

const defaultContext: OnboardingContextType = {
  isOnboarding: false,
  userRole: null,
  startOnboarding: () => {},
  completeOnboarding: () => {},
  skipOnboarding: () => {},
  currentStep: 0,
  setCurrentStep: () => {},
  totalSteps: 5,
};

const OnboardingContext = createContext<OnboardingContextType>(defaultContext);

// Custom hook to use the onboarding context
export const useOnboarding = () => useContext(OnboardingContext);

interface OnboardingProviderProps {
  children: React.ReactNode;
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  const [isOnboarding, setIsOnboarding] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [totalSteps, setTotalSteps] = useState<number>(5);
  
  // Load onboarding state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedState) {
      try {
        const { isCompleted, role } = JSON.parse(savedState);
        if (!isCompleted) {
          setIsOnboarding(true);
          setUserRole(role);
        }
      } catch (error) {
        console.error('Error parsing onboarding state from localStorage', error);
      }
    }
  }, []);

  // Save onboarding state to localStorage whenever it changes
  useEffect(() => {
    if (isOnboarding && userRole) {
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({
          isCompleted: false,
          role: userRole,
          step: currentStep,
        })
      );
    }
  }, [isOnboarding, userRole, currentStep]);

  // Set the total number of steps based on the user role
  useEffect(() => {
    if (userRole === 'author') {
      setTotalSteps(5); // Authors need to see upload, dashboard, analytics, etc.
    } else if (userRole === 'reader') {
      setTotalSteps(3); // Readers just need to see discover, read, etc.
    }
  }, [userRole]);

  const startOnboarding = (role: UserRole) => {
    setIsOnboarding(true);
    setUserRole(role);
    setCurrentStep(0);
  };

  const completeOnboarding = () => {
    setIsOnboarding(false);
    localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify({
        isCompleted: true,
        role: userRole,
      })
    );
  };

  const skipOnboarding = () => {
    setIsOnboarding(false);
    localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify({
        isCompleted: true,
        role: null,
      })
    );
  };

  return (
    <OnboardingContext.Provider
      value={{
        isOnboarding,
        userRole,
        startOnboarding,
        completeOnboarding,
        skipOnboarding,
        currentStep,
        setCurrentStep,
        totalSteps,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};