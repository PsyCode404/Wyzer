import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowsUpDownIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import CategoryForm from '../components/CategoryForm';
import { categoryIcons } from '../utils/categoryIcons';

// Sample data - replace with real data from your backend
const defaultCategories = [
  {
    id: 1,
    name: 'Food & Dining',
    color: 'green',
    icon: 'ShoppingBagIcon',
    isDefault: true,
    description: 'Groceries, restaurants, and food delivery',
    transactionCount: 15,
    totalSpent: 450.75,
  },
  {
    id: 2,
    name: 'Transportation',
    color: 'blue',
    icon: 'TruckIcon',
    isDefault: true,
    description: 'Gas, public transit, and vehicle maintenance',
    transactionCount: 8,
    totalSpent: 225.50,
  },
  {
    id: 3,
    name: 'Entertainment',
    color: 'purple',
    icon: 'FilmIcon',
    isDefault: true,
    description: 'Movies, games, and hobbies',
    transactionCount: 5,
    totalSpent: 150.25,
  },
];

const customCategories = [
  {
    id: 4,
    name: 'Pet Expenses',
    color: 'pink',
    icon: 'HeartIcon',
    isDefault: false,
    description: 'Food and care for pets',
    transactionCount: 3,
    totalSpent: 85.99,
  },
  {
    id: 5,
    name: 'Gifts',
    color: 'red',
    icon: 'GiftIcon',
    isDefault: false,
    description: 'Presents and special occasions',
    transactionCount: 2,
    totalSpent: 120.00,
  },
];

const CategoriesPage = () => {
  const [categories, setCategories] = useState([...defaultCategories, ...customCategories]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(categories);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setCategories(items);
  };

  const handleSubmit = (values) => {
    if (editingCategory) {
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === editingCategory.id ? { ...cat, ...values } : cat
        )
      );
    } else {
      setCategories((prev) => [
        ...prev,
        {
          ...values,
          id: Math.max(...prev.map((cat) => cat.id)) + 1,
          isDefault: false,
          transactionCount: 0,
          totalSpent: 0,
        },
      ]);
    }
  };

  const handleDelete = (category) => {
    if (category.transactionCount > 0) {
      setShowDeleteConfirm(category);
    } else {
      setCategories((prev) => prev.filter((cat) => cat.id !== category.id));
    }
  };

  const confirmDelete = () => {
    setCategories((prev) => prev.filter((cat) => cat.id !== showDeleteConfirm.id));
    setShowDeleteConfirm(null);
  };

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const defaultCats = filteredCategories.filter((cat) => cat.isDefault);
  const customCats = filteredCategories.filter((cat) => !cat.isDefault);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-text mb-2">
              Category Management
            </h1>
            <p className="text-gray-500">
              Organize and customize your transaction categories
            </p>
          </div>
          <button
            onClick={() => {
              setEditingCategory(null);
              setIsModalOpen(true);
            }}
            className="flex items-center px-4 py-2 mt-4 md:mt-0 bg-primary text-text font-medium rounded-lg hover:bg-opacity-90 transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Category
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-96 pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          {/* Default Categories */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Default Categories</h2>
            <Droppable droppableId="defaultCategories">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2"
                >
                  {defaultCats.map((category, index) => {
                    const Icon = categoryIcons[category.icon];
                    return (
                      <Draggable
                        key={category.id}
                        draggableId={category.id.toString()}
                        index={index}
                        isDragDisabled={true}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="bg-white rounded-lg shadow-sm p-4"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div
                                  className={`p-2 rounded-lg bg-${category.color}-100`}
                                >
                                  <Icon className={`h-6 w-6 text-${category.color}-600`} />
                                </div>
                                <div>
                                  <h3 className="font-medium text-text">
                                    {category.name}
                                  </h3>
                                  <p className="text-sm text-gray-500">
                                    {category.description}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="text-right mr-4">
                                  <p className="text-sm text-gray-600">
                                    {category.transactionCount} transactions
                                  </p>
                                  <p className="text-sm font-medium text-text">
                                    ${category.totalSpent.toLocaleString()}
                                  </p>
                                </div>
                                <div {...provided.dragHandleProps}>
                                  <ArrowsUpDownIcon className="h-5 w-5 text-gray-400" />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>

          {/* Custom Categories */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Custom Categories</h2>
            {customCats.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <p className="text-gray-500">
                  You haven't created any custom categories yet
                </p>
              </div>
            ) : (
              <Droppable droppableId="customCategories">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-2"
                  >
                    {customCats.map((category, index) => {
                      const Icon = categoryIcons[category.icon];
                      return (
                        <Draggable
                          key={category.id}
                          draggableId={category.id.toString()}
                          index={index}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="bg-white rounded-lg shadow-sm p-4"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <div
                                    className={`p-2 rounded-lg bg-${category.color}-100`}
                                  >
                                    <Icon
                                      className={`h-6 w-6 text-${category.color}-600`}
                                    />
                                  </div>
                                  <div>
                                    <h3 className="font-medium text-text">
                                      {category.name}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                      {category.description}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="text-right mr-4">
                                    <p className="text-sm text-gray-600">
                                      {category.transactionCount} transactions
                                    </p>
                                    <p className="text-sm font-medium text-text">
                                      ${category.totalSpent.toLocaleString()}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => {
                                      setEditingCategory(category);
                                      setIsModalOpen(true);
                                    }}
                                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                  >
                                    <PencilSquareIcon className="h-5 w-5" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(category)}
                                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                  >
                                    <TrashIcon className="h-5 w-5" />
                                  </button>
                                  <div {...provided.dragHandleProps}>
                                    <ArrowsUpDownIcon className="h-5 w-5 text-gray-400" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            )}
          </div>
        </DragDropContext>
      </main>

      <CategoryForm
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCategory(null);
        }}
        category={editingCategory}
        onSubmit={handleSubmit}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-2">Delete Category?</h3>
            <p className="text-gray-600 mb-4">
              This category is used in {showDeleteConfirm.transactionCount}{' '}
              transactions. These transactions will be reassigned to the default
              "Uncategorized" category.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesPage;
