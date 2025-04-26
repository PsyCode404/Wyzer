import React, { useState, useEffect } from 'react';
import { format, addDays, addWeeks, addMonths, addYears } from 'date-fns';
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  PauseIcon,
  PlayIcon,
  ArrowDownTrayIcon,
  ChartPieIcon,
} from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import RecurringTransactionForm from '../components/RecurringTransactionForm';

// Import API utilities
import { 
  getRecurringTransactions, 
  createRecurringTransaction, 
  updateRecurringTransaction, 
  toggleRecurringTransactionStatus, 
  deleteRecurringTransaction 
} from '../utils/recurringTransactionApi';
import { getCategories } from '../utils/categoryApi';

const categoryColors = {
  food: 'bg-green-100 text-green-800',
  transport: 'bg-blue-100 text-blue-800',
  rent: 'bg-purple-100 text-purple-800',
  utilities: 'bg-yellow-100 text-yellow-800',
  entertainment: 'bg-pink-100 text-pink-800',
  subscriptions: 'bg-indigo-100 text-indigo-800',
  income: 'bg-primary bg-opacity-10 text-text',
};

const getNextOccurrence = (startDate, frequency) => {
  const date = new Date(startDate);
  const today = new Date();
  let nextDate = date;

  while (nextDate <= today) {
    switch (frequency) {
      case 'daily':
        nextDate = addDays(nextDate, 1);
        break;
      case 'weekly':
        nextDate = addWeeks(nextDate, 1);
        break;
      case 'monthly':
        nextDate = addMonths(nextDate, 1);
        break;
      case 'yearly':
        nextDate = addYears(nextDate, 1);
        break;
      default:
        return date;
    }
  }

  return nextDate;
};

const RecurringTransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch recurring transactions and categories when component mounts
  useEffect(() => {
    const fetchRecurringTransactions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const result = await getRecurringTransactions();
        setTransactions(result);
      } catch (err) {
        console.error('Error fetching recurring transactions:', err);
        setError('Failed to load recurring transactions. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRecurringTransactions();
  }, []);
  
  // Fetch categories when component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const result = await getCategories();
        setCategories(result);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    
    fetchCategories();
  }, []);

  const handleSubmit = async (values) => {
    try {
      console.log('Submitting recurring transaction form with values:', values);
      
      // Make sure we have a valid category ID (must be a number)
      // If the category is a string (like 'food'), we need to find the corresponding category ID
      let categoryId = values.category;
      
      // If categoryId is not a number, try to find the matching category from our categories array
      if (isNaN(parseInt(categoryId))) {
        console.log('Category is not a number, looking for matching category ID');
        const matchingCategory = categories.find(cat => cat.name === values.category || cat.value === values.category);
        if (matchingCategory) {
          categoryId = matchingCategory.category_id;
          console.log(`Found matching category ID: ${categoryId} for category: ${values.category}`);
        } else {
          console.warn(`Could not find matching category ID for: ${values.category}`);
          // Default to null if no matching category is found
          categoryId = null;
        }
      }
      
      // Format the data to match what the backend expects
      const formattedData = {
        name: values.name,
        amount: parseFloat(values.amount),
        category: categoryId, // Use the numeric category ID
        frequency: values.frequency,
        startDate: values.startDate,
        endDate: values.endDate || null,
        type: values.type,
        payment_method: values.payment_method || null,
        notes: values.description || null,
        isActive: values.notifications !== false
      };
      
      console.log('Formatted data for API:', formattedData);
      
      if (editingTransaction) {
        // Update existing recurring transaction
        const result = await updateRecurringTransaction(editingTransaction.id, formattedData);
        console.log('Update result:', result);
        
        if (result && result.transaction) {
          setTransactions(prev => 
            prev.map(t => t.id === editingTransaction.id ? result.transaction : t)
          );
          setIsModalOpen(false);
          setEditingTransaction(null);
        } else {
          throw new Error('Invalid response format from server');
        }
      } else {
        // Create new recurring transaction
        const result = await createRecurringTransaction(formattedData);
        console.log('Create result:', result);
        
        if (result && result.transaction) {
          setTransactions(prev => [result.transaction, ...prev]);
          setIsModalOpen(false);
          setEditingTransaction(null);
        } else {
          throw new Error('Invalid response format from server');
        }
      }
    } catch (err) {
      console.error('Error saving recurring transaction:', err);
      alert(`Failed to save recurring transaction: ${err.message || 'Please try again.'}`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this recurring transaction?')) {
      try {
        await deleteRecurringTransaction(id);
        setTransactions(prev => prev.filter(t => t.id !== id));
      } catch (err) {
        console.error('Error deleting recurring transaction:', err);
        alert('Failed to delete recurring transaction. Please try again.');
      }
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      await toggleRecurringTransactionStatus(id, !currentStatus);
      setTransactions(prev =>
        prev.map(t => t.id === id ? { ...t, isActive: !t.isActive } : t)
      );
    } catch (err) {
      console.error('Error toggling recurring transaction status:', err);
      alert('Failed to update transaction status. Please try again.');
    }
  };

  const handleExport = () => {
    const csv = [
      ['Name', 'Amount', 'Category', 'Frequency', 'Start Date', 'Type', 'Status'],
      ...transactions.map((t) => [
        t.name,
        t.amount,
        t.category,
        t.frequency,
        t.startDate,
        t.type,
        t.isActive ? 'Active' : 'Paused',
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recurring-transactions.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredTransactions = transactions.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const upcomingTransactions = transactions
    .filter((t) => t.isActive)
    .map((t) => ({
      ...t,
      nextDate: getNextOccurrence(t.startDate, t.frequency),
    }))
    .sort((a, b) => a.nextDate - b.nextDate)
    .slice(0, 5);

  const totals = transactions
    .filter((t) => t.isActive)
    .reduce(
      (acc, t) => {
        if (t.type === 'income') {
          acc.income += t.amount;
        } else {
          acc.expenses += t.amount;
        }
        return acc;
      },
      { income: 0, expenses: 0 }
    );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-text mb-2">
              Recurring Transactions
            </h1>
            <p className="text-gray-500">
              Manage your recurring expenses and income
            </p>
          </div>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <button
              onClick={handleExport}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              Export
            </button>
            <button
              onClick={() => {
                setEditingTransaction(null);
                setIsModalOpen(true);
              }}
              className="flex items-center px-4 py-2 bg-primary text-text font-medium rounded-lg hover:bg-opacity-90 transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Recurring
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">
                Monthly Income
              </h3>
              <ChartPieIcon className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-600 mt-2">
              ${totals.income.toLocaleString()}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">
                Monthly Expenses
              </h3>
              <ChartPieIcon className="h-5 w-5 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-red-600 mt-2">
              ${totals.expenses.toLocaleString()}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Net Monthly</h3>
              <ChartPieIcon className="h-5 w-5 text-text" />
            </div>
            <p className="text-2xl font-bold text-text mt-2">
              ${(totals.income - totals.expenses).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Upcoming Transactions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-text mb-4">
            Upcoming Transactions
          </h2>
          <div className="space-y-4">
            {upcomingTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`px-3 py-1 text-sm rounded-full ${
                      categoryColors[transaction.category]
                    }`}
                  >
                    {transaction.category}
                  </div>
                  <div>
                    <h3 className="font-medium text-text">{transaction.name}</h3>
                    <p className="text-sm text-gray-500">
                      Next: {format(transaction.nextDate, 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`text-lg font-semibold ${
                      transaction.type === 'expense'
                        ? 'text-red-600'
                        : 'text-green-600'
                    }`}
                  >
                    {transaction.type === 'expense' ? '-' : '+'}$
                    {transaction.amount.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500 capitalize">
                    {transaction.frequency}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search recurring transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-96 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Transaction List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Frequency
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-gray-500">
                      Loading recurring transactions...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-red-500">
                      {error}
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-gray-500">
                      No recurring transactions found. Add your first recurring transaction using the button above.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-text">
                        {transaction.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {transaction.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          categoryColors[transaction.category]
                        }`}
                      >
                        {transaction.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 capitalize">
                        {transaction.frequency}
                      </div>
                      <div className="text-sm text-gray-500">
                        Started {format(new Date(transaction.startDate), 'MMM d, yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span
                        className={`text-sm font-medium ${
                          transaction.type === 'expense'
                            ? 'text-red-600'
                            : 'text-green-600'
                        }`}
                      >
                        {transaction.type === 'expense' ? '-' : '+'}$
                        {transaction.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          transaction.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {transaction.isActive ? 'Active' : 'Paused'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-3">
                      <button
                        onClick={() => handleToggleActive(transaction.id, transaction.isActive)}
                        className={`text-gray-400 hover:text-gray-600 transition-colors`}
                        title={transaction.isActive ? 'Pause' : 'Activate'}
                      >
                        {transaction.isActive ? (
                          <PauseIcon className="h-5 w-5" />
                        ) : (
                          <PlayIcon className="h-5 w-5" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setEditingTransaction(transaction);
                          setIsModalOpen(true);
                        }}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="Edit"
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <RecurringTransactionForm
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTransaction(null);
        }}
        transaction={editingTransaction}
        onSubmit={handleSubmit}
        categories={categories}
      />
    </div>
  );
};

export default RecurringTransactionsPage;
