const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// POST /api/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('📥 Login attempt:', { email, password });

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ No user found');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('🔐 Hashed in DB:', user.password);
    console.log('🔑 Raw input password:', password);

    const isMatch = await bcrypt.compare(password, user.password);
    console.log('🔎 bcrypt match:', isMatch);

    if (!isMatch) {
      console.log('❌ Password mismatch!');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check access expiration
    const now = new Date();
    const accessExpiry = new Date(user.accessDuration);
    console.log('⏳ Access valid until:', accessExpiry, 'Current time:', now);

    if (now > accessExpiry) {
      return res.status(403).json({ message: 'Your access has expired.' });
    }

    // Generate token
    const token = jwt.sign(
      {
        email: user.email,
        plan: user.plan,
        role: user.role,
        models: user.modelsAccess,
        accessDuration: user.accessDuration,
      },
      process.env.JWT_SECRET || 'secretkey',
      { expiresIn: "1h" }
    );

    console.log('✅ Login successful. JWT issued.');
    res.json({ token });

  } catch (err) {
    console.error('❌ Login error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});


// GET /api/user — Verify token and return user info
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

    res.json({
      email: decoded.email,
      plan: decoded.plan,
      role: decoded.role,
      models: decoded.models,
      accessDuration: decoded.accessDuration,
    });
  });
});

module.exports = router;
