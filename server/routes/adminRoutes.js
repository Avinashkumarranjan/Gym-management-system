const express = require('express');
const router = express.Router();

const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const User = require('../models/User');

const { getDashboardStats } = require('../controllers/adminController');
const {
  getMembers,
  getMemberById,
  createMember,
  updateMember,
  updateMemberStatus,
  assignTrainer,
  assignMembership,
  deleteMember,
} = require('../controllers/memberController');

const {
  getTrainers,
  getTrainerById,
  createTrainer,
  updateTrainer,
  updateTrainerStatus,
} = require('../controllers/trainerController');

const {
  getMembershipPlans,
  getMembershipPlanById,
  createMembershipPlan,
  updateMembershipPlan,
  updateMembershipPlanStatus,
} = require('../controllers/membershipController');

const {
  getAdminTrainerAssignments,
  assignTrainerToRequest,
  rejectTrainerRequest,
} = require('../controllers/trainerAssignmentController');

// All /api/admin/* routes are strictly protected and require the 'admin' role
router.use(protect, authorizeRoles('admin'));

// 1. Dashboard
router.get('/dashboard', getDashboardStats);

// 2. Members
router.route('/members')
  .get(getMembers)
  .post(createMember);

router.route('/members/:id')
  .get(getMemberById)
  .patch(updateMember)
  .delete(deleteMember);

router.patch('/members/:id/status', updateMemberStatus);
router.patch('/members/:id/trainer', assignTrainer);
router.patch('/members/:id/membership', assignMembership);

// 3. Trainers
router.route('/trainers')
  .get(getTrainers)
  .post(createTrainer);

router.route('/trainers/:id')
  .get(getTrainerById)
  .patch(updateTrainer);

router.patch('/trainers/:id/status', updateTrainerStatus);

// Trainer Assignment Oversight (Post-Membership Onboarding)
router.get('/trainer-assignments', getAdminTrainerAssignments);
router.post('/trainer-assignments/:id/assign', assignTrainerToRequest);
router.patch('/trainer-assignments/:id/reject', rejectTrainerRequest);

// 4. Membership Plans
router.route('/membership-plans')
  .get(getMembershipPlans)
  .post(createMembershipPlan);

router.route('/membership-plans/:id')
  .get(getMembershipPlanById)
  .patch(updateMembershipPlan);

router.patch('/membership-plans/:id/status', updateMembershipPlanStatus);

// 5. Admin Profile
router.get('/profile', (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});

router.patch('/profile', async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findById(req.user._id);
    if (name) user.name = name.trim();
    if (phone) user.phone = phone.trim();
    await user.save();
    res.status(200).json({ success: true, message: 'Profile updated successfully', user });
  } catch (error) {
    next(error);
  }
});

// 6. Phase 5 Oversight Routes (Admin)
const { getAdminWorkouts } = require('../controllers/workoutController');
const { getAdminDiets } = require('../controllers/dietController');
const { getAdminSessions } = require('../controllers/sessionController');

// 7. Phase 6 Oversight Routes (Admin)
const { getAdminAttendance, getAdminAttendanceStats } = require('../controllers/attendanceController');
const { getAdminProgress } = require('../controllers/progressController');

router.get('/workouts', getAdminWorkouts);
router.get('/diets', getAdminDiets);
router.get('/sessions', getAdminSessions);
router.get('/attendance', getAdminAttendance);
router.get('/attendance/stats', getAdminAttendanceStats);
router.get('/progress', getAdminProgress);

// 8. Phase 7: Payment Oversight & Manual Billing (Admin)
const {
  getAdminPayments,
  getAdminPaymentById,
  createManualPayment,
  downloadAdminReceipt,
  getRevenueAnalytics,
} = require('../controllers/adminPaymentController');

router.get('/payments', getAdminPayments);
router.get('/payments/analytics', getRevenueAnalytics);
router.get('/payments/:id', getAdminPaymentById);
router.get('/payments/:id/receipt', downloadAdminReceipt);
router.post('/payments/manual', createManualPayment);

// 9. Phase 8: Contact Inquiries (Admin)
const {
  getContactInquiries,
  getContactInquiryById,
  updateInquiryStatus,
  updateInquiryNotes,
} = require('../controllers/contactController');

router.get('/contact-inquiries', getContactInquiries);
router.get('/contact-inquiries/:id', getContactInquiryById);
router.patch('/contact-inquiries/:id/status', updateInquiryStatus);
router.patch('/contact-inquiries/:id/notes', updateInquiryNotes);

module.exports = router;

