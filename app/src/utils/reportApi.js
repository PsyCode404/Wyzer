// Wyzer API utility for reports data
// Hardcode the API base URL to ensure it's connecting to the correct backend server
const API_BASE = 'http://localhost:5000/api';
console.log('Reports API using hardcoded base URL:', API_BASE);

// Helper function to handle API requests
async function apiRequest(endpoint, method = 'GET', data = null) {
  try {
    const url = `${API_BASE}${endpoint}`;
    console.log(`Making ${method} request to ${url}`);
    
    // Add token if available (but not required for development)
    const token = localStorage.getItem('token');
    
    // Simplified headers for development - no authentication required
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
      // Add credentials to ensure cookies are sent with the request
      credentials: 'include',
      // Ensure CORS is properly handled
      mode: 'cors'
    };
    
    // Add request body if data is provided
    if (data) {
      options.body = JSON.stringify(data);
      console.log('Request payload:', data);
    }
    
    console.log('Full request options:', {
      url,
      method,
      headers: { ...headers },
      credentials: options.credentials,
      mode: options.mode,
      ...(data ? { body: JSON.stringify(data) } : {})
    });
    
    // Make the actual request
    console.log('Making request with options:', { ...options, headers: { ...options.headers } });
    
    const response = await fetch(url, options);
    console.log(`Response status: ${response.status}, statusText: ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API request failed: ${response.status} ${response.statusText}`, errorText);
      
      // Return an error object
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);

    }
    
    // For non-JSON responses (like CSV downloads)
    const contentType = response.headers.get('Content-Type');
    console.log('Response content type:', contentType);
    
    if (contentType?.includes('text/csv')) {
      const csvText = await response.text();
      console.log('Received CSV response');
      return csvText;
    }
    
    // Handle empty responses
    if (contentType === null || contentType === '') {
      console.log('Empty response received');
      return { success: true };
    }
    
    // Handle non-JSON content types
    if (!contentType?.includes('application/json')) {
      const text = await response.text();
      console.warn('Non-JSON response received:', text.substring(0, 100));
      return { success: true, message: 'Non-JSON response received' };
    }
    
    try {
      const responseData = await response.json();
      console.log(`Successful response from ${endpoint}:`, responseData);
      
      // Check if the response is empty or doesn't have the expected structure
      if (!responseData || (Object.keys(responseData).length === 0)) {
        console.warn(`Empty or invalid response data from ${endpoint}`);
        throw new Error(`Empty or invalid response data from ${endpoint}`);
      }
      
      return responseData;
    } catch (jsonError) {
      console.error(`Error parsing JSON response from ${endpoint}:`, jsonError);
      throw new Error(`Error parsing JSON response: ${jsonError.message}`);
    }
  } catch (error) {
    console.error(`API request error for ${endpoint}:`, error);
    // Re-throw the error to be handled by the caller
    throw error;
  }
}

// No default data - we'll only use real data from the database

/**
 * Get report data based on date range and filters
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @param {string[]} categories - Array of category names to filter by (optional)
 * @returns {Promise<Object>} Report data
 */
export async function getReportData(startDate, endDate, categories = []) {
  try {
    // Build the query parameters
    const params = new URLSearchParams();
    params.append('startDate', startDate);
    params.append('endDate', endDate);
    
    if (categories.length > 0) {
      params.append('categories', categories.join(','));
    }
    
    console.log('Report API params:', { startDate, endDate, categories });
    
    // Make the API request
    try {
      const data = await apiRequest(`/reports?${params.toString()}`);
      console.log('Report data received:', data);
      
      // Ensure all required properties exist in the response
      const safeData = {
        transactions: Array.isArray(data.transactions) ? data.transactions : [],
        categorySpending: Array.isArray(data.categorySpending) ? data.categorySpending : [],
        monthlyComparison: Array.isArray(data.monthlyComparison) ? data.monthlyComparison : [],
        dailyTrends: Array.isArray(data.dailyTrends) ? data.dailyTrends : [],
        summary: data.summary || { total_income: 0, total_expenses: 0 },
        availableCategories: Array.isArray(data.availableCategories) ? data.availableCategories : []
      };
      
      console.log('Safe report data:', safeData);
      return safeData;
    } catch (error) {
      console.error('API request failed:', error.message);
      
      // Return empty data structure if the API fails
      return {
        transactions: [],
        categorySpending: [],
        monthlyComparison: [],
        dailyTrends: [],
        summary: { total_income: 0, total_expenses: 0 },
        availableCategories: []
      };
    }
  } catch (error) {
    console.error('Error in getReportData:', error);
    throw error;
  }
}

/**
 * Get comprehensive report summary including most expensive categories, monthly comparisons, and trends
 * @param {string} period - Time period to analyze ('month', 'quarter', 'year', or undefined for 6 months)
 * @returns {Promise<Object>} Report summary data
 */
