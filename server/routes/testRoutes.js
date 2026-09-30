const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Member access route (any authenticated member, trainer, or admin)
router.get('/member', protect, authorizeRoles('member', 'trainer', 'admin'), (req, res) => {
  res.json({
    success: true,
    message: `Hello ${req.user.name}, you have accessed the member protected route.`,
    role: req.user.role,
  });
});

// Trainer access route (trainer and admin)
router.get('/trainer', protect, authorizeRoles('trainer', 'admin'), (req, res) => {
  res.json({
    success: true,
    message: `Hello Coach ${req.user.name}, you have accessed the trainer protected route.`,
    role: req.user.role,
  });
});

// Admin-only route
router.get('/admin', protect, authorizeRoles('admin'), (req, res) => {
  res.json({
    success: true,
    message: `Hello Administrator ${req.user.name}, you have accessed the admin-only route.`,
    role: req.user.role,
  });
});

module.exports = router;
