const http = require('http');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(body);
        } catch (e) {
          parsed = body;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsed,
        });
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING PHASE 3 COMPREHENSIVE TESTS ---');

  // 1. Admin Login
  console.log('\n[TEST 1] Admin Login...');
  const adminLoginRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'admin@fitcore.com', password: 'Admin@FitCore2026' }
  );

  if (adminLoginRes.statusCode !== 200) {
    throw new Error('Admin login failed: ' + JSON.stringify(adminLoginRes.data));
  }
  const adminCookie = adminLoginRes.headers['set-cookie']?.[0]?.split(';')[0];
  console.log('✅ Admin login succeeded, role:', adminLoginRes.data.user.role);

  // 2. Member & Trainer RBAC Forbidden Check
  console.log('\n[TEST 2] Security RBAC Check (Trainer accessing /api/admin/members)...');
  const trainerLoginRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'trainer@fitcore.com', password: 'Trainer@FitCore2026' }
  );
  const trainerCookie = trainerLoginRes.headers['set-cookie']?.[0]?.split(';')[0];

  const trainerForbiddenRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/members',
    method: 'GET',
    headers: { Cookie: trainerCookie },
  });

  if (trainerForbiddenRes.statusCode === 403) {
    console.log('✅ Trainer correctly blocked with 403 Forbidden from /api/admin/members');
  } else {
    throw new Error(`Expected 403 for trainer, got ${trainerForbiddenRes.statusCode}`);
  }

  // 3. Admin Dashboard Analytics
  console.log('\n[TEST 3] Fetching Admin Dashboard Stats...');
  const dashRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/dashboard',
    method: 'GET',
    headers: { Cookie: adminCookie },
  });
  if (dashRes.statusCode === 200 && dashRes.data.stats) {
    console.log('✅ Dashboard stats retrieved successfully:');
    console.log('   Total Members:', dashRes.data.stats.totalMembers);
    console.log('   Active Members:', dashRes.data.stats.activeMembers);
    console.log('   Total Trainers:', dashRes.data.stats.totalTrainers);
    console.log('   Active Memberships:', dashRes.data.stats.activeMemberships);
    console.log('   New Members This Month:', dashRes.data.stats.newMembersThisMonth);
  } else {
    throw new Error('Dashboard stats failed: ' + JSON.stringify(dashRes.data));
  }

  // 4. Admin Creating a Coach/Trainer
  const testTrainerEmail = `coach.test.${Date.now()}@fitcore.com`;
  console.log(`\n[TEST 4] Admin Creating Trainer (${testTrainerEmail})...`);
  const createTrainerRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/trainers',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    },
    {
      name: 'Alex Rivera',
      email: testTrainerEmail,
      phone: '9876543210',
      password: 'TrainerPass123!',
      specializations: ['Functional Training', 'Cardio'],
      experienceYears: 5,
      qualifications: 'NASM Certified, CPR',
      bio: 'Dedicated coach helping clients reach peak conditioning.',
      availableDays: ['Monday', 'Tuesday', 'Wednesday'],
      availableTime: '06:00 AM - 02:00 PM',
      salary: 40000,
    }
  );

  if (createTrainerRes.statusCode !== 201) {
    throw new Error('Create trainer failed: ' + JSON.stringify(createTrainerRes.data));
  }
  const createdTrainer = createTrainerRes.data.data;
  console.log('✅ Trainer created with forced role =', createdTrainer.role, 'ID:', createdTrainer._id);

  // 5. Admin Creating a Member
  const testMemberEmail = `member.test.${Date.now()}@fitcore.com`;
  console.log(`\n[TEST 5] Admin Creating Member (${testMemberEmail})...`);
  const createMemberRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/members',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    },
    {
      name: 'Sarah Connor',
      email: testMemberEmail,
      phone: '9123456780',
      password: 'MemberPass123!',
      gender: 'female',
      dateOfBirth: '1995-04-12',
      address: '742 Evergreen Terrace',
      emergencyContact: 'Kyle Reese - 9876543210',
      height: 168,
      weight: 62,
      fitnessGoal: 'strength',
      notes: 'Focusing on compound movements.',
    }
  );

  if (createMemberRes.statusCode !== 201) {
    throw new Error('Create member failed: ' + JSON.stringify(createMemberRes.data));
  }
  const createdMember = createMemberRes.data.data;
  console.log('✅ Member created with forced role =', createdMember.user?.role, 'MemberProfile ID:', createdMember._id);

  // 6. Assign Trainer to Member
  console.log('\n[TEST 6] Assigning Trainer to Member...');
  const assignTrainerRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/admin/members/${createdMember._id}/trainer`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    },
    { trainerId: createdTrainer._id }
  );

  if (assignTrainerRes.statusCode === 200) {
    console.log('✅ Trainer successfully assigned to Member!');
  } else {
    throw new Error('Assign trainer failed: ' + JSON.stringify(assignTrainerRes.data));
  }

  // 7. Membership Plan Creation & Assignment
  console.log('\n[TEST 7] Creating Custom Membership Plan & Assigning to Member...');
  const createPlanRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/membership-plans',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    },
    {
      name: 'Elite Annual Plan ' + Date.now().toString().slice(-4),
      description: 'Full gym and VIP lounge access for 12 months',
      durationMonths: 12,
      price: 14999,
      benefits: ['All Gym Facilities', 'Unlimited Sauna', 'Monthly Assessment'],
      isActive: true,
    }
  );

  if (createPlanRes.statusCode !== 201) {
    throw new Error('Create plan failed: ' + JSON.stringify(createPlanRes.data));
  }
  const createdPlan = createPlanRes.data.data;
  console.log('✅ Membership plan created:', createdPlan.name, 'Duration:', createdPlan.durationMonths, 'months');

  // Assign this plan to the member
  const assignPlanRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/admin/members/${createdMember._id}/membership`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    },
    {
      membershipPlanId: createdPlan._id,
      startDate: new Date().toISOString().split('T')[0],
    }
  );

  if (assignPlanRes.statusCode === 200) {
    const memData = assignPlanRes.data.data;
    console.log('✅ Plan assigned! Start Date:', memData.membershipStartDate, 'End Date:', memData.membershipEndDate, 'Status:', memData.membershipStatus);
  } else {
    throw new Error('Assign plan failed: ' + JSON.stringify(assignPlanRes.data));
  }

  // 8. Search, Filters, and Pagination
  console.log('\n[TEST 8] Member Search and Filter Tests...');
  const searchRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/admin/members?search=Connor&page=1&limit=5`,
    method: 'GET',
    headers: { Cookie: adminCookie },
  });

  if (searchRes.statusCode === 200 && searchRes.data.data.length > 0) {
    console.log(`✅ Member search found ${searchRes.data.data.length} match(es) for 'Connor'`);
  } else {
    throw new Error('Member search failed: ' + JSON.stringify(searchRes.data));
  }

  // 9. Status Toggle (Deactivate / Reactivate)
  console.log('\n[TEST 9] Member Deactivation / Reactivation...');
  const deactRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/admin/members/${createdMember._id}/status`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    },
    { isActive: false }
  );

  if (deactRes.statusCode === 200 && deactRes.data.user?.isActive === false) {
    console.log('✅ Member successfully deactivated (isActive: false)');
  } else {
    throw new Error('Deactivate failed: ' + JSON.stringify(deactRes.data));
  }

  const reactRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/admin/members/${createdMember._id}/status`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    },
    { isActive: true }
  );

  if (reactRes.statusCode === 200 && reactRes.data.user?.isActive === true) {
    console.log('✅ Member successfully reactivated (isActive: true)');
  } else {
    throw new Error('Reactivate failed: ' + JSON.stringify(reactRes.data));
  }

  // 10. Data Validation Tests
  console.log('\n[TEST 10] Validation Tests (Invalid Trainer assignment, Duplicate email)...');
  // Duplicate email check
  const dupRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/members',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    },
    {
      name: 'Duplicate Sarah',
      email: testMemberEmail,
      password: 'Password123!',
    }
  );
  if (dupRes.statusCode === 409 || dupRes.statusCode === 400) {
    console.log(`✅ Duplicate email rejection handled with ${dupRes.statusCode}: ${dupRes.data.message}`);
  } else {
    throw new Error(`Expected 409/400 for duplicate email, got ${dupRes.statusCode}`);
  }

  // Invalid trainer ID check
  const invalidTrainerRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/admin/members/${createdMember._id}/trainer`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    },
    { trainerId: createdMember.user._id } // passing a member ID instead of trainer
  );
  if (invalidTrainerRes.statusCode === 400) {
    console.log(`✅ Assigning non-trainer rejected with 400: ${invalidTrainerRes.data.message}`);
  } else {
    throw new Error(`Expected 400 for assigning non-trainer, got ${invalidTrainerRes.statusCode}`);
  }

  console.log('\n🎉 ALL 10 COMPREHENSIVE PHASE 3 BACKEND & SECURITY TESTS PASSED!');
}

runTests().catch((err) => {
  console.error('\n❌ TEST RUN FAILED:', err.message);
  process.exit(1);
});
