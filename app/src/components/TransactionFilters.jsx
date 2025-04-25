import React from 'react';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';

const categories = [
  { name: 'All', value: 'all' },
  { name: 'Food', value: 'food' },
  { name: 'Transport', value: 'transport' },
  { name: 'Rent', value: 'rent' },
  { name: 'House Chores', value: 'house' },
  { name: 'Subscriptions', value: 'subscriptions' },
  { name: 'Custom', value: 'custom' },
];

const dateRanges = [
  { name: 'All Time', value: 'all' },
  { name: 'Last 7 Days', value: '7days' },
  { name: 'This Month', value: 'month' },
  { name: 'Last Month', value: 'lastMonth' },
  { name: 'Custom Range', value: 'custom' },
];

const TransactionFilters = ({ filters, onFilterChange }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search transactions..."
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          value={filters.search}
          onChange={(e) => onFilterChange('search', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            className="w-full border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-primary focus:border-transparent"
            value={filters.category}
            onChange={(e) => onFilterChange('category', e.target.value)}
          >
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date Range
          </label>
          <select
            className="w-full border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-primary focus:border-transparent"
            value={filters.dateRange}
            onChange={(e) => onFilterChange('dateRange', e.target.value)}
          >
            {dateRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.name}
              </option>
            ))}
          </select>
        </div>

        {/* Amount Range Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount Range
          </label>
          <div className="flex space-x-2">
            <input
              type="number"
              placeholder="Min"
              className="w-1/2 border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-primary focus:border-transparent"
              value={filters.minAmount}
              onChange={(e) => onFilterChange('minAmount', e.target.value)}
            />
            <input
              type="number"
              placeholder="Max"
              className="w-1/2 border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-primary focus:border-transparent"
              value={filters.maxAmount}
              onChange={(e) => onFilterChange('maxAmount', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionFilters;
