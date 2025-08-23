import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Link } from 'react-router-dom';
import {
  EyeIcon,
  EyeSlashIcon,
  ArrowRightIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { login } from '../utils/api';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
      password: Yup.string()
        .required('Password is required'),
    }),
    onSubmit: async (values, { setSubmitting, setStatus }) => {
      setStatus(undefined);
      try {
        console.log('Attempting login with:', { email: values.email });
        
        // Step 1: Make the API call using the imported utility
        const data = await login({
          email: values.email,
          password: values.password
        });
        
        console.log('Login response data:', data);
        
        // Step 2: Handle success or failure
        if (data.token) {
          // Update auth context
          await authLogin(data.token, values.email);
          
          // Log success and redirect
          console.log('Login successful! Redirecting...');
          navigate('/dashboard');
        } else {
          // Handle error from server
          setStatus(data.message || 'Login failed. Please try again.');
        }
      } catch (err) {
        console.error('Login error details:', err);
        setStatus('Connection error. Please try again later. ' + (err.message || ''));
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="auth-page">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center p-4">
        {/* Left Side - Illustration */}
        <div className="hidden md:block">
          <div className="max-w-lg mx-auto space-y-6">
            <img
              src="/logo-placeholder.png"
              alt="Wyzer Logo"
              className="h-12 mb-8"
            />
            <h1 className="text-4xl font-bold text-gray-900">
              Welcome back to Wyzer
            </h1>
            <p className="text-lg text-gray-600">
              Your personal finance companion. Track expenses, set budgets, and achieve
              your financial goals with ease.
            </p>

          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full max-w-md mx-auto">
          <div className="auth-card slide-up">
            <div className="md:hidden flex justify-center mb-8">
              <img
                src="/logo-placeholder.png"
                alt="Wyzer Logo"
                className="h-10"
              />
            </div>
            <h2 className="text-2xl font-bold text-center mb-2">Welcome Back</h2>
            <p className="text-gray-500 text-center mb-8">
              Sign in to continue to your dashboard
            </p>
            <form onSubmit={formik.handleSubmit} className="space-y-6">
              <div className="space-y-1">
                <label htmlFor="email" className="auth-label">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  className={`auth-input ${formik.touched.email && formik.errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                  placeholder="name@example.com"
                  {...formik.getFieldProps('email')}
                />
                {formik.touched.email && formik.errors.email && (
                  <p className="text-red-500 text-sm">{formik.errors.email}</p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="password" className="auth-label">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className={`auth-input pr-10 ${formik.touched.password && formik.errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                    placeholder="••••••••"
                    {...formik.getFieldProps('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {formik.touched.password && formik.errors.password && (
                  <p className="text-red-500 text-sm">{formik.errors.password}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="auth-checkbox"
                  />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
                <Link to="/forgot-password" className="auth-link text-sm">
                  Forgot password?
                </Link>
              </div>

              <button type="submit" className="auth-button group">
                <span className="flex items-center justify-center">
                  Sign In
                  <ArrowRightIcon className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    Don't have an account?
                  </span>
                </div>
              </div>

              <Link
                to="/register"
                className="block w-full py-3 px-4 border-2 border-gray-200 rounded-lg text-center font-medium hover:border-primary hover:text-primary transition-colors"
              >
                Create an Account
              </Link>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
