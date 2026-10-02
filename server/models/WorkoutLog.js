const mongoose = require('mongoose');

const setLogSchema = new mongoose.Schema(
  {
    setNumber: {
      type: Number,
      default: 1,
    },
    weight: {
      type: String,
      trim: true,
      default: '',
    },
    reps: {
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
    completed: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const exerciseLogSchema = new mongoose.Schema(
  {
    exerciseReference: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exercise',
      default: null,
    },
    exerciseName: {
      type: String,
      required: true,
      trim: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    actualSets: {
      type: Number,
      default: 0,
    },
    actualReps: {
      type: String,
      trim: true,
      default: '',
    },
    actualWeight: {
      type: String,
      trim: true,
      default: '',
    },
    unit: {
      type: String,
      trim: true,
      default: 'kg',
    },
    rpe: {
      type: Number,
      min: 1,
      max: 10,
      default: null,
    },
    setLogs: [setLogSchema],
    personalNote: {
      type: String,
      trim: true,
      default: '',
    },
    // Backwards-compatible alias for personalNote
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: true }
);

const workoutLogSchema = new mongoose.Schema(
  {
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    workoutPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkoutPlan',
      required: true,
      index: true,
    },
    planType: {
      type: String,
      enum: ['coach', 'custom'],
      default: 'coach',
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
    },
    day: {
      type: String,
      default: '',
    },
    workoutTitle: {
      type: String,
      trim: true,
      default: '',
    },
    exerciseLogs: [exerciseLogSchema],
    memberNote: {
      type: String,
      trim: true,
      default: '',
    },
    overallNotes: {
      type: String,
      trim: true,
      default: '',
    },
    energyLevel: {
      type: String,
      enum: ['Low', 'Normal', 'High', ''],
      default: '',
    },
    difficultyFeeling: {
      type: String,
      enum: ['Easy', 'Moderate', 'Hard', ''],
      default: '',
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    durationMinutes: {
      type: Number,
      default: null,
    },
    isWorkoutCompleted: {
      type: Boolean,
      default: false,
    },
    completedExercisesCount: {
      type: Number,
      default: 0,
    },
    totalExercisesCount: {
      type: Number,
      default: 0,
    },
    totalVolumeKg: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// One daily log per member per date (upsert safe)
workoutLogSchema.index({ member: 1, date: 1 }, { unique: true });
workoutLogSchema.index({ member: 1, createdAt: -1 });

const WorkoutLog = mongoose.model('WorkoutLog', workoutLogSchema);

module.exports = WorkoutLog;
