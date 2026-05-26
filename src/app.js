require('dotenv').config();
const express = require('express');
const path = require('path');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const { helmetConfig } = require('./middleware/security');
const { sanitizeResponses, globalErrorHandler } = require('./middleware/errorHandler');
const { registerAll } = require('./routes');
const { tempDir } = require('./utils/constants');

const app = express();
app.disable('x-powered-by');

app.use(helmetConfig);
app.use(cors({
  origin: (process.env.BASE_URL || 'http://localhost:' + (process.env.PORT || 3000)).replace(/\/$/, ''),
  credentials: true
}));
app.use(sanitizeResponses);

const PORT = Number(process.env.PORT || 3000);
const BASE_URL = (process.env.BASE_URL || ('http://localhost:' + PORT)).replace(/\/$/, '');
const FRONTEND_DIST = path.join(__dirname, '../public/app');

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const upload = multer({
  dest: tempDir,
  limits: { fileSize: 10 * 1024 * 1024 }
});

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

app.use(express.static(FRONTEND_DIST));
app.use(express.static(path.join(__dirname, '../public')));

app.get('/favicon.ico', (req, res) => res.status(204).end());

registerAll(app, { FRONTEND_DIST, BASE_URL, upload });

app.use(globalErrorHandler);

module.exports = { app, PORT, BASE_URL };
