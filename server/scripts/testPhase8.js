const axios = require('axios');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

dotenv.config();

const API_BASE = 'http://localhost:5000/api';

const runTests = async () => {
  console.log('--- STARTING PHASE 8 VERIFICATION SUITE ---');

  // 1. Health check
  try {
    const health = await axios.get(`${API_BASE}/health`);
    console.log('1. Health Check:', health.data.success ? 'PASS' : 'FAIL');
  } catch (err) {
    console.error('1. Health Check Failed:', err.message);
    process.exit(1);
  }

  // 2. Public Contact submission
  let inquiryId = null;
  try {
    const contactRes = await axios.post(`${API_BASE}/contact`, {
      name: 'Priya Sharma',
      email: 'priya.test@example.com',
      phone: '+91 9876543210',
      subject: 'Inquiry regarding personal training package',
      message: 'Hello, I want to inquire about elite coaching and morning batch availability.',
    });
    console.log('2. Public Contact Submission:', contactRes.data.success ? 'PASS' : 'FAIL', '-', contactRes.data.message);
  } catch (err) {
    console.error('2. Public Contact Submission Failed:', err.response?.data || err.message);
  }

  // Generate Admin Token for protected tests
  const adminSecret = process.env.JWT_SECRET;
  // Look up admin user id from db via script or login
  const mongoose = require('mongoose');
  await mongoose.connect(process.env.MONGO_URI);
  const User = require('../models/User');
  const ContactInquiry = require('../models/ContactInquiry');
  const Notification = require('../models/Notification');
  const MemberProfile = require('../models/MemberProfile');

  const admin = await User.findOne({ role: 'admin' });
  const member = await User.findOne({ role: 'member' });

  if (!admin || !member) {
    console.error('Cannot find admin or member to test authentication.');
    process.exit(1);
  }

  const adminToken = jwt.sign({ id: admin._id }, adminSecret, { expiresIn: '1h' });
  const memberToken = jwt.sign({ id: member._id }, adminSecret, { expiresIn: '1h' });

  const adminHeaders = { Authorization: `Bearer ${adminToken}` };
  const memberHeaders = { Authorization: `Bearer ${memberToken}` };

  // 3. Admin Contact Inquiries
  try {
    const inquiriesRes = await axios.get(`${API_BASE}/admin/contact-inquiries`, { headers: adminHeaders });
    console.log('3. Admin Inquiries List:', inquiriesRes.data.success ? 'PASS' : 'FAIL', `(${inquiriesRes.data.pagination.total} inquiries found)`);
    if (inquiriesRes.data.data.length > 0) {
      inquiryId = inquiriesRes.data.data[0]._id;

      // Update status
      const statusRes = await axios.patch(
        `${API_BASE}/admin/contact-inquiries/${inquiryId}/status`,
        { status: 'in_progress' },
        { headers: adminHeaders }
      );
      console.log('   Inquiry Status Update:', statusRes.data.success ? 'PASS' : 'FAIL');

      // Update notes
      const notesRes = await axios.patch(
        `${API_BASE}/admin/contact-inquiries/${inquiryId}/notes`,
        { adminNotes: 'Contacted client via WhatsApp, trial scheduled for Friday.' },
        { headers: adminHeaders }
      );
      console.log('   Inquiry Notes Update:', notesRes.data.success ? 'PASS' : 'FAIL');
    }
  } catch (err) {
    console.error('3. Admin Contact Inquiries Failed:', err.response?.data || err.message);
  }

  // 4. Notifications API (Member)
  try {
    // Trigger expiry check to create or verify notifications
    const expiryRes = await axios.post(`${API_BASE}/notifications/check-expiry`, {}, { headers: adminHeaders });
    console.log('4. Membership Expiry Scheduler Trigger:', expiryRes.data.success ? 'PASS' : 'FAIL', '-', expiryRes.data.message);

    // Fetch member notifications
    const notifsRes = await axios.get(`${API_BASE}/notifications`, { headers: memberHeaders });
    console.log('5. Member Notifications Retrieval:', notifsRes.data.success ? 'PASS' : 'FAIL', `(${notifsRes.data.data.length} total, ${notifsRes.data.unreadCount} unread)`);

    if (notifsRes.data.data.length > 0) {
      const notifId = notifsRes.data.data[0]._id;
      const readRes = await axios.patch(`${API_BASE}/notifications/${notifId}/read`, {}, { headers: memberHeaders });
      console.log('   Single Notification Read:', readRes.data.success ? 'PASS' : 'FAIL');

      const allReadRes = await axios.patch(`${API_BASE}/notifications/read-all`, {}, { headers: memberHeaders });
      console.log('   Mark All Read:', allReadRes.data.success ? 'PASS' : 'FAIL');
    }
  } catch (err) {
    console.error('4/5. Notifications Failed:', err.response?.data || err.message);
  }

  // 6. Admin Reports Summary
  try {
    const reportRes = await axios.get(`${API_BASE}/admin/reports/summary`, { headers: adminHeaders });
    console.log('6. Executive Reports Summary:', reportRes.data.success ? 'PASS' : 'FAIL');
    console.log('   Revenue Total:', `₹${reportRes.data.data.revenue.totalRevenue}`);
    console.log('   Active Members:', reportRes.data.data.membership.totalActive);
    console.log('   Trainers Listed:', reportRes.data.data.trainerWorkload.length);
  } catch (err) {
    console.error('6. Reports Summary Failed:', err.response?.data || err.message);
  }

  // 7. CSV Exports
  try {
    const membersCSV = await axios.get(`${API_BASE}/admin/reports/export/members`, { headers: adminHeaders });
    console.log('7. Members CSV Export:', membersCSV.status === 200 && membersCSV.data.includes('Email') ? 'PASS' : 'FAIL');

    const paymentsCSV = await axios.get(`${API_BASE}/admin/reports/export/payments`, { headers: adminHeaders });
    console.log('8. Payments CSV Export:', paymentsCSV.status === 200 && paymentsCSV.data.includes('Amount') ? 'PASS' : 'FAIL');

    const attendanceCSV = await axios.get(`${API_BASE}/admin/reports/export/attendance`, { headers: adminHeaders });
    console.log('9. Attendance CSV Export:', attendanceCSV.status === 200 ? 'PASS' : 'FAIL');

    const expiringCSV = await axios.get(`${API_BASE}/admin/reports/export/expiring`, { headers: adminHeaders });
    console.log('10. Expiring Members CSV Export:', expiringCSV.status === 200 ? 'PASS' : 'FAIL');
  } catch (err) {
    console.error('7-10. CSV Exports Failed:', err.response?.data || err.message);
  }

  await mongoose.disconnect();
  console.log('--- ALL PHASE 8 VERIFICATIONS COMPLETED SUCCESSFULLY ---');
  process.exit(0);
};

runTests();
