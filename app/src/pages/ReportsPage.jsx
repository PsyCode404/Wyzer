import React, { useState } from 'react';
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
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import {
  ArrowDownTrayIcon,
  ChartPieIcon,
  ChartBarIcon,
  PresentationChartLineIcon,
} from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';

// Sample data - replace with real data from your backend
const sampleTransactions = [
  {
    id: 1,
    description: 'Grocery Shopping',
    amount: 85.50,
    category: 'food',
    type: 'expense',
    date: '2025-04-12',
  },
  {
    id: 2,
    description: 'Monthly Salary',
    amount: 4500,
    category: 'income',
    type: 'income',
    date: '2025-04-01',
  },
  // Add more sample transactions
];

const categoryColors = {
  food: '#4CAF50',
  transport: '#2196F3',
  rent: '#9C27B0',
  utilities: '#FFC107',
  entertainment: '#E91E63',
  subscriptions: '#673AB7',
  income: '#00BCD4',
};

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
      // Add more cases as needed
      default:
        return { start: startOfMonth(today), end: endOfMonth(today) };
    }
  };

  // Filter transactions based on date range and categories
  const getFilteredTransactions = () => {
    const { start, end } = getDateRange();
    return sampleTransactions.filter(
      (transaction) =>
        new Date(transaction.date) >= start &&
        new Date(transaction.date) <= end &&
        (selectedCategories.length === 0 ||
          selectedCategories.includes(transaction.category))
    );
  };

  // Prepare data for category spending pie chart
  const getCategoryData = () => {
    const transactions = getFilteredTransactions();
    const categoryTotals = transactions.reduce((acc, transaction) => {
      if (transaction.type === 'expense') {
        acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
      }
      return acc;
    }, {});

    return Object.entries(categoryTotals).map(([category, amount]) => ({
      name: category,
      value: amount,
    }));
  };

  // Prepare data for income vs expenses bar chart
  const getComparisonData = () => {
    const transactions = getFilteredTransactions();
    const monthlyData = transactions.reduce((acc, transaction) => {
      const month = format(new Date(transaction.date), 'MMM yyyy');
      if (!acc[month]) {
        acc[month] = { month, income: 0, expenses: 0 };
      }
      if (transaction.type === 'income') {
        acc[month].income += transaction.amount;
      } else {
        acc[month].expenses += transaction.amount;
      }
      return acc;
    }, {});

    return Object.values(monthlyData);
  };

  // Prepare data for monthly trends line chart
  const getTrendsData = () => {
    const transactions = getFilteredTransactions();
    const dailyTotals = transactions.reduce((acc, transaction) => {
      const date = format(new Date(transaction.date), 'MMM d');
      if (!acc[date]) {
        acc[date] = { date, amount: 0 };
      }
      acc[date].amount +=
        transaction.type === 'expense' ? -transaction.amount : transaction.amount;
      return acc;
    }, {});

    return Object.values(dailyTotals);
  };

  const handleExport = () => {
    // Implement export functionality
    console.log('Export report');
  };

  const renderReport = () => {
    switch (selectedReport) {
      case 'category':
        return (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Spending by Category</h2>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getCategoryData()}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={150}
                    label={({ name, value }) =>
                      `${name}: $${value.toLocaleString()}`
                    }
                  >
                    {getCategoryData().map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={categoryColors[entry.name] || '#777'}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case 'comparison':
        return (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Income vs. Expenses</h2>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getComparisonData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="income" fill="#4CAF50" name="Income" />
                  <Bar dataKey="expenses" fill="#F44336" name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case 'trends':
        return (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Monthly Trends</h2>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getTrendsData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#2196F3"
                    name="Net Amount"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Calculate summary data
  const getSummaryData = () => {
    const transactions = getFilteredTransactions();
    return transactions.reduce(
      (acc, transaction) => {
        if (transaction.type === 'income') {
          acc.income += transaction.amount;
        } else {
          acc.expenses += transaction.amount;
        }
        return acc;
      },
      { income: 0, expenses: 0 }
    );
  };

  const summaryData = getSummaryData();

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
          <button
            onClick={handleExport}
            className="flex items-center px-4 py-2 mt-4 md:mt-0 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            Export Report
          </button>
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
                {Object.keys(categoryColors).map((category) => (
                  <label key={category} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCategories([...selectedCategories, category]);
                        } else {
                          setSelectedCategories(
                            selectedCategories.filter((c) => c !== category)
                          );
                        }
                      }}
                      className="form-checkbox h-4 w-4 text-primary rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700 capitalize">
                      {category}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Report Visualization */}
        {renderReport()}
      </main>
    </div>
  );
};

export default ReportsPage;
