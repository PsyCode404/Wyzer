import React, { useState, useEffect } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import TransactionFilters from '../components/TransactionFilters';
import TransactionModal from '../components/TransactionModal';

// Import API utilities
import { getTransactions, createTransaction, updateTransaction, deleteTransaction, exportTransactions } from '../utils/transactionApi';
import { getCategories } from '../utils/categoryApi';
import eventBus, { EVENTS } from '../utils/eventBus';

// Use UI category colors for display (these are different from the hex colors used in charts)
const uiCategoryColors = {
  Food: 'bg-green-100 text-green-800',
  Transport: 'bg-blue-100 text-blue-800',
  Rent: 'bg-purple-100 text-purple-800',
  Entertainment: 'bg-pink-100 text-pink-800',
  Utilities: 'bg-yellow-100 text-yellow-800',
  Shopping: 'bg-red-100 text-red-800',
  Health: 'bg-indigo-100 text-indigo-800',
  Education: 'bg-teal-100 text-teal-800',
  Travel: 'bg-orange-100 text-orange-800',
  Other: 'bg-gray-100 text-gray-800',
  Income: 'bg-primary bg-opacity-10 text-text',
};

const TransactionPage = () => {

  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    dateRange: 'all',
    minAmount: '',
    maxAmount: '',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], // First day of current month
    endDate: new Date().toISOString().split('T')[0], // Today
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch transactions and categories when component mounts or filters change
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Prepare API filter parameters
        const apiFilters = {
          search: filters.search,
          limit: itemsPerPage,
          offset: (currentPage - 1) * itemsPerPage,
        };
        
        // Add date range if not 'all'
        if (filters.dateRange !== 'all') {
          apiFilters.startDate = filters.startDate;
          apiFilters.endDate = filters.endDate;
        }
        
        // Add category if not 'all'
        if (filters.category !== 'all') {
          apiFilters.category_id = filters.category;
        }
        
        // Add amount filters if provided
        if (filters.minAmount) apiFilters.minAmount = filters.minAmount;
        if (filters.maxAmount) apiFilters.maxAmount = filters.maxAmount;
        
        const result = await getTransactions(apiFilters);
        
        // Ensure transactions is always an array
        if (!result.transactions) {
          console.warn('No transactions array in API response, using empty array');
          result.transactions = [];
        }
        setTransactions(result.transactions || []);
        setTotalCount(result.total || 0);
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError('Failed to load transactions. Please try again.');
        setTransactions([]);
        setTotalCount(0);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTransactions();
  }, [filters, currentPage, itemsPerPage]);
  
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
  
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleEdit = (transaction) => {
    // Format the transaction data for the modal
    const formattedTransaction = {
      ...transaction,
      id: transaction.transaction_id,
      category: transaction.category_id,
      date: new Date(transaction.date).toISOString().split('T')[0]
    };
    
    setEditingTransaction(formattedTransaction);
    setIsModalOpen(true);
  };

  const handleDelete = async (transactionId) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await deleteTransaction(transactionId);
        
        // Notify other components that a transaction has been deleted
        eventBus.publish(EVENTS.TRANSACTION_UPDATED, {
          action: 'delete',
          transactionId: transactionId
        });
        
        // Refresh the transactions list
        setTransactions(transactions.filter(t => t.transaction_id !== transactionId));
      } catch (err) {
        console.error('Error deleting transaction:', err);
        alert('Failed to delete transaction. Please try again.');
      }
    }
  };

  const handleTransactionSubmit = async (values) => {
    try {
      // Format the data for the API
      const transactionData = {
        description: values.description,
        amount: Number(values.amount),
        category_id: values.category,
        type: values.type,
        date: values.date,
        // Add other fields as needed
        payment_method: values.payment_method || null,
        notes: values.notes || null
      };
      
      let result;
      if (editingTransaction) {
        // Update existing transaction
        result = await updateTransaction(editingTransaction.transaction_id, transactionData);
        console.log('Transaction updated:', result);
      } else {
        // Create new transaction
        result = await createTransaction(transactionData);
        console.log('Transaction created:', result);
      }
      
      // Notify other components that a transaction has been updated
      eventBus.publish(EVENTS.TRANSACTION_UPDATED, {
        action: editingTransaction ? 'update' : 'create',
        transaction: result?.transaction || transactionData
      });
      
      // Refresh the transactions list
      try {
        const result = await getTransactions({
          limit: itemsPerPage,
          offset: (currentPage - 1) * itemsPerPage
        });
        
        if (result && result.transactions) {
          setTransactions(result.transactions);
          setTotalCount(result.total || result.transactions.length);
        }
      } catch (err) {
        console.error('Error refreshing transactions:', err);
        // Even if refresh fails, show success message for the save operation
        alert('Transaction saved successfully, but could not refresh the list.');
      }
      
      // Close the modal after successful submission
      setIsModalOpen(false);
      setEditingTransaction(null);
    } catch (err) {
      console.error('Error saving transaction:', err);
      alert('Failed to save transaction. Please try again.');
    }
  };

  const handleExport = async () => {
    try {
      // Show loading indicator or notification
      // You could add a state variable for this if needed
      
      // Prepare export filters based on current filter state
      const exportFilters = {
        startDate: filters.dateRange !== 'all' ? filters.startDate : undefined,
        endDate: filters.dateRange !== 'all' ? filters.endDate : undefined,
        type: filters.type !== 'all' ? filters.type : undefined,
        category_id: filters.category !== 'all' ? filters.category : undefined
      };
      
      // Call the export API
      await exportTransactions(exportFilters);
      
      // Show success message if needed
      // This could be a toast notification or alert
    } catch (err) {
      console.error('Error exporting transactions:', err);
      alert('Failed to export transactions. Please try again.');
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text">Transactions</h1>
            <p className="text-gray-500">Manage your income and expenses</p>
          </div>
          <div className="flex mt-4 md:mt-0 space-x-2">
            <button
              onClick={handleExport}
              className="btn-outline flex items-center"
            >
              <ArrowDownTrayIcon className="h-5 w-5 mr-1" />
              Export
            </button>
            <Link to="/recurring" className="btn-outline flex items-center">
              <ClockIcon className="h-5 w-5 mr-1" />
              Recurring
            </Link>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-primary flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-1" />
              Add Transaction
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
          <div className="p-4 border-b">
            <TransactionFilters
              filters={filters}
              onFilterChange={handleFilterChange}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Description & Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Category
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Amount
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-gray-500">
                      Loading transactions...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-red-500">
                      {error}
                    </td>
                  </tr>
                ) : !transactions || transactions.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-gray-500">
                      No transactions found. Add your first transaction using the button above.
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => (
                    <tr key={transaction.transaction_id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium">{transaction.description}</div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(transaction.date), 'MMM d, yyyy')}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${transaction.category_color ? `bg-opacity-10 text-${transaction.category_color.replace('#', '')}` : 'bg-gray-100 text-gray-800'}`}
                        >
                          {transaction.category_name || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {transaction.type === 'income' ? '+' : '-'}
                          ${parseFloat(transaction.amount).toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(transaction)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <PencilSquareIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(transaction.transaction_id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">
                      {Math.min(
                        (currentPage - 1) * itemsPerPage + 1,
                        totalCount
                      )}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * itemsPerPage, totalCount)}
                    </span>{' '}
                    of <span className="font-medium">{totalCount}</span> results
                  </p>
                </div>
                <div>
                  <nav
                    className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                    aria-label="Pagination"
                  >
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === 1
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                    {/* Page numbers */}
                    {[...Array(totalPages).keys()].map((page) => (
                      <button
                        key={page + 1}
                        onClick={() => setCurrentPage(page + 1)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === page + 1
                            ? 'z-10 bg-primary border-primary text-white'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page + 1}
                      </button>
                    ))}
                    <button
                      onClick={() =>
                        setCurrentPage(Math.min(totalPages, currentPage + 1))
                      }
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === totalPages
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Next</span>
                      <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTransaction(null);
        }}
        transaction={editingTransaction}
        onSubmit={handleTransactionSubmit}
        categories={categories}
      />
    </div>
  );
};

export default TransactionPage;
