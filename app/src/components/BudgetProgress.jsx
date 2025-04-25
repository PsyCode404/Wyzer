import React from 'react';

const BudgetProgress = ({ spent, total, currency }) => {
  const percentage = Math.min((spent / total) * 100, 100);
  const remaining = total - spent;

  return (
    <div className="w-full">
      <div className="flex justify-between mb-2">
        <span className="text-sm text-text">Monthly Budget</span>
        <span className="text-sm font-medium text-text">
          {currency}{remaining.toLocaleString()} remaining
        </span>
      </div>
      <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between mt-2 text-sm text-gray-600">
        <span>{currency}{spent.toLocaleString()} spent</span>
        <span>{currency}{total.toLocaleString()} total</span>
      </div>
    </div>
  );
};

export default BudgetProgress;
