import { getPool } from '../config/db.js';

/**
 * Get summary report data including most expensive categories, monthly comparisons, and trends
 */
export async function getReportSummary(req, res) {
  // For development, handle case when req.user is undefined
  const user_id = req.user?.user_id || 2; // Default to user_id 2 for development
  
  console.log('getReportSummary called with user_id:', user_id);
  
  // Check if there are any transactions for this user
  let effectiveUserId = user_id;
  try {
    const pool = getPool();
    const [transactionCount] = await pool.query(
      'SELECT COUNT(*) as count FROM transactions WHERE user_id = ?',
      [user_id]
    );
    console.log(`Found ${transactionCount[0].count} total transactions for user_id ${user_id}`);
    
    // If no transactions, try with user_id = 1 as fallback
    if (transactionCount[0].count === 0) {
      const [fallbackCount] = await pool.query(
        'SELECT COUNT(*) as count FROM transactions WHERE user_id = 1'
      );
      console.log(`Found ${fallbackCount[0].count} transactions for fallback user_id 1`);
      
      if (fallbackCount[0].count > 0) {
        console.log('Using fallback user_id 1 since current user has no transactions');
        effectiveUserId = 1;
      }
    }
  } catch (err) {
    console.error('Error checking transaction count:', err);
  }
  
  const { period } = req.query;
  
  // Default to last 6 months if period not specified
  const today = new Date();
  let startDate, endDate;
  
  switch (period) {
    case 'month':
      // Current month
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = today;
      break;
    case 'quarter':
      // Last 3 months
      startDate = new Date(today.getFullYear(), today.getMonth() - 3, 1);
      endDate = today;
      break;
    case 'year':
      // Last 12 months
      startDate = new Date(today.getFullYear(), today.getMonth() - 12, 1);
      endDate = today;
      break;
    default:
      // Default to last 6 months
      startDate = new Date(today.getFullYear(), today.getMonth() - 6, 1);
      endDate = today;
  }
  
  // Format dates for SQL
  const formattedStartDate = startDate.toISOString().split('T')[0];
  const formattedEndDate = endDate.toISOString().split('T')[0];
  
  console.log(`Fetching report summary for user_id: ${user_id}, period: ${period}, date range: ${formattedStartDate} to ${formattedEndDate}`);
  
  try {
    const pool = getPool();
    
    // Get all available categories first (for fallback)
    const [availableCategories] = await pool.query(
      `SELECT category_id, name, color, icon FROM categories WHERE user_id = ? OR user_id IS NULL`,
      [effectiveUserId]
    );
    
    console.log(`Using effectiveUserId ${effectiveUserId} for queries`);
    
    console.log(`Found ${availableCategories.length} available categories`);
    
    // Get most expensive categories - using LEFT JOIN to include transactions without categories
    console.log('Fetching expensive categories...');
    const [expensiveCategories] = await pool.query(
      `SELECT 
        COALESCE(c.category_id, 0) as category_id,
        COALESCE(c.name, 'Uncategorized') as name,
        COALESCE(c.color, '#808080') as color,
        COALESCE(c.icon, 'question-mark') as icon,
        SUM(t.amount) as total
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.category_id
      WHERE t.user_id = ? AND t.date BETWEEN ? AND ? AND t.type = 'expense'
      GROUP BY COALESCE(c.category_id, 0), COALESCE(c.name, 'Uncategorized'), COALESCE(c.color, '#808080'), COALESCE(c.icon, 'question-mark')
      ORDER BY total DESC
      LIMIT 5`,
      [effectiveUserId, formattedStartDate, formattedEndDate]
    );
    
    console.log(`Found ${expensiveCategories.length} expensive categories for user ${effectiveUserId}`);
    
    console.log(`Found ${expensiveCategories.length} expensive categories`);
    
    // Use available categories if no expensive categories found
    const effectiveExpensiveCategories = expensiveCategories.length > 0 
      ? expensiveCategories 
      : availableCategories.map(cat => ({ ...cat, total: 0 }));
    
    // Get monthly spending comparison - using direct query on transactions (no category join needed)
    console.log('Fetching monthly spending...');
    const [monthlySpending] = await pool.query(
      `SELECT 
        DATE_FORMAT(t.date, '%Y-%m') as month,
        DATE_FORMAT(t.date, '%b %Y') as month_name,
        SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) as income,
        SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as expenses,
        SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END) as net
      FROM transactions t
      WHERE t.user_id = ? AND t.date BETWEEN ? AND ?
      GROUP BY DATE_FORMAT(t.date, '%Y-%m'), DATE_FORMAT(t.date, '%b %Y')
      ORDER BY month`,
      [effectiveUserId, formattedStartDate, formattedEndDate]
    );
    
    console.log('Monthly spending data:', monthlySpending);
    
    console.log(`Found ${monthlySpending.length} months of spending data`);
    
    // Generate default monthly data if none found
    let effectiveMonthlySpending = monthlySpending;
    if (monthlySpending.length === 0) {
      console.log('No monthly spending found, generating default data');
      // Generate some default monthly data
      effectiveMonthlySpending = [];
      for (let i = 0; i < 3; i++) {
        const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthName = monthDate.toLocaleString('default', { month: 'short' }) + ' ' + monthDate.getFullYear();
        const monthKey = monthDate.getFullYear() + '-' + String(monthDate.getMonth() + 1).padStart(2, '0');
        
        effectiveMonthlySpending.push({
          month: monthKey,
          month_name: monthName,
          income: 0,
          expenses: 0,
          net: 0
        });
      }
    }
    
    // Get category spending trends over time - using LEFT JOIN to include transactions without categories
    console.log('Fetching category trends...');
    const [categoryTrends] = await pool.query(
      `SELECT 
        DATE_FORMAT(t.date, '%Y-%m') as month,
        DATE_FORMAT(t.date, '%b %Y') as month_name,
        COALESCE(c.name, 'Uncategorized') as category,
        COALESCE(c.color, '#808080') as color,
        SUM(t.amount) as amount
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.category_id
      WHERE t.user_id = ? AND t.date BETWEEN ? AND ? AND t.type = 'expense'
      GROUP BY DATE_FORMAT(t.date, '%Y-%m'), DATE_FORMAT(t.date, '%b %Y'), COALESCE(c.name, 'Uncategorized'), COALESCE(c.color, '#808080')
      ORDER BY month, amount DESC`,
      [effectiveUserId, formattedStartDate, formattedEndDate]
    );
    
    console.log('Category trends data:', categoryTrends);
    
    console.log(`Found ${categoryTrends.length} category trend data points`);
    
    // Get overall summary
    console.log('Fetching summary data...');
    const [summary] = await pool.query(
      `SELECT 
        SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) as total_income,
        SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as total_expenses,
        SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END) as net_savings,
        COUNT(DISTINCT DATE_FORMAT(t.date, '%Y-%m')) as months_count
      FROM transactions t
      WHERE t.user_id = ? AND t.date BETWEEN ? AND ?`,
      [effectiveUserId, formattedStartDate, formattedEndDate]
    );
    
    console.log('Summary data:', summary[0]);
    
    // Format category trends for easier consumption by the frontend
    // Group by month and create an array of categories for each month
    const formattedCategoryTrends = {};
    categoryTrends.forEach(item => {
      if (!formattedCategoryTrends[item.month]) {
        formattedCategoryTrends[item.month] = {
          month: item.month,
          month_name: item.month_name,
          categories: []
        };
      }
      
      formattedCategoryTrends[item.month].categories.push({
        category: item.category,
        color: item.color,
        amount: item.amount
      });
    });
    
    // Ensure we have a valid summary object even if no data was found
    const effectiveSummary = summary[0] && summary[0].total_income !== null ? summary[0] : {
      total_income: 0,
      total_expenses: 0,
      net_savings: 0,
      months_count: 0
    };
    
    // Calculate average monthly spending
    const avgMonthlyExpense = effectiveSummary.months_count > 0 
      ? effectiveSummary.total_expenses / effectiveSummary.months_count 
      : 0;
    
    const avgMonthlyIncome = effectiveSummary.months_count > 0 
      ? effectiveSummary.total_income / effectiveSummary.months_count 
      : 0;
    
    // Add average monthly data to summary
    effectiveSummary.avg_monthly_expense = avgMonthlyExpense;
    effectiveSummary.avg_monthly_income = avgMonthlyIncome;
    
    // Format the response
    const response = {
      period,
      date_range: {
        start_date: formattedStartDate,
        end_date: formattedEndDate
      },
      expensive_categories: effectiveExpensiveCategories,
      monthly_spending: effectiveMonthlySpending,
      category_trends: Object.values(formattedCategoryTrends),
      summary: effectiveSummary
    };
    
    console.log('Sending report summary response');
    res.status(200).json(response);
  } catch (err) {
    console.error('Error fetching report summary:', err);
    console.error('Error details:', err.message, err.stack);
    
    // Return a default response structure with empty data
    const defaultResponse = {
      period: period || '6months',
      date_range: {
        start_date: formattedStartDate,
        end_date: formattedEndDate
      },
      expensive_categories: [],
      monthly_spending: [],
      category_trends: [],
      summary: {
        total_income: 0,
        total_expenses: 0,
        net_savings: 0,
        avg_monthly_expense: 0,
        avg_monthly_income: 0
      }
    };
    
    // Send the default response instead of an error
    res.status(200).json(defaultResponse);
  }
}

