const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const axios = require('axios'); 

const authMiddleware = require('./middlewares/authMiddleware');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const registerRoute = require('./routes/register');
const adminUserRoutes = require('./routes/adminUserRoutes');
const adminLoginAuth = require('./routes/adminLoginAuth');
const contactRoutes = require('./routes/contact');

// Quilbot/Turnitin Self-hosted API 
const paraphraseRoutes = require('./routes/quillbot2Routes');
const grammarly1Routes = require('./routes/grammarly1Routes');
const aidetectionRoutes = require('./routes/aidetectionRoutes');



dotenv.config();
const app = express();
app.use(express.json());


// Serve static HTML files from root (e.g., index.html)
app.use(express.static('.'));

// Enable dynamic CORS
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
    // incomingOrigin is undefined for non-browser clients (curl, Postman)
    if (!incomingOrigin || allowedOrigins.includes(incomingOrigin)) {
      callback(null, true);    // allow request
    } else {
      console.warn(`Blocked CORS request from: ${incomingOrigin}`);
      callback(new Error('Not allowed by CORS'));  // reject
    }
  },
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
app.use('/api', contactRoutes);

// Quilbot/Turnitin Self-hosted API 
app.use('/api', paraphraseRoutes);
app.use('/api', grammarly1Routes);
app.use('/api/aidetection', aidetectionRoutes);


// 🌐 Public IP Debug Route for Brevo whitelisting
app.get('/api/check-my-ip', async (req, res) => {
  try {
    const response = await axios.get('https://api.ipify.org?format=json');
    const ip = response.data.ip;
    console.log('🕵️ My server’s public IP is:', ip);
    res.json({ ip });
  } catch (err) {
    console.error('❌ Failed to fetch public IP:', err.message);
    res.status(500).json({ error: 'Could not fetch IP' });
  }
});

// MongoDB connection
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
  