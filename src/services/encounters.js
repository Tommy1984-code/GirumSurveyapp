const db = require('../db');
const surveyService = require('./survey');
const smsService = require('./sms');

function makeId(prefix) {
  const crypto = require('crypto');
  return prefix + '-' + Date.now().toString(36) + '-' + crypto.randomBytes(3).toString('hex');
}

function buildDateClause(dateFrom, dateTo, startIndex = 1) {
  const clauses = [];
  const params = [];
  let idx = startIndex;
  if (dateFrom) {
    clauses.push(`e.created_at >= $${idx}`);
    params.push(dateFrom + 'T00:00:00.000Z');
    idx++;
  }
  if (dateTo) {
    clauses.push(`e.created_at <= $${idx}`);
    params.push(dateTo + 'T23:59:59.999');
    idx++;
  }
  return { clause: clauses.length ? 'AND ' + clauses.join(' AND ') : '', params };
}

async function getEncountersPaginated({ search = '', page = 1, limit = 10, dateFrom, dateTo, surveyStatus }) {
  const offset = (page - 1) * limit;
  const searchPattern = '%' + search.toLowerCase() + '%';
  const dateFilter = buildDateClause(dateFrom, dateTo, 2);
  const dateParamCount = dateFilter.params.length;

  const searchClause = `($1 = '' OR LOWER(p.name) LIKE $1 OR LOWER(p.phone) LIKE $1 OR LOWER(e.id) LIKE $1 OR EXISTS (SELECT 1 FROM encounter_doctors ed2 JOIN doctors d2 ON d2.id = ed2.doctor_id WHERE ed2.encounter_id = e.id AND LOWER(d2.name) LIKE $1))`;

  let surveyClause = '';
  if (surveyStatus === 'filled') {
    surveyClause = 'AND EXISTS (SELECT 1 FROM feedback_submissions fs WHERE fs.token = e.survey_token)';
  } else if (surveyStatus === 'not_filled') {
    surveyClause = 'AND NOT EXISTS (SELECT 1 FROM feedback_submissions fs WHERE fs.token = e.survey_token)';
  }

  const countResult = await db.query(
    `SELECT COUNT(*) as total FROM encounters e
     JOIN patients p ON p.id = e.patient_id
     WHERE ${searchClause} ${dateFilter.clause} ${surveyClause}`,
    [searchPattern, ...dateFilter.params]
  );
  const total = parseInt(countResult.rows[0].total);

  const result = await db.query(
    `SELECT e.*, p.name AS patient_name, p.phone AS patient_phone,
      EXISTS (SELECT 1 FROM feedback_submissions fs WHERE fs.token = e.survey_token) AS survey_filled
     FROM encounters e
     JOIN patients p ON p.id = e.patient_id
     WHERE ${searchClause} ${dateFilter.clause} ${surveyClause}
     ORDER BY e.created_at DESC
     LIMIT $${1 + 1 + dateParamCount} OFFSET $${1 + 1 + dateParamCount + 1}`,
    [searchPattern, ...dateFilter.params, limit, offset]
  );

  const inProgressResult = await db.query(
    `SELECT COUNT(*) as count FROM encounters e
     JOIN patients p ON p.id = e.patient_id
     WHERE ${searchClause} ${dateFilter.clause} ${surveyClause}
     AND e.status = 'in_progress'`,
    [searchPattern, ...dateFilter.params]
  );

  const finishedResult = await db.query(
    `SELECT COUNT(*) as count FROM encounters e
     JOIN patients p ON p.id = e.patient_id
     WHERE ${searchClause} ${dateFilter.clause} ${surveyClause}
     AND e.status = 'finished'`,
    [searchPattern, ...dateFilter.params]
  );

  const surveyFilledResult = await db.query(
    `SELECT COUNT(*) as count FROM encounters e
     JOIN patients p ON p.id = e.patient_id
     WHERE ${searchClause} ${dateFilter.clause} ${surveyClause}
     AND EXISTS (SELECT 1 FROM feedback_submissions fs WHERE fs.token = e.survey_token)`,
    [searchPattern, ...dateFilter.params]
  );

  const surveyNotFilledResult = await db.query(
    `SELECT COUNT(*) as count FROM encounters e
     JOIN patients p ON p.id = e.patient_id
     WHERE ${searchClause} ${dateFilter.clause} ${surveyClause}
     AND NOT EXISTS (SELECT 1 FROM feedback_submissions fs WHERE fs.token = e.survey_token)`,
    [searchPattern, ...dateFilter.params]
  );

  const encounters = [];
  for (const row of result.rows) {
    const doctorsResult = await db.query(
      `SELECT d.id, d.name, d.department, d.image_url
       FROM encounter_doctors ed
       JOIN doctors d ON d.id = ed.doctor_id
       WHERE ed.encounter_id = $1`,
      [row.id]
    );
    encounters.push({
      ...row,
      doctors: doctorsResult.rows
    });
  }

  return {
    encounters,
    total,
    in_progress: parseInt(inProgressResult.rows[0].count),
    finished: parseInt(finishedResult.rows[0].count),
    survey_filled: parseInt(surveyFilledResult.rows[0].count),
    survey_not_filled: parseInt(surveyNotFilledResult.rows[0].count),
    page,
    limit,
    total_pages: Math.ceil(total / limit)
  };
}

