import React from 'react';
import { format, formatDistanceToNow, parseISO } from 'date-fns';

// Default category colors
const categoryColors = {
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
  Custom: 'bg-gray-100 text-gray-800',
};

const TransactionList = ({ transactions, currency = '$' }) => {
  // Helper function to safely format dates
  const formatDate = (dateValue) => {
    if (!dateValue) return 'Unknown date';
    
    try {
      // Handle both Date objects and ISO strings
      const date = dateValue instanceof Date ? dateValue : parseISO(dateValue);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };
  
  // Helper function to get full date format for tooltip
  const getFullDate = (dateValue) => {
    if (!dateValue) return 'Unknown date';
    
    try {
      // Handle both Date objects and ISO strings
      const date = dateValue instanceof Date ? dateValue : parseISO(dateValue);
      return format(date, 'PPP');
    } catch (error) {
      console.error('Error formatting full date:', error);
      return 'Invalid date';
    }
  };
  
  return (
    <div className="space-y-4">
      {transactions.map((transaction) => {
        // Extract transaction properties with fallbacks
        const id = transaction.id || transaction.transaction_id || Math.random().toString(36);
        const description = transaction.description || 'Unnamed transaction';
        const amount = transaction.amount || 0;
        const category = transaction.category || transaction.category_name || 'Other';
        const type = transaction.type || transaction.transaction_type || 'expense';
        const date = transaction.date || transaction.transaction_date || new Date();
        
        // Use custom color if provided, otherwise use category color map
        const colorClass = transaction.category_color ? 
          `bg-opacity-20 text-text` : 
          (categoryColors[category] || categoryColors.Custom);
        
        return (
          <div
            key={id}
            className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div 
                  className={`px-3 py-1 rounded-full ${colorClass}`}
                  style={transaction.category_color ? { backgroundColor: `${transaction.category_color}33`, color: transaction.category_color } : {}}
                >
                  {category}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-text">{description}</h3>
                <p className="text-xs text-gray-500" title={getFullDate(date)}>
                  {formatDate(date)}
                </p>
              </div>
            </div>
            <div className={`text-sm font-medium ${type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
              {type === 'expense' ? '-' : '+'}{currency}{amount.toLocaleString()}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TransactionList;
