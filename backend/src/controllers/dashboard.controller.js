const { getDB } = require('../config/database');

function getSummary(req, res) {
  try {
    const db = getDB();

    const incomeResult = db.prepare(
      `SELECT COALESCE(SUM(amount), 0) as totalIncome
       FROM financial_records
       WHERE type = 'income' AND is_deleted = 0`
    ).get();

    const expenseResult = db.prepare(
      `SELECT COALESCE(SUM(amount), 0) as totalExpenses
       FROM financial_records
       WHERE type = 'expense' AND is_deleted = 0`
    ).get();

    const totalIncome = incomeResult.totalIncome;
    const totalExpenses = expenseResult.totalExpenses;
    const netBalance = totalIncome - totalExpenses;

    const categoryTotals = db.prepare(
      `SELECT category, type, SUM(amount) as total
       FROM financial_records
       WHERE is_deleted = 0
       GROUP BY category, type
       ORDER BY category, type`
    ).all();

    const recentActivity = db.prepare(
      `SELECT * FROM financial_records
       WHERE is_deleted = 0
       ORDER BY date DESC, created_at DESC
       LIMIT 5`
    ).all();

    const monthlyTrends = db.prepare(
      `SELECT strftime('%Y-%m', date) as month, type, SUM(amount) as total
       FROM financial_records
       WHERE is_deleted = 0
       GROUP BY strftime('%Y-%m', date), type
       ORDER BY month DESC
       LIMIT 24`
    ).all();

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const userId = req.user.id;

    // Technically in a robust app we'd pass the user's timezone date. 
    // We'll use the server's current UTC month/year.
    const monthStr = currentMonth.toString().padStart(2, '0');
    const yearStr = currentYear.toString();

    const budgetProgress = db.prepare(`
      SELECT 
        b.category, 
        b.amount as budgetAmount, 
        COALESCE(SUM(r.amount), 0) as spentAmount
      FROM budgets b
      LEFT JOIN financial_records r ON b.category = r.category 
        AND b.user_id = r.created_by 
        AND r.type = 'expense' 
        AND r.is_deleted = 0
        AND strftime('%m', r.date) = ? 
        AND strftime('%Y', r.date) = ?
      WHERE b.user_id = ? AND b.month = ? AND b.year = ?
      GROUP BY b.category, b.amount
    `).all(monthStr, yearStr, userId, currentMonth, currentYear);

    res.json({
      totalIncome,
      totalExpenses,
      netBalance,
      categoryTotals,
      recentActivity,
      monthlyTrends,
      budgetProgress
    });
  } catch (err) {
    console.error('Dashboard summary error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = { getSummary };
