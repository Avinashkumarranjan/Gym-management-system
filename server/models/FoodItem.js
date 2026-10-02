const mongoose = require('mongoose');

const foodItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Food item name is required'],
      trim: true,
      index: true,
    },
    foodGroup: {
      type: String,
      required: [true, 'Food group is required'],
      enum: [
        'Protein',
        'Carbohydrates',
        'Healthy Fats',
        'Vegetables',
        'Fruits',
        'Dairy',
        'Grains',
        'Legumes',
        'Nuts & Seeds',
        'Supplements',
        'Beverages',
        'Other',
      ],
      index: true,
    },
    dietCategories: [
      {
        type: String,
        trim: true,
      },
    ],
    servingUnit: {
      type: String,
      required: [true, 'Serving unit is required'],
      default: 'g',
    },
    servingSize: {
      type: Number,
      default: 100,
      min: [0, 'Serving size cannot be negative'],
    },
    calories: {
      type: Number,
      required: [true, 'Calories count is required'],
      min: [0, 'Calories cannot be negative'],
    },
    protein: {
      type: Number,
      required: [true, 'Protein grams is required'],
      min: [0, 'Protein cannot be negative'],
      default: 0,
    },
    carbs: {
      type: Number,
      required: [true, 'Carbohydrate grams is required'],
      min: [0, 'Carbs cannot be negative'],
      default: 0,
    },
    fat: {
      type: Number,
      required: [true, 'Fat grams is required'],
      min: [0, 'Fat cannot be negative'],
      default: 0,
    },
    fiber: {
      type: Number,
      min: [0, 'Fiber cannot be negative'],
      default: 0,
    },
    isVegetarian: {
      type: Boolean,
      default: false,
    },
    isVegan: {
      type: Boolean,
      default: false,
    },
    allergens: [
      {
        type: String,
        trim: true,
      },
    ],
    isCustom: {
      type: Boolean,
      default: false,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

foodItemSchema.index({ name: 'text' });

const FoodItem = mongoose.model('FoodItem', foodItemSchema);

module.exports = FoodItem;
