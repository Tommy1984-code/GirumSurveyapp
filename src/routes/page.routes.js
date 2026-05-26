const path = require('path');

function register(app, FRONTEND_DIST) {
  app.get('/', (req, res) => {
    res.redirect('/survey');
  });

  app.get('/survey', function(_req, res) {
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
  });

  app.get('/gh-admin', function (_req, res) {
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
  });

  app.get('*', (req, res) => {
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
  });
}

module.exports = { register };
