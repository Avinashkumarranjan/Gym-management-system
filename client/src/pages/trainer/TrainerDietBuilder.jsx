import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Apple,
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Flame,
  Droplets,
  Beef,
  Wheat,
  PieChart,
  Clock,
  FileText,
  AlertCircle,
  CheckCircle2,
  Utensils,
} from 'lucide-react';
import dietService from '../../services/dietService';
import trainerService from '../../services/trainerService';
import Button from '../../components/common/Button';

const DEFAULT_FOOD = {
  food: '',
  quantity: '',
};

const DEFAULT_MEAL = {
  mealName: 'Breakfast',
  time: '08:00',
  items: [{ food: 'Rolled Oats', quantity: '80g' }, { food: 'Egg Whites', quantity: '4 large' }],
  notes: 'Drink 500ml water upon waking.',
};

const TrainerDietBuilder = () => {
  const { memberId, planId } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(planId);

  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Plan Overview Form
  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('muscle_gain');
  const [dailyCalories, setDailyCalories] = useState(2500);
  const [proteinGrams, setProteinGrams] = useState(160);
  const [carbsGrams, setCarbsGrams] = useState(280);
  const [fatGrams, setFatGrams] = useState(65);
  const [waterLiters, setWaterLiters] = useState(3.5);
  const [notes, setNotes] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Meals Array
  const [meals, setMeals] = useState([
    {
      mealName: 'Breakfast',
      time: '08:00',
      items: [
        { food: 'Oats with Almond Milk', quantity: '80g' },
        { food: 'Boiled Egg Whites', quantity: '4 whites' },
        { food: 'Banana', quantity: '1 medium' },
      ],
      notes: 'Take multivitamin with breakfast.',
    },
    {
      mealName: 'Lunch',
      time: '13:00',
      items: [
        { food: 'Grilled Chicken Breast / Tofu', quantity: '180g' },
        { food: 'Brown Rice / Quinoa', quantity: '150g cooked' },
        { food: 'Steamed Broccoli & Carrots', quantity: '1 cup' },
      ],
      notes: 'Season with herbs and olive oil.',
    },
    {
      mealName: 'Post-Workout Shake',
      time: '17:30',
      items: [
        { food: 'Whey Protein Isolate', quantity: '1 scoop (30g)' },
        { food: 'Rice Cakes with Honey', quantity: '2 cakes' },
      ],
      notes: 'Consume within 45 mins of training.',
    },
    {
      mealName: 'Dinner',
      time: '20:30',
      items: [
        { food: 'Salmon or Paneer / Lentil Curry', quantity: '160g' },
        { food: 'Sweet Potato', quantity: '150g baked' },
        { food: 'Mixed Green Salad', quantity: '1 bowl' },
      ],
      notes: 'Low sodium dressing.',
    },
  ]);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        setError('');

        if (isEditMode) {
          const res = await dietService.getDietPlanById(planId);
          if (res.success && res.data) {
            const d = res.data;
            setTitle(d.title || '');
            setGoal(d.goal || 'muscle_gain');
            setDailyCalories(d.dailyCalories || 2000);
            if (d.macros) {
              setProteinGrams(d.macros.proteinGrams ?? 0);
              setCarbsGrams(d.macros.carbsGrams ?? 0);
              setFatGrams(d.macros.fatGrams ?? 0);
            }
            setWaterLiters(d.waterLiters ?? 3);
            setNotes(d.notes || '');
            setStartDate(d.startDate ? d.startDate.split('T')[0] : '');
            setEndDate(d.endDate ? d.endDate.split('T')[0] : '');
            setIsActive(d.isActive !== undefined ? d.isActive : true);
            if (d.meals && d.meals.length > 0) {
              setMeals(d.meals);
            }
            if (d.member) {
              setMember(d.member);
            }
          }
        } else if (memberId) {
          const memberRes = await trainerService.getAssignedMemberDetails(memberId);
          if (memberRes.success && memberRes.data) {
            setMember(memberRes.data.user || memberRes.data);
            setTitle(`${memberRes.data.user?.name || 'Athlete'} Daily Nutrition Plan`);
            setGoal(memberRes.data.fitnessGoal || 'muscle_gain');
          }
        }
      } catch (err) {
        setError(
          err.response?.data?.message || err.message || 'Failed to initialize diet builder.'
        );
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [memberId, planId, isEditMode]);

  // Meals management
  const handleAddMeal = () => {
    setMeals([
      ...meals,
      {
        mealName: `Meal ${meals.length + 1}`,
        time: '12:00',
        items: [{ food: '', quantity: '' }],
        notes: '',
      },
    ]);
  };

  const handleRemoveMeal = (mealIdx) => {
    setMeals(meals.filter((_, idx) => idx !== mealIdx));
  };

  const handleUpdateMeal = (mealIdx, field, val) => {
    const updated = [...meals];
    updated[mealIdx][field] = val;
    setMeals(updated);
  };

  // Food item management within meal
  const handleAddFoodItem = (mealIdx) => {
    const updated = [...meals];
    updated[mealIdx].items.push({ ...DEFAULT_FOOD });
    setMeals(updated);
  };

  const handleRemoveFoodItem = (mealIdx, itemIdx) => {
    const updated = [...meals];
    updated[mealIdx].items.splice(itemIdx, 1);
    setMeals(updated);
  };

  const handleUpdateFoodItem = (mealIdx, itemIdx, field, val) => {
    const updated = [...meals];
    updated[mealIdx].items[itemIdx][field] = val;
    setMeals(updated);
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Diet plan title is required.');
      return;
    }

    if (dailyCalories != null && Number(dailyCalories) <= 0) {
      setError('Daily calories must be greater than 0.');
      return;
    }

    // Validate meals
    for (const m of meals) {
      if (!m.mealName || !m.mealName.trim()) {
        setError('Every meal requires a meal name (e.g. Breakfast).');
        return;
      }
      for (const item of m.items) {
        if (!item.food || !item.food.trim()) {
          setError(`Please specify food name in ${m.mealName}.`);
          return;
        }
      }
    }

    try {
      setSaving(true);
      setError('');

      const payload = {
        title,
        goal,
        dailyCalories: Number(dailyCalories),
        macros: {
          proteinGrams: Number(proteinGrams),
          carbsGrams: Number(carbsGrams),
          fatGrams: Number(fatGrams),
        },
        waterLiters: Number(waterLiters),
        meals,
        notes,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        isActive,
      };

      if (isEditMode) {
        await dietService.updateDietPlan(planId, payload);
        setSuccessMsg('Diet plan updated successfully!');
      } else {
        await dietService.createTrainerDiet(memberId, payload);
        setSuccessMsg('Diet plan assigned to athlete successfully!');
      }

      setTimeout(() => {
        if (memberId) {
          navigate(`/trainer/members/${memberId}`);
        } else {
          navigate('/trainer/diets');
        }
      }, 1500);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Failed to save diet plan.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-44 rounded-3xl bg-slate-100 dark:bg-slate-800/60 animate-pulse border border-slate-200 dark:border-slate-800" />
        <div className="h-96 rounded-3xl bg-slate-100 dark:bg-slate-800/40 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          Coach Nutrition Builder
        </span>
      </div>

      {/* Header Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-700 to-cyan-700 text-white shadow-lg space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider text-emerald-100">
          <Apple className="w-3.5 h-3.5 text-emerald-300" />
          {isEditMode ? 'Modify Nutrition Protocol' : 'Design Athlete Nutrition Plan'}
        </div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight">
          {isEditMode ? 'Edit Diet Plan' : `Create Diet Plan for ${member?.name || 'Athlete'}`}
        </h1>
        <p className="text-xs md:text-sm text-emerald-100/90 max-w-xl">
          Assign daily caloric intake targets, macro distributions, hydration recommendations, and meal breakdowns.
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-xs font-semibold flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Overview & Macros */}
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
          <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-emerald-500" />
            Nutritional Targets & Macro Budget
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Plan Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., High-Protein Lean Mass Phase"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Goal Category
              </label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
              >
                <option value="weight_loss">Weight Loss / Cutting</option>
                <option value="muscle_gain">Muscle Gain / Lean Bulk</option>
                <option value="maintenance">Maintenance / Balance</option>
                <option value="endurance">Endurance & Performance</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-6">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                />
                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                  Set as Athlete's Primary Active Diet
                </span>
              </label>
            </div>

            {/* Macros Input Row */}
            <div className="col-span-full grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                  Calories (kcal) *
                </label>
                <input
                  type="number"
                  min="500"
                  max="10000"
                  value={dailyCalories}
                  onChange={(e) => setDailyCalories(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                  Protein (g)
                </label>
                <input
                  type="number"
                  min="0"
                  value={proteinGrams}
                  onChange={(e) => setProteinGrams(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                  Carbs (g)
                </label>
                <input
                  type="number"
                  min="0"
                  value={carbsGrams}
                  onChange={(e) => setCarbsGrams(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                  Fats (g)
                </label>
                <input
                  type="number"
                  min="0"
                  value={fatGrams}
                  onChange={(e) => setFatGrams(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                  Water Target (L)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={waterLiters}
                  onChange={(e) => setWaterLiters(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                End Date (Optional)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                General Nutrition Guidelines & Micronutrient Notes
              </label>
              <textarea
                rows="2"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Ensure adequate electrolyte intake, minimize processed sugars, drink 1L during workout..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Meal Schedule & Food Items */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Utensils className="w-5 h-5 text-emerald-500" />
                Prescribed Meals ({meals.length} Meals)
              </h2>
              <p className="text-xs text-slate-500">
                Structure the athlete's daily feeding windows and food choices.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddMeal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Meal
            </button>
          </div>

          {meals.map((meal, mealIdx) => (
            <div
              key={mealIdx}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4"
            >
              {/* Meal Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 flex-1">
                  <span className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-black text-xs flex items-center justify-center shrink-0">
                    {mealIdx + 1}
                  </span>
                  <input
                    type="text"
                    value={meal.mealName}
                    onChange={(e) => handleUpdateMeal(mealIdx, 'mealName', e.target.value)}
                    placeholder="Meal Name (e.g. Breakfast, Pre-Workout)"
                    required
                    className="flex-1 max-w-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm"
                  />
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="time"
                      value={meal.time || '08:00'}
                      onChange={(e) => handleUpdateMeal(mealIdx, 'time', e.target.value)}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddFoodItem(mealIdx)}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-bold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Food Item
                  </button>

                  {meals.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMeal(mealIdx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Food Items in Meal */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Food Portions & Ingredients
                </span>
                {meal.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="flex items-center gap-2 text-xs">
                    <input
                      type="text"
                      value={item.food}
                      onChange={(e) =>
                        handleUpdateFoodItem(mealIdx, itemIdx, 'food', e.target.value)
                      }
                      placeholder="Food Item (e.g. Rolled Oats, Chicken Breast)"
                      required
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                    />
                    <input
                      type="text"
                      value={item.quantity}
                      onChange={(e) =>
                        handleUpdateFoodItem(mealIdx, itemIdx, 'quantity', e.target.value)
                      }
                      placeholder="Quantity (e.g. 100g, 4 whites)"
                      className="w-36 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                    />
                    {meal.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveFoodItem(mealIdx, itemIdx)}
                        className="p-1.5 rounded text-slate-400 hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Meal Coach Note */}
              <div>
                <input
                  type="text"
                  value={meal.notes || ''}
                  onChange={(e) => handleUpdateMeal(mealIdx, 'notes', e.target.value)}
                  placeholder="Meal notes (e.g. drink with 500ml water, timing around workout)..."
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving Protocol...' : isEditMode ? 'Update Nutrition Plan' : 'Save & Assign Diet'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TrainerDietBuilder;
