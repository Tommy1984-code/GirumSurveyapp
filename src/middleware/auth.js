const db = require('../config/database');
const { ALL_MODULES } = require('../utils/constants');

let sessions = new Map();

function hydrateSessions(loaded) {
  sessions.clear();
  for (const [token, session] of loaded) {
    sessions.set(token, session);
  }
  return sessions;
}

async function loadSessions() {
  await db.query(`DELETE FROM admin_sessions WHERE expires_at IS NOT NULL AND expires_at < NOW()`);
  await db.query(`DELETE FROM admin_sessions WHERE expires_at IS NULL AND created_at < NOW() - INTERVAL '7 days'`);
  const result = await db.query(`
    SELECT s.token, s.user_id, s.username, s.email, s.expires_at, u.role_id,
           COALESCE(json_agg(rp.module) FILTER (WHERE rp.module IS NOT NULL), '[]') AS permissions
    FROM admin_sessions s
    JOIN admin_users u ON u.id = s.user_id AND u.is_active = TRUE
    LEFT JOIN role_permissions rp ON rp.role_id = u.role_id
    GROUP BY s.token, s.user_id, s.username, s.email, s.expires_at, u.role_id
  `);
  const loaded = new Map();
  for (const row of result.rows) {
    loaded.set(row.token, {
      id: row.user_id,
      username: row.username,
      email: row.email,
      role_id: row.role_id,
      permissions: row.role_id ? (row.permissions || []) : ALL_MODULES,
      expires_at: row.expires_at
    });
  }
  return hydrateSessions(loaded);
}

function requireAuth(req, res, next) {
  const token = req.header('x-session-token');
  if (!token) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  if (!sessions.has(token)) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  const session = sessions.get(token);
  if (session.expires_at && new Date(session.expires_at) < new Date()) {
    sessions.delete(token);
    db.query('DELETE FROM admin_sessions WHERE token = $1', [token]).catch(() => {});
    return res.status(401).json({ error: 'session_expired' });
  }
  req.adminUser = session;
  next();
}

function requireModule(moduleName) {
  return function (req, res, next) {
    const perms = req.adminUser.permissions || [];
    if (perms.includes(moduleName)) {
      return next();
    }
    return res.status(403).json({ error: 'forbidden', message: 'Access denied to this module' });
  };
}

module.exports = { sessions, loadSessions, requireAuth, requireModule };
