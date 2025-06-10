/* routes/adminUserRoutes.js */
const express = require('express');
const bcrypt  = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const User    = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

// Helper: map "access" days to plan label
const planMap = {
  30:  'Standard - 1 Month',
  90:  'Pro - 3 Months',
  180: 'Business - 6 Months',
  365: 'Premium - 1 Year'
};

// Input validation chain for creating/updating users
const userValidation = [
  body('email').isEmail().withMessage('Invalid email'),
  body('password')
    .optional({ nullable: true })
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('access')
    .notEmpty().withMessage('Access is required')
    .isIn(Object.keys(planMap)).withMessage('Access must be one of: ' + Object.keys(planMap).join(', ')),
  body('apis')
    .optional()
    .custom(val => {
      if (Array.isArray(val)) return true;
      if (typeof val === 'string') return true;
      throw new Error('Apis must be a comma-separated string or array');
    }),
  body('credits')
    .optional()
    .isInt({ min: 0 }).withMessage('Credits must be a non-negative integer')
];

// GET /api/admin/users — list all users
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}, '-password').lean();
    return res.json(users);
  } catch (err) {
    console.error('💥 Error in GET /api/admin/users:', err);
    return res.status(500).json({ message: err.message });
  }
});

// POST /api/admin/users — create new user via admin panel
// POST /api/admin/users
router.post(
  '/', 
  authenticateToken, 
  requireAdmin, 
  userValidation, 
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    console.log('Creating user with body:', req.body);

    const { email, password, access, credits } = req.body;
    const rawModels = req.body.modelsAccess ?? req.body.apis;
    const modelsAccess = Array.isArray(rawModels)
      ? rawModels
      : rawModels
         ? rawModels.split(',').map(a => a.trim())
         : [];

    try {
      if (await User.findOne({ email })) {
        return res.status(409).json({ message: 'User already exists' });
      }

      const hashedPwd = await bcrypt.hash(password, 10);
      const days      = parseInt(access, 10);
      const expiry    = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

      const newUser = new User({
        email,
        password:       hashedPwd,
        plan:           planMap[days],
        role:           'user',
        accessDuration: expiry,
        modelsAccess,
        credits:        parseInt(credits, 10) || 0
      });

      await newUser.save();

      // ✅ BREVO INTEGRATION (safe, no interference)
      try {
        const { addUserToBrevo } = require('../utils/brevo'); // only used here
        await addUserToBrevo({
          email: newUser.email,
          firstName: newUser.email.split('@')[0],
          accessDuration: expiry.toISOString().split('T')[0]
        });
      } catch (brevoErr) {
        console.error('📨 Brevo contact add failed:', brevoErr.message);
        // Optional: log this error somewhere for audit
      }

      res.status(201).json({ message: 'User created', user: newUser });
    } catch (err) {
      console.error('Error creating user:', err);
      return res.status(500).json({ message: err.message });
    }
  }
);



// PUT /api/admin/users/:id — update existing user
router.put('/:id',
  authenticateToken,
  requireAdmin,
  userValidation.map(rule => rule.optional()), // all fields optional on update
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { access, apis, credits } = req.body;
      const update = {};

      if (access) {
        const days = parseInt(access, 10);
        update.plan           = planMap[days];
        update.accessDuration = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      }

      if (apis != null) {
        update.modelsAccess = Array.isArray(apis)
          ? apis
          : apis.split(',').map(a => a.trim());
      }

      if (credits != null) {
        update.credits = parseInt(credits, 10) || 0;
      }

      const user = await User.findByIdAndUpdate(
        req.params.id,
        update,
        { new: true, select: '-password' }
      );

      const rawModels = req.body.modelsAccess ?? req.body.apis;
if (rawModels != null) {
  update.modelsAccess = Array.isArray(rawModels)
    ? rawModels
    : rawModels.split(',').map(a => a.trim());
}

      if (!user) return res.status(404).json({ message: 'User not found' });
      res.json({ message: 'User updated', user });

    } catch (err) {
      console.error('Error updating user:', err);
      return res.status(500).json({ message: err.message });
    }
  }
);

// DELETE /api/admin/users/:id — delete user
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await User.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error deleting user' });
  }
});

module.exports = router;
