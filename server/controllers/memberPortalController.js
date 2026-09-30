const User = require('../models/User');
const MemberProfile = require('../models/MemberProfile');
const TrainerProfile = require('../models/TrainerProfile');
const MembershipPlan = require('../models/MembershipPlan');
const TrainerAssignmentRequest = require('../models/TrainerAssignmentRequest');
const WorkoutPlan = require('../models/WorkoutPlan');
const DietPlan = require('../models/DietPlan');

// Helper to ensure member has profile
const getOrCreateMemberProfile = async (userId) => {
  let profile = await MemberProfile.findOne({ user: userId });
  if (!profile) {
    profile = await MemberProfile.create({ user: userId });
  }
  return profile;
};

// @desc    Get member dashboard overview
// @route   GET /api/member/dashboard
// @access  Private (Member)
const getMemberDashboard = async (req, res, next) => {
  try {
    const profile = await getOrCreateMemberProfile(req.user._id);

    // Retrieve populated profile
    const populated = await MemberProfile.findById(profile._id)
      .populate('user', 'name email phone avatar createdAt isActive')
      .populate({
        path: 'assignedTrainer',
        select: 'name email phone avatar',
      })
      .populate('membershipPlan', 'name description durationMonths price benefits');

    // If trainer assigned, retrieve public coaching profile (NO salary)
    let trainerInfo = null;
    if (populated.assignedTrainer) {
      const trainerProf = await TrainerProfile.findOne({
        user: populated.assignedTrainer._id,
      }).select('specializations experienceYears bio qualifications availableDays availableTime isAvailable');

      trainerInfo = {
        _id: populated.assignedTrainer._id,
        name: populated.assignedTrainer.name,
        email: populated.assignedTrainer.email,
        phone: populated.assignedTrainer.phone,
        avatar: populated.assignedTrainer.avatar,
        specializations: trainerProf?.specializations || [],
        experienceYears: trainerProf?.experienceYears || 0,
        bio: trainerProf?.bio || '',
        qualifications: trainerProf?.qualifications || [],
        availableDays: trainerProf?.availableDays || [],
        availableTime: trainerProf?.availableTime || '',
        isAvailable: trainerProf?.isAvailable !== false,
      };
    }

    // Check membership expiration dynamically
    let calculatedStatus = populated.membershipStatus || 'pending';
    if (populated.membershipEndDate && new Date() > new Date(populated.membershipEndDate)) {
      calculatedStatus = 'expired';
    }

    // Compute derived BMI
    let bmi = null;
    let bmiCategory = null;
    if (populated.height && populated.weight && populated.height > 0) {
      const heightInMeters = populated.height / 100;
      bmi = Number((populated.weight / (heightInMeters * heightInMeters)).toFixed(1));
      if (bmi < 18.5) bmiCategory = 'Underweight';
      else if (bmi < 25) bmiCategory = 'Normal';
      else if (bmi < 30) bmiCategory = 'Overweight';
      else bmiCategory = 'Obese';
    }

    const memberData = {
      _id: populated._id,
      name: populated.user?.name || req.user.name,
      email: populated.user?.email || req.user.email,
      phone: populated.user?.phone || req.user.phone || '',
      gender: populated.gender || '',
      dateOfBirth: populated.dateOfBirth || null,
      address: populated.address || '',
      emergencyContact: populated.emergencyContact || '',
      height: populated.height || null,
      weight: populated.weight || null,
      bmi,
      bmiCategory,
      fitnessGoal: populated.fitnessGoal || 'general_fitness',
      joinDate: populated.joinDate || populated.createdAt,
      membershipStatus: calculatedStatus,
    };

    // Derive real onboarding milestones from database
    const isMembershipActive = calculatedStatus === 'active';
    let trainerStatus = 'none';
    if (populated.assignedTrainer) {
      trainerStatus = 'assigned';
    } else if (isMembershipActive) {
      const pendingReq = await TrainerAssignmentRequest.findOne({
        member: req.user._id,
        status: 'pending',
      });
      if (pendingReq) {
        trainerStatus = 'pending';
      } else {
        await TrainerAssignmentRequest.create({
          member: req.user._id,
          requestedTrainer: null,
          status: 'pending',
          notes: 'Automatic assignment request created on dashboard check',
        });
        trainerStatus = 'pending';
      }
    }

    const hasWorkout = await WorkoutPlan.exists({ member: req.user._id, isActive: true });
    const hasDiet = await DietPlan.exists({ member: req.user._id, isActive: true });

    const onboarding = {
      membershipActive: isMembershipActive,
      planName: populated.membershipPlan?.name || null,
      trainerStatus,
      trainerName: populated.assignedTrainer?.name || null,
      hasWorkout: !!hasWorkout,
      hasDiet: !!hasDiet,
      isComplete: isMembershipActive && !!populated.assignedTrainer && !!hasWorkout && !!hasDiet,
    };

    return res.status(200).json({
      success: true,
      member: memberData,
      membership: {
        plan: populated.membershipPlan || null,
        startDate: populated.membershipStartDate || null,
        endDate: populated.membershipEndDate || null,
        status: calculatedStatus,
      },
      trainer: trainerInfo,
      onboarding,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get member self profile
// @route   GET /api/member/profile
// @access  Private (Member)
const getMemberProfile = async (req, res, next) => {
  try {
    const profile = await getOrCreateMemberProfile(req.user._id);

    const populated = await MemberProfile.findById(profile._id)
      .populate('user', 'name email phone avatar createdAt isActive role')
      .populate('membershipPlan', 'name price durationMonths')
      .populate('assignedTrainer', 'name email phone');

    // Calculate derived BMI
    let bmi = null;
    let bmiCategory = null;
    if (populated.height && populated.weight && populated.height > 0) {
      const heightInMeters = populated.height / 100;
      bmi = Number((populated.weight / (heightInMeters * heightInMeters)).toFixed(1));
      if (bmi < 18.5) bmiCategory = 'Underweight';
      else if (bmi < 25) bmiCategory = 'Normal';
      else if (bmi < 30) bmiCategory = 'Overweight';
      else bmiCategory = 'Obese';
    }

    return res.status(200).json({
      success: true,
      data: {
        _id: populated._id,
        user: populated.user,
        gender: populated.gender || '',
        dateOfBirth: populated.dateOfBirth || null,
        address: populated.address || '',
        emergencyContact: populated.emergencyContact || '',
        height: populated.height || null,
        weight: populated.weight || null,
        bmi,
        bmiCategory,
        fitnessGoal: populated.fitnessGoal || 'general_fitness',
        notes: populated.notes || '',
        joinDate: populated.joinDate,
        membershipPlan: populated.membershipPlan,
        membershipStatus: populated.membershipStatus,
        assignedTrainer: populated.assignedTrainer,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update member profile (Self-service)
// @route   PATCH /api/member/profile
// @access  Private (Member)
const updateMemberProfile = async (req, res, next) => {
  try {
    const {
      name,
      phone,
      gender,
      dateOfBirth,
      address,
      emergencyContact,
      height,
      weight,
      fitnessGoal,
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

    // 2. Update MemberProfile self-service fields
    const profile = await getOrCreateMemberProfile(req.user._id);

    const validGoals = [
      'weight_loss',
      'weight_gain',
      'muscle_building',
      'strength',
      'general_fitness',
      'endurance',
    ];

    const validGenders = ['male', 'female', 'other', 'prefer_not_to_say'];

    if (gender !== undefined) {
      if (gender && !validGenders.includes(gender)) {
        return res.status(400).json({ success: false, message: 'Invalid gender value.' });
      }
      profile.gender = gender;
    }

    if (dateOfBirth !== undefined) {
      profile.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    }

    if (address !== undefined) {
      profile.address = address ? address.trim() : '';
    }

    if (emergencyContact !== undefined) {
      profile.emergencyContact = emergencyContact ? emergencyContact.trim() : '';
    }

    if (height !== undefined && height !== '') {
      const h = Number(height);
      if (isNaN(h) || h <= 0 || h > 300) {
        return res.status(400).json({ success: false, message: 'Height must be a valid number between 1 and 300 cm.' });
      }
      profile.height = h;
    }

    if (weight !== undefined && weight !== '') {
      const w = Number(weight);
      if (isNaN(w) || w <= 0 || w > 500) {
        return res.status(400).json({ success: false, message: 'Weight must be a valid number between 1 and 500 kg.' });
      }
      profile.weight = w;
    }

    if (fitnessGoal !== undefined) {
      if (fitnessGoal && !validGoals.includes(fitnessGoal)) {
        return res.status(400).json({ success: false, message: 'Invalid fitness goal.' });
      }
      profile.fitnessGoal = fitnessGoal;
    }

    await profile.save();

    const updated = await MemberProfile.findById(profile._id)
      .populate('user', 'name email phone avatar createdAt isActive role')
      .populate('membershipPlan', 'name price durationMonths')
      .populate('assignedTrainer', 'name email phone');

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get member's membership info
// @route   GET /api/member/membership
// @access  Private (Member)
const getMemberMembership = async (req, res, next) => {
  try {
    const profile = await getOrCreateMemberProfile(req.user._id);
    const populated = await MemberProfile.findById(profile._id)
      .populate('membershipPlan', 'name description durationMonths price benefits isActive')
      .populate('assignedTrainer', 'name email phone avatar');

    let calculatedStatus = populated.membershipStatus || 'pending';
    if (populated.membershipEndDate && new Date() > new Date(populated.membershipEndDate)) {
      calculatedStatus = 'expired';
    }

    const isMembershipActive = calculatedStatus === 'active';
    let trainerStatus = 'none';
    if (populated.assignedTrainer) {
      trainerStatus = 'assigned';
    } else if (isMembershipActive) {
      const pendingReq = await TrainerAssignmentRequest.findOne({
        member: req.user._id,
        status: 'pending',
      });
      if (pendingReq) {
        trainerStatus = 'pending';
      } else {
        await TrainerAssignmentRequest.create({
          member: req.user._id,
          requestedTrainer: null,
          status: 'pending',
          notes: 'Automatic assignment request created on membership check',
        });
        trainerStatus = 'pending';
      }
    }

    const hasWorkout = await WorkoutPlan.exists({ member: req.user._id, isActive: true });
    const hasDiet = await DietPlan.exists({ member: req.user._id, isActive: true });

    const onboarding = {
      membershipActive: isMembershipActive,
      planName: populated.membershipPlan?.name || null,
      trainerStatus,
      trainerName: populated.assignedTrainer?.name || null,
      hasWorkout: !!hasWorkout,
      hasDiet: !!hasDiet,
      isComplete: isMembershipActive && !!populated.assignedTrainer && !!hasWorkout && !!hasDiet,
    };

    return res.status(200).json({
      success: true,
      membership: {
        plan: populated.membershipPlan || null,
        startDate: populated.membershipStartDate || null,
        endDate: populated.membershipEndDate || null,
        status: calculatedStatus,
      },
      onboarding,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get member's assigned trainer info
// @route   GET /api/member/trainer
// @access  Private (Member)
const getMemberTrainer = async (req, res, next) => {
  try {
    const profile = await getOrCreateMemberProfile(req.user._id);
    const populated = await MemberProfile.findById(profile._id)
      .populate('assignedTrainer', 'name email phone avatar')
      .populate('membershipPlan', 'name description durationMonths price benefits');

    const now = new Date();
    const hasActiveMembership =
      populated.membershipStatus === 'active' &&
      populated.membershipEndDate &&
      new Date(populated.membershipEndDate) > now;

    if (!populated.assignedTrainer) {
      let request = await TrainerAssignmentRequest.findOne({
        member: req.user._id,
        status: 'pending',
      }).populate('requestedTrainer', 'name email phone avatar');

      if (hasActiveMembership && !request) {
        request = await TrainerAssignmentRequest.create({
          member: req.user._id,
          requestedTrainer: null,
          status: 'pending',
          notes: 'Automatic assignment request created on coach view',
        });
      }

      return res.status(200).json({
        success: true,
        trainer: null,
        hasActiveMembership,
        membershipPlan: populated.membershipPlan || null,
        assignmentRequest: request,
      });
    }

    const trainerProf = await TrainerProfile.findOne({
      user: populated.assignedTrainer._id,
    }).select('specializations experienceYears bio qualifications availableDays availableTime isAvailable');

    const trainerInfo = {
      _id: populated.assignedTrainer._id,
      name: populated.assignedTrainer.name,
      email: populated.assignedTrainer.email,
      phone: populated.assignedTrainer.phone,
      avatar: populated.assignedTrainer.avatar,
      specializations: trainerProf?.specializations || [],
      experienceYears: trainerProf?.experienceYears || 0,
      bio: trainerProf?.bio || '',
      qualifications: trainerProf?.qualifications || [],
      availableDays: trainerProf?.availableDays || [],
      availableTime: trainerProf?.availableTime || '',
      isAvailable: trainerProf?.isAvailable !== false,
    };

    return res.status(200).json({
      success: true,
      trainer: trainerInfo,
      hasActiveMembership: true,
      membershipPlan: populated.membershipPlan || null,
      assignmentRequest: null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMemberDashboard,
  getMemberProfile,
  updateMemberProfile,
  getMemberMembership,
  getMemberTrainer,
};
