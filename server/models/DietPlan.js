const mongoose = require('mongoose');

const foodItemSchema = new mongoose.Schema(
  {
    food: {
      type: String,
      required: [true, 'Food item name is required'],
      trim: true,
    },
    quantity: {
      type: String,
      required: [true, 'Quantity/portion is required'],
      trim: true,
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
    time: {
      type: String,
      trim: true,
      default: '',
    },
    items: [foodItemSchema],
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
    },
    trainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Trainer reference is required'],
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
    waterLiters: {
      type: Number,
      min: [0, 'Water intake cannot be negative'],
      default: 3,
    },
    meals: [mealSchema],
    notes: {
      type: String,
      trim: true,
      default: '',
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
dietPlanSchema.index({ trainer: 1, isActive: 1 });

const DietPlan = mongoose.model('DietPlan', dietPlanSchema);

module.exports = DietPlan;
