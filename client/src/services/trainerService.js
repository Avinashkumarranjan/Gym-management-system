import api from './api';

const trainerService = {
  getDashboard: async () => {
    const res = await api.get('/trainer/dashboard');
    return res.data;
  },

  getProfile: async () => {
    const res = await api.get('/trainer/profile');
    return res.data;
  },

  updateProfile: async (data) => {
    const res = await api.patch('/trainer/profile', data);
    return res.data;
  },

  getAssignedMembers: async (params = {}) => {
    const res = await api.get('/trainer/members', { params });
    return res.data;
  },

  getAssignedMemberDetails: async (memberId) => {
    const res = await api.get(`/trainer/members/${memberId}`);
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

export default trainerService;
