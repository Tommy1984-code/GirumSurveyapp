const helmet = require('helmet');

const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      connectSrc: ["'self'", "https://res.cloudinary.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'self'"],
      mediaSrc: ["'self'", "https://res.cloudinary.com"],
      frameSrc: ["'self'"]
    }
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }
});

module.exports = { helmetConfig };
