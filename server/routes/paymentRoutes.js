const express = require('express');
const router = express.Router();
const { handleRazorpayWebhook } = require('../controllers/webhookController');
const { getPublicPlans } = require('../controllers/paymentController');

// Public Plans
router.get('/plans', getPublicPlans);

// Razorpay Webhook (Signature verified)
router.post('/razorpay/webhook', handleRazorpayWebhook);

module.exports = router;
