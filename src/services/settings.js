const crypto = require('crypto');
const db = require('../config/database');

const ENCRYPTED_KEYS = new Set(['smtp_pass']);

function deriveKey() {
  const secret = process.env.APP_SECRET || 'default-dev-secret-change-in-production';
  return crypto.createHash('sha256').update(secret).digest();
}

function encrypt(text) {
  if (!text) return '';
  const key = deriveKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return iv.toString('hex') + ':' + tag + ':' + encrypted;
}

function decrypt(encoded) {
  if (!encoded) return '';
  try {
    const key = deriveKey();
    const parts = encoded.split(':');
    if (parts.length !== 3) return encoded;
    const iv = Buffer.from(parts[0], 'hex');
    const tag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return '';
  }
}

async function getAllSettings() {
  const result = await db.query('SELECT key, value FROM email_settings ORDER BY key');
  const settings = {};
  for (const row of result.rows) {
    if (ENCRYPTED_KEYS.has(row.key)) {
      settings[row.key] = row.value ? '********' : '';
    } else {
      settings[row.key] = row.value;
    }
  }
  return settings;
}

async function getSetting(key) {
  const result = await db.query('SELECT value FROM email_settings WHERE key = $1', [key]);
  if (!result.rowCount) return null;
  const value = result.rows[0].value;
  if (ENCRYPTED_KEYS.has(key)) {
    return decrypt(value);
  }
  return value;
}

async function setSetting(key, value) {
  const finalValue = ENCRYPTED_KEYS.has(key) ? encrypt(value) : value;
  await db.query(
    `INSERT INTO email_settings (key, value, updated_at) VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [key, finalValue]
  );
}

module.exports = { getAllSettings, getSetting, setSetting };