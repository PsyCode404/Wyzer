import React from 'react';
import { format, formatDistanceToNow } from 'date-fns';

const categoryColors = {
  Food: 'bg-green-100 text-green-800',
  Transport: 'bg-blue-100 text-blue-800',
  Rent: 'bg-purple-100 text-purple-800',
  'House Chores': 'bg-yellow-100 text-yellow-800',
  Subscriptions: 'bg-pink-100 text-pink-800',
  Custom: 'bg-gray-100 text-gray-800',
};

const TransactionList = ({ transactions, currency }) => {
  return (
    <div className="space-y-4">
      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className={`px-3 py-1 rounded-full ${categoryColors[transaction.category] || categoryColors.Custom}`}>
                {transaction.category}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-text">{transaction.description}</h3>
              <p className="text-xs text-gray-500" title={format(transaction.date, 'PPP')}>
                {formatDistanceToNow(transaction.date, { addSuffix: true })}
              </p>
            </div>
          </div>
          <div className={`text-sm font-medium ${transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
            {transaction.type === 'expense' ? '-' : '+'}{currency}{transaction.amount.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TransactionList;
