const db = require('../config/database');
const { ALL_MODULES } = require('../utils/constants');
const { loadSessions } = require('../middleware/auth');
const crypto = require('crypto');

async function ensureAdminUsersTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id BIGSERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      is_active BOOLEAN NOT NULL DEFAULT TRUE
    )
  `);
}

async function ensureSessionsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS admin_sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
      username TEXT NOT NULL,
      email TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days'
    )
  `);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_sessions_expires ON admin_sessions(expires_at)`);
}

async function ensureRolesTables() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS roles (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS role_permissions (
      id BIGSERIAL PRIMARY KEY,
      role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      module TEXT NOT NULL,
      UNIQUE(role_id, module)
    )
  `);
}

async function ensureRoleColumnOnUsers() {
  await db.query(`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES roles(id)`);
}

async function ensureDoctorsTableColumns() {
  await db.query(`ALTER TABLE doctors ADD COLUMN IF NOT EXISTS email TEXT`);
  await db.query(`ALTER TABLE doctors ADD COLUMN IF NOT EXISTS image_url TEXT`);
  await db.query(`
    UPDATE doctors d SET email = d.id || '@placeholder.local'
    FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at) AS rn
      FROM doctors WHERE email IS NOT NULL
    ) dup
    WHERE d.id = dup.id AND dup.rn > 1
  `);
  try {
    await db.query(`ALTER TABLE doctors ADD CONSTRAINT doctors_email_key UNIQUE (email)`);
  } catch (e) {
    if (e.code !== '42P07') throw e;
  }
}

async function ensurePatientsTableConstraints() {
  await db.query(`UPDATE patients SET phone = '+251000000000' WHERE phone IS NULL OR phone = ''`);
  await db.query(`ALTER TABLE patients ALTER COLUMN phone SET NOT NULL`);
  try {
    await db.query(`ALTER TABLE patients ADD CONSTRAINT patients_phone_key UNIQUE (phone)`);
  } catch (e) {
    if (e.code !== '42P07') throw e;
  }
}

async function ensureNotificationsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS admin_notification_seen (
      admin_id INTEGER PRIMARY KEY REFERENCES admin_users(id) ON DELETE CASCADE,
      last_seen_submission_id BIGINT NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function ensureEncountersSurveySentColumn() {
  await db.query(`ALTER TABLE encounters ADD COLUMN IF NOT EXISTS survey_sent BOOLEAN NOT NULL DEFAULT FALSE`);
}

async function ensureQuestionsTableAndDefaults() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS survey_questions (
      id BIGSERIAL PRIMARY KEY,
      question_key TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL,
      type TEXT NOT NULL,
      required BOOLEAN NOT NULL DEFAULT TRUE,
      options JSONB NOT NULL DEFAULT '[]'::jsonb,
      min_value NUMERIC,
      max_value NUMERIC,
      order_no INT NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
      category TEXT NOT NULL DEFAULT 'general',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  
  await db.query(`
    ALTER TABLE survey_questions 
    ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'general'
  `);
}

async function ensureEmailSettingsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS email_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function ensureActivityLogsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id BIGSERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES admin_users(id),
      action TEXT NOT NULL,
      details JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function seedDefaultRoles() {
  const existing = await db.query('SELECT id FROM roles WHERE name = $1', ['Super Admin']);
  if (existing.rowCount === 0) {
    const role = await db.query('INSERT INTO roles (name) VALUES ($1) RETURNING id', ['Super Admin']);
    const roleId = role.rows[0].id;
    for (const mod of ALL_MODULES) {
      await db.query('INSERT INTO role_permissions (role_id, module) VALUES ($1, $2) ON CONFLICT DO NOTHING', [roleId, mod]);
    }
  } else {
    for (const mod of ALL_MODULES) {
      await db.query('INSERT INTO role_permissions (role_id, module) VALUES ($1, $2) ON CONFLICT DO NOTHING', [existing.rows[0].id, mod]);
    }
  }
}

module.exports = {
  ensureAdminUsersTable, ensureSessionsTable, ensureRolesTables,
  ensureRoleColumnOnUsers, ensureDoctorsTableColumns,
  ensurePatientsTableConstraints, ensureNotificationsTable,
  ensureEncountersSurveySentColumn, ensureQuestionsTableAndDefaults,
  ensureEmailSettingsTable, ensureActivityLogsTable, seedDefaultRoles, loadSessions
};
