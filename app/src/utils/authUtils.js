// Wyzer authentication utilities

/**
 * Logs out the user by removing authentication data from localStorage
 * and redirects to the sign-in page
 */
export function logout() {
  // Clear authentication data from localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('user_id');
  localStorage.removeItem('email');
  
  // Redirect to the sign-in page
  window.location.href = '/login';
}

/**
 * Checks if the user is currently logged in
 * @returns {boolean} True if the user is logged in, false otherwise
 */
export function isLoggedIn() {
  return !!localStorage.getItem('token');
}

/**
 * Gets the current user's ID from localStorage
 * @returns {string|null} The user ID or null if not logged in
 */
export function getCurrentUserId() {
  return localStorage.getItem('user_id');
}

/**
 * Gets the current user's email from localStorage
 * @returns {string|null} The user email or null if not logged in
 */
export function getCurrentUserEmail() {
  return localStorage.getItem('email');
}
