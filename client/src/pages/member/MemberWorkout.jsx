import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Dumbbell,
  Calendar,
  Target,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Flame,
  FileText,
  History,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import workoutService from '../../services/workoutService';
import memberService from '../../services/memberService';
import Button from '../../components/common/Button';

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const MemberWorkout = () => {
  const [workout, setWorkout] = useState(null);
  const [history, setHistory] = useState([]);
  const [trainer, setTrainer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeDay, setActiveDay] = useState('Monday');
  const [showHistory, setShowHistory] = useState(false);

  const fetchWorkoutData = async () => {
    try {
      setLoading(true);
      setError('');
      const [res, trainerRes] = await Promise.allSettled([
        workoutService.getMyWorkout(),
        memberService.getMyTrainer(),
      ]);

      if (trainerRes.status === 'fulfilled' && trainerRes.value?.success) {
        setTrainer(trainerRes.value.trainer || null);
      }

      if (res.status === 'fulfilled' && res.value?.success && res.value.data) {
        setWorkout(res.value.data);
        const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        const hasToday = res.value.data.weeklySchedule?.some((d) => d.day === todayName);
        setActiveDay(hasToday ? todayName : (res.value.data.weeklySchedule?.[0]?.day || 'Monday'));
      } else {
        setWorkout(null);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Failed to load your workout plan.'
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await workoutService.getMyWorkoutHistory();
      if (res.success) {
        setHistory(res.data || []);
      }
    } catch {
      // Non-critical background fetch
    }
  };

  useEffect(() => {
    fetchWorkoutData();
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="h-44 rounded-3xl bg-slate-100 dark:bg-slate-800/60 animate-pulse border border-slate-200 dark:border-slate-800" />
        <div className="h-96 rounded-3xl bg-slate-100 dark:bg-slate-800/40 animate-pulse" />
      </div>
    );
  }

  // Empty State
  if (!workout && !showHistory) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <div className="p-8 md:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-5 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-950/60 text-primary-500 mx-auto flex items-center justify-center">
            <Dumbbell className="w-8 h-8" />
          </div>

          {!trainer ? (
            /* No Trainer Assigned */
            <div className="space-y-4">
              <div className="space-y-2">
                <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
                  Trainer Assignment Required
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  Your workout program will be created once a coach is assigned.
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
            /* Trainer Assigned but No Workout Published Yet */
            <div className="space-y-4">
              <div className="space-y-2">
                <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
                  Workout Plan Being Prepared
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  {trainer.name} has been assigned as your coach. Your customized workout plan has not been published yet.
                </p>
              </div>

              {/* Coach Chip */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                <div className="w-6 h-6 rounded-full bg-primary-500 text-white font-bold flex items-center justify-center text-[10px]">
                  {trainer.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-semibold text-slate-900 dark:text-white">
                  Assigned Coach: {trainer.name}
                </span>
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
                View Previous Workout Plans ({history.length})
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const selectedDaySchedule = workout?.weeklySchedule?.find((s) => s.day === activeDay);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-primary-600 via-primary-700 to-indigo-800 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider text-primary-100">
              <Flame className="w-3.5 h-3.5 text-primary-300" />
              Active Training Program
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
            {workout?.title}
          </h1>

          {workout?.description && (
            <p className="text-sm text-primary-100/90 max-w-2xl">
              {workout.description}
            </p>
          )}

          {/* Quick Meta Pills */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-xs text-primary-100">
            {workout?.goal && (
              <span className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-primary-300" />
                Goal: <strong className="text-white capitalize">{workout.goal}</strong>
              </span>
            )}
            {workout?.trainer && (
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-primary-300" />
                Coach: <strong className="text-white">{workout.trainer.name}</strong>
              </span>
            )}
            {workout?.startDate && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary-300" />
                Started: <strong className="text-white">{new Date(workout.startDate).toLocaleDateString()}</strong>
              </span>
            )}
            {workout?.endDate && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary-300" />
                Target End: <strong className="text-white">{new Date(workout.endDate).toLocaleDateString()}</strong>
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
              <History className="w-5 h-5 text-primary-500" />
              Previous Workout Programs
            </h2>
            <button
              onClick={() => setShowHistory(false)}
              className="text-xs font-semibold text-primary-500 hover:underline"
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
                <p className="text-xs text-slate-500">{histPlan.description || 'No description'}</p>
                <div className="text-xs text-slate-400 flex gap-4">
                  <span>Goal: {histPlan.goal}</span>
                  <span>Days scheduled: {histPlan.weeklySchedule?.length || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Main Weekly Schedule Tabs & Day Exercises */
        <div className="space-y-6">
          {/* Day of Week Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {DAYS_OF_WEEK.map((day) => {
              const dayData = workout?.weeklySchedule?.find((s) => s.day === day);
              const hasExercises = dayData && dayData.exercises && dayData.exercises.length > 0;
              const isSelected = activeDay === day;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setActiveDay(day)}
                  className={`px-4 py-3 rounded-2xl font-bold text-xs shrink-0 transition-all flex flex-col items-center min-w-[90px] border ${
                    isSelected
                      ? 'bg-primary-600 text-white border-primary-500 shadow-md shadow-primary-500/20 scale-[1.02]'
                      : hasExercises
                      ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-primary-400'
                      : 'bg-slate-50 dark:bg-slate-900/50 text-slate-400 border-dashed border-slate-200 dark:border-slate-800 opacity-70'
                  }`}
                >
                  <span className="text-xs uppercase">{day.slice(0, 3)}</span>
                  <span className="text-[10px] font-medium mt-0.5">
                    {hasExercises ? `${dayData.exercises.length} Ex` : 'Rest'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Day Detail Card */}
          <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary-500">
                  {activeDay} Workout
                </span>
                <h2 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                  {selectedDaySchedule?.focus || 'Rest & Recovery Day'}
                </h2>
              </div>

              {selectedDaySchedule?.exercises?.length > 0 && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-300 w-fit">
                  {selectedDaySchedule.exercises.length} Exercises Planned
                </span>
              )}
            </div>

            {/* Exercises List or Rest Day */}
            {!selectedDaySchedule || !selectedDaySchedule.exercises || selectedDaySchedule.exercises.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Rest & Active Recovery
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  No intense lifting scheduled for {activeDay}. Prioritize hydration, sleep, protein intake, and mobility drills.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {selectedDaySchedule.exercises.map((exercise, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 hover:border-primary-400 dark:hover:border-primary-600 transition-colors space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400 font-black text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <h4 className="font-black text-slate-900 dark:text-white text-base">
                          {exercise.name}
                        </h4>
                      </div>

                      {exercise.weightGuidance && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 w-fit">
                          {exercise.weightGuidance}
                        </span>
                      )}
                    </div>

                    {/* Stats pills */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Sets</span>
                        <span className="font-black text-slate-900 dark:text-white text-sm">
                          {exercise.sets}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Reps</span>
                        <span className="font-black text-slate-900 dark:text-white text-sm">
                          {exercise.reps}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 col-span-2 sm:col-span-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Rest Period</span>
                        <span className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-primary-500" />
                          {exercise.restSeconds} sec
                        </span>
                      </div>
                    </div>

                    {exercise.notes && (
                      <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                        <FileText className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-bold">Coach Note:</strong> {exercise.notes}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberWorkout;
