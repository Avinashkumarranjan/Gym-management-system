const crypto = require('crypto');
const Razorpay = require('razorpay');
const Payment = require('../models/Payment');
const MembershipPlan = require('../models/MembershipPlan');
const {
  activateOrRenewMembership,
  generateReceiptNumber,
  generateTransactionReference,
} = require('../services/membershipService');
const { generateReceiptPDF } = require('../utils/receiptGenerator');

// Initialize Razorpay SDK instance safely
const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error('Razorpay credentials are not configured in environment variables.');
  }

  return new Razorpay({
    key_id,
    key_secret,
  });
};

// @desc    Get all active membership plans for public and checkout
// @route   GET /api/membership-plans
// @access  Public
const getPublicPlans = async (req, res, next) => {
  try {
    const plans = await MembershipPlan.find({ isActive: true })
      .select('name description durationMonths price benefits isActive')
      .sort({ durationMonths: 1 });

    return res.status(200).json({
      success: true,
      count: plans.length,
      data: plans,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create Razorpay Order for a Membership Plan
// @route   POST /api/member/payments/create-order
// @access  Private (Member)
const createOrder = async (req, res, next) => {
  try {
    const { membershipPlanId } = req.body;

    if (!membershipPlanId) {
      return res.status(400).json({
        success: false,
        message: 'Membership plan ID is required.',
      });
    }

    // CRITICAL SECURITY: Never trust amount from frontend. Always query DB.
    const plan = await MembershipPlan.findById(membershipPlanId);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Selected membership plan not found.',
      });
    }

    if (!plan.isActive) {
      return res.status(400).json({
        success: false,
        message: 'The selected membership plan is currently unavailable for purchase.',
      });
    }

    // Safe integer conversion: Rupees to Paise
    const amountInPaise = Math.round(Number(plan.price) * 100);

    if (isNaN(amountInPaise) || amountInPaise <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan pricing configured on server.',
      });
    }

    const transactionReference = generateTransactionReference();
    const razorpay = getRazorpayInstance();

    // Create Razorpay order
    const orderOptions = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: transactionReference.slice(0, 40), // Razorpay receipt max 40 chars
      notes: {
        memberId: req.user._id.toString(),
        memberName: req.user.name || '',
        planId: plan._id.toString(),
        planName: plan.name,
      },
    };

    const razorpayOrder = await razorpay.orders.create(orderOptions);

    // Create Payment record with 'created' status
    const payment = await Payment.create({
      member: req.user._id,
      membershipPlan: plan._id,
      amount: plan.price,
      currency: 'INR',
      provider: 'razorpay',
      paymentMethod: 'upi', // Default initial expectation, updated on capture
      razorpayOrderId: razorpayOrder.id,
      status: 'created',
      transactionReference,
      notes: `Order created for ${plan.name} (${plan.durationMonths} month/s)`,
      metadata: {
        razorpayOrderReceipt: razorpayOrder.receipt,
      },
    });

    // Return checkout safe data (NEVER return razorpay secret)
    return res.status(201).json({
      success: true,
      order: {
        orderId: razorpayOrder.id,
        amount: amountInPaise,
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID,
        planName: plan.name,
        planDuration: plan.durationMonths,
        transactionReference,
        paymentId: payment._id,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Razorpay payment signature & activate/renew membership
// @route   POST /api/member/payments/verify
// @access  Private (Member)
const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.',
      });
    }

    // 1. Load payment by order ID
    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id }).populate('membershipPlan');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment order record not found in system.',
      });
    }

    // 2. Ownership verification: Member A must not verify Member B's order
    if (payment.member.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not own this payment transaction.',
      });
    }

    // 3. Idempotency Check: If payment is already marked 'paid', return without duplicate processing
    if (payment.status === 'paid') {
      return res.status(200).json({
        success: true,
        message: 'Payment is already verified and processed.',
        payment,
      });
    }

    // 4. Cryptographic HMAC SHA256 Signature Verification
    const bodyToSign = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(bodyToSign)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      payment.status = 'failed';
      payment.failureReason = 'Invalid cryptographic signature';
      payment.razorpayPaymentId = razorpay_payment_id;
      await payment.save();

      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: Invalid transaction signature.',
      });
    }

    // 5. Signature Valid: Activate or Renew Membership
    const activationResult = await activateOrRenewMembership(
      payment.member,
      payment.membershipPlan._id
    );

    // 6. Generate stable receipt number
    const receiptNumber = payment.receiptNumber || (await generateReceiptNumber());

    // 7. Update Payment to 'paid'
    payment.status = 'paid';
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.paidAt = new Date();
    payment.receiptNumber = receiptNumber;
    payment.membershipStartDate = activationResult.membershipStartDate;
    payment.membershipEndDate = activationResult.membershipEndDate;
    await payment.save();

    // Trigger In-App Notification (Phase 8)
    const { createNotification } = require('../services/notificationService');
    await createNotification({
      user: payment.member,
      type: 'payment_success',
      title: 'Payment Successful',
      message: `Your ${payment.membershipPlan?.name || 'membership'} subscription has been ${
        activationResult.wasRenewed ? 'renewed' : 'activated'
      } until ${new Date(activationResult.membershipEndDate).toLocaleDateString()}.`,
      link: '/member/payments',
      metadata: { paymentId: payment._id, receiptNumber },
    });

    return res.status(200).json({
      success: true,
      message: activationResult.wasRenewed
        ? 'Membership successfully renewed!'
        : 'Payment verified and membership activated!',
      payment,
      membership: {
        plan: payment.membershipPlan,
        startDate: activationResult.membershipStartDate,
        endDate: activationResult.membershipEndDate,
        wasRenewed: activationResult.wasRenewed,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get member's own payment history with pagination & status filter
// @route   GET /api/member/payments
// @access  Private (Member)
const getMyPayments = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const query = { member: req.user._id };

    if (req.query.status) {
      query.status = req.query.status;
    }

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate('membershipPlan', 'name durationMonths price')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Payment.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: payments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single payment details (ownership verified)
// @route   GET /api/member/payments/:paymentId
// @access  Private (Member)
const getMyPaymentById = async (req, res, next) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId)
      .populate('member', 'name email phone')
      .populate('membershipPlan');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found.',
      });
    }

    // Ownership check
    if (payment.member._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not own this payment record.',
      });
    }

    return res.status(200).json({
      success: true,
      payment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Download PDF Receipt for a verified paid payment
// @route   GET /api/member/payments/:paymentId/receipt
// @access  Private (Member)
const downloadReceipt = async (req, res, next) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId)
      .populate('member', 'name email phone')
      .populate('membershipPlan');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found.',
      });
    }

    // Ownership check
    if (payment.member._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You cannot download receipts for other members.',
      });
    }

    // Paid status check
    if (payment.status !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Receipts can only be generated for completed (paid) transactions.',
      });
    }

    const filename = `FitCore-Receipt-${payment.receiptNumber || payment._id}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    generateReceiptPDF(payment, res);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPublicPlans,
  createOrder,
  verifyPayment,
  getMyPayments,
  getMyPaymentById,
  downloadReceipt,
};
