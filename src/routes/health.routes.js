function register(app) {
  app.get('/health', function (_req, res) {
    res.json({ ok: true });
  });

  app.get('/api/external/test', async function (_req, res) {
    return res.json({ ok: true, message: 'External API test endpoint (no-op)' });
  });
}

module.exports = { register };
