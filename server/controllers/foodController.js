const FoodItem = require('../models/FoodItem');

// @desc    Get food items with search and filters
// @route   GET /api/foods
// @access  Public / Authenticated
const getFoods = async (req, res, next) => {
  try {
    const { search, foodGroup, dietCategory, allergen, limit = 100 } = req.query;

    const filter = {};

    if (search && search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    if (foodGroup && foodGroup !== 'All') {
      filter.foodGroup = foodGroup;
    }

    if (dietCategory && dietCategory !== 'All') {
      filter.dietCategories = dietCategory;
    }

    if (allergen && allergen !== 'None') {
      filter.allergens = { $nin: [allergen] };
    }

    const foods = await FoodItem.find(filter)
      .sort({ name: 1 })
      .limit(parseInt(limit));

    return res.status(200).json({
      success: true,
      data: foods,
      total: foods.length,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create custom food item
// @route   POST /api/foods
// @access  Private (Trainer/Admin)
const createFood = async (req, res, next) => {
  try {
    const {
      name,
      foodGroup,
      dietCategories,
      servingUnit,
      servingSize,
      calories,
      protein,
      carbs,
      fat,
      fiber,
      isVegetarian,
      isVegan,
      allergens,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Food item name is required' });
    }

    if (calories === undefined || calories === null) {
      return res.status(400).json({ success: false, message: 'Calories amount is required' });
    }

    const food = await FoodItem.create({
      name: name.trim(),
      foodGroup: foodGroup || 'Other',
      dietCategories: Array.isArray(dietCategories) ? dietCategories : [],
      servingUnit: servingUnit || 'g',
      servingSize: servingSize !== undefined ? Number(servingSize) : 100,
      calories: Number(calories),
      protein: protein !== undefined ? Number(protein) : 0,
      carbs: carbs !== undefined ? Number(carbs) : 0,
      fat: fat !== undefined ? Number(fat) : 0,
      fiber: fiber !== undefined ? Number(fiber) : 0,
      isVegetarian: Boolean(isVegetarian),
      isVegan: Boolean(isVegan),
      allergens: Array.isArray(allergens) ? allergens : [],
      isCustom: true,
      createdBy: req.user ? req.user._id : null,
    });

    return res.status(201).json({
      success: true,
      message: 'Custom food item created successfully',
      data: food,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single food item by ID
// @route   GET /api/foods/:id
// @access  Public / Authenticated
const getFoodById = async (req, res, next) => {
  try {
    const food = await FoodItem.findById(req.params.id);
    if (!food) {
      return res.status(404).json({ success: false, message: 'Food item not found' });
    }
    return res.status(200).json({
      success: true,
      data: food,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFoods,
  createFood,
  getFoodById,
};
