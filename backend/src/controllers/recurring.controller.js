const { getDB } = require('../config/database');

function getRecurring(req, res) {
  try {
    const db = getDB();
    const records = db.prepare('SELECT * FROM recurring_transactions WHERE user_id = ? ORDER BY next_run_date ASC').all(req.user.id);
    res.json({ records });
  } catch (err) {
    console.error('Get recurring transactions error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

function createRecurring(req, res) {
  try {
    const { amount, type, category, notes, frequency, next_run_date } = req.body;
    const db = getDB();

    const info = db.prepare(`
      INSERT INTO recurring_transactions (user_id, amount, type, category, notes, frequency, next_run_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(req.user.id, amount, type, category, notes, frequency, next_run_date);

    res.status(201).json({ message: 'Recurring transaction scheduled successfully.', id: info.lastInsertRowid });
  } catch (err) {
    console.error('Create recurring transaction error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

function deleteRecurring(req, res) {
  try {
    const db = getDB();
    // We can just hard delete or toggle is_active = 0. We'll hard delete.
    const info = db.prepare('DELETE FROM recurring_transactions WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Transaction not found or unauthorized.' });
    }

    res.json({ message: 'Recurring transaction deleted successfully.' });
  } catch (err) {
    console.error('Delete recurring transaction error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

function toggleRecurring(req, res) {
  try {
    const db = getDB();
    const record = db.prepare('SELECT is_active FROM recurring_transactions WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    
    if (!record) {
      return res.status(404).json({ error: 'Transaction not found or unauthorized.' });
    }

    const newStatus = record.is_active ? 0 : 1;
    db.prepare('UPDATE recurring_transactions SET is_active = ? WHERE id = ?').run(newStatus, req.params.id);

    res.json({ message: `Recurring transaction ${newStatus ? 'activated' : 'paused'} successfully.` });
  } catch (err) {
    console.error('Toggle recurring transaction error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = { getRecurring, createRecurring, deleteRecurring, toggleRecurring };
