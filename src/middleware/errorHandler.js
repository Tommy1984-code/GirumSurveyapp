function sanitizeResponses(req, res, next) {
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);
  res.json = function (body) {
    if (body && typeof body === 'object' && res.statusCode >= 500) {
      if (body.details) delete body.details;
      if (body.stack) delete body.stack;
    }
    return originalJson(body);
  };
  res.send = function (body) {
    if (res.statusCode >= 500 && typeof body === 'string') {
      body = 'Internal Server Error';
    }
    return originalSend(body);
  };
  next();
}

function globalErrorHandler(err, req, res, next) {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'internal_error' });
}

module.exports = { sanitizeResponses, globalErrorHandler };
