const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const {
  getMemberDashboard,
  getMemberProfile,
  updateMemberProfile,
  getMemberMembership,
  getMemberTrainer,
} = require('../controllers/memberPortalController');

const {
  getMyTrainerAssignment,
  requestTrainer,
} = require('../controllers/trainerAssignmentController');

const {
  getMemberWorkout,
  getMemberWorkoutHistory,
} = require('../controllers/workoutController');

const {
  getMemberDiet,
  getMemberDietHistory,
} = require('../controllers/dietController');

const {
  bookMemberSession,
  getMemberSessions,
  cancelMemberSession,
  rescheduleMemberSession,
} = require('../controllers/sessionController');

const {
  memberCheckIn,
  memberCheckOut,
  getMyAttendance,
  getMyAttendanceStats,
} = require('../controllers/attendanceController');

const {
  getMyProgress,
  getLatestProgress,
  addMyProgress,
} = require('../controllers/progressController');

// All member self-service routes require authentication and 'member' role
router.use(protect, authorizeRoles('member'));

router.get('/dashboard', getMemberDashboard);
router.route('/profile')
  .get(getMemberProfile)
  .patch(updateMemberProfile);

router.get('/membership', getMemberMembership);
router.get('/trainer', getMemberTrainer);
router.route('/trainer-request')
  .get(getMyTrainerAssignment)
  .post(requestTrainer);

// Workout Plan (Self)
router.get('/workout', getMemberWorkout);
router.get('/workouts/history', getMemberWorkoutHistory);

// Diet Plan (Self)
router.get('/diet', getMemberDiet);
router.get('/diets/history', getMemberDietHistory);

// Training Sessions
router.route('/sessions')
  .post(bookMemberSession)
  .get(getMemberSessions);

router.patch('/sessions/:id/cancel', cancelMemberSession);
router.patch('/sessions/:id/reschedule', rescheduleMemberSession);

// Attendance (Self)
router.post('/attendance/check-in', memberCheckIn);
router.post('/attendance/check-out', memberCheckOut);
router.get('/attendance', getMyAttendance);
router.get('/attendance/stats', getMyAttendanceStats);

// Progress Tracking (Self)
router.route('/progress')
  .get(getMyProgress)
  .post(addMyProgress);

router.get('/progress/latest', getLatestProgress);

// Phase 7: Member Payments & Checkout (Self)
const {
  createOrder,
  verifyPayment,
  getMyPayments,
  getMyPaymentById,
  downloadReceipt,
} = require('../controllers/paymentController');

router.post('/payments/create-order', createOrder);
router.post('/payments/verify', verifyPayment);
router.get('/payments', getMyPayments);
router.get('/payments/:paymentId', getMyPaymentById);
router.get('/payments/:paymentId/receipt', downloadReceipt);

module.exports = router;
