import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Search,
  ArrowUp,
  ArrowDown,
  Copy,
  Eye,
  Send,
  X,
  AlertTriangle,
  Sparkles,
  Info,
  Calendar,
  ChevronDown,
  ChevronUp,
  BookOpen,
  ShieldAlert,
  ListOrdered,
  LayoutGrid,
  Layers,
  RefreshCw,
} from 'lucide-react';
import dietService from '../../services/dietService';
import trainerService from '../../services/trainerService';
import foodService from '../../services/foodService';
import Button from '../../components/common/Button';

// ─── Constants ────────────────────────────────────────────────────────────────
const GOAL_OPTIONS = [
  'Weight Loss', 'Muscle Gain', 'Maintenance', 'Athletic Performance',
  'Body Recomposition', 'General Health', 'Custom',
];
const DIET_TYPE_OPTIONS = [
  'Balanced', 'High Protein', 'Low Carb', 'Vegetarian', 'Vegan',
  'Eggetarian', 'Keto', 'Mediterranean', 'High Carb', 'Custom',
];
const MEAL_CATEGORIES = [
  'Breakfast', 'Morning Snack', 'Lunch', 'Pre Workout', 'Post Workout',
  'Evening Snack', 'Dinner', 'Before Bed', 'Custom Meal',
];
const FOOD_GROUPS = [
  'All', 'Protein', 'Carbohydrates', 'Healthy Fats', 'Vegetables',
  'Fruits', 'Dairy', 'Grains', 'Legumes', 'Nuts & Seeds',
  'Supplements', 'Beverages', 'Other',
];
const DIET_PREFERENCE_FILTERS = [
  'All', 'Vegetarian', 'Non-Vegetarian', 'Vegan', 'Eggetarian',
  'Gluten-Free', 'Lactose-Free', 'Nut-Free', 'High Protein', 'Low Carb',
];
const ALLERGEN_OPTIONS = ['None', 'Milk', 'Egg', 'Peanut', 'Tree Nut', 'Soy', 'Wheat', 'Fish', 'Shellfish'];
const SERVING_UNITS = ['g', 'kg', 'ml', 'L', 'cup', 'tbsp', 'tsp', 'piece', 'slice', 'bowl', 'serving', 'scoop', 'custom'];
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// ─── Templates ────────────────────────────────────────────────────────────────
const DIET_TEMPLATES = {
  blank: { label: 'Start Blank', icon: '📋', description: 'Build from scratch with no preset meals', meals: [] },
  balanced: {
    label: 'Balanced General Fitness', icon: '⚖️', description: 'A balanced 4-meal daily plan suitable for general fitness goals',
    goal: 'General Health', dietType: 'Balanced', dailyCalories: 2000, proteinGrams: 130, carbsGrams: 240, fatGrams: 65, fiberGrams: 30, waterLiters: 3,
    meals: [
      { mealName: 'Breakfast: Balanced Start', category: 'Breakfast', time: '08:00', notes: '', caloriesTarget: 500, items: [], alternatives: [] },
      { mealName: 'Lunch: Complete Meal', category: 'Lunch', time: '13:00', notes: '', caloriesTarget: 600, items: [], alternatives: [] },
      { mealName: 'Evening Snack', category: 'Evening Snack', time: '17:00', notes: '', caloriesTarget: 300, items: [], alternatives: [] },
      { mealName: 'Dinner: Light & Nutritious', category: 'Dinner', time: '20:00', notes: '', caloriesTarget: 600, items: [], alternatives: [] },
    ],
  },
  highProtein: {
    label: 'High Protein Muscle Gain', icon: '💪', description: 'Protein-rich 5-meal structure for muscle hypertrophy',
    goal: 'Muscle Gain', dietType: 'High Protein', dailyCalories: 2800, proteinGrams: 200, carbsGrams: 300, fatGrams: 75, fiberGrams: 35, waterLiters: 4,
    meals: [
      { mealName: 'Breakfast: Protein Power', category: 'Breakfast', time: '07:30', notes: 'High protein start to the day', caloriesTarget: 600, items: [], alternatives: [] },
      { mealName: 'Mid-Morning: Pre-Workout Fuel', category: 'Pre Workout', time: '10:30', notes: '', caloriesTarget: 400, items: [], alternatives: [] },
      { mealName: 'Lunch: Recovery Meal', category: 'Post Workout', time: '13:30', notes: 'Post-workout recovery window', caloriesTarget: 700, items: [], alternatives: [] },
      { mealName: 'Evening: Anabolic Window', category: 'Evening Snack', time: '17:00', notes: '', caloriesTarget: 400, items: [], alternatives: [] },
      { mealName: 'Dinner: Slow Protein', category: 'Dinner', time: '20:30', notes: 'Casein or slow-digesting protein preferred', caloriesTarget: 700, items: [], alternatives: [] },
    ],
  },
  weightLoss: {
    label: 'Weight Loss Protocol', icon: '🔥', description: 'Caloric deficit plan with high satiety meals',
    goal: 'Weight Loss', dietType: 'Low Carb', dailyCalories: 1600, proteinGrams: 150, carbsGrams: 130, fatGrams: 55, fiberGrams: 35, waterLiters: 3.5,
    meals: [
      { mealName: 'Breakfast: High Fiber Start', category: 'Breakfast', time: '07:00', notes: 'Avoid simple sugars', caloriesTarget: 350, items: [], alternatives: [] },
      { mealName: 'Morning Snack: Protein Boost', category: 'Morning Snack', time: '10:30', notes: '', caloriesTarget: 200, items: [], alternatives: [] },
      { mealName: 'Lunch: Lean & Clean', category: 'Lunch', time: '13:00', notes: 'Large portion of vegetables', caloriesTarget: 450, items: [], alternatives: [] },
      { mealName: 'Dinner: Light Protein', category: 'Dinner', time: '19:30', notes: 'Keep dinner light and early', caloriesTarget: 400, items: [], alternatives: [] },
    ],
  },
  vegetarian: {
    label: 'Vegetarian Balanced', icon: '🥗', description: 'Plant-based diet with complete protein sources',
    goal: 'General Health', dietType: 'Vegetarian', dailyCalories: 2100, proteinGrams: 120, carbsGrams: 270, fatGrams: 65, fiberGrams: 40, waterLiters: 3,
    meals: [
      { mealName: 'Breakfast: Oats & Dairy', category: 'Breakfast', time: '08:00', notes: '', caloriesTarget: 500, items: [], alternatives: [] },
      { mealName: 'Lunch: Dal & Rice Plate', category: 'Lunch', time: '13:00', notes: 'Include a serving of sabzi', caloriesTarget: 650, items: [], alternatives: [] },
      { mealName: 'Evening Snack: Nuts & Fruit', category: 'Evening Snack', time: '16:30', notes: '', caloriesTarget: 300, items: [], alternatives: [] },
      { mealName: 'Dinner: Paneer or Tofu Dish', category: 'Dinner', time: '20:00', notes: '', caloriesTarget: 550, items: [], alternatives: [] },
    ],
  },
};

// ─── Helper ───────────────────────────────────────────────────────────────────
const createMeal = (category = 'Breakfast', name = '', time = '08:00') => ({
  mealName: name || category,
  category,
  time,
  notes: '',
  caloriesTarget: null,
  items: [],
  alternatives: [],
});

const calcMealNutrition = (items = []) => ({
  cals: items.reduce((s, i) => s + (Number(i.calories) || 0), 0),
  prot: items.reduce((s, i) => s + (Number(i.protein) || 0), 0),
  carb: items.reduce((s, i) => s + (Number(i.carbs) || 0), 0),
  fat: items.reduce((s, i) => s + (Number(i.fat) || 0), 0),
  fiber: items.reduce((s, i) => s + (Number(i.fiber) || 0), 0),
});

