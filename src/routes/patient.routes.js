const db = require('../config/database');
const { requireAuth, requireModule } = require('../middleware/auth');
const patientsService = require('../services/patients');
const { textOrEmpty } = require('../utils/helpers');
const { logActivity } = require('../services/activity');

function register(app) {
  app.get('/api/patients', requireAuth, requireModule('patients'), async (req, res) => {
    try {
      const search = String(req.query.search || '').trim();
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
      const result = await patientsService.getPatientsPaginated({ search, page, limit });
      res.json(result);
    } catch (e) {
      res.status(500).json({ error: 'fetch_failed' });
    }
  });

  app.post('/api/patients', requireAuth, requireModule('patients'), async (req, res) => {
    try {
      const { name, phone } = req.body;
      const patient = await patientsService.createPatient({ name, phone });
      await logActivity(req.adminUser.id, 'create_patient', { patient_id: patient.id });
      res.json({ patient });
    } catch (e) {
      if (['patient_name_required', 'patient_name_too_short', 'patient_name_too_long', 'invalid_phone_format', 'phone_required', 'duplicate_phone'].includes(e.message)) {
        return res.status(400).json({ error: e.message });
      }
      res.status(500).json({ error: 'create_failed' });
    }
  });

  app.patch('/api/patients/:id', requireAuth, requireModule('patients'), async (req, res) => {
    try {
      const patient = await patientsService.updatePatient(req.params.id, req.body);
      if (!patient) return res.status(404).json({ error: 'patient_not_found' });
      await logActivity(req.adminUser.id, 'update_patient', { patient_id: patient.id });
      res.json({ patient });
    } catch (e) {
      if (['patient_name_too_short', 'patient_name_too_long', 'invalid_phone_format', 'phone_required', 'duplicate_phone'].includes(e.message)) {
        return res.status(400).json({ error: e.message });
      }
      res.status(500).json({ error: 'update_failed' });
    }
  });

  app.delete('/api/patients/:id', requireAuth, requireModule('patients'), async (req, res) => {
    try {
      const deleted = await patientsService.deletePatient(req.params.id);
      if (!deleted) return res.status(404).json({ error: 'patient_not_found' });
      await logActivity(req.adminUser.id, 'delete_patient', { patient_id: req.params.id });
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: 'delete_failed' });
    }
  });

  app.post('/api/patients/upsert', requireAuth, requireModule('patients'), async function (req, res) {
    try {
      const crypto = require('crypto');
      function makeId(prefix) {
        return prefix + '-' + Date.now().toString(36) + '-' + crypto.randomBytes(3).toString('hex');
      }
      const id = textOrEmpty(req.body.id) || makeId('P');
      const name = textOrEmpty(req.body.name);
      if (!name) return res.status(400).json({ error: 'patient_name_required' });

      const row = await db.query(
        'INSERT INTO patients(id, name) VALUES($1, $2) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name RETURNING id, name',
        [id, name]
      );

      return res.json({ patient: row.rows[0] });
    } catch (e) {
      return res.status(500).json({ error: 'patient_upsert_failed' });
    }
  });

}

module.exports = { register };
