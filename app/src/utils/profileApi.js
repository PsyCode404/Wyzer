// Wyzer API utility for user profile data
const API_BASE = 'http://localhost:5000/api';

// Helper function to handle API requests
async function apiRequest(endpoint, method = 'GET', data = null) {
  try {
    const url = `${API_BASE}${endpoint}`;
    console.log(`Making ${method} request to ${url}`);
    
    // Add token if available
    const token = localStorage.getItem('token');
    
    // Headers with authentication if token exists
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('Including authorization token in request');
    }
    
    const options = {
      method,
      headers,
      credentials: 'include',
      mode: 'cors'
    };
    
    // Add request body if data is provided
    if (data) {
      options.body = JSON.stringify(data);
      console.log('Request payload:', data);
    }
    
    // Make the actual request
    const response = await fetch(url, options);
    console.log(`Response status: ${response.status}, statusText: ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API request failed: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    // For non-JSON responses (like image uploads)
    const contentType = response.headers.get('Content-Type');
    
    if (contentType?.includes('application/json')) {
      const responseData = await response.json();
      console.log(`Successful response from ${endpoint}:`, responseData);
      return responseData;
    } else {
      const text = await response.text();
      return { success: true, message: text };
    }
  } catch (error) {
    console.error(`API request error for ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Get the current user's profile data
 * @returns {Promise<Object>} User profile data
 */
export async function getUserProfile() {
  try {
    return await apiRequest('/profile');
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}

/**
 * Update the user's profile information
 * @param {Object} profileData - The profile data to update
 * @returns {Promise<Object>} Updated user profile data
 */
export async function updateUserProfile(profileData) {
  try {
    return await apiRequest('/profile', 'PUT', profileData);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

/**
 * Upload a profile picture
 * @param {File|string} imageData - The image file or base64 data
 * @returns {Promise<Object>} Response with the profile picture URL
 */
export async function uploadProfilePicture(imageData) {
  try {
    // If imageData is a base64 string, send it directly
    if (typeof imageData === 'string') {
      return await apiRequest('/profile/picture', 'POST', { image: imageData });
    }
    
    // If imageData is a File, create FormData
    const formData = new FormData();
    formData.append('profilePicture', imageData);
    
    // Custom fetch for FormData
    const url = `${API_BASE}/profile/picture`;
    const token = localStorage.getItem('token');
    
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include',
      mode: 'cors'
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    throw error;
  }
}

/**
 * Update user currency preference
 * @param {string} currencyCode - The currency code (e.g., 'USD', 'EUR')
 * @returns {Promise<Object>} Response with updated currency preference
 */
export async function updateCurrencyPreference(currencyCode) {
  try {
    return await apiRequest('/profile/currency', 'PUT', { currency: currencyCode });
  } catch (error) {
    console.error('Error updating currency preference:', error);
    throw error;
  }
}
