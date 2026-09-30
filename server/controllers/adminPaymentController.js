const Payment = require('../models/Payment');
const MembershipPlan = require('../models/MembershipPlan');
const User = require('../models/User');
const {
  activateOrRenewMembership,
  generateReceiptNumber,
  generateTransactionReference,
} = require('../services/membershipService');
const { generateReceiptPDF } = require('../utils/receiptGenerator');

// @desc    Get all payments for Admin with filters, search and pagination
// @route   GET /api/admin/payments
// @access  Private (Admin)
const getAdminPayments = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const { status, plan, method, search, startDate, endDate } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (plan) {
      query.membershipPlan = plan;
    }

    if (method) {
      query.paymentMethod = method;
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Search by member name / email or transaction reference
    if (search && search.trim()) {
      const term = search.trim();
      const matchingUsers = await User.find({
        $or: [
          { name: { $regex: term, $options: 'i' } },
          { email: { $regex: term, $options: 'i' } },
        ],
      }).select('_id');

      const userIds = matchingUsers.map((u) => u._id);

      query.$or = [
        { transactionReference: { $regex: term, $options: 'i' } },
        { receiptNumber: { $regex: term, $options: 'i' } },
        { razorpayPaymentId: { $regex: term, $options: 'i' } },
        { member: { $in: userIds } },
      ];
    }

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate('member', 'name email phone avatar')
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

// @desc    Get single payment details (Admin)
// @route   GET /api/admin/payments/:id
// @access  Private (Admin)
const getAdminPaymentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findById(id)
      .populate('member', 'name email phone avatar')
      .populate('membershipPlan');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found.',
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

// @desc    Record manual / cash payment by Admin
// @route   POST /api/admin/payments/manual
// @access  Private (Admin)
const createManualPayment = async (req, res, next) => {
  try {
    const { memberId, membershipPlanId, paymentMethod, notes } = req.body;

    if (!memberId || !membershipPlanId) {
      return res.status(400).json({
        success: false,
        message: 'Member ID and Membership Plan ID are required.',
      });
    }

    const validMethods = ['cash', 'card', 'upi', 'bank_transfer', 'other'];
    const chosenMethod = validMethods.includes(paymentMethod) ? paymentMethod : 'cash';

    // Verify member exists
    const member = await User.findById(memberId);
    if (!member || member.role !== 'member') {
      return res.status(404).json({
        success: false,
        message: 'Valid member user not found.',
      });
    }

    // CRITICAL: Load plan price from MongoDB - never trust arbitrary amount
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
        message: 'Selected membership plan is currently inactive.',
      });
    }

    // 1. Activate or renew member's membership using shared service
    const activation = await activateOrRenewMembership(member._id, plan._id);

    // 2. Generate transaction reference and receipt number
    const transactionReference = generateTransactionReference();
    const receiptNumber = await generateReceiptNumber();

    // 3. Create Payment record with 'paid' status
    const payment = await Payment.create({
      member: member._id,
      membershipPlan: plan._id,
      amount: plan.price,
      currency: 'INR',
      provider: 'manual',
      paymentMethod: chosenMethod,
      status: 'paid',
      transactionReference,
      receiptNumber,
      paidAt: new Date(),
      membershipStartDate: activation.membershipStartDate,
      membershipEndDate: activation.membershipEndDate,
      notes: notes ? notes.trim() : `Manual ${chosenMethod.toUpperCase()} payment recorded by admin`,
      metadata: {
        recordedByAdmin: req.user._id,
        recordedAt: new Date(),
      },
    });

    // Trigger In-App Notification for Member
    const { createNotification } = require('../services/notificationService');
    await createNotification({
      user: member._id,
      type: 'payment_success',
      title: 'Payment Recorded & Membership Active',
      message: `A ${chosenMethod.toUpperCase()} payment of ₹${plan.price} was recorded. Your ${plan.name} membership is active until ${new Date(activation.membershipEndDate).toLocaleDateString()}.`,
      link: '/member/payments',
      metadata: { paymentId: payment._id, receiptNumber },
    });

    return res.status(201).json({
      success: true,
      message: activation.wasRenewed
        ? `Manual payment recorded and membership renewed until ${new Date(activation.membershipEndDate).toLocaleDateString()}!`
        : `Manual payment recorded and membership activated!`,
      payment,
      membership: {
        startDate: activation.membershipStartDate,
        endDate: activation.membershipEndDate,
        wasRenewed: activation.wasRenewed,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Download Receipt PDF as Admin
// @route   GET /api/admin/payments/:id/receipt
// @access  Private (Admin)
const downloadAdminReceipt = async (req, res, next) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findById(id)
      .populate('member', 'name email phone')
      .populate('membershipPlan');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found.',
      });
    }

    if (payment.status !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Receipt is only available for paid transactions.',
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

// @desc    Get Real Revenue Analytics for Admin
// @route   GET /api/admin/payments/analytics
// @access  Private (Admin)
const getRevenueAnalytics = async (req, res, next) => {
  try {
    const now = new Date();

    // Start of current day
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Start of current month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Total Revenue (ONLY status: 'paid')
    const totalRevenueAgg = await Payment.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalRevenue = totalRevenueAgg[0]?.total || 0;

    // 2. Revenue This Month
    const revenueThisMonthAgg = await Payment.aggregate([
      { $match: { status: 'paid', paidAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const revenueThisMonth = revenueThisMonthAgg[0]?.total || 0;

    // 3. Payments Today (Count & Amount)
    const paymentsTodayAgg = await Payment.aggregate([
      { $match: { status: 'paid', paidAt: { $gte: startOfToday } } },
      { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$amount' } } },
    ]);
    const paymentsTodayCount = paymentsTodayAgg[0]?.count || 0;
    const paymentsTodayAmount = paymentsTodayAgg[0]?.total || 0;

    // 4. Payment Status Counts
    const successfulPaymentsCount = await Payment.countDocuments({ status: 'paid' });
    const pendingPaymentsCount = await Payment.countDocuments({
      status: { $in: ['created', 'pending'] },
    });
    const failedPaymentsCount = await Payment.countDocuments({
      status: { $in: ['failed', 'cancelled'] },
    });

    // 5. Monthly Revenue over the last 6 months (Real MongoDB Aggregation)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyRevenueAgg = await Payment.aggregate([
      {
        $match: {
          status: 'paid',
          paidAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$paidAt' },
            month: { $month: '$paidAt' },
          },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1,
        },
      },
    ]);

    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];

    const monthlyRevenue = monthlyRevenueAgg.map((item) => ({
      month: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      revenue: item.revenue,
      transactions: item.count,
    }));

    // 6. Revenue by Membership Plan (Real MongoDB Aggregation)
    const revenueByPlanAgg = await Payment.aggregate([
      { $match: { status: 'paid' } },
      {
        $group: {
          _id: '$membershipPlan',
          revenue: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'membershipplans',
          localField: '_id',
          foreignField: '_id',
          as: 'plan',
        },
      },
      { $unwind: '$plan' },
      {
        $project: {
          _id: 0,
          name: '$plan.name',
          revenue: 1,
          count: 1,
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalRevenue,
        revenueThisMonth,
        paymentsTodayCount,
        paymentsTodayAmount,
        successfulPaymentsCount,
        pendingPaymentsCount,
        failedPaymentsCount,
      },
      monthlyRevenue,
      revenueByPlan: revenueByPlanAgg,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminPayments,
  getAdminPaymentById,
  createManualPayment,
  downloadAdminReceipt,
  getRevenueAnalytics,
};
