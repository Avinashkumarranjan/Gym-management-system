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

async function runPhase5Tests() {
  console.log('--- STARTING PHASE 5 BACKEND & SECURITY TESTS ---');

  // 1. Admin Login to setup an assigned member and an unassigned member
  console.log('\n[1] Admin Login...');
  const adminLogin = await request(
    { hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: 'admin@fitcore.com', password: 'Admin@FitCore2026' }
  );
  if (adminLogin.statusCode !== 200) throw new Error('Admin login failed: ' + JSON.stringify(adminLogin.data));
  const adminCookie = adminLogin.headers['set-cookie']?.[0]?.split(';')[0];
  console.log('✅ Admin login succeeded');

  // 2. Trainer Login
  console.log('\n[2] Trainer Login...');
  const trainerLogin = await request(
    { hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: 'trainer@fitcore.com', password: 'Trainer@FitCore2026' }
  );
  if (trainerLogin.statusCode !== 200) throw new Error('Trainer login failed: ' + JSON.stringify(trainerLogin.data));
  const trainerCookie = trainerLogin.headers['set-cookie']?.[0]?.split(';')[0];
  const trainerUserId = trainerLogin.data.user._id;
  console.log('✅ Trainer login succeeded, trainer ID:', trainerUserId);

  // 3. Register Member A (to be assigned to Trainer)
  console.log('\n[3] Registering Member A (Assigned Athlete)...');
  const memberAEmail = `athlete.assigned.${Date.now()}@fitcore.com`;
  const regA = await request(
    { hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { name: 'Assigned Athlete A', email: memberAEmail, phone: '9111122222', password: 'AthletePassword123!' }
  );
  if (regA.statusCode !== 201) throw new Error('Member A registration failed');
  const memberACookie = regA.headers['set-cookie']?.[0]?.split(';')[0];
  const memberAUserId = regA.data.user._id;

  // Get Member A Profile ID
  const profA = await request({ hostname: 'localhost', port: 5000, path: '/api/member/profile', method: 'GET', headers: { Cookie: memberACookie } });
  const memberAProfileId = profA.data.data._id;

  // Admin assigns Trainer to Member A
  const assignRes = await request(
    { hostname: 'localhost', port: 5000, path: `/api/admin/members/${memberAProfileId}/trainer`, method: 'PATCH', headers: { 'Content-Type': 'application/json', Cookie: adminCookie } },
    { trainerId: trainerUserId }
  );
  if (assignRes.statusCode !== 200) throw new Error('Trainer assignment failed');
  console.log('✅ Member A assigned to Trainer');

  // 4. Register Member B (Unassigned Athlete)
  console.log('\n[4] Registering Member B (Unassigned Athlete)...');
  const memberBEmail = `athlete.unassigned.${Date.now()}@fitcore.com`;
  const regB = await request(
    { hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { name: 'Unassigned Athlete B', email: memberBEmail, phone: '9333344444', password: 'AthletePassword123!' }
  );
  const memberBCookie = regB.headers['set-cookie']?.[0]?.split(';')[0];
  const profB = await request({ hostname: 'localhost', port: 5000, path: '/api/member/profile', method: 'GET', headers: { Cookie: memberBCookie } });
  const memberBProfileId = profB.data.data._id;
  console.log('✅ Member B registered (unassigned)');

  // 5. Workout Security & Creation:
  // a) Trainer creates workout for UNASSIGNED Member B -> Must be 403 Forbidden
  console.log('\n[5a] Trainer creating workout for Unassigned Member B (Must be 403 Forbidden)...');
  const unassignedWorkoutRes = await request(
    { hostname: 'localhost', port: 5000, path: `/api/trainer/members/${memberBProfileId}/workouts`, method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: trainerCookie } },
    { title: 'Unauthorized Workout', weeklySchedule: [] }
  );
  if (unassignedWorkoutRes.statusCode === 403) {
    console.log('✅ Trainer correctly blocked with 403 Forbidden from creating workout for unassigned member');
  } else {
    throw new Error(`Expected 403, got ${unassignedWorkoutRes.statusCode}`);
  }

  // b) Trainer creates workout for ASSIGNED Member A -> Must be 201
  console.log('\n[5b] Trainer creating workout for Assigned Member A...');
  const createWorkoutRes1 = await request(
    { hostname: 'localhost', port: 5000, path: `/api/trainer/members/${memberAProfileId}/workouts`, method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: trainerCookie } },
    {
      title: 'Hypertrophy Phase 1',
      goal: 'Muscle Building',
      weeklySchedule: [
        {
          day: 'Monday',
          focus: 'Chest & Triceps',
          exercises: [
            { name: 'Barbell Bench Press', sets: 4, reps: '8-10', restSeconds: 90, notes: 'Full range of motion' },
            { name: 'Incline Dumbbell Press', sets: 3, reps: '10-12', restSeconds: 60 },
          ],
        },
        {
          day: 'Wednesday',
          focus: 'Back & Biceps',
          exercises: [
            { name: 'Deadlift', sets: 4, reps: '6-8', restSeconds: 120 },
            { name: 'Pull-ups', sets: 3, reps: 'AMRAP', restSeconds: 60 },
          ],
        },
      ],
      isActive: true,
    }
  );
  if (createWorkoutRes1.statusCode === 201) {
    console.log('✅ Workout Plan 1 created successfully for Member A');
  } else {
    throw new Error('Create workout plan failed: ' + JSON.stringify(createWorkoutRes1.data));
  }

  // c) Single active plan rule check: create 2nd active plan
  console.log('\n[5c] Single Active Plan Rule Verification...');
  const createWorkoutRes2 = await request(
    { hostname: 'localhost', port: 5000, path: `/api/trainer/members/${memberAProfileId}/workouts`, method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: trainerCookie } },
    {
      title: 'Strength Phase 2',
      goal: 'Strength & Power',
      weeklySchedule: [],
      isActive: true,
    }
  );
  if (createWorkoutRes2.statusCode === 201) {
    // Verify first plan was deactivated
    const memberAWorkouts = await request(
      { hostname: 'localhost', port: 5000, path: `/api/trainer/members/${memberAProfileId}/workouts`, method: 'GET', headers: { Cookie: trainerCookie } }
    );
    const activePlans = memberAWorkouts.data.data.filter((w) => w.isActive);
    if (activePlans.length === 1 && activePlans[0].title === 'Strength Phase 2') {
      console.log('✅ Single active plan rule confirmed: Previous plan automatically set to inactive!');
    } else {
      throw new Error('Active plan rule violation: ' + JSON.stringify(activePlans));
    }
  }

  // 6. Member fetches own workout
  console.log('\n[6] Member A fetching own active workout...');
  const memberWorkoutRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/member/workout', method: 'GET', headers: { Cookie: memberACookie } }
  );
  if (memberWorkoutRes.statusCode === 200 && memberWorkoutRes.data.data?.title === 'Strength Phase 2') {
    console.log('✅ Member successfully fetched own active workout:', memberWorkoutRes.data.data.title);
  } else {
    throw new Error('Member fetch workout failed: ' + JSON.stringify(memberWorkoutRes.data));
  }

  // 7. Diet Security & Creation
  console.log('\n[7a] Trainer creating diet plan for Unassigned Member B (Must be 403 Forbidden)...');
  const unassignedDietRes = await request(
    { hostname: 'localhost', port: 5000, path: `/api/trainer/members/${memberBProfileId}/diets`, method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: trainerCookie } },
    { title: 'Unauthorized Diet', meals: [] }
  );
  if (unassignedDietRes.statusCode === 403) {
    console.log('✅ Trainer correctly blocked with 403 Forbidden from creating diet for unassigned member');
  } else {
    throw new Error(`Expected 403, got ${unassignedDietRes.statusCode}`);
  }

  console.log('\n[7b] Trainer creating diet plan for Assigned Member A...');
  const createDietRes = await request(
    { hostname: 'localhost', port: 5000, path: `/api/trainer/members/${memberAProfileId}/diets`, method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: trainerCookie } },
    {
      title: 'Lean Muscle Macro Protocol',
      goal: 'Muscle Building',
      dailyCalories: 2600,
      macros: { proteinGrams: 180, carbsGrams: 280, fatGrams: 70 },
      waterLiters: 3.5,
      meals: [
        {
          mealName: 'Breakfast',
          time: '08:00 AM',
          items: [
            { food: 'Oatmeal', quantity: '80g' },
            { food: 'Whole Eggs + Whites', quantity: '3 eggs + 2 whites' },
            { food: 'Blueberries', quantity: '50g' },
          ],
        },
        {
          mealName: 'Lunch',
          time: '01:00 PM',
          items: [
            { food: 'Grilled Chicken Breast', quantity: '200g' },
            { food: 'Brown Rice', quantity: '150g cooked' },
            { food: 'Steamed Broccoli', quantity: '100g' },
          ],
        },
      ],
      isActive: true,
    }
  );
  if (createDietRes.statusCode === 201) {
    console.log('✅ Diet plan created successfully for Member A');
  } else {
    throw new Error('Create diet plan failed: ' + JSON.stringify(createDietRes.data));
  }

  // 8. Member fetches own diet plan
  console.log('\n[8] Member A fetching own active diet plan...');
  const memberDietRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/member/diet', method: 'GET', headers: { Cookie: memberACookie } }
  );
  if (memberDietRes.statusCode === 200 && memberDietRes.data.data?.dailyCalories === 2600) {
    console.log('✅ Member successfully fetched own active diet: Calories = 2600, Protein = 180g');
  } else {
    throw new Error('Member fetch diet failed: ' + JSON.stringify(memberDietRes.data));
  }

  // 9. Training Session Scheduling:
  // a) Member B (no assigned trainer) attempts to book -> Must return 400
  console.log('\n[9a] Member B (Unassigned) attempts to book session (Must be 400)...');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const sessionDateStr = tomorrow.toISOString().split('T')[0];

  const unassignedBooking = await request(
    { hostname: 'localhost', port: 5000, path: '/api/member/sessions', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: memberBCookie } },
    { sessionDate: sessionDateStr, startTime: '10:00' }
  );
  if (unassignedBooking.statusCode === 400) {
    console.log('✅ Unassigned member booking rejected with 400: ' + unassignedBooking.data.message);
  } else {
    throw new Error('Expected 400 for unassigned booking, got ' + unassignedBooking.statusCode);
  }

  // b) Member A books session with assigned trainer -> 201
  console.log('\n[9b] Member A books session with assigned trainer...');
  const bookRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/member/sessions', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: memberACookie } },
    { sessionDate: sessionDateStr, startTime: '10:00', memberNote: 'Focus on bench press form' }
  );
  if (bookRes.statusCode === 201) {
    console.log('✅ Session booked successfully! ID:', bookRes.data.data._id);
  } else {
    throw new Error('Session booking failed: ' + JSON.stringify(bookRes.data));
  }
  const sessionId = bookRes.data.data._id;

  // c) Conflict prevention (Double-booking test): Member A attempts same slot
  console.log('\n[9c] Double-booking conflict prevention test...');
  const doubleBookRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/member/sessions', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: memberACookie } },
    { sessionDate: sessionDateStr, startTime: '10:00' }
  );
  if (doubleBookRes.statusCode === 400) {
    console.log('✅ Double-booking correctly rejected with 400: ' + doubleBookRes.data.message);
  } else {
    throw new Error('Expected 400 for double booking, got ' + doubleBookRes.statusCode);
  }

  // d) Cancel session test
  console.log('\n[9d] Cancel Session test...');
  const cancelRes = await request(
    { hostname: 'localhost', port: 5000, path: `/api/member/sessions/${sessionId}/cancel`, method: 'PATCH', headers: { Cookie: memberACookie } }
  );
  if (cancelRes.statusCode === 200 && cancelRes.data.data?.status === 'cancelled') {
    console.log('✅ Session cancelled successfully (status: cancelled)');
  } else {
    throw new Error('Cancel session failed: ' + JSON.stringify(cancelRes.data));
  }

  // 10. Admin Oversight APIs
  console.log('\n[10] Admin Oversight APIs (/api/admin/workouts, /api/admin/diets, /api/admin/sessions)...');
  const adminWorkouts = await request({ hostname: 'localhost', port: 5000, path: '/api/admin/workouts', method: 'GET', headers: { Cookie: adminCookie } });
  const adminDiets = await request({ hostname: 'localhost', port: 5000, path: '/api/admin/diets', method: 'GET', headers: { Cookie: adminCookie } });
  const adminSessions = await request({ hostname: 'localhost', port: 5000, path: '/api/admin/sessions', method: 'GET', headers: { Cookie: adminCookie } });

  if (adminWorkouts.statusCode === 200 && adminDiets.statusCode === 200 && adminSessions.statusCode === 200) {
    console.log(`✅ Admin oversight verified: ${adminWorkouts.data.total} Workouts, ${adminDiets.data.total} Diets, ${adminSessions.data.total} Sessions tracked.`);
  } else {
    throw new Error('Admin oversight APIs failed');
  }

  console.log('\n🎉 ALL PHASE 5 BACKEND & SECURITY TESTS PASSED WITH 100% ACCURACY!');
}

runPhase5Tests().catch((err) => {
  console.error('\n❌ PHASE 5 TEST FAILED:', err.message);
  process.exit(1);
});
