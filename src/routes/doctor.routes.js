const db = require('../config/database');
const { requireAuth, requireModule } = require('../middleware/auth');
const doctorsService = require('../services/doctors');
const { textOrEmpty, sanitizeText } = require('../utils/helpers');
const { logActivity } = require('../services/activity');

function register(app) {
  app.get('/api/doctors', requireAuth, requireModule('doctors'), async (req, res) => {
    try {
      const search = String(req.query.search || '').trim();
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
      const active = ['active', 'inactive'].includes(req.query.active) ? req.query.active : 'all';
      
      const result = await doctorsService.getDoctorsPaginated({ search, page, limit, active });
      res.json(result);
    } catch (e) {
      return res.status(500).json({ error: 'fetch_failed' });
    }
  });

  app.post('/api/doctors', requireAuth, requireModule('doctors'), async (req, res) => {
    try {
      const doctor = await doctorsService.createDoctor(req.body);
      await logActivity(req.adminUser.id, 'create_doctor', { doctor_id: doctor.id });
      res.json({ doctor });
    } catch (e) {
      if (['doctor_name_required', 'doctor_name_too_short', 'doctor_name_too_long', 'invalid_email_format', 'department_too_long', 'duplicate_email'].includes(e.message)) {
        return res.status(400).json({ error: e.message });
      }
      res.status(500).json({ error: 'create_failed' });
    }
  });

  app.patch('/api/doctors/:id', requireAuth, requireModule('doctors'), async (req, res) => {
    try {
      const doctor = await doctorsService.updateDoctor(req.params.id, req.body);
      if (!doctor) return res.status(404).json({ error: 'doctor_not_found' });
      await logActivity(req.adminUser.id, 'update_doctor', { doctor_id: doctor.id });
      res.json({ doctor });
    } catch (e) {
      if (['doctor_name_too_short', 'doctor_name_too_long', 'invalid_email_format', 'department_too_long', 'duplicate_email'].includes(e.message)) {
        return res.status(400).json({ error: e.message });
      }
      res.status(500).json({ error: 'update_failed' });
    }
  });

  app.delete('/api/doctors/:id', requireAuth, requireModule('doctors'), async (req, res) => {
    try {
      const deleted = await doctorsService.deleteDoctor(req.params.id);
      if (!deleted) return res.status(404).json({ error: 'doctor_not_found' });
      await logActivity(req.adminUser.id, 'delete_doctor', { doctor_id: req.params.id });
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: 'delete_failed' });
    }
  });

  app.get('/api/doctors/list', requireAuth, requireModule('doctors'), async function (_req, res) {
    try {
      const rows = await db.query(`
        SELECT DISTINCT unnest(fs.selected_doctor_ids) as doctor_id, 
               unnest(fs.selected_doctor_names) as doctor_name
        FROM feedback_submissions fs
        WHERE fs.selected_doctor_ids IS NOT NULL
        ORDER BY doctor_name ASC
      `);
      return res.json({ doctors: rows.rows });
    } catch (e) {
      return res.status(500).json({ error: 'fetch_failed' });
    }
  });

  app.post('/api/doctors/upsert', requireAuth, requireModule('doctors'), async function (req, res) {
    try {
      const crypto = require('crypto');
      function makeId(prefix) {
        return prefix + '-' + Date.now().toString(36) + '-' + crypto.randomBytes(3).toString('hex');
      }
      const id = textOrEmpty(req.body.id) || makeId('D');
      const name = textOrEmpty(req.body.name);
      if (!name) return res.status(400).json({ error: 'doctor_name_required' });

      const row = await db.query(
        'INSERT INTO doctors(id, name) VALUES($1, $2) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name RETURNING id, name',
        [id, name]
      );

      return res.json({ doctor: row.rows[0] });
    } catch (e) {
      return res.status(500).json({ error: 'doctor_upsert_failed' });
    }
  });

}

module.exports = { register };