// ─── Main Component ───────────────────────────────────────────────────────────
const TrainerDietBuilder = () => {
  const { memberId, planId } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(planId);

  // Core state
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Template selection (for new plan only)
  const [showTemplateSelect, setShowTemplateSelect] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState('overview');
  const [planMode, setPlanMode] = useState('daily_standard');
  const [activeDay, setActiveDay] = useState('Monday');

  // Overview fields
  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('Muscle Gain');
  const [dietType, setDietType] = useState('High Protein');
  const [duration, setDuration] = useState('8 Weeks');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [coachNotes, setCoachNotes] = useState('');

  // Nutrition targets
  const [dailyCalories, setDailyCalories] = useState(2500);
  const [proteinGrams, setProteinGrams] = useState(160);
  const [carbsGrams, setCarbsGrams] = useState(280);
  const [fatGrams, setFatGrams] = useState(65);
  const [fiberGrams, setFiberGrams] = useState(30);
  const [waterLiters, setWaterLiters] = useState(3.5);
  const [sodiumMg, setSodiumMg] = useState('');
  const [sugarGrams, setSugarGrams] = useState('');
  const [potassiumMg, setPotassiumMg] = useState('');

  // Restrictions
  const [foodsToAvoid, setFoodsToAvoid] = useState('');
  const [dietRestrictions, setDietRestrictions] = useState('');
  const [cheatMealGuidance, setCheatMealGuidance] = useState('');
  const [mealPrepNotes, setMealPrepNotes] = useState('');
  const [supplementNotes, setSupplementNotes] = useState('');

  // Meals
  const [meals, setMeals] = useState([]);
  const [collapsedMeals, setCollapsedMeals] = useState({});

  // Food library modal
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
  const [targetMealIdx, setTargetMealIdx] = useState(0);
  const [foodLibrary, setFoodLibrary] = useState([]);
  const [foodLoading, setFoodLoading] = useState(false);
  const [searchFood, setSearchFood] = useState('');
  const [filterFoodGroup, setFilterFoodGroup] = useState('All');
  const [filterDietPref, setFilterDietPref] = useState('All');
  const [filterAllergen, setFilterAllergen] = useState('None');

  // Custom food modal
  const [isCustomFoodOpen, setIsCustomFoodOpen] = useState(false);
  const [customFoodName, setCustomFoodName] = useState('');
  const [customServingUnit, setCustomServingUnit] = useState('g');
  const [customServingSize, setCustomServingSize] = useState(100);
  const [customCalories, setCustomCalories] = useState(150);
  const [customProtein, setCustomProtein] = useState(10);
  const [customCarbs, setCustomCarbs] = useState(15);
  const [customFat, setCustomFat] = useState(3);
  const [customFiber, setCustomFiber] = useState(2);
  const [customFoodGroup, setCustomFoodGroup] = useState('Protein');
  const [customSaving, setCustomSaving] = useState(false);

  // Alternatives modal
  const [isAltModalOpen, setIsAltModalOpen] = useState(false);
  const [targetAltMealIdx, setTargetAltMealIdx] = useState(0);
  const [newAltName, setNewAltName] = useState('');

  const markDirty = useCallback(() => setHasUnsavedChanges(true), []);

  // ── Apply Template ────────────────────────────────────────────────────────
  const applyTemplate = (key) => {
    const tmpl = DIET_TEMPLATES[key];
    if (!tmpl) return;
    if (tmpl.goal) setGoal(tmpl.goal);
    if (tmpl.dietType) setDietType(tmpl.dietType);
    if (tmpl.dailyCalories) setDailyCalories(tmpl.dailyCalories);
    if (tmpl.proteinGrams) setProteinGrams(tmpl.proteinGrams);
    if (tmpl.carbsGrams) setCarbsGrams(tmpl.carbsGrams);
    if (tmpl.fatGrams) setFatGrams(tmpl.fatGrams);
    if (tmpl.fiberGrams) setFiberGrams(tmpl.fiberGrams);
    if (tmpl.waterLiters) setWaterLiters(tmpl.waterLiters);
    setMeals((tmpl.meals || []).map((m) => ({ ...m, alternatives: [] })));
    setShowTemplateSelect(false);
    markDirty();
  };

  // ── Initial Load ──────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        setError('');

        if (isEditMode) {
          const res = await dietService.getDietPlanById(planId);
          if (res.success && res.data) {
            const plan = res.data;
            setTitle(plan.title || '');
            setGoal(plan.goal || 'Healthy Nutrition');
            setDietType(plan.dietType || 'Balanced');
            setPlanMode(plan.planMode || 'daily_standard');
            setDuration(plan.duration || '8 Weeks');
            setDescription(plan.description || plan.notes || '');
            setCoachNotes(plan.coachNotes || '');
            setDailyCalories(plan.dailyCalories || 2000);
            if (plan.macros) {
              setProteinGrams(plan.macros.proteinGrams || 150);
              setCarbsGrams(plan.macros.carbsGrams || 200);
              setFatGrams(plan.macros.fatGrams || 60);
            }
            setFiberGrams(plan.fiber || 30);
            setWaterLiters(plan.waterLiters || 3);
            if (plan.optionalTargets) {
              setSodiumMg(plan.optionalTargets.sodiumMg || '');
              setSugarGrams(plan.optionalTargets.sugarGrams || '');
              setPotassiumMg(plan.optionalTargets.potassiumMg || '');
            }
            if (plan.restrictions) {
              setFoodsToAvoid((plan.restrictions.foodsToAvoid || []).join(', '));
              setDietRestrictions((plan.restrictions.dietRestrictions || []).join(', '));
              setCheatMealGuidance(plan.restrictions.cheatMealGuidance || '');
              setMealPrepNotes(plan.restrictions.mealPrepNotes || '');
              setSupplementNotes(plan.restrictions.supplementNotes || '');
            }
            if (plan.startDate) setStartDate(new Date(plan.startDate).toISOString().split('T')[0]);
            if (plan.endDate) setEndDate(new Date(plan.endDate).toISOString().split('T')[0]);
            if (Array.isArray(plan.meals) && plan.meals.length > 0) {
              setMeals(plan.meals.map((m) => ({
                ...m,
                alternatives: m.alternatives || [],
              })));
            }
            if (plan.member) setMember(plan.member);
          }
        } else if (memberId) {
          const memberRes = await trainerService.getAssignedMemberDetails(memberId);
          if (memberRes.success && memberRes.data) {
            setMember(memberRes.data);
            if (memberRes.data.fitnessGoal) setGoal(memberRes.data.fitnessGoal);
            setTitle(`${memberRes.data.user?.name || 'Athlete'}'s Nutrition Protocol`);
          }
          // Show template selector for new plans
          setShowTemplateSelect(true);
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to initialize diet builder.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [memberId, planId, isEditMode]);

  // ── Food Library ──────────────────────────────────────────────────────────
  const fetchFoods = useCallback(async () => {
    try {
      setFoodLoading(true);
      const params = {};
      if (searchFood) params.search = searchFood;
      if (filterFoodGroup !== 'All') params.foodGroup = filterFoodGroup;
      if (filterDietPref !== 'All') params.dietCategory = filterDietPref;
      if (filterAllergen !== 'None') params.allergen = filterAllergen;
      const res = await foodService.getFoods(params);
      if (res.success) setFoodLibrary(res.data || []);
    } catch {
      // Non-critical
    } finally {
      setFoodLoading(false);
    }
  }, [searchFood, filterFoodGroup, filterDietPref, filterAllergen]);

  useEffect(() => {
    if (isFoodModalOpen) fetchFoods();
  }, [isFoodModalOpen, fetchFoods]);

  // ── Macro Calculations ────────────────────────────────────────────────────
  const macroCalc = useMemo(() => {
    const proteinCals = Number(proteinGrams) * 4;
    const carbsCals = Number(carbsGrams) * 4;
    const fatCals = Number(fatGrams) * 9;
    const totalMacroCals = proteinCals + carbsCals + fatCals;
    const target = Number(dailyCalories);
    const diff = Math.abs(totalMacroCals - target);
    const isMismatch = totalMacroCals > 0 && target > 0 && diff > target * 0.1;
    const pPct = totalMacroCals > 0 ? Math.round((proteinCals / totalMacroCals) * 100) : 0;
    const cPct = totalMacroCals > 0 ? Math.round((carbsCals / totalMacroCals) * 100) : 0;
    const fPct = totalMacroCals > 0 ? Math.round((fatCals / totalMacroCals) * 100) : 0;
    return { proteinCals, carbsCals, fatCals, totalMacroCals, pPct, cPct, fPct, isMismatch, diff };
  }, [dailyCalories, proteinGrams, carbsGrams, fatGrams]);

  // ── Daily Totals from foods ───────────────────────────────────────────────
  const dailyActual = useMemo(() => {
    const relevantMeals = planMode === 'weekly_7day'
      ? meals.filter((m) => m.day === activeDay)
      : meals;
    const all = relevantMeals.flatMap((m) => m.items || []);
    return {
      cals: Math.round(all.reduce((s, i) => s + (Number(i.calories) || 0), 0)),
      prot: Math.round(all.reduce((s, i) => s + (Number(i.protein) || 0), 0) * 10) / 10,
      carb: Math.round(all.reduce((s, i) => s + (Number(i.carbs) || 0), 0) * 10) / 10,
      fat: Math.round(all.reduce((s, i) => s + (Number(i.fat) || 0), 0) * 10) / 10,
      fiber: Math.round(all.reduce((s, i) => s + (Number(i.fiber) || 0), 0) * 10) / 10,
    };
  }, [meals, planMode, activeDay]);

  // ── Meal Mutations ────────────────────────────────────────────────────────
  const addMeal = () => {
    markDirty();
    const newMeal = createMeal('Custom Meal', `Meal ${meals.length + 1}`, '12:00');
    if (planMode === 'weekly_7day') newMeal.day = activeDay;
    setMeals((prev) => [...prev, newMeal]);
  };

  const updateMealField = (idx, field, value) => {
    markDirty();
    setMeals((prev) => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m));
  };

  const removeMeal = (idx) => {
    markDirty();
    setMeals((prev) => prev.filter((_, i) => i !== idx));
  };

  const moveMeal = (idx, dir) => {
    markDirty();
    setMeals((prev) => {
      const copy = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= copy.length) return prev;
      [copy[idx], copy[target]] = [copy[target], copy[idx]];
      return copy;
    });
  };

  const duplicateMeal = (idx) => {
    markDirty();
    setMeals((prev) => {
      const copy = [...prev];
      const dup = {
        ...copy[idx],
        mealName: `${copy[idx].mealName} (Copy)`,
        _id: undefined,
        items: (copy[idx].items || []).map((i) => ({ ...i, _id: undefined })),
        alternatives: (copy[idx].alternatives || []).map((a) => ({
          ...a,
          _id: undefined,
          foods: (a.foods || []).map((f) => ({ ...f, _id: undefined })),
        })),
      };
      copy.splice(idx + 1, 0, dup);
      return copy;
    });
  };

  const copyDayMeals = (fromDay, toDay) => {
    markDirty();
    const source = meals.filter((m) => m.day === fromDay);
    const copied = source.map((m) => ({
      ...m,
      _id: undefined,
      day: toDay,
      mealName: m.mealName,
      items: (m.items || []).map((i) => ({ ...i, _id: undefined })),
    }));
    setMeals((prev) => [
      ...prev.filter((m) => m.day !== toDay),
      ...copied,
    ]);
  };

  // ── Food Item Mutations ───────────────────────────────────────────────────
  const addFoodToMeal = (mealIdx, foodObj) => {
    markDirty();
    setMeals((prev) => {
      const copy = [...prev];
      const meal = { ...copy[mealIdx] };
      const defaultAmount = foodObj.servingSize || 100;
      const ratio = defaultAmount / (foodObj.servingSize || 100);
      const item = {
        food: foodObj._id || null,
        foodName: foodObj.name,
        quantity: `${defaultAmount} ${foodObj.servingUnit || 'g'}`,
        amount: defaultAmount,
        unit: foodObj.servingUnit || 'g',
        calories: Math.round((foodObj.calories || 0) * ratio),
        protein: Math.round((foodObj.protein || 0) * ratio * 10) / 10,
        carbs: Math.round((foodObj.carbs || 0) * ratio * 10) / 10,
        fat: Math.round((foodObj.fat || 0) * ratio * 10) / 10,
        fiber: Math.round((foodObj.fiber || 0) * ratio * 10) / 10,
        notes: '',
        _base: { calories: foodObj.calories, protein: foodObj.protein, carbs: foodObj.carbs, fat: foodObj.fat, fiber: foodObj.fiber, servingSize: foodObj.servingSize || 100, servingUnit: foodObj.servingUnit || 'g' },
      };
      copy[mealIdx] = { ...meal, items: [...(meal.items || []), item] };
      return copy;
    });
  };

  const updateFoodItemAmount = (mealIdx, itemIdx, newAmount) => {
    markDirty();
    setMeals((prev) => {
      const copy = [...prev];
      const meal = { ...copy[mealIdx] };
      const items = [...(meal.items || [])];
      const item = { ...items[itemIdx] };
      const amt = Math.max(0, Number(newAmount) || 0);
      item.amount = amt;
      item.unit = item.unit || 'g';
      item.quantity = `${amt} ${item.unit}`;
      if (item._base && item._base.servingSize > 0) {
        const ratio = amt / item._base.servingSize;
        item.calories = Math.round((item._base.calories || 0) * ratio);
        item.protein = Math.round((item._base.protein || 0) * ratio * 10) / 10;
        item.carbs = Math.round((item._base.carbs || 0) * ratio * 10) / 10;
        item.fat = Math.round((item._base.fat || 0) * ratio * 10) / 10;
        item.fiber = Math.round((item._base.fiber || 0) * ratio * 10) / 10;
      }
      items[itemIdx] = item;
      copy[mealIdx] = { ...meal, items };
      return copy;
    });
  };

  const updateFoodItemUnit = (mealIdx, itemIdx, newUnit) => {
    markDirty();
    setMeals((prev) => {
      const copy = [...prev];
      const meal = { ...copy[mealIdx] };
      const items = [...(meal.items || [])];
      const item = { ...items[itemIdx] };
      item.unit = newUnit;
      item.quantity = `${item.amount || 0} ${newUnit}`;
      items[itemIdx] = item;
      copy[mealIdx] = { ...meal, items };
      return copy;
    });
  };

  const updateFoodItemNotes = (mealIdx, itemIdx, notes) => {
    markDirty();
    setMeals((prev) => {
      const copy = [...prev];
      const meal = { ...copy[mealIdx] };
      const items = [...(meal.items || [])];
      items[itemIdx] = { ...items[itemIdx], notes };
      copy[mealIdx] = { ...meal, items };
      return copy;
    });
  };

  const moveFoodItem = (mealIdx, itemIdx, dir) => {
    markDirty();
    setMeals((prev) => {
      const copy = [...prev];
      const meal = { ...copy[mealIdx] };
      const items = [...(meal.items || [])];
      const target = itemIdx + dir;
      if (target < 0 || target >= items.length) return prev;
      [items[itemIdx], items[target]] = [items[target], items[itemIdx]];
      copy[mealIdx] = { ...meal, items };
      return copy;
    });
  };

  const duplicateFoodItem = (mealIdx, itemIdx) => {
    markDirty();
    setMeals((prev) => {
      const copy = [...prev];
      const meal = { ...copy[mealIdx] };
      const items = [...(meal.items || [])];
      const dup = { ...items[itemIdx], _id: undefined };
      items.splice(itemIdx + 1, 0, dup);
      copy[mealIdx] = { ...meal, items };
      return copy;
    });
  };

  const removeFoodFromMeal = (mealIdx, itemIdx) => {
    markDirty();
    setMeals((prev) => {
      const copy = [...prev];
      const meal = { ...copy[mealIdx] };
      meal.items = (meal.items || []).filter((_, i) => i !== itemIdx);
      copy[mealIdx] = meal;
      return copy;
    });
  };

  // ── Alternatives ──────────────────────────────────────────────────────────
  const addAlternative = (mealIdx) => {
    if (!newAltName.trim()) return;
    markDirty();
    setMeals((prev) => {
      const copy = [...prev];
      const meal = { ...copy[mealIdx] };
      meal.alternatives = [...(meal.alternatives || []), { name: newAltName.trim(), foods: [] }];
      copy[mealIdx] = meal;
      return copy;
    });
    setNewAltName('');
    setIsAltModalOpen(false);
  };

  const removeAlternative = (mealIdx, altIdx) => {
    markDirty();
    setMeals((prev) => {
      const copy = [...prev];
      const meal = { ...copy[mealIdx] };
      meal.alternatives = (meal.alternatives || []).filter((_, i) => i !== altIdx);
      copy[mealIdx] = meal;
      return copy;
    });
  };

  // ── Custom Food ───────────────────────────────────────────────────────────
  const handleCreateCustomFood = async (e) => {
    e.preventDefault();
    if (!customFoodName.trim()) return;
    try {
      setCustomSaving(true);
      const res = await foodService.createFood({
        name: customFoodName.trim(),
        servingUnit: customServingUnit,
        servingSize: Number(customServingSize) || 100,
        calories: Number(customCalories) || 0,
        protein: Number(customProtein) || 0,
        carbs: Number(customCarbs) || 0,
        fat: Number(customFat) || 0,
        fiber: Number(customFiber) || 0,
        foodGroup: customFoodGroup,
      });
      if (res.success && res.data) {
        addFoodToMeal(targetMealIdx, res.data);
        setIsCustomFoodOpen(false);
        setCustomFoodName('');
        setSuccessMsg(`Custom food "${res.data.name}" created and added.`);
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create custom food.');
    } finally {
      setCustomSaving(false);
    }
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = (publishMode = false) => {
    if (!title.trim()) { setError('Diet plan title is required.'); return false; }
    if (publishMode) {
      if (Number(dailyCalories) <= 0) { setError('Daily calorie target must be greater than 0.'); return false; }
      const relevantMeals = planMode === 'weekly_7day' ? meals.filter((m) => m.day) : meals;
      if (relevantMeals.length === 0) { setError('Add at least one meal before publishing.'); return false; }
      const hasFoods = relevantMeals.some((m) => (m.items || []).length > 0);
      if (!hasFoods) { setError('Add at least one food item to a meal before publishing.'); return false; }
    }
    setError('');
    return true;
  };

  // ── Save / Publish ────────────────────────────────────────────────────────
  const handleSave = async (publishNow = false) => {
    if (!validate(publishNow)) return;
    try {
      publishNow ? setPublishing(true) : setSaving(true);
      setError('');

      const targetMemberId = memberId || member?._id || member?.user?._id;
      const payload = {
        title: title.trim(),
        goal, dietType, planMode, duration,
        dailyCalories: Number(dailyCalories),
        macros: {
          proteinGrams: Number(proteinGrams),
          carbsGrams: Number(carbsGrams),
          fatGrams: Number(fatGrams),
        },
        fiber: Number(fiberGrams),
        waterLiters: Number(waterLiters),
        optionalTargets: {
          sodiumMg: sodiumMg ? Number(sodiumMg) : null,
          sugarGrams: sugarGrams ? Number(sugarGrams) : null,
          potassiumMg: potassiumMg ? Number(potassiumMg) : null,
        },
        description: description.trim(),
        coachNotes: coachNotes.trim(),
        startDate,
        endDate: endDate || null,
        restrictions: {
          foodsToAvoid: foodsToAvoid ? foodsToAvoid.split(',').map((s) => s.trim()).filter(Boolean) : [],
          dietRestrictions: dietRestrictions ? dietRestrictions.split(',').map((s) => s.trim()).filter(Boolean) : [],
          cheatMealGuidance: cheatMealGuidance.trim(),
          mealPrepNotes: mealPrepNotes.trim(),
          supplementNotes: supplementNotes.trim(),
        },
        meals: meals.map((m) => ({
          ...m,
          items: (m.items || []).map((item) => {
            // Remove frontend-only _base field before saving
            const { _base, ...rest } = item;
            return rest;
          }),
        })),
        status: publishNow ? 'active' : 'draft',
        isActive: publishNow,
      };

      let res;
      if (isEditMode) {
        res = await dietService.updateDietPlan(planId, payload);
        if (publishNow && res.success) {
          res = await dietService.publishDietPlan(planId);
        }
      } else {
        res = await dietService.createTrainerDiet(targetMemberId, payload);
      }

      if (res.success) {
        setHasUnsavedChanges(false);
        setSuccessMsg(publishNow ? '🎉 Diet plan published and active for athlete!' : '✅ Diet plan draft saved.');
        setTimeout(() => navigate('/trainer/diets'), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to save diet plan. Please try again.');
    } finally {
      setSaving(false);
      setPublishing(false);
    }
  };

  // ── Displayed meals (filter by day in weekly mode) ────────────────────────
  const displayedMeals = planMode === 'weekly_7day'
    ? meals.filter((m) => m.day === activeDay)
    : meals;
  const displayedMealIndices = planMode === 'weekly_7day'
    ? meals.reduce((acc, m, i) => { if (m.day === activeDay) acc.push(i); return acc; }, [])
    : meals.map((_, i) => i);

  // ─────────────────────────────────── LOADING ──────────────────────────────
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="h-44 rounded-3xl bg-slate-100 dark:bg-slate-800/60 animate-pulse" />
        <div className="h-96 rounded-3xl bg-slate-100 dark:bg-slate-800/40 animate-pulse" />
      </div>
    );
  }

  // ─────────────────────── TEMPLATE SELECTOR (new plan only) ───────────────
  if (showTemplateSelect && !isEditMode) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link
            to="/trainer/diets"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-emerald-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">Manual Diet Plan Builder</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Athlete: <strong className="text-slate-800 dark:text-slate-200">{member?.user?.name || 'Selected Athlete'}</strong>
              {member?.fitnessGoal ? ` · Goal: ${member.fitnessGoal}` : ''}
            </p>
          </div>
        </div>

        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-500 flex items-center justify-center mx-auto">
              <Utensils className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Start Your Diet Plan</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Choose a template as a starting point or begin completely blank. All templates create an editable draft.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(DIET_TEMPLATES).map(([key, tmpl]) => (
              <button
                key={key}
                type="button"
                onClick={() => applyTemplate(key)}
                className={`p-5 rounded-2xl border-2 text-left transition-all hover:shadow-md group ${
                  key === 'blank'
                    ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
                    : 'border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-600 bg-white dark:bg-slate-800/60'
                }`}
              >
                <div className="text-2xl mb-2">{tmpl.icon}</div>
                <div className="font-bold text-slate-900 dark:text-white text-sm mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {tmpl.label}
                  {key === 'blank' && <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">Default</span>}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{tmpl.description}</p>
                {tmpl.meals?.length > 0 && (
                  <div className="mt-3 text-[11px] text-slate-400">
                    {tmpl.meals.length} starter meals · {tmpl.dailyCalories} kcal target
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────── TABS DEFINITION ─────────────────────────────────
  const TABS = [
    { key: 'overview', label: '1. Overview', icon: Info },
    { key: 'targets', label: '2. Nutrition Targets', icon: PieChart },
    { key: 'meals', label: '3. Meals & Foods', icon: Utensils },
    { key: 'restrictions', label: '4. Restrictions', icon: ShieldAlert },
    { key: 'preview', label: '5. Preview', icon: Eye },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-20">
      {/* ─── Top Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/trainer/diets"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-emerald-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
                {isEditMode ? 'Edit Nutrition Protocol' : 'Manual Diet Plan Builder'}
              </h1>
              {!showTemplateSelect && (
                <button
                  type="button"
                  onClick={() => !isEditMode && setShowTemplateSelect(true)}
                  title="Change template"
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${
                    isEditMode
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 cursor-pointer'
                  }`}
                >
                  {isEditMode ? 'Edit Mode' : 'Draft'}
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Athlete:{' '}
              <strong className="text-slate-800 dark:text-slate-200">
                {member?.user?.name || member?.name || 'Selected Athlete'}
              </strong>
              {member?.fitnessGoal ? ` · Goal: ${member.fitnessGoal}` : ''}
              {member?.weight ? ` · ${member.weight} kg` : ''}
              {member?.height ? ` · ${member.height} cm` : ''}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasUnsavedChanges && (
            <span className="text-amber-500 text-xs font-semibold animate-pulse">● Unsaved</span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSave(false)}
            loading={saving}
            disabled={saving || publishing}
            icon={Save}
          >
            Save Draft
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleSave(true)}
            loading={publishing}
            disabled={saving || publishing}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
            icon={Send}
          >
            Publish Plan
          </Button>
        </div>
      </div>

      {/* ─── Notifications ─── */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-sm flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── Live Macro Summary Card ─── */}
      <div className="p-4 md:p-5 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-md space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider text-[11px]">
            <PieChart className="w-4 h-4" />
            Daily Targets vs Actual Meal Composition
          </div>
          {macroCalc.isMismatch && (
            <div className="flex items-center gap-1.5 text-amber-400 text-[11px] font-semibold">
              <AlertTriangle className="w-3.5 h-3.5" />
              Macro mismatch detected
            </div>
          )}
        </div>

        {macroCalc.isMismatch && (
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <span>
              Macro calories ({macroCalc.proteinCals}P + {macroCalc.carbsCals}C + {macroCalc.fatCals}F ={' '}
              <strong>{macroCalc.totalMacroCals} kcal</strong>) differ from your daily target ({dailyCalories} kcal) by{' '}
              <strong>{macroCalc.diff} kcal</strong>. Adjust macros to match.
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
          {[
            { label: 'Calories', target: dailyCalories, actual: dailyActual.cals, unit: 'kcal', color: 'text-orange-400' },
            { label: `Protein (${macroCalc.pPct}%)`, target: proteinGrams, actual: dailyActual.prot, unit: 'g', color: 'text-rose-400' },
            { label: `Carbs (${macroCalc.cPct}%)`, target: carbsGrams, actual: dailyActual.carb, unit: 'g', color: 'text-amber-400' },
            { label: `Fat (${macroCalc.fPct}%)`, target: fatGrams, actual: dailyActual.fat, unit: 'g', color: 'text-cyan-400' },
            { label: 'Fiber', target: fiberGrams, actual: dailyActual.fiber, unit: 'g', color: 'text-green-400' },
          ].map(({ label, target, actual, unit, color }) => {
            const pct = target > 0 ? Math.round((actual / target) * 100) : 0;
            const status = pct < 85 ? 'below' : pct > 115 ? 'above' : 'ok';
            return (
              <div key={label} className="p-3 rounded-2xl bg-slate-800/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase block truncate">{label}</span>
                <div className={`text-lg font-black ${color}`}>
                  {actual}
                  <span className="text-xs text-slate-400 font-normal"> / {target}{unit}</span>
                </div>
                <span className={`text-[10px] font-semibold ${
                  status === 'ok' ? 'text-emerald-400' : status === 'below' ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {status === 'ok' ? '✓ On target' : status === 'below' ? '↓ Below' : '↑ Above'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Tabs Navigation ─── */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-none">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`pb-3 px-1 mr-6 transition-colors flex items-center gap-2 text-sm font-bold whitespace-nowrap shrink-0 ${
              activeTab === key
                ? 'border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
           TAB 1: OVERVIEW
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <h3 className="text-base font-black text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-500" />
            Diet Plan Overview
          </h3>

          {/* Member Context Bar */}
          {member && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                <span className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-600 font-black flex items-center justify-center">
                  {(member.user?.name || member.name || 'A').charAt(0).toUpperCase()}
                </span>
                {member.user?.name || member.name}
              </div>
              {member.membershipPlan?.name && (
                <span className="text-slate-500">Plan: <strong className="text-amber-600 dark:text-amber-400">{member.membershipPlan.name}</strong></span>
              )}
              {member.fitnessGoal && (
                <span className="text-slate-500">Goal: <strong>{member.fitnessGoal}</strong></span>
              )}
              {member.weight && (
                <span className="text-slate-500">Weight: <strong>{member.weight} kg</strong></span>
              )}
              {member.height && (
                <span className="text-slate-500">Height: <strong>{member.height} cm</strong></span>
              )}
              {member.dietPreference && (
                <span className="text-slate-500">Diet: <strong>{member.dietPreference}</strong></span>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Diet Plan Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => { setTitle(e.target.value); markDirty(); }}
                placeholder="e.g. High-Protein Muscle Building Protocol"
                className="w-full px-4 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nutritional Goal</label>
              <select
                value={goal}
                onChange={(e) => { setGoal(e.target.value); markDirty(); }}
                className="w-full px-3 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
              >
                {GOAL_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Diet Classification</label>
              <select
                value={dietType}
                onChange={(e) => { setDietType(e.target.value); markDirty(); }}
                className="w-full px-3 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
              >
                {DIET_TYPE_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Plan Structure Mode</label>
              <select
                value={planMode}
                onChange={(e) => { setPlanMode(e.target.value); markDirty(); }}
                className="w-full px-3 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="daily_standard">Daily Standard Plan (Same meals every day)</option>
                <option value="weekly_7day">7-Day Meal Plan (Varied daily schedule)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Duration</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => { setDuration(e.target.value); markDirty(); }}
                placeholder="e.g. 8 Weeks, 3 Months"
                className="w-full px-3 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); markDirty(); }}
                className="w-full px-3 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Optional End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); markDirty(); }}
                className="w-full px-3 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                General Diet Description & Strategy
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => { setDescription(e.target.value); markDirty(); }}
                placeholder="Describe the caloric approach, nutrient timing strategy, and reasoning behind this plan..."
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Coach Private Notes (Visible to member)
              </label>
              <textarea
                rows={3}
                value={coachNotes}
                onChange={(e) => { setCoachNotes(e.target.value); markDirty(); }}
                placeholder="e.g. Refeed on day 7. Increase calories by 200 after week 4. Avoid cheat meals during first month."
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
           TAB 2: NUTRITION TARGETS
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'targets' && (
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <h3 className="text-base font-black text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-emerald-500" />
            Prescribed Daily Nutrition Targets
          </h3>

          {/* Core Macros */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Core Macronutrient Targets</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: 'Daily Calories (kcal)', value: dailyCalories, setter: setDailyCalories, step: 50, bold: true, required: true, color: 'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30' },
                { label: 'Target Protein (g)', value: proteinGrams, setter: setProteinGrams, color: 'border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30' },
                { label: 'Target Carbohydrates (g)', value: carbsGrams, setter: setCarbsGrams, color: 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30' },
                { label: 'Target Healthy Fats (g)', value: fatGrams, setter: setFatGrams, color: 'border-cyan-200 dark:border-cyan-800 bg-cyan-50 dark:bg-cyan-950/30' },
                { label: 'Dietary Fiber (g)', value: fiberGrams, setter: setFiberGrams, color: 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30' },
                { label: 'Water Target (Liters)', value: waterLiters, setter: setWaterLiters, step: 0.5, color: 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30' },
              ].map(({ label, value, setter, step = 1, bold, required, color }) => (
                <div key={label} className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {label} {required && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="number"
                    step={step}
                    value={value}
                    onChange={(e) => { setter(e.target.value); markDirty(); }}
                    className={`w-full px-3 py-2.5 rounded-xl text-sm font-${bold ? 'black' : 'bold'} border focus:outline-none ${color}`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Macro split visual */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">Macro Split Breakdown</div>
            <div className="flex gap-2 h-6 rounded-full overflow-hidden mb-3">
              <div style={{ width: `${macroCalc.pPct}%` }} className="bg-rose-500 transition-all" title={`Protein ${macroCalc.pPct}%`} />
              <div style={{ width: `${macroCalc.cPct}%` }} className="bg-amber-400 transition-all" title={`Carbs ${macroCalc.cPct}%`} />
              <div style={{ width: `${macroCalc.fPct}%` }} className="bg-cyan-500 transition-all" title={`Fat ${macroCalc.fPct}%`} />
            </div>
            <div className="flex flex-wrap gap-4 text-xs">
              {[
                { label: 'Protein', pct: macroCalc.pPct, cals: macroCalc.proteinCals, color: 'bg-rose-500', grams: proteinGrams },
                { label: 'Carbohydrates', pct: macroCalc.cPct, cals: macroCalc.carbsCals, color: 'bg-amber-400', grams: carbsGrams },
                { label: 'Fat', pct: macroCalc.fPct, cals: macroCalc.fatCals, color: 'bg-cyan-500', grams: fatGrams },
              ].map(({ label, pct, cals, color, grams }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-sm ${color}`} />
                  <span className="text-slate-700 dark:text-slate-300">
                    <strong>{label}</strong>: {grams}g · {pct}% · {cals} kcal
                  </span>
                </div>
              ))}
              <div className="text-slate-500">
                Total macro calories: <strong className={macroCalc.isMismatch ? 'text-amber-500' : 'text-emerald-500'}>{macroCalc.totalMacroCals} kcal</strong>
              </div>
            </div>
          </div>

          {/* Optional targets */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Optional Micronutrient Targets</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Sugar (g)', value: sugarGrams, setter: setSugarGrams, placeholder: 'Optional' },
                { label: 'Sodium (mg)', value: sodiumMg, setter: setSodiumMg, placeholder: 'Optional' },
                { label: 'Potassium (mg)', value: potassiumMg, setter: setPotassiumMg, placeholder: 'Optional' },
              ].map(({ label, value, setter, placeholder }) => (
                <div key={label} className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{label}</label>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => { setter(e.target.value); markDirty(); }}
                    placeholder={placeholder}
                    className="w-full px-3 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
           TAB 3: MEALS & FOODS
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'meals' && (
        <div className="space-y-5">
          {/* 7-Day Mode Day Selector */}
          {planMode === 'weekly_7day' && (
            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-500" />
                  7-Day Meal Schedule
                </h4>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500">Copy to:</span>
                  <select
                    onChange={(e) => { if (e.target.value) { copyDayMeals(activeDay, e.target.value); e.target.value = ''; } }}
                    className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                    defaultValue=""
                  >
                    <option value="">Select day...</option>
                    {DAYS_OF_WEEK.filter((d) => d !== activeDay).map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day) => {
                  const dayMealCount = meals.filter((m) => m.day === day).length;
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setActiveDay(day)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        activeDay === day
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {day.slice(0, 3)}
                      {dayMealCount > 0 && (
                        <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                          activeDay === day ? 'bg-white/20' : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {dayMealCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Meals Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Utensils className="w-5 h-5 text-emerald-500" />
                {planMode === 'weekly_7day' ? `${activeDay}'s Meals` : 'Structured Meals'} ({displayedMeals.length})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Add meals, search foods, set quantities, and track nutrition totals.</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={addMeal}
              icon={Plus}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              + Add Meal
            </Button>
          </div>

          {/* No meals state */}
          {displayedMeals.length === 0 && (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 space-y-3">
              <Utensils className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
              <h4 className="font-bold text-slate-600 dark:text-slate-400">
                {planMode === 'weekly_7day' ? `No meals for ${activeDay} yet` : 'No meals added yet'}
              </h4>
              <p className="text-xs text-slate-400">Click "+ Add Meal" to start building the meal structure.</p>
            </div>
          )}

          {/* Meals List */}
          <div className="space-y-4">
            {displayedMealIndices.map((realIdx, displayOrder) => {
              const meal = meals[realIdx];
              const nutrition = calcMealNutrition(meal.items);
              const isCollapsed = collapsedMeals[realIdx];

              return (
                <div
                  key={meal._id || realIdx}
                  className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden"
                >
                  {/* Meal Header */}
                  <div className="p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black text-sm flex items-center justify-center shrink-0">
                        {displayOrder + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <input
                          type="text"
                          value={meal.mealName}
                          onChange={(e) => updateMealField(realIdx, 'mealName', e.target.value)}
                          placeholder="Meal name..."
                          className="font-black text-base bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-emerald-500 focus:outline-none text-slate-900 dark:text-white w-full"
                        />
                        <div className="flex flex-wrap items-center gap-3 mt-1">
                          <select
                            value={meal.category}
                            onChange={(e) => updateMealField(realIdx, 'category', e.target.value)}
                            className="bg-transparent border-none p-0 text-xs text-emerald-600 dark:text-emerald-400 font-bold focus:outline-none cursor-pointer"
                          >
                            {MEAL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            <Clock className="w-3 h-3" />
                            <input
                              type="time"
                              value={meal.time || '08:00'}
                              onChange={(e) => updateMealField(realIdx, 'time', e.target.value)}
                              className="bg-transparent border-none p-0 text-slate-600 dark:text-slate-300 text-xs font-semibold focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {/* Nutrition summary */}
                      {(meal.items || []).length > 0 && (
                        <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-[11px] font-mono text-slate-600 dark:text-slate-300">
                          <strong>{Math.round(nutrition.cals)}</strong> kcal ·{' '}
                          <strong>{Math.round(nutrition.prot)}g</strong> P ·{' '}
                          <strong>{Math.round(nutrition.carb)}g</strong> C ·{' '}
                          <strong>{Math.round(nutrition.fat)}g</strong> F
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <button type="button" disabled={displayOrder === 0} onClick={() => moveMeal(realIdx, -1)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 disabled:opacity-30" title="Move Up"><ArrowUp className="w-3.5 h-3.5" /></button>
                        <button type="button" disabled={displayOrder === displayedMealIndices.length - 1} onClick={() => moveMeal(realIdx, 1)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 disabled:opacity-30" title="Move Down"><ArrowDown className="w-3.5 h-3.5" /></button>
                        <button type="button" onClick={() => duplicateMeal(realIdx)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400" title="Duplicate Meal"><Copy className="w-3.5 h-3.5" /></button>
                        <button type="button" onClick={() => setCollapsedMeals((prev) => ({ ...prev, [realIdx]: !prev[realIdx] }))} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400" title="Collapse/Expand">
                          {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                        </button>
                        <button type="button" onClick={() => removeMeal(realIdx)} className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 text-red-500" title="Delete Meal"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  </div>

                  {/* Meal Body */}
                  {!isCollapsed && (
                    <div className="px-5 pb-5 space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                      {/* Meal notes */}
                      <input
                        type="text"
                        value={meal.notes || ''}
                        onChange={(e) => updateMealField(realIdx, 'notes', e.target.value)}
                        placeholder="Meal notes, preparation instructions, or timing advice..."
                        className="w-full px-3 py-1.5 rounded-xl text-xs border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 focus:outline-none"
                      />

                      {/* Food items */}
                      <div>
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="font-bold text-slate-600 dark:text-slate-400">
                            Food Items ({(meal.items || []).length})
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => { setTargetMealIdx(realIdx); setIsCustomFoodOpen(true); }}
                              className="text-xs font-semibold text-slate-500 hover:text-emerald-500 transition-colors"
                            >
                              + Custom Food
                            </button>
                            <button
                              type="button"
                              onClick={() => { setTargetMealIdx(realIdx); setIsFoodModalOpen(true); }}
                              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                            >
                              <Search className="w-3 h-3" />
                              Search Library
                            </button>
                          </div>
                        </div>

                        {(!meal.items || meal.items.length === 0) ? (
                          <div className="p-4 text-center bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                            No foods added.{' '}
                            <button type="button" onClick={() => { setTargetMealIdx(realIdx); setIsFoodModalOpen(true); }} className="font-bold text-emerald-500 hover:underline">
                              Search food library
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {meal.items.map((item, itemIdx) => (
                              <div
                                key={item._id || itemIdx}
                                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="font-bold text-sm text-slate-800 dark:text-slate-200 min-w-0 truncate">
                                    {item.foodName || item.food}
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button type="button" disabled={itemIdx === 0} onClick={() => moveFoodItem(realIdx, itemIdx, -1)} className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 disabled:opacity-30"><ArrowUp className="w-3 h-3" /></button>
                                    <button type="button" disabled={itemIdx === meal.items.length - 1} onClick={() => moveFoodItem(realIdx, itemIdx, 1)} className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 disabled:opacity-30"><ArrowDown className="w-3 h-3" /></button>
                                    <button type="button" onClick={() => duplicateFoodItem(realIdx, itemIdx)} className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400" title="Duplicate"><Copy className="w-3 h-3" /></button>
                                    <button type="button" onClick={() => removeFoodFromMeal(realIdx, itemIdx)} className="p-0.5 rounded hover:bg-red-50 dark:hover:bg-red-950/50 text-red-500"><X className="w-3 h-3" /></button>
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                  {/* Amount input */}
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      min={0}
                                      value={item.amount || ''}
                                      onChange={(e) => updateFoodItemAmount(realIdx, itemIdx, e.target.value)}
                                      className="w-16 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-center font-bold text-xs"
                                    />
                                    <select
                                      value={item.unit || 'g'}
                                      onChange={(e) => updateFoodItemUnit(realIdx, itemIdx, e.target.value)}
                                      className="px-1.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none"
                                    >
                                      {SERVING_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                  </div>

                                  {/* Nutrition display */}
                                  <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                                    <span className="text-slate-800 dark:text-slate-200 font-bold">{item.calories}</span> kcal ·{' '}
                                    <span className="text-rose-500">{item.protein}g P</span> ·{' '}
                                    <span className="text-amber-500">{item.carbs}g C</span> ·{' '}
                                    <span className="text-cyan-500">{item.fat}g F</span>
                                  </div>
                                </div>

                                {/* Food notes */}
                                <input
                                  type="text"
                                  value={item.notes || ''}
                                  onChange={(e) => updateFoodItemNotes(realIdx, itemIdx, e.target.value)}
                                  placeholder="Notes (e.g., boiled, with skin, substitute: tofu)..."
                                  className="w-full px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-[11px] text-slate-500 focus:outline-none"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Meal Alternatives */}
                      <div>
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="font-bold text-slate-500 dark:text-slate-400">
                            Meal Alternatives ({(meal.alternatives || []).length})
                          </span>
                          <button
                            type="button"
                            onClick={() => { setTargetAltMealIdx(realIdx); setIsAltModalOpen(true); }}
                            className="text-xs font-semibold text-indigo-500 hover:text-indigo-600"
                          >
                            + Add Alternative
                          </button>
                        </div>
                        {(meal.alternatives || []).length > 0 && (
                          <div className="space-y-2">
                            {meal.alternatives.map((alt, altIdx) => (
                              <div key={altIdx} className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 text-xs">
                                <div className="flex items-center gap-2">
                                  <Layers className="w-3.5 h-3.5 text-indigo-500" />
                                  <span className="font-semibold text-indigo-700 dark:text-indigo-300">{alt.name}</span>
                                </div>
                                <button type="button" onClick={() => removeAlternative(realIdx, altIdx)} className="text-red-400 hover:text-red-600">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
           TAB 4: RESTRICTIONS & GUIDELINES
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'restrictions' && (
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <h3 className="text-base font-black text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-500" />
            Dietary Restrictions & Coach Guidelines
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Foods to Avoid (comma separated)
              </label>
              <textarea
                rows={3}
                value={foodsToAvoid}
                onChange={(e) => { setFoodsToAvoid(e.target.value); markDirty(); }}
                placeholder="e.g. Refined Sugar, Deep Fried Foods, Soda, White Bread, Alcohol"
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Allergies & Dietary Constraints (comma separated)
              </label>
              <textarea
                rows={3}
                value={dietRestrictions}
                onChange={(e) => { setDietRestrictions(e.target.value); markDirty(); }}
                placeholder="e.g. Lactose Intolerant, Peanut Allergy, No Shellfish, No Pork"
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Cheat Meal Guidance
              </label>
              <textarea
                rows={3}
                value={cheatMealGuidance}
                onChange={(e) => { setCheatMealGuidance(e.target.value); markDirty(); }}
                placeholder="e.g. One cheat meal allowed on Sunday. Keep under 800 kcal. Prefer nutrient-dense cheats."
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Meal Prep Notes
              </label>
              <textarea
                rows={3}
                value={mealPrepNotes}
                onChange={(e) => { setMealPrepNotes(e.target.value); markDirty(); }}
                placeholder="e.g. Cook brown rice in bulk on Sunday. Marinate chicken overnight. Pre-portion meals in containers."
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Supplementation Protocols
              </label>
              <textarea
                rows={3}
                value={supplementNotes}
                onChange={(e) => { setSupplementNotes(e.target.value); markDirty(); }}
                placeholder="e.g. 5g Creatine Monohydrate post-workout. 30g Whey protein within 30 min post-training. Omega-3 1000mg with dinner. Vitamin D3 2000 IU morning."
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
           TAB 5: MEMBER VIEW PREVIEW
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'preview' && (
        <div className="space-y-6">
          <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 text-white shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1),transparent_60%)]" />
            <div className="relative space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-200">
                <Eye className="w-4 h-4" />
                Simulated Member Nutrition Dashboard
              </div>
              <h2 className="text-2xl md:text-3xl font-black">{title || 'Untitled Diet Plan'}</h2>
              {description && <p className="text-sm text-emerald-100 max-w-2xl leading-relaxed">{description}</p>}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                {[
                  { label: 'Goal', value: goal },
                  { label: 'Type', value: dietType },
                  { label: 'Duration', value: duration },
                  { label: 'Daily Calories', value: `${dailyCalories} kcal` },
                  { label: 'Water', value: `${waterLiters} L/day` },
                ].map(({ label, value }) => (
                  <span key={label} className="px-3 py-1 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
                    {label}: <strong>{value}</strong>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Macro Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Protein', value: `${proteinGrams}g`, sub: `${macroCalc.pPct}%`, color: 'from-rose-500 to-pink-600' },
              { label: 'Carbohydrates', value: `${carbsGrams}g`, sub: `${macroCalc.cPct}%`, color: 'from-amber-500 to-yellow-500' },
              { label: 'Healthy Fats', value: `${fatGrams}g`, sub: `${macroCalc.fPct}%`, color: 'from-cyan-500 to-blue-500' },
              { label: 'Fiber', value: `${fiberGrams}g`, sub: 'daily', color: 'from-green-500 to-emerald-500' },
            ].map(({ label, value, sub, color }) => (
              <div key={label} className={`p-4 rounded-2xl bg-gradient-to-br ${color} text-white text-center shadow-md`}>
                <div className="text-xs font-bold opacity-80 uppercase tracking-wider">{label}</div>
                <div className="text-2xl font-black">{value}</div>
                <div className="text-xs opacity-70">{sub}</div>
              </div>
            ))}
          </div>

          {/* Meal Cards Preview */}
          <div className="space-y-4">
            <h3 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-wider flex items-center gap-2">
              <Utensils className="w-4 h-4 text-emerald-500" />
              {planMode === 'weekly_7day' ? `${activeDay} Meal Plan` : 'Daily Meal Plan'}
            </h3>
            {displayedMeals.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                No meals configured yet. Add meals in the "Meals & Foods" tab.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedMeals.map((meal, idx) => {
                  const mealNutr = calcMealNutrition(meal.items);
                  return (
                    <div key={idx} className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <Utensils className="w-4 h-4 text-emerald-500" />
                          <div>
                            <div className="font-black text-slate-900 dark:text-white text-sm">{meal.mealName}</div>
                            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">{meal.category}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          {meal.time && <div className="text-xs text-slate-400 font-semibold">{meal.time}</div>}
                          <div className="text-xs text-orange-500 font-bold">{Math.round(mealNutr.cals)} kcal</div>
                        </div>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        {(meal.items || []).length === 0 ? (
                          <p className="text-slate-400 italic">No food items added</p>
                        ) : (
                          meal.items.map((item, iIdx) => (
                            <div key={iIdx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{item.foodName || item.food}</span>
                              <span className="text-slate-500 font-mono text-[11px]">{item.quantity} · {item.calories} cal</span>
                            </div>
                          ))
                        )}
                      </div>
                      {meal.notes && (
                        <p className="text-[11px] text-slate-400 italic border-t border-slate-100 dark:border-slate-800 pt-2">{meal.notes}</p>
                      )}
                      {(meal.alternatives || []).length > 0 && (
                        <div className="text-[11px] text-indigo-500 font-semibold">
                          {meal.alternatives.length} alternative(s) available
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Restrictions Preview */}
          {(foodsToAvoid || dietRestrictions || supplementNotes || cheatMealGuidance) && (
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                Dietary Guidelines
              </h4>
              {foodsToAvoid && (
                <div className="text-xs space-y-1">
                  <div className="font-bold text-slate-600 dark:text-slate-400">Foods to Avoid:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {foodsToAvoid.split(',').map((f, i) => f.trim() && (
                      <span key={i} className="px-2 py-0.5 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40">{f.trim()}</span>
                    ))}
                  </div>
                </div>
              )}
              {dietRestrictions && (
                <p className="text-xs text-slate-600 dark:text-slate-400"><strong>Restrictions:</strong> {dietRestrictions}</p>
              )}
              {supplementNotes && (
                <p className="text-xs text-slate-600 dark:text-slate-400"><strong>Supplements:</strong> {supplementNotes}</p>
              )}
              {cheatMealGuidance && (
                <p className="text-xs text-slate-600 dark:text-slate-400"><strong>Cheat Meals:</strong> {cheatMealGuidance}</p>
              )}
            </div>
          )}

          {/* Coach Notes Preview */}
          {coachNotes && (
            <div className="p-5 rounded-3xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
              <h4 className="font-black text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Coach Instructions
              </h4>
              <p className="text-sm text-emerald-700 dark:text-emerald-300 leading-relaxed">{coachNotes}</p>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
           FOOD SELECTOR MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {isFoodModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[85vh] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <Apple className="w-5 h-5 text-emerald-500" />
                  Select from Nutritional Library
                </h3>
                <p className="text-xs text-slate-400">Adding to: <strong>{meals[targetMealIdx]?.mealName}</strong></p>
              </div>
              <button type="button" onClick={() => setIsFoodModalOpen(false)} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filters */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search: chicken, rice, oats, paneer, whey..."
                  value={searchFood}
                  onChange={(e) => setSearchFood(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Food Group</label>
                  <select value={filterFoodGroup} onChange={(e) => setFilterFoodGroup(e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                    {FOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Diet Preference</label>
                  <select value={filterDietPref} onChange={(e) => setFilterDietPref(e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                    {DIET_PREFERENCE_FILTERS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Exclude Allergen</label>
                  <select value={filterAllergen} onChange={(e) => setFilterAllergen(e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                    {ALLERGEN_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Food Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {foodLoading ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  Loading food library...
                </div>
              ) : foodLibrary.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs space-y-3">
                  <Apple className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
                  <p>No matching foods found.</p>
                  <button type="button" onClick={() => { setIsFoodModalOpen(false); setIsCustomFoodOpen(true); }} className="text-emerald-500 font-bold hover:underline">
                    + Create custom food item
                  </button>
                </div>
              ) : (
                foodLibrary.map((f) => (
                  <div key={f._id} className="p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500/50 transition-colors flex items-center justify-between gap-3 bg-white dark:bg-slate-900">
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-slate-900 dark:text-white truncate">{f.name}</div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-0.5 font-mono">
                        <span className="text-emerald-500 font-semibold">{f.calories} kcal</span>
                        <span>·</span>
                        <span className="text-rose-500">{f.protein}g P</span>
                        <span>·</span>
                        <span className="text-amber-500">{f.carbs}g C</span>
                        <span>·</span>
                        <span className="text-cyan-500">{f.fat}g F</span>
                        <span className="text-slate-300">per {f.servingSize} {f.servingUnit}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{f.foodGroup} {f.isCustom ? '· Custom' : ''}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { addFoodToMeal(targetMealIdx, f); setIsFoodModalOpen(false); }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shrink-0 transition-colors"
                    >
                      + Add
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <button type="button" onClick={() => { setIsFoodModalOpen(false); setIsCustomFoodOpen(true); }} className="text-xs font-semibold text-slate-500 hover:text-emerald-500">
                + Create custom food
              </button>
              <button type="button" onClick={() => setIsFoodModalOpen(false)} className="px-4 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
           CUSTOM FOOD MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {isCustomFoodOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                Create Custom Food Item
              </h3>
              <button type="button" onClick={() => setIsCustomFoodOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomFood} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Food Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customFoodName}
                  onChange={(e) => setCustomFoodName(e.target.value)}
                  placeholder="e.g. Quinoa Salad with Chia Seeds"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Food Group</label>
                  <select value={customFoodGroup} onChange={(e) => setCustomFoodGroup(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none">
                    {FOOD_GROUPS.filter((g) => g !== 'All').map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Serving Unit</label>
                  <select value={customServingUnit} onChange={(e) => setCustomServingUnit(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none">
                    {SERVING_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Serving Size (per {customServingUnit})
                </label>
                <input
                  type="number"
                  value={customServingSize}
                  onChange={(e) => setCustomServingSize(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { label: 'Calories', value: customCalories, setter: setCustomCalories },
                  { label: 'Protein (g)', value: customProtein, setter: setCustomProtein },
                  { label: 'Carbs (g)', value: customCarbs, setter: setCustomCarbs },
                  { label: 'Fat (g)', value: customFat, setter: setCustomFat },
                  { label: 'Fiber (g)', value: customFiber, setter: setCustomFiber },
                ].map(({ label, value, setter }) => (
                  <div key={label}>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">{label}</label>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => setter(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center font-bold focus:outline-none"
                    />
                  </div>
                ))}
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <Button variant="outline" size="sm" type="button" onClick={() => setIsCustomFoodOpen(false)}>Cancel</Button>
                <Button variant="primary" size="sm" type="submit" loading={customSaving} className="bg-emerald-600 hover:bg-emerald-700">
                  Save & Add to Meal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
           ADD ALTERNATIVE MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {isAltModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 dark:text-white text-base">Add Meal Alternative</h3>
              <button type="button" onClick={() => setIsAltModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-xs text-slate-500">Provide a name for this meal alternative (e.g., "Vegetarian Option", "Paneer Substitute").</p>
            <input
              type="text"
              value={newAltName}
              onChange={(e) => setNewAltName(e.target.value)}
              placeholder="e.g. Tofu & Quinoa Bowl"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && addAlternative(targetAltMealIdx)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsAltModalOpen(false)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={() => addAlternative(targetAltMealIdx)} className="bg-indigo-600 hover:bg-indigo-700">
                Add Alternative
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 z-40">
        <div className="text-xs text-slate-500">
          {meals.length} meal{meals.length !== 1 ? 's' : ''} · {dailyActual.cals}/{dailyCalories} kcal tracked
          {hasUnsavedChanges && <span className="text-amber-500 font-semibold ml-2">● Unsaved changes</span>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleSave(false)} loading={saving} disabled={saving || publishing} icon={Save}>
            Save Draft
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleSave(true)}
            loading={publishing}
            disabled={saving || publishing}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            icon={Send}
          >
            Publish Plan
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TrainerDietBuilder;
