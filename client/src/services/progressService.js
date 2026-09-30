import api from './api';

const progressService = {
  // Member get progress timeline
  getMyProgress: async () => {
    const res = await api.get('/member/progress');
    return res.data;
  },

  // Member get latest snapshot
  getLatestProgress: async () => {
    const res = await api.get('/member/progress/latest');
    return res.data;
  },

  // Member log new progress entry
  addMyProgress: async (data) => {
    const res = await api.post('/member/progress', data);
    return res.data;
  },

  // Trainer view assigned member's progress timeline
  getTrainerMemberProgress: async (memberId) => {
    const res = await api.get(`/trainer/members/${memberId}/progress`);
    return res.data;
  },

  // Trainer record progress entry for assigned member
  addTrainerMemberProgress: async (memberId, data) => {
    const res = await api.post(`/trainer/members/${memberId}/progress`, data);
    return res.data;
  },

  // Admin global progress oversight
  getAdminProgress: async (params = {}) => {
    const res = await api.get('/admin/progress', { params });
    return res.data;
  },
};

export default progressService;
