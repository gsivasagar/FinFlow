const { getDB } = require('../config/database');

/**
 * Log an action to the audit_logs table.
 * @param {number} userId - The user performing the action
 * @param {string} action - e.g. 'CREATE_RECORD', 'UPDATE_ROLE', 'DELETE_RECORD'
 * @param {string} targetType - e.g. 'record', 'user'
 * @param {number|null} targetId - ID of the affected entity
 * @param {object|null} details - Additional JSON-serializable details
 */
function logAudit(userId, action, targetType, targetId, details = null) {
  try {
    const db = getDB();
    db.prepare(
      `INSERT INTO audit_logs (user_id, action, target_type, target_id, details)
       VALUES (?, ?, ?, ?, ?)`
    ).run(userId, action, targetType, targetId, details ? JSON.stringify(details) : null);
  } catch (err) {
    // Audit logging should never crash the request
    console.error('Audit log error:', err);
  }
}

module.exports = { logAudit };
