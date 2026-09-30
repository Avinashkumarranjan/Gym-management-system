import api from './api';

const adminService = {
  // 1. Dashboard
  getDashboard: async () => {
    const res = await api.get('/admin/dashboard');
    return res.data;
  },

  // 2. Members
  getMembers: async (params = {}) => {
    const res = await api.get('/admin/members', { params });
    return res.data;
  },

  getMemberById: async (id) => {
    const res = await api.get(`/admin/members/${id}`);
    return res.data;
  },

  createMember: async (data) => {
    const res = await api.post('/admin/members', data);
    return res.data;
  },

  updateMember: async (id, data) => {
    const res = await api.patch(`/admin/members/${id}`, data);
    return res.data;
  },

  updateMemberStatus: async (id, isActive) => {
    const res = await api.patch(`/admin/members/${id}/status`, { isActive });
    return res.data;
  },

  assignTrainer: async (memberId, trainerId) => {
    const res = await api.patch(`/admin/members/${memberId}/trainer`, { trainerId });
    return res.data;
  },

  assignMembership: async (memberId, membershipPlanId, startDate) => {
    const res = await api.patch(`/admin/members/${memberId}/membership`, {
      membershipPlanId,
      startDate,
    });
    return res.data;
  },

  deleteMember: async (id) => {
    const res = await api.delete(`/admin/members/${id}`);
    return res.data;
  },

  // 3. Trainers
  getTrainers: async (params = {}) => {
    const res = await api.get('/admin/trainers', { params });
    return res.data;
  },

  getTrainerById: async (id) => {
    const res = await api.get(`/admin/trainers/${id}`);
    return res.data;
  },

  createTrainer: async (data) => {
    const res = await api.post('/admin/trainers', data);
    return res.data;
  },

  updateTrainer: async (id, data) => {
    const res = await api.patch(`/admin/trainers/${id}`, data);
    return res.data;
  },

  updateTrainerStatus: async (id, isActive) => {
    const res = await api.patch(`/admin/trainers/${id}/status`, { isActive });
    return res.data;
  },

  // 4. Membership Plans
  getMembershipPlans: async () => {
    const res = await api.get('/admin/membership-plans');
    return res.data;
  },

  getMembershipPlanById: async (id) => {
    const res = await api.get(`/admin/membership-plans/${id}`);
    return res.data;
  },

  createMembershipPlan: async (data) => {
    const res = await api.post('/admin/membership-plans', data);
    return res.data;
  },

  updateMembershipPlan: async (id, data) => {
    const res = await api.patch(`/admin/membership-plans/${id}`, data);
    return res.data;
  },

  updateMembershipPlanStatus: async (id, isActive) => {
    const res = await api.patch(`/admin/membership-plans/${id}/status`, { isActive });
    return res.data;
  },

  // 5. Profile
  getProfile: async () => {
    const res = await api.get('/admin/profile');
    return res.data;
  },

  updateProfile: async (data) => {
    const res = await api.patch('/admin/profile', data);
    return res.data;
  },

  // 6. Trainer Assignments (Post-Membership Onboarding)
  getTrainerAssignments: async (params = {}) => {
    const res = await api.get('/admin/trainer-assignments', { params });
    return res.data;
  },

  assignTrainerToRequest: async (requestId, trainerId, notes = '') => {
    const res = await api.post(`/admin/trainer-assignments/${requestId}/assign`, {
      trainerId,
      notes,
    });
    return res.data;
  },

  rejectTrainerRequest: async (requestId, reason = '') => {
    const res = await api.patch(`/admin/trainer-assignments/${requestId}/reject`, {
      reason,
    });
    return res.data;
  },
};

export default adminService;
