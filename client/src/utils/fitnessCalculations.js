/**
 * FitCore Fitness Calculation Utilities
 * Standardized, medically sound formulas for BMI, BMR, TDEE, and Calorie targets.
 */

/**
 * Calculate Body Mass Index (BMI)
 * Formula: weight (kg) / [height (m)]^2
 * @param {number} weightKg
 * @param {number} heightCm
 * @returns {number|null}
 */
export const calculateBMI = (weightKg, heightCm) => {
  const w = parseFloat(weightKg);
  const h = parseFloat(heightCm);
  if (!w || !h || w <= 0 || h <= 0) return null;
  const heightM = h / 100;
  return parseFloat((w / (heightM * heightM)).toFixed(1));
};

/**
 * Standard adult BMI Category classification
 * @param {number} bmi
 * @returns {string}
 */
export const getBMICategory = (bmi) => {
  if (bmi == null || isNaN(bmi) || bmi <= 0) return 'Unknown';
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25.0) return 'Normal';
  if (bmi < 30.0) return 'Overweight';
  return 'Obesity';
};

/**
 * Descriptive metadata, badge styles, and healthy context for BMI categories
 * @param {string} category
 * @returns {object}
 */
export const getBMICategoryInfo = (category) => {
  switch (category) {
    case 'Underweight':
      return {
        label: 'Underweight',
        color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800',
        advice: 'Consider focusing on nutrient-dense caloric surplus and progressive resistance training.',
      };
    case 'Normal':
      return {
        label: 'Normal Weight',
        color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800',
        advice: 'Great job! Maintain your current balanced lifestyle, active training, and whole food nutrition.',
      };
    case 'Overweight':
      return {
        label: 'Overweight',
        color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/60 border-orange-200 dark:border-orange-800',
        advice: 'A modest caloric deficit combined with strength training and cardio can help optimize body composition.',
      };
    case 'Obesity':
      return {
        label: 'Obesity',
        color: 'text-red-500 bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800',
        advice: 'Structured exercise programs and registered nutritionist consultation are strongly recommended.',
      };
    default:
      return {
        label: 'Unclassified',
        color: 'text-slate-500 bg-slate-100 dark:bg-slate-800',
        advice: 'Enter valid measurements to view classification.',
      };
  }
};

/**
 * Calculate Basal Metabolic Rate (BMR) using the Mifflin-St Jeor Equation
 * Male: BMR = 10W + 6.25H - 5A + 5
 * Female: BMR = 10W + 6.25H - 5A - 161
 * @param {string} gender 'male' | 'female'
 * @param {number} weightKg
 * @param {number} heightCm
 * @param {number} ageYears
 * @returns {number|null}
 */
export const calculateBMR = (gender, weightKg, heightCm, ageYears) => {
  const w = parseFloat(weightKg);
  const h = parseFloat(heightCm);
  const a = parseInt(ageYears, 10);

  if (!w || !h || !a || w <= 0 || h <= 0 || a <= 0) return null;

  const base = 10 * w + 6.25 * h - 5 * a;
  const isMale = (gender || 'male').toLowerCase() === 'male';
  const bmr = isMale ? base + 5 : base - 161;

  return Math.round(bmr);
};

/**
 * Activity level multipliers for Total Daily Energy Expenditure (TDEE)
 */
export const ACTIVITY_MULTIPLIERS = {
  sedentary: { multiplier: 1.2, label: 'Sedentary (Little or no exercise, desk job)' },
  light: { multiplier: 1.375, label: 'Light Activity (Exercise 1–3 days/week)' },
  moderate: { multiplier: 1.55, label: 'Moderate Activity (Exercise 3–5 days/week)' },
  very_active: { multiplier: 1.725, label: 'Very Active (Hard exercise 6–7 days/week)' },
  extra_active: { multiplier: 1.9, label: 'Extra Active (Physical job or 2x daily training)' },
};

/**
 * Calculate Total Daily Energy Expenditure (TDEE)
 * Formula: BMR × Activity Multiplier
 * @param {number} bmr
 * @param {string} activityLevel
 * @returns {number|null}
 */
export const calculateTDEE = (bmr, activityLevel = 'moderate') => {
  if (!bmr || bmr <= 0) return null;
  const item = ACTIVITY_MULTIPLIERS[activityLevel] || ACTIVITY_MULTIPLIERS.moderate;
  return Math.round(bmr * item.multiplier);
};

/**
 * Calculate Target Daily Calories based on fitness goal
 * Loss = TDEE - 500
 * Maintain = TDEE
 * Gain = TDEE + 400
 * @param {number} tdee
 * @param {string} goal 'loss' | 'maintain' | 'gain'
 * @returns {number|null}
 */
export const calculateGoalCalories = (tdee, goal = 'maintain') => {
  if (!tdee || tdee <= 0) return null;
  switch (goal) {
    case 'loss':
      return Math.max(1200, Math.round(tdee - 500));
    case 'gain':
      return Math.round(tdee + 400);
    case 'maintain':
    default:
      return Math.round(tdee);
  }
};

/**
 * Calculate recommended macronutrient distribution (30% Protein / 45% Carbs / 25% Fat)
 * @param {number} targetCalories
 * @returns {object}
 */
export const calculateSuggestedMacros = (targetCalories) => {
  if (!targetCalories || targetCalories <= 0) return { protein: 0, carbs: 0, fat: 0 };
  return {
    protein: Math.round((targetCalories * 0.3) / 4), // 4 kcal per gram
    carbs: Math.round((targetCalories * 0.45) / 4),   // 4 kcal per gram
    fat: Math.round((targetCalories * 0.25) / 9),     // 9 kcal per gram
  };
};
