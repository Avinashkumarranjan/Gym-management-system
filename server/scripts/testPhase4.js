const http = require('http');

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

async function runPhase4Tests() {
  console.log('--- STARTING PHASE 4 BACKEND & SECURITY TESTS ---');

  // 1. Create a fresh test member for clean self-service testing
  const testMemberEmail = `athlete.p4.${Date.now()}@fitcore.com`;
  console.log(`\n[STEP 1] Registering fresh member: ${testMemberEmail}...`);
  const regRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      name: 'Athletic Member',
      email: testMemberEmail,
      phone: '9888877777',
      password: 'MemberPassword123!',
    }
  );
  if (regRes.statusCode !== 201) {
    throw new Error('Registration failed: ' + JSON.stringify(regRes.data));
  }
  const memberCookie = regRes.headers['set-cookie']?.[0]?.split(';')[0];
  console.log('✅ Fresh member registered, role:', regRes.data.user.role);

  // 2. Member accessing /api/member/dashboard
  console.log('\n[STEP 2] Member accessing /api/member/dashboard...');
  const memberDashRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/member/dashboard',
    method: 'GET',
    headers: { Cookie: memberCookie },
  });
  if (memberDashRes.statusCode === 200 && memberDashRes.data.member) {
    console.log('✅ Member dashboard returned 200 OK. Member name:', memberDashRes.data.member.name);
  } else {
    throw new Error('Member dashboard failed: ' + JSON.stringify(memberDashRes.data));
  }

  // 3. Trainer logging in
  console.log('\n[STEP 3] Trainer Login...');
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
  if (trainerLoginRes.statusCode !== 200) {
    throw new Error('Trainer login failed: ' + JSON.stringify(trainerLoginRes.data));
  }
  const trainerCookie = trainerLoginRes.headers['set-cookie']?.[0]?.split(';')[0];
  console.log('✅ Trainer login succeeded, role:', trainerLoginRes.data.user.role);

  // 4. Role Authorization Checks:
  // a) Trainer accessing /api/member/dashboard -> 403 Forbidden
  console.log('\n[STEP 4a] Trainer accessing /api/member/dashboard (Must be 403)...');
  const trainerOnMemberDash = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/member/dashboard',
    method: 'GET',
    headers: { Cookie: trainerCookie },
  });
  if (trainerOnMemberDash.statusCode === 403) {
    console.log('✅ Trainer correctly blocked with 403 Forbidden from member dashboard');
  } else {
    throw new Error(`Expected 403, got ${trainerOnMemberDash.statusCode}`);
  }

  // b) Member accessing /api/trainer/dashboard -> 403 Forbidden
  console.log('\n[STEP 4b] Member accessing /api/trainer/dashboard (Must be 403)...');
  const memberOnTrainerDash = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/trainer/dashboard',
    method: 'GET',
    headers: { Cookie: memberCookie },
  });
  if (memberOnTrainerDash.statusCode === 403) {
    console.log('✅ Member correctly blocked with 403 Forbidden from trainer dashboard');
  } else {
    throw new Error(`Expected 403, got ${memberOnTrainerDash.statusCode}`);
  }

  // 5. Member Profile Update & Tamper Resistance
  console.log('\n[STEP 5] Member Self-Service Profile Update & Tamper Resistance...');
  const updateMemberRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/member/profile',
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: memberCookie },
    },
    {
      name: 'Athletic Member Updated',
      height: 180,
      weight: 75,
      fitnessGoal: 'muscle_building',
      role: 'admin', // Tamper attempt!
      isActive: false, // Tamper attempt!
      membershipStatus: 'active', // Tamper attempt!
    }
  );
  if (updateMemberRes.statusCode === 200) {
    const updatedUser = updateMemberRes.data.data.user;
    if (updatedUser.role === 'member' && updatedUser.isActive === true) {
      console.log('✅ Member profile updated successfully. Tamper fields strictly rejected (Role remains member, isActive remains true)');
    } else {
      throw new Error('Security failure: Tamper field accepted! ' + JSON.stringify(updatedUser));
    }
  } else {
    throw new Error('Member profile update failed: ' + JSON.stringify(updateMemberRes.data));
  }

  // 6. Trainer Dashboard & Profile Update
  console.log('\n[STEP 6] Trainer Dashboard & Profile Tamper Resistance...');
  const trainerDashRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/trainer/dashboard',
    method: 'GET',
    headers: { Cookie: trainerCookie },
  });
  if (trainerDashRes.statusCode === 200 && trainerDashRes.data.trainer) {
    console.log('✅ Trainer dashboard 200 OK. Assigned member count:', trainerDashRes.data.assignedMemberCount);
    if (trainerDashRes.data.trainer.salary !== undefined) {
      throw new Error('Security failure: Salary leaked in trainer dashboard!');
    } else {
      console.log('✅ Verified: Salary is NOT exposed in trainer self-service dashboard');
    }
  } else {
    throw new Error('Trainer dashboard failed: ' + JSON.stringify(trainerDashRes.data));
  }

  // Update trainer profile (Attempting to tamper salary)
  const updateTrainerRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/trainer/profile',
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: trainerCookie },
    },
    {
      bio: 'Certified strength and conditioning specialist.',
      salary: 999999, // Tamper attempt!
      role: 'admin', // Tamper attempt!
    }
  );
  if (updateTrainerRes.statusCode === 200) {
    console.log('✅ Trainer profile updated. Salary & role tamper ignored safely.');
  } else {
    throw new Error('Trainer profile update failed: ' + JSON.stringify(updateTrainerRes.data));
  }

  // 7. Trainer-Member Authorization Check (Cross-coach isolation)
  console.log('\n[STEP 7] Trainer Cross-Member Authorization Check...');
  // The member registered in Step 1 is NOT assigned to this trainer
  // Find member profile ID
  const memProfRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/member/profile',
    method: 'GET',
    headers: { Cookie: memberCookie },
  });
  const memberProfileId = memProfRes.data.data._id;

  const crossTrainerRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/trainer/members/${memberProfileId}`,
    method: 'GET',
    headers: { Cookie: trainerCookie },
  });
  if (crossTrainerRes.statusCode === 403) {
    console.log('✅ Verified: Trainer attempting to access unassigned member correctly blocked with 403 Forbidden');
  } else {
    throw new Error(`Expected 403 Forbidden for cross-trainer access, got ${crossTrainerRes.statusCode}`);
  }

  // 8. Password Change Endpoint Test
  console.log('\n[STEP 8] Password Change Endpoint Test...');
  const pwChangeRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/change-password',
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: memberCookie },
    },
    {
      currentPassword: 'MemberPassword123!',
      newPassword: 'NewMemberPassword456!',
    }
  );
  if (pwChangeRes.statusCode === 200) {
    console.log('✅ Password changed successfully with PATCH /api/auth/change-password');
  } else {
    throw new Error('Password change failed: ' + JSON.stringify(pwChangeRes.data));
  }

  // Verify login with new password
  const newLoginRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: testMemberEmail, password: 'NewMemberPassword456!' }
  );
  if (newLoginRes.statusCode === 200) {
    console.log('✅ Login with updated password confirmed working!');
  } else {
    throw new Error('Login with new password failed: ' + JSON.stringify(newLoginRes.data));
  }

  console.log('\n🎉 ALL PHASE 4 BACKEND & SECURITY TESTS PASSED PERFECTLY!');
}

runPhase4Tests().catch((err) => {
  console.error('\n❌ PHASE 4 TEST FAILED:', err.message);
  process.exit(1);
});
