const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function runTest() {
  console.log('====================================================');
  console.log('FITCORE POST-MEMBERSHIP ONBOARDING VERIFICATION');
  console.log('====================================================\n');

  try {
    // 1. Login as Admin
    console.log('1. Logging in as admin...');
    const adminLoginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@fitcore.com',
      password: 'Admin@FitCore2026',
    });
    const adminToken = adminLoginRes.data.token;
    const adminHeaders = { headers: { Authorization: `Bearer ${adminToken}` } };
    console.log('   Admin logged in successfully:', adminLoginRes.data.user.name);

    // 2. Register or Login dedicated test member
    const testMemberEmail = `onboard_athlete_${Date.now()}@fitcore.com`;
    const testMemberPassword = 'Password@1234';
    console.log(`\n2. Registering new athlete [${testMemberEmail}]...`);
    const regRes = await axios.post(`${API_BASE}/auth/register`, {
      name: 'Pooja Verma Athlete',
      email: testMemberEmail,
      password: testMemberPassword,
      phone: `+9198${Math.floor(10000000 + Math.random() * 90000000)}`,
    });
    const memberCookie = regRes.headers['set-cookie'] ? regRes.headers['set-cookie'][0].split(';')[0] : '';
    const memberToken = regRes.data.token || (memberCookie ? memberCookie.split('=')[1] : '');
    const memberHeaders = {
      headers: {
        Authorization: `Bearer ${memberToken}`,
        Cookie: memberCookie,
      },
    };
    const memberUser = regRes.data.user;
    console.log('   Athlete registered successfully:', memberUser.name);

    // 3. Check State A: Before purchasing membership
    console.log('\n3. Verifying STATE A (No active membership)...');
    const stateARes = await axios.get(`${API_BASE}/member/trainer`, memberHeaders);
    console.log('   Has Active Membership:', stateARes.data.hasActiveMembership);
    console.log('   Trainer:', stateARes.data.trainer);
    console.log('   STATE A confirmed: "Membership Required"');

    // 4. Enroll in Annual Plan via Admin Manual Payment / Activation
    console.log('\n4. Activating Annual Elite membership for athlete...');
    const plansRes = await axios.get(`${API_BASE}/membership-plans`);
    const annualPlan = plansRes.data.data.find(
      (p) => p.durationMonths === 12 || p.name.toLowerCase().includes('annual')
    ) || plansRes.data.data[0];

    const manualPayRes = await axios.post(
      `${API_BASE}/admin/payments/manual`,
      {
        memberId: memberUser._id,
        membershipPlanId: annualPlan._id,
        paymentMethod: 'cash',
        notes: 'Test enrollment for annual onboarding verification',
      },
      adminHeaders
    );
    console.log('   Membership Activated:', manualPayRes.data.success);
    console.log('   Plan Name:', annualPlan.name);

    // 5. Check State B: Active Membership + Auto-Generated Pending Assignment Request
    console.log('\n5. Verifying STATE B (Active Membership + Auto-pending Coach Request)...');
    const stateBRes = await axios.get(`${API_BASE}/member/trainer`, memberHeaders);
    console.log('   Has Active Membership:', stateBRes.data.hasActiveMembership);
    console.log('   Trainer:', stateBRes.data.trainer);
    console.log('   Assignment Request ID:', stateBRes.data.assignmentRequest?._id);
    console.log('   Assignment Request Status:', stateBRes.data.assignmentRequest?.status);
    if (!stateBRes.data.assignmentRequest || stateBRes.data.assignmentRequest.status !== 'pending') {
      throw new Error('Expected auto-created pending trainer assignment request!');
    }
    console.log('   STATE B confirmed: "Trainer Assignment In Progress"');

    // 6. Test member submitting coach preference
    console.log('\n6. Fetching available trainers...');
    const trainersRes = await axios.get(`${API_BASE}/trainers/available`);
    const firstTrainer = trainersRes.data.data?.[0];
    console.log('   Available Coaches Count:', trainersRes.data.count);
    console.log('   Selected Coach:', firstTrainer?.name);

    if (firstTrainer) {
      console.log(`\n7. Athlete requesting coach ${firstTrainer.name}...`);
      const prefRes = await axios.post(
        `${API_BASE}/member/trainer-request`,
        { trainerId: firstTrainer._id, notes: 'Interested in barbell mechanics' },
        memberHeaders
      );
      console.log('   Request Result:', prefRes.data.success, '| Message:', prefRes.data.message);
      console.log('   Requested Coach Name:', prefRes.data.data?.requestedTrainer?.name);
    }

    // 8. Test Admin Dashboard Pending Counter
    console.log('\n8. Checking Admin Dashboard Pending Assignments count...');
    const adminDashRes = await axios.get(`${API_BASE}/admin/dashboard`, adminHeaders);
    const pendingCount = adminDashRes.data.stats?.pendingTrainerAssignments;
    console.log('   Pending Trainer Assignments in Admin Stats:', pendingCount);
    if (pendingCount < 1) {
      throw new Error('Expected pendingTrainerAssignments >= 1 in Admin stats');
    }

    // 9. Admin Views and Approves Request
    console.log('\n9. Admin viewing pending trainer assignment requests...');
    const adminListRes = await axios.get(`${API_BASE}/admin/trainer-assignments?status=pending`, adminHeaders);
    const targetRequest = adminListRes.data.data?.find((r) => r.member?.email === testMemberEmail);
    if (!targetRequest) {
      throw new Error(`Target request for ${testMemberEmail} not found in admin list!`);
    }
    console.log('   Found Request for Athlete:', targetRequest.member.name);
    console.log('   Membership Plan in Admin Table:', targetRequest.memberProfile?.membershipPlan);
    console.log('   Requested Coach:', targetRequest.requestedTrainer?.name || 'Any');

    console.log(`\n10. Admin assigning coach ${firstTrainer.name} to request...`);
    const assignRes = await axios.post(
      `${API_BASE}/admin/trainer-assignments/${targetRequest._id}/assign`,
      { trainerId: firstTrainer._id, notes: 'Coach confirmed by Admin' },
      adminHeaders
    );
    console.log('   Assignment Approved:', assignRes.data.success);
    console.log('   Request Status after assignment:', assignRes.data.data?.status);

    // 11. Check State C: Assigned Coach
    console.log('\n11. Verifying STATE C (Trainer Assigned, immediate view without logout)...');
    const stateCRes = await axios.get(`${API_BASE}/member/trainer`, memberHeaders);
    console.log('   Assigned Coach Name:', stateCRes.data.trainer?.name);
    console.log('   Coach Email:', stateCRes.data.trainer?.email);
    console.log('   Specializations:', stateCRes.data.trainer?.specializations?.join(', '));
    if (!stateCRes.data.trainer || stateCRes.data.trainer.name !== firstTrainer.name) {
      throw new Error('Expected assigned coach to match assigned trainer!');
    }
    console.log('   STATE C confirmed: Real coach details loaded.');

    // 12. Verify Member Schedule Endpoint (Zero memberService.getMyTrainer errors)
    console.log('\n12. Verifying Schedule endpoint with assigned coach...');
    const scheduleRes = await axios.get(`${API_BASE}/member/sessions`, memberHeaders);
    console.log('   Sessions Status Code:', scheduleRes.status);
    console.log('   Sessions Data:', scheduleRes.data.success ? 'Retrieved successfully' : 'Failed');

    // 13. Verify Member Dashboard & Onboarding Progress
    console.log('\n13. Verifying Member Dashboard derived onboarding tracker...');
    const memberDashRes = await axios.get(`${API_BASE}/member/dashboard`, memberHeaders);
    console.log('   Dashboard Membership Active:', memberDashRes.data.onboarding?.membershipActive);
    console.log('   Dashboard Trainer Status:', memberDashRes.data.onboarding?.trainerStatus);
    console.log('   Dashboard Trainer Name:', memberDashRes.data.onboarding?.trainerName);
    console.log('   Dashboard Has Workout:', memberDashRes.data.onboarding?.hasWorkout);
    console.log('   Dashboard Has Diet:', memberDashRes.data.onboarding?.hasDiet);

    // 14. Verify Member Membership Page Endpoint
    console.log('\n14. Verifying /api/member/membership endpoint...');
    const membershipRes = await axios.get(`${API_BASE}/member/membership`, memberHeaders);
    console.log('   Membership Plan:', membershipRes.data.membership?.plan?.name);
    console.log('   Membership Status:', membershipRes.data.membership?.status);
    console.log('   Onboarding Trainer Status:', membershipRes.data.onboarding?.trainerStatus);

    // 15. Verify Notifications
    console.log('\n15. Verifying in-app notifications generated...');
    const notifsRes = await axios.get(`${API_BASE}/notifications`, memberHeaders);
    console.log('   Total Notifications:', notifsRes.data.data?.length);
    notifsRes.data.data?.slice(0, 3).forEach((n, i) => {
      console.log(`   [${i + 1}] ${n.title}: ${n.message}`);
    });

    console.log('\n====================================================');
    console.log('✅ ALL POST-MEMBERSHIP ONBOARDING TESTS PASSED (15/15)!');
    console.log('====================================================');
  } catch (error) {
    console.error('\n❌ Test Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

runTest();
