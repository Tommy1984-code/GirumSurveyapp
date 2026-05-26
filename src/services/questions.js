const db = require('../config/database');
const { normalizeQuestionType } = require('../utils/helpers');

async function fetchQuestions(args) {
  const includeInactive = args && args.includeInactive;
  const categoryFilter = args && args.category;
  
  let whereClause = 'is_deleted = FALSE';
  let params = [];
  if (!includeInactive) {
    whereClause += ' AND is_active = TRUE';
  }
  if (categoryFilter) {
    whereClause += ' AND category = $1';
    params.push(categoryFilter);
  }
  
  const rows = await db.query(
    `SELECT id, question_key, label, type, required, options, min_value, max_value, order_no, is_active, page_number, category
     FROM survey_questions
     WHERE ${whereClause}
     ORDER BY page_number ASC, order_no ASC, id ASC`,
    params
  );

  return rows.rows.map((r) => {
    let parsedLabel = r.label;
    if (typeof r.label === 'string') {
      try { parsedLabel = JSON.parse(r.label); } catch (e) { parsedLabel = { en: r.label, am: r.label }; }
    }
    if (typeof parsedLabel !== 'object' || parsedLabel === null) {
      parsedLabel = { en: String(r.label || ''), am: String(r.label || '') };
    }
    
    let parsedOptions = r.options;
    if (Array.isArray(r.options)) {
      parsedOptions = { en: r.options, am: r.options };
    } else if (typeof r.options === 'string') {
      try { parsedOptions = JSON.parse(r.options); } catch (e) { parsedOptions = { en: [], am: [] }; }
    }
    if (typeof parsedOptions !== 'object' || parsedOptions === null || Array.isArray(parsedOptions)) {
      parsedOptions = { en: Array.isArray(r.options) ? r.options : [], am: Array.isArray(r.options) ? r.options : [] };
    }

    return {
      id: Number(r.id),
      key: r.question_key,
      label: parsedLabel,
      type: normalizeQuestionType(r.type),
      required: Boolean(r.required),
      options: parsedOptions,
      min_value: r.min_value === null ? null : Number(r.min_value),
      max_value: r.max_value === null ? null : Number(r.max_value),
      order_no: Number(r.order_no),
      is_active: Boolean(r.is_active),
      page_number: Number(r.page_number) || 1,
      category: r.category || 'general'
    };
  });
}

async function upsertVisitGraph(payload) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      'INSERT INTO patients(id, patient_name) VALUES($1, $2) ON CONFLICT (id) DO UPDATE SET patient_name = EXCLUDED.patient_name',
      [payload.patient.id, payload.patient.patient_name]
    );

    await client.query(
      'INSERT INTO visits(id, patient_id) VALUES($1, $2) ON CONFLICT (id) DO UPDATE SET patient_id = EXCLUDED.patient_id',
      [payload.visit_id, payload.patient.id]
    );

    for (const doctor of payload.doctors) {
      await client.query(
        'INSERT INTO doctors(id, doctor_name) VALUES($1, $2) ON CONFLICT (id) DO UPDATE SET doctor_name = EXCLUDED.doctor_name',
        [doctor.id, doctor.doctor_name]
      );

      await client.query(
        'INSERT INTO visit_doctors(visit_id, doctor_id) VALUES($1, $2) ON CONFLICT (visit_id, doctor_id) DO NOTHING',
        [payload.visit_id, doctor.id]
      );
    }

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

async function createTokenRecord(args) {
  const crypto = require('crypto');
  const token = crypto.randomBytes(24).toString('base64url');
  const ttl = Number(process.env.TOKEN_TTL_HOURS || 48);
  const d = new Date();
  d.setHours(d.getHours() + ttl);
  const expiresAt = d.toISOString();
  const maxUses = Number(process.env.TOKEN_MAX_USES || 1);

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      'INSERT INTO survey_tokens(token, visit_id, patient_id, phone, expires_at, max_uses, used_count) VALUES($1, $2, $3, $4, $5, $6, 0)',
      [token, args.visitId, args.patientId, args.phone || null, expiresAt, maxUses]
    );

    for (const doctorId of args.doctorIds) {
      await client.query('INSERT INTO token_doctors(token, doctor_id) VALUES($1, $2)', [token, doctorId]);
    }

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }

  return { token, expiresAt, maxUses };
}

async function issueSurveyFromPayload(payload, phone, BASE_URL) {
  await upsertVisitGraph(payload);

  const tokenInfo = await createTokenRecord({
    visitId: payload.visit_id,
    patientId: payload.patient.id,
    doctorIds: payload.doctors.map(function (d) { return d.id; }),
    phone
  });

  const link = BASE_URL + '/survey?t=' + encodeURIComponent(tokenInfo.token);

  return {
    token: tokenInfo.token,
    link,
    expires_at: tokenInfo.expiresAt,
    max_uses: tokenInfo.maxUses
  };
}

module.exports = { fetchQuestions, upsertVisitGraph, createTokenRecord, issueSurveyFromPayload };
