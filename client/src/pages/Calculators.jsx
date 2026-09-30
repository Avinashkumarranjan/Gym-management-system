import React, { useState } from 'react';
import {
  Scale,
  Flame,
  Info,
  CheckCircle,
  AlertCircle,
  Activity,
  Heart,
  Beef,
  Wheat,
  PieChart,
} from 'lucide-react';
import Button from '../components/common/Button';
import {
  calculateBMI,
  getBMICategory,
  getBMICategoryInfo,
  calculateBMR,
  calculateTDEE,
  calculateGoalCalories,
  calculateSuggestedMacros,
} from '../utils/fitnessCalculations';

const Calculators = () => {
  // BMI state
  const [bmiForm, setBmiForm] = useState({ height: '', weight: '' });
  const [bmiResult, setBmiResult] = useState(null);
  const [bmiError, setBmiError] = useState('');

  // Calorie form state
  const [calorieForm, setCalorieForm] = useState({
    age: '',
    gender: 'male',
    height: '',
    weight: '',
    activityLevel: 'moderate',
    goal: 'maintain',
  });
  const [calorieResult, setCalorieResult] = useState(null);
  const [calorieError, setCalorieError] = useState('');

  const handleBmiSubmit = (e) => {
    e.preventDefault();
    setBmiError('');

    const h = parseFloat(bmiForm.height);
    const w = parseFloat(bmiForm.weight);

    if (!h || h < 50 || h > 280) {
      setBmiError('Please enter a realistic height between 50 cm and 280 cm.');
      return;
    }
    if (!w || w < 20 || w > 350) {
      setBmiError('Please enter a realistic weight between 20 kg and 350 kg.');
      return;
    }

    const bmi = calculateBMI(w, h);
    const category = getBMICategory(bmi);
    const info = getBMICategoryInfo(category);

    setBmiResult({
      bmi,
      category,
      info,
    });
  };

  const handleCalorieSubmit = (e) => {
    e.preventDefault();
    setCalorieError('');

    const a = parseInt(calorieForm.age, 10);
    const h = parseFloat(calorieForm.height);
    const w = parseFloat(calorieForm.weight);

    if (!a || a < 10 || a > 120) {
      setCalorieError('Please enter a valid age between 10 and 120 years.');
      return;
    }
    if (!h || h < 50 || h > 280) {
      setCalorieError('Please enter a realistic height between 50 cm and 280 cm.');
      return;
    }
    if (!w || w < 20 || w > 350) {
      setCalorieError('Please enter a realistic weight between 20 kg and 350 kg.');
      return;
    }

    const bmr = calculateBMR(calorieForm.gender, w, h, a);
    const tdee = calculateTDEE(bmr, calorieForm.activityLevel);
    const goalCalories = calculateGoalCalories(tdee, calorieForm.goal);
    const macros = calculateSuggestedMacros(goalCalories);

    setCalorieResult({
      bmr,
      tdee,
      goalCalories,
      macros,
    });
  };

  return (
    <div className="py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary-500 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-950/50 border border-primary-200 dark:border-primary-900">
            Interactive Diagnostics
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Fitness &amp; Nutrition Calculators
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 font-normal leading-relaxed">
            Estimate physiological baselines to help guide your training splits and dietary strategy.
          </p>
        </div>

        {/* 2 Calculator Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto items-start">
          {/* Card 1: BMI Calculator */}
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary-100 dark:bg-primary-950 text-primary-500 flex items-center justify-center">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  BMI Calculator
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Body Mass Index assessment based on height and weight
                </p>
              </div>
            </div>

            {bmiError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{bmiError}</span>
              </div>
            )}

            <form onSubmit={handleBmiSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="bmi-height"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
                >
                  Height (cm)
                </label>
                <input
                  id="bmi-height"
                  type="number"
                  placeholder="e.g. 178"
                  value={bmiForm.height}
                  onChange={(e) => setBmiForm({ ...bmiForm, height: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-semibold"
                />
              </div>

              <div>
                <label
                  htmlFor="bmi-weight"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
                >
                  Weight (kg)
                </label>
                <input
                  id="bmi-weight"
                  type="number"
                  step="0.1"
                  placeholder="e.g. 75"
                  value={bmiForm.weight}
                  onChange={(e) => setBmiForm({ ...bmiForm, weight: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-semibold"
                />
              </div>

              <div className="pt-2">
                <Button type="submit" variant="primary" className="w-full justify-center font-bold">
                  Calculate BMI
                </Button>
              </div>
            </form>

            {/* Calculated Result Display */}
            {bmiResult && (
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Your Calculated BMI
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${bmiResult.info.color}`}
                  >
                    {bmiResult.info.label}
                  </span>
                </div>

                <div className="text-4xl font-black text-slate-900 dark:text-white">
                  {bmiResult.bmi}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {bmiResult.info.advice}
                </p>

                {/* BMI Reference Scale */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-700 grid grid-cols-4 gap-1 text-center text-[10px] text-slate-500">
                  <div className="p-1 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400">
                    &lt; 18.5
                    <span className="block font-bold">Under</span>
                  </div>
                  <div className="p-1 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                    18.5–24.9
                    <span className="block font-bold">Normal</span>
                  </div>
                  <div className="p-1 rounded bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400">
                    25–29.9
                    <span className="block font-bold">Over</span>
                  </div>
                  <div className="p-1 rounded bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400">
                    &ge; 30.0
                    <span className="block font-bold">Obese</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Calorie Calculator */}
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950 text-orange-500 flex items-center justify-center">
                <Flame className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Calorie &amp; TDEE Calculator
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Mifflin-St Jeor daily energy expenditure and target intake
                </p>
              </div>
            </div>

            {calorieError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{calorieError}</span>
              </div>
            )}

            <form onSubmit={handleCalorieSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="cal-age"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
                  >
                    Age (Years)
                  </label>
                  <input
                    id="cal-age"
                    type="number"
                    placeholder="e.g. 26"
                    value={calorieForm.age}
                    onChange={(e) => setCalorieForm({ ...calorieForm, age: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label
                    htmlFor="cal-gender"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
                  >
                    Biological Gender
                  </label>
                  <select
                    id="cal-gender"
                    value={calorieForm.gender}
                    onChange={(e) => setCalorieForm({ ...calorieForm, gender: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-semibold"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="cal-height"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
                  >
                    Height (cm)
                  </label>
                  <input
                    id="cal-height"
                    type="number"
                    placeholder="e.g. 175"
                    value={calorieForm.height}
                    onChange={(e) => setCalorieForm({ ...calorieForm, height: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label
                    htmlFor="cal-weight"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
                  >
                    Weight (kg)
                  </label>
                  <input
                    id="cal-weight"
                    type="number"
                    step="0.1"
                    placeholder="e.g. 72"
                    value={calorieForm.weight}
                    onChange={(e) => setCalorieForm({ ...calorieForm, weight: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-semibold"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="cal-activity"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
                >
                  Activity Multiplier
                </label>
                <select
                  id="cal-activity"
                  value={calorieForm.activityLevel}
                  onChange={(e) => setCalorieForm({ ...calorieForm, activityLevel: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-semibold"
                >
                  <option value="sedentary">Sedentary (Little or no exercise, desk job)</option>
                  <option value="light">Light Activity (Exercise 1–3 days/week)</option>
                  <option value="moderate">Moderate Activity (Exercise 3–5 days/week)</option>
                  <option value="very_active">Very Active (Heavy training 6–7 days/week)</option>
                  <option value="extra_active">Extra Active (Labor job or 2x daily workouts)</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="cal-goal"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
                >
                  Primary Fitness Goal
                </label>
                <select
                  id="cal-goal"
                  value={calorieForm.goal}
                  onChange={(e) => setCalorieForm({ ...calorieForm, goal: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-semibold"
                >
                  <option value="loss">Weight Loss (500 kcal deficit)</option>
                  <option value="maintain">Maintain Current Weight</option>
                  <option value="gain">Weight / Muscle Gain (400 kcal surplus)</option>
                </select>
              </div>

              <div className="pt-2">
                <Button type="submit" variant="primary" className="w-full justify-center font-bold">
                  Calculate Caloric Targets
                </Button>
              </div>
            </form>

            {/* Calculated Result Display */}
            {calorieResult && (
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in text-xs">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Basal BMR</span>
                    <strong className="text-base text-slate-900 dark:text-white">{calorieResult.bmr}</strong>
                    <span className="text-[10px] text-slate-400 block">kcal/day</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">TDEE Maintenance</span>
                    <strong className="text-base text-slate-900 dark:text-white">{calorieResult.tdee}</strong>
                    <span className="text-[10px] text-slate-400 block">kcal/day</span>
                  </div>
                  <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800 text-orange-900 dark:text-orange-200">
                    <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 block uppercase">Target Intake</span>
                    <strong className="text-lg text-orange-700 dark:text-orange-300">{calorieResult.goalCalories}</strong>
                    <span className="text-[10px] text-orange-600 dark:text-orange-400 block">kcal/day</span>
                  </div>
                </div>

                {/* Suggested Macro Splits */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Suggested Macro Split (30P / 45C / 25F)
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 flex items-center gap-2">
                      <Beef className="w-4 h-4 text-rose-500 shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 block">Protein</span>
                        <strong className="text-slate-900 dark:text-white text-xs">{calorieResult.macros.protein}g</strong>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 flex items-center gap-2">
                      <Wheat className="w-4 h-4 text-amber-500 shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 block">Carbs</span>
                        <strong className="text-slate-900 dark:text-white text-xs">{calorieResult.macros.carbs}g</strong>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-sky-500 shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 block">Fats</span>
                        <strong className="text-slate-900 dark:text-white text-xs">{calorieResult.macros.fat}g</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Informational Disclaimer Banner */}
        <div className="max-w-4xl mx-auto p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
          <Info className="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            <strong>Medical Disclaimer:</strong> These estimates are derived from standard physiological models (Mifflin-St Jeor &amp; Quetelet Index) for general fitness guidance and are not medical advice.
          </span>
        </div>
      </div>
    </div>
  );
};

export default Calculators;
