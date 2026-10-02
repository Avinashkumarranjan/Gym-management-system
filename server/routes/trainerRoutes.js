const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const {
  getTrainerDashboard,
  getTrainerProfile,
  updateTrainerProfile,
  getAssignedMembers,
  getAssignedMemberDetails,
} = require('../controllers/trainerPortalController');

const {
  createTrainerWorkout,
  getTrainerMemberWorkouts,
  getWorkoutPlanById,
  updateWorkoutPlan,
  publishWorkoutPlan,
  duplicateWorkoutPlan,
  archiveWorkoutPlan,
  deleteWorkoutPlan,
  toggleWorkoutPlanStatus,
  getTrainerMemberWorkoutLogs,
} = require('../controllers/workoutController');

const {
  createTrainerDiet,
  getTrainerMemberDiets,
  getDietPlanById,
  updateDietPlan,
  publishDietPlan,
  duplicateDietPlan,
  archiveDietPlan,
  deleteDietPlan,
  toggleDietPlanStatus,
} = require('../controllers/dietController');

const {
  getTrainerSessions,
  cancelTrainerSession,
  updateTrainerSessionNote,
} = require('../controllers/sessionController');

const {
  getTrainerMemberAttendance,
} = require('../controllers/attendanceController');

const {
  getTrainerMemberProgress,
  addTrainerMemberProgress,
} = require('../controllers/progressController');

// All trainer self-service routes require authentication and 'trainer' role
router.use(protect, authorizeRoles('trainer'));

// Core Profile & Dashboard
router.get('/dashboard', getTrainerDashboard);
router.route('/profile')
  .get(getTrainerProfile)
  .patch(updateTrainerProfile);

// Assigned Athletes
router.get('/members', getAssignedMembers);
router.get('/members/:memberId', getAssignedMemberDetails);

// Workout Plans
router.route('/members/:memberId/workouts')
  .get(getTrainerMemberWorkouts)
  .post(createTrainerWorkout);

router.get('/members/:memberId/workout-logs', getTrainerMemberWorkoutLogs);

router.route('/workouts/:planId')
  .get(getWorkoutPlanById)
  .patch(updateWorkoutPlan)
  .delete(deleteWorkoutPlan);

router.post('/workouts/:planId/publish', publishWorkoutPlan);
router.post('/workouts/:planId/duplicate', duplicateWorkoutPlan);
router.patch('/workouts/:planId/archive', archiveWorkoutPlan);
router.patch('/workouts/:planId/status', toggleWorkoutPlanStatus);

// Diet Plans
router.route('/members/:memberId/diets')
  .get(getTrainerMemberDiets)
  .post(createTrainerDiet);

router.route('/diets/:planId')
  .get(getDietPlanById)
  .patch(updateDietPlan)
  .delete(deleteDietPlan);

router.post('/diets/:planId/publish', publishDietPlan);
router.post('/diets/:planId/duplicate', duplicateDietPlan);
router.patch('/diets/:planId/archive', archiveDietPlan);
router.patch('/diets/:planId/status', toggleDietPlanStatus);

// Training Sessions
router.get('/sessions', getTrainerSessions);
router.patch('/sessions/:id/cancel', cancelTrainerSession);
router.patch('/sessions/:id/note', updateTrainerSessionNote);

// Assigned Member Attendance
router.get('/members/:memberId/attendance', getTrainerMemberAttendance);

// Assigned Member Progress
router.route('/members/:memberId/progress')
  .get(getTrainerMemberProgress)
  .post(addTrainerMemberProgress);

module.exports = router;
