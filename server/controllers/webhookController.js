const crypto = require('crypto');
const Payment = require('../models/Payment');
const {
  activateOrRenewMembership,
  generateReceiptNumber,
} = require('../services/membershipService');

/**
 * Handle incoming Razorpay Webhooks
 * Route: POST /api/payments/razorpay/webhook
 * Access: Public (Signature verified)
 */
const handleRazorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Safe absence handling: If webhook secret is not set, fail safely without crashing
    if (!webhookSecret) {
      console.warn('⚠️ Razorpay webhook received but RAZORPAY_WEBHOOK_SECRET is not configured on this server.');
      return res.status(503).json({
        success: false,
        message: 'Razorpay webhook handling is not configured on this server.',
      });
    }

    const signature = req.headers['x-razorpay-signature'];
    if (!signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing X-Razorpay-Signature header.',
      });
    }

    // Determine payload data for HMAC verification
    // Either raw buffer from express.json({ verify }) or stringified body
    const payload = req.rawBody ? req.rawBody.toString() : JSON.stringify(req.body);

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook signature.',
      });
    }

    const event = req.body.event;
    const eventData = req.body.payload;

    // Handle payment.captured event
    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = eventData?.payment?.entity;
      const orderId = paymentEntity?.order_id || eventData?.order?.entity?.id;
      const paymentId = paymentEntity?.id;

      if (orderId) {
        const payment = await Payment.findOne({ razorpayOrderId: orderId }).populate('membershipPlan');

        if (payment) {
          // Idempotency: If already paid, do not double-activate or renew again
          if (payment.status === 'paid') {
            return res.status(200).json({ status: 'ok', message: 'Payment already processed.' });
          }

          // Reconcile missed frontend verification
          const activation = await activateOrRenewMembership(
            payment.member,
            payment.membershipPlan._id
          );

          const receiptNumber = payment.receiptNumber || (await generateReceiptNumber());

          payment.status = 'paid';
          payment.razorpayPaymentId = paymentId || payment.razorpayPaymentId;
          payment.paidAt = new Date();
          payment.receiptNumber = receiptNumber;
          payment.membershipStartDate = activation.membershipStartDate;
          payment.membershipEndDate = activation.membershipEndDate;
          payment.notes = payment.notes
            ? `${payment.notes} • Reconciled via webhook (${event})`
            : `Reconciled via webhook (${event})`;

          await payment.save();
        }
      }
    } else if (event === 'payment.failed') {
      const paymentEntity = eventData?.payment?.entity;
      const orderId = paymentEntity?.order_id;

      if (orderId) {
        const payment = await Payment.findOne({ razorpayOrderId: orderId });
        if (payment && payment.status !== 'paid') {
          payment.status = 'failed';
          payment.failureReason = paymentEntity?.error_description || 'Payment failed at gateway';
          payment.razorpayPaymentId = paymentEntity?.id || payment.razorpayPaymentId;
          await payment.save();
        }
      }
    }

    // Always acknowledge Razorpay webhooks with 200 OK
    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook processing error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error processing webhook.' });
  }
};

module.exports = {
  handleRazorpayWebhook,
};
