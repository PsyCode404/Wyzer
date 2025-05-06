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

// Get category summary for spending breakdown chart
export async function getCategorySummary(req, res) {
  // For development, handle case when req.user is undefined
  const user_id = req.user?.user_id || 1; // Default to user_id 1 for development
  
  // Get date range from query params or use current month as default
  const today = new Date();
  const startDate = req.query.startDate || new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const endDate = req.query.endDate || today.toISOString().split('T')[0];
  
  console.log(`Fetching category summary for user_id: ${user_id}, date range: ${startDate} to ${endDate}`);
  
  try {
    const pool = getPool();
    
    // Get spending by category
    const query = `
      SELECT 
        c.category_id,
        c.name,
        c.color,
        c.icon,
        SUM(t.amount) as total
      FROM transactions t
      JOIN categories c ON t.category_id = c.category_id
      WHERE t.user_id = ? 
        AND t.date BETWEEN ? AND ? 
        AND t.type = 'expense'
      GROUP BY c.category_id
      ORDER BY total DESC
    `;
    
    console.log('Executing category summary query:', query);
    console.log('Query params:', [user_id, startDate, endDate]);
    
    const [categories] = await pool.query(query, [user_id, startDate, endDate]);
    console.log(`Found ${categories.length} categories with spending`);
    
    // Get total spending
    const [totalResult] = await pool.query(
      'SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND date BETWEEN ? AND ? AND type = "expense"',
      [user_id, startDate, endDate]
    );
    
    const totalSpending = totalResult[0].total || 0;
    console.log(`Total spending: ${totalSpending}`);
    
    // If no categories found, try to get all available categories for the user
    let categoriesWithPercentage = [];
    if (categories.length === 0) {
      console.log('No spending found, fetching all available categories');
      const [allCategories] = await pool.query(
        `SELECT category_id, name, color, icon FROM categories WHERE user_id = ? OR user_id IS NULL`,
        [user_id]
      );
      
      categoriesWithPercentage = allCategories.map(category => ({
        ...category,
        total: 0,
        percentage: 0
      }));
    } else {
      // Calculate percentage for each category
      categoriesWithPercentage = categories.map(category => ({
        ...category,
        percentage: totalSpending > 0 ? Math.round((category.total / totalSpending) * 100) : 0
      }));
    }
    
    const response = {
      categories: categoriesWithPercentage,
      totalSpending,
      startDate,
      endDate
    };
    
    console.log('Sending category summary response');
    res.status(200).json(response);
  } catch (err) {
    console.error('Error fetching category summary:', err);
    res.status(500).json({ message: 'Server error while fetching category summary.' });
  }
}

// Export transactions to CSV
export async function exportTransactions(req, res) {
  // For development, handle case when req.user is undefined
  const user_id = req.user?.user_id || 1; // Default to user_id 1 for development
  
  // Get filters from query params
  const { startDate, endDate, type, category_id } = req.query;
  
  console.log(`Exporting transactions for user_id: ${user_id}`);
  console.log('Export filters:', { startDate, endDate, type, category_id });
  
  try {
    const pool = getPool();
    
    // Build query with filters
    let query = `
      SELECT 
        t.transaction_id,
        t.date,
        t.description,
        t.amount,
        t.type,
        c.name as category,
        t.payment_method,
        t.status,
        t.notes,
        t.location,
        t.tags,
        t.created_at
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.category_id
      WHERE t.user_id = ?
    `;
    
    const queryParams = [user_id];
    
    // Apply filters if provided
    if (startDate && endDate) {
      query += ' AND t.date BETWEEN ? AND ?';
      queryParams.push(startDate, endDate);
    }
    
    if (type) {
      query += ' AND t.type = ?';
      queryParams.push(type);
    }
    
    if (category_id) {
      query += ' AND t.category_id = ?';
      queryParams.push(category_id);
    }
    
    // Add sorting
    query += ' ORDER BY t.date DESC, t.created_at DESC';
    
    console.log('Export query:', query);
    console.log('Query params:', queryParams);
    
    const [transactions] = await pool.query(query, queryParams);
    console.log(`Found ${transactions.length} transactions to export`);
    
    // If no transactions found, return an empty CSV with headers
    if (transactions.length === 0) {
      console.log('No transactions found, returning empty CSV with headers');
      const headers = ['ID', 'Date', 'Description', 'Amount', 'Type', 'Category', 'Payment Method', 'Status', 'Notes', 'Location', 'Tags'];
      const csvContent = headers.join(',') + '\r\n';
      
      // Set response headers for file download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="transactions-${new Date().toISOString().split('T')[0]}.csv"`);
      
      // Send empty CSV content
      return res.status(200).send(csvContent);
    }
    
    // Generate CSV content
    const headers = ['ID', 'Date', 'Description', 'Amount', 'Type', 'Category', 'Payment Method', 'Status', 'Notes', 'Location', 'Tags'];
    
    let csvContent = headers.join(',') + '\r\n';
    
    // Add transaction rows
    transactions.forEach(transaction => {
      const row = [
        transaction.transaction_id,
        transaction.date,
        `"${(transaction.description || '').replace(/"/g, '""')}"`, // Escape quotes in CSV
        transaction.amount,
        transaction.type,
        `"${(transaction.category || 'Uncategorized').replace(/"/g, '""')}"`,
        transaction.payment_method || '',
        transaction.status || '',
        `"${(transaction.notes || '').replace(/"/g, '""')}"`,
        `"${(transaction.location || '').replace(/"/g, '""')}"`,
        transaction.tags ? `"${transaction.tags.replace(/"/g, '""')}"` : ''
      ];
      
      csvContent += row.join(',') + '\r\n';
    });
    
    console.log('Generated CSV content successfully');
    
    // Set response headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="transactions-${new Date().toISOString().split('T')[0]}.csv"`);
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow cross-origin requests
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition'); // Expose the filename header
    
    // Send CSV content
    console.log('Sending CSV response');
    res.status(200).send(csvContent);
  } catch (err) {
    console.error('Error exporting transactions:', err);
    res.status(500).json({ message: 'Server error while exporting transactions.' });
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
