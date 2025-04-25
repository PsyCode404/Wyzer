import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const TestRedirectPage = () => {
  const { user, login } = useAuth();

  useEffect(() => {
    // This is a test function to simulate a successful login
    const testLogin = () => {
      const testToken = "test_token_" + Date.now();
      const testEmail = "test@example.com";
      
      console.log("Test login with:", { token: testToken, email: testEmail });
      login(testToken, testEmail);
      
      // Try different redirect methods
      console.log("Attempting redirect to /onboarding");
      
      // Method 1: Direct browser navigation
      window.location.href = '/onboarding';
    };

    // Run the test after a short delay
    const timer = setTimeout(testLogin, 1500);
    return () => clearTimeout(timer);
  }, [login]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Authentication Test Page</h1>
        <p className="mb-4">Current authentication state:</p>
        <pre className="bg-gray-100 p-4 rounded mb-4 overflow-auto">
          {JSON.stringify(user, null, 2)}
        </pre>
        <p>This page will automatically:</p>
        <ol className="list-decimal pl-5 mb-4">
          <li>Set a test token in the auth context</li>
          <li>Attempt to redirect to the onboarding page</li>
        </ol>
        <p className="text-sm text-gray-500">
          If you see this message for more than 2 seconds, the redirect is not working.
        </p>
      </div>
    </div>
  );
};

export default TestRedirectPage;
