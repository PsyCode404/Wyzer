import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PlusIcon } from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import DashboardCard from '../components/DashboardCard';
import BudgetProgress from '../components/BudgetProgress';
import TransactionList from '../components/TransactionList';

// Sample data - replace with real data from your backend
const spendingData = [
  { name: 'Food', value: 500, color: '#10B981' },
  { name: 'Transport', value: 300, color: '#3B82F6' },
  { name: 'Rent', value: 1000, color: '#8B5CF6' },
  { name: 'House Chores', value: 200, color: '#F59E0B' },
  { name: 'Subscriptions', value: 150, color: '#EC4899' },
];

const monthlyData = [
  { name: 'Jan', income: 4500, expenses: 3200 },
  { name: 'Feb', income: 4800, expenses: 3600 },
  { name: 'Mar', income: 4200, expenses: 3100 },
  { name: 'Apr', income: 4900, expenses: 3800 },
];

const recentTransactions = [
  {
    id: 1,
    description: 'Grocery Shopping',
    amount: 85.50,
    category: 'Food',
    type: 'expense',
    date: new Date('2025-04-12'),
  },
  {
    id: 2,
    description: 'Monthly Salary',
    amount: 4500,
    category: 'Income',
    type: 'income',
    date: new Date('2025-04-01'),
  },
  {
    id: 3,
    description: 'Netflix Subscription',
    amount: 15.99,
    category: 'Subscriptions',
    type: 'expense',
    date: new Date('2025-04-10'),
  },
];

const DashboardPage = () => {
  const currency = '$'; // Get from user preferences
  const totalBudget = 5000;
  const spentAmount = 3250;

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Spending Breakdown */}
          <DashboardCard title="Spending Breakdown" className="lg:col-span-1">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={spendingData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {spendingData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {spendingData.map((category) => (
                <div key={category.name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-sm text-text">{category.name}</span>
                  </div>
                  <span className="text-sm text-text">
                    {currency}{category.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </DashboardCard>

          {/* Income vs Expenses */}
          <DashboardCard title="Income vs Expenses" className="lg:col-span-2">
            <div className="h-64">
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
            <TransactionList
              transactions={recentTransactions}
              currency={currency}
            />
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
