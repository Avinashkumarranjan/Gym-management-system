import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Apple,
  Flame,
  Droplets,
  Calendar,
  Target,
  User,
  Clock,
  Utensils,
  History,
  FileText,
  AlertCircle,
  Beef,
  Wheat,
  PieChart,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import dietService from '../../services/dietService';
import memberService from '../../services/memberService';
import Button from '../../components/common/Button';

const MemberDiet = () => {
  const [diet, setDiet] = useState(null);
  const [history, setHistory] = useState([]);
  const [trainer, setTrainer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const fetchDietData = async () => {
    try {
      setLoading(true);
      setError('');
      const [res, trainerRes] = await Promise.allSettled([
        dietService.getMyDiet(),
        memberService.getMyTrainer(),
      ]);

      if (trainerRes.status === 'fulfilled' && trainerRes.value?.success) {
        setTrainer(trainerRes.value.trainer || null);
      }

      if (res.status === 'fulfilled' && res.value?.success && res.value.data) {
        setDiet(res.value.data);
      } else {
        setDiet(null);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Failed to load your nutrition plan.'
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await dietService.getMyDietHistory();
      if (res.success) {
        setHistory(res.data || []);
      }
    } catch {
      // Non-critical background fetch
    }
  };

  useEffect(() => {
    fetchDietData();
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="h-44 rounded-3xl bg-slate-100 dark:bg-slate-800/60 animate-pulse border border-slate-200 dark:border-slate-800" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800/40 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Empty State
  if (!diet && !showHistory) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <div className="p-8 md:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-5 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-500 mx-auto flex items-center justify-center">
            <Apple className="w-8 h-8" />
          </div>

          {!trainer ? (
            /* No Trainer Assigned */
            <div className="space-y-4">
              <div className="space-y-2">
                <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
                  Trainer Assignment Required
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  Your nutrition program will be crafted once a coach is assigned to your profile.
                </p>
              </div>
              <div>
                <Link to="/member/trainer">
                  <Button variant="primary" size="sm" icon={ArrowRight} iconPosition="right">
                    View Trainer Status
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            /* Trainer Assigned but No Diet Published Yet */
            <div className="space-y-4">
              <div className="space-y-2">
                <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
                  Nutrition Plan Being Prepared
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  {trainer.name} has been assigned as your coach. Your customized nutrition plan has not been published yet.
                </p>
              </div>

              {/* Coach & Plan Status Chips */}
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center text-[10px]">
                    {trainer.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    Assigned Coach: {trainer.name}
                  </span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 font-semibold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Status: Preparing Protocol</span>
                </div>
              </div>

              <div className="pt-2">
                <Link to="/member/trainer">
                  <Button variant="outline" size="sm" icon={UserCheck}>
                    View Coach Profile
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {history.length > 0 && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                onClick={() => setShowHistory(true)}
                className="inline-flex items-center gap-2 text-xs"
              >
                <History className="w-4 h-4" />
                View Previous Nutrition Plans ({history.length})
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-700 to-cyan-800 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider text-emerald-100">
              <Apple className="w-3.5 h-3.5 text-emerald-300" />
              Active Nutrition Protocol
            </div>

            {history.length > 0 && (
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-semibold backdrop-blur-md transition-colors"
              >
                <History className="w-3.5 h-3.5" />
                {showHistory ? 'Back to Current Plan' : `History (${history.length})`}
              </button>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            {diet?.title}
          </h1>

          {diet?.notes && (
            <p className="text-sm text-emerald-100/90 max-w-2xl">
              {diet.notes}
            </p>
          )}

          {/* Quick Meta Pills */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-xs text-emerald-100">
            {diet?.goal && (
              <span className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-emerald-300" />
                Goal: <strong className="text-white capitalize">{diet.goal}</strong>
              </span>
            )}
            {diet?.trainer && (
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-300" />
                Nutrition Coach: <strong className="text-white">{diet.trainer.name}</strong>
              </span>
            )}
            {diet?.startDate && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-300" />
                Started: <strong className="text-white">{new Date(diet.startDate).toLocaleDateString()}</strong>
              </span>
            )}
            {diet?.endDate && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-300" />
                Valid Until: <strong className="text-white">{new Date(diet.endDate).toLocaleDateString()}</strong>
              </span>
            )}
          </div>
        </div>
      </div>

      {showHistory ? (
        /* History Archive Section */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-500" />
              Previous Nutrition Protocols
            </h2>
            <button
              onClick={() => setShowHistory(false)}
              className="text-xs font-semibold text-emerald-500 hover:underline"
            >
              Return to Current Plan
            </button>
          </div>

          <div className="space-y-4">
            {history.map((histPlan) => (
              <div
                key={histPlan._id}
                className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {histPlan.title}
                  </h3>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                    Archived
                  </span>
                </div>
                <div className="text-xs text-slate-500 flex flex-wrap gap-4">
                  <span>Calories: {histPlan.dailyCalories || 'N/A'} kcal</span>
                  <span>Goal: {histPlan.goal}</span>
                  <span>Meals: {histPlan.meals?.length || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Daily Nutrition & Target Macros Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Calories */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Calories</span>
                <Flame className="w-4 h-4 text-orange-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {diet?.dailyCalories ? `${diet.dailyCalories}` : '—'}
              </div>
              <div className="text-[10px] text-slate-400">Daily Target (kcal)</div>
            </div>

            {/* Protein */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Protein</span>
                <Beef className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {diet?.macros?.proteinGrams != null ? `${diet.macros.proteinGrams}g` : '—'}
              </div>
              <div className="text-[10px] text-slate-400">Muscle Synthesis Target</div>
            </div>

            {/* Carbs */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Carbs</span>
                <Wheat className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {diet?.macros?.carbsGrams != null ? `${diet.macros.carbsGrams}g` : '—'}
              </div>
              <div className="text-[10px] text-slate-400">Energy & Glycogen</div>
            </div>

            {/* Fats */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Fats</span>
                <PieChart className="w-4 h-4 text-sky-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {diet?.macros?.fatGrams != null ? `${diet.macros.fatGrams}g` : '—'}
              </div>
              <div className="text-[10px] text-slate-400">Hormonal Support</div>
            </div>

            {/* Hydration */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1 col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Hydration</span>
                <Droplets className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {diet?.waterLiters != null ? `${diet.waterLiters}L` : '—'}
              </div>
              <div className="text-[10px] text-slate-400">Daily Water Goal</div>
            </div>
          </div>

          {/* Meals Timeline / Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Utensils className="w-5 h-5 text-emerald-500" />
                Prescribed Daily Meals
              </h2>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {diet?.meals?.length || 0} Scheduled Meals
              </span>
            </div>

            {(!diet?.meals || diet.meals.length === 0) ? (
              <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
                No specific meals configured in this plan.
              </div>
            ) : (
              <div className="space-y-4">
                {diet.meals.map((meal, idx) => (
                  <div
                    key={idx}
                    className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 hover:border-emerald-400/50 transition-colors"
                  >
                    {/* Meal Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-black text-xs flex items-center justify-center">
                          {idx + 1}
                        </div>
                        <h3 className="font-black text-slate-900 dark:text-white text-base">
                          {meal.mealName}
                        </h3>
                      </div>

                      {meal.time && (
                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 w-fit">
                          <Clock className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Suggested Time: {meal.time}</span>
                        </div>
                      )}
                    </div>

                    {/* Food Items */}
                    {meal.items && meal.items.length > 0 ? (
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                          Menu Breakdown
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {meal.items.map((item, itemIdx) => (
                            <div
                              key={itemIdx}
                              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs"
                            >
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                {item.food}
                              </span>
                              <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px] border border-emerald-200 dark:border-emerald-800">
                                {item.quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No specific food items listed.</p>
                    )}

                    {/* Meal Coach Note */}
                    {meal.notes && (
                      <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                        <FileText className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-bold">Coach Note:</strong> {meal.notes}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default MemberDiet;