/**
 * Get most expensive categories for a given period
 */
export async function getExpensiveCategories(req, res) {
  // For development, handle case when req.user is undefined
  const user_id = req.user?.user_id || 2; // Default to user_id 2 for development
  
  const { startDate, endDate, limit = 5 } = req.query;
  
  // Validate date range
  if (!startDate || !endDate) {
    return res.status(400).json({ message: 'Start date and end date are required.' });
  }
  
  try {
    const pool = getPool();
    
    const [categories] = await pool.query(
      `SELECT 
        c.category_id,
        c.name,
        c.color,
        c.icon,
        SUM(t.amount) as total,
        COUNT(t.transaction_id) as transaction_count
      FROM transactions t
      JOIN categories c ON t.category_id = c.category_id
      WHERE t.user_id = ? AND t.date BETWEEN ? AND ? AND t.type = 'expense'
      GROUP BY c.category_id
      ORDER BY total DESC
      LIMIT ?`,
      [user_id, startDate, endDate, parseInt(limit)]
    );
    
    // Get total spending for the period
    const [totalResult] = await pool.query(
      'SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND date BETWEEN ? AND ? AND type = "expense"',
      [user_id, startDate, endDate]
    );
    
    const totalSpending = totalResult[0].total || 0;
    
    // Calculate percentage for each category
    const categoriesWithPercentage = categories.map(category => ({
      ...category,
      percentage: totalSpending > 0 ? Math.round((category.total / totalSpending) * 100) : 0
    }));
    
    res.status(200).json({
      categories: categoriesWithPercentage,
      totalSpending,
      startDate,
      endDate
    });
  } catch (err) {
    console.error('Error fetching expensive categories:', err);
    res.status(500).json({ message: 'Server error while fetching expensive categories.' });
  }
}

