const User = require('../models/User');
const MemberProfile = require('../models/MemberProfile');
const TrainerProfile = require('../models/TrainerProfile');
const TrainerAssignmentRequest = require('../models/TrainerAssignmentRequest');
const { createNotification } = require('../services/notificationService');

/**
 * @desc    Get list of all active trainers with their coaching profiles
 * @route   GET /api/trainers/available
 * @access  Public / Authenticated
 */
const getAvailableTrainers = async (req, res, next) => {
  try {
    const activeTrainerUsers = await User.find({
      role: 'trainer',
      isActive: true,
    }).select('name email phone avatar createdAt');

    const trainerUserIds = activeTrainerUsers.map((u) => u._id);

    const profiles = await TrainerProfile.find({
      user: { $in: trainerUserIds },
    });

    const profileMap = new Map();
    profiles.forEach((p) => {
      profileMap.set(p.user.toString(), p);
    });

    const trainers = activeTrainerUsers.map((u) => {
      const p = profileMap.get(u._id.toString());
      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        avatar: u.avatar,
        specializations: p?.specializations || [],
        experienceYears: p?.experienceYears || 0,
        bio: p?.bio || '',
        qualifications: p?.qualifications || [],
        availableDays: p?.availableDays || [],
        availableTime: p?.availableTime || '',
        isAvailable: p?.isAvailable !== false,
      };
    });

    return res.status(200).json({
      success: true,
      count: trainers.length,
      data: trainers,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get member's current trainer assignment request and status
 * @route   GET /api/member/trainer-request
 * @access  Private (Member)
 */
const getMyTrainerAssignment = async (req, res, next) => {
  try {
    const profile = await MemberProfile.findOne({ user: req.user._id })
      .populate('membershipPlan', 'name description durationMonths price benefits')
      .populate('assignedTrainer', 'name email phone avatar');

    if (!profile) {
      return res.status(200).json({
        success: true,
        hasActiveMembership: false,
        assignedTrainer: null,
        request: null,
      });
    }

    const now = new Date();
    const hasActiveMembership =
      profile.membershipStatus === 'active' &&
      profile.membershipEndDate &&
      new Date(profile.membershipEndDate) > now;

    // Retrieve active or most recent assignment request
    let request = await TrainerAssignmentRequest.findOne({
      member: req.user._id,
      status: 'pending',
    })
      .populate('requestedTrainer', 'name email phone avatar')
      .populate('resolvedBy', 'name');

    // Auto-create pending request if member has an active membership and no assigned coach
    if (hasActiveMembership && !profile.assignedTrainer && !request) {
      request = await TrainerAssignmentRequest.create({
        member: req.user._id,
        requestedTrainer: null,
        status: 'pending',
        notes: 'Automatic assignment request created on status check',
      });
    }

    // If no pending request, check for most recently resolved request
    if (!request) {
      request = await TrainerAssignmentRequest.findOne({
        member: req.user._id,
      })
        .sort({ updatedAt: -1 })
        .populate('requestedTrainer', 'name email phone avatar')
        .populate('resolvedBy', 'name');
    }

    let trainerInfo = null;
    if (profile.assignedTrainer) {
      const trainerProf = await TrainerProfile.findOne({
        user: profile.assignedTrainer._id,
      });
      trainerInfo = {
        _id: profile.assignedTrainer._id,
        name: profile.assignedTrainer.name,
        email: profile.assignedTrainer.email,
        phone: profile.assignedTrainer.phone,
        avatar: profile.assignedTrainer.avatar,
        specializations: trainerProf?.specializations || [],
        experienceYears: trainerProf?.experienceYears || 0,
        bio: trainerProf?.bio || '',
        qualifications: trainerProf?.qualifications || [],
        availableDays: trainerProf?.availableDays || [],
        availableTime: trainerProf?.availableTime || '',
        isAvailable: trainerProf?.isAvailable !== false,
      };
    }

    return res.status(200).json({
      success: true,
      hasActiveMembership,
      membershipPlan: profile.membershipPlan,
      membershipEndDate: profile.membershipEndDate,
      assignedTrainer: trainerInfo,
      request,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Submit or update trainer assignment request (Member)
 * @route   POST /api/member/trainer-request
 * @access  Private (Member)
 */
const requestTrainer = async (req, res, next) => {
  try {
    const { trainerId, notes = '' } = req.body;

    const profile = await MemberProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(400).json({
        success: false,
        message: 'Member profile not found. Please complete your registration.',
      });
    }

    const now = new Date();
    const hasActiveMembership =
      profile.membershipStatus === 'active' &&
      profile.membershipEndDate &&
      new Date(profile.membershipEndDate) > now;

    if (!hasActiveMembership) {
      return res.status(400).json({
        success: false,
        message: 'An active membership is required before requesting a personal coach.',
      });
    }

    if (profile.assignedTrainer) {
      return res.status(400).json({
        success: false,
        message: 'You already have an assigned coach. Contact reception or admin to request a coach change.',
      });
    }

    let requestedTrainerUser = null;
    if (trainerId) {
      requestedTrainerUser = await User.findOne({
        _id: trainerId,
        role: 'trainer',
        isActive: true,
      });

      if (!requestedTrainerUser) {
        return res.status(400).json({
          success: false,
          message: 'Selected coach is currently unavailable or invalid.',
        });
      }
    }

    // Check if pending request exists (Duplicate protection)
    let request = await TrainerAssignmentRequest.findOne({
      member: req.user._id,
      status: 'pending',
    });

    if (request) {
      // Update existing pending request
      request.requestedTrainer = requestedTrainerUser ? requestedTrainerUser._id : null;
      if (notes) request.notes = notes.trim();
      await request.save();
    } else {
      // Create new pending request
      request = await TrainerAssignmentRequest.create({
        member: req.user._id,
        requestedTrainer: requestedTrainerUser ? requestedTrainerUser._id : null,
        notes: notes ? notes.trim() : '',
        status: 'pending',
      });
    }

    await request.populate('requestedTrainer', 'name email avatar');

    // Create confirmation in-app notification
    await createNotification({
      user: req.user._id,
      type: 'trainer_request',
      title: 'Trainer Request Submitted',
      message: requestedTrainerUser
        ? `Your request for coach ${requestedTrainerUser.name} has been received. Our team will review and confirm.`
        : 'Your coach matching request has been received. Our club team will assign the ideal coach for you.',
      link: '/member/trainer',
    });

    return res.status(200).json({
      success: true,
      message: requestedTrainerUser
        ? `Preference for ${requestedTrainerUser.name} saved. Assignment pending admin confirmation.`
        : 'Coach matching request submitted successfully.',
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all trainer assignment requests (Admin)
 * @route   GET /api/admin/trainer-assignments
 * @access  Private (Admin)
 */
const getAdminTrainerAssignments = async (req, res, next) => {
  try {
    const { status = 'all', page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const total = await TrainerAssignmentRequest.countDocuments(filter);
    const pendingCount = await TrainerAssignmentRequest.countDocuments({ status: 'pending' });

    const requests = await TrainerAssignmentRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('member', 'name email phone avatar')
      .populate('requestedTrainer', 'name email phone avatar')
      .populate('resolvedBy', 'name email');

    // Attach MemberProfile info (plan, status, fitness goal) for each request
    const memberIds = requests.map((r) => r.member?._id).filter(Boolean);
    const profiles = await MemberProfile.find({ user: { $in: memberIds } })
      .populate('membershipPlan', 'name price durationMonths')
      .populate('assignedTrainer', 'name email');

    const profileMap = new Map();
    profiles.forEach((p) => {
      profileMap.set(p.user.toString(), p);
    });

    const enrichedRequests = requests.map((r) => {
      const p = r.member ? profileMap.get(r.member._id.toString()) : null;
      return {
        _id: r._id,
        member: r.member,
        requestedTrainer: r.requestedTrainer,
        status: r.status,
        notes: r.notes,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        resolvedAt: r.resolvedAt,
        resolvedBy: r.resolvedBy,
        memberProfile: p
          ? {
              membershipPlan: p.membershipPlan?.name || 'No Plan',
              membershipStatus: p.membershipStatus,
              membershipEndDate: p.membershipEndDate,
              fitnessGoal: p.fitnessGoal,
              height: p.height,
              weight: p.weight,
              assignedTrainer: p.assignedTrainer,
            }
          : null,
      };
    });

    return res.status(200).json({
      success: true,
      total,
      pendingCount,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      data: enrichedRequests,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Assign trainer to request and approve it (Admin)
 * @route   POST /api/admin/trainer-assignments/:id/assign
 * @access  Private (Admin)
 */
const assignTrainerToRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { trainerId, notes = '' } = req.body;

    if (!trainerId) {
      return res.status(400).json({
        success: false,
        message: 'Please select a valid trainer to assign.',
      });
    }

    const request = await TrainerAssignmentRequest.findById(id).populate('member', 'name email');
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Trainer assignment request not found.',
      });
    }

    // Validate selected trainer
    let trainerUser = await User.findById(trainerId);
    if (!trainerUser) {
      const tProf = await TrainerProfile.findById(trainerId);
      if (tProf) {
        trainerUser = await User.findById(tProf.user);
      }
    }

    if (!trainerUser || trainerUser.role !== 'trainer') {
      return res.status(400).json({
        success: false,
        message: 'Selected user is not a valid trainer.',
      });
    }

    if (!trainerUser.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Cannot assign an inactive trainer.',
      });
    }

    // Update MemberProfile
    const memberProfile = await MemberProfile.findOne({ user: request.member._id });
    if (!memberProfile) {
      return res.status(404).json({
        success: false,
        message: 'Member profile not found.',
      });
    }

    memberProfile.assignedTrainer = trainerUser._id;
    await memberProfile.save();

    // Mark Request as approved
    request.status = 'approved';
    request.requestedTrainer = trainerUser._id;
    request.resolvedAt = new Date();
    request.resolvedBy = req.user._id;
    if (notes) request.notes = notes.trim();
    await request.save();

    // Create in-app notification for member
    await createNotification({
      user: request.member._id,
      type: 'trainer_assigned',
      title: 'FitCore Coach Assigned',
      message: `${trainerUser.name} has been assigned as your FitCore coach. You can now book personal training sessions and access customized programs.`,
      link: '/member/trainer',
    });

    // Create in-app notification for trainer
    await createNotification({
      user: trainerUser._id,
      type: 'member_assigned',
      title: 'New Athlete Assigned',
      message: `${request.member.name} has been assigned to your coaching roster. Review their profile and prepare their training program.`,
      link: '/trainer/members',
    });

    return res.status(200).json({
      success: true,
      message: `Coach ${trainerUser.name} successfully assigned to ${request.member.name}.`,
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reject trainer assignment request (Admin)
 * @route   PATCH /api/admin/trainer-assignments/:id/reject
 * @access  Private (Admin)
 */
const rejectTrainerRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason = '' } = req.body;

    const request = await TrainerAssignmentRequest.findById(id).populate('member', 'name email');
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Trainer assignment request not found.',
      });
    }

    request.status = 'rejected';
    request.resolvedAt = new Date();
    request.resolvedBy = req.user._id;
    if (reason) request.notes = reason.trim();
    await request.save();

    await createNotification({
      user: request.member._id,
      type: 'trainer_request_rejected',
      title: 'Trainer Request Update',
      message: reason
        ? `Your coach assignment request could not be processed: ${reason}`
        : 'Your coach assignment request has been rejected. Please contact gym administration.',
      link: '/member/trainer',
    });

    return res.status(200).json({
      success: true,
      message: 'Trainer assignment request rejected.',
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAvailableTrainers,
  getMyTrainerAssignment,
  requestTrainer,
  getAdminTrainerAssignments,
  assignTrainerToRequest,
  rejectTrainerRequest,
};
