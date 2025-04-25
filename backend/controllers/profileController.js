import { getPool } from '../config/db.js';

// Save additional profile data after registration step 2
export async function completeProfile(req, res) {
  // For development, handle case when req.user is undefined
  let { user_id, preferences, categories } = req.body;
  
  // If user_id is not in the body, try to get it from req.user
  if (!user_id && req.user) {
    user_id = req.user.user_id;
  } else if (!user_id) {
    // Default to user_id 1 for development if not provided
    user_id = 1;
  }
  
  console.log('Completing profile for user_id:', user_id);
  try {
    const pool = getPool();
    // Example: save preferences (customize as needed)
    if (preferences) {
      await pool.query('UPDATE profiles SET preferences = ? WHERE user_id = ?', [JSON.stringify(preferences), user_id]);
    }
    // Example: save categories (customize as needed)
    if (Array.isArray(categories) && categories.length > 0) {
      for (const cat of categories) {
        await pool.query(
          'INSERT INTO categories (user_id, name, type) VALUES (?, ?, ?)',
          [user_id, cat.name, cat.type]
        );
      }
    }
    res.status(200).json({ message: 'Profile completed.', redirect: '/onboarding' });
  } catch (err) {
    console.error('Profile completion error:', err);
    res.status(500).json({ message: 'Server error during profile completion.' });
  }
}
