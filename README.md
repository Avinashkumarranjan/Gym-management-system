# FitCore — Gym Management System

A commercial-grade, modern MERN-stack Gym Management System engineered for athletic performance clubs, coaches, and members.

---

## 📌 Project Overview

FitCore is designed as an end-to-end fitness center platform integrating membership management, coach scheduling, digital workouts, nutrition protocols, athlete analytics, payment billing with Razorpay checkout, automated receipts, in-app notifications, member expiry reminders, and executive CSV reports. The system delivers an aesthetic, high-contrast athletic interface with full Dark/Light mode support, mobile-first responsiveness, and clean component architecture.

**Project Status**: `PRODUCTION-READY DEMO / PORTFOLIO PROJECT`

---

## 🚀 Tech Stack

### Frontend
- **Framework**: React.js (v18) with Vite
- **Routing**: React Router DOM (v7)
- **Styling**: Vanilla Tailwind CSS (v3) + PostCSS + Autoprefixer
- **Charts & Visualizations**: Recharts
- **Icons**: Lucide React
- **API Client**: Axios (configured with `withCredentials: true` and environment-aware `VITE_API_URL`)
- **State & Context**: Context API (`ThemeContext` and `AuthContext`)
- **Typography**: Google Fonts Inter

### Backend
- **Runtime**: Node.js
- **Server Framework**: Express.js
- **Database**: MongoDB Atlas with Mongoose ORM
- **Task Scheduling**: `node-cron` (Daily automated expiry check and status sync)
- **Security & Rate Limiting**:
  - `bcryptjs` for salted password hashing (10 salt rounds)
  - `jsonwebtoken` for stateless access verification
  - `cookie-parser` for secure HTTP-only cookies
  - `express-rate-limit` for public API protection
  - CORS with exact origin matching and credentials enabled
  - Strict Role-Based Access Control (RBAC) middleware
- **Payment Processing**:
  - `razorpay` official Node.js SDK
  - Cryptographic HMAC SHA-256 signature verification
  - Raw body verification for Razorpay Webhooks
- **Document Generation**:
  - `pdfkit` for high-resolution vector PDF receipt streaming

---

## ⚡ Development Phase Status

- **Phase 1 — Public Website**: `COMPLETE`
- **Phase 2 — Authentication & Role Authorization**: `COMPLETE`
- **Phase 3 — Admin Dashboard + Management**: `COMPLETE`
- **Phase 4 — Member + Trainer Portals**: `COMPLETE`
- **Phase 5 — Workout + Diet + Scheduling**: `COMPLETE`
- **Phase 6 — Attendance + Progress Tracking + Fitness Tools**: `COMPLETE`
- **Phase 7 — Payments + Billing + Receipts**: `COMPLETE`
- **Phase 8 — Notifications + Reports + Deployment**: `COMPLETE`

---

## 🔑 User Roles & Permissions

1. **Guest / Public**:
   - Access landing page, about, services, plans, trainers, and fitness calculators
   - Submit public contact inquiries with IP-based rate limiting
   - Register as new athlete (role strictly enforced as `member`)
2. **Member (Athlete)**:
   - View personalized dashboard, workout plans, and macro-tailored diet plans
   - Book and cancel 1-on-1 coaching sessions with conflict prevention
   - Check attendance history and log body weight/measurements
   - Browse plans, checkout via Razorpay Test mode, view billing ledger, and download official PDF receipts
   - In-app notification center for workouts, diets, session updates, payment confirmations, and expiry alerts
3. **Trainer (Coach)**:
   - Manage assigned athlete roster and view athlete profiles
   - Create and assign interactive workout splits and meal plans
   - Manage schedule and accept/cancel 1-on-1 coaching appointments
   - Notification updates when athletes book or cancel sessions
4. **Admin (Club Manager)**:
   - Complete CRUD oversight across members, trainers, plans, workouts, diets, sessions, and attendance
   - Revenue analytics and manual cash/bank payment recording with PDF receipt generator
   - Manage incoming public contact inquiries with lead status and internal admin notes
   - Executive reports dashboard with monthly revenue trends, attendance peaks, and roster statistics
   - Sanitized CSV data exports for members, transactions, attendance, and expiring members

---

## 🔔 Phase 8 Architecture: Notifications & Expiry Reminders

### In-App Notification Engine
- **Model**: `server/models/Notification.js` (`user`, `type`, `title`, `message`, `link`, `isRead`, `metadata`, `createdAt`)
- **Supported Notification Types**:
  - `payment_success`: Dispatched immediately upon verified Razorpay payment or admin manual billing
  - `workout_assigned`: Dispatched when coach creates an active workout program
  - `diet_assigned`: Dispatched when coach assigns a nutrition plan
  - `session_booked`: Dispatched to coach when athlete books a session
  - `session_cancelled`: Dispatched to opposite party upon cancellation
  - `membership_expiry`: Dispatched at 7-day, 3-day, and 1-day milestones
  - `membership_expired`: Dispatched when subscription end date elapses
- **Strict User Ownership**: Users can only access and update their own notifications (`req.user._id`).
- **Notification Bell UI**: Polished dropdown component (`NotificationBell.jsx`) in `MemberTopbar`, `TrainerTopbar`, and `AdminTopbar` with unread badges, instant mark-as-read, and deep links. Dedicated route at `/member/notifications`.

### Membership Expiry Scheduler & Deduplication
- **Scheduler**: `node-cron` lightweight cron scheduled daily at 00:05 (`server/services/scheduler.js`).
- **Deterministic Deduplication**: Uses composite key `reminderKey` (`${userId}_${interval}_${endDate}`) stored in notification metadata. Running the scheduler multiple times will never duplicate alerts.
- **Automatic Status Sync**: Safely transitions `membershipStatus` to `'expired'` once the membership end date passes the current timestamp.

