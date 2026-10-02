const WorkoutPlan = require('../models/WorkoutPlan');
const WorkoutLog = require('../models/WorkoutLog');
const MemberProfile = require('../models/MemberProfile');
const User = require('../models/User');
const { createNotification } = require('../services/notificationService');

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

// Helper to check trainer assignment
const verifyTrainerAssignment = (profile, trainerUserId) => {
  if (!profile || !profile.assignedTrainer) return false;
  return profile.assignedTrainer.toString() === trainerUserId.toString();
};

// @desc    Create workout plan for an assigned member
// @route   POST /api/trainer/members/:memberId/workouts
// @access  Private (Trainer/Admin)
const createTrainerWorkout = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const {
      title,
      description,
      goal,
      difficulty,
      splitType,
      duration,
      coachInstructions,
      startDate,
      endDate,
      weeklySchedule,
      status,
      isActive,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Plan title is required' });
    }

    const { userId, profile } = await resolveMemberUserId(memberId);
    if (!profile || !userId) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    // STRICT RBAC: Trainer must be assigned to this athlete (Admin can create for anyone)
    if (req.user.role === 'trainer' && !verifyTrainerAssignment(profile, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: This athlete is not assigned to you.',
      });
    }

    // Determine status & active state
    const planStatus = status === 'draft' ? 'draft' : 'active';
    const planIsActive = planStatus === 'active';

    // If new plan is published as active, archive older active plans for this member
    if (planIsActive) {
      await WorkoutPlan.updateMany(
        { member: userId, isActive: true, isMemberCustom: { $ne: true } },
        { $set: { isActive: false, status: 'archived', archivedAt: new Date() } }
      );
    }

    const workout = await WorkoutPlan.create({
      member: userId,
      trainer: req.user._id,
      title: title.trim(),
      description: description ? description.trim() : '',
      goal: goal || profile.fitnessGoal || 'General Fitness',
      difficulty: difficulty || 'Intermediate',
      splitType: splitType || 'Custom Split',
      duration: duration || '12 Weeks',
      coachInstructions: coachInstructions ? coachInstructions.trim() : '',
      startDate: startDate || new Date(),
      endDate: endDate || null,
      weeklySchedule: Array.isArray(weeklySchedule) ? weeklySchedule : [],
      status: planStatus,
      isActive: planIsActive,
      publishedAt: planIsActive ? new Date() : null,
      version: 1,
    });

    const populated = await WorkoutPlan.findById(workout._id)
      .populate('member', 'name email phone avatar')
      .populate('trainer', 'name email phone avatar');

    // Trigger In-App Notification only if published
    if (planIsActive) {
      await createNotification({
        user: userId,
        type: 'workout_assigned',
        title: 'New Workout Plan Published',
        message: `Coach ${req.user.name} published a new workout program: "${workout.title}".`,
        link: '/member/workout',
        metadata: { workoutPlanId: workout._id, trainerId: req.user._id },
      });
    }

    return res.status(201).json({
      success: true,
      message: planIsActive
        ? 'Workout plan published successfully'
        : 'Workout plan saved as draft',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all workout plans for an assigned member
// @route   GET /api/trainer/members/:memberId/workouts
// @access  Private (Trainer/Admin)
const getTrainerMemberWorkouts = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const { userId, profile } = await resolveMemberUserId(memberId);

    if (!profile || !userId) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    // STRICT OWNERSHIP VERIFICATION
    if (req.user.role === 'trainer' && !verifyTrainerAssignment(profile, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: This athlete is not assigned to you.',
      });
    }

    const workouts = await WorkoutPlan.find({ member: userId, isMemberCustom: { $ne: true } })
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

// @desc    Get single workout plan details
// @route   GET /api/trainer/workouts/:planId
// @access  Private (Trainer/Admin/Member)
const getWorkoutPlanById = async (req, res, next) => {
  try {
    const { planId } = req.params;
    const workout = await WorkoutPlan.findById(planId)
      .populate('member', 'name email phone avatar')
      .populate('trainer', 'name email phone avatar')
      .populate('weeklySchedule.exercises.exercise');

    if (!workout) {
      return res.status(404).json({ success: false, message: 'Workout plan not found' });
    }

    // Check authorization
    if (req.user.role === 'trainer') {
      const isAuthor = workout.trainer && workout.trainer._id.toString() === req.user._id.toString();
      const profile = await MemberProfile.findOne({ user: workout.member._id });
      const isAssigned = profile && profile.assignedTrainer && profile.assignedTrainer.toString() === req.user._id.toString();
      if (!isAuthor && !isAssigned) {
        return res.status(403).json({
          success: false,
          message: 'Access forbidden: You are not authorized to view this workout plan.',
        });
      }
    } else if (req.user.role === 'member') {
      if (workout.member._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access forbidden: This workout plan does not belong to you.',
        });
      }
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
// @access  Private (Trainer/Admin)
const updateWorkoutPlan = async (req, res, next) => {
  try {
    const { planId } = req.params;
    const {
      title,
      description,
      goal,
      difficulty,
      splitType,
      duration,
      coachInstructions,
      startDate,
      endDate,
      weeklySchedule,
      status,
      isActive,
    } = req.body;

    const workout = await WorkoutPlan.findById(planId);
    if (!workout) {
      return res.status(404).json({ success: false, message: 'Workout plan not found' });
    }

    // Strict Trainer Check
    if (req.user.role === 'trainer' && workout.trainer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: You cannot modify this workout plan.',
      });
    }

    if (title !== undefined) workout.title = title.trim();
    if (description !== undefined) workout.description = description.trim();
    if (goal !== undefined) workout.goal = goal.trim();
    if (difficulty !== undefined) workout.difficulty = difficulty;
    if (splitType !== undefined) workout.splitType = splitType;
    if (duration !== undefined) workout.duration = duration;
    if (coachInstructions !== undefined) workout.coachInstructions = coachInstructions.trim();
    if (startDate !== undefined) workout.startDate = startDate;
    if (endDate !== undefined) workout.endDate = endDate;
    if (weeklySchedule !== undefined) workout.weeklySchedule = weeklySchedule;

    const wasDraft = workout.status === 'draft';

    if (status !== undefined) {
      workout.status = status;
      if (status === 'active') {
        workout.isActive = true;
        if (wasDraft) workout.publishedAt = new Date();
        // Deactivate older active plans for member
        await WorkoutPlan.updateMany(
          { member: workout.member, _id: { $ne: workout._id }, isActive: true, isMemberCustom: { $ne: true } },
          { $set: { isActive: false, status: 'archived', archivedAt: new Date() } }
        );
      } else if (status === 'archived') {
        workout.isActive = false;
        workout.archivedAt = new Date();
      } else if (status === 'draft') {
        workout.isActive = false;
      }
    } else if (isActive !== undefined) {
      workout.isActive = isActive;
      workout.status = isActive ? 'active' : 'archived';
      if (isActive) {
        await WorkoutPlan.updateMany(
          { member: workout.member, _id: { $ne: workout._id }, isActive: true, isMemberCustom: { $ne: true } },
          { $set: { isActive: false, status: 'archived', archivedAt: new Date() } }
        );
      }
    }

    workout.version = (workout.version || 1) + 1;
    await workout.save();

    // Trigger notification if newly activated/published
    if (wasDraft && workout.status === 'active') {
      createNotification({
        user: workout.member,
        type: 'workout_assigned',
        title: 'New Workout Plan Published',
        message: `Coach ${req.user.name} published your workout program: "${workout.title}".`,
        link: '/member/workout',
        metadata: { workoutPlanId: workout._id, trainerId: req.user._id },
      }).catch((e) => console.error(e.message));
    }

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

// @desc    Publish a workout plan
// @route   POST /api/trainer/workouts/:planId/publish
// @access  Private (Trainer/Admin)
const publishWorkoutPlan = async (req, res, next) => {
  try {
    const { planId } = req.params;
    const workout = await WorkoutPlan.findById(planId);
    if (!workout) {
      return res.status(404).json({ success: false, message: 'Workout plan not found' });
    }

    if (req.user.role === 'trainer' && workout.trainer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: You cannot publish this workout plan.',
      });
    }

    // Validate that plan has title and exercises
    if (!workout.title || !workout.title.trim()) {
      return res.status(400).json({ success: false, message: 'Workout plan title is required.' });
    }

    const totalExercises = (workout.weeklySchedule || []).reduce(
      (sum, day) => sum + (day.exercises?.length || 0),
      0
    );
    if (totalExercises === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot publish a workout plan with 0 exercises. Add at least one exercise.',
      });
    }

    // Archive previous active plans for this member
    await WorkoutPlan.updateMany(
      { member: workout.member, _id: { $ne: workout._id }, isActive: true, isMemberCustom: { $ne: true } },
      { $set: { isActive: false, status: 'archived', archivedAt: new Date() } }
    );

    workout.status = 'active';
    workout.isActive = true;
    workout.publishedAt = new Date();
    await workout.save();

    // Trigger Notification
    createNotification({
      user: workout.member,
      type: 'workout_assigned',
      title: 'New Workout Plan Published',
      message: `Coach ${req.user.name} published a new workout program: "${workout.title}".`,
      link: '/member/workout',
      metadata: { workoutPlanId: workout._id, trainerId: req.user._id },
    }).catch((e) => console.error(e.message));

    const populated = await WorkoutPlan.findById(workout._id)
      .populate('member', 'name email phone avatar')
      .populate('trainer', 'name email phone avatar');

    return res.status(200).json({
      success: true,
      message: 'Workout plan published and made active for member!',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Duplicate workout plan to a draft copy
// @route   POST /api/trainer/workouts/:planId/duplicate
// @access  Private (Trainer/Admin)
const duplicateWorkoutPlan = async (req, res, next) => {
  try {
    const { planId } = req.params;
    const original = await WorkoutPlan.findById(planId);
    if (!original) {
      return res.status(404).json({ success: false, message: 'Workout plan not found' });
    }

    if (req.user.role === 'trainer') {
      const profile = await MemberProfile.findOne({ user: original.member });
      if (!profile || !verifyTrainerAssignment(profile, req.user._id)) {
        return res.status(403).json({
          success: false,
          message: 'Access forbidden: You are not assigned to this member.',
        });
      }
    }

    const copyData = original.toObject();
    delete copyData._id;
    delete copyData.createdAt;
    delete copyData.updatedAt;

    copyData.title = `${original.title} (Draft Copy)`;
    copyData.status = 'draft';
    copyData.isActive = false;
    copyData.derivedFrom = original._id;
    copyData.version = 1;
    copyData.publishedAt = null;
    copyData.archivedAt = null;
    copyData.trainer = req.user._id;

    const duplicated = await WorkoutPlan.create(copyData);
    const populated = await WorkoutPlan.findById(duplicated._id)
      .populate('member', 'name email phone avatar')
      .populate('trainer', 'name email phone avatar');

    return res.status(201).json({
      success: true,
      message: 'Plan duplicated successfully as draft',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Archive workout plan
// @route   PATCH /api/trainer/workouts/:planId/archive
// @access  Private (Trainer/Admin)
const archiveWorkoutPlan = async (req, res, next) => {
  try {
    const { planId } = req.params;
    const workout = await WorkoutPlan.findById(planId);
    if (!workout) {
      return res.status(404).json({ success: false, message: 'Workout plan not found' });
    }

    if (req.user.role === 'trainer' && workout.trainer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: You cannot modify this workout plan.',
      });
    }

    workout.status = 'archived';
    workout.isActive = false;
    workout.archivedAt = new Date();
    await workout.save();

    return res.status(200).json({
      success: true,
      message: 'Workout plan archived successfully',
      data: workout,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete draft workout plan
// @route   DELETE /api/trainer/workouts/:planId
// @access  Private (Trainer/Admin)
const deleteWorkoutPlan = async (req, res, next) => {
  try {
    const { planId } = req.params;
    const workout = await WorkoutPlan.findById(planId);
    if (!workout) {
      return res.status(404).json({ success: false, message: 'Workout plan not found' });
    }

    if (req.user.role === 'trainer' && workout.trainer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: You cannot delete this workout plan.',
      });
    }

    if (workout.status === 'active' || workout.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete an active workout plan. Archive it instead to preserve history.',
      });
    }

    await WorkoutPlan.findByIdAndDelete(planId);

    return res.status(200).json({
      success: true,
      message: 'Draft workout plan deleted successfully',
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
      await WorkoutPlan.updateMany(
        { member: workout.member, _id: { $ne: workout._id }, isActive: true, isMemberCustom: { $ne: true } },
        { $set: { isActive: false, status: 'archived', archivedAt: new Date() } }
      );
      workout.status = 'active';
      workout.publishedAt = workout.publishedAt || new Date();
    } else {
      workout.status = 'archived';
      workout.archivedAt = new Date();
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

// ================= MEMBER ENDPOINTS =================

// @desc    Get member's own active prescribed workout plan
// @route   GET /api/member/workout
// @access  Private (Member)
const getMemberWorkout = async (req, res, next) => {
  try {
    const workout = await WorkoutPlan.findOne({
      member: req.user._id,
      isActive: true,
      isMemberCustom: { $ne: true },
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
    const workouts = await WorkoutPlan.find({
      member: req.user._id,
      isMemberCustom: { $ne: true },
    })
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

// @desc    Duplicate prescribed plan to "My Custom Plan"
// @route   POST /api/member/workouts/duplicate-custom
// @access  Private (Member)
const duplicateMemberCustomWorkout = async (req, res, next) => {
  try {
    const activePrescribed = await WorkoutPlan.findOne({
      member: req.user._id,
      isActive: true,
      isMemberCustom: { $ne: true },
    });

    if (!activePrescribed) {
      return res.status(404).json({
        success: false,
        message: 'No active coach prescribed plan found to customize.',
      });
    }

    const copyData = activePrescribed.toObject();
    delete copyData._id;
    delete copyData.createdAt;
    delete copyData.updatedAt;

    // Clean subdocument _ids in weeklySchedule & exercises for clean new copy
    if (Array.isArray(copyData.weeklySchedule)) {
      copyData.weeklySchedule = copyData.weeklySchedule.map((dayItem) => {
        const cleanDay = { ...dayItem };
        delete cleanDay._id;
        if (Array.isArray(cleanDay.exercises)) {
          cleanDay.exercises = cleanDay.exercises.map((ex) => {
            const cleanEx = { ...ex };
            delete cleanEx._id;
            return cleanEx;
          });
        }
        return cleanDay;
      });
    }

    copyData.title = `My Custom - ${activePrescribed.title}`;
    copyData.member = req.user._id;
    copyData.trainer = req.user._id;
    copyData.isMemberCustom = true;
    copyData.status = 'active';
    copyData.isActive = true;
    copyData.derivedFrom = activePrescribed._id;
    copyData.startDate = new Date();

    // Deactivate previous custom plan
    await WorkoutPlan.updateMany(
      { member: req.user._id, isMemberCustom: true },
      { $set: { isActive: false, status: 'archived', archivedAt: new Date() } }
    );

    const customPlan = await WorkoutPlan.create(copyData);
    return res.status(201).json({
      success: true,
      message: 'Custom plan created successfully. You can now personalize your routine.',
      data: customPlan,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get member's custom workout plan
// @route   GET /api/member/workouts/custom
// @access  Private (Member)
const getMemberCustomWorkout = async (req, res, next) => {
  try {
    const custom = await WorkoutPlan.findOne({
      member: req.user._id,
      isMemberCustom: true,
      isActive: true,
    });

    return res.status(200).json({
      success: true,
      data: custom || null,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create member's own custom workout plan from scratch or template
// @route   POST /api/member/workouts/custom
// @access  Private (Member)
const createMemberCustomWorkout = async (req, res, next) => {
  try {
    const {
      title,
      goal,
      difficulty,
      splitType,
      duration,
      description,
      coachInstructions,
      startDate,
      weeklySchedule,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Plan title is required.' });
    }

    // Deactivate existing custom plans
    await WorkoutPlan.updateMany(
      { member: req.user._id, isMemberCustom: true, isActive: true },
      { $set: { isActive: false, status: 'archived', archivedAt: new Date() } }
    );

    const plan = await WorkoutPlan.create({
      member: req.user._id,
      trainer: req.user._id,
      title: title.trim(),
      goal: goal || 'General Fitness',
      difficulty: difficulty || 'Intermediate',
      splitType: splitType || 'Custom Split',
      duration: duration || '8 Weeks',
      description: description ? description.trim() : '',
      coachInstructions: coachInstructions ? coachInstructions.trim() : '',
      startDate: startDate || new Date(),
      weeklySchedule: Array.isArray(weeklySchedule) ? weeklySchedule : [],
      isMemberCustom: true,
      status: 'active',
      isActive: true,
      publishedAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: 'Personal training plan created successfully.',
      data: plan,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update member's own custom plan
// @route   PATCH /api/member/workouts/custom/:id
// @access  Private (Member)
const updateMemberCustomWorkout = async (req, res, next) => {
  try {
    const { id } = req.params;
    const plan = await WorkoutPlan.findOne({ _id: id, member: req.user._id, isMemberCustom: true });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Custom plan not found or you are not authorized to edit this plan.',
      });
    }

    const {
      title,
      goal,
      difficulty,
      splitType,
      duration,
      description,
      coachInstructions,
      weeklySchedule,
    } = req.body;

    if (title) plan.title = title.trim();
    if (goal) plan.goal = goal;
    if (difficulty) plan.difficulty = difficulty;
    if (splitType) plan.splitType = splitType;
    if (duration) plan.duration = duration;
    if (description !== undefined) plan.description = description.trim();
    if (coachInstructions !== undefined) plan.coachInstructions = coachInstructions.trim();
    if (weeklySchedule) plan.weeklySchedule = weeklySchedule;

    await plan.save();

    return res.status(200).json({
      success: true,
      message: 'Your custom workout plan has been updated.',
      data: plan,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete/Archive member's own custom plan
// @route   DELETE /api/member/workouts/custom/:id
// @access  Private (Member)
const deleteMemberCustomWorkout = async (req, res, next) => {
  try {
    const { id } = req.params;
    const plan = await WorkoutPlan.findOne({ _id: id, member: req.user._id, isMemberCustom: true });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Custom plan not found or you are not authorized to modify it.',
      });
    }

    plan.isActive = false;
    plan.status = 'archived';
    plan.archivedAt = new Date();
    await plan.save();

    return res.status(200).json({
      success: true,
      message: 'Custom workout plan removed successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Log workout completion for a date (Upsert safe, with set logs and volume)
// @route   POST /api/member/workouts/log
// @access  Private (Member)
const logMemberWorkoutCompletion = async (req, res, next) => {
  try {
    const {
      workoutPlanId,
      planType = 'coach',
      date,
      day,
      workoutTitle = '',
      exerciseLogs = [],
      memberNote = '',
      overallNotes = '',
      energyLevel = '',
      difficultyFeeling = '',
      startedAt = null,
      completedAt = null,
      durationMinutes = null,
    } = req.body;

    if (!workoutPlanId || !date) {
      return res.status(400).json({ success: false, message: 'workoutPlanId and date (YYYY-MM-DD) are required.' });
    }

    const safeExerciseLogs = Array.isArray(exerciseLogs) ? exerciseLogs : [];

    // Calculate completion metrics
    const totalExercisesCount = safeExerciseLogs.length;
    const completedExercisesCount = safeExerciseLogs.filter((e) => e.completed).length;
    const isWorkoutCompleted = totalExercisesCount > 0 && completedExercisesCount === totalExercisesCount;

    // Calculate volume in kg safely (only numeric values)
    let totalVolumeKg = 0;
    safeExerciseLogs.forEach((ex) => {
      // Check setLogs first if available
      if (Array.isArray(ex.setLogs) && ex.setLogs.length > 0) {
        ex.setLogs.forEach((s) => {
          const w = parseFloat(String(s.weight).replace(/[^0-9.]/g, ''));
          const r = parseFloat(String(s.reps).replace(/[^0-9.]/g, ''));
          if (!isNaN(w) && !isNaN(r) && w > 0 && r > 0) {
            totalVolumeKg += w * r;
          }
        });
      } else {
        // Fallback to top-level sets * reps * weight
        const w = parseFloat(String(ex.actualWeight).replace(/[^0-9.]/g, ''));
        const r = parseFloat(String(ex.actualReps).replace(/[^0-9.]/g, ''));
        const s = parseInt(ex.actualSets) || 1;
        if (!isNaN(w) && !isNaN(r) && w > 0 && r > 0) {
          totalVolumeKg += s * w * r;
        }
      }
    });

    const updatePayload = {
      member: req.user._id,
      workoutPlan: workoutPlanId,
      planType: planType === 'custom' ? 'custom' : 'coach',
      date,
      day: day || '',
      workoutTitle: workoutTitle || '',
      exerciseLogs: safeExerciseLogs,
      memberNote: memberNote || '',
      overallNotes: overallNotes || memberNote || '',
      energyLevel: energyLevel || '',
      difficultyFeeling: difficultyFeeling || '',
      startedAt: startedAt ? new Date(startedAt) : null,
      completedAt: completedAt ? new Date(completedAt) : new Date(),
      durationMinutes: durationMinutes ? Number(durationMinutes) : null,
      isWorkoutCompleted,
      completedExercisesCount,
      totalExercisesCount,
      totalVolumeKg: Math.round(totalVolumeKg),
    };

    const log = await WorkoutLog.findOneAndUpdate(
      { member: req.user._id, date },
      { $set: updatePayload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      success: true,
      message: isWorkoutCompleted
        ? 'Workout marked completed and logged successfully!'
        : 'Workout progress saved successfully.',
      data: log,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get member workout logs
// @route   GET /api/member/workouts/logs
// @access  Private (Member)
const getMemberWorkoutLogs = async (req, res, next) => {
  try {
    const { date, limit = 50 } = req.query;
    const filter = { member: req.user._id };
    if (date) filter.date = date;

    const logs = await WorkoutLog.find(filter)
      .sort({ date: -1 })
      .limit(parseInt(limit));

    return res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get exercise performance history & Personal Records for member
// @route   GET /api/member/workouts/exercise-history
// @access  Private (Member)
const getMemberExercisePerformanceHistory = async (req, res, next) => {
  try {
    const { exerciseName } = req.query;
    const logs = await WorkoutLog.find({ member: req.user._id }).sort({ date: 1 });

    const exerciseMap = {};

    logs.forEach((log) => {
      (log.exerciseLogs || []).forEach((ex) => {
        const name = ex.exerciseName?.trim();
        if (!name) return;
        if (exerciseName && name.toLowerCase() !== exerciseName.trim().toLowerCase()) return;

        if (!exerciseMap[name]) {
          exerciseMap[name] = {
            exerciseName: name,
            history: [],
            pr: {
              maxWeight: 0,
              maxRepsAtMaxWeight: 0,
              estimated1RM: 0,
              maxReps: 0,
              bestDate: null,
            },
          };
        }

        const numericWeight = parseFloat(String(ex.actualWeight).replace(/[^0-9.]/g, '')) || 0;
        const numericReps = parseFloat(String(ex.actualReps).replace(/[^0-9.]/g, '')) || 0;

        // Check setLogs for maximums
        let sessionMaxWeight = numericWeight;
        let sessionMaxReps = numericReps;

        if (Array.isArray(ex.setLogs) && ex.setLogs.length > 0) {
          ex.setLogs.forEach((s) => {
            const sw = parseFloat(String(s.weight).replace(/[^0-9.]/g, '')) || 0;
            const sr = parseFloat(String(s.reps).replace(/[^0-9.]/g, '')) || 0;
            if (sw > sessionMaxWeight) sessionMaxWeight = sw;
            if (sr > sessionMaxReps) sessionMaxReps = sr;
          });
        }

        // Calculate Estimated 1RM via Epley Formula: Weight * (1 + Reps/30)
        let est1RM = 0;
        if (sessionMaxWeight > 0 && sessionMaxReps > 0) {
          est1RM = Math.round(sessionMaxWeight * (1 + sessionMaxReps / 30));
        }

        exerciseMap[name].history.push({
          date: log.date,
          day: log.day,
          completed: ex.completed,
          actualSets: ex.actualSets,
          actualReps: ex.actualReps,
          actualWeight: ex.actualWeight,
          unit: ex.unit || 'kg',
          rpe: ex.rpe,
          personalNote: ex.personalNote || ex.notes || '',
          setLogs: ex.setLogs || [],
          sessionMaxWeight,
          sessionMaxReps,
          estimated1RM: est1RM,
        });

        // Update PRs if valid
        const curPR = exerciseMap[name].pr;
        if (sessionMaxWeight > curPR.maxWeight) {
          curPR.maxWeight = sessionMaxWeight;
          curPR.maxRepsAtMaxWeight = sessionMaxReps;
          curPR.bestDate = log.date;
        }
        if (sessionMaxReps > curPR.maxReps) {
          curPR.maxReps = sessionMaxReps;
        }
        if (est1RM > curPR.estimated1RM) {
          curPR.estimated1RM = est1RM;
        }
      });
    });

    return res.status(200).json({
      success: true,
      data: exerciseMap,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get member workout logs for assigned trainer
// @route   GET /api/trainer/members/:memberId/workout-logs
// @access  Private (Trainer/Admin)
const getTrainerMemberWorkoutLogs = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const { userId, profile } = await resolveMemberUserId(memberId);

    if (!profile || !userId) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    if (req.user.role === 'trainer' && !verifyTrainerAssignment(profile, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: This athlete is not assigned to you.',
      });
    }

    const logs = await WorkoutLog.find({ member: userId })
      .sort({ date: -1 })
      .limit(50);

    return res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

// ================= ADMIN OVERSIGHT =================

// @desc    Get all workout plans (Admin oversight)
// @route   GET /api/admin/workouts
// @access  Private (Admin)
const getAdminWorkouts = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter = { isMemberCustom: { $ne: true } };
    if (req.query.status === 'active') filter.isActive = true;
    if (req.query.status === 'inactive' || req.query.status === 'archived') filter.isActive = false;
    if (req.query.status === 'draft') filter.status = 'draft';

    const total = await WorkoutPlan.countDocuments(filter);
    const pages = Math.ceil(total / limit) || 1;

    const workouts = await WorkoutPlan.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('member', 'name email phone avatar')
      .populate('trainer', 'name email phone avatar');

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
  publishWorkoutPlan,
  duplicateWorkoutPlan,
  archiveWorkoutPlan,
  deleteWorkoutPlan,
  toggleWorkoutPlanStatus,
  getMemberWorkout,
  getMemberWorkoutHistory,
  duplicateMemberCustomWorkout,
  getMemberCustomWorkout,
  createMemberCustomWorkout,
  updateMemberCustomWorkout,
  deleteMemberCustomWorkout,
  logMemberWorkoutCompletion,
  getMemberWorkoutLogs,
  getMemberExercisePerformanceHistory,
  getTrainerMemberWorkoutLogs,
  getAdminWorkouts,
};
