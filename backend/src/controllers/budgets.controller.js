const { getDB } = require('../config/database');

function getBudgets(req, res) {
  try {
    const userId = req.user.id;
    const { month, year } = req.query;
    const db = getDB();

    let query = 'SELECT * FROM budgets WHERE user_id = ?';
    const params = [userId];

    if (month) {
      query += ' AND month = ?';
      params.push(parseInt(month));
    }
    if (year) {
      query += ' AND year = ?';
      params.push(parseInt(year));
    }

    const budgets = db.prepare(query).all(...params);
    res.json({ budgets });
  } catch (err) {
    console.error('Get budgets error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

function setBudget(req, res) {
  try {
    const userId = req.user.id;
    const { category, amount, month, year } = req.body;
    const db = getDB();

    // Insert or Replace (UPSERT) logic
    const existing = db.prepare('SELECT id FROM budgets WHERE user_id = ? AND category = ? AND month = ? AND year = ?')
                       .get(userId, category, month, year);

    if (existing) {
      db.prepare('UPDATE budgets SET amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(amount, existing.id);
      return res.json({ message: 'Budget updated successfully.' });
    } else {
      const result = db.prepare('INSERT INTO budgets (user_id, category, amount, month, year) VALUES (?, ?, ?, ?, ?)')
                       .run(userId, category, amount, month, year);
      return res.status(201).json({ message: 'Budget created successfully.', budgetId: result.lastInsertRowid });
    }
  } catch (err) {
    console.error('Set budget error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

function deleteBudget(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const db = getDB();

    const info = db.prepare('DELETE FROM budgets WHERE id = ? AND user_id = ?').run(id, userId);
    
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Budget not found or unauthorized.' });
    }

    res.json({ message: 'Budget deleted successfully.' });
  } catch (err) {
    console.error('Delete budget error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = { getBudgets, setBudget, deleteBudget };
