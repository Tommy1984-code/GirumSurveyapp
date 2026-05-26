const db = require('../config/database');
const { hashPassword, verifyPassword } = require('../utils/helpers');
const { generateSessionToken } = require('../utils/idGenerator');
const { requireAuth, sessions, loadSessions } = require('../middleware/auth');
const { rateLimit } = require('../middleware/rateLimiter');
const { ALL_MODULES } = require('../utils/constants');
const { logActivity } = require('../services/activity');
const { ensureAdminUsersTable } = require('../services/bootstrap');

function register(app) {
  app.get('/api/auth/check', async function (req, res) {
    try {
      await ensureAdminUsersTable();
      const result = await db.query('SELECT COUNT(*) as count FROM admin_users');
      const hasUsers = parseInt(result.rows[0].count) > 0;
      return res.json({ has_users: hasUsers });
    } catch (e) {
      return res.status(500).json({ error: 'check_failed' });
    }
  });

  app.post('/api/auth/register', async function (req, res) {
    try {
      await ensureAdminUsersTable();
      
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      const retryAfter = rateLimit('register:' + ip, 10, 60000);
      if (retryAfter) {
        return res.status(429).json({ error: 'too_many_registration_attempts', retry_after: retryAfter });
      }
      
      const existingUsers = await db.query('SELECT COUNT(*) as count FROM admin_users');
      const isFirstAdmin = parseInt(existingUsers.rows[0].count) === 0;
      
      if (!isFirstAdmin) {
        const token = req.header('x-session-token');
        if (!token || !sessions.has(token)) {
          return res.status(401).json({ error: 'authentication_required' });
        }
        const session = sessions.get(token);
        if (!session.permissions.includes('users')) {
          return res.status(403).json({ error: 'forbidden', message: 'Access denied. Users module permission required.' });
        }
      }
      
      const { username, email, password } = req.body;
      
      if (!username || !email || !password) {
        return res.status(400).json({ error: 'username_email_password_required' });
      }
      
      if (password.length < 8) {
        return res.status(400).json({ error: 'password_min_8_chars' });
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ error: 'invalid_email_format' });
      }
      
      const usernameClean = username.trim().replace(/[^a-zA-Z0-9_-]/g, '');
      
      const passwordHash = hashPassword(password);
      
      if (!usernameClean || usernameClean.length < 3) {
        return res.status(400).json({ error: 'username_min_3_chars' });
      }
      
      const result = await db.query(
        'INSERT INTO admin_users(username, email, password_hash) VALUES($1, $2, $3) RETURNING id, username, email',
        [usernameClean, email.trim().toLowerCase(), passwordHash]
      );
      
      return res.json({ user: result.rows[0] });
    } catch (e) {
      if (String(e.message).includes('unique')) {
        return res.status(400).json({ error: 'username_or_email_exists' });
      }
      return res.status(500).json({ error: 'register_failed' });
    }
  });

  app.post('/api/auth/login', async function (req, res) {
    try {
      await ensureAdminUsersTable();
      
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      const retryAfter = rateLimit('login:' + ip);
      if (retryAfter) {
        return res.status(429).json({ error: 'too_many_attempts', retry_after: retryAfter });
      }
      
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: 'username_password_required' });
      }
      
      const result = await db.query(
        'SELECT id, username, email, password_hash, role_id FROM admin_users WHERE (username = $1 OR email = $1) AND is_active = TRUE',
        [username.trim()]
      );
      
      if (!result.rowCount) {
        return res.status(401).json({ error: 'invalid_credentials' });
      }
      
      const user = result.rows[0];
      
      if (!verifyPassword(password, user.password_hash)) {
        return res.status(401).json({ error: 'invalid_credentials' });
      }
      
      const sessionToken = generateSessionToken();
      let permissions = ALL_MODULES;
      if (user.role_id) {
        const permResult = await db.query('SELECT module FROM role_permissions WHERE role_id = $1', [user.role_id]);
        permissions = (permResult.rows || []).map(r => r.module);
      }
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      sessions.set(sessionToken, { id: user.id, username: user.username, email: user.email, role_id: user.role_id, permissions, expires_at: expiresAt });
      await db.query(
        'INSERT INTO admin_sessions(token, user_id, username, email, expires_at) VALUES($1, $2, $3, $4, $5) ON CONFLICT (token) DO UPDATE SET expires_at = $5',
        [sessionToken, user.id, user.username, user.email, expiresAt]
      );
      
      return res.json({ 
        token: sessionToken,
        user: { id: user.id, username: user.username, email: user.email, role_id: user.role_id, permissions }
      });
    } catch (e) {
      return res.status(500).json({ error: 'login_failed' });
    }
  });

  app.post('/api/auth/logout', requireAuth, async function (req, res) {
    const token = req.header('x-session-token');
    sessions.delete(token);
    await db.query('DELETE FROM admin_sessions WHERE token = $1', [token]);
    return res.json({ ok: true });
  });

  app.get('/api/auth/me', requireAuth, function (req, res) {
    return res.json({ user: req.adminUser });
  });
}

module.exports = { register };
