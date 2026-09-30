const express = require('express');
const router = express.Router();
const {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  triggerExpiryCheck,
} = require('../controllers/notificationController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// All notification routes require authentication
router.use(protect);

// @route   GET /api/notifications
// @desc    Get user's notifications
// @access  Private (All authenticated roles)
router.get('/', getMyNotifications);

// @route   PATCH /api/notifications/read-all
// @desc    Mark all user's notifications as read
// @access  Private
router.patch('/read-all', markAllNotificationsAsRead);

// @route   PATCH /api/notifications/:id/read
// @desc    Mark specific notification as read
// @access  Private
router.patch('/:id/read', markNotificationAsRead);

// @route   POST /api/notifications/check-expiry
// @desc    Trigger membership expiry check manually (or via cron trigger)
// @access  Private (Admin only)
router.post('/check-expiry', authorizeRoles('admin'), triggerExpiryCheck);

module.exports = router;
