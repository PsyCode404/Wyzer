import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getPool } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET;

// Helper: validate email
function isValidEmail(email) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

// Helper: validate password strength (min 8 chars, at least one letter & number)
function isStrongPassword(password) {
  return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=]{8,}$/.test(password);
}

// User Registration
export async function registerUser(req, res) {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'Invalid email format.' });
  }
  if (!isStrongPassword(password)) {
    return res.status(400).json({ message: 'Password must be at least 8 characters and contain a letter and a number.' });
  }
  try {
    const pool = getPool();
    // Check if email already exists
    const [rows] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
    if (rows.length > 0) {
      return res.status(409).json({ message: 'Email is already registered.' });
    }
    // Hash password
    const hash = await bcrypt.hash(password, 10);
    // Insert user
    const [result] = await pool.query(
      'INSERT INTO users (email, password_hash, is_active, is_verified) VALUES (?, ?, ?, ?)',
      [email, hash, true, false]
    );
    // Optionally create profile (with name)
    await pool.query(
      'INSERT INTO profiles (user_id, first_name) VALUES (?, ?)',
      [result.insertId, name]
    );
    // Generate JWT
    const token = jwt.sign({ user_id: result.insertId, email }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ message: 'Registration successful!', token, redirect: '/onboarding' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error during registration.' });
  }
}

// User Login
export async function loginUser(req, res) {
  console.log('Login attempt received:', { email: req.body.email });
  
  const { email, password } = req.body;
  if (!email || !password) {
    console.log('Login rejected: Missing email or password');
    return res.status(400).json({ message: 'Email and password are required.' });
  }
  
  try {
    // Check if JWT_SECRET is properly set
    if (!JWT_SECRET) {
      console.error('JWT_SECRET is not defined in environment variables');
      return res.status(500).json({ message: 'Server configuration error.' });
    }
    
    console.log('Connecting to database pool...');
    const pool = getPool();
    
    console.log('Querying database for user:', email);
    const [rows] = await pool.query('SELECT user_id, email, password_hash FROM users WHERE email = ?', [email]);
    
    if (rows.length === 0) {
      console.log('Login failed: User not found:', email);
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    
    const user = rows[0];
    console.log('User found, verifying password...');
    
    try {
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        console.log('Login failed: Password mismatch for user:', email);
        return res.status(401).json({ message: 'Invalid email or password.' });
      }
      
      console.log('Password verified, generating JWT token...');
      // Generate JWT
      const token = jwt.sign(
        { user_id: user.user_id, email: user.email }, 
        JWT_SECRET, 
        { expiresIn: '7d' }
      );
      
      console.log('Login successful for user:', email);
      return res.status(200).json({ 
        message: 'Login successful!', 
        token, 
        user_id: user.user_id,
        email: user.email,
        redirect: '/onboarding' 
      });
    } catch (bcryptError) {
      console.error('Bcrypt comparison error:', bcryptError);
      return res.status(500).json({ message: 'Error verifying credentials.' });
    }
  } catch (err) {
    console.error('Login error details:', err);
    return res.status(500).json({ 
      message: 'Server error during login.', 
      error: err.message || 'Unknown error'
    });
  }
}
