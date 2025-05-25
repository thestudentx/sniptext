const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Dummy user
const dummyUser = {
  email: 'testuser@gmail.com',
  password: 'testuser',
  plan: 'Premium - 1 Year', 
  models: ['turnitin1', 'quillbot2', 'quillbot3', 'grammarly3'],
  accessDuration: "2025-06-15T23:59:59Z", // ISO format
};



// Login endpoint (email only)
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Find matching user (you'll use your real DB logic here)
  const user = dummyUser; // Replace with DB lookup when ready

  if (email === user.email && password === user.password) {
    const now = new Date();
    const accessExpiry = new Date(user.accessDuration);

    if (now > accessExpiry) {
      return res.status(403).json({ message: 'Your access has expired.' });
    }

    // Log user details for debugging
    console.log('🔍 User object:', user);

    const token = jwt.sign(
      {
        email: user.email,
        plan: user.plan,
        models: user.models,
        accessDuration: user.accessDuration,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.json({ token });

  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});



// Get user info from token
router.get('/user', (req, res) => {
  console.log('🔒 Incoming auth request...');
  const authHeader = req.headers.authorization;
  console.log('🔒 Auth header:', authHeader);

  if (!authHeader) return res.status(401).json({ message: 'No token' });

  const token = authHeader.split(' ')[1];
  console.log('🔑 Extracted token:', token);

  jwt.verify(token, process.env.JWT_SECRET || 'secretkey', (err, decoded) => {
    if (err) {
      console.error('❌ Token verification failed:', err.message);
      return res.status(401).json({ message: 'Invalid token' });
    }

    console.log('✅ Token verified:', decoded);
    res.json({ email: decoded.email, plan: decoded.plan, models: decoded.models });
  });
});


module.exports = router;
