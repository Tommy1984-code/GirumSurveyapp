const db = require('../config/database');
const { requireAuth, requireModule } = require('../middleware/auth');

function register(app) {
  app.get('/api/responses', requireAuth, requireModule('responses'), async function (req, res) {
    const grouped = String(req.query.grouped || '').toLowerCase() === 'true';
    const search = String(req.query.search || '').trim();
    const doctorId = String(req.query.doctor_id || '').trim();
    const dateFrom = String(req.query.date_from || '').trim();
    const dateTo = String(req.query.date_to || '').trim();
    const page = Math.max(1, Number.isInteger(parseInt(req.query.page)) ? parseInt(req.query.page) : 1);
    const limit = Math.min(100, Math.max(1, Number.isInteger(parseInt(req.query.limit)) ? parseInt(req.query.limit) : 20));

    const conditions = [];
    const params = [];
    let paramIdx = 1;

    if (search) {
      conditions.push(`(
        fs.patient_name ILIKE $${paramIdx} OR
        fs.token ILIKE $${paramIdx} OR
        fs.selected_doctor_names::text ILIKE $${paramIdx}
      )`);
      params.push('%' + search + '%');
      paramIdx++;
    }

    if (doctorId) {
      conditions.push(`fs.selected_doctor_ids::text ILIKE $${paramIdx}`);
      params.push('%' + doctorId + '%');
      paramIdx++;
    }

    if (dateFrom) {
      conditions.push(`fs.submitted_at >= $${paramIdx}`);
      params.push(dateFrom);
      paramIdx++;
    }

    if (dateTo) {
      conditions.push(`fs.submitted_at <= $${paramIdx}`);
      params.push(dateTo + 'T23:59:59.999');
      paramIdx++;
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    if (!grouped) {
      let sql = `SELECT fs.id AS submission_id, fs.submitted_at, fs.token, fs.patient_name,
                 fs.question_answers
                 FROM feedback_submissions fs
                 ${whereClause}
                 ORDER BY fs.submitted_at DESC, fs.id DESC`;
      const rows = await db.query(sql, params);
      return res.json({ count: rows.rowCount, responses: rows.rows });
    }

    const countSql = `SELECT COUNT(DISTINCT fs.id) AS total FROM feedback_submissions fs ${whereClause}`;
    const countResult = await db.query(countSql, params);
    const totalCount = parseInt(countResult.rows[0]?.total || 0);
    const totalPages = Math.ceil(totalCount / limit);
    const offset = (page - 1) * limit;

    let sql = `SELECT fs.id AS submission_id, fs.submitted_at, fs.token, fs.patient_name,
               fs.selected_doctor_ids, fs.selected_doctor_names, fs.question_answers
               FROM feedback_submissions fs
               ${whereClause}
               ORDER BY fs.submitted_at DESC, fs.id DESC
               LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
    const rows = await db.query(sql, [...params, limit, offset]);

    const responses = rows.rows.map((row) => ({
      submission_id: row.submission_id,
      submitted_at: row.submitted_at,
      token: row.token,
      patient_name: row.patient_name,
      doctor_names: row.selected_doctor_names ? row.selected_doctor_names.join(', ') : '',
      selected_doctor_ids: row.selected_doctor_ids || [],
      question_answers: row.question_answers || {}
    }));

    return res.json({
      count: responses.length,
      total: totalCount,
      page,
      limit,
      total_pages: totalPages,
      responses: responses
    });
  });

  app.delete('/api/responses', requireAuth, requireModule('responses'), async function (req, res) {
    const ids = req.body.ids;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids_required' });
    }

    const safeIds = ids.map((id) => String(id).trim()).filter(Boolean);
    if (safeIds.length === 0) {
      return res.status(400).json({ error: 'ids_required' });
    }

    try {
      const delSubmissions = await db.query(
        `DELETE FROM feedback_submissions WHERE id = ANY($1::bigint[])`,
        [safeIds.map(id => parseInt(id))]
      );
      return res.json({ ok: true, deleted: delSubmissions.rowCount });
    } catch (e) {
      console.error('Delete responses error:', e);
      return res.status(500).json({ error: 'delete_failed' });
    }
  });
}

module.exports = { register };
