const express = require('express');
const router = express.Router();
const { getExercises, createExercise, getExerciseById } = require('../controllers/exerciseController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Public or authenticated list & detail
router.get('/', getExercises);
router.get('/:id', getExerciseById);

// Trainer, Admin, or Member create custom exercise
router.post('/', protect, authorizeRoles('member', 'trainer', 'admin'), createExercise);

module.exports = router;
