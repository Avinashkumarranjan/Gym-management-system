const Progress = require('../models/Progress');
const MemberProfile = require('../models/MemberProfile');
const User = require('../models/User');

// Helper to compute BMI
const computeBMI = (weightKg, heightCm) => {
  if (!weightKg || !heightCm || weightKg <= 0 || heightCm <= 0) return null;
  const heightM = heightCm / 100;
  return parseFloat((weightKg / (heightM * heightM)).toFixed(1));
};

const getBMICategory = (bmi) => {
  if (!bmi) return null;
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
};

// ==========================================
// MEMBER PROGRESS ENDPOINTS
// ==========================================

// @desc    Get authenticated member's progress history
// @route   GET /api/member/progress
// @access  Private (Member)
const getMyProgress = async (req, res, next) => {
  try {
    const memberId = req.user._id;

    const [entries, profile] = await Promise.all([
      Progress.find({ member: memberId }).sort({ date: 1 }),
      MemberProfile.findOne({ user: memberId }).select('height fitnessGoal'),
    ]);

    // Enhance each entry with calculated BMI based on height
    const memberHeight = profile?.height || null;
    const enrichedEntries = entries.map((entry) => {
      const doc = entry.toObject();
      const effectiveHeight = doc.height || memberHeight;
      const bmi = computeBMI(doc.weight, effectiveHeight);
      return {
        ...doc,
        effectiveHeight,
        bmi,
        bmiCategory: getBMICategory(bmi),
      };
    });

    res.status(200).json({
      success: true,
      data: enrichedEntries,
      memberGoal: profile?.fitnessGoal || null,
      profileHeight: memberHeight,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get latest progress entry for member
// @route   GET /api/member/progress/latest
// @access  Private (Member)
const getLatestProgress = async (req, res, next) => {
  try {
    const memberId = req.user._id;

    const [latest, profile] = await Promise.all([
      Progress.findOne({ member: memberId }).sort({ date: -1 }),
      MemberProfile.findOne({ user: memberId }).select('height weight bmi bmiCategory fitnessGoal'),
    ]);

    if (!latest && !profile) {
      return res.status(200).json({
        success: true,
        data: null,
      });
    }

    const effectiveHeight = latest?.height || profile?.height || null;
    const effectiveWeight = latest?.weight || profile?.weight || null;
    const bmi = computeBMI(effectiveWeight, effectiveHeight);

    res.status(200).json({
      success: true,
      data: {
        latestEntry: latest,
        currentWeight: effectiveWeight,
        currentHeight: effectiveHeight,
        bmi,
        bmiCategory: getBMICategory(bmi),
        fitnessGoal: profile?.fitnessGoal,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Log a new progress measurement entry
// @route   POST /api/member/progress
// @access  Private (Member)
const addMyProgress = async (req, res, next) => {
  try {
    const memberId = req.user._id;
    const { weight, height, bodyFatPercentage, measurements, notes, date } = req.body;

    if (!weight || Number(weight) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Weight is required and must be greater than 0 kg.',
      });
    }

    // Lookup profile for height fallback and profile vitals sync
    const profile = await MemberProfile.findOne({ user: memberId });
    const effectiveHeight = height ? Number(height) : profile?.height;

    const newProgress = await Progress.create({
      member: memberId,
      recordedBy: memberId,
      date: date ? new Date(date) : new Date(),
      weight: Number(weight),
      height: effectiveHeight ? Number(effectiveHeight) : undefined,
      bodyFatPercentage: bodyFatPercentage ? Number(bodyFatPercentage) : undefined,
      measurements: measurements || {},
      notes: notes || '',
    });

    // Update profile vitals sync
    if (profile) {
      profile.weight = Number(weight);
      if (effectiveHeight) {
        profile.height = Number(effectiveHeight);
        const newBmi = computeBMI(Number(weight), Number(effectiveHeight));
        profile.bmi = newBmi;
        profile.bmiCategory = getBMICategory(newBmi);
      }
      await profile.save();
    }

    res.status(201).json({
      success: true,
      message: 'Body metrics logged successfully!',
      data: newProgress,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// TRAINER PROGRESS ENDPOINTS
// ==========================================

// @desc    Trainer view athlete progress timeline
// @route   GET /api/trainer/members/:memberId/progress
// @access  Private (Trainer)
const getTrainerMemberProgress = async (req, res, next) => {
  try {
    const { memberId } = req.params;

    const profile = await MemberProfile.findOne({
      $or: [{ _id: memberId }, { user: memberId }],
    }).populate('user', 'name email');

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Athlete profile record not found.',
      });
    }

    if (!profile.assignedTrainer || profile.assignedTrainer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Athlete is not assigned to your coaching roster.',
      });
    }

    const athleteUserId = profile.user._id || profile.user;

    const entries = await Progress.find({ member: athleteUserId }).sort({ date: 1 });

    const memberHeight = profile.height || null;
    const enrichedEntries = entries.map((entry) => {
      const doc = entry.toObject();
      const effectiveHeight = doc.height || memberHeight;
      const bmi = computeBMI(doc.weight, effectiveHeight);
      return {
        ...doc,
        effectiveHeight,
        bmi,
        bmiCategory: getBMICategory(bmi),
      };
    });

    res.status(200).json({
      success: true,
      data: enrichedEntries,
      profileVitals: {
        athleteName: profile.user?.name,
        height: profile.height,
        weight: profile.weight,
        bmi: profile.bmi,
        fitnessGoal: profile.fitnessGoal,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Trainer log progress entry for athlete
// @route   POST /api/trainer/members/:memberId/progress
// @access  Private (Trainer)
const addTrainerMemberProgress = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const { weight, height, bodyFatPercentage, measurements, notes, date } = req.body;

    const profile = await MemberProfile.findOne({
      $or: [{ _id: memberId }, { user: memberId }],
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Athlete profile record not found.',
      });
    }

    if (!profile.assignedTrainer || profile.assignedTrainer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Athlete is not assigned to your coaching roster.',
      });
    }

    if (!weight || Number(weight) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Weight is required and must be greater than 0 kg.',
      });
    }

    const athleteUserId = profile.user;
    const effectiveHeight = height ? Number(height) : profile.height;

    const newProgress = await Progress.create({
      member: athleteUserId,
      recordedBy: req.user._id,
      date: date ? new Date(date) : new Date(),
      weight: Number(weight),
      height: effectiveHeight ? Number(effectiveHeight) : undefined,
      bodyFatPercentage: bodyFatPercentage ? Number(bodyFatPercentage) : undefined,
      measurements: measurements || {},
      notes: notes || '',
    });

    // Update profile vitals
    profile.weight = Number(weight);
    if (effectiveHeight) {
      profile.height = Number(effectiveHeight);
      const newBmi = computeBMI(Number(weight), Number(effectiveHeight));
      profile.bmi = newBmi;
      profile.bmiCategory = getBMICategory(newBmi);
    }
    await profile.save();

    res.status(201).json({
      success: true,
      message: 'Athlete body metrics recorded successfully!',
      data: newProgress,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// ADMIN PROGRESS ENDPOINTS
// ==========================================

// @desc    Admin view all member progress history
// @route   GET /api/admin/progress
// @access  Private (Admin)
const getAdminProgress = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const query = {};

    if (req.query.search) {
      const searchUsers = await User.find({
        role: 'member',
        $or: [
          { name: { $regex: req.query.search, $options: 'i' } },
          { email: { $regex: req.query.search, $options: 'i' } },
        ],
      }).select('_id');

      query.member = { $in: searchUsers.map((u) => u._id) };
    }

    const [entries, total] = await Promise.all([
      Progress.find(query)
        .populate('member', 'name email')
        .populate('recordedBy', 'name role')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
      Progress.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: entries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyProgress,
  getLatestProgress,
  addMyProgress,
  getTrainerMemberProgress,
  addTrainerMemberProgress,
  getAdminProgress,
};
