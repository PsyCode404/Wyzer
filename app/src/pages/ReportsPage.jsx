import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfYear } from 'date-fns';
import {
  ArrowDownTrayIcon,
  ChartPieIcon,
  ChartBarIcon,
  PresentationChartLineIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import { getReportData, exportReportData, getReportSummary, getExpensiveCategories, getMonthlyComparison, getCategoryTrends } from '../utils/reportApi';
import eventBus, { EVENTS } from '../utils/eventBus';

// Default empty data structures for initial render
const emptyTransactions = [];
const emptyCategoryColors = {};

const dateRanges = [
  { label: 'Last 7 Days', value: 'last7days' },
  { label: 'Last 30 Days', value: 'last30days' },
  { label: 'This Month', value: 'thisMonth' },
  { label: 'Last 3 Months', value: 'last3months' },
  { label: 'Last 6 Months', value: 'last6months' },
  { label: 'This Year', value: 'thisYear' },
];

const reportTypes = [
  {
    label: 'Spending by Category',
    value: 'category',
    icon: ChartPieIcon,
  },
  {
    label: 'Income vs. Expenses',
    value: 'comparison',
    icon: ChartBarIcon,
  },
  {
    label: 'Monthly Trends',
    value: 'trends',
    icon: PresentationChartLineIcon,
  },
];

const ReportsPage = () => {
  const [selectedReport, setSelectedReport] = useState('category');
  const [dateRange, setDateRange] = useState('thisMonth');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  // Initial empty data structure before API data is loaded

const [reportData, setReportData] = useState({
  transactions: emptyTransactions,
  categorySpending: [],
  monthlyComparison: [],
  dailyTrends: [],
  summary: { total_income: 0, total_expenses: 0 },
  availableCategories: []
});

// Add a state for all available categories (separate from report data)
const [allCategories, setAllCategories] = useState([]);

// Always use real data from the backend
const effectiveReportData = reportData;
  const [categoryColors, setCategoryColors] = useState(emptyCategoryColors);

  // Calculate date range based on selection
  const getDateRange = () => {
    const today = new Date();
    switch (dateRange) {
      case 'last7days':
        return { start: subDays(today, 7), end: today };
      case 'last30days':
        return { start: subDays(today, 30), end: today };
      case 'thisMonth':
        return { start: startOfMonth(today), end: endOfMonth(today) };
      case 'last3months':
        return { start: subMonths(today, 3), end: today };
      case 'last6months':
        return { start: subMonths(today, 6), end: today };
      case 'thisYear':
        return { start: startOfYear(today), end: today };
      default:
        return { start: startOfMonth(today), end: endOfMonth(today) };
    }
  };

  // Listen for transaction and category events
  useEffect(() => {
    // Handle transaction updates from other components
    const handleTransactionUpdate = (data) => {
      console.log('Transaction update detected in Reports page:', data);
      // Refresh report data when a transaction is created, updated, or deleted
      setLastRefresh(new Date());
    };
    
    // Handle category updates from other components
    const handleCategoryUpdate = (data) => {
      console.log('Category update detected in Reports page:', data);
      // Refresh report data when a category is created, updated, or deleted
      setLastRefresh(new Date());
    };
    
    // Handle budget updates from other components
    const handleBudgetUpdate = (data) => {
      console.log('Budget update detected in Reports page:', data);
      // Refresh report data when a budget is created, updated, or deleted
      setLastRefresh(new Date());
    };
    
    // Subscribe to events
    const unsubscribeTransaction = eventBus.subscribe(EVENTS.TRANSACTION_UPDATED, handleTransactionUpdate);
    const unsubscribeCategory = eventBus.subscribe(EVENTS.CATEGORY_UPDATED, handleCategoryUpdate);
    const unsubscribeBudget = eventBus.subscribe(EVENTS.BUDGET_UPDATED, handleBudgetUpdate);
    
    // Clean up subscriptions when component unmounts
    return () => {
      unsubscribeTransaction();
      unsubscribeCategory();
      unsubscribeBudget();
    };
  }, []); // Empty dependency array means this runs once on mount
  
  // Fetch report data from the API
  // Fetch all categories for the filter dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        console.log('Fetching all categories for dropdown...');
        const response = await fetch('http://localhost:5000/api/categories');
        if (!response.ok) {
          throw new Error(`Failed to fetch categories: ${response.status}`);
        }
        
        const categories = await response.json();
        console.log('Fetched categories for filter:', categories);
        
        // Store all categories in a separate state
        setAllCategories(categories);
        
        // Create a map of category colors
        const colors = {};
        categories.forEach(category => {
          colors[category.name] = category.color || '#' + Math.floor(Math.random()*16777215).toString(16);
        });
        setCategoryColors(colors);
        
        // Add default data for testing if no data is available
        if (!categories || categories.length === 0) {
          console.warn('No categories found, adding default categories for testing');
          const defaultCategories = [
            { name: 'Food', color: '#FF5722' },
            { name: 'Transportation', color: '#2196F3' },
            { name: 'Entertainment', color: '#9C27B0' },
            { name: 'Shopping', color: '#4CAF50' },
            { name: 'Bills', color: '#F44336' }
          ];
          setAllCategories(defaultCategories);
          
          // Set colors for default categories
          const defaultColors = {};
          defaultCategories.forEach(cat => {
            defaultColors[cat.name] = cat.color;
          });
          setCategoryColors(defaultColors);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        // Add fallback categories if API fails
        const fallbackCategories = [
          { name: 'Food', color: '#FF5722' },
          { name: 'Transportation', color: '#2196F3' },
          { name: 'Entertainment', color: '#9C27B0' },
          { name: 'Shopping', color: '#4CAF50' },
          { name: 'Bills', color: '#F44336' }
        ];
        setAllCategories(fallbackCategories);
      }
    };
    
    fetchCategories();
  }, []);
  
  useEffect(() => {
    const fetchReportData = async () => {
      try {
        console.log('Starting to fetch report data...');
        setLoading(true);
        setError(null); // Clear any previous errors
        
        // Get date range based on filter selection
        const { start, end } = getDateRange();
        console.log('Date range calculated:', { start, end });
        
        // Format dates for API
        const startDate = format(start, 'yyyy-MM-dd');
        const endDate = format(end, 'yyyy-MM-dd');
        console.log(`Using date range: ${startDate} to ${endDate} for API requests`);
        
        // Log the selected filters
        console.log('Current filters:', {
          dateRange,
          selectedReport,
          selectedCategories
          // No transactionType filter in this component
        });
        
        // Map dateRange to period for the summary endpoint
        let period;
        switch (dateRange) {
          case 'thisMonth':
            period = 'month';
            break;
          case 'last3months':
            period = 'quarter';
            break;
          case 'thisYear':
            period = 'year';
            break;
          default:
            // Use the dates directly for other ranges
            period = undefined;
        }
        
        // Use the new report summary endpoint
        console.log(`Fetching report summary with period: ${period}`);
        const summaryData = await getReportSummary(period);
        console.log('Report summary data received:', summaryData);
        
        // Fetch specific data based on selected report type
        let specificData = {};
        
        if (selectedReport === 'category') {
          // Get expensive categories
          console.log(`Fetching expensive categories for date range: ${startDate} to ${endDate}`);
          const categoriesData = await getExpensiveCategories(startDate, endDate, 10);
          console.log('Expensive categories data received:', categoriesData);
          
          specificData = {
            categorySpending: categoriesData.categories.map(cat => ({
              name: cat.name,
              total: cat.total,
              color: cat.color
            }))
          };
          console.log('Formatted category spending data:', specificData.categorySpending);
        } else if (selectedReport === 'comparison') {
          // Get monthly comparison
          console.log(`Fetching monthly comparison for date range: ${startDate} to ${endDate}`);
          const comparisonData = await getMonthlyComparison(startDate, endDate);
          console.log('Monthly comparison data received:', comparisonData);
          
          specificData = {
            monthlyComparison: comparisonData.monthlyData.map(item => ({
              month: item.month_name,
              income: item.income,
              expenses: item.expenses,
              net: item.net
            }))
          };
          console.log('Formatted monthly comparison data:', specificData.monthlyComparison);
        } else if (selectedReport === 'trends') {
          // Get category trends
          console.log(`Fetching category trends for date range: ${startDate} to ${endDate}, categories: ${selectedCategories.join(', ') || 'all'}`);
          const trendsData = await getCategoryTrends(startDate, endDate, selectedCategories);
          console.log('Category trends data received:', trendsData);
          
          specificData = {
            dailyTrends: trendsData.trends.flatMap(month => 
              month.categories.map(cat => ({
                date: month.month_name,
                category: cat.category,
                amount: cat.amount,
                color: cat.color
              }))
            )
          };
          console.log('Formatted daily trends data:', specificData.dailyTrends);
        }
        
        // Combine the data
        const combinedData = {
          // Map the summary data to our existing structure
          categorySpending: summaryData.expensive_categories.map(cat => ({
            name: cat.name,
            total: cat.total,
            color: cat.color
          })),
          monthlyComparison: summaryData.monthly_spending.map(item => ({
            month: item.month_name,
            income: item.income,
            expenses: item.expenses,
            net: item.net
          })),
          // Transform category trends data for the trends chart
          dailyTrends: summaryData.category_trends.flatMap(month => 
            month.categories.map(cat => ({
              date: month.month_name,
              category: cat.category,
              amount: cat.amount,
              color: cat.color
            }))
          ),
          summary: {
            total_income: summaryData.summary.total_income,
            total_expenses: summaryData.summary.total_expenses,
            net_savings: summaryData.summary.net_savings,
            avg_monthly_expense: summaryData.summary.avg_monthly_expense,
            avg_monthly_income: summaryData.summary.avg_monthly_income
          },
          // Extract available categories from the expensive categories
          availableCategories: summaryData.expensive_categories.map(cat => ({
            name: cat.name,
            color: cat.color
          })),
          // Override with specific data for the selected report type
          ...specificData
        };
        
        setReportData(combinedData);
        
        // Create a map of category colors from available categories
        const colors = {};
        combinedData.availableCategories.forEach(category => {
          colors[category.name] = category.color || '#' + Math.floor(Math.random()*16777215).toString(16);
        });
        setCategoryColors(colors);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching report data:', err);
        
        // Provide more specific error message based on the error type
        if (err.message && (err.message.includes('network') || err.message.includes('Failed to fetch'))) {
          setError('Network error: Please check your internet connection and ensure the backend server is running');
        } else if (err.message && err.message.includes('timeout')) {
          setError('Request timed out: Server is taking too long to respond');
        } else if (err.message && err.message.includes('invalid data')) {
          setError('The server returned invalid data. This may indicate no transactions exist for the selected filters.');
        } else if (err.response && err.response.status === 401) {
          setError('Authentication error: Please log in again');
        } else if (err.response && err.response.status === 403) {
          setError('Permission denied: You do not have access to this data');
        } else if (err.response && err.response.status === 404) {
          setError('Data not found: The requested report data does not exist');
        } else if (err.response && err.response.status >= 500) {
          setError('Server error: The backend server encountered an error. Please try again later.');
        } else {
          setError(`Failed to load report data: ${err.message || 'Unknown error'}`);
        }
        
        // Always set empty data structure when there's an error to avoid rendering issues
        setReportData({
          transactions: [],
          categorySpending: [],
          monthlyComparison: [],
          dailyTrends: [],
          summary: { 
            total_income: 0, 
            total_expenses: 0, 
            net_savings: 0,
            avg_monthly_expense: 0,
            avg_monthly_income: 0 
          },
          availableCategories: []
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchReportData();
  }, [dateRange, selectedCategories, selectedReport, lastRefresh]);
  
  // Prepare data for category spending pie chart
  const getCategoryData = () => {
    // Ensure we have valid data
    if (!effectiveReportData.categorySpending || effectiveReportData.categorySpending.length === 0) {
      console.warn('No category spending data available');
      
      // Generate sample data for testing if no real data is available
      if (allCategories && allCategories.length > 0) {
        console.log('Generating sample category data for chart testing');
        return allCategories.slice(0, 5).map((category, index) => ({
          name: category.name,
          value: 1000 - (index * 150), // Generate some sample values
          color: category.color
        }));
      }
      return [];
    }
    
    return effectiveReportData.categorySpending
      .filter(category => parseFloat(category.total) > 0) // Only include categories with spending
      .map(category => {
        // Find the category color from allCategories
        const categoryObj = allCategories.find(cat => cat.name === category.name);
        return {
          name: category.name,
          value: parseFloat(category.total),
          color: category.color || categoryObj?.color || categoryColors[category.name] || '#' + Math.floor(Math.random()*16777215).toString(16)
        };
      });
  };
  
  // Prepare data for income vs expenses bar chart
  const getComparisonData = () => {
    // Ensure we have valid data
    if (!effectiveReportData.monthlyComparison || effectiveReportData.monthlyComparison.length === 0) {
      console.warn('No monthly comparison data available');
      
      // Generate sample data for testing if no real data is available
      console.log('Generating sample comparison data for chart testing');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      return months.map(month => ({
        month,
        income: 1000 + Math.random() * 500,
        expenses: 800 + Math.random() * 400
      }));
    }
    
    return effectiveReportData.monthlyComparison.map(item => ({
      month: item.month,
      income: parseFloat(item.income || 0),
      expenses: parseFloat(item.expenses || 0)
    }));
  };
  
  // Prepare data for monthly trends line chart
  const getTrendsData = () => {
    // Ensure we have valid data
    if (!effectiveReportData.dailyTrends || effectiveReportData.dailyTrends.length === 0) {
      console.warn('No daily trends data available');
      
      // Generate sample data for testing if no real data is available
      if (allCategories && allCategories.length > 0) {
        console.log('Generating sample trends data for chart testing');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const sampleCategories = allCategories.slice(0, 3); // Use first 3 categories
        
        let sampleData = [];
        months.forEach(month => {
          sampleCategories.forEach(category => {
            sampleData.push({
              date: month,
              category: category.name,
              amount: 200 + Math.random() * 300,
              color: category.color
            });
          });
        });
        
        // If we have selected categories, filter the sample data
        if (selectedCategories.length > 0) {
          sampleData = sampleData.filter(item => 
            selectedCategories.includes(item.category)
          );
        }
        
        return sampleData;
      }
      return [];
    }
    
    // If we have selected categories, filter the data
    let trendsData = effectiveReportData.dailyTrends;
    if (selectedCategories.length > 0) {
      trendsData = trendsData.filter(item => 
        selectedCategories.includes(item.category)
      );
    }
    
    return trendsData.map(item => ({
      date: item.date,
      category: item.category,
      amount: parseFloat(item.amount || 0)
    }));
  };

  const handleExport = async () => {
    try {
      const { start, end } = getDateRange();
      
      // Format dates for API
      const startDate = format(start, 'yyyy-MM-dd');
      const endDate = format(end, 'yyyy-MM-dd');
      
      // Show loading indicator or notification
      setLoading(true);
      
      // Export data
      await exportReportData(startDate, endDate, selectedReport, selectedCategories);
    } catch (err) {
      console.error('Error exporting report:', err);
      alert('Failed to export report. Please try again.');
    }
  };

  const renderReport = () => {
    switch (selectedReport) {
      case 'category':
        const categoryData = getCategoryData();
        return (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Category Spending</h2>
            {categoryData.length === 0 ? (
              <div className="flex items-center justify-center h-96">
                <p className="text-gray-500">No spending data available for the selected period</p>
              </div>
            ) : (
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({name, value}) => `${name}: $${value.toLocaleString()}`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                    >
                      {categoryData.map((entry, index) => {
                        // Find the category color from allCategories
                        const category = allCategories.find(cat => cat.name === entry.name);
                        const color = entry.color || category?.color || categoryColors[entry.name] || `#${Math.floor(Math.random()*16777215).toString(16)}`;
                        return <Cell key={`cell-${index}`} fill={color} />;
                      })}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        );

      case 'comparison':
        const comparisonData = getComparisonData();
        return (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Income vs. Expenses</h2>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getComparisonData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                  <Legend />
                  <Bar dataKey="income" fill="#4CAF50" name="Income" />
                  <Bar dataKey="expenses" fill="#F44336" name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case 'trends':
        // Get unique categories from the trends data
        const trendsData = getTrendsData();
        const uniqueCategories = [...new Set(trendsData.map(item => item.category))];
        
        // Group data by date
        const groupedByDate = {};
        trendsData.forEach(item => {
          if (!groupedByDate[item.date]) {
            groupedByDate[item.date] = { date: item.date };
          }
          groupedByDate[item.date][item.category] = item.amount;
        });
        
        // Convert grouped data to array
        const formattedTrendsData = Object.values(groupedByDate);
        
        return (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Monthly Trends</h2>
            {trendsData.length === 0 ? (
              <div className="flex items-center justify-center h-96">
                <p className="text-gray-500">No data available for the selected period and categories</p>
              </div>
            ) : (
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formattedTrendsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                    <Legend />
                    {uniqueCategories.map((category, index) => {
                      // Find the category color from allCategories or categoryColors
                      const categoryObj = allCategories.find(cat => cat.name === category);
                      const color = categoryObj?.color || categoryColors[category] || `#${Math.floor(Math.random()*16777215).toString(16)}`;
                      return (
                        <Line
                          key={category}
                          type="monotone"
                          dataKey={category}
                          stroke={color}
                          name={category}
                          activeDot={{ r: 8 }}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // Get summary data from API response
  const summaryData = {
  income: parseFloat(effectiveReportData.summary.total_income) || 0,
  expenses: parseFloat(effectiveReportData.summary.total_expenses) || 0
};

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-text mb-2">Financial Reports</h1>
            <p className="text-gray-500">
              Analyze your spending patterns and financial trends
            </p>
          </div>
          <div className="flex space-x-2 mt-4 md:mt-0">
            <button
              onClick={() => setLastRefresh(new Date())}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={handleExport}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              Export Report
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Total Income</h3>
              <ChartPieIcon className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-600 mt-2">
              ${summaryData.income.toLocaleString()}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Total Expenses</h3>
              <ChartPieIcon className="h-5 w-5 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-red-600 mt-2">
              ${summaryData.expenses.toLocaleString()}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Net Balance</h3>
              <ChartPieIcon className="h-5 w-5 text-text" />
            </div>
            <p className="text-2xl font-bold text-text mt-2">
              ${(summaryData.income - summaryData.expenses).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Report Controls */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Report Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Type
              </label>
              <div className="flex flex-col space-y-2">
                {reportTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setSelectedReport(type.value)}
                    className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                      selectedReport === type.value
                        ? 'bg-primary bg-opacity-10 text-text'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <type.icon className="h-5 w-5 mr-2" />
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {dateRanges.map((range) => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categories
              </label>
              <div className="space-y-2">
                {allCategories && allCategories.length > 0 ? (
                  allCategories.map((category) => (
                    <label key={category.name || category.category_id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category.name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCategories([...selectedCategories, category.name]);
                          } else {
                            setSelectedCategories(
                              selectedCategories.filter((c) => c !== category.name)
                            );
                          }
                        }}
                        className="form-checkbox h-4 w-4 text-primary rounded"
                      />
                      <span 
                        className="ml-2 text-sm text-gray-700 capitalize flex items-center"
                      >
                        <span 
                          className="inline-block w-3 h-3 rounded-full mr-1" 
                          style={{ backgroundColor: category.color || '#808080' }}
                        ></span>
                        {category.name}
                      </span>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Loading categories...</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Report Visualization */}
        {loading ? (
          <div className="bg-white p-6 rounded-lg shadow-sm flex items-center justify-center h-96">
            <p className="text-gray-500">Loading report data...</p>
          </div>
        ) : error ? (
          <div className="bg-white p-6 rounded-lg shadow-sm flex items-center justify-center h-96">
            <p className="text-red-500">{error}</p>
          </div>
        ) : (
          renderReport()
        )}
      </main>
    </div>
  );
};

export default ReportsPage;
