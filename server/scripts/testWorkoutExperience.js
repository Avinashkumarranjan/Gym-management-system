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

async function testWorkoutExperience() {
  console.log('===============================================================');
  console.log('🏋️ FITCORE WORKOUT & TRAINING EXPERIENCE VERIFICATION SUITE');
  console.log('===============================================================\n');

  // 1. Health check
  console.log('[Step 1] Verifying API Server Health...');
  const health = await request({ hostname: 'localhost', port: 5000, path: '/api/health', method: 'GET' });
  if (health.statusCode !== 200 || health.data.database !== 'connected') {
    throw new Error('API server is not healthy: ' + JSON.stringify(health.data));
  }
  console.log('✅ Server is active and connected to MongoDB.');

  // 2. Register/Login Member
  console.log('\n[Step 2] Authenticating Athlete (Member)...');
  const memberEmail = `athlete.workout.${Date.now()}@fitcore.com`;
  const regRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { name: 'Avinash Athlete', email: memberEmail, phone: '9888877777', password: 'Password@123!' }
  );
  if (regRes.statusCode !== 201) throw new Error('Member registration failed: ' + JSON.stringify(regRes.data));
  const memberCookie = regRes.headers['set-cookie']?.[0]?.split(';')[0];
  console.log(`✅ Member registered & logged in: ${memberEmail}`);

  // 3. Login Trainer to prescribe an official coach plan
  console.log('\n[Step 3] Authenticating Coach (Rahul Sharma Coach)...');
  const trainerLogin = await request(
    { hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: 'trainer@fitcore.com', password: 'Trainer@FitCore2026' }
  );
  if (trainerLogin.statusCode !== 200) throw new Error('Trainer login failed: ' + JSON.stringify(trainerLogin.data));
  const trainerCookie = trainerLogin.headers['set-cookie']?.[0]?.split(';')[0];
  const trainerId = trainerLogin.data.data?.user?._id || trainerLogin.data.data?._id;
  console.log('✅ Coach authenticated successfully.');

  // 4. Check exercise library
  console.log('\n[Step 4] Checking Exercise Library API...');
  const exList = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/exercises?limit=10',
    method: 'GET',
    headers: { Cookie: memberCookie },
  });
  if (exList.statusCode !== 200 || !Array.isArray(exList.data.data)) {
    throw new Error('Failed to fetch exercises: ' + JSON.stringify(exList.data));
  }
  console.log(`✅ Exercise library accessible. Found ${exList.data.data.length} sample exercises.`);

  // 5. Member creates a custom exercise (Rule 16)
  console.log('\n[Step 5] Member Creating Custom Exercise...');
  const customExRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/exercises', method: 'POST', headers: { Cookie: memberCookie, 'Content-Type': 'application/json' } },
    {
      name: `Bulgarian Split Squat - ${Date.now()}`,
      primaryMuscleGroup: 'Quadriceps',
      equipment: 'Dumbbell',
      movementPattern: 'Lunge',
      instructions: 'Rear foot elevated on bench, drop back knee towards floor with vertical torso.',
    }
  );
  if (customExRes.statusCode !== 201) throw new Error('Member custom exercise creation failed: ' + JSON.stringify(customExRes.data));
  console.log(`✅ Member custom exercise created: "${customExRes.data.data.name}"`);

  // 6. Member creates Custom Workout Plan From Scratch (Rule 83)
  console.log('\n[Step 6] Testing "Start From Scratch" Custom Plan Creation (Rule 83)...');
  const scratchPlan = {
    title: 'My Strength Program',
    goal: 'Strength',
    splitType: 'Upper / Lower',
    difficulty: 'Intermediate',
    duration: '8 Weeks',
    weeklySchedule: [
      {
        day: 'Monday',
        dayType: 'workout',
        title: 'Upper Power',
        focus: 'Chest & Back',
        estimatedDuration: 60,
        warmupNotes: 'Band pull-aparts and arm swings',
        exercises: [
          { name: 'Barbell Bench Press', sets: 4, reps: '6-8', load: '75 kg', restSeconds: 120, tempo: '3-1-1', rpe: 8, notes: 'Tight arch and leg drive' },
          { name: 'Barbell Bent Over Row', sets: 4, reps: '6-8', load: '65 kg', restSeconds: 90, tempo: '2-0-1', rpe: 8, notes: 'Pull to sternum' },
        ],
      },
      {
        day: 'Tuesday',
        dayType: 'rest',
        title: 'Rest Day',
        focus: 'Recovery',
        isRestDay: true,
        restDayNotes: { recoveryNotes: 'Hydrate well and light walking.', stepsTarget: 8000, sleepTargetHours: 8, hydrationLiters: 3 },
        exercises: [],
      },
      {
        day: 'Wednesday',
        dayType: 'workout',
        title: 'Lower Power',
        focus: 'Quads & Glutes',
        estimatedDuration: 60,
        exercises: [
          { name: 'Barbell Back Squat', sets: 4, reps: '6-8', load: '90 kg', restSeconds: 120, tempo: '3-0-1', rpe: 8, notes: 'Hit depth' },
        ],
      },
      { day: 'Thursday', dayType: 'rest', isRestDay: true, title: 'Rest Day', focus: 'Recovery', exercises: [] },
      { day: 'Friday', dayType: 'workout', title: 'Upper Volume', focus: 'Upper Body', estimatedDuration: 60, exercises: [{ name: 'Overhead Press', sets: 3, reps: '8-10', load: '45 kg', restSeconds: 90, tempo: '2-0-1', rpe: 8 }] },
      { day: 'Saturday', dayType: 'rest', isRestDay: true, title: 'Rest Day', focus: 'Recovery', exercises: [] },
      { day: 'Sunday', dayType: 'rest', isRestDay: true, title: 'Rest Day', focus: 'Recovery', exercises: [] },
    ],
  };

  const createScratchRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/member/workouts/custom', method: 'POST', headers: { Cookie: memberCookie, 'Content-Type': 'application/json' } },
    scratchPlan
  );
  if (createScratchRes.statusCode !== 201 || !createScratchRes.data.data) {
    throw new Error('Start from scratch creation failed: ' + JSON.stringify(createScratchRes.data));
  }
  const customPlanId = createScratchRes.data.data._id;
  console.log(`✅ "Start From Scratch" created successfully. Plan ID: ${customPlanId}, Title: "${createScratchRes.data.data.title}"`);

  // 7. Verify member can fetch their custom plan
  console.log('\n[Step 7] Fetching Member Custom Workout Plan...');
  const getCustomRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/member/workouts/custom',
    method: 'GET',
    headers: { Cookie: memberCookie },
  });
  if (getCustomRes.statusCode !== 200 || !getCustomRes.data.data) {
    throw new Error('Failed to retrieve custom plan: ' + JSON.stringify(getCustomRes.data));
  }
  console.log(`✅ Retrieved custom plan: "${getCustomRes.data.data.title}". Days scheduled: ${getCustomRes.data.data.weeklySchedule?.length}`);

  // 8. Update Custom Plan (Rule 50)
  console.log('\n[Step 8] Updating Member Custom Plan (Rule 50)...');
  const updatedSchedule = [...getCustomRes.data.data.weeklySchedule];
  // Add exercise to Friday
  const fri = updatedSchedule.find((d) => d.day === 'Friday');
  if (fri) {
    fri.exercises.push({
      name: 'Dumbbell Lateral Raise',
      sets: 3,
      reps: '12-15',
      load: '12 kg',
      restSeconds: 60,
      tempo: '2-0-1',
      rpe: 8,
      notes: 'Lead with elbows',
    });
  }
  const updateCustomRes = await request(
    { hostname: 'localhost', port: 5000, path: `/api/member/workouts/custom/${customPlanId}`, method: 'PATCH', headers: { Cookie: memberCookie, 'Content-Type': 'application/json' } },
    { title: 'My Strength Program — Updated', weeklySchedule: updatedSchedule }
  );
  if (updateCustomRes.statusCode !== 200) throw new Error('Update custom plan failed: ' + JSON.stringify(updateCustomRes.data));
  console.log('✅ Custom plan updated. Friday now has:', updateCustomRes.data.data.weeklySchedule.find((d) => d.day === 'Friday')?.exercises?.length, 'exercises.');

  // 9. Performance Logging: Partial Workout Save (Rule 74, 81)
  console.log('\n[Step 9] Testing Partial Workout Save (Rule 74, 81)...');
  const todayStr = new Date().toISOString().split('T')[0];
  const partialLogPayload = {
    workoutPlanId: customPlanId,
    planType: 'custom',
    date: todayStr,
    day: 'Monday',
    workoutTitle: 'Upper Power',
    exerciseLogs: [
      {
        exerciseName: 'Barbell Bench Press',
        completed: true,
        actualSets: 4,
        actualReps: '8',
        actualWeight: '75 kg',
        rpe: 8,
        personalNote: 'Smooth reps with solid bar speed.',
        setLogs: [
          { setNumber: 1, weight: '75 kg', reps: '8', completed: true },
          { setNumber: 2, weight: '75 kg', reps: '8', completed: true },
          { setNumber: 3, weight: '75 kg', reps: '8', completed: true },
          { setNumber: 4, weight: '75 kg', reps: '7', completed: true },
        ],
      },
      {
        exerciseName: 'Barbell Bent Over Row',
        completed: false, // Incomplete on purpose
        actualSets: 0,
        actualReps: '',
        actualWeight: '',
        personalNote: '',
      },
    ],
    memberNote: 'Partial session, felt strong on bench press.',
    energyLevel: 'High',
    difficultyFeeling: 'Moderate',
  };

  const partialSaveRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/member/workouts/log', method: 'POST', headers: { Cookie: memberCookie, 'Content-Type': 'application/json' } },
    partialLogPayload
  );
  if (partialSaveRes.statusCode !== 200 || !partialSaveRes.data.data) {
    throw new Error('Partial workout log save failed: ' + JSON.stringify(partialSaveRes.data));
  }
  console.log('✅ Partial workout saved. Completed count:', partialSaveRes.data.data.completedExercisesCount, 'of', partialSaveRes.data.data.totalExercisesCount);
  console.log('   Total Volume calculated:', partialSaveRes.data.data.totalVolumeKg, 'kg');

  // 10. Resuming and Updating the Same Daily Log (Rule 75, 81: No duplicate logs!)
  console.log('\n[Step 10] Testing Resume & Update Daily Log (No Duplicates - Rule 75, 81)...');
  const fullLogPayload = {
    ...partialLogPayload,
    exerciseLogs: [
      partialLogPayload.exerciseLogs[0],
      {
        exerciseName: 'Barbell Bent Over Row',
        completed: true, // Now completed!
        actualSets: 4,
        actualReps: '8',
        actualWeight: '65 kg',
        rpe: 8,
        personalNote: 'Completed remaining rows.',
        setLogs: [
          { setNumber: 1, weight: '65 kg', reps: '8', completed: true },
          { setNumber: 2, weight: '65 kg', reps: '8', completed: true },
          { setNumber: 3, weight: '65 kg', reps: '8', completed: true },
          { setNumber: 4, weight: '65 kg', reps: '8', completed: true },
        ],
      },
    ],
    memberNote: 'Session fully finished later in the day.',
    durationMinutes: 55,
  };

  const fullSaveRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/member/workouts/log', method: 'POST', headers: { Cookie: memberCookie, 'Content-Type': 'application/json' } },
    fullLogPayload
  );
  if (fullSaveRes.statusCode !== 200) throw new Error('Resuming workout log failed: ' + JSON.stringify(fullSaveRes.data));
  console.log('✅ Resumed & updated same log. isWorkoutCompleted:', fullSaveRes.data.data.isWorkoutCompleted);
  console.log('   Updated total volume:', fullSaveRes.data.data.totalVolumeKg, 'kg');

  // Check logs count for today to verify no duplicate
  const checkLogsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/member/workouts/logs?date=${todayStr}`,
    method: 'GET',
    headers: { Cookie: memberCookie },
  });
  if (checkLogsRes.data.data.length !== 1) {
    throw new Error(`Expected exactly 1 log for today, but found ${checkLogsRes.data.data.length}`);
  }
  console.log('✅ Exactly 1 log exists for today. Upsert verified without duplicate creation!');

  // 11. Exercise Performance History & PR Detection (Rule 35, 40, 41)
  console.log('\n[Step 11] Testing Exercise History & PR Detection (Rules 35, 40, 41)...');
  const prRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/member/workouts/exercise-history?exerciseName=Barbell%20Bench%20Press',
    method: 'GET',
    headers: { Cookie: memberCookie },
  });
  if (prRes.statusCode !== 200 || !prRes.data.data?.['Barbell Bench Press']) {
    throw new Error('Failed to get exercise performance history: ' + JSON.stringify(prRes.data));
  }
  const benchPR = prRes.data.data['Barbell Bench Press'].pr;
  console.log('✅ Bench Press PR detected from real DB logs:');
  console.log(`   Max Weight: ${benchPR.maxWeight} kg, Max Reps: ${benchPR.maxReps}, Est. 1RM: ${benchPR.estimated1RM} kg`);

  // 12. Security Verification (Rule 51, 62, 85)
  console.log('\n[Step 12] Cross-Role & Ownership Security Verification (Rule 51, 62, 85)...');

  // Member trying to PATCH trainer route: /api/trainer/workouts/:id -> MUST BE 403
  const memberPatchCoach = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/trainer/workouts/${customPlanId}`,
    method: 'PATCH',
    headers: { Cookie: memberCookie, 'Content-Type': 'application/json' },
  }, { title: 'Hacked Title' });
  if (memberPatchCoach.statusCode !== 403) {
    throw new Error(`Expected 403 when member calls trainer route, got ${memberPatchCoach.statusCode}`);
  }
  console.log('✅ Member blocked from editing official trainer workout routes (HTTP 403 Forbidden).');

  // Member B cannot access Member A's custom plan or logs
  const memberBEmail = `athlete.b.${Date.now()}@fitcore.com`;
  const regB = await request(
    { hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { name: 'Athlete B', email: memberBEmail, phone: '9777766666', password: 'Password@123!' }
  );
  const memberBCookie = regB.headers['set-cookie']?.[0]?.split(';')[0];

  const bLogs = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/member/workouts/logs',
    method: 'GET',
    headers: { Cookie: memberBCookie },
  });
  if (bLogs.data.data.length !== 0) {
    throw new Error(`Member B saw Member A's logs! Count: ${bLogs.data.data.length}`);
  }
  console.log('✅ Member data isolation verified. Member B sees 0 logs for their own profile.');

  console.log('\n===============================================================');
  console.log('🎉 ALL WORKOUT & TRAINING EXPERIENCE TESTS PASSED 100%!');
  console.log('===============================================================\n');
}

testWorkoutExperience().catch((err) => {
  console.error('\n❌ WORKOUT EXPERIENCE TEST FAILED:', err.message);
  process.exit(1);
});