/**
 * Get monthly comparison data (income vs expenses)
 */
export async function getMonthlyComparison(req, res) {
  // For development, handle case when req.user is undefined
  const user_id = req.user?.user_id || 2; // Default to user_id 2 for development
  
  const { startDate, endDate } = req.query;
  
  // Validate date range
  if (!startDate || !endDate) {
    return res.status(400).json({ message: 'Start date and end date are required.' });
  }
  
  try {
    const pool = getPool();
    
    const [monthlyData] = await pool.query(
      `SELECT 
        DATE_FORMAT(t.date, '%Y-%m') as month,
        DATE_FORMAT(t.date, '%b %Y') as month_name,
        SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) as income,
        SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as expenses,
        SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END) as net
      FROM transactions t
      WHERE t.user_id = ? AND t.date BETWEEN ? AND ?
      GROUP BY DATE_FORMAT(t.date, '%Y-%m'), DATE_FORMAT(t.date, '%b %Y')
      ORDER BY month`,
      [user_id, startDate, endDate]
    );
    
    res.status(200).json({
      monthlyData,
      startDate,
      endDate
    });
  } catch (err) {
    console.error('Error fetching monthly comparison:', err);
    res.status(500).json({ message: 'Server error while fetching monthly comparison.' });
  }
}

/**
 * Get category-based spending trends over time
 */