export async function getReportSummary(period) {
  console.log(`Getting report summary for period: ${period || 'default (6 months)'}`);
  
  try {
    // Build the query parameters
    const params = new URLSearchParams();
    if (period) {
      params.append('period', period);
    }
    
    const queryString = params.toString();
    const endpoint = `/reports/summary${queryString ? `?${queryString}` : ''}`;
    console.log(`Report summary endpoint: ${endpoint}`);
    
    // Make the API request
    const response = await apiRequest(endpoint);
    console.log('Report summary response received:', response);
    
    // Check if the response contains an error or missing key properties
    if (response.error || (!response.expensive_categories && !response.monthly_spending)) {
      console.warn('Error or missing data in report summary response');
      throw new Error('API returned invalid data for report summary');
    }
    // Handle missing properties with empty arrays or objects instead of default data
    if (!response.expensive_categories) {
      console.warn('Response missing expensive_categories, using empty array');
      response.expensive_categories = [];
    }
    
    if (!response.monthly_spending) {
      console.warn('Response missing monthly_spending, using empty array');
      response.monthly_spending = [];
    }
    
    if (!response.category_trends) {
      console.warn('Response missing category_trends, using empty array');
      response.category_trends = [];
    }
    
    if (!response.summary) {
      console.warn('Response missing summary, using empty object');
      response.summary = {
        total_income: 0,
        total_expenses: 0,
        net_savings: 0,
        avg_monthly_expense: 0,
        avg_monthly_income: 0
      };
    }
    
    // Ensure all data is properly formatted
    const formattedResponse = {
      ...response,
      // Ensure expensive_categories has required properties
      expensive_categories: (response.expensive_categories || []).map(cat => ({
        name: cat.name || 'Unknown',
        color: cat.color || getRandomColor(),
        total: parseFloat(cat.total) || 0,
        percentage: cat.percentage || 0,
        icon: cat.icon || 'default'
      })),
      // Ensure monthly_spending has required properties
      monthly_spending: (response.monthly_spending || []).map(item => ({
        month: item.month || '',
        month_name: item.month_name || '',
        income: parseFloat(item.income) || 0,
        expenses: parseFloat(item.expenses) || 0,
        net: parseFloat(item.net) || 0
      })),
      // Ensure category_trends has required structure
      category_trends: (response.category_trends || []).map(trend => ({
        month: trend.month || '',
        month_name: trend.month_name || '',
        categories: (trend.categories || []).map(cat => ({
          category: cat.category || 'Unknown',
          color: cat.color || getRandomColor(),
          amount: parseFloat(cat.amount) || 0
        }))
      })),
      // Ensure summary has required properties
      summary: {
        total_income: parseFloat(response.summary?.total_income) || 0,
        total_expenses: parseFloat(response.summary?.total_expenses) || 0,
        net_savings: parseFloat(response.summary?.net_savings) || 0,
        avg_monthly_expense: parseFloat(response.summary?.avg_monthly_expense) || 0,
        avg_monthly_income: parseFloat(response.summary?.avg_monthly_income) || 0
      }
    };
    
    console.log('Formatted report summary data:', formattedResponse);
    return formattedResponse;
  } catch (error) {
    console.error('Error in getReportSummary:', error);
    // Re-throw the error to be handled by the caller
    throw error;
  }
}

