const Attendance = require('../models/Attendance');
const MemberProfile = require('../models/MemberProfile');
const User = require('../models/User');

// Helper to normalize day bounds (Local/UTC day)
const getDayBounds = (date = new Date()) => {
  const d = new Date(date);
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  return { start, end };
};

// Helper to calculate streaks
const calculateStreaks = (records) => {
  if (!records || records.length === 0) return { currentStreak: 0, longestStreak: 0 };

  // Collect distinct date strings (YYYY-MM-DD)
  const dateSet = new Set(
    records.map((r) => {
      const d = new Date(r.date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
    })
  );

  const sortedDates = Array.from(dateSet).sort().reverse();
  if (sortedDates.length === 0) return { currentStreak: 0, longestStreak: 0 };

  const todayStr = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`;
  })();

  const yesterdayStr = (() => {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    return `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(
      y.getDate()
    ).padStart(2, '0')}`;
  })();

  // Current Streak
  let currentStreak = 0;
  let checkDate = new Date();
  if (!dateSet.has(todayStr) && dateSet.has(yesterdayStr)) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const curStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(
      2,
      '0'
    )}-${String(checkDate.getDate()).padStart(2, '0')}`;

    if (dateSet.has(curStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Longest Streak
  let longestStreak = 0;
  let running = 0;
  let prevTimestamp = null;

  // Sort ascending for longest streak scanning
  const ascDates = Array.from(dateSet).sort();
  for (const dStr of ascDates) {
    const [y, m, d] = dStr.split('-').map(Number);
    const ts = new Date(y, m - 1, d).getTime();

    if (prevTimestamp === null) {
      running = 1;
    } else {
      const diffDays = Math.round((ts - prevTimestamp) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        running++;
      } else {
        running = 1;
      }
    }
    prevTimestamp = ts;
    if (running > longestStreak) {
      longestStreak = running;
    }
  }

  return { currentStreak, longestStreak };
};

// ==========================================
// MEMBER ATTENDANCE ENDPOINTS
// ==========================================

// @desc    Member self check-in
// @route   POST /api/member/attendance/check-in
// @access  Private (Member)
const memberCheckIn = async (req, res, next) => {
  try {
    const memberId = req.user._id;

    // 1. Verify Active Membership
    const profile = await MemberProfile.findOne({ user: memberId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Member profile record not found.',
      });
    }

    const now = new Date();
    const isExpired = profile.membershipEndDate && new Date(profile.membershipEndDate) < now;

    if (profile.membershipStatus !== 'active' || isExpired) {
      return res.status(403).json({
        success: false,
        message: 'An active membership is required to check in.',
      });
    }

    // 2. Check for active check-in today
    const { start, end } = getDayBounds(now);
    const existingActive = await Attendance.findOne({
      member: memberId,
      date: { $gte: start, $lte: end },
      status: 'checked_in',
    });

    if (existingActive) {
      return res.status(400).json({
        success: false,
        message: 'You are already checked in.',
      });
    }

    // 3. Create check-in record
    const attendance = await Attendance.create({
      member: memberId,
      date: start,
      checkInTime: now,
      status: 'checked_in',
      source: req.body.source || 'web_portal',
      notes: req.body.notes || '',
    });

    res.status(201).json({
      success: true,
      message: 'Check-in successful! Have a great workout.',
      data: attendance,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Member self check-out
// @route   POST /api/member/attendance/check-out
// @access  Private (Member)
const memberCheckOut = async (req, res, next) => {
  try {
    const memberId = req.user._id;

    // Find the latest active check-in record
    const record = await Attendance.findOne({
      member: memberId,
      status: 'checked_in',
    }).sort({ checkInTime: -1 });

    if (!record) {
      return res.status(400).json({
        success: false,
        message: 'You are not currently checked in.',
      });
    }

    const checkOutTime = new Date();
    const durationMinutes = Math.max(
      1,
      Math.round((checkOutTime.getTime() - new Date(record.checkInTime).getTime()) / 60000)
    );

    record.checkOutTime = checkOutTime;
    record.durationMinutes = durationMinutes;
    record.status = 'checked_out';
    await record.save();

    res.status(200).json({
      success: true,
      message: `Checked out successfully! Total session duration: ${durationMinutes} minutes.`,
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get member's attendance history
// @route   GET /api/member/attendance
// @access  Private (Member)
const getMyAttendance = async (req, res, next) => {
  try {
    const memberId = req.user._id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const skip = (page - 1) * limit;

    const query = { member: memberId };

    if (req.query.month && req.query.year) {
      const m = parseInt(req.query.month, 10) - 1;
      const y = parseInt(req.query.year, 10);
      const startMonth = new Date(y, m, 1, 0, 0, 0, 0);
      const endMonth = new Date(y, m + 1, 0, 23, 59, 59, 999);
      query.date = { $gte: startMonth, $lte: endMonth };
    }

    const [records, total] = await Promise.all([
      Attendance.find(query).sort({ checkInTime: -1 }).skip(skip).limit(limit),
      Attendance.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: records,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get member's attendance stats and today's state
// @route   GET /api/member/attendance/stats
// @access  Private (Member)
const getMyAttendanceStats = async (req, res, next) => {
  try {
    const memberId = req.user._id;
    const now = new Date();
    const { start: todayStart, end: todayEnd } = getDayBounds(now);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [todayRecord, allRecords, monthCount, last30DaysCount] = await Promise.all([
      Attendance.findOne({
        member: memberId,
        date: { $gte: todayStart, $lte: todayEnd },
      }).sort({ checkInTime: -1 }),
      Attendance.find({ member: memberId }).select('date durationMinutes status checkInTime'),
      Attendance.countDocuments({ member: memberId, date: { $gte: startOfMonth } }),
      Attendance.countDocuments({ member: memberId, date: { $gte: thirtyDaysAgo } }),
    ]);

    // Average session duration
    const checkedOutRecords = allRecords.filter((r) => r.status === 'checked_out' && r.durationMinutes > 0);
    const averageSessionDuration =
      checkedOutRecords.length > 0
        ? Math.round(
            checkedOutRecords.reduce((acc, r) => acc + r.durationMinutes, 0) /
              checkedOutRecords.length
          )
        : 0;

    const { currentStreak, longestStreak } = calculateStreaks(allRecords);

    res.status(200).json({
      success: true,
      data: {
        todayRecord,
        isCurrentlyCheckedIn: todayRecord?.status === 'checked_in',
        attendanceThisMonth: monthCount,
        attendanceLast30Days: last30DaysCount,
        totalVisits: allRecords.length,
        averageSessionDuration,
        currentStreak,
        longestStreak,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// TRAINER ATTENDANCE ENDPOINTS
// ==========================================

// @desc    Trainer view athlete attendance
// @route   GET /api/trainer/members/:memberId/attendance
// @access  Private (Trainer)
const getTrainerMemberAttendance = async (req, res, next) => {
  try {
    const { memberId } = req.params;

    // Verify trainer assignment
    const memberProfile = await MemberProfile.findOne({
      $or: [{ _id: memberId }, { user: memberId }],
    });

    if (!memberProfile) {
      return res.status(404).json({
        success: false,
        message: 'Athlete profile record not found.',
      });
    }

    if (!memberProfile.assignedTrainer || memberProfile.assignedTrainer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Athlete is not assigned to your coaching roster.',
      });
    }

    const athleteUserId = memberProfile.user;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    const [records, monthCount, allRecords] = await Promise.all([
      Attendance.find({ member: athleteUserId }).sort({ checkInTime: -1 }).limit(30),
      Attendance.countDocuments({ member: athleteUserId, date: { $gte: startOfMonth } }),
      Attendance.find({ member: athleteUserId }).select('date'),
    ]);

    const { currentStreak } = calculateStreaks(allRecords);
    const lastVisit = records.length > 0 ? records[0].checkInTime : null;

    res.status(200).json({
      success: true,
      data: {
        records,
        visitsThisMonth: monthCount,
        totalVisits: allRecords.length,
        currentStreak,
        lastVisit,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// ADMIN ATTENDANCE ENDPOINTS
// ==========================================

// @desc    Admin view all gym attendance records with filters
// @route   GET /api/admin/attendance
// @access  Private (Admin)
const getAdminAttendance = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const query = {};

    if (req.query.status && req.query.status !== 'all') {
      query.status = req.query.status;
    }

    if (req.query.date) {
      const { start, end } = getDayBounds(new Date(req.query.date));
      query.date = { $gte: start, $lte: end };
    }

    // Member search
    if (req.query.search) {
      const searchUsers = await User.find({
        role: 'member',
        $or: [
          { name: { $regex: req.query.search, $options: 'i' } },
          { email: { $regex: req.query.search, $options: 'i' } },
        ],
      }).select('_id');

      query.member = { $in: searchUsers.map((u) => u._id) };
    }

    const [records, total] = await Promise.all([
      Attendance.find(query)
        .populate('member', 'name email phone')
        .sort({ checkInTime: -1 })
        .skip(skip)
        .limit(limit),
      Attendance.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: records,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin view attendance analytics & gym traffic
// @route   GET /api/admin/attendance/stats
// @access  Private (Admin)
const getAdminAttendanceStats = async (req, res, next) => {
  try {
    const now = new Date();
    const { start: todayStart, end: todayEnd } = getDayBounds(now);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    const [todayRecords, currentlyInside, monthlyVisits, allRecentRecords] = await Promise.all([
      Attendance.countDocuments({ date: { $gte: todayStart, $lte: todayEnd } }),
      Attendance.countDocuments({ status: 'checked_in' }),
      Attendance.countDocuments({ date: { $gte: startOfMonth } }),
      Attendance.find({ date: { $gte: startOfMonth } }).select('checkInTime date'),
    ]);

    // Average daily visits this month
    const dayOfMonth = now.getDate() || 1;
    const averageDailyVisits = Math.round(monthlyVisits / dayOfMonth);

    // Peak Hour calculation
    const hourCounts = {};
    for (const r of allRecentRecords) {
      if (r.checkInTime) {
        const hour = new Date(r.checkInTime).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    }

    let peakHour = '18:00 - 19:00';
    let maxHourCount = 0;
    for (const [h, count] of Object.entries(hourCounts)) {
      if (count > maxHourCount) {
        maxHourCount = count;
        const hNum = Number(h);
        peakHour = `${String(hNum).padStart(2, '0')}:00 - ${String((hNum + 1) % 24).padStart(2, '0')}:00`;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        todayCheckIns: todayRecords,
        currentlyInside,
        monthlyVisits,
        averageDailyVisits,
        peakHour,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  memberCheckIn,
  memberCheckOut,
  getMyAttendance,
  getMyAttendanceStats,
  getTrainerMemberAttendance,
  getAdminAttendance,
  getAdminAttendanceStats,
};
