const cron = require('node-cron');
const { checkAndSendExpiryReminders } = require('./notificationService');

/**
 * Initialize background scheduled tasks
 * Runs once daily at midnight (00:00) to audit membership expirations
 */
const initScheduledTasks = () => {
  // Run once daily at 00:05 AM
  cron.schedule('5 0 * * *', async () => {
    console.log('⏰ Running daily scheduled membership expiry check...');
    await checkAndSendExpiryReminders();
  });

  console.log('✅ Background daily scheduler initialized (FitCore automated tasks active).');
};

module.exports = {
  initScheduledTasks,
};
