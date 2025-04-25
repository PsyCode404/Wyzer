import { getPool } from '../config/db.js';
import jwt from 'jsonwebtoken';

// Get all transactions for a user with optional filtering
export async function getTransactions(req, res) {
  // For development, handle case when req.user is undefined
  const user_id = req.user?.user_id || 1; // Default to user_id 1 for development
  
  console.log('Fetching transactions for user_id:', user_id);
  
  try {
    const pool = getPool();
    
    // Build query with filters
    let query = `
      SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon, c.type as category_type
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.category_id
      WHERE t.user_id = ?
    `;
    
    const queryParams = [user_id];
    
    // Apply filters if provided
    if (req.query.startDate && req.query.endDate) {
      query += ' AND t.date BETWEEN ? AND ?';
      queryParams.push(req.query.startDate, req.query.endDate);
    }
    
    if (req.query.type) {
      query += ' AND t.type = ?';
      queryParams.push(req.query.type);
    }
    
    if (req.query.category_id) {
      query += ' AND t.category_id = ?';
      queryParams.push(req.query.category_id);
    }
    
    if (req.query.minAmount) {
      query += ' AND t.amount >= ?';
      queryParams.push(req.query.minAmount);
    }
    
    if (req.query.maxAmount) {
      query += ' AND t.amount <= ?';
      queryParams.push(req.query.maxAmount);
    }
    
    if (req.query.search) {
      query += ' AND (t.description LIKE ? OR t.notes LIKE ?)';
      const searchTerm = `%${req.query.search}%`;
      queryParams.push(searchTerm, searchTerm);
    }
    
    // Add sorting
    query += ' ORDER BY t.date DESC, t.created_at DESC';
    
    // Add pagination if requested
    if (req.query.limit) {
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;
      query += ' LIMIT ? OFFSET ?';
      queryParams.push(limit, offset);
    }
    
    const [transactions] = await pool.query(query, queryParams);
    
    // Get transaction count for pagination
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM transactions WHERE user_id = ?',
      [user_id]
    );
    
    res.status(200).json({
      transactions,
      total: countResult[0].total
    });
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({ message: 'Server error while fetching transactions.' });
  }
}

// Get a single transaction by ID
export async function getTransactionById(req, res) {
  // For development, handle case when req.user is undefined
  const user_id = req.user?.user_id || 1; // Default to user_id 1 for development
  const { id } = req.params;
  
  console.log(`Fetching transaction ID ${id} for user_id:`, user_id);
  
  try {
    const pool = getPool();
    
    const [transactions] = await pool.query(
      `SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon, c.type as category_type
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.category_id
       WHERE t.transaction_id = ? AND t.user_id = ?`,
      [id, user_id]
    );
    
    if (transactions.length === 0) {
      return res.status(404).json({ message: 'Transaction not found.' });
    }
    
    res.status(200).json(transactions[0]);
  } catch (err) {
    console.error('Error fetching transaction:', err);
    res.status(500).json({ message: 'Server error while fetching transaction.' });
  }
}

