const db = require('../db');

function validateEthiopianPhone(phone) {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if (/^(\+?251|0)?9\d{8}$/.test(cleaned)) {
    if (cleaned.startsWith('+251')) return cleaned;
    if (cleaned.startsWith('251')) return '+' + cleaned;
    if (cleaned.startsWith('09')) return '+251' + cleaned.slice(1);
    return '+251' + cleaned;
  }
  return false;
}

function makeId(prefix) {
  const crypto = require('crypto');
  return prefix + '-' + Date.now().toString(36) + '-' + crypto.randomBytes(3).toString('hex');
}

async function getAllPatients(activeOnly = true) {
  const where = activeOnly ? 'WHERE is_active = TRUE' : '';
  const result = await db.query(
    `SELECT id, name, phone, is_active, created_at
     FROM patients ${where} ORDER BY name ASC`
  );
  return result.rows;
}

async function getPatientsPaginated({ search = '', page = 1, limit = 10 }) {
  const offset = (page - 1) * limit;
  const searchPattern = '%' + search.toLowerCase() + '%';

  const countResult = await db.query(
    `SELECT COUNT(*) as total FROM patients
     WHERE ($1 = '' OR LOWER(name) LIKE $1 OR LOWER(id) LIKE $1 OR LOWER(phone) LIKE $1)`,
    [searchPattern]
  );
  const total = parseInt(countResult.rows[0].total);

  const result = await db.query(
    `SELECT id, name, phone, is_active, created_at
     FROM patients
     WHERE ($1 = '' OR LOWER(name) LIKE $1 OR LOWER(id) LIKE $1 OR LOWER(phone) LIKE $1)
     ORDER BY name ASC
     LIMIT $2 OFFSET $3`,
    [searchPattern, limit, offset]
  );

  return {
    patients: result.rows,
    total,
    page,
    limit,
    total_pages: Math.ceil(total / limit)
  };
}

async function getPatientById(id) {
  const result = await db.query('SELECT * FROM patients WHERE id = $1', [id]);
  return result.rows[0] || null;
}

async function createPatient({ name, phone }) {
  if (!name || !name.trim()) {
    throw new Error('patient_name_required');
  }
  const trimmedName = name.trim();
  if (trimmedName.length < 2) throw new Error('patient_name_too_short');
  if (trimmedName.length > 100) throw new Error('patient_name_too_long');

  if (!phone || !String(phone).trim()) {
    throw new Error('phone_required');
  }
  const trimmedPhone = String(phone).trim();
  const normalizedPhone = validateEthiopianPhone(trimmedPhone);
  if (normalizedPhone === false) throw new Error('invalid_phone_format');

  const id = makeId('P');
  try {
    const result = await db.query(
      `INSERT INTO patients (id, name, phone)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [id, trimmedName, normalizedPhone]
    );
    return result.rows[0];
  } catch (e) {
    if (e.code === '23505') throw new Error('duplicate_phone');
    throw e;
  }
}

async function updatePatient(id, { name, phone, is_active }) {
  const updates = [];
  const values = [];
  let idx = 1;

  if (name !== undefined) {
    const trimmed = name.trim();
    if (trimmed.length < 2) throw new Error('patient_name_too_short');
    if (trimmed.length > 100) throw new Error('patient_name_too_long');
    updates.push(`name = $${idx++}`);
    values.push(trimmed);
  }
  if (phone !== undefined) {
    if (!phone || !String(phone).trim()) {
      throw new Error('phone_required');
    }
    const trimmed = String(phone).trim();
    const normalized = validateEthiopianPhone(trimmed);
    if (normalized === false) throw new Error('invalid_phone_format');
    updates.push(`phone = $${idx++}`);
    values.push(normalized);
  }
  if (is_active !== undefined) {
    updates.push(`is_active = $${idx++}`);
    values.push(is_active);
  }
  updates.push(`updated_at = NOW()`);
  values.push(id);

  try {
    const result = await db.query(
      `UPDATE patients SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  } catch (e) {
    if (e.code === '23505') throw new Error('duplicate_phone');
    throw e;
  }
}

async function deletePatient(id) {
  const result = await db.query('DELETE FROM patients WHERE id = $1 RETURNING id', [id]);
  return result.rowCount > 0;
}

module.exports = { getAllPatients, getPatientsPaginated, getPatientById, createPatient, updatePatient, deletePatient };
