const Notification = require('../models/Notification');
const MemberProfile = require('../models/MemberProfile');

/**
 * Create a new notification for a specific user safely
 */
const createNotification = async ({
  user,
  type = 'general',
  title,
  message,
  link = '',
  metadata = {},
}) => {
  try {
    if (!user || !title || !message) return null;

    // If deterministic reminderKey exists, avoid duplicate creation
    if (metadata?.reminderKey) {
      const existing = await Notification.findOne({
        user,
        'metadata.reminderKey': metadata.reminderKey,
      });
      if (existing) {
        return null; // Suppress duplicate notification
      }
    }

    const notification = await Notification.create({
      user,
      type,
      title: title.trim(),
      message: message.trim(),
      link: link.trim(),
      metadata,
    });

    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error.message);
    return null;
  }
};

/**
 * Daily background check for upcoming membership expirations and status sync
 */
const checkAndSendExpiryReminders = async () => {
  try {
    const now = new Date();

    // Query active members with end dates
    const profiles = await MemberProfile.find({
      membershipEndDate: { $ne: null },
    }).populate('membershipPlan', 'name');

    let processedCount = 0;
    let expiredUpdatedCount = 0;

    for (const profile of profiles) {
      if (!profile.user || !profile.membershipEndDate) continue;

      const endDate = new Date(profile.membershipEndDate);
      const diffTime = endDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const dateStr = endDate.toISOString().slice(0, 10);
      const planName = profile.membershipPlan?.name || 'Membership';

      // 1. If membership expired and profile is still marked 'active'
      if (diffTime <= 0) {
        if (profile.membershipStatus === 'active') {
          profile.membershipStatus = 'expired';
          await profile.save();
          expiredUpdatedCount++;
        }

        const reminderKey = `${profile.user}_expired_${dateStr}`;
        await createNotification({
          user: profile.user,
          type: 'membership_expired',
          title: 'Membership Term Ended',
          message: `Your ${planName} membership has expired. Renew online to maintain uninterrupted gym floor access.`,
          link: '/member/payments',
          metadata: { reminderKey, planName, expiryDate: dateStr },
        });
        processedCount++;
        continue;
      }

      // Only check upcoming reminders if status is active
      if (profile.membershipStatus !== 'active') continue;

      // 2. Upcoming expiry thresholds: 7 days, 3 days, 1 day
      if (diffDays <= 7 && diffDays > 0) {
        let reminderInterval = null;
        let urgencyText = '';

        if (diffDays === 7 || (diffDays >= 6 && diffDays <= 7)) {
          reminderInterval = '7d';
          urgencyText = '7 days';
        } else if (diffDays === 3 || (diffDays >= 2 && diffDays <= 3)) {
          reminderInterval = '3d';
          urgencyText = '3 days';
        } else if (diffDays <= 1) {
          reminderInterval = '1d';
          urgencyText = diffDays === 1 ? 'tomorrow' : 'less than 24 hours';
        }

        if (reminderInterval) {
          const reminderKey = `${profile.user}_${reminderInterval}_${dateStr}`;
          await createNotification({
            user: profile.user,
            type: 'membership_expiry',
            title: `Membership Expiring in ${urgencyText.charAt(0).toUpperCase() + urgencyText.slice(1)}`,
            message: `Your ${planName} subscription expires on ${endDate.toLocaleDateString()}. Renew seamlessly online without losing active days.`,
            link: '/member/payments',
            metadata: { reminderKey, reminderInterval, planName, expiryDate: dateStr },
          });
          processedCount++;
        }
      }
    }

    return { success: true, processedCount, expiredUpdatedCount };
  } catch (error) {
    console.error('Error in checkAndSendExpiryReminders:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  createNotification,
  checkAndSendExpiryReminders,
};
