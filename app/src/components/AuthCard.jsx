import React from 'react';

const AuthCard = ({ children }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="auth-card">
        <img 
          src="/logo-placeholder.png" 
          alt="App Logo" 
          className="mx-auto mb-8 w-32 h-32"
        />
        {children}
      </div>
    </div>
  );
};

export default AuthCard;
