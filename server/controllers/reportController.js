const User = require('../models/User');
const MemberProfile = require('../models/MemberProfile');
const TrainerProfile = require('../models/TrainerProfile');
const MembershipPlan = require('../models/MembershipPlan');
const Payment = require('../models/Payment');
const Attendance = require('../models/Attendance');
const TrainingSession = require('../models/TrainingSession');
const WorkoutPlan = require('../models/WorkoutPlan');
const DietPlan = require('../models/DietPlan');

// Helper to escape CSV values
const csvSafe = (val) => {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
};

// @desc    Get comprehensive reports summary
// @route   GET /api/admin/reports/summary
// @access  Private (Admin)
const getReportsSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const now = new Date();

    // Date range filter helper
    const dateFilter = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }
    if (endDate) {
      const eDate = new Date(endDate);
      eDate.setHours(23, 59, 59, 999);
      dateFilter.$lte = eDate;
    }

    // ==========================================
    // 1. MEMBERSHIP REPORT
    // ==========================================
    const totalActiveMemberships = await MemberProfile.countDocuments({ membershipStatus: 'active' });
    const totalExpiredMemberships = await MemberProfile.countDocuments({ membershipStatus: 'expired' });
    const totalPendingMemberships = await MemberProfile.countDocuments({ membershipStatus: 'pending' });

    // Expiry thresholds
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const expiringIn7Days = await MemberProfile.countDocuments({
      membershipStatus: 'active',
      membershipEndDate: { $gte: now, $lte: sevenDaysFromNow },
    });

    const expiringIn30Days = await MemberProfile.countDocuments({
      membershipStatus: 'active',
      membershipEndDate: { $gte: now, $lte: thirtyDaysFromNow },
    });

    // Membership distribution by plan
    const planDistributionAgg = await MemberProfile.aggregate([
      { $match: { membershipPlan: { $ne: null } } },
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
          as: 'planDetails',
        },
      },
      { $unwind: { path: '$planDetails', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          planName: { $ifNull: ['$planDetails.name', 'Custom Plan'] },
          count: 1,
        },
      },
    ]);

    // ==========================================
    // 2. REVENUE / PAYMENT REPORT (status = 'paid')
    // ==========================================
    const paymentMatch = { status: 'paid' };
    if (dateFilter.$gte || dateFilter.$lte) {
      paymentMatch.createdAt = dateFilter;
    }

    const revenueStats = await Payment.aggregate([
      { $match: paymentMatch },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalCount: { $sum: 1 },
        },
      },
    ]);

    const totalRevenue = revenueStats.length > 0 ? revenueStats[0].totalRevenue : 0;
    const paidTransactionsCount = revenueStats.length > 0 ? revenueStats[0].totalCount : 0;

    // Monthly revenue over past 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyRevenueAgg = await Payment.aggregate([
      {
        $match: {
          status: 'paid',
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const monthsNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyRevenue = monthlyRevenueAgg.map((item) => ({
      name: `${monthsNames[item._id.month - 1]} ${item._id.year}`,
      revenue: item.revenue,
      count: item.count,
    }));

    // Revenue by plan
    const revenueByPlanAgg = await Payment.aggregate([
      { $match: paymentMatch },
      {
        $group: {
          _id: '$planName',
          revenue: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    const revenueByPlan = revenueByPlanAgg.map((r) => ({
      plan: r._id || 'Standard',
      revenue: r.revenue,
      count: r.count,
    }));

    // Payment method distribution
    const methodDistributionAgg = await Payment.aggregate([
      { $match: paymentMatch },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          total: { $sum: '$amount' },
        },
      },
    ]);

    const paymentMethods = methodDistributionAgg.map((m) => ({
      method: m._id === 'razorpay' ? 'Online (Razorpay)' : m._id ? m._id.toUpperCase() : 'OTHER',
      count: m.count,
      total: m.total,
    }));

    // ==========================================
    // 3. ATTENDANCE REPORT
    // ==========================================
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayAttendanceCount = await Attendance.countDocuments({
      checkInTime: { $gte: todayStart, $lte: todayEnd },
    });

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyVisitsCount = await Attendance.countDocuments({
      checkInTime: { $gte: monthStart },
    });

    // Days elapsed this month (min 1)
    const daysElapsed = Math.max(1, now.getDate());
    const averageDailyAttendance = Math.round((monthlyVisitsCount / daysElapsed) * 10) / 10;

    // Peak day of week and peak hour
    const attendanceTimesAgg = await Attendance.aggregate([
      {
        $project: {
          dayOfWeek: { $dayOfWeek: '$checkInTime' }, // 1 (Sun) to 7 (Sat)
          hour: { $hour: '$checkInTime' },
        },
      },
      {
        $facet: {
          peakDay: [
            { $group: { _id: '$dayOfWeek', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 },
          ],
          peakHour: [
            { $group: { _id: '$hour', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 },
          ],
        },
      },
    ]);

    const dayNames = ['', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const peakDayId = attendanceTimesAgg[0]?.peakDay[0]?._id;
    const peakDay = peakDayId ? dayNames[peakDayId] : 'Monday';

    const peakHourVal = attendanceTimesAgg[0]?.peakHour[0]?._id;
    let peakHour = '6:00 PM';
    if (peakHourVal !== undefined && peakHourVal !== null) {
      const h = Number(peakHourVal);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const displayH = h % 12 || 12;
      peakHour = `${displayH}:00 ${ampm}`;
    }

    // ==========================================
    // 4. MEMBER GROWTH REPORT
    // ==========================================
    const totalMembers = await User.countDocuments({ role: 'member' });
    const activeMembersCount = await User.countDocuments({ role: 'member', isActive: true });
    const inactiveMembersCount = totalMembers - activeMembersCount;

    // Growth by month (past 6 months)
    const memberGrowthAgg = await User.aggregate([
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
          newMembers: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const memberGrowth = memberGrowthAgg.map((item) => ({
      name: `${monthsNames[item._id.month - 1]} ${item._id.year}`,
      newMembers: item.newMembers,
    }));

    // ==========================================
    // 5. TRAINER WORKLOAD REPORT
    // ==========================================
    const trainers = await User.find({ role: 'trainer' }).select('name email phone avatar isActive');

    const trainerWorkload = await Promise.all(
      trainers.map(async (trainer) => {
        const assignedMembersCount = await MemberProfile.countDocuments({ assignedTrainer: trainer._id });
        const upcomingSessionsCount = await TrainingSession.countDocuments({
          trainer: trainer._id,
          sessionDate: { $gte: todayStart },
          status: 'scheduled',
        });
        const activeWorkoutsCount = await WorkoutPlan.countDocuments({
          trainer: trainer._id,
          isActive: true,
        });
        const activeDietsCount = await DietPlan.countDocuments({
          trainer: trainer._id,
          isActive: true,
        });

        return {
          id: trainer._id,
          name: trainer.name,
          email: trainer.email,
          isActive: trainer.isActive,
          assignedMembers: assignedMembersCount,
          upcomingSessions: upcomingSessionsCount,
          activeWorkouts: activeWorkoutsCount,
          activeDiets: activeDietsCount,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: {
        membership: {
          totalActive: totalActiveMemberships,
          totalExpired: totalExpiredMemberships,
          totalPending: totalPendingMemberships,
          expiringIn7Days,
          expiringIn30Days,
          distribution: planDistributionAgg,
        },
        revenue: {
          totalRevenue,
          paidTransactionsCount,
          monthlyRevenue,
          revenueByPlan,
          paymentMethods,
        },
        attendance: {
          todayCount: todayAttendanceCount,
          monthlyVisits: monthlyVisitsCount,
          averageDailyAttendance,
          peakDay,
          peakHour,
        },
        growth: {
          totalMembers,
          activeMembers: activeMembersCount,
          inactiveMembers: inactiveMembersCount,
          monthlyGrowth: memberGrowth,
        },
        trainerWorkload,
      },
    });
  } catch (error) {
    next(error);
  }
};

// =========================================================================
// CSV EXPORTS (Admin only, securely sanitized)
// =========================================================================

// @desc    Export Members CSV
// @route   GET /api/admin/reports/export/members
// @access  Private (Admin)
const exportMembersCSV = async (req, res, next) => {
  try {
    const members = await User.find({ role: 'member' })
      .select('name email phone isActive createdAt')
      .sort({ createdAt: -1 });

    const profiles = await MemberProfile.find()
      .populate('membershipPlan', 'name')
      .populate('assignedTrainer', 'name');

    const profileMap = new Map();
    profiles.forEach((p) => {
      profileMap.set(p.user.toString(), p);
    });

    const headers = [
      'Name',
      'Email',
      'Phone',
      'Account Status',
      'Membership Status',
      'Plan',
      'Assigned Trainer',
      'Joined Date',
      'Membership Expiry',
    ];

    const rows = members.map((m) => {
      const prof = profileMap.get(m._id.toString());
      return [
        csvSafe(m.name),
        csvSafe(m.email),
        csvSafe(m.phone || 'N/A'),
        csvSafe(m.isActive ? 'Active' : 'Inactive'),
        csvSafe(prof?.membershipStatus || 'None'),
        csvSafe(prof?.membershipPlan?.name || 'None'),
        csvSafe(prof?.assignedTrainer?.name || 'Unassigned'),
        csvSafe(m.createdAt ? new Date(m.createdAt).toISOString().split('T')[0] : 'N/A'),
        csvSafe(prof?.membershipEndDate ? new Date(prof.membershipEndDate).toISOString().split('T')[0] : 'N/A'),
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="fitcore-members-${Date.now()}.csv"`);
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

// @desc    Export Payments CSV
// @route   GET /api/admin/reports/export/payments
// @access  Private (Admin)
const exportPaymentsCSV = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = { status: 'paid' };

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const eDate = new Date(endDate);
        eDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = eDate;
      }
    }

    const payments = await Payment.find(filter)
      .populate('member', 'name email phone')
      .sort({ createdAt: -1 });

    const headers = [
      'Invoice Number',
      'Member Name',
      'Member Email',
      'Plan',
      'Amount (INR)',
      'Payment Method',
      'Status',
      'Paid Date',
    ];

    const rows = payments.map((p) => [
      csvSafe(p.invoiceNumber || p._id),
      csvSafe(p.member?.name || 'Unknown Member'),
      csvSafe(p.member?.email || 'N/A'),
      csvSafe(p.planName || 'Membership'),
      csvSafe(p.amount),
      csvSafe(p.paymentMethod || 'razorpay'),
      csvSafe(p.status),
      csvSafe(p.paidAt ? new Date(p.paidAt).toISOString().split('T')[0] : new Date(p.createdAt).toISOString().split('T')[0]),
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="fitcore-payments-${Date.now()}.csv"`);
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

// @desc    Export Attendance CSV
// @route   GET /api/admin/reports/export/attendance
// @access  Private (Admin)
const exportAttendanceCSV = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = {};

    if (startDate || endDate) {
      filter.checkInTime = {};
      if (startDate) filter.checkInTime.$gte = new Date(startDate);
      if (endDate) {
        const eDate = new Date(endDate);
        eDate.setHours(23, 59, 59, 999);
        filter.checkInTime.$lte = eDate;
      }
    }

    const records = await Attendance.find(filter)
      .populate('member', 'name email phone')
      .sort({ checkInTime: -1 })
      .limit(1000);

    const headers = ['Member Name', 'Member Email', 'Check-In Date', 'Check-In Time', 'Status'];

    const rows = records.map((a) => {
      const d = a.checkInTime ? new Date(a.checkInTime) : null;
      return [
        csvSafe(a.member?.name || 'Member'),
        csvSafe(a.member?.email || 'N/A'),
        csvSafe(d ? d.toISOString().split('T')[0] : 'N/A'),
        csvSafe(d ? d.toLocaleTimeString() : 'N/A'),
        csvSafe(a.status || 'present'),
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="fitcore-attendance-${Date.now()}.csv"`);
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

// @desc    Export Expiring Members CSV
// @route   GET /api/admin/reports/export/expiring
// @access  Private (Admin)
const exportExpiringMembersCSV = async (req, res, next) => {
  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const profiles = await MemberProfile.find({
      membershipStatus: 'active',
      membershipEndDate: { $gte: now, $lte: thirtyDaysFromNow },
    })
      .populate('user', 'name email phone')
      .populate('membershipPlan', 'name price')
      .sort({ membershipEndDate: 1 });

    const headers = [
      'Member Name',
      'Email',
      'Phone',
      'Current Plan',
      'Plan Price (INR)',
      'Membership End Date',
      'Days Remaining',
    ];

    const rows = profiles.map((p) => {
      const daysRemaining = Math.max(
        0,
        Math.ceil((new Date(p.membershipEndDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      );

      return [
        csvSafe(p.user?.name || 'N/A'),
        csvSafe(p.user?.email || 'N/A'),
        csvSafe(p.user?.phone || 'N/A'),
        csvSafe(p.membershipPlan?.name || 'Standard'),
        csvSafe(p.membershipPlan?.price || '0'),
        csvSafe(new Date(p.membershipEndDate).toISOString().split('T')[0]),
        csvSafe(daysRemaining),
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="fitcore-expiring-members-${Date.now()}.csv"`);
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReportsSummary,
  exportMembersCSV,
  exportPaymentsCSV,
  exportAttendanceCSV,
  exportExpiringMembersCSV,
};
