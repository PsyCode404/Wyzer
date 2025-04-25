import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  TagIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

const currencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'TND', symbol: 'د.ت', name: 'Tunisian Dinar', flag: '🇹🇳' },
];

const categories = [
  { id: 'food', name: 'Food & Dining', icon: '🍽️', description: 'Restaurants, groceries, and snacks' },
  { id: 'rent', name: 'Rent & Housing', icon: '🏠', description: 'Rent, utilities, and maintenance' },
  { id: 'transport', name: 'Transport', icon: '🚗', description: 'Car expenses, public transport, and fuel' },
  { id: 'house', name: 'House Chores', icon: '🧹', description: 'Cleaning, repairs, and supplies' },
  { id: 'subscriptions', name: 'Subscriptions', icon: '📱', description: 'Streaming services, memberships' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬', description: 'Movies, events, and hobbies' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️', description: 'Clothing, electronics, and personal items' },
  { id: 'health', name: 'Health', icon: '⚕️', description: 'Medical expenses and fitness' },
];

const OnboardingPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const totalSteps = 3;
  const { savePreferences } = useAuth();

  const formik = useFormik({
    initialValues: {
      name: '',
      currency: '',
      categories: [],
    },
    validationSchema: Yup.object({
      name: Yup.string()
        .required('Please enter your name'),
      currency: Yup.string()
        .required('Please select a currency'),
      categories: Yup.array()
        .min(1, 'Please select at least one category'),
    }),
    onSubmit: async (values) => {
      try {
        console.log('Saving onboarding preferences...');
        // Save user preferences
        const result = await savePreferences({
          name: values.name,
          currency: currencies.find(c => c.code === values.currency),
          categories: values.categories.map(id => categories.find(c => c.id === id)),
        });

        console.log('Onboarding complete, result:', result);
        
        // Use direct navigation to dashboard for consistency with our auth flow
        setTimeout(() => {
          window.location.replace('/dashboard');
        }, 100);
      } catch (error) {
        console.error('Error saving preferences:', error);
        alert('There was an error saving your preferences. Please try again.');
      }
    },
  });

  const getStepIcon = (stepNumber) => {
    switch (stepNumber) {
      case 1:
        return <UserIcon className="h-6 w-6" />;
      case 2:
        return <CurrencyDollarIcon className="h-6 w-6" />;
      case 3:
        return <TagIcon className="h-6 w-6" />;
      default:
        return null;
    }
  };

  const getStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Welcome to Wyzer!</h2>
              <p className="text-gray-600">
                Let's start by getting to know you better. What should we call you?
              </p>
            </div>

            <div className="space-y-1">
              <label htmlFor="name" className="auth-label">
                Your Name
              </label>
              <input
                id="name"
                type="text"
                className={`auth-input ${formik.touched.name && formik.errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                placeholder="John Doe"
                {...formik.getFieldProps('name')}
              />
              {formik.touched.name && formik.errors.name && (
                <p className="text-red-500 text-sm">{formik.errors.name}</p>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Select Your Currency</h2>
              <p className="text-gray-600">
                Choose your preferred currency for tracking expenses.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {currencies.map((currency) => (
                <label
                  key={currency.code}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${formik.values.currency === currency.code ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50'}`}
                >
                  <input
                    type="radio"
                    name="currency"
                    value={currency.code}
                    checked={formik.values.currency === currency.code}
                    onChange={formik.handleChange}
                    className="sr-only"
                  />
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{currency.flag}</span>
                    <div>
                      <p className="font-medium text-gray-900">{currency.name}</p>
                      <p className="text-sm text-gray-500">
                        {currency.symbol} - {currency.code}
                      </p>
                    </div>
                  </div>
                  <CheckCircleIcon
                    className={`ml-auto h-5 w-5 transition-opacity ${formik.values.currency === currency.code ? 'text-primary opacity-100' : 'opacity-0'}`}
                  />
                </label>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Choose Your Categories</h2>
              <p className="text-gray-600">
                Select the expense categories you'd like to track. You can always customize these later.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categories.map((category) => (
                <label
                  key={category.id}
                  className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${formik.values.categories.includes(category.id) ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50'}`}
                >
                  <input
                    type="checkbox"
                    name="categories"
                    value={category.id}
                    checked={formik.values.categories.includes(category.id)}
                    onChange={formik.handleChange}
                    className="auth-checkbox mt-1"
                  />
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">
                      <span className="mr-2">{category.icon}</span>
                      {category.name}
                    </p>
                    <p className="text-sm text-gray-500">{category.description}</p>
                  </div>
                </label>
              ))}
            </div>
            {formik.touched.categories && formik.errors.categories && (
              <p className="text-red-500 text-sm">{formik.errors.categories}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="auth-page">
      <div className="w-full max-w-2xl mx-auto p-4">
        <div className="auth-card slide-up">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img
              src="/logo-placeholder.png"
              alt="Wyzer Logo"
              className="h-10"
            />
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {Array.from({ length: totalSteps }, (_, i) => i + 1).map((stepNumber) => (
                <div
                  key={stepNumber}
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors ${step >= stepNumber ? 'border-primary bg-primary text-white' : 'border-gray-200 text-gray-400'}`}
                >
                  {getStepIcon(stepNumber)}
                </div>
              ))}
            </div>
            <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
              />
            </div>
          </div>

          <form onSubmit={formik.handleSubmit} className="space-y-8">
            {getStepContent()}

            <div className="flex justify-between space-x-4">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="flex-1 py-3 px-4 border-2 border-gray-200 rounded-lg text-center font-medium hover:border-primary hover:text-primary transition-colors"
                >
                  <span className="flex items-center justify-center">
                    <ArrowLeftIcon className="h-5 w-5 mr-2" />
                    Back
                  </span>
                </button>
              )}

              {step < totalSteps ? (
                <button
                  type="button"
                  onClick={() => {
                    if (step === 1 && !formik.values.name) {
                      formik.setFieldTouched('name', true);
                      return;
                    }
                    if (step === 2 && !formik.values.currency) {
                      formik.setFieldTouched('currency', true);
                      return;
                    }
                    setStep(step + 1);
                  }}
                  className="flex-1 auth-button group"
                >
                  <span className="flex items-center justify-center">
                    Continue
                    <ArrowRightIcon className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              ) : (
                <button type="submit" className="flex-1 auth-button group">
                  <span className="flex items-center justify-center">
                    Get Started
                    <CheckCircleIcon className="h-5 w-5 ml-2" />
                  </span>
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
