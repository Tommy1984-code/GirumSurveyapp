const crypto = require('crypto');

function makeId(prefix) {
  return prefix + '-' + Date.now().toString(36) + '-' + crypto.randomBytes(3).toString('hex');
}

function generateToken() {
  return crypto.randomBytes(24).toString('base64url');
}

function generateSessionToken() {
  return crypto.randomBytes(32).toString('base64url');
}

function getExpiry() {
  const ttl = Number(process.env.TOKEN_TTL_HOURS || 48);
  const d = new Date();
  d.setHours(d.getHours() + ttl);
  return d.toISOString();
}

module.exports = { makeId, generateToken, generateSessionToken, getExpiry };
