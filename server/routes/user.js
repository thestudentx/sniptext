// server/routes/user.js
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

router.get('/user', (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Return dummy user info for now
    return res.json({
      email: decoded.email,
      models: decoded.models,
      accessDuration: decoded.accessDuration,
      models: ['turnitin1', 'quillbot1'] // adjust based on roles later
    });
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
});

module.exports = router;
