const db = require('../config/database');

async function logActivity(userId, action, details) {
  try {
    await db.query(
      'INSERT INTO activity_logs(user_id, action, details) VALUES($1, $2, $3)',
      [userId, action, JSON.stringify(details)]
    );
  } catch (e) {
    console.error('Failed to log activity:', e.message);
  }
}

module.exports = { logActivity };
