// Wyzer API utility for dashboard data
const API_BASE = process.env.REACT_APP_API_URL 
  ? `${process.env.REACT_APP_API_URL}/api`
  : 'http://localhost:5000/api';

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
      console.log('Including authorization token in request');
    }
    
    const config = {
      method,
      headers,
      // Add credentials to ensure cookies are sent with the request
      credentials: 'include',
      // Ensure CORS is properly handled
      mode: 'cors'
    };
    
    if (data) {
      config.body = JSON.stringify(data);
      console.log('Request payload:', data);
    }
    
    console.log(`Sending request to: ${API_BASE}${endpoint}`);
    
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, config);
      console.log(`Response status:`, response.status);
      
      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('Non-JSON response:', textResponse);
        return {
          error: true,
          message: `Server returned non-JSON response: ${textResponse.substring(0, 100)}...`,
          data: getDefaultDataForEndpoint(endpoint)
        };
      }
      
      if (!response.ok) {
        const result = await response.json();
        console.error(`API error (${response.status}):`, result);
        return {
          error: true,
          message: result.message || `API request failed with status ${response.status}`,
          data: getDefaultDataForEndpoint(endpoint)
        };
      }
      
      const result = await response.json();
      console.log('Response data:', result);
      return result;
    } catch (fetchError) {
      console.error('Fetch error:', fetchError);
      return {
        error: true,
        message: fetchError.message || 'Network error occurred',
        data: getDefaultDataForEndpoint(endpoint)
      };
    }
  } catch (error) {
    console.error('API request failed:', error);
    return {
      error: true,
      message: error.message || 'Unknown error occurred',
      data: getDefaultDataForEndpoint(endpoint)
    };
  }
}

// Helper function to provide empty data structures for different endpoints when API calls fail
function getDefaultDataForEndpoint(endpoint) {
  console.log(`API call failed for endpoint: ${endpoint} - returning empty data`);
  
  // Return appropriate empty data structure based on the endpoint
  if (endpoint.includes('/dashboard')) {
    return {
      spending_breakdown: {
        categories: []
      },
      monthly_trends: [],
      recent_transactions: [],
      summary: {
        totalIncome: 0,
        totalExpenses: 0,
        netSavings: 0
      },
      budgets: []
    };
  } else if (endpoint.includes('/budget')) {
    return {
      totalBudget: 0,
      budgets: [],
      currency: 'USD'
    };
  } else {
    return {
      data: [],
      total: 0
    };
  }
}

// Get dashboard data (spending breakdown, monthly trends, recent transactions)
export async function getDashboardData() {
  console.log('Getting dashboard data');
  
  // Get current date and last 6 months for better data visibility
  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth() - 5, 1).toISOString().split('T')[0];
  const endDate = today.toISOString().split('T')[0];
  
  try {
    console.log(`Fetching dashboard data for period: ${startDate} to ${endDate}`);
    
    // Make a single API request to get all dashboard data
    const dashboardData = await apiRequest(`/dashboard?startDate=${startDate}&endDate=${endDate}`);
    console.log('Dashboard data response:', dashboardData);
    
    // Check if the response contains an error
    if (dashboardData.error) {
      console.warn('Error in dashboard data response:', dashboardData.message);
      return dashboardData.data; // Return the default data from the apiRequest function
    }
    
    // If we have spending breakdown data
    if (dashboardData.spending_breakdown && dashboardData.spending_breakdown.categories) {
      console.log('Raw spending breakdown data:', dashboardData.spending_breakdown);
      
      // Format spending data for pie chart
      const spendingData = dashboardData.spending_breakdown.categories.map(category => {
        console.log('Processing category:', category);
        return {
          name: category.name,
          value: parseFloat(category.total) || 0, // Ensure total is a number
          color: category.color || '#6B7280', // Default gray if no color specified
          percentage: category.percentage || 0
        };
      });
      
      console.log('Formatted spending data for chart:', spendingData);
      
      // Format monthly trends data
      const monthlyData = Array.isArray(dashboardData.monthly_trends) ? 
        dashboardData.monthly_trends.map(month => ({
          name: month.month_name ? month.month_name.substring(0, 3) : 'Unknown',
          month: month.month,
          income: parseFloat(month.income) || 0,
          expenses: parseFloat(month.expenses) || 0,
          net: parseFloat(month.net) || 0
        })) : [];
      
      // Format recent transactions
      const recentTransactions = Array.isArray(dashboardData.recent_transactions) ? 
        dashboardData.recent_transactions.map(transaction => ({
          id: transaction.transaction_id,
          description: transaction.description,
          amount: parseFloat(transaction.amount) || 0,
          category: transaction.category_name || 'Uncategorized',
          category_color: transaction.category_color,
          type: transaction.type,
          date: transaction.date,
          payment_method: transaction.payment_method
        })) : [];
      
      // Return formatted dashboard data
      return {
        spendingData,
        monthlyData,
        recentTransactions,
        summary: dashboardData.summary,
        budgets: dashboardData.budgets || [],
        startDate: dashboardData.date_range?.start_date || startDate,
        endDate: dashboardData.date_range?.end_date || endDate
      };
    } else {
      // If the response doesn't have the expected structure, use default data
      console.warn('Dashboard data missing expected properties, using empty data');
      return {
        spendingData: [],
        monthlyData: [],
        recentTransactions: [],
        summary: {
          totalIncome: 0,
          totalExpenses: 0,
          netSavings: 0
        },
        budgets: [],
        startDate,
        endDate
      };
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    // Return empty data instead of throwing an error
    return {
      spendingData: [],
      monthlyData: [],
      recentTransactions: [],
      summary: {
        totalIncome: 0,
        totalExpenses: 0,
        netSavings: 0
      },
      budgets: [],
      startDate,
      endDate
    };
  }
}

// Get user's monthly budget
export async function getUserBudget() {
  try {
    const budgetData = await apiRequest('/dashboard/budget');
    
    if (budgetData.error) {
      console.warn('Error fetching budget data:', budgetData.message);
      return {
        totalBudget: 0,
        budgets: [],
        currency: '$'
      };
    }
    
    return budgetData;
  } catch (error) {
    console.error('Error fetching user budget:', error);
    return {
      totalBudget: 0,
      budgets: [],
      currency: '$'
    };
  }
}
