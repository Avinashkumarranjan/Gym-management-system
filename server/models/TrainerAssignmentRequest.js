const mongoose = require('mongoose');

const trainerAssignmentRequestSchema = new mongoose.Schema(
  {
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    requestedTrainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

trainerAssignmentRequestSchema.index({ member: 1, status: 1 });

const TrainerAssignmentRequest = mongoose.model(
  'TrainerAssignmentRequest',
  trainerAssignmentRequestSchema
);

module.exports = TrainerAssignmentRequest;
