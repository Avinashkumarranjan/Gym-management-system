const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema(
  {
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    weight: {
      type: Number,
      required: true,
      min: [1, 'Weight must be greater than 0 kg'],
    },
    height: {
      type: Number,
      min: [1, 'Height must be greater than 0 cm'],
    },
    bodyFatPercentage: {
      type: Number,
      min: [1, 'Body fat percentage must be greater than 0%'],
      max: [70, 'Body fat percentage cannot exceed 70%'],
    },
    measurements: {
      chest: { type: Number, min: 0 },
      waist: { type: Number, min: 0 },
      arms: { type: Number, min: 0 },
      shoulders: { type: Number, min: 0 },
      thighs: { type: Number, min: 0 },
      hips: { type: Number, min: 0 },
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

progressSchema.index({ member: 1, date: -1 });

const Progress = mongoose.model('Progress', progressSchema);

module.exports = Progress;
