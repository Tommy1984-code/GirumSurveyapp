const db = require('../db');

function validateEmail(email) {
  if (!email) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? email.trim() : false;
}

function makeId(prefix) {
  const crypto = require('crypto');
  return prefix + '-' + Date.now().toString(36) + '-' + crypto.randomBytes(3).toString('hex');
}

async function getAllDoctors(activeOnly = true) {
  const where = activeOnly ? 'WHERE is_active = TRUE' : '';
  const result = await db.query(
    `SELECT id, name, department, email, image_url, is_active, created_at 
     FROM doctors ${where} ORDER BY name ASC`
  );
  return result.rows;
}

async function getDoctorsPaginated({ search = '', page = 1, limit = 10, active = 'all' }) {
  const offset = (page - 1) * limit;
  const searchPattern = '%' + search.toLowerCase() + '%';
  const conditions = [];
  const values = [];
  let idx = 1;

  if (search) {
    conditions.push(`(LOWER(name) LIKE $${idx} OR LOWER(id) LIKE $${idx})`);
    values.push(searchPattern);
    idx++;
  }
  if (active === 'active') {
    conditions.push('is_active = TRUE');
  } else if (active === 'inactive') {
    conditions.push('is_active = FALSE');
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  const countResult = await db.query(
    `SELECT COUNT(*) as total FROM doctors ${whereClause}`,
    values
  );
  const total = parseInt(countResult.rows[0].total);

  values.push(limit, offset);
  const result = await db.query(
    `SELECT id, name, department, email, image_url, is_active, created_at 
     FROM doctors 
     ${whereClause}
     ORDER BY is_active DESC, name ASC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    values
  );

  return {
    doctors: result.rows,
    total,
    page,
    limit,
    total_pages: Math.ceil(total / limit)
  };
}

async function getDoctorById(id) {
  const result = await db.query('SELECT * FROM doctors WHERE id = $1', [id]);
  return result.rows[0] || null;
}

async function createDoctor({ name, department, email, image_url }) {
  if (!name || !name.trim()) {
    throw new Error('doctor_name_required');
  }
  const trimmedName = name.trim();
  if (trimmedName.length < 2) throw new Error('doctor_name_too_short');
  if (trimmedName.length > 100) throw new Error('doctor_name_too_long');

  let normalizedEmail = null;
  if (email) {
    normalizedEmail = validateEmail(email);
    if (normalizedEmail === false) throw new Error('invalid_email_format');
  }

  const dept = department ? department.trim().slice(0, 100) : null;

  const id = makeId('D');
  try {
    const result = await db.query(
      `INSERT INTO doctors (id, name, department, email, image_url) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [id, trimmedName, dept, normalizedEmail, image_url || null]
    );
    return result.rows[0];
  } catch (e) {
    if (e.code === '23505') throw new Error('duplicate_email');
    throw e;
  }
}

async function updateDoctor(id, { name, department, email, is_active, image_url }) {
  const updates = [];
  const values = [];
  let idx = 1;
  
  if (name !== undefined) {
    const trimmed = name.trim();
    if (trimmed.length < 2) throw new Error('doctor_name_too_short');
    if (trimmed.length > 100) throw new Error('doctor_name_too_long');
    updates.push(`name = $${idx++}`);
    values.push(trimmed);
  }
  if (department !== undefined) {
    updates.push(`department = $${idx++}`);
    values.push(department ? department.trim().slice(0, 100) : null);
  }
  if (email !== undefined) {
    if (email) {
      const validated = validateEmail(email);
      if (validated === false) throw new Error('invalid_email_format');
      updates.push(`email = $${idx++}`);
      values.push(validated);
    } else {
      updates.push(`email = $${idx++}`);
      values.push(null);
    }
  }
  if (is_active !== undefined) {
    updates.push(`is_active = $${idx++}`);
    values.push(is_active);
  }
  if (image_url !== undefined) {
    updates.push(`image_url = $${idx++}`);
    values.push(image_url || null);
  }
  updates.push(`updated_at = NOW()`);
  values.push(id);
  
  try {
    const result = await db.query(
      `UPDATE doctors SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  } catch (e) {
    if (e.code === '23505') throw new Error('duplicate_email');
    throw e;
  }
}

async function deleteDoctor(id) {
  const result = await db.query(
    'UPDATE doctors SET is_active = FALSE, updated_at = NOW() WHERE id = $1 RETURNING id',
    [id]
  );
  return result.rowCount > 0;
}

module.exports = { getAllDoctors, getDoctorsPaginated, getDoctorById, createDoctor, updateDoctor, deleteDoctor };
