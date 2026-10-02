const mongoose = require('mongoose');

const foodItemSchema = new mongoose.Schema(
  {
    food: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FoodItem',
      default: null,
    },
    foodName: {
      type: String,
      trim: true,
      default: '',
    },
    // Backwards-compatible field 'food' (some older records may have stored string in 'food')
    quantity: {
      type: String,
      required: [true, 'Quantity/portion is required'],
      trim: true,
    },
    amount: {
      type: Number,
      default: null,
    },
    unit: {
      type: String,
      default: 'g',
    },
    calories: {
      type: Number,
      default: 0,
    },
    protein: {
      type: Number,
      default: 0,
    },
    carbs: {
      type: Number,
      default: 0,
    },
    fat: {
      type: Number,
      default: 0,
    },
    fiber: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: true }
);

const mealSchema = new mongoose.Schema(
  {
    mealName: {
      type: String,
      required: [true, 'Meal title is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: [
        'Breakfast',
        'Morning Snack',
        'Lunch',
        'Pre Workout',
        'Post Workout',
        'Evening Snack',
        'Dinner',
        'Before Bed',
        'Custom Meal',
      ],
      default: 'Breakfast',
    },
    day: {
      type: String,
      default: '', // Used for 7-day plan mode ('Monday', 'Tuesday', etc.)
    },
    time: {
      type: String,
      trim: true,
      default: '',
    },
    caloriesTarget: {
      type: Number,
      default: null,
    },
    items: [foodItemSchema],
    alternatives: [
      {
        name: { type: String, trim: true },
        foods: [foodItemSchema],
      },
    ],
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: true }
);

const dietPlanSchema = new mongoose.Schema(
  {
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Member reference is required'],
      index: true,
    },
    trainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Trainer reference is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Diet plan title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    goal: {
      type: String,
      trim: true,
      default: 'Healthy Nutrition',
    },
    dietType: {
      type: String,
      enum: [
        'Balanced',
        'High Protein',
        'Low Carb',
        'Vegetarian',
        'Vegan',
        'Eggetarian',
        'Keto',
        'Mediterranean',
        'High Carb',
        'Custom',
      ],
      default: 'Balanced',
    },
    planMode: {
      type: String,
      enum: ['daily_standard', 'weekly_7day'],
      default: 'daily_standard',
    },
    duration: {
      type: String,
      trim: true,
      default: '8 Weeks',
    },
    dailyCalories: {
      type: Number,
      min: [0, 'Daily calories cannot be negative'],
      default: 2000,
    },
    macros: {
      proteinGrams: { type: Number, min: 0, default: 150 },
      carbsGrams: { type: Number, min: 0, default: 200 },
      fatGrams: { type: Number, min: 0, default: 60 },
    },
    fiber: {
      type: Number,
      min: 0,
      default: 30,
    },
    waterLiters: {
      type: Number,
      min: [0, 'Water intake cannot be negative'],
      default: 3,
    },
    optionalTargets: {
      sodiumMg: { type: Number, default: null },
      sugarGrams: { type: Number, default: null },
      potassiumMg: { type: Number, default: null },
    },
    restrictions: {
      foodsToAvoid: [{ type: String, trim: true }],
      dietRestrictions: [{ type: String, trim: true }],
      cheatMealGuidance: { type: String, trim: true, default: '' },
      mealPrepNotes: { type: String, trim: true, default: '' },
      supplementNotes: { type: String, trim: true, default: '' },
    },
    meals: [mealSchema],
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    coachNotes: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'archived'],
      default: 'active',
      index: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    archivedAt: {
      type: Date,
      default: null,
    },
    derivedFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DietPlan',
      default: null,
    },
    isMemberCustom: {
      type: Boolean,
      default: false,
      index: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

dietPlanSchema.index({ member: 1, isActive: 1 });
dietPlanSchema.index({ member: 1, status: 1 });
dietPlanSchema.index({ trainer: 1, isActive: 1 });
dietPlanSchema.index({ member: 1, isMemberCustom: 1 });

const DietPlan = mongoose.model('DietPlan', dietPlanSchema);

module.exports = DietPlan;
