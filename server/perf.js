// server/perf.js
const compression = require('compression');

module.exports = (app) => {
  // Brotli/Gzip compression
  app.use(compression());

  // Long-term caching for static assets; no-cache for HTML
  app.use((req, res, next) => {
    if (/\.(?:css|js|png|jpg|jpeg|webp|avif|svg|woff2)$/.test(req.url)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (/\.html?$/.test(req.url)) {
      res.setHeader('Cache-Control', 'no-cache');
    }
    next();
  });
};
