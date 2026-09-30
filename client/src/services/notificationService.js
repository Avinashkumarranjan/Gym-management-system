import api from './api';

export const notificationService = {
  // Get logged in user's notifications
  getNotifications: async () => {
    const res = await api.get('/notifications');
    return res.data;
  },

  // Mark specific notification as read
  markAsRead: async (id) => {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const res = await api.patch('/notifications/read-all');
    return res.data;
  },

  // Admin trigger expiry check
  triggerExpiryCheck: async () => {
    const res = await api.post('/notifications/check-expiry');
    return res.data;
  },
};

export default notificationService;
