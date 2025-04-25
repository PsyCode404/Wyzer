import { getPool } from '../config/db.js';

// Get all recurring transactions for a user
export async function getRecurringTransactions(req, res) {
  // For development, handle case when req.user is undefined
  const user_id = req.user?.user_id || 1; // Default to user_id 1 for development
  
  console.log('Fetching recurring transactions for user_id:', user_id);
  
  try {
    const pool = getPool();
    
    // Get recurring transactions with category details
    const [transactions] = await pool.query(
      `SELECT rt.*, c.name as category_name, c.color as category_color, c.icon as category_icon, c.type as category_type
       FROM recurring_transactions rt
       LEFT JOIN categories c ON rt.category_id = c.category_id
       WHERE rt.user_id = ?
       ORDER BY rt.next_date ASC`,
      [user_id]
    );
    
    // Format the transactions for the frontend
    const formattedTransactions = transactions.map(transaction => ({
      id: transaction.recurring_id,
      name: transaction.description,
      amount: parseFloat(transaction.amount),
      category: transaction.category_id,
      category_name: transaction.category_name || 'Uncategorized',
      category_color: transaction.category_color,
      frequency: transaction.frequency,
      startDate: formatDate(new Date(transaction.start_date)),
      endDate: transaction.end_date ? formatDate(new Date(transaction.end_date)) : null,
      nextDate: formatDate(new Date(transaction.next_date)),
      type: transaction.type,
      payment_method: transaction.payment_method,
      notes: transaction.notes,
      isActive: transaction.is_active === 1
    }));
    
    res.status(200).json(formattedTransactions);
  } catch (err) {
    console.error('Error fetching recurring transactions:', err);
    res.status(500).json({ message: 'Server error while fetching recurring transactions.' });
  }
}

// Get a single recurring transaction by ID
export async function getRecurringTransactionById(req, res) {
  // For development, handle case when req.user is undefined
  const user_id = req.user?.user_id || 1; // Default to user_id 1 for development
  const { id } = req.params;
  
  console.log(`Fetching recurring transaction ID ${id} for user_id:`, user_id);
  
  try {
    const pool = getPool();
    
    const [transactions] = await pool.query(
      `SELECT rt.*, c.name as category_name, c.color as category_color, c.icon as category_icon, c.type as category_type
       FROM recurring_transactions rt
       LEFT JOIN categories c ON rt.category_id = c.category_id
       WHERE rt.recurring_id = ? AND rt.user_id = ?`,
      [id, user_id]
    );
    
    if (transactions.length === 0) {
      return res.status(404).json({ message: 'Recurring transaction not found.' });
    }
    
    const transaction = transactions[0];
    
    // Format the transaction for the frontend
    const formattedTransaction = {
      id: transaction.recurring_id,
      name: transaction.description,
      amount: parseFloat(transaction.amount),
      category: transaction.category_id,
      category_name: transaction.category_name || 'Uncategorized',
      category_color: transaction.category_color,
      frequency: transaction.frequency,
      startDate: formatDate(new Date(transaction.start_date)),
      endDate: transaction.end_date ? formatDate(new Date(transaction.end_date)) : null,
      nextDate: formatDate(new Date(transaction.next_date)),
      type: transaction.type,
      payment_method: transaction.payment_method,
      notes: transaction.notes,
      isActive: transaction.is_active === 1
    };
    
    res.status(200).json(formattedTransaction);
  } catch (err) {
    console.error('Error fetching recurring transaction:', err);
    res.status(500).json({ message: 'Server error while fetching recurring transaction.' });
  }
}

// Helper function to format dates as yyyy-MM-dd
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Calculate the next occurrence date based on frequency
function calculateNextDate(startDate, frequency) {
  const date = new Date(startDate);
  
  switch (frequency) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      return date;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      return date;
    case 'biweekly':
      date.setDate(date.getDate() + 14);
      return date;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      return date;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      return date;
    case 'annually':
      date.setFullYear(date.getFullYear() + 1);
      return date;
    default:
      return date;
  }
}

