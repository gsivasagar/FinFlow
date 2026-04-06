const { getDB } = require('../config/database');

function getAuditLogs(req, res) {
  try {
    const { action, target_type, user_id, page = 1, limit = 20 } = req.query;

    const db = getDB();

    let query = `
      SELECT al.*, u.name as user_name, u.email as user_email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM audit_logs WHERE 1=1';
    const params = [];
    const countParams = [];

    if (action) {
      query += ' AND al.action = ?';
      countQuery += ' AND action = ?';
      params.push(action);
      countParams.push(action);
    }

    if (target_type) {
      query += ' AND al.target_type = ?';
      countQuery += ' AND target_type = ?';
      params.push(target_type);
      countParams.push(target_type);
    }

    if (user_id) {
      query += ' AND al.user_id = ?';
      countQuery += ' AND user_id = ?';
      params.push(user_id);
      countParams.push(user_id);
    }

    const { total } = db.prepare(countQuery).get(...countParams);

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
    params.push(limitNum, offset);

    const logs = db.prepare(query).all(...params);

    // Parse JSON details field
    const parsedLogs = logs.map((log) => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null,
    }));

    res.json({
      logs: parsedLogs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error('Get audit logs error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = { getAuditLogs };