export async function getCategoryTrends(req, res) {
  // For development, handle case when req.user is undefined
  const user_id = req.user?.user_id || 2; // Default to user_id 2 for development
  
  const { startDate, endDate, categories } = req.query;
  
  // Validate date range
  if (!startDate || !endDate) {
    return res.status(400).json({ message: 'Start date and end date are required.' });
  }
  
  try {
    const pool = getPool();
    
    // Build the category filter condition if categories are specified
    let categoryFilter = '';
    let categoryParams = [];
    
    if (categories && categories.length > 0) {
      const categoryList = categories.split(',');
      categoryFilter = 'AND c.category_id IN (?)';
      categoryParams = [categoryList];
    }
    
    const [categoryTrends] = await pool.query(
      `SELECT 
        DATE_FORMAT(t.date, '%Y-%m') as month,
        DATE_FORMAT(t.date, '%b %Y') as month_name,
        c.category_id,
        c.name as category,
        c.color,
        SUM(t.amount) as amount
      FROM transactions t
      JOIN categories c ON t.category_id = c.category_id
      WHERE t.user_id = ? AND t.date BETWEEN ? AND ? AND t.type = 'expense' ${categoryFilter}
      GROUP BY DATE_FORMAT(t.date, '%Y-%m'), DATE_FORMAT(t.date, '%b %Y'), c.category_id
      ORDER BY month, amount DESC`,
      [user_id, startDate, endDate, ...categoryParams].filter(param => param !== undefined)
    );
    
    // Format data for easier consumption by the frontend
    // Group by month and create an array of categories for each month
    const formattedTrends = {};
    categoryTrends.forEach(item => {
      if (!formattedTrends[item.month]) {
        formattedTrends[item.month] = {
          month: item.month,
          month_name: item.month_name,
          categories: []
        };
      }
      
      formattedTrends[item.month].categories.push({
        category_id: item.category_id,
        category: item.category,
        color: item.color,
        amount: item.amount
      });
    });
    
    res.status(200).json({
      trends: Object.values(formattedTrends),
      startDate,
      endDate
    });
  } catch (err) {
    console.error('Error fetching category trends:', err);
    res.status(500).json({ message: 'Server error while fetching category trends.' });
  }
}

/**
 * Get transaction data for reports based on date range and filters
 */
