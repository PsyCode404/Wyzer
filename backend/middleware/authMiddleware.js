import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

export function authenticateToken(req, res, next) {
  console.log('Auth middleware called, checking token...');
  
  // Check if JWT_SECRET is properly set
  if (!JWT_SECRET) {
    console.error('JWT_SECRET is not defined in environment variables');
    return res.status(500).json({ message: 'Server configuration error.' });
  }
  
  // Get token from various possible sources
  let token;
  
  // 1. Check Authorization header
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
    console.log('Token found in Authorization header');
  }
  
  // 2. Check query parameter (not recommended for production)
  if (!token && req.query && req.query.token) {
    token = req.query.token;
    console.log('Token found in query parameter');
  }
  
  // 3. Check for token in cookies
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
    console.log('Token found in cookies');
  }
  
  // If no token found in any location
  if (!token) {
    console.log('No authentication token found');
    return res.status(401).json({ 
      message: 'Access denied. No authentication token provided.',
      details: 'Please login to access this resource.'
    });
  }
  
  // Verify the token
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Token verified successfully for user:', decoded.email);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    return res.status(403).json({ 
      message: 'Invalid or expired token.', 
      details: err.message
    });
  }
}
