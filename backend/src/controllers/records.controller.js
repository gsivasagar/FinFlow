const { getDB } = require('../config/database');
const { logAudit } = require('../middleware/audit');

function createRecord(req, res) {
  try {
    const { amount, type, category, date, notes } = req.body;
    const db = getDB();

    const stmt = db.prepare(
      `INSERT INTO financial_records (amount, type, category, date, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    const result = stmt.run(amount, type, category, date, notes || null, req.user.id);

    logAudit(req.user.id, 'CREATE_RECORD', 'record', result.lastInsertRowid, {
      amount, type, category, date
    });

    res.status(201).json({
      message: 'Financial record created successfully.',
      recordId: result.lastInsertRowid
    });
  } catch (err) {
    console.error('Create record error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

function getRecords(req, res) {
  try {
    const { type, category, from, to, page = 1, limit = 10 } = req.query;

    const db = getDB();

    let query = 'SELECT * FROM financial_records WHERE is_deleted = 0';
    let countQuery = 'SELECT COUNT(*) as total FROM financial_records WHERE is_deleted = 0';
    const params = [];
    const countParams = [];

    if (type) {
      query += ' AND type = ?';
      countQuery += ' AND type = ?';
      params.push(type);
      countParams.push(type);
    }

    if (category) {
      query += ' AND category = ?';
      countQuery += ' AND category = ?';
      params.push(category);
      countParams.push(category);
    }

    if (from) {
      query += ' AND date >= ?';
      countQuery += ' AND date >= ?';
      params.push(from);
      countParams.push(from);
    }

    if (to) {
      query += ' AND date <= ?';
      countQuery += ' AND date <= ?';
      params.push(to);
      countParams.push(to);
    }

    const { total } = db.prepare(countQuery).get(...countParams);

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    query += ' ORDER BY date DESC LIMIT ? OFFSET ?';
    params.push(limitNum, offset);

    const records = db.prepare(query).all(...params);

    res.json({
      records,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    console.error('Get records error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

function updateRecord(req, res) {
  try {
    const { id } = req.params;
    const { amount, type, category, date, notes } = req.body;

    const db = getDB();

    const record = db.prepare(
      'SELECT * FROM financial_records WHERE id = ? AND is_deleted = 0'
    ).get(id);

    if (!record) {
      return res.status(404).json({ error: 'Record not found.' });
    }

    const updates = [];
    const params = [];

    if (amount != null) { updates.push('amount = ?'); params.push(amount); }
    if (type) { updates.push('type = ?'); params.push(type); }
    if (category) { updates.push('category = ?'); params.push(category); }
    if (date) { updates.push('date = ?'); params.push(date); }
    if (notes !== undefined) { updates.push('notes = ?'); params.push(notes); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update.' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const query = `UPDATE financial_records SET ${updates.join(', ')} WHERE id = ? AND is_deleted = 0`;
    db.prepare(query).run(...params);

    const updatedRecord = db.prepare(
      'SELECT * FROM financial_records WHERE id = ?'
    ).get(id);

    logAudit(req.user.id, 'UPDATE_RECORD', 'record', parseInt(id), {
      changes: { amount, type, category, date, notes }
    });

    res.json({
      message: 'Record updated successfully.',
      record: updatedRecord
    });
  } catch (err) {
    console.error('Update record error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

function deleteRecord(req, res) {
  try {
    const { id } = req.params;

    const db = getDB();

    const record = db.prepare(
      'SELECT * FROM financial_records WHERE id = ? AND is_deleted = 0'
    ).get(id);

    if (!record) {
      return res.status(404).json({ error: 'Record not found.' });
    }

    db.prepare(
      'UPDATE financial_records SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(id);

    logAudit(req.user.id, 'DELETE_RECORD', 'record', parseInt(id), {
      amount: record.amount, type: record.type, category: record.category
    });

    res.json({ message: 'Record deleted successfully.' });
  } catch (err) {
    console.error('Delete record error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = { createRecord, getRecords, updateRecord, deleteRecord };
