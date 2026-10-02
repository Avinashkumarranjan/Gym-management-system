const DietPlan = require('../models/DietPlan');
const DietLog = require('../models/DietLog');
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

const verifyTrainerAssignment = (profile, trainerUserId) => {
  if (!profile || !profile.assignedTrainer) return false;
  return profile.assignedTrainer.toString() === trainerUserId.toString();
};

// @desc    Create diet plan for assigned member
// @route   POST /api/trainer/members/:memberId/diets
// @access  Private (Trainer/Admin)
const createTrainerDiet = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const {
      title,
      goal,
      dietType,
      planMode,
      duration,
      dailyCalories,
      macros,
      fiber,
      waterLiters,
      optionalTargets,
      restrictions,
      meals,
      notes,
      coachNotes,
      startDate,
      endDate,
      status,
      isActive,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Diet plan title is required' });
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

    const planStatus = status === 'draft' ? 'draft' : 'active';
    const planIsActive = planStatus === 'active';

    // If new plan is active, archive older active diet plans for this member
    if (planIsActive) {
      await DietPlan.updateMany(
        { member: userId, isActive: true, isMemberCustom: { $ne: true } },
        { $set: { isActive: false, status: 'archived', archivedAt: new Date() } }
      );
    }

    const diet = await DietPlan.create({
      member: userId,
      trainer: req.user._id,
      title: title.trim(),
      goal: goal || profile.fitnessGoal || 'Healthy Nutrition',
      dietType: dietType || 'Balanced',
      planMode: planMode || 'daily_standard',
      duration: duration || '8 Weeks',
      dailyCalories: dailyCalories !== undefined ? Number(dailyCalories) : 2000,
      macros: macros || { proteinGrams: 150, carbsGrams: 200, fatGrams: 60 },
      fiber: fiber !== undefined ? Number(fiber) : 30,
      waterLiters: waterLiters !== undefined ? Number(waterLiters) : 3,
      optionalTargets: optionalTargets || {},
      restrictions: restrictions || { foodsToAvoid: [], dietRestrictions: [] },
      meals: Array.isArray(meals) ? meals : [],
      notes: notes ? notes.trim() : '',
      coachNotes: coachNotes ? coachNotes.trim() : '',
      startDate: startDate || new Date(),
      endDate: endDate || null,
      status: planStatus,
      isActive: planIsActive,
      publishedAt: planIsActive ? new Date() : null,
      version: 1,
    });

    const populated = await DietPlan.findById(diet._id)
      .populate('member', 'name email phone avatar')
      .populate('trainer', 'name email phone avatar');

    // Notify member if plan is published
    if (planIsActive) {
      createNotification({
        user: userId,
        type: 'diet_assigned',
        title: 'New Nutrition Plan Assigned',
        message: `Trainer ${req.user.name || 'Your coach'} assigned a new diet plan: "${title.trim()}".`,
        link: '/member/diet',
        metadata: { dietPlanId: diet._id, trainerId: req.user._id },
      }).catch((err) => console.error('Failed to send diet notification:', err.message));
    }

    return res.status(201).json({
      success: true,
      message: planIsActive ? 'Diet plan published successfully' : 'Diet plan saved as draft',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all diet plans for an assigned member
// @route   GET /api/trainer/members/:memberId/diets
// @access  Private (Trainer/Admin)
const getTrainerMemberDiets = async (req, res, next) => {
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

    const diets = await DietPlan.find({ member: userId, isMemberCustom: { $ne: true } })
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

// @desc    Get single diet plan details
// @route   GET /api/trainer/diets/:planId
// @access  Private (Trainer/Admin/Member)
const getDietPlanById = async (req, res, next) => {
  try {
    const { planId } = req.params;
    const diet = await DietPlan.findById(planId)
      .populate('member', 'name email phone avatar')
      .populate('trainer', 'name email phone avatar')
      .populate('meals.items.food');

    if (!diet) {
      return res.status(404).json({ success: false, message: 'Diet plan not found' });
    }

    if (req.user.role === 'trainer') {
      const isAuthor = diet.trainer && diet.trainer._id.toString() === req.user._id.toString();
      const profile = await MemberProfile.findOne({ user: diet.member._id });
      const isAssigned = profile && profile.assignedTrainer && profile.assignedTrainer.toString() === req.user._id.toString();
      if (!isAuthor && !isAssigned) {
        return res.status(403).json({
          success: false,
          message: 'Access forbidden: You did not author this diet plan.',
        });
      }
    } else if (req.user.role === 'member') {
      if (diet.member._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access forbidden: This diet plan does not belong to you.',
        });
      }
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
// @access  Private (Trainer/Admin)
const updateDietPlan = async (req, res, next) => {
  try {
    const { planId } = req.params;
    const {
      title,
      goal,
      dietType,
      planMode,
      duration,
      dailyCalories,
      macros,
      fiber,
      waterLiters,
      optionalTargets,
      restrictions,
      meals,
      notes,
      coachNotes,
      startDate,
      endDate,
      status,
      isActive,
    } = req.body;

    const diet = await DietPlan.findById(planId);
    if (!diet) {
      return res.status(404).json({ success: false, message: 'Diet plan not found' });
    }

    if (req.user.role === 'trainer' && diet.trainer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: You cannot modify this diet plan.',
      });
    }

    if (title !== undefined) diet.title = title.trim();
    if (goal !== undefined) diet.goal = goal.trim();
    if (dietType !== undefined) diet.dietType = dietType;
    if (planMode !== undefined) diet.planMode = planMode;
    if (duration !== undefined) diet.duration = duration;
    if (dailyCalories !== undefined) diet.dailyCalories = Number(dailyCalories);
    if (macros !== undefined) diet.macros = macros;
    if (fiber !== undefined) diet.fiber = Number(fiber);
    if (waterLiters !== undefined) diet.waterLiters = Number(waterLiters);
    if (optionalTargets !== undefined) diet.optionalTargets = optionalTargets;
    if (restrictions !== undefined) diet.restrictions = restrictions;
    if (meals !== undefined) diet.meals = meals;
    if (notes !== undefined) diet.notes = notes.trim();
    if (coachNotes !== undefined) diet.coachNotes = coachNotes.trim();
    if (startDate !== undefined) diet.startDate = startDate;
    if (endDate !== undefined) diet.endDate = endDate;

    const wasDraft = diet.status === 'draft';

    if (status !== undefined) {
      diet.status = status;
      if (status === 'active') {
        diet.isActive = true;
        if (wasDraft) diet.publishedAt = new Date();
        await DietPlan.updateMany(
          { member: diet.member, _id: { $ne: diet._id }, isActive: true, isMemberCustom: { $ne: true } },
          { $set: { isActive: false, status: 'archived', archivedAt: new Date() } }
        );
      } else if (status === 'archived') {
        diet.isActive = false;
        diet.archivedAt = new Date();
      } else if (status === 'draft') {
        diet.isActive = false;
      }
    } else if (isActive !== undefined) {
      diet.isActive = isActive;
      diet.status = isActive ? 'active' : 'archived';
      if (isActive) {
        await DietPlan.updateMany(
          { member: diet.member, _id: { $ne: diet._id }, isActive: true, isMemberCustom: { $ne: true } },
          { $set: { isActive: false, status: 'archived', archivedAt: new Date() } }
        );
      }
    }

    diet.version = (diet.version || 1) + 1;
    await diet.save();

    if (wasDraft && diet.status === 'active') {
      createNotification({
        user: diet.member,
        type: 'diet_assigned',
        title: 'New Nutrition Plan Published',
        message: `Trainer ${req.user.name || 'Your coach'} published a new diet plan: "${diet.title}".`,
        link: '/member/diet',
        metadata: { dietPlanId: diet._id, trainerId: req.user._id },
      }).catch((err) => console.error('Failed to send diet notification:', err.message));
    }

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

// @desc    Publish a diet plan
// @route   POST /api/trainer/diets/:planId/publish
// @access  Private (Trainer/Admin)
const publishDietPlan = async (req, res, next) => {
  try {
    const { planId } = req.params;
    const diet = await DietPlan.findById(planId);
    if (!diet) {
      return res.status(404).json({ success: false, message: 'Diet plan not found' });
    }

    if (req.user.role === 'trainer' && diet.trainer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: You cannot publish this diet plan.',
      });
    }

    if (!diet.title || !diet.title.trim()) {
      return res.status(400).json({ success: false, message: 'Diet plan title is required.' });
    }

    if (!diet.dailyCalories || diet.dailyCalories <= 0) {
      return res.status(400).json({ success: false, message: 'Daily calories target must be greater than 0.' });
    }

    if (!diet.meals || diet.meals.length === 0) {
      return res.status(400).json({ success: false, message: 'Add at least one meal to publish this plan.' });
    }

    // Archive previous active plans for this member
    await DietPlan.updateMany(
      { member: diet.member, _id: { $ne: diet._id }, isActive: true, isMemberCustom: { $ne: true } },
      { $set: { isActive: false, status: 'archived', archivedAt: new Date() } }
    );

    diet.status = 'active';
    diet.isActive = true;
    diet.publishedAt = new Date();
    await diet.save();

    createNotification({
      user: diet.member,
      type: 'diet_assigned',
      title: 'New Nutrition Plan Published',
      message: `Trainer ${req.user.name || 'Your coach'} published a new diet plan: "${diet.title}".`,
      link: '/member/diet',
      metadata: { dietPlanId: diet._id, trainerId: req.user._id },
    }).catch((err) => console.error('Failed to send diet notification:', err.message));

    const populated = await DietPlan.findById(diet._id)
      .populate('member', 'name email phone avatar')
      .populate('trainer', 'name email phone avatar');

    return res.status(200).json({
      success: true,
      message: 'Diet plan published and made active for member!',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Duplicate diet plan to a draft copy
// @route   POST /api/trainer/diets/:planId/duplicate
// @access  Private (Trainer/Admin)
const duplicateDietPlan = async (req, res, next) => {
  try {
    const { planId } = req.params;
    const original = await DietPlan.findById(planId);
    if (!original) {
      return res.status(404).json({ success: false, message: 'Diet plan not found' });
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

    const duplicated = await DietPlan.create(copyData);
    const populated = await DietPlan.findById(duplicated._id)
      .populate('member', 'name email phone avatar')
      .populate('trainer', 'name email phone avatar');

    return res.status(201).json({
      success: true,
      message: 'Diet plan duplicated successfully as draft',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Archive diet plan
// @route   PATCH /api/trainer/diets/:planId/archive
// @access  Private (Trainer/Admin)
const archiveDietPlan = async (req, res, next) => {
  try {
    const { planId } = req.params;
    const diet = await DietPlan.findById(planId);
    if (!diet) {
      return res.status(404).json({ success: false, message: 'Diet plan not found' });
    }

    if (req.user.role === 'trainer' && diet.trainer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: You cannot modify this diet plan.',
      });
    }

    diet.status = 'archived';
    diet.isActive = false;
    diet.archivedAt = new Date();
    await diet.save();

    return res.status(200).json({
      success: true,
      message: 'Diet plan archived successfully',
      data: diet,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete draft diet plan
// @route   DELETE /api/trainer/diets/:planId
// @access  Private (Trainer/Admin)
const deleteDietPlan = async (req, res, next) => {
  try {
    const { planId } = req.params;
    const diet = await DietPlan.findById(planId);
    if (!diet) {
      return res.status(404).json({ success: false, message: 'Diet plan not found' });
    }

    if (req.user.role === 'trainer' && diet.trainer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: You cannot delete this diet plan.',
      });
    }

    if (diet.status === 'active' || diet.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete an active diet plan. Archive it instead to preserve history.',
      });
    }

    await DietPlan.findByIdAndDelete(planId);

    return res.status(200).json({
      success: true,
      message: 'Draft diet plan deleted successfully',
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
        { member: diet.member, _id: { $ne: diet._id }, isActive: true, isMemberCustom: { $ne: true } },
        { $set: { isActive: false, status: 'archived', archivedAt: new Date() } }
      );
      diet.status = 'active';
      diet.publishedAt = diet.publishedAt || new Date();
    } else {
      diet.status = 'archived';
      diet.archivedAt = new Date();
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

// ================= MEMBER ENDPOINTS =================

// @desc    Get member's own active diet plan
// @route   GET /api/member/diet
// @access  Private (Member)
const getMemberDiet = async (req, res, next) => {
  try {
    const diet = await DietPlan.findOne({
      member: req.user._id,
      isActive: true,
      isMemberCustom: { $ne: true },
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
    const diets = await DietPlan.find({
      member: req.user._id,
      isMemberCustom: { $ne: true },
    })
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

// @desc    Duplicate prescribed diet to "My Custom Plan"
// @route   POST /api/member/diets/duplicate-custom
// @access  Private (Member)
const duplicateMemberCustomDiet = async (req, res, next) => {
  try {
    const activePrescribed = await DietPlan.findOne({
      member: req.user._id,
      isActive: true,
      isMemberCustom: { $ne: true },
    });

    if (!activePrescribed) {
      return res.status(404).json({
        success: false,
        message: 'No active coach prescribed diet plan found to customize.',
      });
    }

    const copyData = activePrescribed.toObject();
    delete copyData._id;
    delete copyData.createdAt;
    delete copyData.updatedAt;

    copyData.title = `My Custom - ${activePrescribed.title}`;
    copyData.member = req.user._id;
    copyData.isMemberCustom = true;
    copyData.status = 'active';
    copyData.isActive = true;
    copyData.derivedFrom = activePrescribed._id;

    // Deactivate previous custom plan
    await DietPlan.updateMany(
      { member: req.user._id, isMemberCustom: true },
      { $set: { isActive: false, status: 'archived' } }
    );

    const customPlan = await DietPlan.create(copyData);
    return res.status(201).json({
      success: true,
      message: 'Custom diet plan created successfully. You can now personalize your meals.',
      data: customPlan,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get member's custom diet plan
// @route   GET /api/member/diets/custom
// @access  Private (Member)
const getMemberCustomDiet = async (req, res, next) => {
  try {
    const custom = await DietPlan.findOne({
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

// @desc    Create member's own custom diet from scratch
// @route   POST /api/member/diets/custom
// @access  Private (Member)
const createMemberCustomDiet = async (req, res, next) => {
  try {
    const {
      title,
      goal,
      dietType,
      planMode,
      dailyCalories,
      macros,
      fiber,
      waterLiters,
      restrictions,
      meals,
      notes,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Plan title is required.' });
    }

    // Deactivate any existing custom plan
    await DietPlan.updateMany(
      { member: req.user._id, isMemberCustom: true, isActive: true },
      { $set: { isActive: false, status: 'archived', archivedAt: new Date() } }
    );

    const plan = await DietPlan.create({
      member: req.user._id,
      trainer: req.user._id, // self-created — trainer field set to self for schema compatibility
      title: title.trim(),
      goal: goal || 'General Health',
      dietType: dietType || 'Balanced',
      planMode: planMode || 'daily_standard',
      dailyCalories: dailyCalories !== undefined ? Number(dailyCalories) : 2000,
      macros: macros || { proteinGrams: 150, carbsGrams: 200, fatGrams: 60 },
      fiber: fiber !== undefined ? Number(fiber) : 30,
      waterLiters: waterLiters !== undefined ? Number(waterLiters) : 3,
      restrictions: restrictions || { foodsToAvoid: [], dietRestrictions: [] },
      meals: Array.isArray(meals) ? meals : [],
      notes: notes ? notes.trim() : '',
      isMemberCustom: true,
      status: 'active',
      isActive: true,
      publishedAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: 'Personal nutrition plan created successfully.',
      data: plan,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update member's own custom diet
// @route   PATCH /api/member/diets/custom/:id
// @access  Private (Member)
const updateMemberCustomDiet = async (req, res, next) => {
  try {
    const { id } = req.params;
    const plan = await DietPlan.findOne({ _id: id, member: req.user._id, isMemberCustom: true });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Custom plan not found or you are not authorized to edit this plan.',
      });
    }

    const {
      title,
      goal,
      dietType,
      planMode,
      dailyCalories,
      macros,
      fiber,
      waterLiters,
      restrictions,
      meals,
      notes,
    } = req.body;

    if (title !== undefined) plan.title = title.trim();
    if (goal !== undefined) plan.goal = goal.trim();
    if (dietType !== undefined) plan.dietType = dietType;
    if (planMode !== undefined) plan.planMode = planMode;
    if (dailyCalories !== undefined) plan.dailyCalories = Number(dailyCalories);
    if (macros !== undefined) plan.macros = macros;
    if (fiber !== undefined) plan.fiber = Number(fiber);
    if (waterLiters !== undefined) plan.waterLiters = Number(waterLiters);
    if (restrictions !== undefined) plan.restrictions = restrictions;
    if (meals !== undefined) plan.meals = meals;
    if (notes !== undefined) plan.notes = notes.trim();

    await plan.save();

    return res.status(200).json({
      success: true,
      message: 'Your custom diet plan has been updated.',
      data: plan,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Log meal completion and water tracking
// @route   POST /api/member/diets/log
// @access  Private (Member)
const logMemberDietCompletion = async (req, res, next) => {
  try {
    const {
      dietPlanId,
      date,
      mealLogs,
      waterConsumedLiters,
      memberNote,
      planType,
      caloriesConsumed,
      proteinConsumed,
      carbsConsumed,
      fatConsumed,
    } = req.body;

    if (!date) {
      return res.status(400).json({ success: false, message: 'date (YYYY-MM-DD) is required.' });
    }

    const updateData = {
      member: req.user._id,
      date,
      mealLogs: Array.isArray(mealLogs) ? mealLogs : [],
      waterConsumedLiters: waterConsumedLiters !== undefined ? Number(waterConsumedLiters) : 0,
      memberNote: memberNote || '',
      planType: planType || 'coach',
    };

    if (dietPlanId) updateData.dietPlan = dietPlanId;
    if (caloriesConsumed !== undefined) updateData.caloriesConsumed = Number(caloriesConsumed) || 0;
    if (proteinConsumed !== undefined) updateData.proteinConsumed = Number(proteinConsumed) || 0;
    if (carbsConsumed !== undefined) updateData.carbsConsumed = Number(carbsConsumed) || 0;
    if (fatConsumed !== undefined) updateData.fatConsumed = Number(fatConsumed) || 0;

    const log = await DietLog.findOneAndUpdate(
      { member: req.user._id, date },
      updateData,
      { upsert: true, new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Nutrition log saved successfully',
      data: log,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get member nutrition history logs (daily logs, not plan history)
// @route   GET /api/member/diets/nutrition-history
// @access  Private (Member)
const getMemberNutritionHistory = async (req, res, next) => {
  try {
    const { limit = 30, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const logs = await DietLog.find({ member: req.user._id })
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('dietPlan', 'title goal dietType dailyCalories macros');

    const total = await DietLog.countDocuments({ member: req.user._id });

    return res.status(200).json({
      success: true,
      data: logs,
      total,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get member diet logs
// @route   GET /api/member/diets/logs
// @access  Private (Member)
const getMemberDietLogs = async (req, res, next) => {
  try {
    const { date } = req.query;
    const filter = { member: req.user._id };
    if (date) filter.date = date;

    const logs = await DietLog.find(filter).sort({ date: -1 }).limit(30);

    return res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

// ================= ADMIN OVERSIGHT =================

// @desc    Get all diet plans (Admin oversight)
// @route   GET /api/admin/diets
// @access  Private (Admin)
const getAdminDiets = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter = { isMemberCustom: { $ne: true } };
    if (req.query.status === 'active') filter.isActive = true;
    if (req.query.status === 'inactive' || req.query.status === 'archived') filter.isActive = false;
    if (req.query.status === 'draft') filter.status = 'draft';

    const total = await DietPlan.countDocuments(filter);
    const pages = Math.ceil(total / limit) || 1;

    const diets = await DietPlan.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('member', 'name email phone avatar')
      .populate('trainer', 'name email phone avatar');

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
  publishDietPlan,
  duplicateDietPlan,
  archiveDietPlan,
  deleteDietPlan,
  toggleDietPlanStatus,
  getMemberDiet,
  getMemberDietHistory,
  duplicateMemberCustomDiet,
  getMemberCustomDiet,
  createMemberCustomDiet,
  updateMemberCustomDiet,
  logMemberDietCompletion,
  getMemberDietLogs,
  getMemberNutritionHistory,
  getAdminDiets,
};
