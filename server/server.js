// server/server.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const axios = require('axios');

// Security / performance helpers (new)
const securityHeaders = require('./security-headers');
const addPerf = require('./perf');

// Routes & middleware you already have
const authMiddleware = require('./middlewares/authMiddleware');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const registerRoute = require('./routes/register');
const adminUserRoutes = require('./routes/adminUserRoutes');
const adminLoginAuth = require('./routes/adminLoginAuth');
const contactRoutes = require('./routes/contact');

// Quil(l)bot/Turnitin Self-hosted API
const paraphraseRoutes = require('./routes/quillbot2Routes');
const grammarly1Routes = require('./routes/grammarly1Routes');
const aidetectionRoutes = require('./routes/aidetectionRoutes');

dotenv.config();
const app = express();

// Trust proxy (safe when behind Vercel/Render/NGINX) for correct protocol/IP
app.set('trust proxy', 1);

// Security headers (CSP kept permissive for your current setup)
app.use(securityHeaders);

// Perf: compression + baseline caching headers
addPerf(app);

// Body parsing
app.use(express.json());

// Serve static HTML & assets from repo root, with explicit cache hints
app.use(express.static('.', {
  setHeaders(res, path) {
    if (/\.(?:css|js|png|jpg|jpeg|webp|avif|svg|woff2)$/.test(path)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (/\.html?$/.test(path)) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// Dynamic CORS (kept as-is; only formatted slightly)
const allowedOrigins = [
  'http://127.0.0.1:5500',
  'http://localhost:3000',
  'https://sniptext.vercel.app',
  'https://checkai.pro',
  'https://www.checkai.pro',
  'https://sniptext.onrender.com'
];

app.use(cors({
  origin: (incomingOrigin, callback) => {
    if (!incomingOrigin || allowedOrigins.includes(incomingOrigin)) {
      callback(null, true);
    } else {
      console.warn(`Blocked CORS request from: ${incomingOrigin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: false,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ===== Routes (unchanged) =====
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api/register', registerRoute);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin', adminLoginAuth);
app.use('/api', contactRoutes);

// Quil(l)bot/Turnitin Self-hosted API
app.use('/api', paraphraseRoutes);
app.use('/api', grammarly1Routes);
app.use('/api/aidetection', aidetectionRoutes);

// ===== MongoDB connection & start =====
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB DB Name:", mongoose.connection.name);
    console.log('✅ Connected to MongoDB Atlas');
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
  });
