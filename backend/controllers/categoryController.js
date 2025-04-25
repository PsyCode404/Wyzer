import { getPool } from '../config/db.js';

// Get all categories for a user (including system defaults)
export async function getCategories(req, res) {
  // For development, handle case when req.user is undefined
  const user_id = req.user?.user_id || 1; // Default to user_id 1 for development
  
  console.log('Fetching categories for user_id:', user_id);
  
  try {
    const pool = getPool();
    
    // Get both system default categories and user's custom categories
    const [categories] = await pool.query(
      `SELECT * FROM categories 
       WHERE user_id = ? OR user_id IS NULL
       ORDER BY is_default DESC, name ASC`,
      [user_id]
    );
    
    console.log(`Found ${categories.length} categories`);
    res.status(200).json(categories);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ message: 'Server error while fetching categories.' });
  }
}

// Get a single category by ID
export async function getCategoryById(req, res) {
  // For development, handle case when req.user is undefined
  const user_id = req.user?.user_id || 1; // Default to user_id 1 for development
  const { id } = req.params;
  
  console.log(`Fetching category ID ${id} for user_id:`, user_id);
  
  try {
    const pool = getPool();
    
    const [categories] = await pool.query(
      `SELECT * FROM categories 
       WHERE category_id = ? AND (user_id = ? OR user_id IS NULL)`,
      [id, user_id]
    );
    
    if (categories.length === 0) {
      return res.status(404).json({ message: 'Category not found.' });
    }
    
    console.log('Category found:', categories[0]);
    res.status(200).json(categories[0]);
  } catch (err) {
    console.error('Error fetching category:', err);
    res.status(500).json({ message: 'Server error while fetching category.' });
  }
}

// Create a new category
export async function createCategory(req, res) {
  // For development, handle case when req.user is undefined
  const user_id = req.user?.user_id || 1; // Default to user_id 1 for development
  const { name, type, color, icon } = req.body;
  
  console.log('Creating category for user_id:', user_id, 'with data:', { name, type, color, icon });
  
  // Validate required fields
  if (!name || !type) {
    return res.status(400).json({ message: 'Name and type are required.' });
  }
  
  try {
    const pool = getPool();
    
    // Check if a category with the same name already exists for this user
    const [existingCategories] = await pool.query(
      `SELECT * FROM categories 
       WHERE name = ? AND (user_id = ? OR user_id IS NULL)`,
      [name, user_id]
    );
    
    if (existingCategories.length > 0) {
      return res.status(409).json({ message: 'A category with this name already exists.' });
    }
    
    // Insert the new category
    const [result] = await pool.query(
      `INSERT INTO categories (user_id, name, type, color, icon)
       VALUES (?, ?, ?, ?, ?)`,
      [user_id, name, type, color || '#6366F1', icon || null]
    );
    
    // Fetch the created category
    const [categories] = await pool.query(
      'SELECT * FROM categories WHERE category_id = ?',
      [result.insertId]
    );
    
    res.status(201).json({
      message: 'Category created successfully.',
      category: categories[0]
    });
  } catch (err) {
    console.error('Error creating category:', err);
    res.status(500).json({ message: 'Server error while creating category.' });
  }
}

// Update an existing category
export async function updateCategory(req, res) {
  // For development, handle case when req.user is undefined
  const user_id = req.user?.user_id || 1; // Default to user_id 1 for development
  const { id } = req.params;
  const { name, type, color, icon } = req.body;
  
  console.log(`Updating category ID ${id} for user_id:`, user_id, 'with data:', { name, type, color, icon });
  
  try {
    const pool = getPool();
    
    // Check if category exists and belongs to user
    const [categories] = await pool.query(
      'SELECT * FROM categories WHERE category_id = ? AND user_id = ?',
      [id, user_id]
    );
    
    if (categories.length === 0) {
      return res.status(404).json({ 
        message: 'Category not found or you do not have permission to edit this category.' 
      });
    }
    
    // Check if a different category with the same name already exists
    if (name) {
      const [existingCategories] = await pool.query(
        `SELECT * FROM categories 
         WHERE name = ? AND user_id = ? AND category_id != ?`,
        [name, user_id, id]
      );
      
      if (existingCategories.length > 0) {
        return res.status(409).json({ message: 'A category with this name already exists.' });
      }
    }
    
    // Update the category
    await pool.query(
      `UPDATE categories SET
       name = IFNULL(?, name),
       type = IFNULL(?, type),
       color = IFNULL(?, color),
       icon = IFNULL(?, icon),
       updated_at = CURRENT_TIMESTAMP
       WHERE category_id = ? AND user_id = ?`,
      [name || null, type || null, color || null, icon || null, id, user_id]
    );
    
    // Fetch the updated category
    const [updatedCategories] = await pool.query(
      'SELECT * FROM categories WHERE category_id = ?',
      [id]
    );
    
    res.status(200).json({
      message: 'Category updated successfully.',
      category: updatedCategories[0]
    });
  } catch (err) {
    console.error('Error updating category:', err);
    res.status(500).json({ message: 'Server error while updating category.' });
  }
}

