const express = require('express');
const router = express.Router();
const { submitContactInquiry } = require('../controllers/contactController');
const { contactLimiter } = require('../middleware/rateLimiter');

// @route   POST /api/contact
// @desc    Submit public contact inquiry
// @access  Public (Rate limited: 5 requests per 15 min per IP)
router.post('/', contactLimiter, submitContactInquiry);

module.exports = router;
