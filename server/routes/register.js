const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// POST /api/register
router.post('/', async (req, res) => {
  const { email, password, plan, accessDuration, modelsAccess, role } = req.body;

  if (!email || !password || !plan || !accessDuration || !modelsAccess) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  try {
    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'User already exists.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create and save the new user
    const newUser = new User({
      email,
      password: hashedPassword,
      plan,
      role: role || 'user',
      accessDuration,
      modelsAccess
    });

    await newUser.save();
    console.log('✅ Registered user:', newUser.email);

    // Issue JWT for immediate login
    const token = jwt.sign(
      {
        email: newUser.email,
        role: newUser.role,
        plan: newUser.plan,
        accessDuration: newUser.accessDuration,
        modelsAccess: newUser.modelsAccess
      },
      process.env.JWT_SECRET || 'secretkey',
      { expiresIn: '1h' }
    );

    res.status(201).json({ message: 'Registration successful', token });
  } catch (err) {
    console.error('❌ Registration error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
