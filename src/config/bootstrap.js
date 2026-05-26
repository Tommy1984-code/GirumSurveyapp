const db = require('./database');
const {
  ensureAdminUsersTable, ensureSessionsTable, ensureRolesTables,
  ensureRoleColumnOnUsers, ensureDoctorsTableColumns,
  ensurePatientsTableConstraints, ensureNotificationsTable,
  ensureEncountersSurveySentColumn, ensureQuestionsTableAndDefaults,
  ensureEmailSettingsTable, ensureActivityLogsTable, seedDefaultRoles, loadSessions
} = require('../services/bootstrap');

async function boot(app, PORT, BASE_URL) {
  await ensureQuestionsTableAndDefaults();
  await ensureAdminUsersTable();
  await ensureActivityLogsTable();
  await ensureSessionsTable();
  await ensureRolesTables();
  await ensureRoleColumnOnUsers();
  await ensureDoctorsTableColumns();
  await ensurePatientsTableConstraints();
  await ensureNotificationsTable();
  await ensureEmailSettingsTable();
  await ensureEncountersSurveySentColumn();
  await seedDefaultRoles();

  const sessions = await loadSessions();

  setInterval(async () => {
    await db.query(`DELETE FROM admin_sessions WHERE expires_at < NOW()`);
    const validTokens = new Set((await db.query('SELECT token FROM admin_sessions')).rows.map(r => r.token));
    for (const [token] of sessions) {
      if (!validTokens.has(token)) sessions.delete(token);
    }
  }, 15 * 60 * 1000);

  app.listen(PORT, function () {
    console.log('Server running at ' + BASE_URL);
  });
}

module.exports = { boot };
