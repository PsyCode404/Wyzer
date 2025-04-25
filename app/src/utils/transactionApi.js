// Wyzer API utility for transaction management
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

// Get all transactions with optional filtering
export async function getTransactions(filters = {}) {
  let queryParams = new URLSearchParams();
  
  // Add filters to query params
  if (filters.startDate) queryParams.append('startDate', filters.startDate);
  if (filters.endDate) queryParams.append('endDate', filters.endDate);
  if (filters.type) queryParams.append('type', filters.type);
  if (filters.category_id) queryParams.append('category_id', filters.category_id);
  if (filters.minAmount) queryParams.append('minAmount', filters.minAmount);
  if (filters.maxAmount) queryParams.append('maxAmount', filters.maxAmount);
  if (filters.search) queryParams.append('search', filters.search);
  if (filters.limit) queryParams.append('limit', filters.limit);
  if (filters.offset) queryParams.append('offset', filters.offset);
  
  const queryString = queryParams.toString();
  const endpoint = `/transactions${queryString ? `?${queryString}` : ''}`;
  
  return apiRequest(endpoint);
}

// Get a single transaction by ID
export async function getTransactionById(id) {
  return apiRequest(`/transactions/${id}`);
}

// Create a new transaction
export async function createTransaction(transactionData) {
  return apiRequest('/transactions', 'POST', transactionData);
}

// Update an existing transaction
export async function updateTransaction(id, transactionData) {
  return apiRequest(`/transactions/${id}`, 'PUT', transactionData);
}

// Delete a transaction
export async function deleteTransaction(id) {
  return apiRequest(`/transactions/${id}`, 'DELETE');
}

// Get transaction statistics
export async function getTransactionStats(startDate, endDate) {
  let queryParams = new URLSearchParams();
  queryParams.append('startDate', startDate);
  queryParams.append('endDate', endDate);
  
  return apiRequest(`/transactions/stats?${queryParams.toString()}`);
}

// Bulk import transactions
export async function bulkImportTransactions(transactions) {
  return apiRequest('/transactions/bulk', 'POST', { transactions });
}
