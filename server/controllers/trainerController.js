const User = require('../models/User');
const TrainerProfile = require('../models/TrainerProfile');
const MemberProfile = require('../models/MemberProfile');

// Helper to ensure trainer profile exists
const ensureTrainerProfile = async (userId) => {
  let profile = await TrainerProfile.findOne({ user: userId });
  if (!profile) {
    profile = await TrainerProfile.create({ user: userId });
  }
  return profile;
};

// @desc    Get all trainers with search, filters & pagination
// @route   GET /api/admin/trainers
// @access  Private (Admin)
const getTrainers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const { search, status, specialization, available } = req.query;

    const userMatch = { role: 'trainer' };

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      userMatch.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ];
    }

    if (status === 'active') {
      userMatch.isActive = true;
    } else if (status === 'inactive') {
      userMatch.isActive = false;
    }

    const matchedUsers = await User.find(userMatch).select('_id');
    const matchedUserIds = matchedUsers.map((u) => u._id);

    const profileFilter = { user: { $in: matchedUserIds } };

    if (specialization) {
      profileFilter.specializations = { $in: [new RegExp(specialization, 'i')] };
    }

    if (available === 'true') {
      profileFilter.isAvailable = true;
    } else if (available === 'false') {
      profileFilter.isAvailable = false;
    }

    const total = await TrainerProfile.countDocuments(profileFilter);

    const profiles = await TrainerProfile.find(profileFilter)
      .populate('user', 'name email phone isActive createdAt avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Compute assignedMemberCount dynamically for each trainer
    const enrichedData = await Promise.all(
      profiles
        .filter((p) => p.user)
        .map(async (p) => {
          const assignedCount = await MemberProfile.countDocuments({
            assignedTrainer: p.user._id,
          });
          const pObj = p.toObject();
          pObj.assignedMemberCount = assignedCount;
          return pObj;
        })
    );

    return res.status(200).json({
      success: true,
      data: enrichedData,
      page,
      pages: Math.ceil(total / limit) || 1,
      total,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single trainer details by ID with assigned members
// @route   GET /api/admin/trainers/:id
// @access  Private (Admin)
const getTrainerById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let profile = await TrainerProfile.findById(id).populate(
      'user',
      'name email phone isActive createdAt avatar'
    );

    if (!profile) {
      const user = await User.findById(id);
      if (user && user.role === 'trainer') {
        profile = await ensureTrainerProfile(user._id);
        profile = await TrainerProfile.findById(profile._id).populate(
          'user',
          'name email phone isActive createdAt avatar'
        );
      }
    }

    if (!profile || !profile.user) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found',
      });
    }

    // Query all assigned members for this trainer
    const assignedMembers = await MemberProfile.find({
      assignedTrainer: profile.user._id,
    })
      .populate('user', 'name email phone avatar isActive')
      .populate('membershipPlan', 'name price');

    const profileObj = profile.toObject();
    profileObj.assignedMembers = assignedMembers.filter((m) => m.user);
    profileObj.assignedMemberCount = profileObj.assignedMembers.length;

    return res.status(200).json({
      success: true,
      data: profileObj,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create trainer account (Admin only)
// @route   POST /api/admin/trainers
// @access  Private (Admin)
const createTrainer = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      specializations,
      experienceYears,
      qualifications,
      bio,
      availableDays,
      availableTime,
      salary,
    } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and phone are required.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    const trainerPassword = password || 'FitCoreTrainer@2026';

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password: trainerPassword,
      role: 'trainer', // Strictly forced to trainer
      isActive: true,
    });

    const profile = await TrainerProfile.create({
      user: user._id,
      specializations: Array.isArray(specializations)
        ? specializations
        : specializations
        ? specializations.split(',').map((s) => s.trim())
        : [],
      experienceYears: experienceYears ? Number(experienceYears) : 0,
      qualifications: Array.isArray(qualifications)
        ? qualifications
        : qualifications
        ? qualifications.split(',').map((q) => q.trim())
        : [],
      bio: bio || '',
      availableDays: availableDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      availableTime: availableTime || '06:00 AM - 02:00 PM',
      salary: salary ? Number(salary) : 0,
    });

    const populated = await TrainerProfile.findById(profile._id).populate(
      'user',
      'name email phone isActive createdAt'
    );

    return res.status(201).json({
      success: true,
      message: 'Trainer account created successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update trainer profile
// @route   PATCH /api/admin/trainers/:id
// @access  Private (Admin)
const updateTrainer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      phone,
      specializations,
      experienceYears,
      qualifications,
      bio,
      availableDays,
      availableTime,
      salary,
      isAvailable,
    } = req.body;

    const profile = await TrainerProfile.findById(id);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Trainer not found' });
    }

    if (name || phone) {
      await User.findByIdAndUpdate(profile.user, {
        ...(name ? { name: name.trim() } : {}),
        ...(phone ? { phone: phone.trim() } : {}),
      });
    }

    if (specializations !== undefined) {
      profile.specializations = Array.isArray(specializations)
        ? specializations
        : specializations.split(',').map((s) => s.trim());
    }
    if (experienceYears !== undefined) profile.experienceYears = Number(experienceYears);
    if (qualifications !== undefined) {
      profile.qualifications = Array.isArray(qualifications)
        ? qualifications
        : qualifications.split(',').map((q) => q.trim());
    }
    if (bio !== undefined) profile.bio = bio;
    if (availableDays !== undefined) profile.availableDays = availableDays;
    if (availableTime !== undefined) profile.availableTime = availableTime;
    if (salary !== undefined) profile.salary = Number(salary);
    if (isAvailable !== undefined) profile.isAvailable = Boolean(isAvailable);

    await profile.save();

    const updated = await TrainerProfile.findById(id).populate(
      'user',
      'name email phone isActive'
    );

    return res.status(200).json({
      success: true,
      message: 'Trainer updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle trainer active status
// @route   PATCH /api/admin/trainers/:id/status
// @access  Private (Admin)
const updateTrainerStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const profile = await TrainerProfile.findById(id);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Trainer not found' });
    }

    const newActiveState =
      typeof isActive === 'boolean' ? isActive : !(await User.findById(profile.user)).isActive;

    const user = await User.findByIdAndUpdate(
      profile.user,
      { isActive: newActiveState },
      { new: true }
    );

    profile.isAvailable = newActiveState;
    await profile.save();

    return res.status(200).json({
      success: true,
      message: `Trainer ${newActiveState ? 'activated' : 'deactivated'} successfully`,
      isActive: user.isActive,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTrainers,
  getTrainerById,
  createTrainer,
  updateTrainer,
  updateTrainerStatus,
};
