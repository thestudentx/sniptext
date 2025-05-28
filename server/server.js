const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const registerRoute = require('./routes/register');
const adminUserRoutes = require('./routes/adminUserRoutes');
const authMiddleware = require('./middlewares/authMiddleware');
const adminLoginAuth = require('./routes/adminLoginAuth');

dotenv.config();
const app = express();
app.use(express.json());

// Serve static HTML files from root (e.g., index.html)
app.use(express.static('.'));

// Enable CORS
app.use(cors({
  origin: ['http://127.0.0.1:5500', 'https://sniptext.vercel.app'], 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: false,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Routes
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api/register', registerRoute);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin', adminLoginAuth);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas');
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
  });
