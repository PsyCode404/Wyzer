import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { XMarkIcon } from '@heroicons/react/24/outline';

const frequencies = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
];

const categories = [
  { label: 'Food', value: 'food' },
  { label: 'Transport', value: 'transport' },
  { label: 'Rent', value: 'rent' },
  { label: 'Utilities', value: 'utilities' },
  { label: 'Entertainment', value: 'entertainment' },
  { label: 'Subscriptions', value: 'subscriptions' },
  { label: 'Income', value: 'income' },
];

const RecurringTransactionForm = ({ isOpen, onClose, transaction, onSubmit }) => {
  const formik = useFormik({
    initialValues: {
      name: transaction?.name || '',
      amount: transaction?.amount || '',
      category: transaction?.category || '',
      frequency: transaction?.frequency || 'monthly',
      startDate: transaction?.startDate || new Date().toISOString().split('T')[0],
      endDate: transaction?.endDate || '',
      type: transaction?.type || 'expense',
      notifications: transaction?.notifications || true,
      description: transaction?.description || '',
    },
    validationSchema: Yup.object({
      name: Yup.string().required('Name is required'),
      amount: Yup.number().required('Amount is required').positive('Amount must be positive'),
      category: Yup.string().required('Category is required'),
      frequency: Yup.string().required('Frequency is required'),
      startDate: Yup.date().required('Start date is required'),
      endDate: Yup.date().min(
        Yup.ref('startDate'),
        'End date must be after start date'
      ).nullable(),
      type: Yup.string().oneOf(['income', 'expense']).required(),
      notifications: Yup.boolean(),
      description: Yup.string(),
    }),
    onSubmit: (values) => {
      onSubmit(values);
      onClose();
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-text">
            {transaction ? 'Edit Recurring Transaction' : 'New Recurring Transaction'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={formik.handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transaction Name
              </label>
              <input
                type="text"
                name="name"
                className="w-full border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                {...formik.getFieldProps('name')}
              />
              {formik.touched.name && formik.errors.name && (
                <div className="text-red-500 text-sm mt-1">{formik.errors.name}</div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount
              </label>
              <input
                type="number"
                name="amount"
                step="0.01"
                className="w-full border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                {...formik.getFieldProps('amount')}
              />
              {formik.touched.amount && formik.errors.amount && (
                <div className="text-red-500 text-sm mt-1">{formik.errors.amount}</div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                name="category"
                className="w-full border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                {...formik.getFieldProps('category')}
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
              {formik.touched.category && formik.errors.category && (
                <div className="text-red-500 text-sm mt-1">{formik.errors.category}</div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frequency
              </label>
              <select
                name="frequency"
                className="w-full border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                {...formik.getFieldProps('frequency')}
              >
                {frequencies.map((frequency) => (
                  <option key={frequency.value} value={frequency.value}>
                    {frequency.label}
                  </option>
                ))}
              </select>
              {formik.touched.frequency && formik.errors.frequency && (
                <div className="text-red-500 text-sm mt-1">{formik.errors.frequency}</div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                className="w-full border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                {...formik.getFieldProps('startDate')}
              />
              {formik.touched.startDate && formik.errors.startDate && (
                <div className="text-red-500 text-sm mt-1">{formik.errors.startDate}</div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date (Optional)
              </label>
              <input
                type="date"
                name="endDate"
                className="w-full border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                {...formik.getFieldProps('endDate')}
              />
              {formik.touched.endDate && formik.errors.endDate && (
                <div className="text-red-500 text-sm mt-1">{formik.errors.endDate}</div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="expense"
                    checked={formik.values.type === 'expense'}
                    onChange={formik.handleChange}
                    className="mr-2"
                  />
                  Expense
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="income"
                    checked={formik.values.type === 'income'}
                    onChange={formik.handleChange}
                    className="mr-2"
                  />
                  Income
                </label>
              </div>
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="notifications"
                  checked={formik.values.notifications}
                  onChange={formik.handleChange}
                  className="form-checkbox h-4 w-4 text-primary rounded"
                />
                <span className="text-sm text-gray-700">
                  Notify me before each transaction
                </span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              name="description"
              rows="3"
              className="w-full border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-primary focus:border-transparent"
              {...formik.getFieldProps('description')}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-text font-medium rounded-lg hover:bg-opacity-90 transition-colors"
            >
              {transaction ? 'Save Changes' : 'Create Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecurringTransactionForm;
