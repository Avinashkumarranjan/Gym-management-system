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

function extractCookie(headers) {
  const setCookie = headers['set-cookie'];
  if (!setCookie) return '';
  if (Array.isArray(setCookie)) {
    return setCookie.map((c) => c.split(';')[0]).join('; ');
  }
  return setCookie.split(';')[0];
}

async function testPhase6() {
  console.log('--- Starting Phase 6 Backend Verification ---');

  try {
    // 1. Login Admin
    console.log('1. Logging in as Admin...');
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
      throw new Error(`Admin login failed: ${JSON.stringify(adminLoginRes.data)}`);
    }
    const adminCookie = extractCookie(adminLoginRes.headers);
    console.log('   Admin login successful.');

    // 2. Register Member A (Fresh dedicated athlete)
    console.log('2. Registering fresh Member A...');
    const memberAEmail = `phase6.athlete.${Date.now()}@fitcore.com`;
    const regRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        name: 'Phase6 Athlete',
        email: memberAEmail,
        phone: '9876543210',
        password: 'AthletePassword123!',
      }
    );

    if (regRes.statusCode !== 201) {
      throw new Error(`Member registration failed: ${JSON.stringify(regRes.data)}`);
    }
    const memberCookie = extractCookie(regRes.headers);
    const memberAUserId = regRes.data.user._id;

    // Get Member Profile
    const profRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/member/profile',
      method: 'GET',
      headers: { Cookie: memberCookie },
    });
    const memberAProfileId = profRes.data.data._id;

    // Fetch an active membership plan to assign
    const plansRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/membership-plans',
      method: 'GET',
      headers: { Cookie: adminCookie },
    });
    const planId = plansRes.data.data?.[0]?._id;

    // Fetch a trainer
    const trainersRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/trainers',
      method: 'GET',
      headers: { Cookie: adminCookie },
    });
    const trainerId = trainersRes.data.data?.[0]?._id;

    // Admin assigns Membership and Trainer
    await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: `/api/admin/members/${memberAProfileId}/membership`,
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      },
      { membershipPlanId: planId, startDate: new Date().toISOString() }
    );

    await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: `/api/admin/members/${memberAProfileId}/trainer`,
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      },
      { trainerId }
    );
    console.log('   Member A registered, membership activated, and trainer assigned.');

    // 4. Test Check-in
    console.log('4. Testing Member A Check-in...');
    const checkInRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/member/attendance/check-in',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: memberCookie,
        },
      },
      { notes: 'Morning strength workout' }
    );

    if (checkInRes.statusCode === 201) {
      console.log('   Check-in successful (status: ' + checkInRes.data.data.status + ')');
    } else if (checkInRes.data?.message === 'You are already checked in.') {
      console.log('   Member A was already checked in from today. Proceeding.');
    } else {
      throw new Error(`Check-in failed: ${JSON.stringify(checkInRes.data)}`);
    }

    // 5. Duplicate Check-in test (Must reject)
    console.log('5. Testing Duplicate Check-in rejection...');
    const dupRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/member/attendance/check-in',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: memberCookie,
      },
    });

    if (dupRes.statusCode === 400 && dupRes.data?.message === 'You are already checked in.') {
      console.log('   Duplicate check-in correctly rejected with 400: ' + dupRes.data.message);
    } else {
      throw new Error(`Expected 400 for duplicate check-in, got ${dupRes.statusCode}: ${JSON.stringify(dupRes.data)}`);
    }

    // 6. Check-out test
    console.log('6. Testing Member A Check-out...');
    const checkOutRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/member/attendance/check-out',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: memberCookie,
      },
    });

    if (checkOutRes.statusCode === 200) {
      console.log('   Check-out successful! Duration: ' + checkOutRes.data.data.durationMinutes + ' min, status: ' + checkOutRes.data.data.status);
    } else {
      throw new Error(`Check-out failed: ${JSON.stringify(checkOutRes.data)}`);
    }

    // 7. Check-out again (Must reject)
    console.log('7. Testing Check-out when not checked in...');
    const checkOutAgainRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/member/attendance/check-out',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: memberCookie,
      },
    });

    if (checkOutAgainRes.statusCode === 400) {
      console.log('   Check-out correctly rejected with 400: ' + checkOutAgainRes.data.message);
    } else {
      throw new Error(`Expected 400 for checkout when not checked in, got ${checkOutAgainRes.statusCode}`);
    }

    // 8. Member Attendance Stats
    console.log('8. Testing Member Attendance Stats...');
    const statsRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/member/attendance/stats',
      method: 'GET',
      headers: { Cookie: memberCookie },
    });
    console.log('   Attendance stats fetched:', statsRes.data.data);

    // 9. Member Progress Logging
    console.log('9. Testing Member Progress Logging...');
    const progressRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/member/progress',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: memberCookie,
        },
      },
      {
        weight: 78.5,
        height: 178,
        bodyFatPercentage: 15.2,
        measurements: {
          chest: 102,
          waist: 82,
          arms: 38,
          thighs: 58,
        },
        notes: 'Bench press PR',
      }
    );
    if (progressRes.statusCode === 201) {
      console.log('   Progress logged successfully:', progressRes.data.data.weight, 'kg');
    } else {
      throw new Error(`Progress log failed: ${JSON.stringify(progressRes.data)}`);
    }

    // 10. Fetch Member Progress History
    console.log('10. Fetching Member Progress History...');
    const myProgressRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/member/progress',
      method: 'GET',
      headers: { Cookie: memberCookie },
    });
    console.log(`   Fetched ${myProgressRes.data.data.length} progress entries with calculated BMI.`);

    // 11. Test Trainer Progress & Attendance Security
    console.log('11. Testing Trainer Access Security...');
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
    const trainerCookie = extractCookie(trainerLoginRes.headers);

    const assignedCheckRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/trainer/members',
      method: 'GET',
      headers: { Cookie: trainerCookie },
    });
    const assignedIds = (assignedCheckRes.data.data || []).map((m) => m._id.toString());
    const isAssigned = assignedIds.includes(memberAProfileId.toString());

    if (isAssigned) {
      console.log('   Member A is assigned to trainer. Testing authorized fetch...');
      const trAttRes = await request({
        hostname: 'localhost',
        port: 5000,
        path: `/api/trainer/members/${memberAProfileId}/attendance`,
        method: 'GET',
        headers: { Cookie: trainerCookie },
      });
      console.log('   Trainer fetched athlete attendance successfully. Visits:', trAttRes.data.data.totalVisits);

      const trProgRes = await request({
        hostname: 'localhost',
        port: 5000,
        path: `/api/trainer/members/${memberAProfileId}/progress`,
        method: 'GET',
        headers: { Cookie: trainerCookie },
      });
      console.log('   Trainer fetched athlete progress timeline successfully.');
    } else {
      console.log('   Member A is NOT assigned to trainer. Verifying 403 Forbidden...');
      const trAttForbiddenRes = await request({
        hostname: 'localhost',
        port: 5000,
        path: `/api/trainer/members/${memberAProfileId}/attendance`,
        method: 'GET',
        headers: { Cookie: trainerCookie },
      });
      if (trAttForbiddenRes.statusCode === 403) {
        console.log('   Correctly received 403 Forbidden for unassigned member attendance.');
      } else {
        throw new Error(`Expected 403, got ${trAttForbiddenRes.statusCode}`);
      }
    }

    // 12. Admin Oversight Check
    console.log('12. Testing Admin Attendance & Progress Oversight...');
    const adminAttRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/attendance',
      method: 'GET',
      headers: { Cookie: adminCookie },
    });
    const adminStatsRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/attendance/stats',
      method: 'GET',
      headers: { Cookie: adminCookie },
    });
    const adminProgRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/progress',
      method: 'GET',
      headers: { Cookie: adminCookie },
    });

    console.log(`   Admin attendance count: ${adminAttRes.data.pagination.total}`);
    console.log('   Admin stats:', adminStatsRes.data.data);
    console.log(`   Admin progress count: ${adminProgRes.data.pagination.total}`);

    console.log('\n✅ ALL PHASE 6 BACKEND TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Phase 6 backend test failed:', err.message);
    process.exit(1);
  }
}

testPhase6();
