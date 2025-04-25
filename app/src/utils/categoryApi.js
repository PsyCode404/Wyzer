// Wyzer API utility for category management
const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

// Helper function to handle API requests
async function apiRequest(endpoint, method = 'GET', data = null) {
  try {
    console.log(`Making ${method} request to ${endpoint}`);
    
    // Simplified headers for development - no authentication required
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Add token if available (but not required for development)
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    console.log('Request headers:', headers);
    
    const config = {
      method,
      headers
    };
    
    if (data) {
      config.body = JSON.stringify(data);
      console.log('Request payload:', data);
    }
    
    console.log(`Sending request to: ${API_BASE}${endpoint}`);
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    
    console.log(`Response status:`, response.status);
    
    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const textResponse = await response.text();
      console.error('Non-JSON response:', textResponse);
      throw new Error(`Server returned non-JSON response: ${textResponse.substring(0, 100)}...`);
    }
    
    const result = await response.json();
    console.log('Response data:', result);
    
    if (!response.ok) {
      console.error(`API error (${response.status}):`, result);
      throw new Error(result.message || `API request failed with status ${response.status}`);
    }
    
    return result;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

// Get all categories
export async function getCategories() {
  return apiRequest('/categories');
}

// Get a single category by ID
export async function getCategoryById(id) {
  return apiRequest(`/categories/${id}`);
}

// Create a new category
export async function createCategory(categoryData) {
  return apiRequest('/categories', 'POST', categoryData);
}

// Update an existing category
export async function updateCategory(id, categoryData) {
  return apiRequest(`/categories/${id}`, 'PUT', categoryData);
}

// Delete a category
export async function deleteCategory(id) {
  return apiRequest(`/categories/${id}`, 'DELETE');
}
