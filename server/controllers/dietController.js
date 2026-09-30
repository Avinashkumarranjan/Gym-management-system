const DietPlan = require('../models/DietPlan');
const MemberProfile = require('../models/MemberProfile');
const User = require('../models/User');
const { createNotification } = require('../services/notificationService');

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

// @desc    Create diet plan for assigned member
// @route   POST /api/trainer/members/:memberId/diets
// @access  Private (Trainer)
const createTrainerDiet = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const {
      title,
      goal,
      dailyCalories,
      macros,
      waterLiters,
      meals,
      notes,
      startDate,
      endDate,
      isActive,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Diet plan title is required' });
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

    // If new plan is active, deactivate older active diet plans for this member
    if (planIsActive) {
      await DietPlan.updateMany(
        { member: userId, isActive: true },
        { $set: { isActive: false } }
      );
    }

    const diet = await DietPlan.create({
      member: userId,
      trainer: req.user._id,
      title: title.trim(),
      goal: goal || profile.fitnessGoal || 'Healthy Nutrition',
      dailyCalories: dailyCalories !== undefined ? Number(dailyCalories) : 2000,
      macros: macros || { proteinGrams: 150, carbsGrams: 200, fatGrams: 60 },
      waterLiters: waterLiters !== undefined ? Number(waterLiters) : 3,
      meals: meals || [],
      notes: notes ? notes.trim() : '',
      startDate: startDate || new Date(),
      endDate: endDate || null,
      isActive: planIsActive,
    });

    const populated = await DietPlan.findById(diet._id)
      .populate('member', 'name email phone avatar')
      .populate('trainer', 'name email phone avatar');

    // Notify member of new diet plan
    if (planIsActive) {
      createNotification({
        user: userId,
        type: 'diet_assigned',
        title: 'New Nutrition Plan Assigned',
        message: `Trainer ${req.user.name || 'Your coach'} assigned a new diet plan: "${title.trim()}".`,
        link: '/member/diet',
      }).catch((err) => console.error('Failed to send diet notification:', err.message));
    }

    return res.status(201).json({
      success: true,
      message: 'Diet plan created successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all diet plans for an assigned member
// @route   GET /api/trainer/members/:memberId/diets
// @access  Private (Trainer)
const getTrainerMemberDiets = async (req, res, next) => {
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

    const diets = await DietPlan.find({ member: userId })
      .sort({ createdAt: -1 })
      .populate('trainer', 'name email phone');

    return res.status(200).json({
      success: true,
      data: diets,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single diet plan details
// @route   GET /api/trainer/diets/:planId
// @access  Private (Trainer/Admin)
const getDietPlanById = async (req, res, next) => {
  try {
    const { planId } = req.params;
    const diet = await DietPlan.findById(planId)
      .populate('member', 'name email phone avatar')
      .populate('trainer', 'name email phone avatar');

    if (!diet) {
      return res.status(404).json({ success: false, message: 'Diet plan not found' });
    }

    if (req.user.role === 'trainer' && diet.trainer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: You did not author this diet plan.',
      });
    }

    return res.status(200).json({
      success: true,
      data: diet,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update diet plan
// @route   PATCH /api/trainer/diets/:planId
// @access  Private (Trainer)
const updateDietPlan = async (req, res, next) => {
  try {
    const { planId } = req.params;
    const {
      title,
      goal,
      dailyCalories,
      macros,
      waterLiters,
      meals,
      notes,
      startDate,
      endDate,
    } = req.body;

    const diet = await DietPlan.findById(planId);
    if (!diet) {
      return res.status(404).json({ success: false, message: 'Diet plan not found' });
    }

    if (diet.trainer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: You cannot modify this diet plan.',
      });
    }

    if (title !== undefined) diet.title = title.trim();
    if (goal !== undefined) diet.goal = goal.trim();
    if (dailyCalories !== undefined) diet.dailyCalories = Number(dailyCalories);
    if (macros !== undefined) diet.macros = macros;
    if (waterLiters !== undefined) diet.waterLiters = Number(waterLiters);
    if (meals !== undefined) diet.meals = meals;
    if (notes !== undefined) diet.notes = notes.trim();
    if (startDate !== undefined) diet.startDate = startDate;
    if (endDate !== undefined) diet.endDate = endDate;

    await diet.save();

    const populated = await DietPlan.findById(diet._id)
      .populate('member', 'name email phone avatar')
      .populate('trainer', 'name email phone avatar');

    return res.status(200).json({
      success: true,
      message: 'Diet plan updated successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle diet plan active status
// @route   PATCH /api/trainer/diets/:planId/status
// @access  Private (Trainer)
const toggleDietPlanStatus = async (req, res, next) => {
  try {
    const { planId } = req.params;
    const { isActive } = req.body;

    const diet = await DietPlan.findById(planId);
    if (!diet) {
      return res.status(404).json({ success: false, message: 'Diet plan not found' });
    }

    if (diet.trainer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: You cannot modify this diet plan.',
      });
    }

    const newState = typeof isActive === 'boolean' ? isActive : !diet.isActive;

    if (newState === true) {
      await DietPlan.updateMany(
        { member: diet.member, _id: { $ne: diet._id }, isActive: true },
        { $set: { isActive: false } }
      );
    }

    diet.isActive = newState;
    await diet.save();

    return res.status(200).json({
      success: true,
      message: `Diet plan ${newState ? 'activated' : 'deactivated'} successfully`,
      data: diet,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get member's own active diet plan
// @route   GET /api/member/diet
// @access  Private (Member)
const getMemberDiet = async (req, res, next) => {
  try {
    const diet = await DietPlan.findOne({
      member: req.user._id,
      isActive: true,
    }).populate('trainer', 'name email phone avatar');

    return res.status(200).json({
      success: true,
      data: diet || null,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get member's own diet plan history
// @route   GET /api/member/diets/history
// @access  Private (Member)
const getMemberDietHistory = async (req, res, next) => {
  try {
    const diets = await DietPlan.find({ member: req.user._id })
      .sort({ createdAt: -1 })
      .populate('trainer', 'name email phone avatar');

    return res.status(200).json({
      success: true,
      data: diets,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all diet plans (Admin oversight)
// @route   GET /api/admin/diets
// @access  Private (Admin)
const getAdminDiets = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status === 'active') filter.isActive = true;
    if (req.query.status === 'inactive') filter.isActive = false;

    const total = await DietPlan.countDocuments(filter);
    const pages = Math.ceil(total / limit) || 1;

    const diets = await DietPlan.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('member', 'name email phone')
      .populate('trainer', 'name email phone');

    return res.status(200).json({
      success: true,
      data: diets,
      page,
      pages,
      total,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTrainerDiet,
  getTrainerMemberDiets,
  getDietPlanById,
  updateDietPlan,
  toggleDietPlanStatus,
  getMemberDiet,
  getMemberDietHistory,
  getAdminDiets,
};
