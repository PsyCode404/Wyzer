// Wyzer API utility for recurring transaction management
const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

// Helper function to handle API requests
async function apiRequest(endpoint, method = 'GET', data = null) {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('Authentication required');
  }
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
  
  const config = {
    method,
    headers
  };
  
  if (data) {
    config.body = JSON.stringify(data);
  }
  
  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.message || 'API request failed');
  }
  
  return result;
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
