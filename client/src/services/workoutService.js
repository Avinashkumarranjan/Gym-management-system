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

  duplicateMemberCustomWorkout: async () => {
    const res = await api.post('/member/workouts/duplicate-custom');
    return res.data;
  },

  getMyCustomWorkout: async () => {
    const res = await api.get('/member/workouts/custom');
    return res.data;
  },

  createMemberCustomWorkout: async (data) => {
    const res = await api.post('/member/workouts/custom', data);
    return res.data;
  },

  updateMyCustomWorkout: async (id, data) => {
    const res = await api.patch(`/member/workouts/custom/${id}`, data);
    return res.data;
  },

  deleteMyCustomWorkout: async (id) => {
    const res = await api.delete(`/member/workouts/custom/${id}`);
    return res.data;
  },

  logWorkoutCompletion: async (data) => {
    const res = await api.post('/member/workouts/log', data);
    return res.data;
  },

  getWorkoutLogs: async (params = {}) => {
    const res = await api.get('/member/workouts/logs', { params });
    return res.data;
  },

  getExercisePerformanceHistory: async (params = {}) => {
    const res = await api.get('/member/workouts/exercise-history', { params });
    return res.data;
  },

  // Trainer endpoints
  getTrainerMemberWorkouts: async (memberId) => {
    const res = await api.get(`/trainer/members/${memberId}/workouts`);
    return res.data;
  },

  getTrainerMemberWorkoutLogs: async (memberId) => {
    const res = await api.get(`/trainer/members/${memberId}/workout-logs`);
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

  publishWorkoutPlan: async (planId) => {
    const res = await api.post(`/trainer/workouts/${planId}/publish`);
    return res.data;
  },

  duplicateWorkoutPlan: async (planId) => {
    const res = await api.post(`/trainer/workouts/${planId}/duplicate`);
    return res.data;
  },

  archiveWorkoutPlan: async (planId) => {
    const res = await api.patch(`/trainer/workouts/${planId}/archive`);
    return res.data;
  },

  deleteWorkoutPlan: async (planId) => {
    const res = await api.delete(`/trainer/workouts/${planId}`);
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
