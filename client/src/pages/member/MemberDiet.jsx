import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Apple, Flame, Droplets, Calendar, Target, User, Clock, Utensils, History,
  FileText, AlertCircle, Beef, Wheat, PieChart, ArrowRight, UserCheck, Copy,
  CheckCircle2, CheckSquare, Square, Save, Plus, ChevronRight, ShieldCheck,
  Edit3, X, Search, Filter, ChevronDown, ChevronUp, ArrowUp, ArrowDown,
  Trash2, Star, Sparkles, RefreshCw, BookOpen, Layers, AlertTriangle,
  TrendingUp, BarChart2, Droplet, Info,
} from 'lucide-react';
import dietService from '../../services/dietService';
import foodService from '../../services/foodService';
import memberService from '../../services/memberService';
import Button from '../../components/common/Button';

// ─── Constants ────────────────────────────────────────────────────────────────
const GOAL_OPTIONS = [
  'General Fitness', 'Weight Loss', 'Muscle Gain', 'Weight Maintenance',
  'Body Recomposition', 'Athletic Performance', 'Healthy Eating', 'Custom',
];
const DIET_TYPE_OPTIONS = [
  'Balanced', 'High Protein', 'Low Carb', 'Vegetarian', 'Vegan',
  'Eggetarian', 'Keto', 'Mediterranean', 'High Carb', 'Custom',
];
const MEAL_CATEGORIES = [
  'Breakfast', 'Morning Snack', 'Lunch', 'Pre-Workout', 'Post-Workout',
  'Evening Snack', 'Dinner', 'Before Bed', 'Custom Meal',
];
const FOOD_GROUPS = [
  'All', 'Protein', 'Carbohydrates', 'Healthy Fats', 'Vegetables',
  'Fruits', 'Dairy', 'Grains', 'Legumes', 'Nuts & Seeds', 'Supplements', 'Beverages', 'Other',
];
const DIET_FILTERS = [
  'All', 'Vegetarian', 'Vegan', 'Eggetarian', 'Non-Vegetarian',
  'High Protein', 'Low Carb', 'Gluten-Free', 'Lactose-Free',
];
const SERVING_UNITS = ['g', 'kg', 'ml', 'L', 'piece', 'slice', 'cup', 'bowl', 'tbsp', 'tsp', 'scoop', 'serving'];
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const createMeal = (category = 'Breakfast') => ({
  mealName: category,
  category,
  time: '',
  notes: '',
  caloriesTarget: null,
  items: [],
  alternatives: [],
});

const calcMealNutr = (items = []) => ({
  cals: Math.round(items.reduce((s, i) => s + (Number(i.calories) || 0), 0)),
  prot: Math.round(items.reduce((s, i) => s + (Number(i.protein) || 0), 0) * 10) / 10,
  carb: Math.round(items.reduce((s, i) => s + (Number(i.carbs) || 0), 0) * 10) / 10,
  fat: Math.round(items.reduce((s, i) => s + (Number(i.fat) || 0), 0) * 10) / 10,
});

