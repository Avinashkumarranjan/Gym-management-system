const TrainingSession = require('../models/TrainingSession');
const MemberProfile = require('../models/MemberProfile');
const TrainerProfile = require('../models/TrainerProfile');
const User = require('../models/User');
const { createNotification } = require('../services/notificationService');

// Helper to get day bounds
const getDayBounds = (dateStr) => {
  const d = new Date(dateStr);
  const start = new Date(d);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(d);
  end.setUTCHours(23, 59, 59, 999);
  return { start, end };
};

// @desc    Book a training session with assigned coach
// @route   POST /api/member/sessions
// @access  Private (Member)
const bookMemberSession = async (req, res, next) => {
  try {
    const { sessionDate, startTime, endTime, memberNote } = req.body;

    if (!sessionDate || !startTime) {
      return res.status(400).json({
        success: false,
        message: 'Session date and start time are required',
      });
    }

    // 1. Verify Member Profile & Assigned Trainer
    const memberProfile = await MemberProfile.findOne({ user: req.user._id });
    if (!memberProfile || !memberProfile.assignedTrainer) {
      return res.status(400).json({
        success: false,
        message: 'No trainer is currently assigned to your account. Please speak to gym staff.',
      });
    }

    const trainerId = memberProfile.assignedTrainer;

    // 2. Verify Trainer account & availability
    const trainerUser = await User.findById(trainerId);
    if (!trainerUser || !trainerUser.isActive || trainerUser.role !== 'trainer') {
      return res.status(400).json({
        success: false,
        message: 'Assigned trainer is currently inactive.',
      });
    }

    const trainerProfile = await TrainerProfile.findOne({ user: trainerId });
    if (trainerProfile && trainerProfile.isAvailable === false) {
      return res.status(400).json({
        success: false,
        message: 'Your assigned coach is currently not accepting new session bookings.',
      });
    }

    // 3. Date validity (Cannot book past dates)
    const targetDate = new Date(sessionDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bookingDateMidnight = new Date(targetDate);
    bookingDateMidnight.setHours(0, 0, 0, 0);

    if (bookingDateMidnight < today) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book sessions on past dates.',
      });
    }

    // Check day of week against trainer availableDays if configured
    if (trainerProfile && trainerProfile.availableDays && trainerProfile.availableDays.length > 0) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayName = days[targetDate.getDay()];
      if (!trainerProfile.availableDays.includes(dayName)) {
        return res.status(400).json({
          success: false,
          message: `Coach is not available on ${dayName}s. Available days: ${trainerProfile.availableDays.join(', ')}`,
        });
      }
    }

    // 4. Calculate default endTime if omitted (1 hour slot)
    let calculatedEndTime = endTime;
    if (!calculatedEndTime) {
      const [h, m] = startTime.split(':').map(Number);
      const endH = (h + 1).toString().padStart(2, '0');
      calculatedEndTime = `${endH}:${(m || 0).toString().padStart(2, '0')}`;
    }

    // 5. Conflict Prevention (Trainer double booking & Member double booking)
    const { start: dayStart, end: dayEnd } = getDayBounds(sessionDate);

    // Check trainer conflict
    const trainerConflict = await TrainingSession.findOne({
      trainer: trainerId,
      sessionDate: { $gte: dayStart, $lte: dayEnd },
      startTime,
      status: 'scheduled',
    });

    if (trainerConflict) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is already booked for your coach. Please choose another time.',
      });
    }

    // Check member conflict
    const memberConflict = await TrainingSession.findOne({
      member: req.user._id,
      sessionDate: { $gte: dayStart, $lte: dayEnd },
      startTime,
      status: 'scheduled',
    });

    if (memberConflict) {
      return res.status(400).json({
        success: false,
        message: 'You already have a scheduled session at this time.',
      });
    }

    // 6. Create Session
    const session = await TrainingSession.create({
      trainer: trainerId,
      member: req.user._id,
      sessionDate: targetDate,
      startTime,
      endTime: calculatedEndTime,
      status: 'scheduled',
      memberNote: memberNote ? memberNote.trim() : '',
      createdBy: req.user._id,
    });

    const populated = await TrainingSession.findById(session._id)
      .populate('trainer', 'name email phone avatar')
      .populate('member', 'name email phone avatar');

    // Notify trainer of newly booked session
    createNotification({
      user: trainerId,
      type: 'session_booked',
      title: 'New Training Session Booked',
      message: `${req.user.name || 'An athlete'} booked a 1-on-1 session on ${new Date(targetDate).toLocaleDateString()} at ${startTime}.`,
      link: '/trainer/schedule',
    }).catch((err) => console.error('Failed to send session booked notification:', err.message));

    return res.status(201).json({
      success: true,
      message: 'Training session booked successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get member's own training sessions
// @route   GET /api/member/sessions
// @access  Private (Member)
const getMemberSessions = async (req, res, next) => {
  try {
    const sessions = await TrainingSession.find({ member: req.user._id })
      .sort({ sessionDate: -1, startTime: -1 })
      .populate('trainer', 'name email phone avatar');

    return res.status(200).json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel member's own scheduled session
// @route   PATCH /api/member/sessions/:id/cancel
// @access  Private (Member)
const cancelMemberSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = await TrainingSession.findById(id);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    if (session.member.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: You cannot cancel another athlete\'s session.',
      });
    }

    if (session.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a session that is already ${session.status}.`,
      });
    }

    session.status = 'cancelled';
    await session.save();

    // Notify trainer of cancellation
    createNotification({
      user: session.trainer,
      type: 'session_cancelled',
      title: 'Session Cancelled by Member',
      message: `${req.user.name || 'Member'} cancelled the session scheduled for ${new Date(session.sessionDate).toLocaleDateString()} at ${session.startTime}.`,
      link: '/trainer/schedule',
    }).catch((err) => console.error('Failed to send session cancelled notification:', err.message));

    return res.status(200).json({
      success: true,
      message: 'Training session cancelled successfully',
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reschedule member's own scheduled session
// @route   PATCH /api/member/sessions/:id/reschedule
// @access  Private (Member)
const rescheduleMemberSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { sessionDate, startTime, endTime } = req.body;

    if (!sessionDate || !startTime) {
      return res.status(400).json({
        success: false,
        message: 'New session date and start time are required',
      });
    }

    const session = await TrainingSession.findById(id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    if (session.member.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: You cannot reschedule another athlete\'s session.',
      });
    }

    if (session.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: 'Only active scheduled sessions can be rescheduled.',
      });
    }

    const targetDate = new Date(sessionDate);
    const { start: dayStart, end: dayEnd } = getDayBounds(sessionDate);

    // Conflict check for trainer
    const trainerConflict = await TrainingSession.findOne({
      _id: { $ne: session._id },
      trainer: session.trainer,
      sessionDate: { $gte: dayStart, $lte: dayEnd },
      startTime,
      status: 'scheduled',
    });

    if (trainerConflict) {
      return res.status(400).json({
        success: false,
        message: 'The requested time slot is already booked for your coach.',
      });
    }

    // Conflict check for member
    const memberConflict = await TrainingSession.findOne({
      _id: { $ne: session._id },
      member: req.user._id,
      sessionDate: { $gte: dayStart, $lte: dayEnd },
      startTime,
      status: 'scheduled',
    });

    if (memberConflict) {
      return res.status(400).json({
        success: false,
        message: 'You already have another session scheduled at this time.',
      });
    }

    session.sessionDate = targetDate;
    session.startTime = startTime;
    if (endTime) session.endTime = endTime;
    await session.save();

    const populated = await TrainingSession.findById(session._id)
      .populate('trainer', 'name email phone avatar')
      .populate('member', 'name email phone avatar');

    return res.status(200).json({
      success: true,
      message: 'Session rescheduled successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get trainer's own sessions
// @route   GET /api/trainer/sessions
// @access  Private (Trainer)
const getTrainerSessions = async (req, res, next) => {
  try {
    const sessions = await TrainingSession.find({ trainer: req.user._id })
      .sort({ sessionDate: 1, startTime: 1 })
      .populate('member', 'name email phone avatar');

    return res.status(200).json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel trainer's own session
// @route   PATCH /api/trainer/sessions/:id/cancel
// @access  Private (Trainer)
const cancelTrainerSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = await TrainingSession.findById(id);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    if (session.trainer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: You did not organize this training session.',
      });
    }

    session.status = 'cancelled';
    await session.save();

    // Notify member of cancellation
    createNotification({
      user: session.member,
      type: 'session_cancelled',
      title: 'Session Cancelled by Coach',
      message: `Your coach cancelled the training session scheduled for ${new Date(session.sessionDate).toLocaleDateString()} at ${session.startTime}.`,
      link: '/member/schedule',
    }).catch((err) => console.error('Failed to send session cancelled notification:', err.message));

    return res.status(200).json({
      success: true,
      message: 'Session cancelled successfully',
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update trainer notes for a session
// @route   PATCH /api/trainer/sessions/:id/note
// @access  Private (Trainer)
const updateTrainerSessionNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { trainerNote } = req.body;

    const session = await TrainingSession.findById(id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    if (session.trainer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: You cannot modify notes on this session.',
      });
    }

    session.trainerNote = trainerNote ? trainerNote.trim() : '';
    await session.save();

    return res.status(200).json({
      success: true,
      message: 'Trainer notes updated successfully',
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all sessions (Admin oversight)
// @route   GET /api/admin/sessions
// @access  Private (Admin)
const getAdminSessions = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 15));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const total = await TrainingSession.countDocuments(filter);
    const pages = Math.ceil(total / limit) || 1;

    const sessions = await TrainingSession.find(filter)
      .sort({ sessionDate: -1, startTime: -1 })
      .skip(skip)
      .limit(limit)
      .populate('trainer', 'name email phone')
      .populate('member', 'name email phone');

    return res.status(200).json({
      success: true,
      data: sessions,
      page,
      pages,
      total,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  bookMemberSession,
  getMemberSessions,
  cancelMemberSession,
  rescheduleMemberSession,
  getTrainerSessions,
  cancelTrainerSession,
  updateTrainerSessionNote,
  getAdminSessions,
};
