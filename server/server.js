const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const testRoutes = require('./routes/testRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Dynamic CORS configuration allowing production CLIENT_URL and local dev
const allowedOrigins = [
  CLIENT_URL,
  CLIENT_URL.replace(/\/$/, ''),
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes(origin.replace(/\/$/, ''))) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health Check Routes (supports both /api/health and /health)
app.use('/api/health', healthRoutes);
app.use('/health', healthRoutes);

// Auth Routes
app.use('/api/auth', authRoutes);

// Public Contact Inquiry Route (Phase 8 - Rate limited)
const contactRoutes = require('./routes/contactRoutes');
app.use('/api/contact', contactRoutes);

// Notification Routes (Phase 8 - In-App Notifications)
const notificationRoutes = require('./routes/notificationRoutes');
app.use('/api/notifications', notificationRoutes);

// Exercise & Food Item Libraries (Data-driven plan builder)
const exerciseRoutes = require('./routes/exerciseRoutes');
const foodRoutes = require('./routes/foodRoutes');
app.use('/api/exercises', exerciseRoutes);
app.use('/api/foods', foodRoutes);

// Public Membership Plans
const { getPublicPlans } = require('./controllers/paymentController');
app.get('/api/membership-plans', getPublicPlans);

// Available Trainers (Public & Member Coach Matching)
const { getAvailableTrainers } = require('./controllers/trainerAssignmentController');
app.get('/api/trainers/available', getAvailableTrainers);
app.get('/api/trainers', getAvailableTrainers);

// Payment & Webhook Routes
const paymentRoutes = require('./routes/paymentRoutes');
app.use('/api/payments', paymentRoutes);

// Admin Reports Route (Phase 8 - Reports & CSV Exports)
const reportRoutes = require('./routes/reportRoutes');
app.use('/api/admin/reports', reportRoutes);

// Admin Routes (Protected by protect + authorizeRoles('admin'))
const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);

// Member Self-Service Routes (Protected by protect + authorizeRoles('member'))
const memberRoutes = require('./routes/memberRoutes');
app.use('/api/member', memberRoutes);

// Trainer Self-Service Routes (Protected by protect + authorizeRoles('trainer'))
const trainerRoutes = require('./routes/trainerRoutes');
app.use('/api/trainer', trainerRoutes);

// Dev Test Routes (Role verification)
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/test', testRoutes);
}

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'FitCore Gym Management System Backend API is active.',
    healthEndpoint: '/api/health',
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Database & Server Startup
const startServer = async () => {
  try {
    // 1. Connect MongoDB
    await connectDB();

    // 1.1 Seed Exercise & Food libraries if empty
    const { seedLibrariesIfEmpty } = require('./utils/seedLibraries');
    await seedLibrariesIfEmpty();

    // 2. Initialize Phase 8 Scheduled Expiry Tasks (node-cron daily check)
    const { initScheduledTasks } = require('./services/scheduler');
    initScheduledTasks();

    // 3. Start Express Server
    app.listen(PORT, () => {
      console.log(`🚀 FitCore Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });
  } catch (error) {
    console.error('❌ Failed to start server due to database connection error.');
    process.exit(1);
  }
};

startServer();
// FitCore Server Entrypoint
