const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');

dotenv.config({ path: path.join(__dirname, '../.env') });

const seedUsers = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('❌ MONGO_URI is missing from environment variables.');
      process.exit(1);
    }

    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
    console.log('✅ Connected to MongoDB for seeding.');

    const adminEmail = (process.env.SEED_ADMIN_EMAIL || 'admin@fitcore.com').toLowerCase();
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@FitCore2026';

    const trainerEmail = (process.env.SEED_TRAINER_EMAIL || 'trainer@fitcore.com').toLowerCase();
    const trainerPassword = process.env.SEED_TRAINER_PASSWORD || 'Trainer@FitCore2026';

    // Seed Admin
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = await User.create({
        name: 'FitCore Master Admin',
        email: adminEmail,
        phone: '+919999900001',
        password: adminPassword,
        role: 'admin',
        isActive: true,
        emailVerified: true,
      });
      console.log(`✅ Seeded admin account [${adminEmail}]`);
    } else {
      console.log(`ℹ️ Admin account [${adminEmail}] already exists.`);
    }

    // Seed Trainer
    let trainer = await User.findOne({ email: trainerEmail });
    if (!trainer) {
      trainer = await User.create({
        name: 'Rahul Sharma Coach',
        email: trainerEmail,
        phone: '+919999900002',
        password: trainerPassword,
        role: 'trainer',
        isActive: true,
        emailVerified: true,
      });
      console.log(`✅ Seeded trainer account [${trainerEmail}]`);
    } else {
      console.log(`ℹ️ Trainer account [${trainerEmail}] already exists.`);
    }

    console.log('✨ Seeding process completed successfully.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
    process.exit(1);
  }
};

seedUsers();
