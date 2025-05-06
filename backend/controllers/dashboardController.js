import { getPool } from '../config/db.js';

// Get dashboard data (spending breakdown, monthly trends, recent transactions)
export async function getDashboardData(req, res) {
  // For development, handle case when req.user is undefined
  const user_id = req.user?.user_id || 1; // Default to user_id 1 for development
  
  // Get date range from query params or use current month
  const today = new Date();
  const startDate = req.query.startDate || new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const endDate = req.query.endDate || today.toISOString().split('T')[0];
  
  console.log(`Fetching dashboard data for user_id: ${user_id}, period: ${startDate} to ${endDate}`);
  
  try {
    const pool = getPool();
    
    // 1. Get spending breakdown by category
    const [spendingBreakdown] = await pool.query(
      `SELECT 
        c.category_id, 
        c.name, 
        c.color, 
        c.icon,
        SUM(t.amount) as total,
        COUNT(t.transaction_id) as count
      FROM transactions t
      JOIN categories c ON t.category_id = c.category_id
      WHERE t.user_id = ? 
        AND t.date BETWEEN ? AND ?
        AND t.type = 'expense'
      GROUP BY c.category_id
      ORDER BY total DESC`,
      [user_id, startDate, endDate]
    );
    
    // Calculate total spending for percentages
    const totalSpending = spendingBreakdown.reduce((sum, cat) => sum + cat.total, 0);
    
    // Add percentage to each category
    const categoriesWithPercentage = spendingBreakdown.map(cat => ({
      ...cat,
      percentage: totalSpending > 0 ? Math.round((cat.total / totalSpending) * 100) : 0
    }));
    
    // 2. Get monthly trends (last 6 months)
    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(today.getMonth() - 5); // Get 6 months including current
    const monthStart = new Date(sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth(), 1);
    
    const [monthlyTrends] = await pool.query(
      `SELECT 
        DATE_FORMAT(date, '%Y-%m') as month,
        DATE_FORMAT(date, '%b %Y') as month_name,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses
      FROM transactions
      WHERE user_id = ? AND date >= ?
      GROUP BY month, month_name
      ORDER BY month ASC`,
      [user_id, monthStart.toISOString().split('T')[0]]
    );
    
    // Calculate net savings for each month
    const monthlyWithNet = monthlyTrends.map(month => ({
      ...month,
      net: month.income - month.expenses
    }));
    
    // 3. Get recent transactions (last 5)
    const [recentTransactions] = await pool.query(
      `SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.category_id
      WHERE t.user_id = ?
      ORDER BY t.date DESC, t.created_at DESC
      LIMIT 5`,
      [user_id]
    );
    
    // 4. Get summary totals for the period
    const [summary] = await pool.query(
      `SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as totalIncome,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as totalExpenses
      FROM transactions
      WHERE user_id = ? AND date BETWEEN ? AND ?`,
      [user_id, startDate, endDate]
    );
    
    // Calculate net savings
    const summaryWithNet = {
      ...summary[0],
      netSavings: (summary[0].totalIncome || 0) - (summary[0].totalExpenses || 0)
    };
    
    // 5. Check if budgets table exists and get budgets if it does
    let budgets = [];
    try {
      // First check if the budgets table exists
      const [tables] = await pool.query(
        `SELECT TABLE_NAME FROM information_schema.TABLES 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'budgets'`
      );
      
      if (tables.length > 0) {
        // Table exists, so query it
        const [budgetResults] = await pool.query(
          `SELECT * FROM budgets WHERE user_id = ? AND period = DATE_FORMAT(?, '%Y-%m')`,
          [user_id, today.toISOString()]
        );
        budgets = budgetResults;
      } else {
        console.log('Budgets table does not exist in the database');
      }
    } catch (err) {
      console.error('Error checking or querying budgets table:', err);
      // Continue with empty budgets array
    }
    
    // Ensure spending data is properly formatted for the frontend
    console.log('Categories with percentage:', categoriesWithPercentage);
    
    // Combine all data
    const dashboardData = {
      spending_breakdown: {
        categories: categoriesWithPercentage.map(cat => ({
          name: cat.name,
          total: parseFloat(cat.total) || 0,
          color: cat.color || '#' + Math.floor(Math.random()*16777215).toString(16),
          percentage: cat.percentage || 0
        }))
      },
      monthly_trends: monthlyWithNet,
      recent_transactions: recentTransactions,
      summary: summaryWithNet,
      budgets,
      date_range: {
        start_date: startDate,
        end_date: endDate
      }
    };
    
    console.log('Dashboard data being sent to frontend:', JSON.stringify(dashboardData.spending_breakdown, null, 2));
    
    res.status(200).json(dashboardData);
  } catch (err) {
    console.error('Error fetching dashboard data:', err);
    res.status(500).json({ message: 'Server error while fetching dashboard data.' });
  }
}

// Get user's budget
export async function getUserBudget(req, res) {
  try {
    // For development, handle case when req.user is undefined
    const user_id = req.user?.user_id || 1; // Default to user_id 1 for development
    
    // Get current month in YYYY-MM format
    const today = new Date();
    const period = today.toISOString().substring(0, 7); // YYYY-MM format
    
    console.log(`Fetching budget for user_id: ${user_id}, period: ${period}`);
    
    const pool = getPool();
    
    // Check if budgets table exists and get budgets if it does
    let budgets = [];
    try {
      // First check if the budgets table exists
      const [tables] = await pool.query(
        `SELECT TABLE_NAME FROM information_schema.TABLES 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'budgets'`
      );
      
      if (tables.length > 0) {
        // Table exists, so query it
        const [budgetResults] = await pool.query(
          `SELECT * FROM budgets WHERE user_id = ? AND period = ?`,
          [user_id, period]
        );
        budgets = budgetResults;
      } else {
        console.log('Budgets table does not exist in the database');
      }
    } catch (err) {
      console.error('Error checking or querying budgets table:', err);
      // Continue with empty budgets array
    }
    
    // Get user's profile for currency preference
    const [profiles] = await pool.query(
      `SELECT currency FROM user_profiles WHERE user_id = ?`,
      [user_id]
    );
    
    const currency = profiles.length > 0 ? profiles[0].currency : '$';
    
    // If no budget found, return default
    if (budgets.length === 0) {
      return res.status(200).json({
        totalBudget: 0,
        budgets: [],
        currency
      });
    }
    
    // Calculate total budget
    const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
    
    res.status(200).json({
      totalBudget,
      budgets,
      currency
    });
  } catch (error) {
    console.error('Error fetching user budget:', error);
    // Instead of returning a 500 error, return a default budget
    return res.status(200).json({
      totalBudget: 0,
      budgets: [],
      currency: '$',
      error: 'Failed to fetch budget data, using default values'
    });
  }
}
