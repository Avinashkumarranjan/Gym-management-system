const User = require('../models/User');
const MemberProfile = require('../models/MemberProfile');
const TrainerProfile = require('../models/TrainerProfile');
const MembershipPlan = require('../models/MembershipPlan');

// Helper to ensure member has profile
const ensureMemberProfile = async (userId) => {
  let profile = await MemberProfile.findOne({ user: userId });
  if (!profile) {
    profile = await MemberProfile.create({ user: userId });
  }
  return profile;
};

// @desc    Get all members with search, filters, sorting & pagination
// @route   GET /api/admin/members
// @access  Private (Admin)
const getMembers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const { search, status, membershipPlan, assignedTrainer, fitnessGoal, sort } = req.query;

    // 1. Build User search/match conditions
    const userMatch = { role: 'member' };

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

    // Find matching user IDs
    const matchedUsers = await User.find(userMatch).select('_id');
    const matchedUserIds = matchedUsers.map((u) => u._id);

    // 2. Build MemberProfile filter conditions
    const profileFilter = { user: { $in: matchedUserIds } };

    if (membershipPlan) {
      profileFilter.membershipPlan = membershipPlan;
    }

    if (assignedTrainer) {
      profileFilter.assignedTrainer = assignedTrainer;
    }

    if (fitnessGoal) {
      profileFilter.fitnessGoal = fitnessGoal;
    }

    if (status && status !== 'active' && status !== 'inactive') {
      // Allow filtering by membershipStatus ('active', 'expired', 'pending', 'inactive')
      profileFilter.membershipStatus = status;
    }

    // 3. Sorting
    let sortQuery = { createdAt: -1 };
    if (sort === 'oldest') {
      sortQuery = { createdAt: 1 };
    }

    // 4. Query total & paginated profiles
    const total = await MemberProfile.countDocuments(profileFilter);

    let profiles = await MemberProfile.find(profileFilter)
      .populate('user', 'name email phone isActive createdAt avatar')
      .populate('membershipPlan', 'name price durationMonths')
      .populate('assignedTrainer', 'name email phone')
      .sort(sortQuery)
      .skip(skip)
      .limit(limit);

    // If sorting by name, sort the in-memory array if required
    if (sort === 'name') {
      profiles.sort((a, b) => (a.user?.name || '').localeCompare(b.user?.name || ''));
    }

    // Filter any dangling null user profiles
    const validData = profiles.filter((p) => p.user);

    return res.status(200).json({
      success: true,
      data: validData,
      page,
      pages: Math.ceil(total / limit) || 1,
      total,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single member details by Profile ID or User ID
// @route   GET /api/admin/members/:id
// @access  Private (Admin)
const getMemberById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let profile = await MemberProfile.findById(id)
      .populate('user', 'name email phone isActive createdAt avatar')
      .populate('membershipPlan', 'name price durationMonths benefits')
      .populate('assignedTrainer', 'name email phone avatar');

    if (!profile) {
      // Check if ID is a User ID
      const user = await User.findById(id);
      if (user && user.role === 'member') {
        profile = await ensureMemberProfile(user._id);
        profile = await MemberProfile.findById(profile._id)
          .populate('user', 'name email phone isActive createdAt avatar')
          .populate('membershipPlan', 'name price durationMonths benefits')
          .populate('assignedTrainer', 'name email phone avatar');
      }
    }

    if (!profile || !profile.user) {
      return res.status(404).json({
        success: false,
        message: 'Member not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create member account & profile
// @route   POST /api/admin/members
// @access  Private (Admin)
const createMember = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      gender,
      dateOfBirth,
      address,
      emergencyContact,
      height,
      weight,
      fitnessGoal,
      assignedTrainer,
      membershipPlan,
      notes,
    } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and phone are required.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Default password if not provided by admin
    const memberPassword = password || 'FitCoreMember@2026';

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password: memberPassword,
      role: 'member', // Force member role
      isActive: true,
    });

    // Profile data
    const profileData = {
      user: user._id,
      gender: gender || 'unspecified',
      dateOfBirth: dateOfBirth || null,
      address: address || '',
      emergencyContact: emergencyContact || { name: '', phone: '', relation: '' },
      height: height ? Number(height) : undefined,
      weight: weight ? Number(weight) : undefined,
      fitnessGoal: fitnessGoal || 'general_fitness',
      assignedTrainer: assignedTrainer || null,
      notes: notes || '',
    };

    // If membershipPlan selected, compute expiry
    if (membershipPlan) {
      const plan = await MembershipPlan.findById(membershipPlan);
      if (plan) {
        const start = new Date();
        const end = new Date(start);
        end.setMonth(end.getMonth() + plan.durationMonths);

        profileData.membershipPlan = plan._id;
        profileData.membershipStartDate = start;
        profileData.membershipEndDate = end;
        profileData.membershipStatus = 'active';
      }
    }

    const profile = await MemberProfile.create(profileData);

    const populatedProfile = await MemberProfile.findById(profile._id)
      .populate('user', 'name email phone isActive createdAt avatar')
      .populate('membershipPlan', 'name price durationMonths')
      .populate('assignedTrainer', 'name email');

    return res.status(201).json({
      success: true,
      message: 'Member account created successfully',
      data: populatedProfile,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update member profile & basic info
// @route   PATCH /api/admin/members/:id
// @access  Private (Admin)
const updateMember = async (req, res, next) => {
  try {
    const { id } = req.params;
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
      notes,
    } = req.body;

    const profile = await MemberProfile.findById(id);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Member profile not found' });
    }

    // Update User model fields
    if (name || phone) {
      await User.findByIdAndUpdate(profile.user, {
        ...(name ? { name: name.trim() } : {}),
        ...(phone ? { phone: phone.trim() } : {}),
      });
    }

    // Update MemberProfile fields
    if (gender) profile.gender = gender;
    if (dateOfBirth !== undefined) profile.dateOfBirth = dateOfBirth;
    if (address !== undefined) profile.address = address;
    if (emergencyContact !== undefined) profile.emergencyContact = emergencyContact;
    if (height !== undefined) profile.height = height ? Number(height) : undefined;
    if (weight !== undefined) profile.weight = weight ? Number(weight) : undefined;
    if (fitnessGoal) profile.fitnessGoal = fitnessGoal;
    if (notes !== undefined) profile.notes = notes;

    await profile.save();

    const updatedProfile = await MemberProfile.findById(id)
      .populate('user', 'name email phone isActive createdAt avatar')
      .populate('membershipPlan', 'name price durationMonths')
      .populate('assignedTrainer', 'name email');

    return res.status(200).json({
      success: true,
      message: 'Member updated successfully',
      data: updatedProfile,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle or set Member active/inactive status
// @route   PATCH /api/admin/members/:id/status
// @access  Private (Admin)
const updateMemberStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const profile = await MemberProfile.findById(id);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Member profile not found' });
    }

    const newActiveState = typeof isActive === 'boolean' ? isActive : !(await User.findById(profile.user)).isActive;

    const user = await User.findByIdAndUpdate(
      profile.user,
      { isActive: newActiveState },
      { new: true }
    );

    // If deactivated, set membershipStatus to inactive if active
    if (!newActiveState && profile.membershipStatus === 'active') {
      profile.membershipStatus = 'inactive';
      await profile.save();
    } else if (newActiveState && profile.membershipStatus === 'inactive') {
      profile.membershipStatus = 'active';
      await profile.save();
    }

    return res.status(200).json({
      success: true,
      message: `Member ${newActiveState ? 'activated' : 'deactivated'} successfully`,
      isActive: user.isActive,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign or remove trainer for member
// @route   PATCH /api/admin/members/:id/trainer
// @access  Private (Admin)
const assignTrainer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { trainerId } = req.body;

    const profile = await MemberProfile.findById(id);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Member profile not found' });
    }

    // If removing trainer
    if (!trainerId) {
      profile.assignedTrainer = null;
      await profile.save();
      return res.status(200).json({
        success: true,
        message: 'Trainer assignment removed',
        data: profile,
      });
    }

    // Validate trainer account (accept User ID or TrainerProfile ID)
    let trainerUser = await User.findById(trainerId);
    if (!trainerUser) {
      const tProfile = await TrainerProfile.findById(trainerId);
      if (tProfile) {
        trainerUser = await User.findById(tProfile.user);
      }
    }

    if (!trainerUser || trainerUser.role !== 'trainer') {
      return res.status(400).json({
        success: false,
        message: 'Selected user is not a valid trainer',
      });
    }

    if (!trainerUser.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Cannot assign an inactive trainer',
      });
    }

    profile.assignedTrainer = trainerUser._id;
    await profile.save();

    const updatedProfile = await MemberProfile.findById(id)
      .populate('user', 'name email phone isActive')
      .populate('assignedTrainer', 'name email phone');

    return res.status(200).json({
      success: true,
      message: `Trainer ${trainerUser.name} assigned successfully`,
      data: updatedProfile,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign membership plan to member (calculates expiry based on plan duration)
// @route   PATCH /api/admin/members/:id/membership
// @access  Private (Admin)
const assignMembership = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { membershipPlanId, startDate } = req.body;

    const profile = await MemberProfile.findById(id);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Member profile not found' });
    }

    if (!membershipPlanId) {
      return res.status(400).json({ success: false, message: 'Please select a membership plan' });
    }

    const plan = await MembershipPlan.findById(membershipPlanId);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Membership plan not found' });
    }

    if (!plan.isActive) {
      return res.status(400).json({ success: false, message: 'Cannot assign an inactive membership plan' });
    }

    const start = startDate ? new Date(startDate) : new Date();
    const end = new Date(start);
    end.setMonth(end.getMonth() + plan.durationMonths);

    profile.membershipPlan = plan._id;
    profile.membershipStartDate = start;
    profile.membershipEndDate = end;
    profile.membershipStatus = 'active';

    await profile.save();

    const updatedProfile = await MemberProfile.findById(id)
      .populate('user', 'name email phone isActive')
      .populate('membershipPlan', 'name price durationMonths');

    return res.status(200).json({
      success: true,
      message: `Membership plan ${plan.name} assigned successfully`,
      data: updatedProfile,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Deactivate member account (Soft delete)
// @route   DELETE /api/admin/members/:id
// @access  Private (Admin)
const deleteMember = async (req, res, next) => {
  try {
    const { id } = req.params;

    const profile = await MemberProfile.findById(id);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    // Soft delete by deactivating user
    await User.findByIdAndUpdate(profile.user, { isActive: false });
    profile.membershipStatus = 'inactive';
    await profile.save();

    return res.status(200).json({
      success: true,
      message: 'Member account deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMembers,
  getMemberById,
  createMember,
  updateMember,
  updateMemberStatus,
  assignTrainer,
  assignMembership,
  deleteMember,
};
