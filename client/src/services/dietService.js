import api from './api';

const dietService = {
  // ── Member: Coach Plan ───────────────────────────────────────────────────
  getMyDiet: async () => {
    const res = await api.get('/member/diet');
    return res.data;
  },

  getMyDietHistory: async () => {
    const res = await api.get('/member/diets/history');
    return res.data;
  },

  // ── Member: Custom Plan ──────────────────────────────────────────────────
  duplicateMemberCustomDiet: async () => {
    const res = await api.post('/member/diets/duplicate-custom');
    return res.data;
  },

  getMyCustomDiet: async () => {
    const res = await api.get('/member/diets/custom');
    return res.data;
  },

  // Create from scratch (POST to /diets/custom)
  createMyCustomDiet: async (data) => {
    const res = await api.post('/member/diets/custom', data);
    return res.data;
  },

  updateMyCustomDiet: async (id, data) => {
    const res = await api.patch(`/member/diets/custom/${id}`, data);
    return res.data;
  },

  // ── Member: Nutrition Log ────────────────────────────────────────────────
  logDietCompletion: async (data) => {
    const res = await api.post('/member/diets/log', data);
    return res.data;
  },

  getDietLogs: async (params = {}) => {
    const res = await api.get('/member/diets/logs', { params });
    return res.data;
  },

  // Daily nutrition adherence history (separate from plan history)
  getNutritionHistory: async (params = {}) => {
    const res = await api.get('/member/diets/nutrition-history', { params });
    return res.data;
  },

  // ── Trainer endpoints ────────────────────────────────────────────────────
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

  publishDietPlan: async (planId) => {
    const res = await api.post(`/trainer/diets/${planId}/publish`);
    return res.data;
  },

  duplicateDietPlan: async (planId) => {
    const res = await api.post(`/trainer/diets/${planId}/duplicate`);
    return res.data;
  },

  archiveDietPlan: async (planId) => {
    const res = await api.patch(`/trainer/diets/${planId}/archive`);
    return res.data;
  },

  deleteDietPlan: async (planId) => {
    const res = await api.delete(`/trainer/diets/${planId}`);
    return res.data;
  },

  toggleDietPlanStatus: async (planId, isActive) => {
    const res = await api.patch(`/trainer/diets/${planId}/status`, { isActive });
    return res.data;
  },

  // ── Admin endpoints ──────────────────────────────────────────────────────
  getAdminDiets: async (params = {}) => {
    const res = await api.get('/admin/diets', { params });
    return res.data;
  },
};

export default dietService;
