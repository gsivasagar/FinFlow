const { getDB } = require('../config/database');
const { logAudit } = require('../middleware/audit');

function getAllUsers(req, res) {
  try {
    const db = getDB();
    const users = db.prepare(
      'SELECT id, name, email, role, status, created_at FROM users'
    ).all();

    res.json({ users });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

function updateUserRole(req, res) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const db = getDB();

    const user = db.prepare('SELECT id, role FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const oldRole = user.role;
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);

    logAudit(req.user.id, 'UPDATE_ROLE', 'user', parseInt(id), {
      oldRole, newRole: role
    });

    res.json({ message: 'User role updated successfully.' });
  } catch (err) {
    console.error('Update role error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

function updateUserStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const db = getDB();

    const user = db.prepare('SELECT id, status FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const oldStatus = user.status;
    db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, id);

    logAudit(req.user.id, 'UPDATE_STATUS', 'user', parseInt(id), {
      oldStatus, newStatus: status
    });

    res.json({ message: 'User status updated successfully.' });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = { getAllUsers, updateUserRole, updateUserStatus };
