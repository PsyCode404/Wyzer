import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { categoryIcons } from '../utils/categoryIcons';

const colors = [
  { name: 'Red', value: 'red' },
  { name: 'Green', value: 'green' },
  { name: 'Blue', value: 'blue' },
  { name: 'Yellow', value: 'yellow' },
  { name: 'Purple', value: 'purple' },
  { name: 'Pink', value: 'pink' },
  { name: 'Indigo', value: 'indigo' },
  { name: 'Gray', value: 'gray' },
];

const CategoryForm = ({ isOpen, onClose, category, onSubmit }) => {
  const formik = useFormik({
    initialValues: {
      name: category?.name || '',
      color: category?.color || 'blue',
      icon: category?.icon || 'ChartPieIcon',
      description: category?.description || '',
      limit: category?.limit || '',
    },
    validationSchema: Yup.object({
      name: Yup.string().required('Category name is required'),
      color: Yup.string().required('Color is required'),
      icon: Yup.string().required('Icon is required'),
      description: Yup.string(),
      limit: Yup.number().min(0, 'Limit must be positive').nullable(),
    }),
    onSubmit: (values) => {
      onSubmit(values);
      onClose();
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-text">
            {category ? 'Edit Category' : 'New Category'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={formik.handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category Name
            </label>
            <input
              type="text"
              name="name"
              placeholder="e.g., Entertainment"
              className="w-full border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-primary focus:border-transparent"
              {...formik.getFieldProps('name')}
            />
            {formik.touched.name && formik.errors.name && (
              <div className="text-red-500 text-sm mt-1">{formik.errors.name}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <div className="grid grid-cols-4 gap-2">
              {colors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => formik.setFieldValue('color', color.value)}
                  className={`w-full aspect-square rounded-lg border-2 ${
                    formik.values.color === color.value
                      ? 'border-primary'
                      : 'border-transparent'
                  } bg-${color.value}-100 hover:bg-${color.value}-200 transition-colors`}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Icon
            </label>
            <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
              {Object.entries(categoryIcons).map(([name, Icon]) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => formik.setFieldValue('icon', name)}
                  className={`p-2 rounded-lg border ${
                    formik.values.icon === name
                      ? 'border-primary bg-primary bg-opacity-10'
                      : 'border-gray-200 hover:bg-gray-50'
                  } transition-colors`}
                >
                  <Icon className="h-6 w-6 mx-auto" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              name="description"
              rows="2"
              placeholder="Add a description for this category"
              className="w-full border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-primary focus:border-transparent"
              {...formik.getFieldProps('description')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monthly Limit (Optional)
            </label>
            <input
              type="number"
              name="limit"
              placeholder="Set a spending limit"
              className="w-full border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-primary focus:border-transparent"
              {...formik.getFieldProps('limit')}
            />
            {formik.touched.limit && formik.errors.limit && (
              <div className="text-red-500 text-sm mt-1">{formik.errors.limit}</div>
            )}
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
              {category ? 'Save Changes' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryForm;
