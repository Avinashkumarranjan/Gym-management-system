import api from './api';

const dietService = {
  // Member endpoints
  getMyDiet: async () => {
    const res = await api.get('/member/diet');
    return res.data;
  },

  getMyDietHistory: async () => {
    const res = await api.get('/member/diets/history');
    return res.data;
  },

  // Trainer endpoints
  getTrainerMemberDiets: async (memberId) => {
    const res = await api.get(`/trainer/members/${memberId}/diets`);
    return res.data;
  },

  createTrainerDiet: async (memberId, data) => {
    const res = await api.post(`/trainer/members/${memberId}/diets`, data);
    return res.data;
  },

  getDietPlanById: async (planId) => {
    const res = await api.get(`/trainer/diets/${planId}`);
    return res.data;
  },

  updateDietPlan: async (planId, data) => {
    const res = await api.patch(`/trainer/diets/${planId}`, data);
    return res.data;
  },

  toggleDietPlanStatus: async (planId, isActive) => {
    const res = await api.patch(`/trainer/diets/${planId}/status`, { isActive });
    return res.data;
  },

  // Admin endpoints
  getAdminDiets: async (params = {}) => {
    const res = await api.get('/admin/diets', { params });
    return res.data;
  },
};

export default dietService;
