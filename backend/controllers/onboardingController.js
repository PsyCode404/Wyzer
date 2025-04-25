import { getPool } from '../config/db.js';
import jwt from 'jsonwebtoken';

// Save user onboarding preferences
export async function saveOnboardingPreferences(req, res) {
  // Extract user ID from JWT token
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }
  
  try {
    // Verify token and extract user_id
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user_id = decoded.user_id;
    
    // Extract onboarding data from request body
    const { name, currency, categories } = req.body;
    
    if (!name || !currency) {
      return res.status(400).json({ message: 'Name and currency are required.' });
    }
    
    const pool = getPool();
    
    // Update user profile with onboarding preferences
    await pool.query(
      'UPDATE profiles SET first_name = ?, currency_code = ?, onboarding_completed = ? WHERE user_id = ?',
      [name, currency.code, true, user_id]
    );
    
    // Save selected categories
    if (Array.isArray(categories) && categories.length > 0) {
      // First, check if these are default categories or custom ones
      for (const category of categories) {
        // Check if this is a default category that needs to be associated with the user
        const [existingCategory] = await pool.query(
          'SELECT category_id FROM categories WHERE name = ? AND (user_id IS NULL OR user_id = ?)',
          [category.name, user_id]
        );
        
        if (existingCategory.length > 0) {
          // Category exists, just associate it with the user if it's a default category
          if (existingCategory[0].user_id === null) {
            await pool.query(
              'INSERT INTO user_categories (user_id, category_id) VALUES (?, ?)',
              [user_id, existingCategory[0].category_id]
            );
          }
        } else {
          // Create new custom category for the user
          await pool.query(
            'INSERT INTO categories (user_id, name, type, color, icon) VALUES (?, ?, ?, ?, ?)',
            [user_id, category.name, category.type || 'expense', category.color || '#6366F1', category.icon || '']
          );
        }
      }
    }
    
    res.status(200).json({ 
      message: 'Onboarding preferences saved successfully!',
      redirect: '/dashboard'
    });
  } catch (err) {
    console.error('Onboarding error:', err);
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token.' });
    }
    res.status(500).json({ message: 'Server error during onboarding.' });
  }
}
