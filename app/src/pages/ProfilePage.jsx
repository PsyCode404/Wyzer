import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  UserCircleIcon,
  CameraIcon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import { getUserProfile, updateUserProfile, uploadProfilePicture, updateCurrencyPreference } from '../utils/profileApi';

const currencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'TND', symbol: 'د.ت', name: 'Tunisian Dinar' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
];

// Initial empty user data structure
const initialUserData = {
  name: '',
  email: '',
  currency: 'USD',
  profilePicture: null,
};

const ProfilePage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const formik = useFormik({
    initialValues: initialUserData,
    validationSchema: Yup.object({
      name: Yup.string().required('Name is required'),
      email: Yup.string().email('Invalid email address').required('Email is required'),
      currency: Yup.string().required('Currency is required'),
    }),
    onSubmit: async (values) => {
      try {
        setError(null);
        console.log('Updating profile with values:', values);
        
        // Call the API to update the user profile
        const updatedProfile = await updateUserProfile({
          name: values.name,
          email: values.email,
          currency: values.currency
        });
        
        console.log('Profile updated successfully:', updatedProfile);
        setSuccessMessage('Profile updated successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
        setIsEditing(false);
      } catch (err) {
        console.error('Error updating profile:', err);
        setError('Failed to update profile. Please try again.');
      }
    },
  });

  // Load user profile data when component mounts
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Call the API to get the user profile
        const profileData = await getUserProfile();
        console.log('Fetched user profile:', profileData);
        
        // Update formik values with the fetched profile data
        formik.setValues({
          name: profileData.name || '',
          email: profileData.email || '',
          currency: profileData.currency || 'USD',
          profilePicture: profileData.profilePicture || null
        });
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Failed to load profile data. Please refresh the page.');
        setIsLoading(false);
      }
    };
    
    fetchUserProfile();
  }, []);
  
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/png'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      alert('Please upload a JPEG or PNG image');
      return;
    }

    if (file.size > maxSize) {
      alert('File size must be less than 5MB');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Convert to base64 for preview and API upload
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result;
        
        // Update local state for immediate preview
        formik.setFieldValue('profilePicture', base64Image);
        
        try {
          // Upload the image to the backend
          const response = await uploadProfilePicture(base64Image);
          console.log('Profile picture uploaded:', response);
          
          // Update the profile picture URL from the server response
          if (response && response.profilePicture) {
            formik.setFieldValue('profilePicture', response.profilePicture);
          }
          
          setSuccessMessage('Profile picture updated successfully');
          setTimeout(() => setSuccessMessage(''), 3000);
        } catch (uploadErr) {
          console.error('Error uploading profile picture:', uploadErr);
          setError('Failed to upload profile picture. Please try again.');
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error processing profile picture:', err);
      setError('Failed to process profile picture. Please try again.');
      setIsLoading(false);
    }
  };
  
  // Handle currency change separately to update immediately
  const handleCurrencyChange = async (e) => {
    const currencyValue = e.target.value;
    formik.setFieldValue('currency', currencyValue);
    
    if (isEditing) {
      try {
        // Update currency preference immediately
        const response = await updateCurrencyPreference(currencyValue);
        console.log('Currency preference updated:', response);
      } catch (err) {
        console.error('Error updating currency preference:', err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        )}
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}
        
        {!isLoading && !error && (
        <>
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-text mb-2">Profile</h1>
            <p className="text-gray-500">View and update your personal information below</p>
          </div>

          <form onSubmit={formik.handleSubmit} className="space-y-8">
          {/* Profile Picture */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100">
                {formik.values.profilePicture ? (
                  <img
                    src={formik.values.profilePicture.startsWith('data:') || formik.values.profilePicture.startsWith('http') 
                      ? formik.values.profilePicture 
                      : `http://localhost:5000${formik.values.profilePicture}`}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Error loading profile image:', e);
                      e.target.onerror = null;
                      e.target.src = '';
                      // Fallback to icon if image fails to load
                      formik.setFieldValue('profilePicture', null);
                    }}
                  />
                ) : (
                  <UserCircleIcon className="w-full h-full text-gray-400" />
                )}
              </div>
              <label
                htmlFor="profile-picture"
                className="absolute bottom-0 right-0 p-2 bg-primary text-text rounded-full cursor-pointer hover:bg-opacity-90 transition-colors"
              >
                <CameraIcon className="h-5 w-5" />
              </label>
              <input
                type="file"
                id="profile-picture"
                accept="image/png, image/jpeg"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Click the camera icon to change your profile picture
            </p>
          </div>

          {/* User Information */}
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  name="name"
                  disabled={!isEditing}
                  className={`flex-1 border border-gray-200 rounded-lg p-2 ${
                    isEditing
                      ? 'focus:ring-2 focus:ring-primary focus:border-transparent'
                      : 'bg-gray-50'
                  }`}
                  {...formik.getFieldProps('name')}
                />
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {isEditing ? (
                    <XMarkIcon className="h-5 w-5" />
                  ) : (
                    <PencilSquareIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              {formik.touched.name && formik.errors.name && (
                <div className="text-red-500 text-sm mt-1">{formik.errors.name}</div>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                disabled={!isEditing}
                className={`w-full border border-gray-200 rounded-lg p-2 ${
                  isEditing
                    ? 'focus:ring-2 focus:ring-primary focus:border-transparent'
                    : 'bg-gray-50'
                }`}
                {...formik.getFieldProps('email')}
              />
              {formik.touched.email && formik.errors.email && (
                <div className="text-red-500 text-sm mt-1">{formik.errors.email}</div>
              )}
            </div>

            {/* Currency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency Preference
              </label>
              <select
                name="currency"
                disabled={!isEditing}
                className={`w-full border border-gray-200 rounded-lg p-2 ${
                  isEditing
                    ? 'focus:ring-2 focus:ring-primary focus:border-transparent'
                    : 'bg-gray-50'
                }`}
                value={formik.values.currency}
                onChange={handleCurrencyChange}
                onBlur={formik.handleBlur}
              >
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.name} ({currency.symbol})
                  </option>
                ))}
              </select>
              {formik.touched.currency && formik.errors.currency && (
                <div className="text-red-500 text-sm mt-1">
                  {formik.errors.currency}
                </div>
              )}
            </div>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-4 rounded-lg">
              <CheckIcon className="h-5 w-5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Save Button */}
          {isEditing && (
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 bg-primary text-text font-medium rounded-lg hover:bg-opacity-90 transition-colors"
              >
                Save Changes
              </button>
            </div>
          )}
          </form>
        </>)}
      </main>
    </div>
  );
};

export default ProfilePage;
