const db = require('../config/database');
const { requireAuth, requireModule, sessions } = require('../middleware/auth');
const { ALL_MODULES } = require('../utils/constants');
const { hashPassword } = require('../utils/helpers');
const { logActivity } = require('../services/activity');
const { getAllSettings, setSetting } = require('../services/settings');
const { sendEmail } = require('../services/email');

function register(app) {
  app.get('/api/admin/users', requireAuth, requireModule('users'), async function (req, res) {
    try {
      const result = await db.query(`
        SELECT u.id, u.username, u.email, u.created_at, u.is_active, u.role_id,
               r.name AS role_name
        FROM admin_users u
        LEFT JOIN roles r ON r.id = u.role_id
        ORDER BY u.created_at DESC
      `);
      return res.json({ users: result.rows });
    } catch (e) {
      return res.status(500).json({ error: 'fetch_failed' });
    }
  });

  app.delete('/api/admin/users/:id', requireAuth, requireModule('users'), async function (req, res) {
    try {
      const id = Number(req.params.id);
      if (id === req.adminUser.id) {
        return res.status(400).json({ error: 'cannot_delete_self' });
      }
      await db.query('DELETE FROM admin_users WHERE id = $1', [id]);
      return res.json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: 'delete_failed' });
    }
  });

  app.patch('/api/admin/users/:id', requireAuth, requireModule('users'), async function (req, res) {
    try {
      const id = Number(req.params.id);
      const { username, email, password, is_active, role_id } = req.body;
      
      if (password && password.length < 8) {
        return res.status(400).json({ error: 'password_min_8_chars' });
      }
      
      const updates = [];
      const params = [];
      let idx = 1;
      
      if (username) {
        updates.push(`username = $${idx++}`);
        params.push(username.trim());
      }
      if (email) {
        updates.push(`email = $${idx++}`);
        params.push(email.trim().toLowerCase());
      }
      if (password) {
        updates.push(`password_hash = $${idx++}`);
        params.push(hashPassword(password));
      }
      if (is_active !== undefined) {
        updates.push(`is_active = $${idx++}`);
        params.push(Boolean(is_active));
        if (!Boolean(is_active)) {
          for (const [token, session] of sessions) {
            if (session.id === id) {
              sessions.delete(token);
            }
          }
        }
      }
      if (role_id !== undefined) {
        if (!req.adminUser.permissions.includes('roles')) {
          return res.status(403).json({ error: 'forbidden', message: 'Cannot change role without roles permission' });
        }
        updates.push(`role_id = $${idx++}`);
        params.push(role_id || null);
      }
      
      if (updates.length > 0) {
        params.push(id);
        await db.query(`UPDATE admin_users SET ${updates.join(', ')} WHERE id = $${idx}`, params);

        if (id === req.adminUser.id && role_id !== undefined) {
          const permResult = await db.query('SELECT module FROM role_permissions WHERE role_id = $1', [role_id || null]);
          const permissions = (permResult.rows || []).map(r => r.module);
          for (const [token, session] of sessions) {
            if (session.id === id) {
              sessions.set(token, { ...session, role_id, permissions });
              break;
            }
          }
        }
        
        await db.query(
          'INSERT INTO activity_logs(user_id, action, details) VALUES($1, $2, $3)',
          [req.adminUser.id, 'update_user', JSON.stringify({ user_id: id, username, changes: Object.keys({ username, email, password, is_active, role_id }).filter(k => ({ username, email, password, is_active, role_id }[k] !== undefined)) })]
        );
      }
      
      return res.json({ ok: true });
    } catch (e) {
      if (String(e.message).includes('unique')) {
        return res.status(400).json({ error: 'username_or_email_exists' });
      }
      return res.status(500).json({ error: 'update_failed' });
    }
  });

  app.get('/api/admin/roles', requireAuth, requireModule('roles'), async function (req, res) {
    try {
      const roles = await db.query(`
        SELECT r.id, r.name, r.created_at,
               COALESCE(json_agg(rp.module) FILTER (WHERE rp.module IS NOT NULL), '[]') AS permissions
        FROM roles r
        LEFT JOIN role_permissions rp ON rp.role_id = r.id
        GROUP BY r.id, r.name, r.created_at
        ORDER BY r.name
      `);
      return res.json({ roles: roles.rows });
    } catch (e) {
      return res.status(500).json({ error: 'fetch_failed' });
    }
  });

  app.post('/api/admin/roles', requireAuth, requireModule('roles'), async function (req, res) {
    try {
      const { name } = req.body;
      if (!name || name.trim().length < 2) {
        return res.status(400).json({ error: 'name_min_2_chars' });
      }
      const role = await db.query('INSERT INTO roles (name) VALUES ($1) RETURNING *', [name.trim()]);
      await logActivity(req.adminUser.id, 'create_role', { role_id: role.rows[0].id, name });
      return res.json({ role: { ...role.rows[0], permissions: [] } });
    } catch (e) {
      if (String(e.message).includes('unique')) {
        return res.status(400).json({ error: 'role_name_exists' });
      }
      return res.status(500).json({ error: 'create_failed' });
    }
  });

  app.patch('/api/admin/roles/:id', requireAuth, requireModule('roles'), async function (req, res) {
    try {
      const id = Number(req.params.id);
      const { name } = req.body;
      if (!name || name.trim().length < 2) {
        return res.status(400).json({ error: 'name_min_2_chars' });
      }
      await db.query('UPDATE roles SET name = $1 WHERE id = $2', [name.trim(), id]);
      await logActivity(req.adminUser.id, 'update_role', { role_id: id, name });
      return res.json({ ok: true });
    } catch (e) {
      if (String(e.message).includes('unique')) {
        return res.status(400).json({ error: 'role_name_exists' });
      }
      return res.status(500).json({ error: 'update_failed' });
    }
  });

  app.put('/api/admin/roles/:id/permissions', requireAuth, requireModule('roles'), async function (req, res) {
    try {
      const id = Number(req.params.id);
      const { modules } = req.body;
      if (!Array.isArray(modules)) {
        return res.status(400).json({ error: 'modules_array_required' });
      }
      await db.query('DELETE FROM role_permissions WHERE role_id = $1', [id]);
      if (modules.length > 0) {
        const placeholders = modules.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(', ');
        const params = modules.flatMap(m => [id, m]);
        await db.query(`INSERT INTO role_permissions (role_id, module) VALUES ${placeholders}`, params);
      }
      for (const [token, session] of sessions) {
        if (session.role_id === id) {
          sessions.set(token, { ...session, permissions: modules });
        }
      }
      await logActivity(req.adminUser.id, 'update_role_permissions', { role_id: id, modules });
      return res.json({ ok: true, permissions: modules });
    } catch (e) {
      return res.status(500).json({ error: 'update_failed' });
    }
  });

  app.delete('/api/admin/roles/:id', requireAuth, requireModule('roles'), async function (req, res) {
    try {
      const id = Number(req.params.id);
      const check = await db.query('SELECT id FROM roles WHERE id = $1', [id]);
      if (check.rowCount === 0) return res.status(404).json({ error: 'not_found' });
      await db.query('UPDATE admin_users SET role_id = NULL WHERE role_id = $1', [id]);
      await db.query('DELETE FROM roles WHERE id = $1', [id]);
      await logActivity(req.adminUser.id, 'delete_role', { role_id: id });
      return res.json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: 'delete_failed' });
    }
  });

  app.get('/api/admin/settings', requireAuth, requireModule('email-settings'), async function (req, res) {
    try {
      const settings = await getAllSettings();
      return res.json({ settings });
    } catch (e) {
      return res.status(500).json({ error: 'fetch_failed' });
    }
  });

  app.put('/api/admin/settings', requireAuth, requireModule('email-settings'), async function (req, res) {
    try {
      const { settings } = req.body;
      if (!settings || typeof settings !== 'object') {
        return res.status(400).json({ error: 'settings_object_required' });
      }
      const allowed = new Set(['smtp_host', 'smtp_port', 'smtp_secure', 'smtp_user', 'smtp_pass', 'smtp_from']);
      for (const [key, value] of Object.entries(settings)) {
        if (!allowed.has(key)) continue;
        if (typeof value !== 'string') continue;
        if (key === 'smtp_host' && value.length > 255) continue;
        if (key === 'smtp_port') {
          const port = parseInt(value);
          if (isNaN(port) || port < 1 || port > 65535) continue;
        }
        if (key === 'smtp_secure' && !['true', 'false'].includes(value)) continue;
        await setSetting(key, value);
      }
      await logActivity(req.adminUser.id, 'update_settings', { keys: Object.keys(settings).filter(k => allowed.has(k)) });
      const updated = await getAllSettings();
      return res.json({ settings: updated });
    } catch (e) {
      return res.status(500).json({ error: 'update_failed' });
    }
  });

  app.post('/api/admin/settings/test-email', requireAuth, requireModule('email-settings'), async function (req, res) {
    try {
      const result = await sendEmail({
        to: req.adminUser.email,
        subject: 'Test Email from Patient Feedback System',
        html: '<h2>SMTP Configuration Test</h2><p>If you receive this email, your SMTP settings are working correctly.</p>'
      });
      if (result.ok) {
        return res.json({ message: 'Test email sent to ' + req.adminUser.email });
      }
      return res.status(400).json({ error: result.error || 'test_email_failed' });
    } catch (e) {
      return res.status(500).json({ error: 'test_email_failed' });
    }
  });

  app.get('/api/admin/activity-logs', requireAuth, requireModule('activity'), async function (req, res) {
    try {
      const dateFrom = String(req.query.date_from || '').trim();
      const dateTo = String(req.query.date_to || '').trim();
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 5));
      const offset = (page - 1) * limit;

      const conditions = [];
      const params = [];
      let paramIdx = 1;

      if (dateFrom) {
        conditions.push(`al.created_at >= $${paramIdx}`);
        params.push(dateFrom);
        paramIdx++;
      }

      if (dateTo) {
        conditions.push(`al.created_at <= $${paramIdx}`);
        params.push(dateTo + 'T23:59:59.999');
        paramIdx++;
      }

      const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

      const countResult = await db.query(`SELECT COUNT(*) FROM activity_logs al ${whereClause}`, params);
      const total = parseInt(countResult.rows[0].count);

      const result = await db.query(`
        SELECT al.*, au.username 
        FROM activity_logs al 
        LEFT JOIN admin_users au ON au.id = al.user_id 
        ${whereClause}
        ORDER BY al.created_at DESC 
        LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
      `, [...params, limit, offset]);

      return res.json({
        logs: result.rows,
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit)
      });
    } catch (e) {
      return res.status(500).json({ error: 'fetch_failed' });
    }
  });
}

module.exports = { register };
