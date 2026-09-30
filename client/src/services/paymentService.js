import api from './api';

const paymentService = {
  // Public & Member: Get active membership plans from DB
  getPlans: async () => {
    const res = await api.get('/membership-plans');
    return res.data;
  },

  // Member: Create Razorpay Order
  createOrder: async (membershipPlanId) => {
    const res = await api.post('/member/payments/create-order', {
      membershipPlanId,
    });
    return res.data;
  },

  // Member: Verify Razorpay Payment Signature
  verifyPayment: async (verificationPayload) => {
    const res = await api.post('/member/payments/verify', verificationPayload);
    return res.data;
  },

  // Member: Get own payments history
  getMyPayments: async (params = {}) => {
    const res = await api.get('/member/payments', { params });
    return res.data;
  },

  // Member: Get single payment details
  getPayment: async (paymentId) => {
    const res = await api.get(`/member/payments/${paymentId}`);
    return res.data;
  },

  // Member: Download PDF receipt
  downloadReceipt: async (paymentId, receiptNumber = '') => {
    const res = await api.get(`/member/payments/${paymentId}/receipt`, {
      responseType: 'blob',
    });

    const blob = new Blob([res.data], { type: 'application/pdf' });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `FitCore-Receipt-${receiptNumber || paymentId}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },

  // Admin: Get all payments with filters & pagination
  getAdminPayments: async (params = {}) => {
    const res = await api.get('/admin/payments', { params });
    return res.data;
  },

  // Admin: Get single payment
  getAdminPayment: async (id) => {
    const res = await api.get(`/admin/payments/${id}`);
    return res.data;
  },

  // Admin: Record manual / cash payment
  recordManualPayment: async (payload) => {
    const res = await api.post('/admin/payments/manual', payload);
    return res.data;
  },

  // Admin: Download any member receipt
  downloadAdminReceipt: async (paymentId, receiptNumber = '') => {
    const res = await api.get(`/admin/payments/${paymentId}/receipt`, {
      responseType: 'blob',
    });

    const blob = new Blob([res.data], { type: 'application/pdf' });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `FitCore-Receipt-${receiptNumber || paymentId}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },

  // Admin: Get real revenue analytics
  getRevenueAnalytics: async () => {
    const res = await api.get('/admin/payments/analytics');
    return res.data;
  },
};

export default paymentService;
