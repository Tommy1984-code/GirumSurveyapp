require('dotenv').config();

const { app, PORT, BASE_URL } = require('./app');
const { boot } = require('./config/bootstrap');

boot(app, PORT, BASE_URL).catch((error) => {
  console.error('Boot failed:', error);
  process.exit(1);
});
