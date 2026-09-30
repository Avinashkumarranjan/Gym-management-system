import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import AdminLayout from '../layouts/AdminLayout';
import MemberLayout from '../layouts/MemberLayout';
import TrainerLayout from '../layouts/TrainerLayout';

// Public Pages
import Home from '../pages/Home';
import About from '../pages/About';
import Services from '../pages/Services';
import Membership from '../pages/Membership';
import Trainers from '../pages/Trainers';
import Calculators from '../pages/Calculators';
import Contact from '../pages/Contact';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ForgotPassword from '../pages/ForgotPassword';
import Unauthorized from '../pages/Unauthorized';
import NotFound from '../pages/NotFound';

// Auth Guard
import ProtectedRoute from '../components/common/ProtectedRoute';

// Admin Pages (Phase 3, Phase 5 & Phase 6)
import AdminDashboard from '../pages/admin/AdminDashboard';
import Members from '../pages/admin/Members';
import AddMember from '../pages/admin/AddMember';
import MemberDetails from '../pages/admin/MemberDetails';
import AdminTrainers from '../pages/admin/Trainers';
import AddTrainer from '../pages/admin/AddTrainer';
import TrainerDetails from '../pages/admin/TrainerDetails';
import MembershipPlans from '../pages/admin/MembershipPlans';
import AdminProfile from '../pages/admin/AdminProfile';
import AdminWorkoutPlans from '../pages/admin/AdminWorkoutPlans';
import AdminDietPlans from '../pages/admin/AdminDietPlans';
import AdminSessions from '../pages/admin/AdminSessions';
import AdminAttendance from '../pages/admin/AdminAttendance';
import AdminProgress from '../pages/admin/AdminProgress';
import AdminPayments from '../pages/admin/AdminPayments';
import AdminReports from '../pages/admin/AdminReports';
import AdminContactInquiries from '../pages/admin/AdminContactInquiries';
import AdminTrainerAssignments from '../pages/admin/AdminTrainerAssignments';

// Member Pages (Phase 4, Phase 5 & Phase 6 & Phase 8)
import MemberDashboard from '../pages/member/MemberDashboard';
import MemberProfile from '../pages/member/MemberProfile';
import MyMembership from '../pages/member/MyMembership';
import MyTrainer from '../pages/member/MyTrainer';
import MemberWorkout from '../pages/member/MemberWorkout';
import MemberDiet from '../pages/member/MemberDiet';
import MemberSchedule from '../pages/member/MemberSchedule';
import MemberAttendance from '../pages/member/MemberAttendance';
import MemberProgress from '../pages/member/MemberProgress';
import MemberPayments from '../pages/member/MemberPayments';
import MemberNotifications from '../pages/member/MemberNotifications';

// Trainer Pages (Phase 4 & Phase 5)
import TrainerDashboard from '../pages/trainer/TrainerDashboard';
import TrainerProfile from '../pages/trainer/TrainerProfile';
import AssignedMembers from '../pages/trainer/AssignedMembers';
import AssignedMemberDetails from '../pages/trainer/AssignedMemberDetails';
import TrainerWorkouts from '../pages/trainer/TrainerWorkouts';
import TrainerWorkoutBuilder from '../pages/trainer/TrainerWorkoutBuilder';
import TrainerDiets from '../pages/trainer/TrainerDiets';
import TrainerDietBuilder from '../pages/trainer/TrainerDietBuilder';
import TrainerSchedule from '../pages/trainer/TrainerSchedule';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Admin Portal (Protected, Admin-only) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="members" element={<Members />} />
        <Route path="members/new" element={<AddMember />} />
        <Route path="members/:id" element={<MemberDetails />} />
        <Route path="trainers" element={<AdminTrainers />} />
        <Route path="trainers/new" element={<AddTrainer />} />
        <Route path="trainers/:id" element={<TrainerDetails />} />
        <Route path="trainer-assignments" element={<AdminTrainerAssignments />} />
        <Route path="membership-plans" element={<MembershipPlans />} />
        <Route path="workout-plans" element={<AdminWorkoutPlans />} />
        <Route path="diet-plans" element={<AdminDietPlans />} />
        <Route path="sessions" element={<AdminSessions />} />
        <Route path="attendance" element={<AdminAttendance />} />
        <Route path="progress" element={<AdminProgress />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="contact-inquiries" element={<AdminContactInquiries />} />
        <Route path="profile" element={<AdminProfile />} />
      </Route>

      {/* Member Portal (Protected, Member-only) */}
      <Route
        path="/member"
        element={
          <ProtectedRoute allowedRoles={['member']}>
            <MemberLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/member/dashboard" replace />} />
        <Route path="dashboard" element={<MemberDashboard />} />
        <Route path="profile" element={<MemberProfile />} />
        <Route path="membership" element={<MyMembership />} />
        <Route path="payments" element={<MemberPayments />} />
        <Route path="trainer" element={<MyTrainer />} />
        <Route path="workout" element={<MemberWorkout />} />
        <Route path="diet" element={<MemberDiet />} />
        <Route path="schedule" element={<MemberSchedule />} />
        <Route path="attendance" element={<MemberAttendance />} />
        <Route path="progress" element={<MemberProgress />} />
        <Route path="notifications" element={<MemberNotifications />} />
      </Route>

      {/* Trainer Portal (Protected, Trainer-only) */}
      <Route
        path="/trainer"
        element={
          <ProtectedRoute allowedRoles={['trainer']}>
            <TrainerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/trainer/dashboard" replace />} />
        <Route path="dashboard" element={<TrainerDashboard />} />
        <Route path="profile" element={<TrainerProfile />} />
        <Route path="members" element={<AssignedMembers />} />
        <Route path="members/:memberId" element={<AssignedMemberDetails />} />
        <Route path="workouts" element={<TrainerWorkouts />} />
        <Route path="members/:memberId/workout" element={<TrainerWorkoutBuilder />} />
        <Route path="workouts/:planId/edit" element={<TrainerWorkoutBuilder />} />
        <Route path="diets" element={<TrainerDiets />} />
        <Route path="members/:memberId/diet" element={<TrainerDietBuilder />} />
        <Route path="diets/:planId/edit" element={<TrainerDietBuilder />} />
        <Route path="schedule" element={<TrainerSchedule />} />
      </Route>

      {/* Public Pages */}
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="services" element={<Services />} />
        <Route path="membership" element={<Membership />} />
        <Route path="trainers" element={<Trainers />} />
        <Route path="calculators" element={<Calculators />} />
        <Route path="contact" element={<Contact />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="unauthorized" element={<Unauthorized />} />

        {/* 404 Catch-All */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
