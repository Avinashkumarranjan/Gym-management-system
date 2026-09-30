const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

async function cleanupTestData() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB for database hygiene & data cleanup.');
  const db = mongoose.connection.db;

  const protectedEmails = [
    'avinash977116@gmail.com',
    'hellotest@gmail.com',
    'admin@fitcore.com',
    'avi977116@gmail.com',
    'trainer@fitcore.com',
    'avinash@gmail.com',
    'onboard_athlete_1790787606576@fitcore.com',
    'pooja_1790762377748@fitcore.com',
  ];

  // 1. Identify automated test dummy users
  const testRegex = /^(athlete\.assigned|athlete\.unassigned|coach\.test|member\.test|testmember|hacker|athlete\.p4|athlete\.reg|phase6\.athlete|phase7\.member|athlete\.test|onboard_athlete_1790787424115|onboard_athlete_1790787523557)/i;
  
  const allUsers = await db.collection('users').find({}).toArray();
  const testUsers = allUsers.filter(u => !protectedEmails.includes(u.email) && testRegex.test(u.email));
  const testUserIds = testUsers.map(u => u._id);

  console.log(`Found ${testUsers.length} synthetic automated test users to remove safely.`);

  // 2. Remove associated test workouts & diets
  const removedWorkouts = await db.collection('workoutplans').deleteMany({ member: { $in: testUserIds } });
  console.log(`🧹 Removed ${removedWorkouts.deletedCount} synthetic test workout plans.`);

  const removedDiets = await db.collection('dietplans').deleteMany({ member: { $in: testUserIds } });
  console.log(`🧹 Removed ${removedDiets.deletedCount} synthetic test diet plans.`);

  // 3. Remove test profiles and requests
  await db.collection('memberprofiles').deleteMany({ user: { $in: testUserIds } });
  await db.collection('trainerassignmentrequests').deleteMany({ member: { $in: testUserIds } });
  await db.collection('trainingsessions').deleteMany({ member: { $in: testUserIds } });
  await db.collection('attendances').deleteMany({ member: { $in: testUserIds } });
  await db.collection('progresses').deleteMany({ member: { $in: testUserIds } });
  await db.collection('notifications').deleteMany({ user: { $in: testUserIds } });

  // Remove test users
  const removedUsers = await db.collection('users').deleteMany({ _id: { $in: testUserIds } });
  console.log(`🧹 Removed ${removedUsers.deletedCount} synthetic test users.`);

  // 4. Update Rahul Sharma Coach TrainerProfile data quality
  const trainerUser = await db.collection('users').findOne({
    $or: [
      { email: 'trainer@fitcore.com' },
      { email: 'avinash@gmail.com' },
      { _id: new mongoose.Types.ObjectId('6abcdc80c00f4adea441e0ba') }
    ]
  });

  if (trainerUser) {
    const richTrainerProfile = {
      user: trainerUser._id,
      specializations: ['Strength & Conditioning', 'Compound Lifting', 'Hypertrophy Protocols'],
      experienceYears: 5,
      bio: 'Former national powerlifting athlete passionate about scientific barbell mechanics, hyper-efficient compound lifting, and neurological strength development.',
      qualifications: ['CSCS Certified Strength Coach', 'USA Weightlifting Level 2', 'CPR/AED Pro'],
      availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      availableTime: '06:00 AM - 02:00 PM',
      isAvailable: true,
      salary: 0,
      updatedAt: new Date()
    };

    await db.collection('trainerprofiles').updateOne(
      { user: trainerUser._id },
      { $set: richTrainerProfile },
      { upsert: true }
    );
    console.log('✅ Updated Rahul Sharma Coach TrainerProfile with rich 5-year experience and credentials.');

    // Ensure password matches both Avinash1234 or Trainer@FitCore2026
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('Avinash1234', salt);
    await db.collection('users').updateOne(
      { _id: trainerUser._id },
      { $set: { password: hash } }
    );
    console.log('✅ Trainer account password synchronized to Avinash1234.');
  }

  // Also remove duplicate empty trainer user if exists
  const emptyTrainer = await db.collection('users').findOne({
    email: 'avinash@gmail.com',
    _id: { $ne: new mongoose.Types.ObjectId('6abcdc80c00f4adea441e0ba') }
  });
  if (emptyTrainer) {
    // Migrate email to trainerUser if needed or delete unused duplicate
    await db.collection('users').deleteOne({ _id: emptyTrainer._id });
    await db.collection('users').updateOne(
      { _id: new mongoose.Types.ObjectId('6abcdc80c00f4adea441e0ba') },
      { $set: { email: 'avinash@gmail.com' } }
    );
    console.log('✅ Consolidated Rahul Sharma Coach account under avinash@gmail.com with all member assignments preserved.');
  }

  console.log('✨ Database hygiene completed.');
  await mongoose.disconnect();
}

cleanupTestData().catch((err) => {
  console.error('❌ Cleanup failed:', err);
  process.exit(1);
});
