const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = {
  authenticateToken: (req, res, next) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) 
      return res.status(401).json({ message: 'No token provided' });

    const token = header.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET || 'secretkey', (err, decoded) => {
      if (err) return res.status(401).json({ message: 'Invalid token' });
      req.user = decoded;   // { email, role, ... }
      next();
    });
  },

  requireAdmin: (req, res, next) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin only' });
    }
    next();
  }
};
