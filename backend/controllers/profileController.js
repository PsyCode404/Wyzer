import { getPool } from '../config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

/**
 * Get user profile data
 */
export async function getUserProfile(req, res) {
  // For development, handle case when req.user is undefined
  let user_id;
  
  if (req.user) {
    user_id = req.user.user_id;
  } else {
    // Default to user_id 1 for development if not provided
    user_id = 1;
  }
  
  console.log('Getting profile for user_id:', user_id);
  
  try {
    const pool = getPool();
    
    // Join users and profiles tables to get all user data
    const [rows] = await pool.query(`
      SELECT 
        u.user_id,
        u.email,
        p.first_name,
        p.last_name,
        p.avatar_url,
        p.notification_preferences,
        p.currency_code
      FROM users u
      LEFT JOIN profiles p ON u.user_id = p.user_id
      WHERE u.user_id = ?
    `, [user_id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User profile not found.' });
    }
    
    // Format the response
    const profile = rows[0];
    let preferences = {};
    
    // Parse preferences if it exists and is a valid JSON string
    if (profile.notification_preferences) {
      try {
        preferences = JSON.parse(profile.notification_preferences);
      } catch (e) {
        console.error('Error parsing preferences JSON:', e);
      }
    }
    
    // Construct full name from first and last name
    const name = [profile.first_name, profile.last_name].filter(Boolean).join(' ');
    
    res.status(200).json({
      user_id: profile.user_id,
      email: profile.email,
      name,
      profilePicture: profile.avatar_url,
      currency: profile.currency_code || 'USD', // Default to USD if not set
      preferences
    });
    
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ message: 'Server error while fetching profile.' });
  }
}

/**
 * Update user profile data
 */
export async function updateUserProfile(req, res) {
  // For development, handle case when req.user is undefined
  let user_id;
  
  if (req.user) {
    user_id = req.user.user_id;
  } else {
    // Default to user_id 1 for development if not provided
    user_id = 1;
  }
  
  const { name, email, currency } = req.body;
  console.log('Updating profile for user_id:', user_id, { name, email, currency });
  
  try {
    const pool = getPool();
    
    // Start a transaction
    await pool.query('START TRANSACTION');
    
    // Update email in users table if provided
    if (email) {
      await pool.query('UPDATE users SET email = ? WHERE user_id = ?', [email, user_id]);
    }
    
    // Parse name into first and last name
    let firstName = null;
    let lastName = null;
    
    if (name) {
      const nameParts = name.trim().split(' ');
      firstName = nameParts[0];
      lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;
    }
    
    // Check if profile exists
    const [profiles] = await pool.query('SELECT * FROM profiles WHERE user_id = ?', [user_id]);
    
    if (profiles.length === 0) {
      // Create profile if it doesn't exist
      await pool.query(
        'INSERT INTO profiles (user_id, first_name, last_name, currency_code, date_format, theme_preference) VALUES (?, ?, ?, ?, ?, ?)',
        [user_id, firstName, lastName, currency, 'MM/DD/YYYY', 'light']
      );
    } else {
      // Update profile fields that are provided
      const updates = [];
      const params = [];
      
      if (firstName !== null) {
        updates.push('first_name = ?');
        params.push(firstName);
      }
      
      if (lastName !== null) {
        updates.push('last_name = ?');
        params.push(lastName);
      }
      
      if (currency) {
        updates.push('currency_code = ?');
        params.push(currency);
      }
      
      if (updates.length > 0) {
        params.push(user_id);
        await pool.query(
          `UPDATE profiles SET ${updates.join(', ')} WHERE user_id = ?`,
          params
        );
      }
    }
    
    // Commit the transaction
    await pool.query('COMMIT');
    
    // Get the updated profile
    const [updatedRows] = await pool.query(`
      SELECT 
        u.user_id,
        u.email,
        p.first_name,
        p.last_name,
        p.avatar_url,
        p.notification_preferences,
        p.currency_code
      FROM users u
      LEFT JOIN profiles p ON u.user_id = p.user_id
      WHERE u.user_id = ?
    `, [user_id]);
    
    if (updatedRows.length === 0) {
      return res.status(404).json({ message: 'User profile not found after update.' });
    }
    
    // Format the response
    const profile = updatedRows[0];
    const updatedName = [profile.first_name, profile.last_name].filter(Boolean).join(' ');
    
    res.status(200).json({
      message: 'Profile updated successfully.',
      user_id: profile.user_id,
      email: profile.email,
      name: updatedName,
      profilePicture: profile.avatar_url,
      currency: profile.currency_code || 'USD'
    });
    
  } catch (err) {
    console.error('Error updating user profile:', err);
    
    // Rollback transaction in case of error
    try {
      const pool = getPool();
      await pool.query('ROLLBACK');
    } catch (rollbackErr) {
      console.error('Error rolling back transaction:', rollbackErr);
    }
    
    res.status(500).json({ message: 'Server error while updating profile.' });
  }
}

