const mongoose = require('mongoose');

const memberProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'unspecified'],
      default: 'unspecified',
    },
    dateOfBirth: {
      type: Date,
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    emergencyContact: {
      name: { type: String, trim: true, default: '' },
      phone: { type: String, trim: true, default: '' },
      relation: { type: String, trim: true, default: '' },
    },
    height: {
      type: Number, // In centimeters
      min: [50, 'Height must be realistic'],
      max: [280, 'Height must be realistic'],
    },
    weight: {
      type: Number, // In kilograms
      min: [20, 'Weight must be realistic'],
      max: [350, 'Weight must be realistic'],
    },
    fitnessGoal: {
      type: String,
      enum: [
        'weight_loss',
        'weight_gain',
        'muscle_building',
        'strength',
        'general_fitness',
        'endurance',
      ],
      default: 'general_fitness',
    },
    joinDate: {
      type: Date,
      default: Date.now,
    },
    assignedTrainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    membershipPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MembershipPlan',
      default: null,
    },
    membershipStartDate: {
      type: Date,
      default: null,
    },
    membershipEndDate: {
      type: Date,
      default: null,
    },
    membershipStatus: {
      type: String,
      enum: ['active', 'expired', 'inactive', 'pending'],
      default: 'pending',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

memberProfileSchema.index({ assignedTrainer: 1 });
memberProfileSchema.index({ membershipPlan: 1 });
memberProfileSchema.index({ membershipStatus: 1 });

const MemberProfile = mongoose.model('MemberProfile', memberProfileSchema);

module.exports = MemberProfile;
