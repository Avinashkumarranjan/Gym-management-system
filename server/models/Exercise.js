const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Exercise name is required'],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    primaryMuscleGroup: {
      type: String,
      required: [true, 'Primary muscle group is required'],
      enum: [
        'Chest',
        'Back',
        'Shoulders',
        'Biceps',
        'Triceps',
        'Forearms',
        'Quadriceps',
        'Hamstrings',
        'Glutes',
        'Calves',
        'Core',
        'Full Body',
        'Cardio',
        'Mobility',
        'Olympic',
        'Other',
      ],
      index: true,
    },
    secondaryMuscleGroups: [
      {
        type: String,
        trim: true,
      },
    ],
    category: {
      type: String,
      trim: true,
      default: 'Strength',
    },
    movementPattern: {
      type: String,
      enum: [
        'Push',
        'Pull',
        'Squat',
        'Hinge',
        'Lunge',
        'Carry',
        'Rotation',
        'Anti-Rotation',
        'Isolation',
        'Cardio',
        'Mobility',
        'Plyometric',
        'Olympic',
        'Other',
      ],
      default: 'Push',
      index: true,
    },
    equipment: {
      type: String,
      enum: [
        'Bodyweight',
        'Barbell',
        'Dumbbell',
        'Cable',
        'Machine',
        'Kettlebell',
        'Resistance Band',
        'Smith Machine',
        'Bench',
        'TRX',
        'Medicine Ball',
        'Cardio Machine',
        'Other',
      ],
      default: 'Barbell',
      index: true,
    },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Athlete'],
      default: 'Intermediate',
    },
    instructions: {
      type: String,
      trim: true,
      default: '',
    },
    videoUrl: {
      type: String,
      trim: true,
      default: '',
    },
    imageUrl: {
      type: String,
      trim: true,
      default: '',
    },
    isCustom: {
      type: Boolean,
      default: false,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

exerciseSchema.index({ name: 'text', instructions: 'text' });

const Exercise = mongoose.model('Exercise', exerciseSchema);

module.exports = Exercise;
