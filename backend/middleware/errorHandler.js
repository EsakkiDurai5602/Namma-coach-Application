// middleware/errorHandler.js
module.exports = function errorHandler(err, req, res, _next) {
  const status  = err.status || 500;
  const message = err.message || 'Internal server error.';

  if (process.env.NODE_ENV !== 'production') {
    console.error(`[${req.method}] ${req.path} → ${status}: ${message}`);
  }

  res.status(status).json({ success: false, message });
};
