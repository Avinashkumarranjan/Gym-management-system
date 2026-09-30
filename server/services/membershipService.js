const MemberProfile = require('../models/MemberProfile');
const MembershipPlan = require('../models/MembershipPlan');
const Payment = require('../models/Payment');
const TrainerAssignmentRequest = require('../models/TrainerAssignmentRequest');

/**
 * Add calendar months to a given date accurately
 */
const addMonthsToDate = (date, months) => {
  const result = new Date(date);
  const currentMonth = result.getMonth();
  result.setMonth(currentMonth + Number(months));
  return result;
};

/**
 * Generate a unique and stable receipt number e.g. FIT-2026-000123
 */
const generateReceiptNumber = async () => {
  const year = new Date().getFullYear();
  const count = await Payment.countDocuments({
    status: 'paid',
    receiptNumber: { $regex: `^FIT-${year}-` },
  });
  const sequence = String(count + 1).padStart(6, '0');
  let receiptNumber = `FIT-${year}-${sequence}`;

  // Fallback collision check
  const exists = await Payment.findOne({ receiptNumber });
  if (exists) {
    const randomSuffix = Math.floor(10 + Math.random() * 90);
    receiptNumber = `FIT-${year}-${String(count + 1).padStart(4, '0')}${randomSuffix}`;
  }
  return receiptNumber;
};

/**
 * Generate a unique internal transaction reference
 */
const generateTransactionReference = () => {
  const timestamp = Date.now();
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `FITCORE-PAY-${timestamp}-${rand}`;
};

/**
 * Activate or Renew a member's subscription
 * Shared implementation for Razorpay payment, manual admin payment, and webhook reconciliation
 * 
 * @param {String|ObjectId} userId - Member user ID
 * @param {String|ObjectId} planId - MembershipPlan ID
 * @param {Object} [session] - Optional Mongoose transaction session
 */
const activateOrRenewMembership = async (userId, planId, session = null) => {
  const planQuery = MembershipPlan.findById(planId);
  if (session) planQuery.session(session);
  const plan = await planQuery;

  if (!plan) {
    throw new Error('Membership plan not found.');
  }

  if (!plan.isActive) {
    throw new Error('The selected membership plan is currently inactive.');
  }

  const profileQuery = MemberProfile.findOne({ user: userId });
  if (session) profileQuery.session(session);
  let profile = await profileQuery;

  if (!profile) {
    profile = new MemberProfile({ user: userId });
  }

  const now = new Date();
  const hasActiveMembership =
    profile.membershipStatus === 'active' &&
    profile.membershipEndDate &&
    new Date(profile.membershipEndDate) > now;

  let membershipStartDate;
  let membershipEndDate;
  let wasRenewed = false;

  if (hasActiveMembership) {
    // Renewal: extend from existing membershipEndDate
    const existingEndDate = new Date(profile.membershipEndDate);
    membershipStartDate = existingEndDate;
    membershipEndDate = addMonthsToDate(existingEndDate, plan.durationMonths);
    wasRenewed = true;

    profile.membershipPlan = plan._id;
    profile.membershipEndDate = membershipEndDate;
    profile.membershipStatus = 'active';
  } else {
    // New or Expired Membership: begins today
    membershipStartDate = now;
    membershipEndDate = addMonthsToDate(now, plan.durationMonths);
    wasRenewed = false;

    profile.membershipPlan = plan._id;
    profile.membershipStartDate = membershipStartDate;
    profile.membershipEndDate = membershipEndDate;
    profile.membershipStatus = 'active';
  }

  await profile.save({ session });

  // Post-Membership Onboarding: If member does not have an assigned trainer,
  // ensure an assignment request is pending so admin can assign a coach.
  // Renewal preserves any existing trainer assignment and does not create duplicate requests.
  if (!profile.assignedTrainer) {
    const existingPending = await TrainerAssignmentRequest.findOne({
      member: userId,
      status: 'pending',
    });
    if (!existingPending) {
      await TrainerAssignmentRequest.create({
        member: userId,
        requestedTrainer: null,
        status: 'pending',
        notes: wasRenewed
          ? 'Renewed membership requiring trainer assignment'
          : 'Automatic coach assignment request created on membership activation',
      });
    }
  }

  return {
    profile,
    membershipPlan: plan,
    membershipStartDate,
    membershipEndDate,
    wasRenewed,
  };
};

module.exports = {
  addMonthsToDate,
  generateReceiptNumber,
  generateTransactionReference,
  activateOrRenewMembership,
};