/**
 * Update user currency preference
 */
export async function updateCurrencyPreference(req, res) {
  // For development, handle case when req.user is undefined
  let user_id;
  
  if (req.user) {
    user_id = req.user.user_id;
  } else {
    // Default to user_id 1 for development if not provided
    user_id = 1;
  }
  
  const { currency } = req.body;
  
  if (!currency) {
    return res.status(400).json({ message: 'Currency code is required.' });
  }
  
  console.log('Updating currency preference for user_id:', user_id, { currency });
  
  try {
    const pool = getPool();
    
    // Check if profile exists
    const [profiles] = await pool.query('SELECT * FROM profiles WHERE user_id = ?', [user_id]);
    
    if (profiles.length === 0) {
      // Create profile if it doesn't exist
      await pool.query(
        'INSERT INTO profiles (user_id, currency_code, date_format, theme_preference) VALUES (?, ?, ?, ?)',
        [user_id, currency, 'MM/DD/YYYY', 'light']
      );
    } else {
      // Update currency preference
      await pool.query(
        'UPDATE profiles SET currency_code = ? WHERE user_id = ?',
        [currency, user_id]
      );
    }
    
    res.status(200).json({
      message: 'Currency preference updated successfully.',
      currency
    });
    
  } catch (err) {
    console.error('Error updating currency preference:', err);
    res.status(500).json({ message: 'Server error while updating currency preference.' });
  }
}

/**
 * Upload profile picture
 */
export async function uploadProfilePicture(req, res) {
  // For development, handle case when req.user is undefined
  let user_id;
  
  if (req.user) {
    user_id = req.user.user_id;
  } else {
    // Default to user_id 1 for development if not provided
    user_id = 1;
  }
  
  console.log('Uploading profile picture for user_id:', user_id);
  
  try {
    // Check if we have base64 image data in the request body
    if (req.body && req.body.image) {
      const base64Data = req.body.image.split(';base64,').pop();
      
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(__dirname, '..', 'uploads', 'profiles');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      // Generate a unique filename
      const filename = `profile_${user_id}_${Date.now()}.png`;
      const filePath = path.join(uploadsDir, filename);
      
      // Write the file
      fs.writeFileSync(filePath, base64Data, { encoding: 'base64' });
      
      // Generate URL for the profile picture
      const profilePictureUrl = `/uploads/profiles/${filename}`;
      
      // Update the profile in the database
      const pool = getPool();
      await pool.query(
        'UPDATE profiles SET avatar_url = ? WHERE user_id = ?',
        [profilePictureUrl, user_id]
      );
      
      // If profile doesn't exist, create it
      const [profiles] = await pool.query('SELECT * FROM profiles WHERE user_id = ?', [user_id]);
      if (profiles.length === 0) {
        await pool.query(
          'INSERT INTO profiles (user_id, avatar_url, currency_code, date_format, theme_preference) VALUES (?, ?, ?, ?, ?)',
          [user_id, profilePictureUrl, 'USD', 'MM/DD/YYYY', 'light']
        );
      }
      
      res.status(200).json({
        message: 'Profile picture uploaded successfully.',
        profilePicture: profilePictureUrl
      });
    } else if (req.file) {
      // Handle file upload from multer middleware
      const profilePictureUrl = `/uploads/profiles/${req.file.filename}`;
      
      // Update the profile in the database
      const pool = getPool();
      await pool.query(
        'UPDATE profiles SET avatar_url = ? WHERE user_id = ?',
        [profilePictureUrl, user_id]
      );
      
      res.status(200).json({
        message: 'Profile picture uploaded successfully.',
        profilePicture: profilePictureUrl
      });
    } else {
      res.status(400).json({ message: 'No image data provided.' });
    }
  } catch (err) {
    console.error('Error uploading profile picture:', err);
    res.status(500).json({ message: 'Server error while uploading profile picture.' });
  }
}
