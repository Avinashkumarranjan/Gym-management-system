const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema(
  {
    exercise: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exercise',
      default: null,
    },
    name: {
      type: String,
      required: [true, 'Exercise name is required'],
      trim: true,
    },
    customExerciseName: {
      type: String,
      trim: true,
      default: '',
    },
    order: {
      type: Number,
      default: 0,
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
    load: {
      type: String,
      trim: true,
      default: '',
    },
    unit: {
      type: String,
      trim: true,
      default: 'kg',
    },
    tempo: {
      type: String,
      trim: true,
      default: '',
    },
    rpe: {
      type: Number,
      min: 1,
      max: 10,
      default: null,
    },
    rir: {
      type: Number,
      min: 0,
      max: 10,
      default: null,
    },
    techniqueTag: {
      type: String,
      trim: true,
      default: '',
    },
    supersetGroup: {
      type: String,
      trim: true,
      default: '',
    },
    duration: {
      type: String,
      trim: true,
      default: '',
    },
    distance: {
      type: String,
      trim: true,
      default: '',
    },
    caloriesTarget: {
      type: Number,
      default: null,
    },
    trainerNote: {
      type: String,
      trim: true,
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    instructions: {
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
    dayType: {
      type: String,
      enum: ['workout', 'rest', 'recovery', 'not_planned'],
      default: 'workout',
    },
    isRestDay: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      trim: true,
      default: '',
    },
    focus: {
      type: String,
      trim: true,
      default: 'General Training',
    },
    estimatedDuration: {
      type: Number,
      default: 60, // in minutes
    },
    warmupNotes: {
      type: String,
      trim: true,
      default: '',
    },
    cooldownNotes: {
      type: String,
      trim: true,
      default: '',
    },
    generalInstructions: {
      type: String,
      trim: true,
      default: '',
    },
    restDayNotes: {
      recoveryNotes: { type: String, trim: true, default: '' },
      stepsTarget: { type: Number, default: 8000 },
      sleepTargetHours: { type: Number, default: 8 },
      hydrationLiters: { type: Number, default: 3 },
      mobilityNotes: { type: String, trim: true, default: '' },
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
      index: true,
    },
    trainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
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
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Athlete'],
      default: 'Intermediate',
    },
    splitType: {
      type: String,
      enum: [
        'Full Body',
        'Upper / Lower',
        'Push Pull Legs',
        'Bro Split',
        'Strength Split',
        'Powerbuilding',
        'Hypertrophy',
        'HIIT',
        'Cardio',
        'Functional Training',
        'Mobility',
        'Custom Split',
      ],
      default: 'Custom Split',
    },
    duration: {
      type: String,
      trim: true,
      default: '12 Weeks',
    },
    coachInstructions: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'archived'],
      default: 'active',
      index: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    archivedAt: {
      type: Date,
      default: null,
    },
    derivedFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkoutPlan',
      default: null,
    },
    isMemberCustom: {
      type: Boolean,
      default: false,
      index: true,
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

// Compound indexes
workoutPlanSchema.index({ member: 1, isActive: 1 });
workoutPlanSchema.index({ member: 1, status: 1 });
workoutPlanSchema.index({ trainer: 1, isActive: 1 });
workoutPlanSchema.index({ member: 1, isMemberCustom: 1 });

const WorkoutPlan = mongoose.model('WorkoutPlan', workoutPlanSchema);

module.exports = WorkoutPlan;
