import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Link } from 'react-router-dom';
import {
  EyeIcon,
  EyeSlashIcon,
  ArrowRightIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [useCommonCategories, setUseCommonCategories] = useState(true);

  const formik = useFormik({
    initialValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    validationSchema: Yup.object({
      fullName: Yup.string()
        .required('Full name is required'),
      email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
      password: Yup.string()
        .min(6, 'Password must be at least 6 characters')
        .required('Password is required'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password'), null], 'Passwords must match')
        .required('Please confirm your password'),
    }),
    onSubmit: async (values, { setSubmitting, setStatus }) => {
      setStatus(undefined);
      try {
        // Step 1: Make the API call directly without dynamic imports
        const response = await fetch('http://localhost:5000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: values.fullName,
            email: values.email,
            password: values.password
          })
        });
        
        // Step 2: Parse the response
        const data = await response.json();
        console.log('Registration response:', data);
        
        // Step 3: Handle success or failure
        if (data.token) {
          // Step 4: Set the token in localStorage directly
          localStorage.setItem('token', data.token);
          localStorage.setItem('email', values.email);
          
          // Step 5: Log success and redirect
          console.log('Registration successful! Redirecting...');
          
          // Use the most direct form of navigation
          setTimeout(() => {
            window.location.replace('/onboarding');
          }, 100);
          
          return; // Stop execution here
        } else {
          // Handle error from server
          setStatus(data.message || 'Registration failed. Please try again.');
        }
      } catch (err) {
        console.error('Registration error:', err);
        setStatus('Connection error. Please try again later.');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const getPasswordStrength = (password) => {
    if (!password) return '';
    const hasLength = password.length >= 8;
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*]/.test(password);
    const strength = [hasLength, hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
    return strength < 2 ? 'weak' : strength < 4 ? 'medium' : 'strong';
  };

  const passwordStrength = getPasswordStrength(formik.values.password);

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
              Join Wyzer Today
            </h1>
            <p className="text-lg text-gray-600">
              Start your journey to financial freedom. Track expenses, set budgets,
              and make smarter financial decisions.
            </p>

          </div>
        </div>

        {/* Right Side - Registration Form */}
        <div className="w-full max-w-md mx-auto">
          <div className="auth-card slide-up">
            <div className="md:hidden flex justify-center mb-8">
              <img
                src="/logo-placeholder.png"
                alt="Wyzer Logo"
                className="h-10"
              />
            </div>

            {/* Progress Dots */}
            <div className="flex justify-center space-x-2 mb-8">
              {[1, 2].map((dot) => (
                <div
                  key={dot}
                  className={`progress-dot ${step >= dot ? 'progress-dot-active' : ''}`}
                />
              ))}
            </div>

            <h2 className="text-2xl font-bold text-center mb-2">
              {step === 1 ? 'Create Your Account' : 'Almost Done'}
            </h2>
            <p className="text-gray-500 text-center mb-8">
              {step === 1
                ? 'Fill in your details to get started'
                : 'Just a few more preferences to set up'}
            </p>

            <form onSubmit={formik.handleSubmit} className="space-y-6">
              {step === 1 ? (
                <>
                  <div className="space-y-1">
                    <label htmlFor="fullName" className="auth-label">
                      Full Name
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      className={`auth-input ${formik.touched.fullName && formik.errors.fullName ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                      placeholder="John Doe"
                      {...formik.getFieldProps('fullName')}
                    />
                    {formik.touched.fullName && formik.errors.fullName && (
                      <p className="text-red-500 text-sm">{formik.errors.fullName}</p>
                    )}
                  </div>

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
                    {formik.values.password && (
                      <div className="mt-2">
                        <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${passwordStrength === 'weak' ? 'w-1/3 bg-red-500' : passwordStrength === 'medium' ? 'w-2/3 bg-yellow-500' : 'w-full bg-green-500'}`}
                          />
                        </div>
                        <p className={`text-sm mt-1 ${passwordStrength === 'weak' ? 'text-red-500' : passwordStrength === 'medium' ? 'text-yellow-500' : 'text-green-500'}`}>
                          {passwordStrength === 'weak' ? 'Weak password' : passwordStrength === 'medium' ? 'Medium strength' : 'Strong password'}
                        </p>
                      </div>
                    )}
                    {formik.touched.password && formik.errors.password && (
                      <p className="text-red-500 text-sm">{formik.errors.password}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="confirmPassword" className="auth-label">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        className={`auth-input pr-10 ${formik.touched.confirmPassword && formik.errors.confirmPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                        placeholder="••••••••"
                        {...formik.getFieldProps('confirmPassword')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showConfirmPassword ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                      <p className="text-red-500 text-sm">{formik.errors.confirmPassword}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (formik.values.fullName && formik.values.email && formik.values.password && formik.values.confirmPassword && !formik.errors.fullName && !formik.errors.email && !formik.errors.password && !formik.errors.confirmPassword) {
                        setStep(2);
                      } else {
                        formik.validateForm();
                      }
                    }}
                    className="auth-button group"
                  >
                    <span className="flex items-center justify-center">
                      Continue
                      <ArrowRightIcon className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </button>
                </>
              ) : (
                <>
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Would you like to pre-select common expense categories?
                    </h3>
                    <p className="text-sm text-gray-500">
                      We'll set up your account with commonly used categories like Food,
                      Transport, and Housing. You can always customize these later.
                    </p>
                    <label className="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-colors hover:border-primary">
                      <input
                        type="checkbox"
                        checked={useCommonCategories}
                        onChange={(e) => setUseCommonCategories(e.target.checked)}
                        className="auth-checkbox"
                      />
                      <div>
                        <p className="font-medium text-gray-900">Use Common Categories</p>
                        <p className="text-sm text-gray-500">Start with pre-defined categories</p>
                      </div>
                    </label>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 py-3 px-4 border-2 border-gray-200 rounded-lg text-center font-medium hover:border-primary hover:text-primary transition-colors"
                    >
                      Back
                    </button>
                    <button type="submit" className="flex-1 auth-button group">
                      <span className="flex items-center justify-center">
                        Create Account
                        <CheckCircleIcon className="h-5 w-5 ml-2" />
                      </span>
                    </button>
                  </div>
                </>
              )}
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Already have an account?
                </span>
              </div>
            </div>

            <Link
              to="/login"
              className="block w-full py-3 px-4 border-2 border-gray-200 rounded-lg text-center font-medium hover:border-primary hover:text-primary transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
