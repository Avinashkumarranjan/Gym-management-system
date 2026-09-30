import api from './api';

const attendanceService = {
  // Member check-in
  checkIn: async (notes = '') => {
    const res = await api.post('/member/attendance/check-in', { notes });
    return res.data;
  },

  // Member check-out
  checkOut: async () => {
    const res = await api.post('/member/attendance/check-out');
    return res.data;
  },

  // Member attendance history
  getMyAttendance: async (params = {}) => {
    const res = await api.get('/member/attendance', { params });
    return res.data;
  },

  // Member attendance KPI stats & today's status
  getMyAttendanceStats: async () => {
    const res = await api.get('/member/attendance/stats');
    return res.data;
  },

  // Trainer assigned-member attendance
  getTrainerMemberAttendance: async (memberId) => {
    const res = await api.get(`/trainer/members/${memberId}/attendance`);
    return res.data;
  },

  // Admin global attendance list
  getAdminAttendance: async (params = {}) => {
    const res = await api.get('/admin/attendance', { params });
    return res.data;
  },

  // Admin gym traffic and attendance analytics
  getAdminAttendanceStats: async () => {
    const res = await api.get('/admin/attendance/stats');
    return res.data;
  },
};

export default attendanceService;
