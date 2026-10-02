const mongoose = require('mongoose');

const mealLogSchema = new mongoose.Schema(
  {
    mealName: {
      type: String,
      required: true,
      trim: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    caloriesConsumed: {
      type: Number,
      default: 0,
    },
    proteinConsumed: {
      type: Number,
      default: 0,
    },
    carbsConsumed: {
      type: Number,
      default: 0,
    },
    fatConsumed: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: true }
);

const dietLogSchema = new mongoose.Schema(
  {
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    dietPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DietPlan',
      default: null,
    },
    planType: {
      type: String,
      enum: ['coach', 'custom', 'scratch'],
      default: 'coach',
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
    },
    mealLogs: [mealLogSchema],
    waterConsumedLiters: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Computed daily totals
    caloriesConsumed: {
      type: Number,
      default: 0,
    },
    proteinConsumed: {
      type: Number,
      default: 0,
    },
    carbsConsumed: {
      type: Number,
      default: 0,
    },
    fatConsumed: {
      type: Number,
      default: 0,
    },
    memberNote: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// One log per member per date
dietLogSchema.index({ member: 1, date: 1 }, { unique: true });

const DietLog = mongoose.model('DietLog', dietLogSchema);

module.exports = DietLog;
