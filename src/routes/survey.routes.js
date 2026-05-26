const db = require('../config/database');
const surveyService = require('../services/survey');
const { fetchQuestions, issueSurveyFromPayload } = require('../services/questions');
const { sendSms } = require('../services/sms');
const { textOrEmpty, sanitizeText, normalizeRegistrationBody } = require('../utils/helpers');
const { validateQuestionAnswers } = require('../utils/validators');
const { requireAuth } = require('../middleware/auth');

function register(app, BASE_URL) {
  app.post('/api/survey/start', async (req, res) => {
    try {
      const tokenData = await surveyService.createToken();
      res.json({
        token: tokenData.token,
        expires_at: tokenData.expiresAt
      });
    } catch (e) {
      res.status(500).json({ error: 'token_generation_failed' });
    }
  });

  app.get('/api/survey', async (req, res) => {
    const token = req.query.token || req.query.t;
    
    if (!token) {
      return res.status(400).json({ error: 'token_required' });
    }
    
    const validation = await surveyService.validateToken(token);
    if (validation.error) {
      return res.status(400).json({ error: validation.error });
    }

    const encounter = await db.query(
      `SELECT e.id, e.patient_id, p.name AS patient_name, p.phone AS patient_phone
       FROM encounters e
       JOIN patients p ON p.id = e.patient_id
       WHERE e.survey_token = $1`,
      [token]
    );

    let doctors = [];
    let patientName = '';

    if (encounter.rows[0]) {
      patientName = encounter.rows[0].patient_name || '';
      const doctorRows = await db.query(
        `SELECT d.id, d.name, d.department, d.image_url
         FROM encounter_doctors ed
         JOIN doctors d ON d.id = ed.doctor_id
         WHERE ed.encounter_id = $1 AND d.is_active = TRUE
         ORDER BY d.name ASC`,
        [encounter.rows[0].id]
      );
      doctors = doctorRows.rows;
    }
    
    const { ensureQuestionsTableAndDefaults } = require('../services/bootstrap');
    await ensureQuestionsTableAndDefaults();
    const doctorQuestions = await fetchQuestions({ includeInactive: false, category: 'doctor' });
    const generalQuestions = await fetchQuestions({ includeInactive: false, category: 'general' });
    
    return res.json({
      patient_name: patientName,
      doctors: doctors.map(d => ({
        id: d.id,
        name: d.name,
        department: d.department,
        image_url: d.image_url
      })),
      doctor_questions: doctorQuestions.map(q => ({
        id: q.key,
        type: q.type,
        label: q.label,
        required: q.required,
        options: q.options,
        min: q.min_value,
        max: q.max_value,
        page_number: q.page_number
      })),
      general_questions: generalQuestions.map(q => ({
        id: q.key,
        type: q.type,
        label: q.label,
        required: q.required,
        options: q.options,
        min: q.min_value,
        max: q.max_value,
        page_number: q.page_number
      }))
    });
  });

  app.post('/api/feedback', async (req, res) => {
    try {
      const token = req.body.token;
      const questionAnswers = req.body.question_answers || {};
      const language = req.body.language || 'am';
      const patientName = sanitizeText(req.body.patient_name || '');
      const selectedDoctorIds = req.body.selected_doctor_ids || [];
      const selectedDoctorNames = (req.body.selected_doctor_names || []).map(n => sanitizeText(n));

      if (!token) return res.status(400).json({ error: 'token_required' });
      if (!selectedDoctorIds.length) return res.status(400).json({ error: 'at_least_one_doctor_required' });
      if (!questionAnswers || typeof questionAnswers !== 'object' || Array.isArray(questionAnswers)) {
        return res.status(400).json({ error: 'invalid_question_answers' });
      }
      const answersSize = new TextEncoder().encode(JSON.stringify(questionAnswers)).length;
      if (answersSize > 512000) return res.status(400).json({ error: 'question_answers_too_large' });
      if (!Array.isArray(selectedDoctorIds) || selectedDoctorIds.some(id => typeof id !== 'string')) {
        return res.status(400).json({ error: 'invalid_doctor_ids' });
      }

      const validation = await surveyService.validateToken(token);
      if (validation.error) {
        return res.status(400).json({ error: validation.error });
      }

      const client = await db.pool.connect();
      try {
        await client.query('BEGIN');

        const usedCheck = await client.query('SELECT used_at FROM survey_tokens WHERE token = $1 FOR UPDATE', [token]);
        if (usedCheck.rows[0]?.used_at) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'token_already_used' });
        }

        await client.query(
          `INSERT INTO feedback_submissions 
           (token, patient_name, selected_doctor_ids, selected_doctor_names, question_answers, language) 
           VALUES ($1, $2, $3, $4, $5::jsonb, $6)`,
          [token, patientName, selectedDoctorIds, selectedDoctorNames, JSON.stringify(questionAnswers), language]
        );

        await client.query(
          'UPDATE survey_tokens SET used_at = NOW() WHERE token = $1',
          [token]
        );

        await client.query('COMMIT');
      } catch (txErr) {
        await client.query('ROLLBACK');
        throw txErr;
      } finally {
        client.release();
      }

      return res.json({ ok: true });
    } catch (e) {
      if (e.message && e.message.includes('duplicate key')) {
        return res.status(400).json({ error: 'token_already_used' });
      }
      res.status(500).json({ error: 'feedback_failed' });
    }
  });

  app.post('/api/register/visit', requireAuth, async function (req, res) {
    try {
      const normalized = normalizeRegistrationBody(req.body);
      if (normalized.error) return res.status(400).json({ error: normalized.error });

      const payload = normalized.payload;
      const out = await issueSurveyFromPayload(payload, normalized.phone, BASE_URL);

      let sms = { ok: false, skipped: true, reason: 'no_phone_provided' };
      if (normalized.phone) {
        sms = await sendSms({ to: normalized.phone, message: 'Please provide feedback: ' + out.link });
      }

      return res.json({
        ...out,
        visit: {
          visit_id: payload.visit_id,
          patient: payload.patient,
          doctors: payload.doctors
        },
        sms
      });
    } catch (e) {
      return res.status(500).json({ error: 'register_visit_failed' });
    }
  });

  app.get('/api/visits/:visitId', async function (req, res) {
    try {
      const visitId = req.params.visitId;

      const visit = await db.query(
        'SELECT v.id AS visit_id, v.created_at, p.id AS patient_id, p.patient_name FROM visits v JOIN patients p ON p.id = v.patient_id WHERE v.id = $1',
        [visitId]
      );

      if (!visit.rowCount) return res.status(404).json({ error: 'visit_not_found' });

      const doctors = await db.query(
        'SELECT d.id, d.doctor_name FROM visit_doctors vd JOIN doctors d ON d.id = vd.doctor_id WHERE vd.visit_id = $1 ORDER BY d.doctor_name ASC',
        [visitId]
      );

      return res.json({ visit: visit.rows[0], doctors: doctors.rows });
    } catch (e) {
      return res.status(500).json({ error: 'visit_fetch_failed' });
    }
  });
}

module.exports = { register };
