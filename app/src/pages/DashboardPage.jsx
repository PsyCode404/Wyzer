import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import DashboardCard from '../components/DashboardCard';
import BudgetProgress from '../components/BudgetProgress';
import TransactionList from '../components/TransactionList';
import { getDashboardData, getUserBudget } from '../utils/dashboardApi';
import eventBus, { EVENTS } from '../utils/eventBus';

// Empty initial states for dashboard data - will be populated from API

const DashboardPage = () => {
  // State for dashboard data
  const [spendingData, setSpendingData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpenses: 0, netSavings: 0 });
  const [budget, setBudget] = useState({ totalBudget: 0, currency: '$' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  
  // Function to fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('Fetching dashboard data...');
      
      // Get dashboard data from API
      const dashboardData = await getDashboardData();
      console.log('Dashboard data received:', dashboardData);
      
      // Make sure we have valid data before updating state
      if (dashboardData && dashboardData.spendingData) {
        setSpendingData(dashboardData.spendingData || []);
      }
      
      if (dashboardData && dashboardData.monthlyData) {
        setMonthlyData(dashboardData.monthlyData || []);
      }
      
      if (dashboardData && dashboardData.recentTransactions) {
        setRecentTransactions(dashboardData.recentTransactions || []);
      }
      
      if (dashboardData && dashboardData.summary) {
        setSummary(dashboardData.summary || { totalIncome: 0, totalExpenses: 0, netSavings: 0 });
      }
      
      // Get user budget
      console.log('Fetching user budget...');
      const userBudget = await getUserBudget();
      console.log('User budget received:', userBudget);
      
      if (userBudget && (userBudget.budgets || userBudget.totalBudget)) {
        // Handle both old and new budget data structure
        if (userBudget.budgets) {
          // New structure with detailed budgets
          const totalBudgetAmount = userBudget.total_budget || 
            userBudget.budgets.reduce((sum, b) => sum + (b.amount || 0), 0);
            
          setBudget({
            ...userBudget,
            totalBudget: totalBudgetAmount,
            currency: '$'
          });
        } else {
          // Old structure with just totalBudget
          setBudget(userBudget);
        }
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try refreshing the page.');
      // Keep the current data if there's an error
    } finally {
      setLoading(false);
    }
  };

  // Fetch dashboard data when component mounts or when lastRefresh changes
  useEffect(() => {
    fetchDashboardData();
    
    // Set up a refresh interval (every 30 seconds)
    const refreshInterval = setInterval(() => {
      setLastRefresh(new Date());
    }, 30000);
    
    // Clean up the interval when component unmounts
    return () => clearInterval(refreshInterval);
  }, [lastRefresh]); // Re-run when lastRefresh changes
  
  // Listen for transaction events
  useEffect(() => {
    // Handle transaction updates from other components
    const handleTransactionUpdate = (data) => {
      console.log('Transaction update detected:', data);
      // Refresh dashboard data when a transaction is created, updated, or deleted
      fetchDashboardData();
    };
    
    // Subscribe to transaction events
    const unsubscribe = eventBus.subscribe(EVENTS.TRANSACTION_UPDATED, handleTransactionUpdate);
    
    // Clean up subscription when component unmounts
    return () => unsubscribe();
  }, []); // Empty dependency array means this runs once on mount
  
  // Extract values with fallbacks to prevent undefined errors
  const currency = budget?.currency || '$';
  const totalBudget = budget?.totalBudget || 5000;
  const spentAmount = summary?.totalExpenses || summary?.total_expenses || 0;

  // Function to manually refresh dashboard data
  const handleRefresh = () => {
    setLastRefresh(new Date());
  };

  const QuickActionButton = ({ icon: Icon, label, onClick }) => (
    <button
      onClick={onClick}
      className="flex items-center justify-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-primary hover:bg-opacity-10 transition-colors"
    >
      <Icon className="h-5 w-5 text-primary" />
      <span className="text-text">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Dashboard</h2>
          <div className="flex gap-4">
            <button
              className="flex items-center gap-1 text-sm text-green-600 hover:text-green-800"
              onClick={() => {
                console.log('Manual refresh triggered');
                fetchDashboardData();
              }}
            >
              <ArrowPathIcon className="h-4 w-4" />
              Refresh Data
            </button>
            <button
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
              onClick={() => setLastRefresh(new Date())}
            >
              <PlusIcon className="h-4 w-4" />
              Add Transaction
            </button>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Spending Breakdown */}
          <DashboardCard title="Spending Breakdown" className="lg:col-span-1">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={spendingData || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {Array.isArray(spendingData) && spendingData.map((entry, index) => (
                      <Cell key={index} fill={entry.color || '#9CA3AF'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {Array.isArray(spendingData) && spendingData.map((category) => (
                <div key={category.name || 'unknown'} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: category.color || '#9CA3AF' }}
                    />
                    <span className="text-sm text-text">{category.name || 'Unknown'}</span>
                  </div>
                  <span className="text-sm text-text">
                    {currency}{(category.value || 0).toLocaleString()}
                  </span>
                </div>
              ))}
              {(!Array.isArray(spendingData) || spendingData.length === 0) && (
                <div className="text-sm text-gray-500 italic text-center py-2">No spending data available</div>
              )}
            </div>
          </DashboardCard>

          {/* Income vs Expenses */}
          <DashboardCard title="Income vs Expenses" className="lg:col-span-2">
            <div className="h-64">
              {Array.isArray(monthlyData) && monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="income" fill="#10B981" name="Income" />
                    <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-500 italic">No monthly data available</p>
                </div>
              )}
            </div>
          </DashboardCard>

          {/* Budget Progress */}
          <DashboardCard title="Monthly Budget" className="lg:col-span-2">
            <BudgetProgress
              spent={spentAmount}
              total={totalBudget}
              currency={currency}
            />
          </DashboardCard>

          {/* Quick Actions */}
          <DashboardCard title="Quick Actions" className="flex flex-col space-y-4">
            <QuickActionButton
              icon={PlusIcon}
              label="Add Income"
              onClick={() => {}}
            />
            <QuickActionButton
              icon={PlusIcon}
              label="Add Expense"
              onClick={() => {}}
            />
            <QuickActionButton
              icon={PlusIcon}
              label="View All Transactions"
              onClick={() => {}}
            />
          </DashboardCard>

          {/* Recent Transactions */}
          <DashboardCard title="Recent Transactions" className="lg:col-span-3">
            {Array.isArray(recentTransactions) && recentTransactions.length > 0 ? (
              <TransactionList
                transactions={recentTransactions}
                currency={currency}
              />
            ) : (
              <div className="py-4 text-center text-gray-500 italic">
                No recent transactions available
              </div>
            )}
          </DashboardCard>
        </div>
      </main>

      <footer className="bg-white mt-12 py-8 border-t">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between text-sm text-gray-600">
            <div className="space-x-4">
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-primary transition-colors">Contact Us</a>
            </div>
            <div>© 2025 Wyzer. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DashboardPage;