---

## 📊 Phase 8 Architecture: Executive Reports & CSV Exports

### Reports Dashboard (`/admin/reports`)
1. **Membership Health**: Active vs. expired count, 7-day and 30-day renewal forecasts, and distribution breakdown across subscription tiers.
2. **Financial Collections**: Strictly counts `Payment.status = 'paid'`, monthly revenue trends (Recharts area chart), plan breakdown, and payment method distribution.
3. **Attendance & Footfall**: Daily check-ins, monthly total, average daily attendance, peak attendance day of week, and peak training hour.
4. **Member Acquisition**: Month-by-month member registration trends and active vs. inactive user ratios.
5. **Coach Workloads**: Roster count, upcoming training sessions, active workout plans, and active diet plans per coach.

### Secure Sanitized CSV Exports
- **Endpoints**:
  - `GET /api/admin/reports/export/members` -> Members registry CSV
  - `GET /api/admin/reports/export/payments` -> Verified transactions CSV
  - `GET /api/admin/reports/export/attendance` -> Attendance logs CSV
  - `GET /api/admin/reports/export/expiring` -> 30-day expiry forecast CSV
- **Security**: Admin-only. Password hashes, salts, JWT tokens, and internal secrets are strictly stripped. RFC 4180 compliant CSV formatting with quote escaping.

---

## 📬 Phase 8 Architecture: Contact Backend & Inquiries

- **Model**: `server/models/ContactInquiry.js`
- **Public API**: `POST /api/contact`
  - Input validation and trimming
  - Rate limiting via `express-rate-limit` (5 requests per 15 minutes per IP)
- **Admin Management**: `/admin/contact-inquiries`
  - Server-side filtering by status (`new`, `in_progress`, `resolved`), search, and pagination
  - Inquiry detail modal with quick status updates and internal admin notes

---

## 🌐 Production Deployment Guide (Render)

Both frontend and backend are configured for frictionless deployment on Render.

### 1. Backend Web Service Deployment
- **Type**: Web Service
- **Root Directory**: `server`
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- **Health Check Path**: `/api/health`
- **Environment Variables**:
  ```env
  NODE_ENV=production
  PORT=10000
  MONGO_URI=<Your MongoDB Atlas Connection String>
  CLIENT_URL=https://fitcore-frontend.onrender.com
  JWT_SECRET=<Generate 64-char random hex string>
  JWT_EXPIRES_IN=7d
  RAZORPAY_KEY_ID=<Your Razorpay Test Key ID>
  RAZORPAY_KEY_SECRET=<Your Razorpay Test Key Secret>
  RAZORPAY_WEBHOOK_SECRET=<Your Razorpay Webhook Secret>
  ```

### 2. Frontend Static Site Deployment
- **Type**: Static Site
- **Root Directory**: `client`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- **Environment Variables**:
  ```env
  VITE_API_URL=https://fitcore-backend.onrender.com/api
  ```
- **SPA Rewrite Rule** (Critical for direct URL refreshes):
  - **Type**: Rewrite
  - **Source**: `/*`
  - **Destination**: `/index.html`

### 3. Razorpay Webhook Setup
After your backend is live on Render:
1. Log in to your [Razorpay Dashboard](https://dashboard.razorpay.com/) (Test Mode).
2. Navigate to **Settings** -> **Webhooks** -> **Add New Webhook**.
3. Set **Webhook URL** to:
   ```
   https://<YOUR-BACKEND-NAME>.onrender.com/api/payments/razorpay/webhook
   ```
4. Enter the exact same **Secret** configured in your Render backend `RAZORPAY_WEBHOOK_SECRET`.
5. Check active events:
   - `payment.captured`
   - `payment.failed`
   - `order.paid`
6. Click **Save**.

### 4. Cross-Origin Cookie & CORS Configuration
- **CORS**: Dynamically allows the deployed `CLIENT_URL` with `credentials: true`. Wildcard `*` is never used.
- **Cookies**: In production (`NODE_ENV=production`), authentication JWT cookies are served with:
  ```js
  sameSite: 'none',
  secure: true,
  httpOnly: true
  ```
  In local development, they automatically switch to `sameSite: 'lax', secure: false` for seamless localhost operation.

---

## 🛠️ Local Development Setup

### 1. Prerequisites
- Node.js (v18+)
- MongoDB Atlas account or local MongoDB instance
- Razorpay account (Test mode)

### 2. Backend Setup
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your MONGO_URI, JWT_SECRET, and RAZORPAY keys
npm run dev # Or: node server.js
```
Backend will start on `http://localhost:5000`.

### 3. Frontend Setup
```bash
cd client
npm install
npm run dev
```
Client will launch on `http://localhost:5173`.

---

## 🧪 Validation & Test Summary

- **Phase 8 Verification Suite (`server/scripts/testPhase8.js`)**:
  - `POST /api/contact` public submission & rate limit -> `PASS`
  - `GET /api/admin/contact-inquiries` & updates -> `PASS`
  - Membership expiry audit & scheduler trigger -> `PASS`
  - Member notifications fetch & mark-as-read -> `PASS`
  - Executive reports aggregation -> `PASS`
  - Members CSV, Payments CSV, Attendance CSV, Expiring CSV -> `PASS`
- **Notification Deduplication Suite (`server/scripts/testNotificationDelivery.js`)**:
  - Notification delivery -> `PASS`
  - Duplicate reminder suppression -> `PASS (Blocked)`
- **Frontend Production Build**: `vite build` completed in 12s with `0 errors`.
- **SPA Routing**: Configured via `render.yaml` with rewrite `/* -> /index.html`.
