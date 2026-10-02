import api from './api';

const exerciseService = {
  getExercises: async (params = {}) => {
    const res = await api.get('/exercises', { params });
    return res.data;
  },

  createExercise: async (data) => {
    const res = await api.post('/exercises', data);
    return res.data;
  },

  getExerciseById: async (id) => {
    const res = await api.get(`/exercises/${id}`);
    return res.data;
  },
};

export default exerciseService;
