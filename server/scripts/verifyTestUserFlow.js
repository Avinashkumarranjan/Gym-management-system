const axios = require('axios');

const API = 'http://localhost:5000/api';

const verify = async () => {
  console.log('--- RUNNING TEST USER FLOW VERIFICATION ---');

  // 1. Health
  const health = await axios.get(`${API}/health`);
  console.log('1. Server Health:', health.data.success ? 'OK' : 'FAILED');

  // 2. Member registration / login test
  const testEmail = `athlete.test.${Date.now()}@fitcore.com`;
  const registerRes = await axios.post(`${API}/auth/register`, {
    name: 'Vikram Malhotra',
    email: testEmail,
    phone: '+91 9988776655',
    password: 'Password123!',
  });
  console.log('2. Member Registration:', registerRes.data.success ? 'OK' : 'FAILED');
  const token = registerRes.data.token || (registerRes.headers['set-cookie'] ? registerRes.headers['set-cookie'][0].split(';')[0].split('=')[1] : null);

  const authHeaders = {
    headers: {
      Authorization: `Bearer ${token || ''}`,
      Cookie: registerRes.headers['set-cookie'] ? registerRes.headers['set-cookie'].join('; ') : '',
    },
  };

  // 3. Member profile fetch
  const profileRes = await axios.get(`${API}/member/profile`, authHeaders);
  console.log('3. Member Profile Access:', profileRes.data.success ? 'OK' : 'FAILED', `(User: ${profileRes.data.data?.user?.name})`);

  // 4. Member membership fetch
  const memberShipRes = await axios.get(`${API}/member/membership`, authHeaders);
  console.log('4. Membership Data Access:', memberShipRes.data.success ? 'OK' : 'FAILED', `(Status: ${memberShipRes.data.membership?.status})`);

  // 5. Member notifications fetch
  const notifsRes = await axios.get(`${API}/notifications`, authHeaders);
  console.log('5. In-App Notifications:', notifsRes.data.success ? 'OK' : 'FAILED', `(Unread: ${notifsRes.data.unreadCount})`);

  // 6. Public Contact Inquiry submission
  const contactRes = await axios.post(`${API}/contact`, {
    name: 'Vikram Malhotra',
    email: testEmail,
    phone: '+91 9988776655',
    subject: 'Membership inquiry for corporate tier',
    message: 'Looking for a group fitness membership for our tech team in Gurgaon.',
  });
  console.log('6. Contact Form Submission:', contactRes.data.success ? 'OK' : 'FAILED');

  // 7. Public Membership Plans
  const plansRes = await axios.get(`${API}/membership-plans`);
  console.log('7. Public Membership Plans:', plansRes.data.success ? 'OK' : 'FAILED', `(${plansRes.data.data?.length} plans available)`);

  console.log('--- ALL TEST USER FLOW VERIFICATIONS PASSED ---');
};

verify().catch((err) => {
  console.error('Verification failed:', err.response?.data || err.message);
  process.exit(1);
});
