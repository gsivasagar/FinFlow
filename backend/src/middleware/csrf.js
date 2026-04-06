// Simple CSRF Protection Middleware
// Employs Origin/Referer checking which, combined with SameSite=strict cookies,
// provides robust CSRF protection without token management overhead.

function csrfProtection(req, res, next) {
  // Safe methods don't need CSRF check
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Skip CSRF check for testing (when no browser headers are set and we're just hitting the API)
  if (process.env.NODE_ENV === 'test') {
    return next();
  }

  // Verify Origin or Referer matches our expected frontend
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  
  const expectedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
  
  if (origin && origin !== expectedOrigin) {
    return res.status(403).json({ error: 'CSRF Origin violation.' });
  }
  
  if (!origin && referer && !referer.startsWith(expectedOrigin)) {
    return res.status(403).json({ error: 'CSRF Referer violation.' });
  }

  if (!origin && !referer) {
    return res.status(403).json({ error: 'CSRF protection: missing Origin and Referer headers.' });
  }

  next();
}

module.exports = { csrfProtection };
