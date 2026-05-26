const db = require('../config/database');
const { requireAuth, requireModule } = require('../middleware/auth');
const { normalizeQuestionInput } = require('../utils/helpers');
const { QUESTION_TYPES } = require('../utils/constants');
const { logActivity } = require('../services/activity');
const { fetchQuestions } = require('../services/questions');
const { ensureQuestionsTableAndDefaults } = require('../services/bootstrap');

function register(app) {
  app.get('/api/questions', requireAuth, requireModule('questions'), async function (req, res) {
    try {
      await ensureQuestionsTableAndDefaults();
      const includeInactive = String(req.query.all || '').toLowerCase() === 'true';
      const questions = await fetchQuestions({ includeInactive });
      return res.json({ count: questions.length, questions });
    } catch (e) {
      console.error('Questions fetch error:', e);
      return res.status(500).json({ error: 'questions_fetch_failed' });
    }
  });

  app.post('/api/questions', requireAuth, requireModule('questions'), async function (req, res) {
    try {
      await ensureQuestionsTableAndDefaults();
      const normalized = normalizeQuestionInput(req.body, QUESTION_TYPES);
      if (normalized.error) return res.status(400).json({ error: normalized.error });

      const q = normalized.question;
      const orderNo = Number.isInteger(req.body.order_no)
        ? req.body.order_no
        : (await db.query('SELECT COALESCE(MAX(order_no), 0) + 1 AS next_order FROM survey_questions WHERE is_deleted = FALSE')).rows[0].next_order;

      const pageNum = Number.isInteger(req.body.page_number) && req.body.page_number >= 1 ? req.body.page_number : 1;
      const inserted = await db.query(
        'INSERT INTO survey_questions(question_key, label, type, required, options, min_value, max_value, order_no, is_active, is_deleted, page_number, category) VALUES($1,$2::jsonb,$3,$4,$5::jsonb,$6,$7,$8,$9,FALSE,$10,$11) RETURNING id, question_key, label, type, required, options, min_value, max_value, order_no, is_active, page_number, category',
        [q.key, JSON.stringify(q.label), q.type, q.required, JSON.stringify(q.options), q.min_value, q.max_value, orderNo, q.is_active, pageNum, q.category]
      );

      await logActivity(req.adminUser.id, 'create_question', { question_id: inserted.rows[0].id, label: q.label });
      return res.json({ question: inserted.rows[0] });
    } catch (e) {
      if (String(e.message || '').toLowerCase().includes('unique')) {
        return res.status(400).json({ error: 'question_key_already_exists' });
      }
      return res.status(500).json({ error: 'question_create_failed' });
    }
  });

  app.patch('/api/questions/:id', requireAuth, requireModule('questions'), async function (req, res) {
    try {
      await ensureQuestionsTableAndDefaults();
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'invalid_question_id' });

      const current = await db.query('SELECT * FROM survey_questions WHERE id = $1 AND is_deleted = FALSE', [id]);
      if (!current.rowCount) return res.status(404).json({ error: 'question_not_found' });

      const source = current.rows[0];
      let sourceLabel = source.label;
      if (typeof sourceLabel === 'string') {
        try { sourceLabel = JSON.parse(sourceLabel); } catch (e) { sourceLabel = { en: sourceLabel, am: sourceLabel }; }
      }
      let sourceOptions = source.options;
      if (Array.isArray(sourceOptions)) {
        sourceOptions = { en: sourceOptions, am: sourceOptions };
      } else if (typeof sourceOptions === 'string') {
        try { sourceOptions = JSON.parse(sourceOptions); } catch (e) { sourceOptions = { en: [], am: [] }; }
      }
      if (typeof sourceOptions !== 'object' || sourceOptions === null) {
        sourceOptions = { en: [], am: [] };
      }

      const helpers = require('../utils/helpers');
      const merged = {
        key: helpers.textOrEmpty(req.body.key) || source.question_key,
        label: {
          en: helpers.textOrEmpty(req.body.label_en || req.body.label) || (sourceLabel.en || sourceLabel),
          am: helpers.textOrEmpty(req.body.label_am) || (sourceLabel.am || sourceLabel.en || sourceLabel),
          om: helpers.textOrEmpty(req.body.label_om) || (sourceLabel.om || sourceLabel.en || sourceLabel)
        },
        type: helpers.normalizeQuestionType(req.body.type || source.type),
        required: req.body.required === undefined ? source.required : Boolean(req.body.required),
        options: {
          en: Array.isArray(req.body.options_en || req.body.options)
            ? (req.body.options_en || req.body.options).map(helpers.textOrEmpty).filter(Boolean)
            : (sourceOptions.en || []),
          am: Array.isArray(req.body.options_am)
            ? req.body.options_am.map(helpers.textOrEmpty).filter(Boolean)
            : (sourceOptions.am || sourceOptions.en || []),
          om: Array.isArray(req.body.options_om)
            ? req.body.options_om.map(helpers.textOrEmpty).filter(Boolean)
            : (sourceOptions.om || sourceOptions.en || [])
        },
        min_value: req.body.min === undefined ? source.min_value : Number(req.body.min),
        max_value: req.body.max === undefined ? source.max_value : Number(req.body.max),
        order_no: req.body.order_no === undefined ? source.order_no : Number(req.body.order_no),
        is_active: req.body.is_active === undefined ? source.is_active : Boolean(req.body.is_active),
        page_number: req.body.page_number === undefined ? Number(source.page_number) || 1 : Number(req.body.page_number),
        category: req.body.category === 'doctor' ? 'doctor' : (req.body.category === 'general' ? 'general' : (source.category || 'general'))
      };

      if (!QUESTION_TYPES.has(merged.type)) return res.status(400).json({ error: 'invalid_question_type' });
      if ((merged.type === 'single_choice' || merged.type === 'multi_choice') && (!merged.options.en || merged.options.en.length === 0)) {
        return res.status(400).json({ error: 'options_required_for_choice_type' });
      }

      const updated = await db.query(
        'UPDATE survey_questions SET question_key=$1,label=$2::jsonb,type=$3,required=$4,options=$5::jsonb,min_value=$6,max_value=$7,order_no=$8,is_active=$9,page_number=$10,category=$11,updated_at=NOW() WHERE id=$12 RETURNING id, question_key, label, type, required, options, min_value, max_value, order_no, is_active, page_number, category',
        [merged.key, JSON.stringify(merged.label), merged.type, merged.required, JSON.stringify(merged.options || { en: [], am: [] }), merged.min_value, merged.max_value, merged.order_no, merged.is_active, merged.page_number, merged.category, id]
      );

      await logActivity(req.adminUser.id, 'update_question', { question_id: id, label: merged.label });
      return res.json({ question: updated.rows[0] });
    } catch (e) {
      if (String(e.message || '').toLowerCase().includes('unique')) {
        return res.status(400).json({ error: 'question_key_already_exists' });
      }
      return res.status(500).json({ error: 'question_update_failed' });
    }
  });

  app.delete('/api/questions/:id', requireAuth, requireModule('questions'), async function (req, res) {
    try {
      await ensureQuestionsTableAndDefaults();
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'invalid_question_id' });

      const out = await db.query(
        'DELETE FROM survey_questions WHERE id = $1 RETURNING id',
        [id]
      );

      if (!out.rowCount) return res.status(404).json({ error: 'question_not_found' });
      await logActivity(req.adminUser.id, 'delete_question', { question_id: id });
      return res.json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: 'question_delete_failed' });
    }
  });

  app.post('/api/questions/reorder', requireAuth, requireModule('questions'), async function (req, res) {
    try {
      await ensureQuestionsTableAndDefaults();
      const ids = Array.isArray(req.body.ids) ? req.body.ids.map((x) => Number(x)).filter((x) => Number.isInteger(x) && x > 0) : [];
      if (!ids.length) return res.status(400).json({ error: 'ids_required' });

      const client = await db.pool.connect();
      try {
        await client.query('BEGIN');
        for (let i = 0; i < ids.length; i += 1) {
          await client.query('UPDATE survey_questions SET order_no=$1, updated_at=NOW() WHERE id=$2 AND is_deleted=FALSE', [i + 1, ids[i]]);
        }
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }

      return res.json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: 'questions_reorder_failed' });
    }
  });
}

module.exports = { register };
