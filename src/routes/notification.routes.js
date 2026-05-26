const db = require('../config/database');
const { requireAuth, requireModule } = require('../middleware/auth');

function register(app) {
  app.get('/api/notifications/last-seen', requireAuth, requireModule('dashboard'), async function (req, res) {
    try {
      const result = await db.query(
        `SELECT last_seen_submission_id FROM admin_notification_seen WHERE admin_id = $1`,
        [req.adminUser.id]
      );
      const lastSeen = result.rows.length > 0 ? Number(result.rows[0].last_seen_submission_id) : 0;
      return res.json({ last_seen_submission_id: lastSeen });
    } catch (e) {
      console.error('Get last-seen error:', e);
      return res.status(500).json({ error: 'server_error' });
    }
  });

  app.post('/api/notifications/mark-seen', requireAuth, requireModule('dashboard'), async function (req, res) {
    try {
      const { last_seen_submission_id } = req.body;
      if (!last_seen_submission_id || typeof last_seen_submission_id !== 'number') {
        return res.status(400).json({ error: 'invalid_last_seen_submission_id' });
      }
      await db.query(
        `INSERT INTO admin_notification_seen (admin_id, last_seen_submission_id, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (admin_id)
         DO UPDATE SET last_seen_submission_id = GREATEST(admin_notification_seen.last_seen_submission_id, $2), updated_at = NOW()`,
        [req.adminUser.id, last_seen_submission_id]
      );
      return res.json({ ok: true });
    } catch (e) {
      console.error('Mark-seen error:', e);
      return res.status(500).json({ error: 'server_error' });
    }
  });
}

module.exports = { register };