export async function getReportData(req, res) {
  // For development, handle case when req.user is undefined
  const user_id = req.user?.user_id || 2; // Default to user_id 2 for development
  
  console.log('getReportData called with user_id:', user_id);
  
  const { startDate, endDate, categories } = req.query;
  
  // Debug: Check if there are any transactions for this user
  let effectiveUserId = user_id;
  try {
    const pool = getPool();
    const [transactionCount] = await pool.query(
      'SELECT COUNT(*) as count FROM transactions WHERE user_id = ?',
      [user_id]
    );
    console.log(`Found ${transactionCount[0].count} total transactions for user_id ${user_id}`);
    
    // If no transactions, try with user_id = 1 as fallback
    if (transactionCount[0].count === 0) {
      const [fallbackCount] = await pool.query(
        'SELECT COUNT(*) as count FROM transactions WHERE user_id = 1'
      );
      console.log(`Found ${fallbackCount[0].count} transactions for fallback user_id 1`);
      
      if (fallbackCount[0].count > 0) {
        console.log('Using fallback user_id 1 since current user has no transactions');
        effectiveUserId = 1;
      }
    }
  } catch (err) {
    console.error('Error checking transaction count:', err);
  }
  
  // Validate date range
  if (!startDate || !endDate) {
    return res.status(400).json({ message: 'Start date and end date are required.' });
  }
  
  try {
    const pool = getPool();
    
    // Build the category filter condition if categories are specified
    let categoryFilter = '';
    let categoryParams = [];
    
    if (categories && categories.length > 0) {
      const categoryList = categories.split(',');
      categoryFilter = 'AND c.name IN (?)';
      categoryParams = [categoryList];
    }
    
    // Get all transactions within date range - using LEFT JOIN to include transactions without categories
    const transactionQuery = `SELECT 
      t.transaction_id, t.description, t.amount, t.date, t.type,
      c.name as category_name, c.color
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.category_id
     WHERE t.user_id = ? AND t.date BETWEEN ? AND ? ${categoryFilter}
     ORDER BY t.date DESC`;
    
    console.log('Transaction query using effectiveUserId:', effectiveUserId);
    const [transactions] = await pool.query(
      transactionQuery,
      [effectiveUserId, startDate, endDate, ...categoryParams]
    );
    
    console.log(`Found ${transactions.length} transactions`);
    
    // Get category spending breakdown - using LEFT JOIN to include transactions without categories
    const categoryQuery = `SELECT 
      COALESCE(c.name, 'Uncategorized') as name, 
      COALESCE(c.color, '#808080') as color, 
      SUM(t.amount) as total
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.category_id
     WHERE t.user_id = ? AND t.date BETWEEN ? AND ? AND t.type = 'expense' ${categoryFilter}
     GROUP BY COALESCE(c.name, 'Uncategorized'), COALESCE(c.color, '#808080')
     ORDER BY total DESC`;
    
    console.log('Category query using effectiveUserId:', effectiveUserId);
    const [categorySpending] = await pool.query(
      categoryQuery,
      [effectiveUserId, startDate, endDate, ...categoryParams]
    );
    
    console.log(`Found ${categorySpending.length} category spending entries`);
    
    // Get monthly comparison data (income vs expenses) - using LEFT JOIN to include transactions without categories
    const monthlyQuery = `SELECT 
      DATE_FORMAT(t.date, '%b %Y') as month,
      SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) as income,
      SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as expenses
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.category_id
     WHERE t.user_id = ? AND t.date BETWEEN ? AND ? ${categoryFilter}
     GROUP BY DATE_FORMAT(t.date, '%b %Y')
     ORDER BY MIN(t.date)`;
    
    console.log('Monthly query using effectiveUserId:', effectiveUserId);
    const [monthlyComparison] = await pool.query(
      monthlyQuery,
      [effectiveUserId, startDate, endDate, ...categoryParams]
    );
    
    console.log(`Found ${monthlyComparison.length} monthly comparison entries`);
    
    // Get daily trends data - using LEFT JOIN to include transactions without categories
    const trendsQuery = `SELECT 
      DATE_FORMAT(t.date, '%b %d') as date,
      SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END) as amount
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.category_id
     WHERE t.user_id = ? AND t.date BETWEEN ? AND ? ${categoryFilter}
     GROUP BY DATE_FORMAT(t.date, '%b %d'), t.date
     ORDER BY t.date`;
    
    console.log('Trends query using effectiveUserId:', effectiveUserId);
    const [dailyTrends] = await pool.query(
      trendsQuery,
      [effectiveUserId, startDate, endDate, ...categoryParams]
    );
    
    console.log(`Found ${dailyTrends.length} daily trend entries`);
    
    // Calculate summary data - using LEFT JOIN to include transactions without categories
    const summaryQuery = `SELECT 
      SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) as total_income,
      SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as total_expenses
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.category_id
     WHERE t.user_id = ? AND t.date BETWEEN ? AND ? ${categoryFilter}`;
    
    console.log('Summary query using effectiveUserId:', effectiveUserId);
    const [summary] = await pool.query(
      summaryQuery,
      [effectiveUserId, startDate, endDate, ...categoryParams]
    );
    
    console.log('Summary data:', summary[0]);
    
    // Get all available categories for filtering
    // First try to get categories with transactions
    const [availableCategories] = await pool.query(
      `SELECT DISTINCT c.name, c.color
       FROM categories c
       LEFT JOIN transactions t ON c.category_id = t.category_id AND t.user_id = ?
       WHERE c.user_id = ? OR c.user_id IS NULL
       ORDER BY c.name`,
      [effectiveUserId, effectiveUserId]
    );
    
    console.log(`Found ${availableCategories.length} available categories`);
    
    // Format the response
    const response = {
      transactions,
      categorySpending,
      monthlyComparison,
      dailyTrends,
      summary: summary[0] || { total_income: 0, total_expenses: 0 },
      availableCategories
    };
    
    res.status(200).json(response);
  } catch (err) {
    console.error('Error fetching report data:', err);
    console.error('Error details:', err.message, err.stack);
    res.status(500).json({ message: 'Server error while fetching report data.', error: err.message });
  }
}

