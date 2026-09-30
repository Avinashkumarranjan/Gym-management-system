import api from './api';

const workoutService = {
  // Member endpoints
  getMyWorkout: async () => {
    const res = await api.get('/member/workout');
    return res.data;
  },

  getMyWorkoutHistory: async () => {
    const res = await api.get('/member/workouts/history');
    return res.data;
  },

  // Trainer endpoints
  getTrainerMemberWorkouts: async (memberId) => {
    const res = await api.get(`/trainer/members/${memberId}/workouts`);
    return res.data;
  },

  createTrainerWorkout: async (memberId, data) => {
    const res = await api.post(`/trainer/members/${memberId}/workouts`, data);
    return res.data;
  },

  getWorkoutPlanById: async (planId) => {
    const res = await api.get(`/trainer/workouts/${planId}`);
    return res.data;
  },

  updateWorkoutPlan: async (planId, data) => {
    const res = await api.patch(`/trainer/workouts/${planId}`, data);
    return res.data;
  },

  toggleWorkoutPlanStatus: async (planId, isActive) => {
    const res = await api.patch(`/trainer/workouts/${planId}/status`, { isActive });
    return res.data;
  },

  // Admin endpoints
  getAdminWorkouts: async (params = {}) => {
    const res = await api.get('/admin/workouts', { params });
    return res.data;
  },
};

export default workoutService;