// ─── Progress Bar Component ───────────────────────────────────────────────────
const MacroBar = ({ label, consumed, target, unit, color }) => {
  const pct = target > 0 ? Math.min(100, Math.round((consumed / target) * 100)) : 0;
  const status = pct < 70 ? 'below' : pct > 110 ? 'over' : pct >= 90 ? 'great' : 'ok';
  const statusColor = status === 'great' ? 'text-emerald-500' : status === 'over' ? 'text-red-400' : status === 'below' ? 'text-slate-400' : 'text-amber-500';
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="font-bold text-slate-600 dark:text-slate-300">{label}</span>
        <span className={`font-bold ${statusColor}`}>
          {consumed}{unit} / {target}{unit} ({pct}%)
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color} ${pct > 100 ? 'opacity-80' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const MemberDiet = () => {
  const todayDate = useMemo(() => new Date().toISOString().split('T')[0], []);

  // ─ Plan data
  const [diet, setDiet] = useState(null);
  const [customDiet, setCustomDiet] = useState(null);
  const [history, setHistory] = useState([]);
  const [nutritionHistory, setNutritionHistory] = useState([]);
  const [trainer, setTrainer] = useState(null);

  // ─ UI state
  const [activePlanType, setActivePlanType] = useState('coach');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showNutritionHistory, setShowNutritionHistory] = useState(false);
  const [selectedHistoryDiet, setSelectedHistoryDiet] = useState(null);

  // ─ Today's log state
  const [completedMeals, setCompletedMeals] = useState({});
  const [mealNotes, setMealNotes] = useState({});
  const [waterConsumedLiters, setWaterConsumedLiters] = useState(0);
  const [memberDailyNote, setMemberDailyNote] = useState('');
  const [savingLog, setSavingLog] = useState(false);
  const [todayLogId, setTodayLogId] = useState(null);

  // ─ Custom plan builder state
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);
  const [builderStep, setBuilderStep] = useState(1); // 1-Goal, 2-Pref, 3-Targets, 4-Meals, 5-Review
  const [customPlanDraft, setCustomPlanDraft] = useState({
    title: 'My Personal Nutrition Plan',
    goal: 'General Fitness',
    dietType: 'Balanced',
    planMode: 'daily_standard',
    dailyCalories: 2000,
    proteinGrams: 150,
    carbsGrams: 220,
    fatGrams: 65,
    fiberGrams: 30,
    waterLiters: 3,
    meals: [],
  });
  const [savingCustom, setSavingCustom] = useState(false);
  const [duplicatingCoach, setDuplicatingCoach] = useState(false);

  // ─ Custom plan edit mode
  const [isEditingCustom, setIsEditingCustom] = useState(false);
  const [editPlanDraft, setEditPlanDraft] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // ─ Weekly plan day
  const [activeDay, setActiveDay] = useState(DAYS_OF_WEEK[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]);

  // ─ Meal action state
  const [expandedMeals, setExpandedMeals] = useState({});
  const [mealFormOpen, setMealFormOpen] = useState(false);
  const [editingMealIdx, setEditingMealIdx] = useState(null);
  const [mealForm, setMealForm] = useState({ mealName: '', category: 'Breakfast', time: '', notes: '' });

  // ─ Food modal
  const [foodModalOpen, setFoodModalOpen] = useState(false);
  const [foodModalMealIdx, setFoodModalMealIdx] = useState(0);
  const [foodLibrary, setFoodLibrary] = useState([]);
  const [foodLoading, setFoodLoading] = useState(false);
  const [foodSearch, setFoodSearch] = useState('');
  const [foodGroupFilter, setFoodGroupFilter] = useState('All');
  const [foodDietFilter, setFoodDietFilter] = useState('All');
  const searchTimer = useRef(null);

  // ─ Custom food modal
  const [customFoodOpen, setCustomFoodOpen] = useState(false);
  const [customFoodForMealIdx, setCustomFoodForMealIdx] = useState(0);
  const [cfName, setCfName] = useState('');
  const [cfGroup, setCfGroup] = useState('Protein');
  const [cfAmount, setCfAmount] = useState(100);
  const [cfUnit, setCfUnit] = useState('g');
  const [cfCals, setCfCals] = useState(150);
  const [cfProt, setCfProt] = useState(10);
  const [cfCarb, setCfCarb] = useState(15);
  const [cfFat, setCfFat] = useState(5);
  const [cfFiber, setCfFiber] = useState(0);
  const [cfSaving, setCfSaving] = useState(false);

  // ─ Food quantity modal
  const [quantityModalOpen, setQuantityModalOpen] = useState(false);
  const [pendingFood, setPendingFood] = useState(null);
  const [foodAmount, setFoodAmount] = useState(100);
  const [foodUnit, setFoodUnit] = useState('g');
  const [foodNoteInModal, setFoodNoteInModal] = useState('');

  // ─ Swap food modal
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [swapTargetMealIdx, setSwapTargetMealIdx] = useState(0);
  const [swapTargetItemIdx, setSwapTargetItemIdx] = useState(0);
  const [swapResults, setSwapResults] = useState([]);

  // ─── Data Fetch ───────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [coachRes, customRes, trainerRes, logRes, histRes] = await Promise.allSettled([
        dietService.getMyDiet(),
        dietService.getMyCustomDiet(),
        memberService.getMyTrainer(),
        dietService.getDietLogs({ date: todayDate }),
        dietService.getMyDietHistory(),
      ]);

      if (trainerRes.status === 'fulfilled' && trainerRes.value?.success) {
        setTrainer(trainerRes.value.trainer || null);
      }
      if (coachRes.status === 'fulfilled' && coachRes.value?.success) {
        setDiet(coachRes.value.data || null);
      }
      if (customRes.status === 'fulfilled' && customRes.value?.success && customRes.value.data) {
        setCustomDiet(customRes.value.data);
        setActivePlanType(prev => prev === 'coach' ? prev : 'custom');
      }
      if (histRes.status === 'fulfilled' && histRes.value?.success) {
        setHistory(histRes.value.data || []);
      }

      // Load today's log
      if (logRes.status === 'fulfilled' && logRes.value?.success && logRes.value.data?.length > 0) {
        const todayLog = logRes.value.data[0];
        setTodayLogId(todayLog._id);
        const compMap = {};
        const notesMap = {};
        (todayLog.mealLogs || []).forEach((ml) => {
          compMap[ml.mealName] = ml.completed;
          if (ml.notes) notesMap[ml.mealName] = ml.notes;
        });
        setCompletedMeals(compMap);
        setMealNotes(notesMap);
        setWaterConsumedLiters(todayLog.waterConsumedLiters || 0);
        setMemberDailyNote(todayLog.memberNote || '');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load nutrition data.');
    } finally {
      setLoading(false);
    }
  }, [todayDate]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ─── Food Library ─────────────────────────────────────────────────────────
  const fetchFoods = useCallback(async () => {
    try {
      setFoodLoading(true);
      const params = {};
      if (foodSearch) params.search = foodSearch;
      if (foodGroupFilter !== 'All') params.foodGroup = foodGroupFilter;
      if (foodDietFilter !== 'All') params.dietCategory = foodDietFilter;
      const res = await foodService.getFoods(params);
      if (res.success) setFoodLibrary(res.data || []);
    } catch { /* non-critical */ }
    finally { setFoodLoading(false); }
  }, [foodSearch, foodGroupFilter, foodDietFilter]);

  useEffect(() => {
    if (foodModalOpen || swapModalOpen) {
      clearTimeout(searchTimer.current);
      searchTimer.current = setTimeout(fetchFoods, 300);
    }
    return () => clearTimeout(searchTimer.current);
  }, [foodModalOpen, swapModalOpen, fetchFoods]);

  // ─── Computed consumed nutrition from completed meals ─────────────────────
  const consumedNutrition = useMemo(() => {
    const currentPlan = activePlanType === 'custom' && customDiet ? customDiet : diet;
    if (!currentPlan) return { cals: 0, prot: 0, carb: 0, fat: 0 };
    return (currentPlan.meals || []).reduce((acc, meal) => {
      if (!completedMeals[meal.mealName]) return acc;
      const n = calcMealNutr(meal.items);
      return { cals: acc.cals + n.cals, prot: acc.prot + n.prot, carb: acc.carb + n.carb, fat: acc.fat + n.fat };
    }, { cals: 0, prot: 0, carb: 0, fat: 0 });
  }, [completedMeals, diet, customDiet, activePlanType]);

  const currentPlan = activePlanType === 'custom' && customDiet ? customDiet : diet;
  const planMacros = useMemo(() => {
    if (!currentPlan) return { pPct: 0, cPct: 0, fPct: 0 };
    const p = (currentPlan.macros?.proteinGrams || 0) * 4;
    const c = (currentPlan.macros?.carbsGrams || 0) * 4;
    const f = (currentPlan.macros?.fatGrams || 0) * 9;
    const t = p + c + f;
    return { pPct: t ? Math.round((p / t) * 100) : 0, cPct: t ? Math.round((c / t) * 100) : 0, fPct: t ? Math.round((f / t) * 100) : 0 };
  }, [currentPlan]);

  // ─── Meal Completion Toggle ───────────────────────────────────────────────
  const toggleMealComplete = (mealName) => {
    setCompletedMeals((prev) => ({ ...prev, [mealName]: !prev[mealName] }));
  };

  // ─── Water ────────────────────────────────────────────────────────────────
  const addWater = (amount) => {
    setWaterConsumedLiters((prev) => Math.round((prev + amount) * 100) / 100);
  };
  const resetWater = () => setWaterConsumedLiters(0);

  // ─── Save Nutrition Log ───────────────────────────────────────────────────
  const handleSaveLog = async () => {
    if (!currentPlan) return;
    try {
      setSavingLog(true);
      setError('');
      const mealLogs = (currentPlan.meals || []).map((m) => {
        const n = calcMealNutr(m.items);
        return {
          mealName: m.mealName,
          completed: Boolean(completedMeals[m.mealName]),
          caloriesConsumed: completedMeals[m.mealName] ? n.cals : 0,
          proteinConsumed: completedMeals[m.mealName] ? n.prot : 0,
          carbsConsumed: completedMeals[m.mealName] ? n.carb : 0,
          fatConsumed: completedMeals[m.mealName] ? n.fat : 0,
          notes: mealNotes[m.mealName] || '',
        };
      });

      const res = await dietService.logDietCompletion({
        dietPlanId: currentPlan._id,
        date: todayDate,
        mealLogs,
        waterConsumedLiters,
        memberNote: memberDailyNote,
        planType: activePlanType === 'custom' ? 'custom' : 'coach',
        caloriesConsumed: consumedNutrition.cals,
        proteinConsumed: consumedNutrition.prot,
        carbsConsumed: consumedNutrition.carb,
        fatConsumed: consumedNutrition.fat,
      });

      if (res.success) {
        setSuccessMsg("Today's nutrition log saved! 🎉");
        setTimeout(() => setSuccessMsg(''), 3500);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to save nutrition log. Please try again.');
    } finally {
      setSavingLog(false);
    }
  };

  // ─── Duplicate Coach Plan → Custom ───────────────────────────────────────
  const handleCustomizeCopy = async () => {
    try {
      setDuplicatingCoach(true);
      const res = await dietService.duplicateMemberCustomDiet();
      if (res.success) {
        setCustomDiet(res.data);
        setActivePlanType('custom');
        setSuccessMsg('Coach plan copied to your personal plan. Start editing freely!');
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to copy coach plan.');
    } finally {
      setDuplicatingCoach(false);
    }
  };

  // ─── Save Custom Plan (from builder) ─────────────────────────────────────
  const handleSaveCustomPlan = async () => {
    if (!customPlanDraft.title.trim()) {
      setError('Plan name is required.');
      return;
    }
    try {
      setSavingCustom(true);
      const payload = {
        title: customPlanDraft.title,
        goal: customPlanDraft.goal,
        dietType: customPlanDraft.dietType,
        planMode: customPlanDraft.planMode,
        dailyCalories: Number(customPlanDraft.dailyCalories),
        macros: {
          proteinGrams: Number(customPlanDraft.proteinGrams),
          carbsGrams: Number(customPlanDraft.carbsGrams),
          fatGrams: Number(customPlanDraft.fatGrams),
        },
        fiber: Number(customPlanDraft.fiberGrams),
        waterLiters: Number(customPlanDraft.waterLiters),
        meals: customPlanDraft.meals,
      };
      const res = await dietService.createMyCustomDiet(payload);
      if (res.success) {
        setCustomDiet(res.data);
        setActivePlanType('custom');
        setShowCustomBuilder(false);
        setSuccessMsg('Your personal nutrition plan is ready!');
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to save your plan. Please try again.');
    } finally {
      setSavingCustom(false);
    }
  };

  // ─── Save Custom Plan Edit ────────────────────────────────────────────────
  const handleSaveEdit = async () => {
    if (!customDiet) return;
    try {
      setSavingEdit(true);
      const payload = {
        title: editPlanDraft.title,
        goal: editPlanDraft.goal,
        dietType: editPlanDraft.dietType,
        planMode: editPlanDraft.planMode,
        dailyCalories: Number(editPlanDraft.dailyCalories),
        macros: {
          proteinGrams: Number(editPlanDraft.proteinGrams),
          carbsGrams: Number(editPlanDraft.carbsGrams),
          fatGrams: Number(editPlanDraft.fatGrams),
        },
        fiber: Number(editPlanDraft.fiberGrams),
        waterLiters: Number(editPlanDraft.waterLiters),
        meals: editPlanDraft.meals,
      };
      const res = await dietService.updateMyCustomDiet(customDiet._id, payload);
      if (res.success) {
        setCustomDiet(res.data);
        setIsEditingCustom(false);
        setEditPlanDraft(null);
        setSuccessMsg('Personal plan saved!');
        setTimeout(() => setSuccessMsg(''), 3500);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to save changes. Please try again.');
    } finally {
      setSavingEdit(false);
    }
  };

  // ─── Edit mode helpers ────────────────────────────────────────────────────
  const startEditing = () => {
    if (!customDiet) return;
    setEditPlanDraft({
      title: customDiet.title,
      goal: customDiet.goal,
      dietType: customDiet.dietType,
      planMode: customDiet.planMode || 'daily_standard',
      dailyCalories: customDiet.dailyCalories,
      proteinGrams: customDiet.macros?.proteinGrams || 150,
      carbsGrams: customDiet.macros?.carbsGrams || 220,
      fatGrams: customDiet.macros?.fatGrams || 65,
      fiberGrams: customDiet.fiber || 30,
      waterLiters: customDiet.waterLiters || 3,
      meals: JSON.parse(JSON.stringify(customDiet.meals || [])),
    });
    setIsEditingCustom(true);
  };

  const cancelEditing = () => {
    setIsEditingCustom(false);
    setEditPlanDraft(null);
  };

  // Current draft for meal operations (builder or editor)
  const activeDraft = isEditingCustom ? editPlanDraft : customPlanDraft;
  const setActiveDraft = isEditingCustom ? setEditPlanDraft : setCustomPlanDraft;

  // ─── Meal CRUD (in draft/editor) ─────────────────────────────────────────
  const openAddMeal = () => {
    setEditingMealIdx(null);
    setMealForm({ mealName: '', category: 'Breakfast', time: '', notes: '' });
    setMealFormOpen(true);
  };

  const openEditMeal = (idx) => {
    const meals = activeDraft.meals;
    setEditingMealIdx(idx);
    setMealForm({
      mealName: meals[idx].mealName,
      category: meals[idx].category,
      time: meals[idx].time || '',
      notes: meals[idx].notes || '',
    });
    setMealFormOpen(true);
  };

  const handleMealFormSave = () => {
    if (!mealForm.mealName.trim()) return;
    setActiveDraft((prev) => {
      const meals = [...prev.meals];
      const meal = {
        mealName: mealForm.mealName.trim(),
        category: mealForm.category,
        time: mealForm.time,
        notes: mealForm.notes,
        items: editingMealIdx !== null ? meals[editingMealIdx].items : [],
        alternatives: editingMealIdx !== null ? meals[editingMealIdx].alternatives : [],
      };
      if (editingMealIdx !== null) {
        meals[editingMealIdx] = meal;
      } else {
        meals.push(meal);
      }
      return { ...prev, meals };
    });
    setMealFormOpen(false);
  };

  const deleteMeal = (idx) => {
    setActiveDraft((prev) => ({ ...prev, meals: prev.meals.filter((_, i) => i !== idx) }));
  };

  const moveMeal = (idx, dir) => {
    setActiveDraft((prev) => {
      const meals = [...prev.meals];
      const t = idx + dir;
      if (t < 0 || t >= meals.length) return prev;
      [meals[idx], meals[t]] = [meals[t], meals[idx]];
      return { ...prev, meals };
    });
  };

  // ─── Add food from library to meal ───────────────────────────────────────
  const selectFoodForQuantity = (food) => {
    setPendingFood(food);
    setFoodAmount(food.servingSize || 100);
    setFoodUnit(food.servingUnit || 'g');
    setFoodNoteInModal('');
    setFoodModalOpen(false);
    setQuantityModalOpen(true);
  };

  const confirmAddFood = () => {
    if (!pendingFood) return;
    const base = pendingFood.servingSize || 100;
    const ratio = base > 0 ? foodAmount / base : 1;
    const item = {
      food: pendingFood._id || null,
      foodName: pendingFood.name,
      quantity: `${foodAmount} ${foodUnit}`,
      amount: foodAmount,
      unit: foodUnit,
      calories: Math.round((pendingFood.calories || 0) * ratio),
      protein: Math.round((pendingFood.protein || 0) * ratio * 10) / 10,
      carbs: Math.round((pendingFood.carbs || 0) * ratio * 10) / 10,
      fat: Math.round((pendingFood.fat || 0) * ratio * 10) / 10,
      fiber: Math.round((pendingFood.fiber || 0) * ratio * 10) / 10,
      notes: foodNoteInModal,
    };
    setActiveDraft((prev) => {
      const meals = [...prev.meals];
      meals[foodModalMealIdx] = {
        ...meals[foodModalMealIdx],
        items: [...(meals[foodModalMealIdx].items || []), item],
      };
      return { ...prev, meals };
    });
    setPendingFood(null);
    setQuantityModalOpen(false);
  };

  const removeFood = (mealIdx, itemIdx) => {
    setActiveDraft((prev) => {
      const meals = [...prev.meals];
      meals[mealIdx] = {
        ...meals[mealIdx],
        items: meals[mealIdx].items.filter((_, i) => i !== itemIdx),
      };
      return { ...prev, meals };
    });
  };

  const updateFoodAmount = (mealIdx, itemIdx, newAmt, newUnit) => {
    setActiveDraft((prev) => {
      const meals = [...prev.meals];
      const items = [...meals[mealIdx].items];
      const item = { ...items[itemIdx] };
      const amt = Number(newAmt) || 0;
      item.amount = amt;
      item.unit = newUnit || item.unit;
      item.quantity = `${amt} ${item.unit}`;
      // Note: ratio recalc requires base data — if not stored, just update quantity
      items[itemIdx] = item;
      meals[mealIdx] = { ...meals[mealIdx], items };
      return { ...prev, meals };
    });
  };

  // ─── Custom Food ──────────────────────────────────────────────────────────
  const handleAddCustomFood = async (e) => {
    e.preventDefault();
    if (!cfName.trim()) return;
    try {
      setCfSaving(true);
      const res = await foodService.createFood({
        name: cfName.trim(),
        foodGroup: cfGroup,
        servingSize: Number(cfAmount) || 100,
        servingUnit: cfUnit,
        calories: Number(cfCals) || 0,
        protein: Number(cfProt) || 0,
        carbs: Number(cfCarb) || 0,
        fat: Number(cfFat) || 0,
        fiber: Number(cfFiber) || 0,
      });
      if (res.success && res.data) {
        const food = res.data;
        const item = {
          food: food._id,
          foodName: food.name,
          quantity: `${food.servingSize} ${food.servingUnit}`,
          amount: food.servingSize,
          unit: food.servingUnit,
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fat: food.fat,
          fiber: food.fiber,
          notes: '',
        };
        setActiveDraft((prev) => {
          const meals = [...prev.meals];
          meals[customFoodForMealIdx] = {
            ...meals[customFoodForMealIdx],
            items: [...(meals[customFoodForMealIdx].items || []), item],
          };
          return { ...prev, meals };
        });
        setCustomFoodOpen(false);
        setCfName('');
        setSuccessMsg(`Custom food "${food.name}" created and added!`);
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create custom food.');
    } finally {
      setCfSaving(false);
    }
  };

  // ─── Food Swap ────────────────────────────────────────────────────────────
  const openSwap = (mealIdx, itemIdx) => {
    setSwapTargetMealIdx(mealIdx);
    setSwapTargetItemIdx(itemIdx);
    setFoodSearch('');
    setSwapResults([]);
    setSwapModalOpen(true);
  };

  const confirmSwap = (newFood) => {
    const base = newFood.servingSize || 100;
    const newItem = {
      food: newFood._id || null,
      foodName: newFood.name,
      quantity: `${base} ${newFood.servingUnit || 'g'}`,
      amount: base,
      unit: newFood.servingUnit || 'g',
      calories: newFood.calories,
      protein: newFood.protein,
      carbs: newFood.carbs,
      fat: newFood.fat,
      fiber: newFood.fiber,
      notes: '',
    };
    setActiveDraft((prev) => {
      const meals = [...prev.meals];
      const items = [...meals[swapTargetMealIdx].items];
      items[swapTargetItemIdx] = newItem;
      meals[swapTargetMealIdx] = { ...meals[swapTargetMealIdx], items };
      return { ...prev, meals };
    });
    setSwapModalOpen(false);
    setSuccessMsg(`Swapped to ${newFood.name}!`);
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  // ─── Use Coach Targets ────────────────────────────────────────────────────
  const useCoachTargets = () => {
    if (!diet) return;
    const update = {
      dailyCalories: diet.dailyCalories || 2000,
      proteinGrams: diet.macros?.proteinGrams || 150,
      carbsGrams: diet.macros?.carbsGrams || 220,
      fatGrams: diet.macros?.fatGrams || 65,
      fiberGrams: diet.fiber || 30,
      waterLiters: diet.waterLiters || 3,
    };
    setActiveDraft((prev) => ({ ...prev, ...update }));
  };

  // ─── Copy day meals in weekly mode ────────────────────────────────────────
  const copyDayTo = (fromDay, toDay) => {
    setActiveDraft((prev) => {
      const source = prev.meals.filter((m) => m.day === fromDay);
      const copied = source.map((m) => ({ ...m, _id: undefined, day: toDay }));
      const rest = prev.meals.filter((m) => m.day !== toDay);
      return { ...prev, meals: [...rest, ...copied] };
    });
  };

  // ─── Displayed meals (weekly filter) ─────────────────────────────────────
  const getDraftMeals = (draft) => {
    if (!draft) return [];
    const mode = draft.planMode || 'daily_standard';
    if (mode === 'weekly_7day') return draft.meals.filter((m) => m.day === activeDay);
    return draft.meals;
  };

  // ─── Macro summary for draft ──────────────────────────────────────────────
  const draftMacroSummary = useMemo(() => {
    const draft = showCustomBuilder ? customPlanDraft : (isEditingCustom ? editPlanDraft : null);
    if (!draft) return null;
    const p = Number(draft.proteinGrams) * 4;
    const c = Number(draft.carbsGrams) * 4;
    const f = Number(draft.fatGrams) * 9;
    const total = p + c + f;
    const target = Number(draft.dailyCalories);
    return {
      pPct: total ? Math.round((p / total) * 100) : 0,
      cPct: total ? Math.round((c / total) * 100) : 0,
      fPct: total ? Math.round((f / total) * 100) : 0,
      totalMacroCals: total,
      diff: Math.abs(total - target),
      mismatch: total > 0 && target > 0 && Math.abs(total - target) > target * 0.08,
    };
  }, [showCustomBuilder, customPlanDraft, isEditingCustom, editPlanDraft]);

  // ─────────────────────────────────── LOADING ──────────────────────────────
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="h-48 rounded-3xl bg-slate-100 dark:bg-slate-800/60 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800/40 animate-pulse" />)}
        </div>
        <div className="h-64 rounded-3xl bg-slate-100 dark:bg-slate-800/30 animate-pulse" />
      </div>
    );
  }

  // ─────────────── EMPTY STATE: no trainer, no plan ─────────────────────────
  if (!diet && !customDiet && !showCustomBuilder) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <div className="p-8 md:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-5 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-500 mx-auto flex items-center justify-center">
            <Apple className="w-8 h-8" />
          </div>
          {!trainer ? (
            <div className="space-y-4">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">Trainer Assignment Required</h2>
              <p className="text-sm text-slate-500 max-w-md mx-auto">Your personalized nutrition plan will be designed once a certified coach is assigned.</p>
              <Link to="/member/trainer"><Button variant="primary" size="sm" icon={ArrowRight} iconPosition="right">View Trainer Status</Button></Link>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="space-y-2">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Nutrition Plan Being Prepared</h2>
                <p className="text-sm text-slate-500 max-w-md mx-auto">{trainer.name} is preparing your customized nutrition protocol.</p>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-left space-y-2">
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Create Your Personal Plan Now</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Build a personal nutrition plan while waiting for your coach's prescription.</p>
                <Button
                  variant="primary"
                  size="sm"
                  icon={Plus}
                  onClick={() => setShowCustomBuilder(true)}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Create Personal Plan
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────── CUSTOM BUILDER ───────────────────────────
  if (showCustomBuilder) {
    return (
      <div className="max-w-3xl mx-auto space-y-5 pb-20">
        {/* Builder Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => setShowCustomBuilder(false)} className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 hover:text-emerald-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">Build Your Personal Nutrition Plan</h1>
            <p className="text-xs text-slate-400 mt-0.5">This plan is separate from your coach-prescribed plan</p>
          </div>
        </div>

        {/* Health disclaimer */}
        <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 flex items-start gap-2 text-xs text-blue-600 dark:text-blue-400">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Personal plans are for general wellness tracking and do not replace professional medical or dietary advice.</span>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {[
            { n: 1, label: 'Goal' }, { n: 2, label: 'Preference' }, { n: 3, label: 'Targets' },
            { n: 4, label: 'Meals' }, { n: 5, label: 'Review' },
          ].map(({ n, label }) => (
            <React.Fragment key={n}>
              <button
                type="button"
                onClick={() => setBuilderStep(n)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                  builderStep === n ? 'bg-emerald-600 text-white shadow-md' : builderStep > n ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${builderStep > n ? 'bg-emerald-500 text-white' : builderStep === n ? 'bg-white/30' : 'bg-slate-200 dark:bg-slate-700'}`}>
                  {builderStep > n ? '✓' : n}
                </span>
                {label}
              </button>
              {n < 5 && <div className="h-0.5 w-4 bg-slate-200 dark:bg-slate-700 shrink-0" />}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Goal */}
        {builderStep === 1 && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5 shadow-sm">
            <h2 className="font-black text-lg text-slate-900 dark:text-white">What's your nutrition goal?</h2>
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">Plan Name</label>
              <input
                type="text"
                value={customPlanDraft.title}
                onChange={(e) => setCustomPlanDraft((p) => ({ ...p, title: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {GOAL_OPTIONS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setCustomPlanDraft((p) => ({ ...p, goal: g }))}
                  className={`p-3 rounded-2xl border-2 text-sm font-bold text-left transition-all ${
                    customPlanDraft.goal === g ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400' : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-300'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Diet Preference */}
        {builderStep === 2 && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5 shadow-sm">
            <h2 className="font-black text-lg text-slate-900 dark:text-white">Choose your diet preference</h2>
            <p className="text-xs text-slate-500">Used to filter foods when adding items to meals.</p>
            <div className="grid grid-cols-2 gap-3">
              {DIET_TYPE_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setCustomPlanDraft((p) => ({ ...p, dietType: d }))}
                  className={`p-3 rounded-2xl border-2 text-sm font-bold text-left transition-all ${
                    customPlanDraft.dietType === d ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400' : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-300'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">Plan Mode</label>
              <div className="flex gap-3">
                {[{ v: 'daily_standard', l: 'Daily Standard' }, { v: 'weekly_7day', l: '7-Day Weekly' }].map(({ v, l }) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setCustomPlanDraft((p) => ({ ...p, planMode: v }))}
                    className={`flex-1 p-3 rounded-2xl border-2 text-sm font-bold transition-all ${
                      customPlanDraft.planMode === v ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-300'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Nutrition Targets */}
        {builderStep === 3 && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-black text-lg text-slate-900 dark:text-white">Set your daily targets</h2>
              {diet && (
                <button type="button" onClick={useCoachTargets} className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
                  <Copy className="w-3.5 h-3.5" />
                  Use Coach Targets
                </button>
              )}
            </div>

            {draftMacroSummary?.mismatch && (
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Your macro calories ({draftMacroSummary.totalMacroCals} kcal) differ from daily target by {draftMacroSummary.diff} kcal.</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Daily Calories (kcal)', key: 'dailyCalories', step: 50, color: 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20' },
                { label: 'Protein (g)', key: 'proteinGrams', color: 'border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/20' },
                { label: 'Carbohydrates (g)', key: 'carbsGrams', color: 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20' },
                { label: 'Healthy Fats (g)', key: 'fatGrams', color: 'border-cyan-200 bg-cyan-50 dark:border-cyan-800 dark:bg-cyan-950/20' },
                { label: 'Fiber (g)', key: 'fiberGrams', color: 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20' },
                { label: 'Water (Liters)', key: 'waterLiters', step: 0.5, color: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20' },
              ].map(({ label, key, step = 1, color }) => (
                <div key={key} className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">{label}</label>
                  <input
                    type="number"
                    step={step}
                    value={customPlanDraft[key]}
                    onChange={(e) => setCustomPlanDraft((p) => ({ ...p, [key]: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-xl border text-sm font-bold text-slate-900 dark:text-white focus:outline-none ${color}`}
                  />
                </div>
              ))}
            </div>

            {/* Macro Split */}
            {draftMacroSummary && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Macro Split Preview</div>
                <div className="flex h-5 rounded-full overflow-hidden gap-0.5">
                  <div style={{ width: `${draftMacroSummary.pPct}%` }} className="bg-rose-500" title={`Protein ${draftMacroSummary.pPct}%`} />
                  <div style={{ width: `${draftMacroSummary.cPct}%` }} className="bg-amber-400" title={`Carbs ${draftMacroSummary.cPct}%`} />
                  <div style={{ width: `${draftMacroSummary.fPct}%` }} className="bg-cyan-500" title={`Fat ${draftMacroSummary.fPct}%`} />
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                  {[
                    { l: 'Protein', pct: draftMacroSummary.pPct, color: 'bg-rose-500' },
                    { l: 'Carbs', pct: draftMacroSummary.cPct, color: 'bg-amber-400' },
                    { l: 'Fat', pct: draftMacroSummary.fPct, color: 'bg-cyan-500' },
                  ].map(({ l, pct, color }) => (
                    <span key={l} className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-sm ${color}`} />{l} {pct}%
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Meals */}
        {builderStep === 4 && (
          <div className="space-y-4">
            {/* Weekly day switcher */}
            {customPlanDraft.planMode === 'weekly_7day' && (
              <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Day Schedule</h4>
                  <button type="button" onClick={() => copyDayTo(activeDay, DAYS_OF_WEEK[(DAYS_OF_WEEK.indexOf(activeDay) + 1) % 7])} className="text-xs font-bold text-emerald-500 hover:underline">
                    Copy to next day
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((d) => (
                    <button key={d} type="button" onClick={() => setActiveDay(d)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${activeDay === d ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                      {d.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Utensils className="w-5 h-5 text-emerald-500" />
                Your Meals ({getDraftMeals(customPlanDraft).length})
              </h3>
              <Button variant="primary" size="sm" icon={Plus} onClick={openAddMeal} className="bg-emerald-600 hover:bg-emerald-700">
                + Add Meal
              </Button>
            </div>

            {getDraftMeals(customPlanDraft).length === 0 && (
              <div className="p-10 text-center bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 space-y-3">
                <Utensils className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
                <p className="text-sm font-semibold text-slate-500">No meals yet. Add your first meal.</p>
              </div>
            )}

            {customPlanDraft.meals.map((meal, realIdx) => {
              if (customPlanDraft.planMode === 'weekly_7day' && meal.day !== activeDay) return null;
              const displayIdx = customPlanDraft.meals.indexOf(meal);
              const n = calcMealNutr(meal.items);
              return (
                <BuilderMealCard
                  key={realIdx}
                  meal={meal}
                  mealIdx={displayIdx}
                  nutrition={n}
                  onEdit={() => openEditMeal(displayIdx)}
                  onDelete={() => deleteMeal(displayIdx)}
                  onMoveUp={() => moveMeal(displayIdx, -1)}
                  onMoveDown={() => moveMeal(displayIdx, 1)}
                  onAddFood={() => { setFoodModalMealIdx(displayIdx); setFoodModalOpen(true); }}
                  onCustomFood={() => { setCustomFoodForMealIdx(displayIdx); setCustomFoodOpen(true); }}
                  onRemoveFood={(itemIdx) => removeFood(displayIdx, itemIdx)}
                  onSwapFood={(itemIdx) => openSwap(displayIdx, itemIdx)}
                  onUpdateFoodAmount={(itemIdx, amt, unit) => updateFoodAmount(displayIdx, itemIdx, amt, unit)}
                />
              );
            })}
          </div>
        )}

        {/* Step 5: Review */}
        {builderStep === 5 && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5 shadow-sm">
            <h2 className="font-black text-lg text-slate-900 dark:text-white">Review Your Plan</h2>
            <div className="space-y-3 text-sm">
              {[
                { label: 'Plan Name', value: customPlanDraft.title },
                { label: 'Goal', value: customPlanDraft.goal },
                { label: 'Diet Type', value: customPlanDraft.dietType },
                { label: 'Plan Mode', value: customPlanDraft.planMode === 'weekly_7day' ? '7-Day Weekly' : 'Daily Standard' },
                { label: 'Daily Calories', value: `${customPlanDraft.dailyCalories} kcal` },
                { label: 'Protein', value: `${customPlanDraft.proteinGrams}g` },
                { label: 'Carbs', value: `${customPlanDraft.carbsGrams}g` },
                { label: 'Fat', value: `${customPlanDraft.fatGrams}g` },
                { label: 'Water', value: `${customPlanDraft.waterLiters}L/day` },
                { label: 'Meals', value: `${customPlanDraft.meals.length} meal${customPlanDraft.meals.length !== 1 ? 's' : ''}` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800 text-xs">
                  <span className="font-bold text-slate-600 dark:text-slate-400">{label}</span>
                  <span className="font-black text-slate-900 dark:text-white">{value}</span>
                </div>
              ))}
            </div>
            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Builder Navigation */}
        <div className="flex justify-between items-center">
          <div>
            {builderStep > 1 && (
              <button type="button" onClick={() => setBuilderStep((p) => p - 1)} className="text-sm font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">← Back</button>
            )}
          </div>
          <div className="flex gap-3">
            {builderStep < 5 ? (
              <Button variant="primary" size="sm" onClick={() => setBuilderStep((p) => p + 1)} className="bg-emerald-600 hover:bg-emerald-700">
                Next →
              </Button>
            ) : (
              <Button variant="primary" size="sm" onClick={handleSaveCustomPlan} loading={savingCustom} className="bg-emerald-600 hover:bg-emerald-700" icon={Save}>
                Save My Plan
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────── MAIN DASHBOARD ───────────────────────────
  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-20">

      {/* ─── Notifications ─── */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* ─── Plan Header Banner ─── */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-800 text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_60%)]" />
        <div className="relative space-y-4">
          {/* Plan type toggle + actions */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Tab Toggle */}
              <div className="flex items-center bg-white/15 backdrop-blur-md p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActivePlanType('coach')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${activePlanType === 'coach' ? 'bg-white text-emerald-900 shadow' : 'text-emerald-100 hover:text-white'}`}
                >
                  Coach Plan
                </button>
                {customDiet && (
                  <button
                    type="button"
                    onClick={() => setActivePlanType('custom')}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${activePlanType === 'custom' ? 'bg-white text-emerald-900 shadow' : 'text-emerald-100 hover:text-white'}`}
                  >
                    My Custom Plan
                  </button>
                )}
              </div>

              {/* Status badge */}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-xs font-bold text-emerald-100">
                {activePlanType === 'coach' ? (
                  <><ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />Official Coach Diet</>
                ) : (
                  <><Star className="w-3.5 h-3.5 text-yellow-300" />My Custom Plan</>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {activePlanType === 'coach' && !customDiet && diet && (
                <button
                  type="button"
                  onClick={handleCustomizeCopy}
                  disabled={duplicatingCoach}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-bold backdrop-blur-md transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {duplicatingCoach ? 'Copying...' : 'Customize a Copy'}
                </button>
              )}
              {activePlanType === 'custom' && customDiet && !isEditingCustom && (
                <button
                  type="button"
                  onClick={startEditing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-bold backdrop-blur-md transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Plan
                </button>
              )}
              {activePlanType === 'custom' && isEditingCustom && (
                <>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    disabled={savingEdit}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-emerald-900 text-xs font-bold shadow transition-colors hover:bg-emerald-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {savingEdit ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-bold backdrop-blur-md transition-colors"
                  >
                    Cancel
                  </button>
                </>
              )}
              {!customDiet && (
                <button
                  type="button"
                  onClick={() => { setShowCustomBuilder(true); setBuilderStep(1); }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-bold backdrop-blur-md transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Personal Plan
                </button>
              )}
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowHistory(!showHistory)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-semibold backdrop-blur-md transition-colors"
                >
                  <History className="w-3.5 h-3.5" />
                  {showHistory ? 'Hide History' : 'Plan History'}
                </button>
              )}
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            {currentPlan?.title || 'Nutrition Dashboard'}
          </h1>
          {currentPlan?.notes && <p className="text-sm text-emerald-100/90 max-w-2xl">{currentPlan.notes}</p>}

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-emerald-100">
            {currentPlan?.goal && <span className="flex items-center gap-1.5"><Target className="w-3.5 h-3.5 text-emerald-300" />Goal: <strong className="text-white">{currentPlan.goal}</strong></span>}
            {currentPlan?.dietType && <span className="flex items-center gap-1.5"><Utensils className="w-3.5 h-3.5 text-emerald-300" />Type: <strong className="text-white">{currentPlan.dietType}</strong></span>}
            {activePlanType === 'coach' && currentPlan?.trainer && <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-emerald-300" />Prescribed by: <strong className="text-white">{currentPlan.trainer.name}</strong></span>}
            {activePlanType === 'coach' && <span className="flex items-center gap-1.5 text-amber-200 text-[10px] bg-black/20 px-2 py-0.5 rounded-full"><ShieldCheck className="w-3 h-3" />Read-only · Trainer protected</span>}
          </div>
        </div>
      </div>

      {/* ─── My Custom Plan Empty State ─── */}
      {activePlanType === 'custom' && !customDiet && (
        <div className="p-8 md:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-500 flex items-center justify-center mx-auto">
            <Sparkles className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Create Your Personal Nutrition Plan</h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto">Build a meal plan based on your food preferences, schedule and nutrition targets — without changing your coach-prescribed plan.</p>
          </div>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => { setShowCustomBuilder(true); setBuilderStep(1); }}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Start From Scratch
            </Button>
            {diet && (
              <Button
                variant="outline"
                size="sm"
                icon={Copy}
                onClick={handleCustomizeCopy}
                loading={duplicatingCoach}
              >
                Customize Coach Plan
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ─── Plan History ─── */}
      {showHistory && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-500" />
              Plan History ({history.length})
            </h2>
            <button onClick={() => setShowHistory(false)} className="text-xs font-semibold text-emerald-500 hover:underline">Close</button>
          </div>
          <div className="space-y-3">
            {history.map((h) => (
              <div key={h._id} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 dark:text-white">{h.title}</h3>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${h.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                    {h.status || (h.isActive ? 'Active' : 'Archived')}
                  </span>
                </div>
                <div className="text-xs text-slate-400 flex flex-wrap gap-4">
                  <span>Goal: <strong>{h.goal}</strong></span>
                  <span>Calories: <strong>{h.dailyCalories} kcal</strong></span>
                  <span>Meals: <strong>{h.meals?.length || 0}</strong></span>
                  <span>By: <strong>{h.trainer?.name || 'Coach'}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedHistoryDiet(selectedHistoryDiet?._id === h._id ? null : h)}
                  className="text-xs font-bold text-emerald-500 hover:underline"
                >
                  {selectedHistoryDiet?._id === h._id ? '▲ Hide Meals' : '▼ Show Meals'}
                </button>
                {selectedHistoryDiet?._id === h._id && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-1 text-xs">
                    {(h.meals || []).map((m, i) => (
                      <div key={i} className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-700/50">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{m.mealName}</span>
                        <span className="text-slate-400">{m.items?.length || 0} foods</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── ACTIVE PLAN CONTENT ─── */}
      {currentPlan && !showHistory && (
        <div className="space-y-5">
          {/* ─── Daily Nutrition Progress ─── */}
          <div className="p-5 md:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-emerald-500" />
                Today's Progress
              </h3>
              <span className="text-xs text-slate-400">{todayDate}</span>
            </div>
            <div className="space-y-3">
              <MacroBar label="Calories" consumed={consumedNutrition.cals} target={currentPlan.dailyCalories || 2000} unit=" kcal" color="bg-orange-500" />
              <MacroBar label="Protein" consumed={consumedNutrition.prot} target={currentPlan.macros?.proteinGrams || 150} unit="g" color="bg-rose-500" />
              <MacroBar label="Carbohydrates" consumed={consumedNutrition.carb} target={currentPlan.macros?.carbsGrams || 220} unit="g" color="bg-amber-400" />
              <MacroBar label="Fat" consumed={consumedNutrition.fat} target={currentPlan.macros?.fatGrams || 65} unit="g" color="bg-cyan-500" />
              <MacroBar label="Hydration" consumed={waterConsumedLiters} target={currentPlan.waterLiters || 3} unit=" L" color="bg-blue-500" />
            </div>
          </div>

          {/* ─── Macro Cards Grid ─── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Daily Calories', value: currentPlan.dailyCalories || 2000, unit: 'kcal', icon: Flame, color: 'text-orange-500' },
              { label: `Protein (${planMacros.pPct}%)`, value: currentPlan.macros?.proteinGrams || 150, unit: 'g', icon: Beef, color: 'text-rose-500' },
              { label: `Carbs (${planMacros.cPct}%)`, value: currentPlan.macros?.carbsGrams || 220, unit: 'g', icon: Wheat, color: 'text-amber-500' },
              { label: `Fat (${planMacros.fPct}%)`, value: currentPlan.macros?.fatGrams || 65, unit: 'g', icon: PieChart, color: 'text-cyan-500' },
            ].map(({ label, value, unit, icon: Icon, color }) => (
              <div key={label} className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
                <div className={`flex items-center gap-2 text-xs font-semibold text-slate-500`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                  <span>{label}</span>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {value} <span className="text-xs font-bold text-slate-400">{unit}</span>
                </div>
              </div>
            ))}
          </div>

          {/* ─── Hydration + Save Log ─── */}
          <div className="p-5 md:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-500 uppercase tracking-wider">
                  <Droplets className="w-4 h-4" />
                  Hydration Tracker
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {waterConsumedLiters}
                  <span className="text-sm font-semibold text-slate-400"> / {currentPlan.waterLiters || 3} L</span>
                </div>
                {waterConsumedLiters >= (currentPlan.waterLiters || 3) && (
                  <div className="text-xs text-emerald-500 font-semibold">✓ Daily target reached!</div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {[{ l: '+250ml', v: 0.25 }, { l: '+500ml', v: 0.5 }, { l: '+1L', v: 1 }].map(({ l, v }) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => addWater(v)}
                    className="px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                  >
                    {l}
                  </button>
                ))}
                <button type="button" onClick={resetWater} className="px-2 py-1.5 rounded-xl text-xs text-slate-400 hover:text-red-500 transition-colors" title="Reset water">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Daily Notes */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">Personal Nutrition Note for Today</label>
              <textarea
                rows={2}
                value={memberDailyNote}
                onChange={(e) => setMemberDailyNote(e.target.value)}
                placeholder="e.g. Felt hungry before workout. Skipped evening snack."
                className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none resize-none"
              />
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveLog}
                loading={savingLog}
                className="bg-emerald-600 hover:bg-emerald-700"
                icon={Save}
              >
                Save Today's Log
              </Button>
            </div>
          </div>

          {/* ─── Edit Mode: Targets (in edit, show top summary editable) ─── */}
          {isEditingCustom && editPlanDraft && (
            <div className="p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 shadow-sm space-y-4">
              <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-500" />
                Edit Mode Active — Plan Settings
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Title', key: 'title', type: 'text' },
                  { label: 'Goal', key: 'goal', type: 'select', opts: GOAL_OPTIONS },
                  { label: 'Diet Type', key: 'dietType', type: 'select', opts: DIET_TYPE_OPTIONS },
                  { label: 'Calories (kcal)', key: 'dailyCalories', type: 'number', step: 50 },
                  { label: 'Protein (g)', key: 'proteinGrams', type: 'number' },
                  { label: 'Carbs (g)', key: 'carbsGrams', type: 'number' },
                  { label: 'Fat (g)', key: 'fatGrams', type: 'number' },
                  { label: 'Water (L)', key: 'waterLiters', type: 'number', step: 0.5 },
                ].map(({ label, key, type, opts, step = 1 }) => (
                  <div key={key} className={key === 'title' ? 'sm:col-span-3' : ''}>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">{label}</label>
                    {type === 'select' ? (
                      <select
                        value={editPlanDraft[key]}
                        onChange={(e) => setEditPlanDraft((p) => ({ ...p, [key]: e.target.value }))}
                        className="w-full px-2 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none"
                      >
                        {opts.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input
                        type={type}
                        step={step}
                        value={editPlanDraft[key]}
                        onChange={(e) => setEditPlanDraft((p) => ({ ...p, [key]: e.target.value }))}
                        className="w-full px-2 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold focus:outline-none"
                      />
                    )}
                  </div>
                ))}
              </div>
              {diet && (
                <button type="button" onClick={useCoachTargets} className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
                  <Copy className="w-3 h-3" /> Copy Coach Targets
                </button>
              )}
            </div>
          )}

          {/* ─── Coach Notes (if any) ─── */}
          {currentPlan?.coachNotes && activePlanType === 'coach' && (
            <div className="p-5 rounded-3xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 space-y-2">
              <h4 className="font-black text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Coach Instructions
              </h4>
              <p className="text-sm text-emerald-700 dark:text-emerald-300 leading-relaxed">{currentPlan.coachNotes}</p>
            </div>
          )}

          {/* ─── Restrictions (coach plan only) ─── */}
          {activePlanType === 'coach' && currentPlan?.restrictions?.foodsToAvoid?.length > 0 && (
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
              <h4 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Dietary Guidelines
              </h4>
              <div className="text-xs space-y-2">
                {currentPlan.restrictions.foodsToAvoid.length > 0 && (
                  <div>
                    <span className="font-bold text-slate-600 dark:text-slate-400">Foods to Avoid: </span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {currentPlan.restrictions.foodsToAvoid.map((f, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40">{f}</span>
                      ))}
                    </div>
                  </div>
                )}
                {currentPlan.restrictions.supplementNotes && (
                  <p className="text-slate-600 dark:text-slate-400"><strong>Supplements:</strong> {currentPlan.restrictions.supplementNotes}</p>
                )}
              </div>
            </div>
          )}

          {/* ─── Meals Section ─── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Utensils className="w-5 h-5 text-emerald-500" />
                {activePlanType === 'coach' ? 'Prescribed Meals' : isEditingCustom ? 'Edit Your Meals' : 'Your Meals'}
                {' '}({currentPlan.meals?.length || 0})
              </h2>
              {activePlanType === 'custom' && isEditingCustom && (
                <Button variant="primary" size="sm" icon={Plus} onClick={openAddMeal} className="bg-emerald-600 hover:bg-emerald-700">
                  + Add Meal
                </Button>
              )}
            </div>

            {/* Weekly day switch for custom plan in view mode */}
            {activePlanType === 'custom' && customDiet?.planMode === 'weekly_7day' && !isEditingCustom && (
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((d) => {
                  const cnt = (customDiet.meals || []).filter((m) => m.day === d).length;
                  return (
                    <button key={d} type="button" onClick={() => setActiveDay(d)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${activeDay === d ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                      {d.slice(0, 3)} {cnt > 0 ? `(${cnt})` : ''}
                    </button>
                  );
                })}
              </div>
            )}

            {/* No meals state */}
            {(currentPlan.meals || []).length === 0 && (
              <div className="p-10 text-center bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 space-y-3">
                <Utensils className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
                <p className="text-sm text-slate-400">
                  {activePlanType === 'coach' ? 'Your coach has not added meals yet.' : 'No meals added yet. Click "Edit Plan" to start building.'}
                </p>
              </div>
            )}

            {/* Meal Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(isEditingCustom ? editPlanDraft.meals : currentPlan.meals || []).map((meal, idx) => {
                // Weekly filter
                if ((isEditingCustom ? editPlanDraft.planMode : customDiet?.planMode) === 'weekly_7day' && meal.day !== activeDay) return null;

                const isCompleted = Boolean(completedMeals[meal.mealName]);
                const isExpanded = expandedMeals[idx] !== false;
                const nutrition = calcMealNutr(meal.items);

                if (isEditingCustom) {
                  return (
                    <BuilderMealCard
                      key={idx}
                      meal={meal}
                      mealIdx={idx}
                      nutrition={nutrition}
                      onEdit={() => openEditMeal(idx)}
                      onDelete={() => deleteMeal(idx)}
                      onMoveUp={() => moveMeal(idx, -1)}
                      onMoveDown={() => moveMeal(idx, 1)}
                      onAddFood={() => { setFoodModalMealIdx(idx); setFoodModalOpen(true); }}
                      onCustomFood={() => { setCustomFoodForMealIdx(idx); setCustomFoodOpen(true); }}
                      onRemoveFood={(itemIdx) => removeFood(idx, itemIdx)}
                      onSwapFood={(itemIdx) => openSwap(idx, itemIdx)}
                      onUpdateFoodAmount={(itemIdx, amt, unit) => updateFoodAmount(idx, itemIdx, amt, unit)}
                    />
                  );
                }

                return (
                  <div
                    key={idx}
                    className={`rounded-3xl border transition-all ${
                      isCompleted
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                        : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm'
                    }`}
                  >
                    <div className="p-5">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => toggleMealComplete(meal.mealName)}
                            className="text-slate-400 hover:text-emerald-500 transition-colors"
                          >
                            {isCompleted ? <CheckSquare className="w-5 h-5 text-emerald-500" /> : <Square className="w-5 h-5" />}
                          </button>
                          <div>
                            <h3 className={`font-black text-base leading-tight ${isCompleted ? 'text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                              {meal.mealName}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              {meal.category && <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{meal.category}</span>}
                              {meal.time && <span className="text-xs text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" />{meal.time}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isCompleted && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                              ✓ Done
                            </span>
                          )}
                          {(meal.items || []).length > 0 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-500">
                              {meal.items.length} foods
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => setExpandedMeals((prev) => ({ ...prev, [idx]: !isExpanded }))}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Macro summary for meal */}
                      {(meal.items || []).length > 0 && (
                        <div className="flex gap-3 text-[11px] font-mono pt-2 pb-1">
                          <span className="text-orange-500 font-bold">{nutrition.cals} kcal</span>
                          <span className="text-rose-500">{nutrition.prot}g P</span>
                          <span className="text-amber-500">{nutrition.carb}g C</span>
                          <span className="text-cyan-500">{nutrition.fat}g F</span>
                        </div>
                      )}

                      {/* Foods list (collapsed by default) */}
                      {isExpanded && (
                        <div className="mt-3 space-y-2">
                          {(meal.items || []).length === 0 ? (
                            <p className="text-xs text-slate-400 italic">No food items listed.</p>
                          ) : (
                            meal.items.map((item, iIdx) => (
                              <div key={iIdx} className="flex items-center justify-between text-xs p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                                <span className={`font-bold ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-slate-200'}`}>
                                  {item.foodName || item.food}
                                </span>
                                <span className="text-slate-500 font-mono text-[11px]">
                                  {item.quantity}
                                  {item.calories ? ` · ${item.calories} kcal` : ''}
                                </span>
                              </div>
                            ))
                          )}
                          {meal.notes && (
                            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-500 italic">
                              <strong>Guidance:</strong> {meal.notes}
                            </div>
                          )}
                          {/* Coach Suggested Alternatives */}
                          {activePlanType === 'coach' && (meal.alternatives || []).length > 0 && (
                            <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/50 text-xs">
                              <div className="font-bold text-indigo-700 dark:text-indigo-400 mb-1">Coach Suggested Alternatives</div>
                              {meal.alternatives.map((alt, ai) => (
                                <div key={ai} className="text-indigo-600 dark:text-indigo-300">• {alt.name}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ─── Nutrition Log History ─── */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                Daily Log History
              </h3>
              <button
                type="button"
                onClick={async () => {
                  if (!showNutritionHistory) {
                    try {
                      const res = await dietService.getNutritionHistory({ limit: 14 });
                      if (res.success) setNutritionHistory(res.data || []);
                    } catch { /* */ }
                  }
                  setShowNutritionHistory((p) => !p);
                }}
                className="text-xs font-bold text-emerald-500 hover:underline"
              >
                {showNutritionHistory ? 'Hide' : 'View History'}
              </button>
            </div>
            {showNutritionHistory && (
              <div className="mt-4 space-y-2">
                {nutritionHistory.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No nutrition activity logged yet.</p>
                ) : (
                  nutritionHistory.map((log) => (
                    <div key={log._id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-slate-700 dark:text-slate-200">{log.date}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${log.planType === 'coach' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400'}`}>
                          {log.planType === 'coach' ? 'Coach Plan' : 'My Plan'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-slate-500 font-mono">
                        <span>🔥 {log.caloriesConsumed || 0} kcal</span>
                        <span>💧 {log.waterConsumedLiters || 0}L</span>
                        <span>✅ {(log.mealLogs || []).filter((m) => m.completed).length}/{(log.mealLogs || []).length} meals</span>
                        {log.memberNote && <span className="text-slate-400 italic truncate max-w-xs">"{log.memberNote}"</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          FOOD SELECTOR MODAL
      ════════════════════════════════════════════════════════════════════ */}
      {foodModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[85vh] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Apple className="w-5 h-5 text-emerald-500" />
                  Select Food
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Adding to: <strong>{activeDraft?.meals[foodModalMealIdx]?.mealName}</strong></p>
              </div>
              <button type="button" onClick={() => setFoodModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search foods..."
                  value={foodSearch}
                  onChange={(e) => setFoodSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <select value={foodGroupFilter} onChange={(e) => setFoodGroupFilter(e.target.value)} className="flex-1 px-2 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none">
                  {FOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <select value={foodDietFilter} onChange={(e) => setFoodDietFilter(e.target.value)} className="flex-1 px-2 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none">
                  {DIET_FILTERS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {foodLoading ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  <div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Searching foods...
                </div>
              ) : foodLibrary.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                  <Apple className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
                  <p>No foods found. Try a different search.</p>
                </div>
              ) : (
                foodLibrary.map((f) => (
                  <div key={f._id} className="p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500/50 flex items-center justify-between gap-3 bg-white dark:bg-slate-900 transition-colors">
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-slate-900 dark:text-white truncate">{f.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        <span className="text-emerald-500 font-bold">{f.calories} kcal</span> · <span className="text-rose-500">{f.protein}g P</span> · <span className="text-amber-500">{f.carbs}g C</span> · <span className="text-cyan-500">{f.fat}g F</span>
                        <span className="text-slate-300 ml-1">/ {f.servingSize}{f.servingUnit}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => selectFoodForQuantity(f)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shrink-0 transition-colors"
                    >
                      + Add
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <button type="button" onClick={() => { setFoodModalOpen(false); setCustomFoodForMealIdx(foodModalMealIdx); setCustomFoodOpen(true); }} className="text-xs font-semibold text-slate-500 hover:text-emerald-500">
                + Add custom food
              </button>
              <button type="button" onClick={() => setFoodModalOpen(false)} className="text-xs font-semibold text-slate-500 hover:text-slate-700">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Quantity Modal ─── */}
      {quantityModalOpen && pendingFood && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 dark:text-white">Set Quantity</h3>
              <button type="button" onClick={() => setQuantityModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{pendingFood.name}</p>
            <div className="flex gap-2">
              <input
                type="number"
                min={0}
                value={foodAmount}
                onChange={(e) => setFoodAmount(Number(e.target.value))}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center font-bold text-lg focus:outline-none"
              />
              <select
                value={foodUnit}
                onChange={(e) => setFoodUnit(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold focus:outline-none"
              >
                {SERVING_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            {/* Live calc */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-500 space-y-1">
              {(() => {
                const base = pendingFood.servingSize || 100;
                const ratio = base > 0 ? foodAmount / base : 1;
                return (
                  <>
                    <div><span className="text-orange-500 font-bold">{Math.round(pendingFood.calories * ratio)}</span> kcal</div>
                    <div>P: <span className="text-rose-500">{Math.round(pendingFood.protein * ratio * 10) / 10}g</span> · C: <span className="text-amber-500">{Math.round(pendingFood.carbs * ratio * 10) / 10}g</span> · F: <span className="text-cyan-500">{Math.round(pendingFood.fat * ratio * 10) / 10}g</span></div>
                  </>
                );
              })()}
            </div>
            <input
              type="text"
              value={foodNoteInModal}
              onChange={(e) => setFoodNoteInModal(e.target.value)}
              placeholder="Optional note (e.g. boiled, without skin)"
              className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setQuantityModalOpen(false)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={confirmAddFood} className="bg-emerald-600 hover:bg-emerald-700">Add to Meal</Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Custom Food Modal ─── */}
      {customFoodOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                Add Custom Food
              </h3>
              <button type="button" onClick={() => setCustomFoodOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddCustomFood} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">Food Name *</label>
                <input required type="text" value={cfName} onChange={(e) => setCfName(e.target.value)} placeholder="e.g. Homemade Dal" className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">Food Group</label>
                  <select value={cfGroup} onChange={(e) => setCfGroup(e.target.value)} className="w-full px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none">
                    {FOOD_GROUPS.filter(g => g !== 'All').map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">Serving Unit</label>
                  <select value={cfUnit} onChange={(e) => setCfUnit(e.target.value)} className="w-full px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none">
                    {SERVING_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">Serving Amount</label>
                <input type="number" value={cfAmount} onChange={(e) => setCfAmount(e.target.value)} className="w-full px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none" />
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { l: 'Cals', v: cfCals, s: setCfCals },
                  { l: 'Protein', v: cfProt, s: setCfProt },
                  { l: 'Carbs', v: cfCarb, s: setCfCarb },
                  { l: 'Fat', v: cfFat, s: setCfFat },
                  { l: 'Fiber', v: cfFiber, s: setCfFiber },
                ].map(({ l, v, s }) => (
                  <div key={l}>
                    <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">{l}</label>
                    <input type="number" value={v} onChange={(e) => s(e.target.value)} className="w-full px-1.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center font-bold focus:outline-none" />
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" type="button" onClick={() => setCustomFoodOpen(false)}>Cancel</Button>
                <Button variant="primary" size="sm" type="submit" loading={cfSaving} className="bg-emerald-600 hover:bg-emerald-700">Save & Add</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Swap Food Modal ─── */}
      {swapModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[80vh] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-indigo-500" />
                Swap Food
              </h3>
              <button type="button" onClick={() => setSwapModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search replacement food..."
                  value={foodSearch}
                  onChange={(e) => setFoodSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {foodLoading ? (
                <div className="p-8 text-center text-slate-400 text-xs"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
              ) : foodLibrary.length === 0 ? (
                <p className="text-xs text-slate-400 text-center p-8">No foods found.</p>
              ) : (
                foodLibrary.map((f) => (
                  <div key={f._id} className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 flex items-center justify-between gap-3 bg-white dark:bg-slate-900 transition-colors">
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-slate-900 dark:text-white truncate">{f.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {f.calories} kcal · {f.protein}g P · {f.carbs}g C · {f.fat}g F / {f.servingSize}{f.servingUnit}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => confirmSwap(f)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shrink-0"
                    >
                      Swap
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Meal Form Modal ─── */}
      {mealFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 dark:text-white">
                {editingMealIdx !== null ? 'Edit Meal' : 'Add New Meal'}
              </h3>
              <button type="button" onClick={() => setMealFormOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">Meal Name *</label>
                <input
                  type="text"
                  value={mealForm.mealName}
                  onChange={(e) => setMealForm((p) => ({ ...p, mealName: e.target.value }))}
                  placeholder="e.g. Protein Oats Breakfast"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none"
                  autoFocus
                />
              </div>
              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">Category</label>
                <select
                  value={mealForm.category}
                  onChange={(e) => setMealForm((p) => ({ ...p, category: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none"
                >
                  {MEAL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">Suggested Time</label>
                <input
                  type="time"
                  value={mealForm.time}
                  onChange={(e) => setMealForm((p) => ({ ...p, time: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={mealForm.notes}
                  onChange={(e) => setMealForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="e.g. Best consumed 30 min before workout"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setMealFormOpen(false)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={handleMealFormSave} className="bg-emerald-600 hover:bg-emerald-700">
                {editingMealIdx !== null ? 'Update Meal' : 'Add Meal'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Builder Meal Card Component ──────────────────────────────────────────────
const BuilderMealCard = ({
  meal, mealIdx, nutrition,
  onEdit, onDelete, onMoveUp, onMoveDown,
  onAddFood, onCustomFood, onRemoveFood, onSwapFood, onUpdateFoodAmount,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black text-sm flex items-center justify-center shrink-0">
            {mealIdx + 1}
          </span>
          <div className="min-w-0">
            <div className="font-black text-slate-900 dark:text-white text-sm truncate">{meal.mealName}</div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="text-emerald-500 font-semibold">{meal.category}</span>
              {meal.time && <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{meal.time}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {(meal.items || []).length > 0 && (
            <span className="text-[11px] font-mono text-orange-500 font-bold hidden sm:block">{nutrition.cals} kcal</span>
          )}
          <button type="button" onClick={onMoveUp} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><ArrowUp className="w-3.5 h-3.5" /></button>
          <button type="button" onClick={onMoveDown} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><ArrowDown className="w-3.5 h-3.5" /></button>
          <button type="button" onClick={onEdit} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><Edit3 className="w-3.5 h-3.5" /></button>
          <button type="button" onClick={() => setIsOpen(p => !p)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
            {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button type="button" onClick={onDelete} className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {isOpen && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-100 dark:border-slate-800 pt-3">
          {/* Food items */}
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-slate-500 dark:text-slate-400">Foods ({(meal.items || []).length})</span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={onCustomFood} className="text-slate-400 hover:text-emerald-500 font-semibold">+ Custom</button>
                <button type="button" onClick={onAddFood} className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <Search className="w-3 h-3" /> Search Food
                </button>
              </div>
            </div>
            {(meal.items || []).length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                No foods yet.{' '}
                <button type="button" onClick={onAddFood} className="font-bold text-emerald-500 hover:underline">Add food</button>
              </div>
            ) : (
              <div className="space-y-2">
                {meal.items.map((item, iIdx) => (
                  <div key={iIdx} className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">{item.foodName || item.food}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button type="button" onClick={() => onSwapFood(iIdx)} className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 px-1.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/30">⇄ Swap</button>
                        <button type="button" onClick={() => onRemoveFood(iIdx)} className="text-red-500 hover:text-red-700"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <input
                        type="number"
                        min={0}
                        value={item.amount || ''}
                        onChange={(e) => onUpdateFoodAmount(iIdx, e.target.value, item.unit)}
                        className="w-16 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-center font-bold text-xs"
                      />
                      <select
                        value={item.unit || 'g'}
                        onChange={(e) => onUpdateFoodAmount(iIdx, item.amount, e.target.value)}
                        className="px-1.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none"
                      >
                        {SERVING_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                      <span className="text-slate-400 font-mono text-[11px]">
                        {item.calories} kcal · {item.protein}g P · {item.carbs}g C · {item.fat}g F
                      </span>
                    </div>
                  </div>
                ))}
                {/* Meal macro total */}
                <div className="flex gap-3 text-[11px] font-mono pt-1 text-slate-500">
                  Total: <span className="text-orange-500 font-bold">{nutrition.cals} kcal</span>
                  <span className="text-rose-500">{nutrition.prot}g P</span>
                  <span className="text-amber-500">{nutrition.carb}g C</span>
                  <span className="text-cyan-500">{nutrition.fat}g F</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberDiet;
