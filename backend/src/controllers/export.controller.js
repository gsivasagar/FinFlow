const { getDB } = require('../config/database');

function exportCSV(req, res) {
  try {
    const { type, category, from, to } = req.query;
    const db = getDB();

    let query = 'SELECT date, type, category, amount, notes FROM financial_records WHERE is_deleted = 0';
    const params = [];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    if (from) {
      query += ' AND date >= ?';
      params.push(from);
    }
    if (to) {
      query += ' AND date <= ?';
      params.push(to);
    }

    query += ' ORDER BY date DESC';
    const records = db.prepare(query).all(...params);

    // Build CSV
    const header = 'Date,Type,Category,Amount,Notes';
    const rows = records.map((r) => {
      const notes = r.notes ? `"${r.notes.replace(/"/g, '""')}"` : '';
      const category = `"${r.category.replace(/"/g, '""')}"`;
      return `${r.date},${r.type},${category},${r.amount},${notes}`;
    });

    const csv = [header, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=financial_records.csv');
    res.send(csv);
  } catch (err) {
    console.error('Export CSV error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = { exportCSV };
