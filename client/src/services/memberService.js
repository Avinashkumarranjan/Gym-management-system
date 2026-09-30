import api from './api';

const memberService = {
  getDashboard: async () => {
    const res = await api.get('/member/dashboard');
    return res.data;
  },

  getProfile: async () => {
    const res = await api.get('/member/profile');
    return res.data;
  },

  updateProfile: async (data) => {
    const res = await api.patch('/member/profile', data);
    return res.data;
  },

  getMembership: async () => {
    const res = await api.get('/member/membership');
    return res.data;
  },

  getTrainer: async () => {
    const res = await api.get('/member/trainer');
    return res.data;
  },

  getMyTrainer: async () => {
    const res = await api.get('/member/trainer');
    return res.data;
  },

  getTrainerRequest: async () => {
    const res = await api.get('/member/trainer-request');
    return res.data;
  },

  requestTrainer: async ({ trainerId, notes } = {}) => {
    const res = await api.post('/member/trainer-request', { trainerId, notes });
    return res.data;
  },

  getAvailableTrainers: async () => {
    const res = await api.get('/trainers/available');
    return res.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const res = await api.patch('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return res.data;
  },
};

export default memberService;