async function getEncounterById(id) {
  const result = await db.query(
    `SELECT e.*, p.name AS patient_name, p.phone AS patient_phone
     FROM encounters e
     JOIN patients p ON p.id = e.patient_id
     WHERE e.id = $1`,
    [id]
  );
  if (!result.rows[0]) return null;

  const doctorsResult = await db.query(
    `SELECT d.id, d.name, d.department, d.image_url
     FROM encounter_doctors ed
     JOIN doctors d ON d.id = ed.doctor_id
     WHERE ed.encounter_id = $1`,
    [id]
  );

  return { ...result.rows[0], doctors: doctorsResult.rows };
}

async function createEncounter({ patient_id, doctor_ids }) {
  if (!patient_id) throw new Error('patient_required');
  if (!doctor_ids || !doctor_ids.length) throw new Error('at_least_one_doctor_required');

  const id = makeId('E');

  await db.query(
    `INSERT INTO encounters (id, patient_id) VALUES ($1, $2)`,
    [id, patient_id]
  );

  for (const doctorId of doctor_ids) {
    await db.query(
      `INSERT INTO encounter_doctors (encounter_id, doctor_id) VALUES ($1, $2)`,
      [id, doctorId]
    );
  }

  return getEncounterById(id);
}

async function finishEncounter(id) {
  const encounter = await getEncounterById(id);
  if (!encounter) throw new Error('encounter_not_found');
  if (encounter.status === 'finished') throw new Error('already_finished');
  if (!encounter.doctors || !encounter.doctors.length) throw new Error('no_doctors_assigned');

  const { token } = await surveyService.createToken();
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const link = baseUrl + '/survey?t=' + encodeURIComponent(token);

  await db.query(
    `UPDATE encounters SET status = 'finished', survey_token = $1, survey_link = $2, survey_sent = FALSE, finished_at = NOW(), updated_at = NOW() WHERE id = $3`,
    [token, link, id]
  );

  return getEncounterById(id);
}

async function deleteEncounter(id) {
  await db.query('DELETE FROM encounter_doctors WHERE encounter_id = $1', [id]);
  const result = await db.query('DELETE FROM encounters WHERE id = $1 RETURNING id', [id]);
  return result.rowCount > 0;
}

async function bulkDeleteEncounters(ids) {
  if (!ids || !ids.length) return 0;
  const placeholders = ids.map((_, i) => '$' + (i + 1)).join(',');
  await db.query('DELETE FROM encounter_doctors WHERE encounter_id IN (' + placeholders + ')', ids);
  const result = await db.query('DELETE FROM encounters WHERE id IN (' + placeholders + ') RETURNING id', ids);
  return result.rowCount;
}

async function sendSurveySms(id) {
  const encounter = await getEncounterById(id);
  if (!encounter) throw new Error('encounter_not_found');
  if (encounter.status !== 'finished') throw new Error('encounter_not_finished');
  if (encounter.survey_sent) throw new Error('survey_already_sent');
  if (!encounter.survey_token) throw new Error('no_survey_token');
  if (!encounter.patient_phone) throw new Error('patient_no_phone');

  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const link = baseUrl + '/survey?t=' + encodeURIComponent(encounter.survey_token);
  const message = 'Please provide your feedback: ' + link;
  const result = await smsService.sendSms({ to: encounter.patient_phone, message });

  if (!result.ok) {
    throw new Error('sms_failed: ' + (result.reason || 'unknown'));
  }

  await db.query('UPDATE encounters SET survey_sent = TRUE, updated_at = NOW() WHERE id = $1', [id]);

  return { ok: true, provider: result.provider };
}

async function sendAllSurveySms(ids) {
  let query;
  let params;

  if (ids && ids.length > 0) {
    const placeholders = ids.map((_, i) => '$' + (i + 1)).join(',');
    query = `SELECT e.id FROM encounters e
             WHERE e.id IN (` + placeholders + `)
               AND e.status = 'finished' AND e.survey_sent = FALSE
               AND e.created_at >= NOW() - INTERVAL '24 hours'
               AND e.survey_token IS NOT NULL`;
    params = ids;
  } else {
    query = `SELECT e.id FROM encounters e
             WHERE e.status = 'finished' AND e.survey_sent = FALSE
               AND e.created_at >= NOW() - INTERVAL '24 hours'
               AND e.survey_token IS NOT NULL`;
    params = [];
  }

  const result = await db.query(query, params);

  const sent = [];
  const failed = [];

  for (const row of result.rows) {
    try {
      const res = await sendSurveySms(row.id);
      sent.push({ id: row.id, provider: res.provider });
    } catch (e) {
      failed.push({ id: row.id, error: e.message });
    }
  }

  return { sent: sent.length, failed: failed.length, errors: failed };
}

module.exports = { getEncountersPaginated, getEncounterById, createEncounter, finishEncounter, deleteEncounter, bulkDeleteEncounters, sendSurveySms, sendAllSurveySms };
