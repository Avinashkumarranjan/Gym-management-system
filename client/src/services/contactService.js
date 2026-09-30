import api from './api';

export const contactService = {
  // Public contact submission
  submitContact: async (data) => {
    const res = await api.post('/contact', data);
    return res.data;
  },

  // Admin Inquiries list
  getInquiries: async (params = {}) => {
    const res = await api.get('/admin/contact-inquiries', { params });
    return res.data;
  },

  // Admin Inquiry by ID
  getInquiryById: async (id) => {
    const res = await api.get(`/admin/contact-inquiries/${id}`);
    return res.data;
  },

  // Update Status
  updateStatus: async (id, status) => {
    const res = await api.patch(`/admin/contact-inquiries/${id}/status`, { status });
    return res.data;
  },

  // Update Notes
  updateNotes: async (id, adminNotes) => {
    const res = await api.patch(`/admin/contact-inquiries/${id}/notes`, { adminNotes });
    return res.data;
  },
};

export default contactService;
