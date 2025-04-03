import React, { useEffect, useMemo } from 'react';
import Joyride, { CallBackProps, Step, STATUS } from 'react-joyride';
import { useLocation, useRoute } from 'wouter';
import { useOnboarding } from './onboarding-context';

export const OnboardingTour: React.FC = () => {
  const { isOnboarding, userRole, completeOnboarding, currentStep, setCurrentStep, totalSteps } = useOnboarding();
  const [location, navigate] = useLocation();
  const [isHomePage] = useRoute('/');
  const [isDiscoverPage] = useRoute('/discover');
  const [isDashboardPage] = useRoute('/dashboard');
  const [isUploadPage] = useRoute('/dashboard/upload');

  // Define steps based on user role
  const authorSteps: Step[] = useMemo(() => [
    {
      target: '.user-profile',
      content: 'Welcome to BookNest! This is your user profile where you can access your dashboard and settings.',
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '.upload-book',
      content: 'Click here to upload and publish your books.',
      placement: 'bottom',
    },
    {
      target: '.author-dashboard',
      content: 'Access your dashboard to track your books\' performance, manage your publications, and view analytics.',
      placement: 'bottom',
    },
    {
      target: '.books-discovery',
      content: 'Discover books from other authors to get inspiration for your own writing.',
      placement: 'bottom',
    },
    {
      target: 'body',
      content: 'Congratulations! You\'re all set to start your journey as an author on BookNest.',
      placement: 'center',
    },
  ], []);

  const readerSteps: Step[] = useMemo(() => [
    {
      target: '.user-profile',
      content: 'Welcome to BookNest! This is your user profile where you can manage your account.',
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '.books-discovery',
      content: 'Discover books from our collection and find your next favorite read.',
      placement: 'bottom',
    },
    {
      target: 'body',
      content: 'Congratulations! You\'re all set to start your reading journey on BookNest.',
      placement: 'center',
    },
  ], []);

  // Select steps based on user role
  const steps = useMemo(() => {
    return userRole === 'author' ? authorSteps : readerSteps;
  }, [userRole, authorSteps, readerSteps]);

  // Handle navigation between steps
  useEffect(() => {
    if (!isOnboarding || !userRole) return;

    // Navigate to appropriate page based on current step and role
    if (userRole === 'author') {
      if (currentStep === 0 && !isHomePage) {
        navigate('/');
      } else if (currentStep === 1 && !isUploadPage) {
        navigate('/dashboard/upload');
      } else if (currentStep === 2 && !isDashboardPage) {
        navigate('/dashboard');
      } else if (currentStep === 3 && !isDiscoverPage) {
        navigate('/discover');
      }
    } else if (userRole === 'reader') {
      if (currentStep === 0 && !isHomePage) {
        navigate('/');
      } else if (currentStep === 1 && !isDiscoverPage) {
        navigate('/discover');
      }
    }
  }, [isOnboarding, userRole, currentStep, navigate, isHomePage, isDiscoverPage, isDashboardPage, isUploadPage]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { action, index, status, type } = data;

    // Update step when user navigates
    if (type === 'step:after' && action === 'next') {
      setCurrentStep(index + 1);
    }

    // Handle tour completion
    if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
      completeOnboarding();
    }
  };

  if (!isOnboarding || !userRole) {
    return null;
  }

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      hideCloseButton
      scrollToFirstStep
      showProgress
      showSkipButton
      steps={steps}
      stepIndex={currentStep}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: '#4f46e5',
        },
        tooltip: {
          fontSize: '16px',
          padding: '15px',
        },
        buttonNext: {
          backgroundColor: '#4f46e5',
        },
        buttonBack: {
          color: '#4f46e5',
        },
      }}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        skip: 'Skip',
      }}
    />
  );
};