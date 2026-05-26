const { requireAuth, requireModule } = require('../middleware/auth');
const encountersService = require('../services/encounters');
const { logActivity } = require('../services/activity');

function register(app) {
  app.get('/api/encounters', requireAuth, requireModule('encounters'), async (req, res) => {
    try {
      const search = String(req.query.search || '').trim();
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
      const dateFrom = String(req.query.date_from || '').trim();
      const dateTo = String(req.query.date_to || '').trim();
      const surveyStatus = String(req.query.survey_status || '').trim();
      const result = await encountersService.getEncountersPaginated({ search, page, limit, dateFrom, dateTo, surveyStatus });
      res.json(result);
    } catch (e) {
      res.status(500).json({ error: 'fetch_failed' });
    }
  });

  app.get('/api/encounters/:id', requireAuth, requireModule('encounters'), async (req, res) => {
    try {
      const encounter = await encountersService.getEncounterById(req.params.id);
      if (!encounter) return res.status(404).json({ error: 'encounter_not_found' });
      res.json({ encounter });
    } catch (e) {
      res.status(500).json({ error: 'fetch_failed' });
    }
  });

  app.post('/api/encounters', requireAuth, requireModule('encounters'), async (req, res) => {
    try {
      const { patient_id, doctor_ids, status } = req.body;
      const encounter = await encountersService.createEncounter({ patient_id, doctor_ids, status });
      await logActivity(req.adminUser.id, 'create_encounter', { encounter_id: encounter.id });
      res.json({ encounter });
    } catch (e) {
      if (e.message === 'patient_required' || e.message === 'at_least_one_doctor_required') {
        return res.status(400).json({ error: e.message });
      }
      res.status(500).json({ error: 'create_failed' });
    }
  });

  app.patch('/api/encounters/:id/finish', requireAuth, requireModule('encounters'), async (req, res) => {
    try {
      const encounter = await encountersService.finishEncounter(req.params.id);
      await logActivity(req.adminUser.id, 'finish_encounter', { encounter_id: encounter.id });
      res.json({ encounter });
    } catch (e) {
      if (e.message === 'encounter_not_found') return res.status(404).json({ error: e.message });
      if (e.message === 'already_finished') return res.status(400).json({ error: e.message });
      if (e.message === 'no_doctors_assigned') return res.status(400).json({ error: e.message });
      res.status(500).json({ error: 'finish_failed' });
    }
  });

  app.post('/api/encounters/:id/send-sms', requireAuth, requireModule('encounters'), async (req, res) => {
    try {
      const result = await encountersService.sendSurveySms(req.params.id);
      await logActivity(req.adminUser.id, 'send_survey_sms', { encounter_id: req.params.id, provider: result.provider });
      res.json(result);
    } catch (e) {
      if (e.message === 'encounter_not_found') return res.status(404).json({ error: e.message });
      if (e.message === 'encounter_not_finished') return res.status(400).json({ error: e.message });
      if (e.message === 'survey_already_sent') return res.status(400).json({ error: e.message });
      if (e.message === 'patient_no_phone') return res.status(400).json({ error: e.message });
      console.error('send-sms error:', e);
      res.status(500).json({ error: 'send_sms_failed' });
    }
  });

  app.post('/api/encounters/send-all-sms', requireAuth, requireModule('encounters'), async (req, res) => {
    try {
      const ids = req.body.ids || null;
      const result = await encountersService.sendAllSurveySms(ids);
      await logActivity(req.adminUser.id, 'send_all_survey_sms', { sent: result.sent, failed: result.failed });
      res.json(result);
    } catch (e) {
      console.error('send-all-sms error:', e);
      res.status(500).json({ error: 'send_all_sms_failed' });
    }
  });

  app.delete('/api/encounters/:id', requireAuth, requireModule('encounters'), async (req, res) => {
    try {
      const deleted = await encountersService.deleteEncounter(req.params.id);
      if (!deleted) return res.status(404).json({ error: 'encounter_not_found' });
      await logActivity(req.adminUser.id, 'delete_encounter', { encounter_id: req.params.id });
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: 'delete_failed' });
    }
  });

  app.post('/api/encounters/delete-bulk', requireAuth, requireModule('encounters'), async (req, res) => {
    try {
      const ids = req.body.ids;
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'ids_required' });
      }
      const deleted = await encountersService.bulkDeleteEncounters(ids);
      await logActivity(req.adminUser.id, 'bulk_delete_encounters', { count: deleted });
      res.json({ deleted });
    } catch (e) {
      res.status(500).json({ error: 'bulk_delete_failed' });
    }
  });
}

module.exports = { register };
