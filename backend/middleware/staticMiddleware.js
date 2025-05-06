import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Middleware to serve static files from the uploads directory
 */
export function setupStaticMiddleware(app) {
  // Create a route to serve files from the uploads directory
  const uploadsPath = path.join(__dirname, '..', 'uploads');
  app.use('/uploads', express.static(uploadsPath));
  
  console.log(`Static file middleware configured to serve from: ${uploadsPath}`);
}
