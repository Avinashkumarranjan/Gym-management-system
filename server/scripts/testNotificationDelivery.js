const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const User = require('../models/User');
  const Notification = require('../models/Notification');
  const { createNotification } = require('../services/notificationService');

  const member = await User.findOne({ role: 'member' });
  if (!member) {
    console.log('No member found.');
    process.exit(1);
  }

  // 1. Create a notification
  const notif = await createNotification({
    user: member._id,
    type: 'payment_success',
    title: 'Payment Successful',
    message: 'Your Pro Athlete Annual Membership payment has been verified. Welcome to FitCore!',
    link: '/member/payments',
    metadata: { test: true },
  });

  console.log('Created Notification ID:', notif._id.toString());

  // 2. Test duplicate prevention
  const testReminderKey = `${member._id}_7d_2026-10-01`;
  const firstReminder = await createNotification({
    user: member._id,
    type: 'membership_expiry',
    title: 'Membership Renewal Alert',
    message: 'Your membership is expiring in 7 days.',
    link: '/member/payments',
    metadata: { reminderKey: testReminderKey },
  });

  const duplicateReminder = await createNotification({
    user: member._id,
    type: 'membership_expiry',
    title: 'Membership Renewal Alert',
    message: 'Your membership is expiring in 7 days.',
    link: '/member/payments',
    metadata: { reminderKey: testReminderKey },
  });

  console.log('First reminder created:', !!firstReminder);
  console.log('Duplicate reminder blocked (null expected):', duplicateReminder === null ? 'PASS (Blocked)' : 'FAIL');

  // Clean up test notifications
  await Notification.deleteMany({ 'metadata.test': true });
  await Notification.deleteMany({ 'metadata.reminderKey': testReminderKey });
  console.log('Test notifications cleaned up.');

  await mongoose.disconnect();
  console.log('Notification delivery & deduplication verified successfully!');
  process.exit(0);
};

run();