/**
 * Export report data as CSV
 */
export async function exportReportData(req, res) {
  // For development, handle case when req.user is undefined
  const user_id = req.user?.user_id || 2; // Default to user_id 2 for development
  
  const { startDate, endDate, categories, reportType } = req.query;
  
  // Validate date range
  if (!startDate || !endDate) {
    return res.status(400).json({ message: 'Start date and end date are required.' });
  }
  
  try {
    const pool = getPool();
    
    // Build the category filter condition if categories are specified
    let categoryFilter = '';
    let categoryParams = [];
    
    if (categories && categories.length > 0) {
      const categoryList = categories.split(',');
      categoryFilter = 'AND c.name IN (?)';
      categoryParams = [categoryList];
    }
    
    let data = [];
    let csvContent = '';
    
    // Get data based on report type
    switch (reportType) {
      case 'category':
        // Get category spending breakdown
        const [categoryData] = await pool.query(
          `SELECT 
            c.name, SUM(t.amount) as total
           FROM transactions t
           JOIN categories c ON t.category_id = c.category_id
           WHERE t.user_id = ? AND t.date BETWEEN ? AND ? AND t.type = 'expense' ${categoryFilter}
           GROUP BY c.category_id
           ORDER BY total DESC`,
          [user_id, startDate, endDate, ...categoryParams].filter(param => param !== undefined)
        );
        
        data = categoryData;
        csvContent = 'Category,Amount\n' + 
          data.map(row => `"${row.name}",${row.total}`).join('\n');
        break;
        
      case 'comparison':
        // Get monthly comparison data
        const [comparisonData] = await pool.query(
          `SELECT 
            DATE_FORMAT(t.date, '%b %Y') as month,
            SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) as income,
            SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as expenses
           FROM transactions t
           JOIN categories c ON t.category_id = c.category_id
           WHERE t.user_id = ? AND t.date BETWEEN ? AND ? ${categoryFilter}
           GROUP BY DATE_FORMAT(t.date, '%b %Y')
           ORDER BY MIN(t.date)`,
          [user_id, startDate, endDate, ...categoryParams].filter(param => param !== undefined)
        );
        
        data = comparisonData;
        csvContent = 'Month,Income,Expenses,Net\n' + 
          data.map(row => `"${row.month}",${row.income},${row.expenses},${row.income - row.expenses}`).join('\n');
        break;
        
      case 'trends':
        // Get daily trends data
        const [trendsData] = await pool.query(
          `SELECT 
            DATE_FORMAT(t.date, '%Y-%m-%d') as date,
            SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END) as amount
           FROM transactions t
           JOIN categories c ON t.category_id = c.category_id
           WHERE t.user_id = ? AND t.date BETWEEN ? AND ? ${categoryFilter}
           GROUP BY DATE_FORMAT(t.date, '%Y-%m-%d'), t.date
           ORDER BY t.date`,
          [user_id, startDate, endDate, ...categoryParams].filter(param => param !== undefined)
        );
        
        data = trendsData;
        csvContent = 'Date,Net Amount\n' + 
          data.map(row => `"${row.date}",${row.amount}`).join('\n');
        break;
        
      default:
        // Get all transactions
        const [transactions] = await pool.query(
          `SELECT 
            t.transaction_id, t.description, t.amount, t.date, t.type,
            c.name as category_name
           FROM transactions t
           JOIN categories c ON t.category_id = c.category_id
           WHERE t.user_id = ? AND t.date BETWEEN ? AND ? ${categoryFilter}
           ORDER BY t.date DESC`,
          [user_id, startDate, endDate, ...categoryParams].filter(param => param !== undefined)
        );
        
        data = transactions;
        csvContent = 'Date,Description,Category,Type,Amount\n' + 
          data.map(row => `"${row.date}","${row.description}","${row.category_name}","${row.type}",${row.amount}`).join('\n');
    }
    
    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="wyzer-report-${reportType}-${startDate}-to-${endDate}.csv"`);
    
    // Send the CSV content
    res.status(200).send(csvContent);
  } catch (err) {
    console.error('Error exporting report data:', err);
    res.status(500).json({ message: 'Server error while exporting report data.' });
  }
}
