import api from './api';

// Helper to trigger browser download of CSV blob
const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

export const reportService = {
  // Get report summaries & analytics
  getSummary: async (params = {}) => {
    const res = await api.get('/admin/reports/summary', { params });
    return res.data;
  },

  // Export Members CSV
  exportMembers: async () => {
    const res = await api.get('/admin/reports/export/members', { responseType: 'blob' });
    downloadBlob(res.data, `fitcore-members-${new Date().toISOString().split('T')[0]}.csv`);
  },

  // Export Payments CSV
  exportPayments: async (params = {}) => {
    const res = await api.get('/admin/reports/export/payments', { params, responseType: 'blob' });
    downloadBlob(res.data, `fitcore-payments-${new Date().toISOString().split('T')[0]}.csv`);
  },

  // Export Attendance CSV
  exportAttendance: async (params = {}) => {
    const res = await api.get('/admin/reports/export/attendance', { params, responseType: 'blob' });
    downloadBlob(res.data, `fitcore-attendance-${new Date().toISOString().split('T')[0]}.csv`);
  },

  // Export Expiring Members CSV
  exportExpiring: async () => {
    const res = await api.get('/admin/reports/export/expiring', { responseType: 'blob' });
    downloadBlob(res.data, `fitcore-expiring-members-${new Date().toISOString().split('T')[0]}.csv`);
  },
};

export default reportService;
