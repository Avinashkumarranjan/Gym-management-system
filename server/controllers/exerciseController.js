const Exercise = require('../models/Exercise');

// @desc    Get exercises with search and filters
// @route   GET /api/exercises
// @access  Public / Authenticated
const getExercises = async (req, res, next) => {
  try {
    const { search, muscleGroup, movementPattern, equipment, difficulty, limit = 100 } = req.query;

    const filter = {};

    if (search && search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
        { instructions: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    if (muscleGroup && muscleGroup !== 'All') {
      filter.primaryMuscleGroup = muscleGroup;
    }

    if (movementPattern && movementPattern !== 'All') {
      filter.movementPattern = movementPattern;
    }

    if (equipment && equipment !== 'All') {
      filter.equipment = equipment;
    }

    if (difficulty && difficulty !== 'All') {
      filter.difficulty = difficulty;
    }

    const exercises = await Exercise.find(filter)
      .sort({ name: 1 })
      .limit(parseInt(limit));

    return res.status(200).json({
      success: true,
      data: exercises,
      total: exercises.length,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create custom exercise
// @route   POST /api/exercises
// @access  Private (Trainer/Admin)
const createExercise = async (req, res, next) => {
  try {
    const {
      name,
      description,
      primaryMuscleGroup,
      secondaryMuscleGroups,
      category,
      movementPattern,
      equipment,
      difficulty,
      instructions,
      videoUrl,
      imageUrl,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Exercise name is required' });
    }

    if (!primaryMuscleGroup) {
      return res.status(400).json({ success: false, message: 'Primary muscle group is required' });
    }

    const exercise = await Exercise.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      primaryMuscleGroup,
      secondaryMuscleGroups: Array.isArray(secondaryMuscleGroups) ? secondaryMuscleGroups : [],
      category: category || 'Strength',
      movementPattern: movementPattern || 'Push',
      equipment: equipment || 'Barbell',
      difficulty: difficulty || 'Intermediate',
      instructions: instructions ? instructions.trim() : '',
      videoUrl: videoUrl ? videoUrl.trim() : '',
      imageUrl: imageUrl ? imageUrl.trim() : '',
      isCustom: true,
      createdBy: req.user ? req.user._id : null,
    });

    return res.status(201).json({
      success: true,
      message: 'Custom exercise created successfully',
      data: exercise,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single exercise by ID
// @route   GET /api/exercises/:id
// @access  Public / Authenticated
const getExerciseById = async (req, res, next) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) {
      return res.status(404).json({ success: false, message: 'Exercise not found' });
    }
    return res.status(200).json({
      success: true,
      data: exercise,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getExercises,
  createExercise,
  getExerciseById,
};