// Delete a category
export async function deleteCategory(req, res) {
  // For development, handle case when req.user is undefined
  const user_id = req.user?.user_id || 1; // Default to user_id 1 for development
  const { id } = req.params;
  
  console.log(`Deleting category ID ${id} for user_id:`, user_id);
  
  try {
    const pool = getPool();
    
    // Check if category exists and belongs to user
    const [categories] = await pool.query(
      'SELECT * FROM categories WHERE category_id = ? AND user_id = ?',
      [id, user_id]
    );
    
    if (categories.length === 0) {
      return res.status(404).json({ 
        message: 'Category not found or you do not have permission to delete this category.' 
      });
    }
    
    // Check if the category is used in any transactions
    const [transactions] = await pool.query(
      'SELECT COUNT(*) as count FROM transactions WHERE category_id = ?',
      [id]
    );
    
    if (transactions[0].count > 0) {
      return res.status(409).json({ 
        message: 'This category is used in transactions and cannot be deleted. Update the transactions first.' 
      });
    }
    
    // Delete the category
    await pool.query(
      'DELETE FROM categories WHERE category_id = ? AND user_id = ?',
      [id, user_id]
    );
    
    res.status(200).json({ message: 'Category deleted successfully.' });
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).json({ message: 'Server error while deleting category.' });
  }
}

// Create default categories for a new user
export async function createDefaultCategories(user_id) {
  try {
    const pool = getPool();
    
    // Define default expense categories
    const defaultExpenseCategories = [
      { name: 'Food & Dining', type: 'expense', color: '#EF4444', icon: '🍽️' },
      { name: 'Housing', type: 'expense', color: '#3B82F6', icon: '🏠' },
      { name: 'Transportation', type: 'expense', color: '#10B981', icon: '🚗' },
      { name: 'Utilities', type: 'expense', color: '#F59E0B', icon: '💡' },
      { name: 'Entertainment', type: 'expense', color: '#8B5CF6', icon: '🎬' },
      { name: 'Shopping', type: 'expense', color: '#EC4899', icon: '🛍️' },
      { name: 'Health', type: 'expense', color: '#06B6D4', icon: '⚕️' },
      { name: 'Education', type: 'expense', color: '#6366F1', icon: '📚' }
    ];
    
    // Define default income categories
    const defaultIncomeCategories = [
      { name: 'Salary', type: 'income', color: '#10B981', icon: '💰' },
      { name: 'Investments', type: 'income', color: '#3B82F6', icon: '📈' },
      { name: 'Gifts', type: 'income', color: '#8B5CF6', icon: '🎁' },
      { name: 'Other Income', type: 'income', color: '#F59E0B', icon: '💵' }
    ];
    
    // Combine all default categories
    const defaultCategories = [...defaultExpenseCategories, ...defaultIncomeCategories];
    
    // Insert default categories for the user
    for (const category of defaultCategories) {
      await pool.query(
        `INSERT INTO categories (user_id, name, type, color, icon, is_default)
         VALUES (?, ?, ?, ?, ?, TRUE)`,
        [user_id, category.name, category.type, category.color, category.icon]
      );
    }
    
    return true;
  } catch (err) {
    console.error('Error creating default categories:', err);
    return false;
  }
}
