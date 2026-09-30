const User = require('../models/User');
const MemberProfile = require('../models/MemberProfile');
const TrainerProfile = require('../models/TrainerProfile');

// Helper to ensure trainer has profile
const getOrCreateTrainerProfile = async (userId) => {
  let profile = await TrainerProfile.findOne({ user: userId });
  if (!profile) {
    profile = await TrainerProfile.create({ user: userId });
  }
  return profile;
};

// @desc    Get trainer dashboard overview
// @route   GET /api/trainer/dashboard
// @access  Private (Trainer)
const getTrainerDashboard = async (req, res, next) => {
  try {
    const profile = await getOrCreateTrainerProfile(req.user._id);

    const populated = await TrainerProfile.findById(profile._id).populate(
      'user',
      'name email phone avatar createdAt isActive'
    );

    // Count assigned members
    const assignedMemberCount = await MemberProfile.countDocuments({
      assignedTrainer: req.user._id,
    });

    // Recent 5 assigned members
    const recentMembers = await MemberProfile.find({
      assignedTrainer: req.user._id,
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email phone avatar createdAt isActive')
      .populate('membershipPlan', 'name');

    const cleanTrainer = {
      _id: populated._id,
      userId: populated.user?._id,
      name: populated.user?.name || req.user.name,
      email: populated.user?.email || req.user.email,
      phone: populated.user?.phone || req.user.phone || '',
      avatar: populated.user?.avatar || '',
      specializations: populated.specializations || [],
      experienceYears: populated.experienceYears || 0,
      bio: populated.bio || '',
      qualifications: populated.qualifications || [],
      availableDays: populated.availableDays || [],
      availableTime: populated.availableTime || '',
      isAvailable: populated.isAvailable !== false,
      joinDate: populated.joinDate || populated.createdAt,
    };

    return res.status(200).json({
      success: true,
      trainer: cleanTrainer,
      assignedMemberCount,
      recentMembers: recentMembers.filter((m) => m.user),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get trainer profile
// @route   GET /api/trainer/profile
// @access  Private (Trainer)
const getTrainerProfile = async (req, res, next) => {
  try {
    const profile = await getOrCreateTrainerProfile(req.user._id);

    const populated = await TrainerProfile.findById(profile._id).populate(
      'user',
      'name email phone avatar createdAt isActive'
    );

    const assignedMemberCount = await MemberProfile.countDocuments({
      assignedTrainer: req.user._id,
    });

    const cleanTrainer = {
      _id: populated._id,
      userId: populated.user?._id,
      name: populated.user?.name || req.user.name,
      email: populated.user?.email || req.user.email,
      phone: populated.user?.phone || req.user.phone || '',
      avatar: populated.user?.avatar || '',
      specializations: populated.specializations || [],
      experienceYears: populated.experienceYears || 0,
      bio: populated.bio || '',
      qualifications: populated.qualifications || [],
      availableDays: populated.availableDays || [],
      availableTime: populated.availableTime || '',
      isAvailable: populated.isAvailable !== false,
      joinDate: populated.joinDate || populated.createdAt,
      assignedMemberCount,
    };

    return res.status(200).json({
      success: true,
      data: cleanTrainer,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update trainer profile (Self-service)
// @route   PATCH /api/trainer/profile
// @access  Private (Trainer)
const updateTrainerProfile = async (req, res, next) => {
  try {
    const {
      name,
      phone,
      bio,
      specializations,
      qualifications,
      availableDays,
      availableTime,
      experienceYears,
      isAvailable,
    } = req.body;

    // 1. Update User basic info (Name, Phone only)
    const userUpdates = {};
    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ success: false, message: 'Name cannot be empty.' });
      }
      userUpdates.name = name.trim();
    }
    if (phone !== undefined) {
      userUpdates.phone = phone.trim();
    }

    if (Object.keys(userUpdates).length > 0) {
      await User.findByIdAndUpdate(req.user._id, userUpdates);
    }

    // 2. Update TrainerProfile
    const profile = await getOrCreateTrainerProfile(req.user._id);

    if (bio !== undefined) profile.bio = bio ? bio.trim() : '';

    if (specializations !== undefined) {
      profile.specializations = Array.isArray(specializations)
        ? specializations
        : specializations
        ? specializations.split(',').map((s) => s.trim())
        : [];
    }

    if (qualifications !== undefined) {
      profile.qualifications = Array.isArray(qualifications)
        ? qualifications
        : qualifications
        ? qualifications.split(',').map((q) => q.trim())
        : [];
    }

    if (availableDays !== undefined) {
      profile.availableDays = Array.isArray(availableDays) ? availableDays : [];
    }

    if (availableTime !== undefined) {
      profile.availableTime = availableTime ? availableTime.trim() : '';
    }

    if (experienceYears !== undefined && experienceYears !== '') {
      const exp = Number(experienceYears);
      if (!isNaN(exp) && exp >= 0 && exp <= 60) {
        profile.experienceYears = exp;
      }
    }

    if (isAvailable !== undefined) {
      profile.isAvailable = Boolean(isAvailable);
    }

    // Notice: salary, role, isActive are strictly NOT touched!

    await profile.save();

    const populated = await TrainerProfile.findById(profile._id).populate(
      'user',
      'name email phone avatar createdAt isActive'
    );

    const cleanTrainer = {
      _id: populated._id,
      userId: populated.user?._id,
      name: populated.user?.name,
      email: populated.user?.email,
      phone: populated.user?.phone || '',
      avatar: populated.user?.avatar || '',
      specializations: populated.specializations || [],
      experienceYears: populated.experienceYears || 0,
      bio: populated.bio || '',
      qualifications: populated.qualifications || [],
      availableDays: populated.availableDays || [],
      availableTime: populated.availableTime || '',
      isAvailable: populated.isAvailable !== false,
    };

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: cleanTrainer,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get assigned members for this trainer
// @route   GET /api/trainer/members
// @access  Private (Trainer)
const getAssignedMembers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;
    const search = req.query.search ? req.query.search.trim() : '';

    let userMatch = {};
    if (search) {
      userMatch = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
        ],
      };
    }

    // Find user IDs matching search query if search provided
    let memberFilter = { assignedTrainer: req.user._id };

    if (search) {
      const matchedUsers = await User.find(userMatch).select('_id');
      const userIds = matchedUsers.map((u) => u._id);
      memberFilter.user = { $in: userIds };
    }

    const total = await MemberProfile.countDocuments(memberFilter);
    const pages = Math.ceil(total / limit) || 1;

    const members = await MemberProfile.find(memberFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email phone avatar createdAt isActive')
      .populate('membershipPlan', 'name price');

    const cleanMembers = members
      .filter((m) => m.user)
      .map((m) => ({
        _id: m._id,
        user: m.user,
        fitnessGoal: m.fitnessGoal,
        height: m.height,
        weight: m.weight,
        joinDate: m.joinDate || m.createdAt,
        membershipPlan: m.membershipPlan,
        membershipStatus: m.membershipStatus,
      }));

    return res.status(200).json({
      success: true,
      data: cleanMembers,
      page,
      pages,
      total,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single assigned member details
// @route   GET /api/trainer/members/:memberId
// @access  Private (Trainer)
const getAssignedMemberDetails = async (req, res, next) => {
  try {
    const { memberId } = req.params;

    const profile = await MemberProfile.findById(memberId)
      .populate('user', 'name email phone avatar createdAt isActive')
      .populate('membershipPlan', 'name description price durationMonths');

    if (!profile || !profile.user) {
      return res.status(404).json({
        success: false,
        message: 'Member record not found.',
      });
    }

    // STRICT TRAINER OWNERSHIP AUTHORIZATION
    if (!profile.assignedTrainer || profile.assignedTrainer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: This athlete is not assigned to you.',
      });
    }

    // Derived BMI
    let bmi = null;
    let bmiCategory = null;
    if (profile.height && profile.weight && profile.height > 0) {
      const heightInMeters = profile.height / 100;
      bmi = Number((profile.weight / (heightInMeters * heightInMeters)).toFixed(1));
      if (bmi < 18.5) bmiCategory = 'Underweight';
      else if (bmi < 25) bmiCategory = 'Normal';
      else if (bmi < 30) bmiCategory = 'Overweight';
      else bmiCategory = 'Obese';
    }

    // Clean member view (no admin notes, no password/internals)
    const memberDetails = {
      _id: profile._id,
      user: profile.user,
      gender: profile.gender || '',
      dateOfBirth: profile.dateOfBirth || null,
      emergencyContact: profile.emergencyContact || '',
      height: profile.height || null,
      weight: profile.weight || null,
      bmi,
      bmiCategory,
      fitnessGoal: profile.fitnessGoal || 'general_fitness',
      membershipPlan: profile.membershipPlan,
      membershipStatus: profile.membershipStatus,
      membershipStartDate: profile.membershipStartDate,
      membershipEndDate: profile.membershipEndDate,
      joinDate: profile.joinDate || profile.createdAt,
    };

    return res.status(200).json({
      success: true,
      data: memberDetails,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTrainerDashboard,
  getTrainerProfile,
  updateTrainerProfile,
  getAssignedMembers,
  getAssignedMemberDetails,
};
