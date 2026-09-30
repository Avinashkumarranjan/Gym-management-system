const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Exercise name is required'],
      trim: true,
    },
    sets: {
      type: Number,
      required: [true, 'Number of sets is required'],
      min: [1, 'Sets must be at least 1'],
      default: 3,
    },
    reps: {
      type: String,
      required: [true, 'Reps or duration is required'],
      trim: true,
      default: '10-12',
    },
    restSeconds: {
      type: Number,
      default: 60,
      min: [0, 'Rest seconds cannot be negative'],
    },
    weightGuidance: {
      type: String,
      trim: true,
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: true }
);

const dailyScheduleSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true,
    },
    focus: {
      type: String,
      trim: true,
      default: 'Rest & Recovery',
    },
    exercises: [exerciseSchema],
  },
  { _id: true }
);

const workoutPlanSchema = new mongoose.Schema(
  {
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Member reference is required'],
    },
    trainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Trainer reference is required'],
    },
    title: {
      type: String,
      required: [true, 'Workout plan title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    goal: {
      type: String,
      trim: true,
      default: 'General Fitness',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    weeklySchedule: [dailyScheduleSchema],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying a member's active plans
workoutPlanSchema.index({ member: 1, isActive: 1 });
workoutPlanSchema.index({ trainer: 1, isActive: 1 });

const WorkoutPlan = mongoose.model('WorkoutPlan', workoutPlanSchema);

module.exports = WorkoutPlan;
