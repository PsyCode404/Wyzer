// Wyzer API utility for recurring transaction management
const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

// Helper function to handle API requests
async function apiRequest(endpoint, method = 'GET', data = null) {
  const token = localStorage.getItem('token');
  
  // For development, make authentication optional
  // if (!token) {
  //   throw new Error('Authentication required');
  // }
  
  const headers = {
    'Content-Type': 'application/json'
  };
  
  // Only add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  console.log(`Making ${method} request to ${API_BASE}${endpoint}`);
  
  const config = {
    method,
    headers
  };
  
  if (data) {
    config.body = JSON.stringify(data);
  }
  
  try {
    console.log('Request config:', { endpoint, method, headers: config.headers });
    
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    console.log(`Response status: ${response.status}`);
    
    // Try to parse JSON response
    let result;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      result = await response.json();
      console.log('Response data:', result);
    } else {
      const text = await response.text();
      console.log('Response text:', text);
      result = { message: text };
    }
    
    if (!response.ok) {
      console.error(`API error (${response.status}):`, result);
      throw new Error(result.message || `API request failed with status ${response.status}`);
    }
    
    return result;
  } catch (error) {
    console.error(`Error in API request to ${endpoint}:`, error);
    throw error;
  }
}

// Get all recurring transactions
export async function getRecurringTransactions() {
  return apiRequest('/recurring');
}

// Get a single recurring transaction by ID
export async function getRecurringTransactionById(id) {
  return apiRequest(`/recurring/${id}`);
}

// Create a new recurring transaction
export async function createRecurringTransaction(transactionData) {
  return apiRequest('/recurring', 'POST', transactionData);
}

// Update an existing recurring transaction
export async function updateRecurringTransaction(id, transactionData) {
  return apiRequest(`/recurring/${id}`, 'PUT', transactionData);
}

// Toggle the active status of a recurring transaction
export async function toggleRecurringTransactionStatus(id, isActive) {
  return apiRequest(`/recurring/${id}/toggle`, 'PATCH', { isActive });
}

// Delete a recurring transaction
export async function deleteRecurringTransaction(id) {
  return apiRequest(`/recurring/${id}`, 'DELETE');
}
