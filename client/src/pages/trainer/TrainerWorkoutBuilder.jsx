import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Dumbbell,
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Calendar,
  Target,
  Clock,
  FileText,
  AlertCircle,
  CheckCircle2,
  Flame,
} from 'lucide-react';
import workoutService from '../../services/workoutService';
import trainerService from '../../services/trainerService';
import Button from '../../components/common/Button';

const ALL_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const DEFAULT_EXERCISE = {
  name: '',
  sets: 3,
  reps: '10-12',
  restSeconds: 60,
  weightGuidance: '',
  notes: '',
};

const TrainerWorkoutBuilder = () => {
  const { memberId, planId } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(planId);

  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState('strength');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Weekly Schedule Array
  const [weeklySchedule, setWeeklySchedule] = useState([
    {
      day: 'Monday',
      focus: 'Chest & Triceps',
      exercises: [
        {
          name: 'Barbell Bench Press',
          sets: 4,
          reps: '8-10',
          restSeconds: 90,
          weightGuidance: '75% 1RM',
          notes: 'Keep shoulders retracted',
        },
      ],
    },
    {
      day: 'Wednesday',
      focus: 'Back & Biceps',
      exercises: [
        {
          name: 'Barbell Deadlift',
          sets: 4,
          reps: '6-8',
          restSeconds: 120,
          weightGuidance: 'RPE 8',
          notes: 'Neutral spine throughout',
        },
      ],
    },
    {
      day: 'Friday',
      focus: 'Legs & Shoulders',
      exercises: [
        {
          name: 'Barbell Back Squat',
          sets: 4,
          reps: '8-10',
          restSeconds: 120,
          weightGuidance: 'Controlled descent',
          notes: 'Depth below parallel',
        },
      ],
    },
  ]);

  // Load existing data
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        setError('');

        if (isEditMode) {
          const res = await workoutService.getWorkoutPlanById(planId);
          if (res.success && res.data) {
            const p = res.data;
            setTitle(p.title || '');
            setDescription(p.description || '');
            setGoal(p.goal || 'strength');
            setStartDate(p.startDate ? p.startDate.split('T')[0] : '');
            setEndDate(p.endDate ? p.endDate.split('T')[0] : '');
            setIsActive(p.isActive !== undefined ? p.isActive : true);
            if (p.weeklySchedule && p.weeklySchedule.length > 0) {
              setWeeklySchedule(p.weeklySchedule);
            }
            if (p.member) {
              setMember(p.member);
            }
          }
        } else if (memberId) {
          const memberRes = await trainerService.getAssignedMemberDetails(memberId);
          if (memberRes.success && memberRes.data) {
            setMember(memberRes.data.user || memberRes.data);
            setTitle(`${memberRes.data.user?.name || 'Athlete'} Customized Hypertrophy Protocol`);
            setGoal(memberRes.data.fitnessGoal || 'strength');
          }
        }
      } catch (err) {
        setError(
          err.response?.data?.message || err.message || 'Failed to initialize workout builder.'
        );
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [memberId, planId, isEditMode]);

  // Add Day
  const handleAddDay = (dayName) => {
    if (weeklySchedule.some((d) => d.day === dayName)) return;
    setWeeklySchedule([
      ...weeklySchedule,
      {
        day: dayName,
        focus: 'Conditioning & Core',
        exercises: [{ ...DEFAULT_EXERCISE, name: 'Exercise 1' }],
      },
    ]);
  };

  // Remove Day
  const handleRemoveDay = (indexToRemove) => {
    setWeeklySchedule(weeklySchedule.filter((_, idx) => idx !== indexToRemove));
  };

  // Update Day Focus
  const handleUpdateFocus = (dayIdx, newFocus) => {
    const updated = [...weeklySchedule];
    updated[dayIdx].focus = newFocus;
    setWeeklySchedule(updated);
  };

  // Add Exercise to Day
  const handleAddExercise = (dayIdx) => {
    const updated = [...weeklySchedule];
    updated[dayIdx].exercises.push({ ...DEFAULT_EXERCISE, name: '' });
    setWeeklySchedule(updated);
  };

  // Remove Exercise from Day
  const handleRemoveExercise = (dayIdx, exIdx) => {
    const updated = [...weeklySchedule];
    updated[dayIdx].exercises.splice(exIdx, 1);
    setWeeklySchedule(updated);
  };

  // Update Exercise Field
  const handleUpdateExercise = (dayIdx, exIdx, field, val) => {
    const updated = [...weeklySchedule];
    updated[dayIdx].exercises[exIdx][field] = val;
    setWeeklySchedule(updated);
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Workout plan title is required.');
      return;
    }

    // Validate exercises
    for (const d of weeklySchedule) {
      for (const ex of d.exercises) {
        if (!ex.name || !ex.name.trim()) {
          setError(`Please provide an exercise name for ${d.day}.`);
          return;
        }
        if (Number(ex.sets) <= 0) {
          setError(`Sets must be greater than 0 for ${ex.name}.`);
          return;
        }
        if (Number(ex.restSeconds) < 0) {
          setError(`Rest seconds cannot be negative for ${ex.name}.`);
          return;
        }
      }
    }

    try {
      setSaving(true);
      setError('');

      const payload = {
        title,
        description,
        goal,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        isActive,
        weeklySchedule,
      };

      if (isEditMode) {
        await workoutService.updateWorkoutPlan(planId, payload);
        setSuccessMsg('Workout plan updated successfully!');
      } else {
        await workoutService.createTrainerWorkout(memberId, payload);
        setSuccessMsg('Workout plan assigned to athlete successfully!');
      }

      setTimeout(() => {
        if (memberId) {
          navigate(`/trainer/members/${memberId}`);
        } else {
          navigate('/trainer/workouts');
        }
      }, 1500);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Failed to save workout plan.'
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

  // Days not yet included in weekly schedule
  const availableDaysToAdd = ALL_DAYS.filter(
    (d) => !weeklySchedule.some((ws) => ws.day === d)
  );

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

        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          Coach Training Builder
        </span>
      </div>

      {/* Header Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 text-white shadow-lg space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider text-amber-100">
          <Dumbbell className="w-3.5 h-3.5 text-amber-300" />
          {isEditMode ? 'Modify Workout Protocol' : 'Design Athlete Workout Plan'}
        </div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight">
          {isEditMode ? 'Edit Workout Plan' : `Create Plan for ${member?.name || 'Athlete'}`}
        </h1>
        <p className="text-xs md:text-sm text-amber-100/90 max-w-xl">
          Build a structured weekly lifting split with custom exercises, sets, reps, and guidance.
        </p>
      </div>

      {/* Feedback Messages */}
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
        {/* Section 1: Plan Details */}
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
          <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500" />
            Plan Overview & Target Objective
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
                placeholder="e.g., 4-Day Hypertrophy Split"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Primary Goal
              </label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500"
              >
                <option value="weight_loss">Weight Loss</option>
                <option value="muscle_gain">Muscle Gain</option>
                <option value="strength">Strength Training</option>
                <option value="endurance">Endurance & Stamina</option>
                <option value="general_fitness">General Fitness</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-6">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                />
                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                  Set as Athlete's Primary Active Plan
                </span>
              </label>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500"
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                General Description / Coaching Overview (Optional)
              </label>
              <textarea
                rows="2"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="High level notes regarding progression, deload weeks, warm-up routines..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Weekly Schedule Cards */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                Weekly Training Split ({weeklySchedule.length} Days)
              </h2>
              <p className="text-xs text-slate-500">
                Configure specific exercise movements, loading guidance, and recovery times for each day.
              </p>
            </div>

            {/* Quick Add Day Dropdown/Buttons */}
            {availableDaysToAdd.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-400 mr-1">Add Day:</span>
                {availableDaysToAdd.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleAddDay(d)}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-amber-500 text-xs font-semibold"
                  >
                    + {d.slice(0, 3)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {weeklySchedule.map((dayData, dayIdx) => (
            <div
              key={dayData.day}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4"
            >
              {/* Day Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-black text-sm border border-amber-200 dark:border-amber-800">
                    {dayData.day}
                  </span>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={dayData.focus}
                      onChange={(e) => handleUpdateFocus(dayIdx, e.target.value)}
                      placeholder="e.g. Chest & Triceps"
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddExercise(dayIdx)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100 text-xs font-bold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Exercise
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemoveDay(dayIdx)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    title={`Remove ${dayData.day}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Exercises within day */}
              <div className="space-y-3">
                {dayData.exercises.map((ex, exIdx) => (
                  <div
                    key={exIdx}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="w-6 h-6 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center justify-center shrink-0">
                          {exIdx + 1}
                        </span>
                        <input
                          type="text"
                          value={ex.name}
                          onChange={(e) =>
                            handleUpdateExercise(dayIdx, exIdx, 'name', e.target.value)
                          }
                          placeholder="Exercise Name (e.g. Incline Dumbbell Press)"
                          required
                          className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold"
                        />
                      </div>

                      {dayData.exercises.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveExercise(dayIdx, exIdx)}
                          className="p-1 rounded text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Numeric and Guidance Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                          Sets *
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={ex.sets}
                          onChange={(e) =>
                            handleUpdateExercise(dayIdx, exIdx, 'sets', Number(e.target.value))
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                          Reps (e.g. 10-12, AMRAP) *
                        </label>
                        <input
                          type="text"
                          value={ex.reps}
                          onChange={(e) =>
                            handleUpdateExercise(dayIdx, exIdx, 'reps', e.target.value)
                          }
                          placeholder="e.g. 10-12"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                          Rest (Seconds)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="15"
                          value={ex.restSeconds}
                          onChange={(e) =>
                            handleUpdateExercise(
                              dayIdx,
                              exIdx,
                              'restSeconds',
                              Number(e.target.value)
                            )
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                          Weight / Intensity
                        </label>
                        <input
                          type="text"
                          value={ex.weightGuidance || ''}
                          onChange={(e) =>
                            handleUpdateExercise(dayIdx, exIdx, 'weightGuidance', e.target.value)
                          }
                          placeholder="e.g. RPE 8, 70kg"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                        />
                      </div>
                    </div>

                    <div>
                      <input
                        type="text"
                        value={ex.notes || ''}
                        onChange={(e) =>
                          handleUpdateExercise(dayIdx, exIdx, 'notes', e.target.value)
                        }
                        placeholder="Coaching notes (tempo, cues, dropsets, warmup suggestions)..."
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                  </div>
                ))}
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
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving Protocol...' : isEditMode ? 'Update Workout Plan' : 'Save & Assign Plan'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TrainerWorkoutBuilder;