// Create a new transaction
export async function createTransaction(req, res) {
  // For development, handle case when req.user is undefined
  const user_id = req.user?.user_id || 1; // Default to user_id 1 for development
  const {
    amount,
    type,
    description,
    date,
    category_id,
    payment_method,
    status,
    notes,
    location,
    tags
  } = req.body;
  
  // Validate required fields
  if (!amount || !type || !date) {
    return res.status(400).json({ message: 'Amount, type, and date are required.' });
  }
  
  try {
    const pool = getPool();
    
    // Verify the category belongs to the user if provided
    if (category_id) {
      const [categories] = await pool.query(
        'SELECT category_id FROM categories WHERE category_id = ? AND (user_id = ? OR user_id IS NULL)',
        [category_id, user_id]
      );
      
      if (categories.length === 0) {
        return res.status(400).json({ message: 'Invalid category.' });
      }
    }
    
    // Insert the transaction
    const [result] = await pool.query(
      `INSERT INTO transactions 
       (user_id, category_id, amount, type, description, date, payment_method, status, notes, location, tags)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        category_id || null,
        amount,
        type,
        description || null,
        date,
        payment_method || null,
        status || 'cleared',
        notes || null,
        location || null,
        tags ? JSON.stringify(tags) : null
      ]
    );
    
    // Fetch the created transaction with category details
    const [transactions] = await pool.query(
      `SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon, c.type as category_type
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.category_id
       WHERE t.transaction_id = ?`,
      [result.insertId]
    );
    
    res.status(201).json({
      message: 'Transaction created successfully.',
      transaction: transactions[0]
    });
  } catch (err) {
    console.error('Error creating transaction:', err);
    res.status(500).json({ message: 'Server error while creating transaction.' });
  }
}

// Update an existing transaction
export async function updateTransaction(req, res) {
  // For development, handle case when req.user is undefined
  const user_id = req.user?.user_id || 1; // Default to user_id 1 for development
  const { id } = req.params;
  
  console.log(`Updating transaction ID ${id} for user_id:`, user_id);
  const {
    amount,
    type,
    description,
    date,
    category_id,
    payment_method,
    status,
    notes,
    location,
    tags
  } = req.body;
  
  try {
    const pool = getPool();
    
    // Check if transaction exists and belongs to user
    const [transactions] = await pool.query(
      'SELECT transaction_id FROM transactions WHERE transaction_id = ? AND user_id = ?',
      [id, user_id]
    );
    
    if (transactions.length === 0) {
      return res.status(404).json({ message: 'Transaction not found.' });
    }
    
    // Verify the category belongs to the user if provided
    if (category_id) {
      const [categories] = await pool.query(
        'SELECT category_id FROM categories WHERE category_id = ? AND (user_id = ? OR user_id IS NULL)',
        [category_id, user_id]
      );
      
      if (categories.length === 0) {
        return res.status(400).json({ message: 'Invalid category.' });
      }
    }
    
    // Update the transaction
    await pool.query(
      `UPDATE transactions SET
       amount = IFNULL(?, amount),
       type = IFNULL(?, type),
       description = IFNULL(?, description),
       date = IFNULL(?, date),
       category_id = ?,
       payment_method = IFNULL(?, payment_method),
       status = IFNULL(?, status),
       notes = IFNULL(?, notes),
       location = IFNULL(?, location),
       tags = ?,
       updated_at = CURRENT_TIMESTAMP
       WHERE transaction_id = ? AND user_id = ?`,
      [
        amount || null,
        type || null,
        description,
        date || null,
        category_id !== undefined ? category_id : null,
        payment_method,
        status || null,
        notes,
        location,
        tags ? JSON.stringify(tags) : null,
        id,
        user_id
      ]
    );
    
    // Fetch the updated transaction with category details
    const [updatedTransactions] = await pool.query(
      `SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon, c.type as category_type
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.category_id
       WHERE t.transaction_id = ?`,
      [id]
    );
    
    res.status(200).json({
      message: 'Transaction updated successfully.',
      transaction: updatedTransactions[0]
    });
  } catch (err) {
    console.error('Error updating transaction:', err);
    res.status(500).json({ message: 'Server error while updating transaction.' });
  }
}

// Delete a transaction
export async function deleteTransaction(req, res) {
  // For development, handle case when req.user is undefined
  const user_id = req.user?.user_id || 1; // Default to user_id 1 for development
  const { id } = req.params;
  
  console.log(`Deleting transaction ID ${id} for user_id:`, user_id);
  
  try {
    const pool = getPool();
    
    // Check if transaction exists and belongs to user
    const [transactions] = await pool.query(
      'SELECT transaction_id FROM transactions WHERE transaction_id = ? AND user_id = ?',
      [id, user_id]
    );
    
    if (transactions.length === 0) {
      return res.status(404).json({ message: 'Transaction not found.' });
    }
    
    // Delete the transaction
    await pool.query(
      'DELETE FROM transactions WHERE transaction_id = ? AND user_id = ?',
      [id, user_id]
    );
    
    res.status(200).json({ message: 'Transaction deleted successfully.' });
  } catch (err) {
    console.error('Error deleting transaction:', err);
    res.status(500).json({ message: 'Server error while deleting transaction.' });
  }
}

// Get transaction statistics and summaries
export async function getTransactionStats(req, res) {
  // For development, handle case when req.user is undefined
  const user_id = req.user?.user_id || 1; // Default to user_id 1 for development
  
  console.log('Fetching transaction stats for user_id:', user_id);
  const { startDate, endDate } = req.query;
  
  // Validate date range
  if (!startDate || !endDate) {
    return res.status(400).json({ message: 'Start date and end date are required.' });
  }
  
  try {
    const pool = getPool();
    
    // Get total income and expenses for the period
    const [totals] = await pool.query(
      `SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses
       FROM transactions
       WHERE user_id = ? AND date BETWEEN ? AND ?`,
      [user_id, startDate, endDate]
    );
    
    // Get category breakdown for expenses
    const [expensesByCategory] = await pool.query(
      `SELECT 
        c.category_id, c.name, c.color, c.icon,
        SUM(t.amount) as total,
        COUNT(t.transaction_id) as count
       FROM transactions t
       JOIN categories c ON t.category_id = c.category_id
       WHERE t.user_id = ? AND t.date BETWEEN ? AND ? AND t.type = 'expense'
       GROUP BY c.category_id
       ORDER BY total DESC`,
      [user_id, startDate, endDate]
    );
    
    // Get category breakdown for income
    const [incomeByCategory] = await pool.query(
      `SELECT 
        c.category_id, c.name, c.color, c.icon,
        SUM(t.amount) as total,
        COUNT(t.transaction_id) as count
       FROM transactions t
       JOIN categories c ON t.category_id = c.category_id
       WHERE t.user_id = ? AND t.date BETWEEN ? AND ? AND t.type = 'income'
       GROUP BY c.category_id
       ORDER BY total DESC`,
      [user_id, startDate, endDate]
    );
    
    // Get daily spending trend
    const [dailyTrend] = await pool.query(
      `SELECT 
        date,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
       FROM transactions
       WHERE user_id = ? AND date BETWEEN ? AND ?
       GROUP BY date
       ORDER BY date ASC`,
      [user_id, startDate, endDate]
    );
    
    // Calculate net savings and other metrics
    const totalIncome = totals[0].total_income || 0;
    const totalExpenses = totals[0].total_expenses || 0;
    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;
    
    res.status(200).json({
      summary: {
        totalIncome,
        totalExpenses,
        netSavings,
        savingsRate
      },
      expensesByCategory,
      incomeByCategory,
      dailyTrend
    });
  } catch (err) {
    console.error('Error fetching transaction statistics:', err);
    res.status(500).json({ message: 'Server error while fetching transaction statistics.' });
  }
}

// Bulk import transactions
export async function bulkImportTransactions(req, res) {
  // For development, handle case when req.user is undefined
  const user_id = req.user?.user_id || 1; // Default to user_id 1 for development
  const { transactions } = req.body;
  
  console.log(`Bulk importing ${transactions?.length || 0} transactions for user_id:`, user_id);
  
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return res.status(400).json({ message: 'No transactions provided for import.' });
  }
  
  try {
    const pool = getPool();
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const results = [];
      
      for (const transaction of transactions) {
        const {
          amount,
          type,
          description,
          date,
          category_id,
          payment_method,
          status,
          notes,
          location,
          tags
        } = transaction;
        
        // Validate required fields
        if (!amount || !type || !date) {
          throw new Error('Amount, type, and date are required for all transactions.');
        }
        
        // Insert the transaction
        const [result] = await connection.query(
          `INSERT INTO transactions 
           (user_id, category_id, amount, type, description, date, payment_method, status, notes, location, tags)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            user_id,
            category_id || null,
            amount,
            type,
            description || null,
            date,
            payment_method || null,
            status || 'cleared',
            notes || null,
            location || null,
            tags ? JSON.stringify(tags) : null
          ]
        );
        
        results.push({
          transaction_id: result.insertId,
          ...transaction
        });
      }
      
      await connection.commit();
      
      res.status(201).json({
        message: `Successfully imported ${results.length} transactions.`,
        transactions: results
      });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('Error importing transactions:', err);
    res.status(500).json({ message: `Server error while importing transactions: ${err.message}` });
  }
}