// Create a new recurring transaction
export async function createRecurringTransaction(req, res) {
  // For development, handle case when req.user is undefined
  const user_id = req.user?.user_id || 1; // Default to user_id 1 for development
  
  console.log('Creating recurring transaction for user_id:', user_id);
  const {
    name,
    amount,
    category,
    frequency,
    startDate,
    endDate,
    type,
    payment_method,
    notes,
    isActive
  } = req.body;
  
  // Validate required fields
  if (!name || !amount || !frequency || !startDate || !type) {
    return res.status(400).json({ 
      message: 'Name, amount, frequency, start date, and type are required.' 
    });
  }
  
  try {
    const pool = getPool();
    
    // Calculate the next occurrence date
    const nextDate = calculateNextDate(startDate, frequency);
    
    // Insert the recurring transaction
    const [result] = await pool.query(
      `INSERT INTO recurring_transactions 
       (user_id, category_id, amount, type, description, frequency, start_date, end_date, next_date, payment_method, notes, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        category || null,
        amount,
        type,
        name,
        frequency,
        startDate,
        endDate || null,
        formatDate(nextDate),
        payment_method || null,
        notes || null,
        isActive === false ? 0 : 1
      ]
    );
    
    // Fetch the created transaction with category details
    const [transactions] = await pool.query(
      `SELECT rt.*, c.name as category_name, c.color as category_color, c.icon as category_icon, c.type as category_type
       FROM recurring_transactions rt
       LEFT JOIN categories c ON rt.category_id = c.category_id
       WHERE rt.recurring_id = ?`,
      [result.insertId]
    );
    
    if (transactions.length === 0) {
      return res.status(500).json({ message: 'Error retrieving created transaction.' });
    }
    
    const transaction = transactions[0];
    
    // Format the transaction for the frontend
    const formattedTransaction = {
      id: transaction.recurring_id,
      name: transaction.description,
      amount: parseFloat(transaction.amount),
      category: transaction.category_id,
      category_name: transaction.category_name || 'Uncategorized',
      category_color: transaction.category_color,
      frequency: transaction.frequency,
      startDate: formatDate(new Date(transaction.start_date)),
      endDate: transaction.end_date ? formatDate(new Date(transaction.end_date)) : null,
      nextDate: formatDate(new Date(transaction.next_date)),
      type: transaction.type,
      payment_method: transaction.payment_method,
      notes: transaction.notes,
      isActive: transaction.is_active === 1
    };
    
    res.status(201).json({
      message: 'Recurring transaction created successfully.',
      transaction: formattedTransaction
    });
  } catch (err) {
    console.error('Error creating recurring transaction:', err);
    res.status(500).json({ message: 'Server error while creating recurring transaction.' });
  }
}

// Update an existing recurring transaction
export async function updateRecurringTransaction(req, res) {
  // For development, handle case when req.user is undefined
  const user_id = req.user?.user_id || 1; // Default to user_id 1 for development
  const { id } = req.params;
  
  console.log(`Updating recurring transaction ID ${id} for user_id:`, user_id);
  const {
    name,
    amount,
    category,
    frequency,
    startDate,
    endDate,
    type,
    payment_method,
    notes,
    isActive
  } = req.body;
  
  try {
    const pool = getPool();
    
    // Check if transaction exists and belongs to user
    const [transactions] = await pool.query(
      'SELECT * FROM recurring_transactions WHERE recurring_id = ? AND user_id = ?',
      [id, user_id]
    );
    
    if (transactions.length === 0) {
      return res.status(404).json({ message: 'Recurring transaction not found.' });
    }
    
    // Calculate the next occurrence date if frequency or start date changed
    let nextDate = transactions[0].next_date;
    if (frequency !== transactions[0].frequency || startDate !== format(new Date(transactions[0].start_date), 'yyyy-MM-dd')) {
      nextDate = format(calculateNextDate(startDate || transactions[0].start_date, frequency || transactions[0].frequency), 'yyyy-MM-dd');
    }
    
    // Update the transaction
    await pool.query(
      `UPDATE recurring_transactions SET
       description = IFNULL(?, description),
       amount = IFNULL(?, amount),
       category_id = ?,
       frequency = IFNULL(?, frequency),
       start_date = IFNULL(?, start_date),
       end_date = ?,
       next_date = ?,
       type = IFNULL(?, type),
       payment_method = ?,
       notes = ?,
       is_active = IFNULL(?, is_active),
       updated_at = CURRENT_TIMESTAMP
       WHERE recurring_id = ? AND user_id = ?`,
      [
        name || null,
        amount || null,
        category !== undefined ? category : null,
        frequency || null,
        startDate || null,
        endDate || null,
        nextDate,
        type || null,
        payment_method,
        notes,
        isActive !== undefined ? (isActive ? 1 : 0) : null,
        id,
        user_id
      ]
    );
    
    // Fetch the updated transaction with category details
    const [updatedTransactions] = await pool.query(
      `SELECT rt.*, c.name as category_name, c.color as category_color, c.icon as category_icon, c.type as category_type
       FROM recurring_transactions rt
       LEFT JOIN categories c ON rt.category_id = c.category_id
       WHERE rt.recurring_id = ?`,
      [id]
    );
    
    if (updatedTransactions.length === 0) {
      return res.status(500).json({ message: 'Error retrieving updated transaction.' });
    }
    
    const transaction = updatedTransactions[0];
    
    // Format the transaction for the frontend
    const formattedTransaction = {
      id: transaction.recurring_id,
      name: transaction.description,
      amount: parseFloat(transaction.amount),
      category: transaction.category_id,
      category_name: transaction.category_name || 'Uncategorized',
      category_color: transaction.category_color,
      frequency: transaction.frequency,
      startDate: formatDate(new Date(transaction.start_date)),
      endDate: transaction.end_date ? formatDate(new Date(transaction.end_date)) : null,
      nextDate: formatDate(new Date(transaction.next_date)),
      type: transaction.type,
      payment_method: transaction.payment_method,
      notes: transaction.notes,
      isActive: transaction.is_active === 1
    };
    
    res.status(200).json({
      message: 'Recurring transaction updated successfully.',
      transaction: formattedTransaction
    });
  } catch (err) {
    console.error('Error updating recurring transaction:', err);
    res.status(500).json({ message: 'Server error while updating recurring transaction.' });
  }
}

// Toggle the active status of a recurring transaction
export async function toggleRecurringTransactionStatus(req, res) {
  // For development, handle case when req.user is undefined
  const user_id = req.user?.user_id || 1; // Default to user_id 1 for development
  const { id } = req.params;
  
  console.log(`Toggling status of recurring transaction ID ${id} for user_id:`, user_id);
  const { isActive } = req.body;
  
  if (isActive === undefined) {
    return res.status(400).json({ message: 'Active status is required.' });
  }
  
  try {
    const pool = getPool();
    
    // Check if transaction exists and belongs to user
    const [transactions] = await pool.query(
      'SELECT * FROM recurring_transactions WHERE recurring_id = ? AND user_id = ?',
      [id, user_id]
    );
    
    if (transactions.length === 0) {
      return res.status(404).json({ message: 'Recurring transaction not found.' });
    }
    
    // Update the active status
    await pool.query(
      'UPDATE recurring_transactions SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE recurring_id = ? AND user_id = ?',
      [isActive ? 1 : 0, id, user_id]
    );
    
    res.status(200).json({
      message: `Recurring transaction ${isActive ? 'activated' : 'paused'} successfully.`,
      id,
      isActive
    });
  } catch (err) {
    console.error('Error toggling recurring transaction status:', err);
    res.status(500).json({ message: 'Server error while toggling recurring transaction status.' });
  }
}

// Delete a recurring transaction
export async function deleteRecurringTransaction(req, res) {
  // For development, handle case when req.user is undefined
  const user_id = req.user?.user_id || 1; // Default to user_id 1 for development
  const { id } = req.params;
  
  console.log(`Deleting recurring transaction ID ${id} for user_id:`, user_id);
  
  try {
    const pool = getPool();
    
    // Check if transaction exists and belongs to user
    const [transactions] = await pool.query(
      'SELECT * FROM recurring_transactions WHERE recurring_id = ? AND user_id = ?',
      [id, user_id]
    );
    
    if (transactions.length === 0) {
      return res.status(404).json({ message: 'Recurring transaction not found.' });
    }
    
    // Delete the transaction
    await pool.query(
      'DELETE FROM recurring_transactions WHERE recurring_id = ? AND user_id = ?',
      [id, user_id]
    );
    
    res.status(200).json({ 
      message: 'Recurring transaction deleted successfully.',
      id
    });
  } catch (err) {
    console.error('Error deleting recurring transaction:', err);
    res.status(500).json({ message: 'Server error while deleting recurring transaction.' });
  }
}
