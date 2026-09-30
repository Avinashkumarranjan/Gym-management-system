const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required for notification'],
    },
    type: {
      type: String,
      enum: [
        'membership_expiry',
        'membership_expired',
        'payment_success',
        'workout_assigned',
        'diet_assigned',
        'session_booked',
        'session_cancelled',
        'general',
      ],
      default: 'general',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
    },
    link: {
      type: String,
      trim: true,
      default: '',
    },
    isRead: {
      type: Boolean,
      default: false,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ 'metadata.reminderKey': 1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
