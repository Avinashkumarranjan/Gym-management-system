import api from './api';

const foodService = {
  getFoods: async (params = {}) => {
    const res = await api.get('/foods', { params });
    return res.data;
  },

  createFood: async (data) => {
    const res = await api.post('/foods', data);
    return res.data;
  },

  getFoodById: async (id) => {
    const res = await api.get(`/foods/${id}`);
    return res.data;
  },
};

export default foodService;
