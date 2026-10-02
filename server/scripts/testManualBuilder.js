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

async function runManualBuilderTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING FITCORE MANUAL BUILDER END-TO-END TESTS');
  console.log('====================================================\n');

  // 1. Check Exercise Library
  console.log('[1] Testing Exercise Library API...');
  const exList = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/exercises?muscleGroup=Chest',
    method: 'GET',
  });
  if (exList.statusCode !== 200 || !exList.data.success) {
    throw new Error('Failed to fetch exercises: ' + JSON.stringify(exList.data));
  }
  console.log(`✅ Exercise library returned ${exList.data.data.length} chest exercises.`);

  // 2. Check Food Library
  console.log('\n[2] Testing Food Library API...');
  const foodList = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/foods?foodGroup=Protein',
    method: 'GET',
  });
  if (foodList.statusCode !== 200 || !foodList.data.success) {
    throw new Error('Failed to fetch foods: ' + JSON.stringify(foodList.data));
  }
  console.log(`✅ Food library returned ${foodList.data.data.length} protein items.`);

  // 3. Trainer Login
  console.log('\n[3] Logging in as Trainer...');
  const trainerLogin = await request(
    { hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: 'trainer@fitcore.com', password: 'Trainer@FitCore2026' }
  );
  if (trainerLogin.statusCode !== 200) {
    throw new Error('Trainer login failed: ' + JSON.stringify(trainerLogin.data));
  }
  const trainerCookie = trainerLogin.headers['set-cookie']?.[0]?.split(';')[0];
  const trainerId = trainerLogin.data.user._id;
  console.log('✅ Trainer logged in successfully. Trainer ID:', trainerId);

  // 4. Create custom exercise as Trainer
  console.log('\n[4] Creating custom exercise as Trainer...');
  const customEx = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/exercises',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: trainerCookie },
    },
    {
      name: 'Deficit Bulgarian Split Squat Test',
      primaryMuscleGroup: 'Quadriceps',
      secondaryMuscleGroups: ['Glutes'],
      category: 'Hypertrophy',
      movementPattern: 'Lunge',
      equipment: 'Dumbbell',
      difficulty: 'Advanced',
      instructions: 'Front foot on a 4-inch block for maximum hip flexion stretch.',
    }
  );
  if (customEx.statusCode !== 201 || !customEx.data.success) {
    throw new Error('Failed to create custom exercise: ' + JSON.stringify(customEx.data));
  }
  const customExId = customEx.data.data._id;
  console.log('✅ Custom exercise created:', customEx.data.data.name, 'ID:', customExId);

  // 5. Create custom food item as Trainer
  console.log('\n[5] Creating custom food item as Trainer...');
  const customFood = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/foods',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: trainerCookie },
    },
    {
      name: 'High Protein Chia Seed Pudding',
      foodGroup: 'Protein',
      dietCategories: ['Vegetarian', 'High Protein'],
      servingUnit: 'bowl',
      servingSize: 1,
      calories: 220,
      protein: 18,
      carbs: 22,
      fat: 6,
      fiber: 8,
      isVegetarian: true,
    }
  );
  if (customFood.statusCode !== 201 || !customFood.data.success) {
    throw new Error('Failed to create custom food: ' + JSON.stringify(customFood.data));
  }
  console.log('✅ Custom food item created:', customFood.data.data.name);

  // 6. Register a new member & assign to trainer
  console.log('\n[6] Registering member and assigning to trainer...');
  const memberEmail = `manual.athlete.${Date.now()}@fitcore.com`;
  const regRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { name: 'Avinash Athlete Test', email: memberEmail, phone: '+919876543210', password: 'AthletePassword123' }
  );
  if (regRes.statusCode !== 201) throw new Error('Member registration failed: ' + JSON.stringify(regRes.data));
  const memberCookie = regRes.headers['set-cookie']?.[0]?.split(';')[0];
  const memberUserId = regRes.data.user._id;

  // Admin assigns trainer
  const adminLogin = await request(
    { hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: 'admin@fitcore.com', password: 'Admin@FitCore2026' }
  );
  const adminCookie = adminLogin.headers['set-cookie']?.[0]?.split(';')[0];

  const assignRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/admin/members/${memberUserId}/trainer`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    },
    { trainerId }
  );
  if (assignRes.statusCode !== 200) throw new Error('Trainer assignment failed: ' + JSON.stringify(assignRes.data));
  console.log('✅ Member assigned to Trainer successfully.');

  // 7. Test RBAC: Unassigned Trainer cannot create plan for unassigned athlete
  console.log('\n[7] Testing RBAC Security: Another trainer cannot create plan for this member...');
  // Create or login as second trainer
  const trainer2Email = `trainer2.${Date.now()}@fitcore.com`;
  const t2Reg = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/trainers',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    },
    { name: 'Other Coach', email: trainer2Email, phone: '+919999988888', password: 'TrainerPassword123', specializations: ['Strength'] }
  );
  if (t2Reg.statusCode !== 201) throw new Error('Trainer 2 creation failed: ' + JSON.stringify(t2Reg.data));
  const t2Login = await request(
    { hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: trainer2Email, password: 'TrainerPassword123' }
  );
  const t2Cookie = t2Login.headers['set-cookie']?.[0]?.split(';')[0];

  const unauthorizedPlan = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/trainer/members/${memberUserId}/workouts`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: t2Cookie },
    },
    { title: 'Unauthorized Workout Plan' }
  );
  if (unauthorizedPlan.statusCode === 403) {
    console.log('✅ RBAC check passed: Unauthorized trainer correctly received 403 Forbidden.');
  } else {
    throw new Error('Security flaw: Unauthorized trainer received status ' + unauthorizedPlan.statusCode);
  }

  // 8. Trainer creates a Manual Workout Plan as DRAFT
  console.log('\n[8] Creating Manual Workout Plan as DRAFT...');
  const workoutPayload = {
    title: 'Manual Builder Test Plan Phase 1',
    goal: 'Muscle Building',
    difficulty: 'Intermediate',
    splitType: 'Upper / Lower',
    duration: '8 Weeks',
    description: 'Data-driven upper lower split manually built via UI.',
    coachInstructions: 'Deload on week 4. Focus on deep eccentric stretch.',
    status: 'draft',
    weeklySchedule: [
      {
        day: 'Monday',
        isRestDay: false,
        title: 'Upper Body Heavy',
        focus: 'Chest & Back',
        estimatedDuration: 60,
        exercises: [
          {
            name: 'Barbell Bench Press',
            sets: 4,
            reps: '8-10',
            load: '80 kg',
            restSeconds: 90,
            tempo: '3-0-1',
            rpe: 8,
            notes: 'Controlled descent',
          },
          {
            name: 'Pull-Ups',
            sets: 3,
            reps: '10',
            load: 'Bodyweight',
            restSeconds: 60,
            notes: 'Full lockout at bottom',
          },
        ],
      },
      {
        day: 'Tuesday',
        isRestDay: false,
        title: 'Lower Body Heavy',
        focus: 'Quads & Glutes',
        estimatedDuration: 65,
        exercises: [
          {
            name: 'Barbell Back Squat',
            sets: 4,
            reps: '6-8',
            load: '100 kg',
            restSeconds: 120,
            rpe: 8.5,
            notes: 'Hip crease below knees',
          },
        ],
      },
      {
        day: 'Wednesday',
        isRestDay: true,
        title: 'Rest & Mobility',
        focus: 'Active Recovery',
        estimatedDuration: 20,
        restDayNotes: {
          recoveryNotes: '10k steps and foam rolling',
          stepsTarget: 10000,
          sleepTargetHours: 8.5,
          hydrationLiters: 3.5,
        },
        exercises: [],
      },
    ],
  };

  const draftWorkout = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/trainer/members/${memberUserId}/workouts`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: trainerCookie },
    },
    workoutPayload
  );

  if (draftWorkout.statusCode !== 201 || !draftWorkout.data.success) {
    throw new Error('Failed to create draft workout: ' + JSON.stringify(draftWorkout.data));
  }
  const workoutPlanId = draftWorkout.data.data._id;
  console.log('✅ Draft workout created successfully. ID:', workoutPlanId, 'Status:', draftWorkout.data.data.status);

  // Verify member does NOT see draft plan as active
  const memberActiveBefore = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/member/workout',
    method: 'GET',
    headers: { Cookie: memberCookie },
  });
  if (memberActiveBefore.data.data === null) {
    console.log('✅ Member portal correctly shows null for active plan while in draft.');
  } else {
    throw new Error('Draft was erroneously exposed to member as active!');
  }

  // 9. Publish Workout Plan
  console.log('\n[9] Publishing Workout Plan...');
  const pubWorkout = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/trainer/workouts/${workoutPlanId}/publish`,
    method: 'POST',
    headers: { Cookie: trainerCookie },
  });
  if (pubWorkout.statusCode !== 200 || !pubWorkout.data.success) {
    throw new Error('Failed to publish workout plan: ' + JSON.stringify(pubWorkout.data));
  }
  console.log('✅ Workout plan published successfully.');

  // Verify member now sees published plan with exact manually entered data
  const memberActiveAfter = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/member/workout',
    method: 'GET',
    headers: { Cookie: memberCookie },
  });
  if (memberActiveAfter.data.data?._id === workoutPlanId) {
    console.log('✅ Member successfully retrieved exact published workout plan:', memberActiveAfter.data.data.title);
  } else {
    throw new Error('Member could not fetch newly published workout!');
  }

  // 10. Duplicate Workout Plan
  console.log('\n[10] Testing Workout Plan Duplication...');
  const dupWorkout = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/trainer/workouts/${workoutPlanId}/duplicate`,
    method: 'POST',
    headers: { Cookie: trainerCookie },
  });
  if (dupWorkout.statusCode !== 201 || !dupWorkout.data.success) {
    throw new Error('Failed to duplicate workout: ' + JSON.stringify(dupWorkout.data));
  }
  console.log('✅ Plan duplicated as draft copy:', dupWorkout.data.data.title);

  // 11. Create & Publish Diet Plan
  console.log('\n[11] Creating and publishing Manual Diet Plan...');
  const dietPayload = {
    title: 'Manual Nutrition Strategy Phase 1',
    goal: 'Muscle Gain',
    dietType: 'High Protein',
    duration: '8 Weeks',
    dailyCalories: 2650,
    macros: {
      proteinGrams: 175,
      carbsGrams: 300,
      fatGrams: 65,
    },
    fiber: 32,
    waterLiters: 3.5,
    status: 'draft',
    meals: [
      {
        mealName: 'Breakfast: Power Oats',
        category: 'Breakfast',
        time: '08:00',
        items: [
          { foodName: 'Rolled Oats', quantity: '80 g', amount: 80, unit: 'g', calories: 310, protein: 11, carbs: 53, fat: 5 },
          { foodName: 'Whey Protein Isolate', quantity: '1 scoop', amount: 1, unit: 'scoop', calories: 115, protein: 27, carbs: 1, fat: 0.5 },
        ],
      },
      {
        mealName: 'Lunch: Chicken & Rice',
        category: 'Lunch',
        time: '13:00',
        items: [
          { foodName: 'Chicken Breast', quantity: '180 g', amount: 180, unit: 'g', calories: 216, protein: 47, carbs: 0, fat: 3.6 },
          { foodName: 'Brown Rice', quantity: '150 g', amount: 150, unit: 'g', calories: 185, protein: 4, carbs: 39, fat: 1.5 },
        ],
      },
    ],
  };

  const dietDraft = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/trainer/members/${memberUserId}/diets`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: trainerCookie },
    },
    dietPayload
  );
  if (dietDraft.statusCode !== 201 || !dietDraft.data.success) {
    throw new Error('Failed to create diet draft: ' + JSON.stringify(dietDraft.data));
  }
  const dietPlanId = dietDraft.data.data._id;
  console.log('✅ Diet draft created successfully. ID:', dietPlanId);

  // Publish diet
  const pubDiet = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/trainer/diets/${dietPlanId}/publish`,
    method: 'POST',
    headers: { Cookie: trainerCookie },
  });
  if (pubDiet.statusCode !== 200 || !pubDiet.data.success) {
    throw new Error('Failed to publish diet: ' + JSON.stringify(pubDiet.data));
  }
  console.log('✅ Diet plan published successfully.');

  // 12. Test Member Completion Tracking (WorkoutLog & DietLog)
  console.log('\n[12] Testing Member Completion Tracking without mutating coach plan...');
  const workoutLogRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/member/workouts/log',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: memberCookie },
    },
    {
      workoutPlanId,
      date: '2026-10-02',
      day: 'Monday',
      exerciseLogs: [
        { exerciseName: 'Barbell Bench Press', completed: true, actualSets: 4, actualReps: '10', actualWeight: '82.5 kg', notes: 'Felt strong' },
      ],
      memberNote: 'Hit PR on bench press!',
    }
  );
  if (workoutLogRes.statusCode !== 200 || !workoutLogRes.data.success) {
    throw new Error('Failed to log workout completion: ' + JSON.stringify(workoutLogRes.data));
  }
  console.log('✅ Workout completion logged in WorkoutLog model.');

  // Verify coach WorkoutPlan was NOT modified
  const verifyCoachPlan = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/trainer/workouts/${workoutPlanId}`,
    method: 'GET',
    headers: { Cookie: trainerCookie },
  });
  if (verifyCoachPlan.data.data.weeklySchedule[0].exercises[0].load === '80 kg') {
    console.log('✅ Official Coach Plan remains completely intact (load still 80 kg).');
  } else {
    throw new Error('Integrity failure: Official coach plan was mutated by member log!');
  }

  // 13. Test Member Custom Plan Duplication ("Customize a Copy")
  console.log('\n[13] Testing Member "Customize a Copy" feature...');
  const customPlanRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/member/workouts/duplicate-custom',
    method: 'POST',
    headers: { Cookie: memberCookie },
  });
  if (customPlanRes.statusCode !== 201 || !customPlanRes.data.success) {
    throw new Error('Failed to create custom copy: ' + JSON.stringify(customPlanRes.data));
  }
  console.log('✅ Member custom plan created:', customPlanRes.data.data.title);

  // Member edits their own custom copy
  const customPlanId = customPlanRes.data.data._id;
  const editCustomRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/member/workouts/custom/${customPlanId}`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: memberCookie },
    },
    { title: 'My Custom Personalized Split' }
  );
  if (editCustomRes.statusCode !== 200 || !editCustomRes.data.success) {
    throw new Error('Failed to update custom plan: ' + JSON.stringify(editCustomRes.data));
  }
  console.log('✅ Member customized their own copy successfully.');

  // Verify coach plan is STILL intact
  const verifyCoachPlanAgain = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/trainer/workouts/${workoutPlanId}`,
    method: 'GET',
    headers: { Cookie: trainerCookie },
  });
  if (verifyCoachPlanAgain.data.data.title === 'Manual Builder Test Plan Phase 1') {
    console.log('✅ Verified: Coach plan title untouched ("Manual Builder Test Plan Phase 1").');
  } else {
    throw new Error('Integrity failure: Coach plan title was modified!');
  }

  // 14. History Test: Publishing a second workout archives the first
  console.log('\n[14] Testing History Retention & Auto-Archive...');
  const secondWorkout = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/trainer/members/${memberUserId}/workouts`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: trainerCookie },
    },
    {
      title: 'Manual Builder Test Plan Phase 2 (New Active)',
      status: 'active',
      weeklySchedule: [
        {
          day: 'Monday',
          focus: 'Strength Peak',
          exercises: [{ name: 'Deadlift', sets: 5, reps: '3' }],
        },
      ],
    }
  );
  if (secondWorkout.statusCode !== 201) {
    throw new Error('Failed to create second workout: ' + JSON.stringify(secondWorkout.data));
  }

  // Check history
  const historyRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/member/workouts/history',
    method: 'GET',
    headers: { Cookie: memberCookie },
  });
  if (historyRes.statusCode !== 200 || !historyRes.data.success) {
    throw new Error('Failed to fetch history: ' + JSON.stringify(historyRes.data));
  }
  const oldPlanInHistory = historyRes.data.data.find((p) => p._id === workoutPlanId);
  if (oldPlanInHistory && oldPlanInHistory.isActive === false) {
    console.log(`✅ History verified: Phase 1 plan is archived in member history (status: ${oldPlanInHistory.status || 'archived'}).`);
  } else {
    throw new Error('Old plan not archived in history properly!');
  }

  console.log('\n====================================================');
  console.log('🎉 ALL END-TO-END MANUAL BUILDER TESTS PASSED 100%!');
  console.log('====================================================\n');
}

runManualBuilderTests().catch((err) => {
  console.error('\n❌ TEST RUN FAILED:', err.message);
  process.exit(1);
});
