const rateLimitStore = new Map();

function rateLimit(key, maxAttempts = 5, windowMs = 60000) {
  const now = Date.now();
  const entry = rateLimitStore.get(key) || { count: 0, resetAt: now + windowMs };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + windowMs;
  }
  entry.count++;
  rateLimitStore.set(key, entry);
  if (rateLimitStore.size > 1000) {
    for (const [k, v] of rateLimitStore) {
      if (Date.now() > v.resetAt) rateLimitStore.delete(k);
    }
  }
  return entry.count <= maxAttempts ? null : Math.ceil((entry.resetAt - now) / 1000);
}

module.exports = { rateLimit };
