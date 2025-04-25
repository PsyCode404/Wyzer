import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      // Get token from localStorage if it was set by the login page
      const token = localStorage.getItem('token');
      
      if (token) {
        // If we already have a token, use it to set the user
        console.log('Using existing token from localStorage');
        const userData = { email, token };
        setUser(userData);
        return true;
      } else if (email && password) {
        // If no token but we have credentials, attempt to login with the API
        console.log('No token found, attempting API login');
        try {
          const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
          
          console.log('Auth context login response status:', response.status);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Auth context login response error:', errorText);
            throw new Error(`Login failed with status ${response.status}: ${errorText}`);
          }
          
          const data = await response.json();
          console.log('Auth context login response data:', data);
          
          if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('email', email);
            setUser({ email, token: data.token });
            return true;
          } else {
            throw new Error(data.message || 'Login failed - no token received');
          }
        } catch (apiError) {
          console.error('Auth context API login error:', apiError);
          throw apiError; // Re-throw to be caught by the outer catch
        }
      } else {
        console.error('Login attempted without email or password');
        throw new Error('Email and password are required');
      }
    } catch (error) {
      console.error('Login error in AuthContext:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      // Implement your logout logic here
      setUser(null);
      setPreferences(null);
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = (prefs) => {
    setPreferences(prefs);
    // You might want to save this to local storage or your backend
    localStorage.setItem('userPreferences', JSON.stringify(prefs));
  };

  const value = {
    user,
    preferences,
    isLoading,
    login,
    logout,
    savePreferences,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