// Helper function to generate a random color
function getRandomColor() {
  const colors = ['#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#EF4444', '#6366F1'];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Get most expensive categories for a given period
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @param {number} limit - Maximum number of categories to return (default: 5)
 * @returns {Promise<Object>} Expensive categories data
 */
export async function getExpensiveCategories(startDate, endDate, limit = 5) {
  console.log(`Getting expensive categories from ${startDate} to ${endDate}, limit: ${limit}`);
  
  try {
    // Build the query parameters
    const params = new URLSearchParams();
    params.append('startDate', startDate);
    params.append('endDate', endDate);
    params.append('limit', limit.toString());
    
    const queryString = params.toString();
    const endpoint = `/reports/expensive-categories?${queryString}`;
    console.log(`Expensive categories endpoint: ${endpoint}`);
    
    // Make the API request
    const response = await apiRequest(endpoint);
    console.log('Expensive categories response received:', response);
    
    // Check if the response contains an error or missing data
    if (response.error || !response.categories) {
      console.warn('Error or missing data in expensive categories response');
      throw new Error('API returned invalid data for expensive categories');
    }
    
    // If the categories array is empty, log a warning but continue with empty array
    if (response.categories.length === 0) {
      console.warn('Categories array is empty - this may indicate no spending in the selected period');
    }
    
    // Ensure all data is properly formatted
    const formattedResponse = {
      ...response,
      // Ensure categories have required properties
      categories: (response.categories || []).map(cat => ({
        name: cat.name || 'Unknown',
        color: cat.color || getRandomColor(),
        total: parseFloat(cat.total) || 0,
        percentage: cat.percentage || 0,
        icon: cat.icon || 'default',
        transaction_count: cat.transaction_count || 0
      })),
      totalSpending: parseFloat(response.totalSpending) || 0,
      startDate: response.startDate || startDate,
      endDate: response.endDate || endDate
    };
    
    console.log('Formatted expensive categories data:', formattedResponse);
    return formattedResponse;
  } catch (error) {
    console.error('Error in getExpensiveCategories:', error);
    // Re-throw the error to be handled by the caller
    throw error;
  }
}

/**
 * Get monthly comparison data (income vs expenses)
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Promise<Object>} Monthly comparison data
 */
export async function getMonthlyComparison(startDate, endDate) {
  console.log(`Getting monthly comparison from ${startDate} to ${endDate}`);
  
  try {
    // Build the query parameters
    const params = new URLSearchParams();
    params.append('startDate', startDate);
    params.append('endDate', endDate);
    
    const queryString = params.toString();
    const endpoint = `/reports/monthly-comparison?${queryString}`;
    console.log(`Monthly comparison endpoint: ${endpoint}`);
    
    // Make the API request
    const response = await apiRequest(endpoint);
    console.log('Monthly comparison response received:', response);
    
    // Check if the response contains an error or missing data
    if (response.error || !response.monthlyData) {
      console.warn('Error or missing data in monthly comparison response');
      throw new Error('API returned invalid data for monthly comparison');
    }
    
    // If the monthlyData array is empty, log a warning but continue with empty array
    if (response.monthlyData.length === 0) {
      console.warn('MonthlyData array is empty - this may indicate no transactions in the selected period');
    }
    
    // Ensure all data is properly formatted
    const formattedResponse = {
      ...response,
      // Ensure monthlyData has required properties
      monthlyData: (response.monthlyData || []).map(item => ({
        month: item.month || '',
        month_name: item.month_name || '',
        income: parseFloat(item.income) || 0,
        expenses: parseFloat(item.expenses) || 0,
        net: parseFloat(item.net) || 0
      })),
      startDate: response.startDate || startDate,
      endDate: response.endDate || endDate
    };
    
    console.log('Formatted monthly comparison data:', formattedResponse);
    return formattedResponse;
  } catch (error) {
    console.error('Error in getMonthlyComparison:', error);
    // Re-throw the error to be handled by the caller
    throw error;
  }
}

/**
 * Get category-based spending trends over time
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @param {string[]} categories - Array of category IDs to filter by (optional)
 * @returns {Promise<Object>} Category trends data
 */
export async function getCategoryTrends(startDate, endDate, categories = []) {
  console.log(`Getting category trends from ${startDate} to ${endDate}, categories: ${categories.join(', ') || 'all'}`);
  
  try {
    // Build the query parameters
    const params = new URLSearchParams();
    params.append('startDate', startDate);
    params.append('endDate', endDate);
    
    if (categories.length > 0) {
      params.append('categories', categories.join(','));
    }
    
    const queryString = params.toString();
    const endpoint = `/reports/category-trends?${queryString}`;
    console.log(`Category trends endpoint: ${endpoint}`);
    
    // Make the API request
    const response = await apiRequest(endpoint);
    console.log('Category trends response received:', response);
    
    // If API returns valid data, use it
    if (response && response.trends) {
      // Ensure all data is properly formatted
      const formattedResponse = {
        ...response,
        // Ensure trends have required properties
        trends: (response.trends || []).map(trend => ({
          month: trend.month || '',
          month_name: trend.month_name || '',
          categories: (trend.categories || []).map(cat => ({
            category: cat.category || 'Unknown',
            category_id: cat.category_id || 0,
            color: cat.color || getRandomColor(),
            amount: parseFloat(cat.amount) || 0
          }))
        })),
        startDate: response.startDate || startDate,
        endDate: response.endDate || endDate
      };
      
      console.log('Formatted category trends data:', formattedResponse);
      return formattedResponse;
    }
    
      // If API fails or returns invalid data, throw an error
    throw new Error('API returned invalid data for category trends');
  } catch (error) {
    console.error('Error in getCategoryTrends:', error);
    // Re-throw the error to be handled by the caller
    throw error;
  }
}

/**
 * Export report data as CSV
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @param {string[]} categories - Array of category names to filter by (optional)
 * @param {string} reportType - Type of report to export (category, comparison, trends)
 */
export async function exportReportData(startDate, endDate, reportType, categories = []) {
  try {
    // Build the query parameters
    const params = new URLSearchParams();
    params.append('startDate', startDate);
    params.append('endDate', endDate);
    params.append('reportType', reportType);
    
    if (categories.length > 0) {
      params.append('categories', categories.join(','));
    }
    
    // Create a URL for the export endpoint
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    const exportUrl = `${baseUrl}/reports/export?${params.toString()}`;
    
    // Open the URL in a new tab to trigger the download
    window.open(exportUrl, '_blank');
  } catch (error) {
    console.error('Error exporting report data:', error);
    throw error;
  }
}
