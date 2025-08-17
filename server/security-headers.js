// server/security-headers.js
const helmet = require('helmet');

/**
 * Security headers (kept permissive for your current inline scripts/fonts).
 * If you later remove inline scripts, you can tighten script-src.
 */
module.exports = helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "img-src": ["'self'", "data:", "https:", "blob:"],
      "script-src": ["'self'", "'unsafe-inline'", "https:"],
      "style-src": ["'self'", "'unsafe-inline'", "https:"],
      "font-src": ["'self'", "https:", "data:"],
      "connect-src": ["'self'", "https:"]
    }
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: false // modern browsers ignore X-XSS-Protection; Helmet omits it by default
});
