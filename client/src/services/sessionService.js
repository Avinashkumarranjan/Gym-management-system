import api from './api';

const sessionService = {
  // Member endpoints
  getMySessions: async () => {
    const res = await api.get('/member/sessions');
    return res.data;
  },

  getSessionById: async (id) => {
    const res = await api.get(`/member/sessions/${id}`);
    return res.data;
  },

  bookSession: async (data) => {
    const res = await api.post('/member/sessions', data);
    return res.data;
  },

  cancelMemberSession: async (id, reason = '') => {
    const res = await api.patch(`/member/sessions/${id}/cancel`, { reason });
    return res.data;
  },

  rescheduleMemberSession: async (id, data) => {
    const res = await api.patch(`/member/sessions/${id}/reschedule`, data);
    return res.data;
  },

  // Trainer endpoints
  getTrainerSessions: async () => {
    const res = await api.get('/trainer/sessions');
    return res.data;
  },

  cancelTrainerSession: async (id, reason = '') => {
    const res = await api.patch(`/trainer/sessions/${id}/cancel`, { reason });
    return res.data;
  },

  updateTrainerSessionNote: async (id, trainerNote) => {
    const res = await api.patch(`/trainer/sessions/${id}/note`, { trainerNote });
    return res.data;
  },

  // Admin endpoints
  getAdminSessions: async (params = {}) => {
    const res = await api.get('/admin/sessions', { params });
    return res.data;
  },
};

export default sessionService;
