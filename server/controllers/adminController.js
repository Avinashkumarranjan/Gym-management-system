const User = require('../models/User');
const MemberProfile = require('../models/MemberProfile');
const TrainerProfile = require('../models/TrainerProfile');
const MembershipPlan = require('../models/MembershipPlan');
const Payment = require('../models/Payment');
const TrainerAssignmentRequest = require('../models/TrainerAssignmentRequest');

// @desc    Get Admin Dashboard Analytics
// @route   GET /api/admin/dashboard
// @access  Private (Admin only)
const getDashboardStats = async (req, res, next) => {
  try {
    // 1. Total & Active Members
    const totalMembers = await User.countDocuments({ role: 'member' });
    const activeMembers = await User.countDocuments({ role: 'member', isActive: true });
    const inactiveMembers = totalMembers - activeMembers;

    // 2. Total Trainers
    const totalTrainers = await User.countDocuments({ role: 'trainer' });
    const activeTrainers = await User.countDocuments({ role: 'trainer', isActive: true });

    // 3. Active Memberships & Pending Trainer Assignments
    const activeMemberships = await MemberProfile.countDocuments({
      membershipStatus: 'active',
    });
    const pendingTrainerAssignments = await TrainerAssignmentRequest.countDocuments({
      status: 'pending',
    });

    // 4. New members this month & dates
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const newMembersThisMonth = await User.countDocuments({
      role: 'member',
      createdAt: { $gte: startOfMonth },
    });

    // 5. Phase 7: Real Revenue Aggregation (Only status: 'paid')
    const [totalRevenueAgg, revenueThisMonthAgg, paymentsTodayAgg] = await Promise.all([
      Payment.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Payment.aggregate([
        { $match: { status: 'paid', paidAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Payment.aggregate([
        { $match: { status: 'paid', paidAt: { $gte: startOfToday } } },
        { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$amount' } } },
      ]),
    ]);

    const totalRevenue = totalRevenueAgg[0]?.total || 0;
    const revenueThisMonth = revenueThisMonthAgg[0]?.total || 0;
    const paymentsTodayCount = paymentsTodayAgg[0]?.count || 0;
    const paymentsTodayAmount = paymentsTodayAgg[0]?.total || 0;

    const successfulPaymentsCount = await Payment.countDocuments({ status: 'paid' });
    const pendingPaymentsCount = await Payment.countDocuments({ status: { $in: ['created', 'pending'] } });
    const failedPaymentsCount = await Payment.countDocuments({ status: { $in: ['failed', 'cancelled'] } });

    // 6. Recent 5 members
    const recentMembers = await MemberProfile.find()
      .populate('user', 'name email phone isActive createdAt avatar')
      .populate('membershipPlan', 'name price')
      .populate('assignedTrainer', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    // 7. Recent 5 trainers
    const recentTrainers = await TrainerProfile.find()
      .populate('user', 'name email phone isActive createdAt avatar')
      .sort({ createdAt: -1 })
      .limit(5);

    // 8. Membership distribution by plan (real aggregate)
    const membershipDistribution = await MemberProfile.aggregate([
      {
        $match: { membershipPlan: { $ne: null } },
      },
      {
        $group: {
          _id: '$membershipPlan',
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
      {
        $unwind: '$plan',
      },
      {
        $project: {
          _id: 0,
          name: '$plan.name',
          count: 1,
        },
      },
    ]);

    // 9. Member growth over last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyRegistrations = await User.aggregate([
      {
        $match: {
          role: 'member',
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
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

    // 10. Monthly Revenue over last 6 months (Real MongoDB Aggregation)
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

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const memberGrowth = monthlyRegistrations.map((item) => ({
      month: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      members: item.count,
    }));

    const monthlyRevenue = monthlyRevenueAgg.map((item) => ({
      month: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      revenue: item.revenue,
      transactions: item.count,
    }));

    return res.status(200).json({
      success: true,
      stats: {
        totalMembers,
        activeMembers,
        inactiveMembers,
        totalTrainers,
        activeTrainers,
        activeMemberships,
        pendingTrainerAssignments,
        newMembersThisMonth,
        // Revenue KPIs
        totalRevenue,
        revenueThisMonth,
        paymentsTodayCount,
        paymentsTodayAmount,
        successfulPaymentsCount,
        pendingPaymentsCount,
        failedPaymentsCount,
      },
      recentMembers: recentMembers.filter((m) => m.user), // filter any dangling refs
      recentTrainers: recentTrainers.filter((t) => t.user),
      membershipDistribution,
      memberGrowth,
      monthlyRevenue,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
};
