const WorkoutPlan = require('../models/WorkoutPlan');
const MemberProfile = require('../models/MemberProfile');
const User = require('../models/User');

// Helper to resolve member user ID from MemberProfile ID or User ID
const resolveMemberUserId = async (memberId) => {
  const profile = await MemberProfile.findById(memberId);
  if (profile) return { userId: profile.user, profile };
  const user = await User.findById(memberId);
  if (user && user.role === 'member') {
    const prof = await MemberProfile.findOne({ user: user._id });
    return { userId: user._id, profile: prof };
  }
  return { userId: null, profile: null };
};

// @desc    Create workout plan for an assigned member
// @route   POST /api/trainer/members/:memberId/workouts
// @access  Private (Trainer)
const createTrainerWorkout = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const { title, description, goal, startDate, endDate, weeklySchedule, isActive } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Plan title is required' });
    }

    const { userId, profile } = await resolveMemberUserId(memberId);
    if (!profile || !userId) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    // STRICT OWNERSHIP VERIFICATION
    if (!profile.assignedTrainer || profile.assignedTrainer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: This athlete is not assigned to you.',
      });
    }

    const planIsActive = isActive !== false;

    // If new plan is active, deactivate older active plans for this member
    if (planIsActive) {
      await WorkoutPlan.updateMany(
        { member: userId, isActive: true },
        { $set: { isActive: false } }
      );
    }

    const workout = await WorkoutPlan.create({
      member: userId,
      trainer: req.user._id,
      title: title.trim(),
      description: description ? description.trim() : '',
      goal: goal || profile.fitnessGoal || 'General Fitness',
      startDate: startDate || new Date(),
      endDate: endDate || null,
      weeklySchedule: weeklySchedule || [],
      isActive: planIsActive,
    });

    const populated = await WorkoutPlan.findById(workout._id)
      .populate('member', 'name email phone avatar')
      .populate('trainer', 'name email phone avatar');

    // Trigger In-App Notification (Phase 8)
    const { createNotification } = require('../services/notificationService');
    await createNotification({
      user: userId,
      type: 'workout_assigned',
      title: 'New Workout Plan Assigned',
      message: `Coach ${req.user.name} assigned a new workout program: "${workout.title}".`,
      link: '/member/workout',
      metadata: { workoutPlanId: workout._id, trainerId: req.user._id },
    });

    return res.status(201).json({
      success: true,
      message: 'Workout plan created successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all workout plans for an assigned member
// @route   GET /api/trainer/members/:memberId/workouts
// @access  Private (Trainer)
const getTrainerMemberWorkouts = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const { userId, profile } = await resolveMemberUserId(memberId);

    if (!profile || !userId) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    // STRICT OWNERSHIP VERIFICATION
    if (!profile.assignedTrainer || profile.assignedTrainer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: This athlete is not assigned to you.',
      });
    }

    const workouts = await WorkoutPlan.find({ member: userId })
      .sort({ createdAt: -1 })
      .populate('trainer', 'name email phone');

    return res.status(200).json({
      success: true,
      data: workouts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single workout plan details
// @route   GET /api/trainer/workouts/:planId
// @access  Private (Trainer/Admin)
const getWorkoutPlanById = async (req, res, next) => {
  try {
    const { planId } = req.params;
    const workout = await WorkoutPlan.findById(planId)
      .populate('member', 'name email phone avatar')
      .populate('trainer', 'name email phone avatar');

    if (!workout) {
      return res.status(404).json({ success: false, message: 'Workout plan not found' });
    }

    // Check trainer ownership if user is a trainer
    if (req.user.role === 'trainer' && workout.trainer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: You did not author this workout plan.',
      });
    }

    return res.status(200).json({
      success: true,
      data: workout,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update workout plan
// @route   PATCH /api/trainer/workouts/:planId
// @access  Private (Trainer)
const updateWorkoutPlan = async (req, res, next) => {
  try {
    const { planId } = req.params;
    const { title, description, goal, startDate, endDate, weeklySchedule } = req.body;

    const workout = await WorkoutPlan.findById(planId);
    if (!workout) {
      return res.status(404).json({ success: false, message: 'Workout plan not found' });
    }

    if (workout.trainer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: You cannot modify this workout plan.',
      });
    }

    if (title !== undefined) workout.title = title.trim();
    if (description !== undefined) workout.description = description.trim();
    if (goal !== undefined) workout.goal = goal.trim();
    if (startDate !== undefined) workout.startDate = startDate;
    if (endDate !== undefined) workout.endDate = endDate;
    if (weeklySchedule !== undefined) workout.weeklySchedule = weeklySchedule;

    await workout.save();

    const populated = await WorkoutPlan.findById(workout._id)
      .populate('member', 'name email phone avatar')
      .populate('trainer', 'name email phone avatar');

    return res.status(200).json({
      success: true,
      message: 'Workout plan updated successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle workout plan active status
// @route   PATCH /api/trainer/workouts/:planId/status
// @access  Private (Trainer)
const toggleWorkoutPlanStatus = async (req, res, next) => {
  try {
    const { planId } = req.params;
    const { isActive } = req.body;

    const workout = await WorkoutPlan.findById(planId);
    if (!workout) {
      return res.status(404).json({ success: false, message: 'Workout plan not found' });
    }

    if (workout.trainer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: You cannot modify this workout plan.',
      });
    }

    const newState = typeof isActive === 'boolean' ? isActive : !workout.isActive;

    if (newState === true) {
      // Deactivate any other active plan for this member
      await WorkoutPlan.updateMany(
        { member: workout.member, _id: { $ne: workout._id }, isActive: true },
        { $set: { isActive: false } }
      );
    }

    workout.isActive = newState;
    await workout.save();

    return res.status(200).json({
      success: true,
      message: `Workout plan ${newState ? 'activated' : 'deactivated'} successfully`,
      data: workout,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get member's own active workout plan
// @route   GET /api/member/workout
// @access  Private (Member)
const getMemberWorkout = async (req, res, next) => {
  try {
    const workout = await WorkoutPlan.findOne({
      member: req.user._id,
      isActive: true,
    }).populate('trainer', 'name email phone avatar');

    return res.status(200).json({
      success: true,
      data: workout || null,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get member's own workout plan history
// @route   GET /api/member/workouts/history
// @access  Private (Member)
const getMemberWorkoutHistory = async (req, res, next) => {
  try {
    const workouts = await WorkoutPlan.find({ member: req.user._id })
      .sort({ createdAt: -1 })
      .populate('trainer', 'name email phone avatar');

    return res.status(200).json({
      success: true,
      data: workouts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all workout plans (Admin oversight)
// @route   GET /api/admin/workouts
// @access  Private (Admin)
const getAdminWorkouts = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status === 'active') filter.isActive = true;
    if (req.query.status === 'inactive') filter.isActive = false;

    const total = await WorkoutPlan.countDocuments(filter);
    const pages = Math.ceil(total / limit) || 1;

    const workouts = await WorkoutPlan.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('member', 'name email phone')
      .populate('trainer', 'name email phone');

    return res.status(200).json({
      success: true,
      data: workouts,
      page,
      pages,
      total,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTrainerWorkout,
  getTrainerMemberWorkouts,
  getWorkoutPlanById,
  updateWorkoutPlan,
  toggleWorkoutPlanStatus,
  getMemberWorkout,
  getMemberWorkoutHistory,
  getAdminWorkouts,
};
