import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import PageTransition from '../components/PageTransition';

export const handleLogout = async (navigate, setIsExiting) => {
  const { logout } = useAuth();
  
  try {
    const success = await logout();
    if (success) {
      // Start fade-out animation
      if (setIsExiting) {
        setIsExiting(true);
      }
      
      // Navigate after animation completes
      setTimeout(() => {
        navigate('/login');
      }, 300);
    }
  } catch (error) {
    console.error('Logout error:', error);
  }
};

export const withFadeTransition = (Component) => {
  return (props) => (
    <PageTransition type="fade">
      <Component {...props} />
    </PageTransition>
  );
};
