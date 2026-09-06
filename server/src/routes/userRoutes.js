const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

// Admin-only route
router.get('/admin/overview', authenticate, authorizeRoles('ADMIN'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Admin authorization verified',
    user: req.user.email,
  });
});

// Analyst and Admin route
router.get('/analyst/metrics', authenticate, authorizeRoles('ANALYST', 'ADMIN'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Analyst authorization verified',
    user: req.user.email,
  });
});

// Standard authenticated user route
router.get('/profile', authenticate, authorizeRoles('USER', 'ANALYST', 'ADMIN'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User profile retrieved',
    user: req.user,
  });
});

module.exports = router;