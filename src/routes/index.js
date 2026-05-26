const authRoutes = require('./auth.routes');
const doctorRoutes = require('./doctor.routes');
const patientRoutes = require('./patient.routes');
const encounterRoutes = require('./encounter.routes');
const surveyRoutes = require('./survey.routes');
const questionRoutes = require('./question.routes');
const responseRoutes = require('./response.routes');
const reportRoutes = require('./report.routes');
const adminRoutes = require('./admin.routes');
const analyticsRoutes = require('./analytics.routes');
const uploadRoutes = require('./upload.routes');
const importRoutes = require('./import.routes');
const notificationRoutes = require('./notification.routes');
const healthRoutes = require('./health.routes');
const pageRoutes = require('./page.routes');

function registerAll(app, { FRONTEND_DIST, BASE_URL, upload }) {
  healthRoutes.register(app);
  authRoutes.register(app);
  surveyRoutes.register(app, BASE_URL);
  questionRoutes.register(app);
  doctorRoutes.register(app);
  patientRoutes.register(app);
  encounterRoutes.register(app);
  responseRoutes.register(app);
  reportRoutes.register(app);
  adminRoutes.register(app);
  analyticsRoutes.register(app);
  uploadRoutes.register(app);
  importRoutes.register(app, upload);
  notificationRoutes.register(app);
  pageRoutes.register(app, FRONTEND_DIST);
}

module.exports = { registerAll };
