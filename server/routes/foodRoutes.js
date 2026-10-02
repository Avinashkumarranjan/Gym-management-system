const express = require('express');
const router = express.Router();
const { getFoods, createFood, getFoodById } = require('../controllers/foodController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Public or authenticated list & detail
router.get('/', getFoods);
router.get('/:id', getFoodById);

// Trainer or Admin create custom food
router.post('/', protect, authorizeRoles('trainer', 'admin'), createFood);

module.exports = router;
