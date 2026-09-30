const express = require('express');
const router = express.Router();
const {
  getReportsSummary,
  exportMembersCSV,
  exportPaymentsCSV,
  exportAttendanceCSV,
  exportExpiringMembersCSV,
} = require('../controllers/reportController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// All report endpoints are Admin-only
router.use(protect, authorizeRoles('admin'));

// Summary KPI and aggregation endpoint
router.get('/summary', getReportsSummary);

// Sanitized CSV export endpoints
router.get('/export/members', exportMembersCSV);
router.get('/export/payments', exportPaymentsCSV);
router.get('/export/attendance', exportAttendanceCSV);
router.get('/export/expiring', exportExpiringMembersCSV);

module.exports = router;
