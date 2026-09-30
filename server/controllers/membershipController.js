const MembershipPlan = require('../models/MembershipPlan');
const MemberProfile = require('../models/MemberProfile');

// Seed default plans if none exist
const seedDefaultPlansIfEmpty = async (userId) => {
  const count = await MembershipPlan.countDocuments();
  if (count === 0) {
    await MembershipPlan.insertMany([
      {
        name: 'Monthly',
        description: 'Flexible short-term membership with full gym floor access.',
        durationMonths: 1,
        price: 1499,
        benefits: [
          'Full Gym & Equipment Access',
          'General Trainer Guidance',
          'Locker & Shower Access',
        ],
        isActive: true,
        createdBy: userId || null,
      },
      {
        name: 'Quarterly',
        description: 'Structured 12-week training rhythm for sustainable habit building.',
        durationMonths: 3,
        price: 3999,
        benefits: [
          'Full Gym & Equipment Access',
          'Assigned Trainer Consultation',
          '1 Complimentary InBody Scan',
          'Locker & Shower Access',
        ],
        isActive: true,
        createdBy: userId || null,
      },
      {
        name: 'Half-Yearly',
        description: 'Comprehensive 6-month split for dedicated body recomposition.',
        durationMonths: 6,
        price: 7499,
        benefits: [
          'All-Hours Gym Floor Access',
          'Bi-Weekly Progression Check-ins',
          '3 InBody Composition Scans',
          'Steam & Sauna Access',
        ],
        isActive: true,
        createdBy: userId || null,
      },
      {
        name: 'Annual',
        description: 'Our premier all-access VIP athletic experience for 365 days.',
        durationMonths: 12,
        price: 11999,
        benefits: [
          'Unlimited 365 Days All-Hours Access',
          'Priority Coach Consultations',
          'Monthly InBody Body Scans',
          'Steam & Sauna Access',
          'FitCore Athlete Welcome Kit',
        ],
        isActive: true,
        createdBy: userId || null,
      },
    ]);
  }
};

// @desc    Get all membership plans with subscriber counts
// @route   GET /api/admin/membership-plans
// @access  Private (Admin)
const getMembershipPlans = async (req, res, next) => {
  try {
    await seedDefaultPlansIfEmpty(req.user?._id);

    const plans = await MembershipPlan.find().sort({ durationMonths: 1 });

    // Compute active member count for each plan
    const enrichedPlans = await Promise.all(
      plans.map(async (plan) => {
        const activeMembersCount = await MemberProfile.countDocuments({
          membershipPlan: plan._id,
          membershipStatus: 'active',
        });
        const planObj = plan.toObject();
        planObj.activeMembersCount = activeMembersCount;
        return planObj;
      })
    );

    return res.status(200).json({
      success: true,
      data: enrichedPlans,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single plan by ID
// @route   GET /api/admin/membership-plans/:id
// @access  Private (Admin)
const getMembershipPlanById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const plan = await MembershipPlan.findById(id);

    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    const activeMembersCount = await MemberProfile.countDocuments({
      membershipPlan: plan._id,
      membershipStatus: 'active',
    });

    const planObj = plan.toObject();
    planObj.activeMembersCount = activeMembersCount;

    return res.status(200).json({
      success: true,
      data: planObj,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new membership plan
// @route   POST /api/admin/membership-plans
// @access  Private (Admin)
const createMembershipPlan = async (req, res, next) => {
  try {
    const { name, description, durationMonths, price, benefits, isActive } = req.body;

    if (!name || durationMonths === undefined || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name, duration in months, and price are required.',
      });
    }

    if (Number(price) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Plan price cannot be negative.',
      });
    }

    if (Number(durationMonths) < 1) {
      return res.status(400).json({
        success: false,
        message: 'Duration must be at least 1 month.',
      });
    }

    const existing = await MembershipPlan.findOne({ name: name.trim() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A plan with this name already exists.',
      });
    }

    const plan = await MembershipPlan.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      durationMonths: Number(durationMonths),
      price: Number(price),
      benefits: Array.isArray(benefits)
        ? benefits
        : benefits
        ? benefits.split('\n').map((b) => b.trim()).filter(Boolean)
        : [],
      isActive: typeof isActive === 'boolean' ? isActive : true,
      createdBy: req.user?._id || null,
    });

    return res.status(201).json({
      success: true,
      message: 'Membership plan created successfully',
      data: plan,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update membership plan
// @route   PATCH /api/admin/membership-plans/:id
// @access  Private (Admin)
const updateMembershipPlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, durationMonths, price, benefits, isActive } = req.body;

    const plan = await MembershipPlan.findById(id);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    if (name) plan.name = name.trim();
    if (description !== undefined) plan.description = description.trim();
    if (durationMonths !== undefined) {
      if (Number(durationMonths) < 1) {
        return res.status(400).json({ success: false, message: 'Duration must be at least 1 month' });
      }
      plan.durationMonths = Number(durationMonths);
    }
    if (price !== undefined) {
      if (Number(price) < 0) {
        return res.status(400).json({ success: false, message: 'Price cannot be negative' });
      }
      plan.price = Number(price);
    }
    if (benefits !== undefined) {
      plan.benefits = Array.isArray(benefits)
        ? benefits
        : benefits.split('\n').map((b) => b.trim()).filter(Boolean);
    }
    if (isActive !== undefined) plan.isActive = Boolean(isActive);

    await plan.save();

    return res.status(200).json({
      success: true,
      message: 'Plan updated successfully',
      data: plan,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle plan active/inactive status
// @route   PATCH /api/admin/membership-plans/:id/status
// @access  Private (Admin)
const updateMembershipPlanStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const plan = await MembershipPlan.findById(id);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    const newActive = typeof isActive === 'boolean' ? isActive : !plan.isActive;
    plan.isActive = newActive;
    await plan.save();

    return res.status(200).json({
      success: true,
      message: `Plan ${newActive ? 'activated' : 'deactivated'} successfully`,
      isActive: plan.isActive,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMembershipPlans,
  getMembershipPlanById,
  createMembershipPlan,
  updateMembershipPlan,
  updateMembershipPlanStatus,
};
