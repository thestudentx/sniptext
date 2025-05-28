const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
require('dotenv').config();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const isAdmin = email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASS;

  if (isAdmin) {
    const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '2h' });
    return res.status(200).json({ token });
  } else {
    return res.status(401).json({ message: 'Invalid admin credentials' });
  }
});

module.exports = router;
