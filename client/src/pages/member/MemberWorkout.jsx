import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Dumbbell,
  Calendar,
  Target,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  Flame,
  FileText,
  History,
  ArrowRight,
  UserCheck,
  Copy,
  CheckSquare,
  Square,
  Save,
  Sparkles,
  Bed,
  Layers,
  ChevronRight,
  X,
  Plus,
  Trash2,
  Edit3,
  ArrowUp,
  ArrowDown,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Search,
  Filter,
  Activity,
  Trophy,
  BarChart3,
  ChevronDown,
  Check,
  Zap,
  Info,
} from 'lucide-react';
import workoutService from '../../services/workoutService';
import exerciseService from '../../services/exerciseService';
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

const GOAL_OPTIONS = [
  'General Fitness',
  'Muscle Building',
  'Strength',
  'Weight Loss',
  'Endurance',
  'Athletic Performance',
  'Body Recomposition',
  'Mobility',
  'Powerlifting',
  'Bodybuilding',
  'Functional Fitness',
  'HIIT',
  'Custom',
];

const DIFFICULTY_OPTIONS = ['Beginner', 'Intermediate', 'Advanced', 'Athlete'];

const SPLIT_OPTIONS = [
  'Full Body',
  'Upper / Lower',
  'Push Pull Legs',
  'Bro Split',
  'Strength Split',
  'Powerbuilding',
  'Hypertrophy',
  'HIIT',
  'Cardio',
  'Functional Training',
  'Mobility',
  'Custom Split',
];

const FOCUS_CATEGORIES = [
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Arms',
  'Quadriceps',
  'Hamstrings',
  'Glutes',
  'Calves',
  'Core',
  'Full Body',
  'Cardio',
  'Mobility',
  'Conditioning',
  'Custom',
];

const MUSCLE_GROUPS = [
  'All',
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Forearms',
  'Quadriceps',
  'Hamstrings',
  'Glutes',
  'Calves',
  'Core',
  'Full Body',
  'Cardio',
  'Mobility',
  'Other',
];

const EQUIPMENT_OPTIONS = [
  'All',
  'Bodyweight',
  'Barbell',
  'Dumbbell',
  'Cable',
  'Machine',
  'Smith Machine',
  'Kettlebell',
  'Resistance Band',
  'Bench',
  'TRX',
  'Medicine Ball',
  'Cardio Machine',
  'Other',
];

const MOVEMENT_PATTERNS = [
  'All',
  'Push',
  'Pull',
  'Squat',
  'Hinge',
  'Lunge',
  'Carry',
  'Rotation',
  'Isolation',
  'Plyometric',
  'Cardio',
  'Mobility',
  'Olympic',
  'Other',
];

const TECHNIQUE_TAGS = [
  'Straight Sets',
  'Superset',
  'Drop Set',
  'Pyramid',
  'Rest-Pause',
  'AMRAP',
  'Failure Set',
];

// Predefined editable workout templates
const PREDEFINED_TEMPLATES = [
  {
    id: 'push-pull-legs',
    title: 'Push Pull Legs (PPL) Split',
    goal: 'Muscle Building',
    difficulty: 'Intermediate',
    splitType: 'Push Pull Legs',
    duration: '8 Weeks',
    description: 'Classic 3-day muscle hypertrophy split targeting Push (Chest/Shoulders/Tris), Pull (Back/Biceps), and Legs.',
    schedule: [
      {
        day: 'Monday',
        dayType: 'workout',
        title: 'Push Day — Chest & Shoulders',
        focus: 'Chest, Shoulders, Triceps',
        estimatedDuration: 60,
        warmupNotes: '5 min dynamic chest stretches and shoulder rotations',
        cooldownNotes: 'Triceps stretch and deep breathing',
        exercises: [
          { name: 'Barbell Bench Press', sets: 4, reps: '8-10', load: '60 kg', restSeconds: 90, tempo: '3-1-1', rpe: 8, notes: 'Control the descent, touch chest softly' },
          { name: 'Incline Dumbbell Press', sets: 3, reps: '10-12', load: '22 kg', restSeconds: 75, tempo: '2-0-1', rpe: 8, notes: 'Focus on upper clavicular stretch' },
          { name: 'Dumbbell Lateral Raise', sets: 4, reps: '12-15', load: '10 kg', restSeconds: 60, tempo: '2-0-1', rpe: 8, notes: 'Lead with elbows' },
          { name: 'Triceps Rope Pushdown', sets: 3, reps: '12-15', load: '25 kg', restSeconds: 60, tempo: '2-0-1', rpe: 8, notes: 'Squeeze triceps at lockout' },
        ],
      },
      { day: 'Tuesday', dayType: 'rest', title: 'Rest & Recovery', focus: 'Active Recovery', estimatedDuration: 0, restDayNotes: { recoveryNotes: 'Hydrate well and aim for 8,000 light walking steps.', stepsTarget: 8000, sleepTargetHours: 8, hydrationLiters: 3 } },
      {
        day: 'Wednesday',
        dayType: 'workout',
        title: 'Pull Day — Back & Biceps',
        focus: 'Back, Biceps',
        estimatedDuration: 60,
        warmupNotes: 'Lat activation with resistance band pull-aparts',
        cooldownNotes: 'Child pose and upper back stretch',
        exercises: [
          { name: 'Lat Pulldown', sets: 4, reps: '10-12', load: '55 kg', restSeconds: 90, tempo: '2-1-2', rpe: 8, notes: 'Drive elbows downward towards hips' },
          { name: 'Barbell Bent Over Row', sets: 4, reps: '8-10', load: '50 kg', restSeconds: 90, tempo: '2-0-1', rpe: 8, notes: 'Keep spine neutral, pull to lower ribcage' },
          { name: 'Seated Cable Row', sets: 3, reps: '10-12', load: '45 kg', restSeconds: 60, tempo: '2-0-1', rpe: 8, notes: 'Full squeeze in rhomboids' },
          { name: 'Dumbbell Bicep Curl', sets: 3, reps: '10-12', load: '14 kg', restSeconds: 60, tempo: '2-0-1', rpe: 8, notes: 'Supinate wrist at peak contraction' },
        ],
      },
      { day: 'Thursday', dayType: 'rest', title: 'Rest & Recovery', focus: 'Active Recovery', estimatedDuration: 0, restDayNotes: { recoveryNotes: 'Light stretching and optimal protein intake.', stepsTarget: 8000, sleepTargetHours: 8, hydrationLiters: 3 } },
      {
        day: 'Friday',
        dayType: 'workout',
        title: 'Legs & Core Day',
        focus: 'Quadriceps, Hamstrings, Core',
        estimatedDuration: 65,
        warmupNotes: 'Leg swings, bodyweight squats, ankle mobility',
        cooldownNotes: 'Hamstring and quad static stretches',
        exercises: [
          { name: 'Barbell Back Squat', sets: 4, reps: '8-10', load: '80 kg', restSeconds: 120, tempo: '3-0-1', rpe: 8, notes: 'Hit parallel depth with bracing' },
          { name: 'Romanian Deadlift', sets: 3, reps: '10-12', load: '60 kg', restSeconds: 90, tempo: '3-1-1', rpe: 8, notes: 'Feel deep hamstring stretch on hinge' },
          { name: 'Leg Press', sets: 3, reps: '12-15', load: '120 kg', restSeconds: 75, tempo: '2-0-1', rpe: 8, notes: 'Controlled tempo, do not lock knees violently' },
          { name: 'Plank', sets: 3, reps: '45-60s', load: 'Bodyweight', restSeconds: 60, tempo: 'Hold', rpe: 7, notes: 'Maintain tight abdominal hollow' },
        ],
      },
      { day: 'Saturday', dayType: 'rest', title: 'Active Recovery', focus: 'Recovery', estimatedDuration: 0, restDayNotes: { recoveryNotes: 'Mobility work and gentle weekend walk.', stepsTarget: 9000, sleepTargetHours: 8, hydrationLiters: 3 } },
      { day: 'Sunday', dayType: 'rest', title: 'Rest Day', focus: 'Total Rest', estimatedDuration: 0, restDayNotes: { recoveryNotes: 'Rest and mental relaxation before next week.', stepsTarget: 6000, sleepTargetHours: 9, hydrationLiters: 3 } },
    ],
  },
  {
    id: 'upper-lower',
    title: 'Upper / Lower Power Split',
    goal: 'Strength',
    difficulty: 'Intermediate',
    splitType: 'Upper / Lower',
    duration: '6 Weeks',
    description: 'Balanced 4-day frequency program separating upper and lower body for strength development.',
    schedule: [
      {
        day: 'Monday',
        dayType: 'workout',
        title: 'Upper Body Power A',
        focus: 'Chest, Back, Shoulders',
        estimatedDuration: 60,
        exercises: [
          { name: 'Barbell Bench Press', sets: 4, reps: '6-8', load: '70 kg', restSeconds: 120, tempo: '3-1-1', rpe: 8, notes: 'Power compound' },
          { name: 'Barbell Bent Over Row', sets: 4, reps: '6-8', load: '65 kg', restSeconds: 90, tempo: '2-0-1', rpe: 8, notes: 'Heavy horizontal pull' },
          { name: 'Overhead Press', sets: 3, reps: '8-10', load: '40 kg', restSeconds: 90, tempo: '2-0-1', rpe: 8, notes: 'Vertical push' },
        ],
      },
      {
        day: 'Tuesday',
        dayType: 'workout',
        title: 'Lower Body Strength A',
        focus: 'Quads, Glutes, Hamstrings',
        estimatedDuration: 60,
        exercises: [
          { name: 'Barbell Back Squat', sets: 4, reps: '6-8', load: '85 kg', restSeconds: 120, tempo: '3-0-1', rpe: 8, notes: 'Primary quad focus' },
          { name: 'Romanian Deadlift', sets: 3, reps: '8-10', load: '70 kg', restSeconds: 90, tempo: '3-1-1', rpe: 8, notes: 'Posterior chain builder' },
        ],
      },
      { day: 'Wednesday', dayType: 'rest', title: 'Midweek Rest', focus: 'Active Recovery', estimatedDuration: 0, restDayNotes: { recoveryNotes: 'Mobility and rest.', stepsTarget: 8000, sleepTargetHours: 8, hydrationLiters: 3 } },
      {
        day: 'Thursday',
        dayType: 'workout',
        title: 'Upper Body Hypertrophy B',
        focus: 'Back, Chest, Arms',
        estimatedDuration: 60,
        exercises: [
          { name: 'Incline Dumbbell Press', sets: 4, reps: '10-12', load: '24 kg', restSeconds: 75, tempo: '2-0-1', rpe: 8, notes: 'Volume focus' },
          { name: 'Lat Pulldown', sets: 4, reps: '10-12', load: '55 kg', restSeconds: 75, tempo: '2-0-1', rpe: 8, notes: 'Wide grip pull' },
        ],
      },
      {
        day: 'Friday',
        dayType: 'workout',
        title: 'Lower Body Hypertrophy B',
        focus: 'Hamstrings, Calves, Core',
        estimatedDuration: 55,
        exercises: [
          { name: 'Leg Press', sets: 4, reps: '12-15', load: '130 kg', restSeconds: 90, tempo: '2-0-1', rpe: 8, notes: 'Quad overload' },
          { name: 'Plank', sets: 3, reps: '60s', load: 'Bodyweight', restSeconds: 60, tempo: 'Hold', rpe: 7, notes: 'Core stabilization' },
        ],
      },
      { day: 'Saturday', dayType: 'rest', title: 'Rest & Recover', focus: 'Rest', estimatedDuration: 0 },
      { day: 'Sunday', dayType: 'rest', title: 'Sunday Reset', focus: 'Rest', estimatedDuration: 0 },
    ],
  },
  {
    id: 'beginner-full-body',
    title: 'Beginner Full Body Foundation',
    goal: 'General Fitness',
    difficulty: 'Beginner',
    splitType: 'Full Body',
    duration: '4 Weeks',
    description: 'Ideal 3-day routine building motor patterns, balance, and whole-body functional capacity.',
    schedule: [
      {
        day: 'Monday',
        dayType: 'workout',
        title: 'Full Body Session 1',
        focus: 'Full Body',
        estimatedDuration: 45,
        exercises: [
          { name: 'Goblet Squat', sets: 3, reps: '10-12', load: '12 kg', restSeconds: 60, tempo: '2-0-1', rpe: 7, notes: 'Keep elbows tucked inside knees' },
          { name: 'Dumbbell Bench Press', sets: 3, reps: '10-12', load: '14 kg', restSeconds: 60, tempo: '2-0-1', rpe: 7, notes: 'Safe chest press' },
          { name: 'Lat Pulldown', sets: 3, reps: '10-12', load: '35 kg', restSeconds: 60, tempo: '2-0-1', rpe: 7, notes: 'Engage back muscles smoothly' },
        ],
      },
      { day: 'Tuesday', dayType: 'rest', title: 'Rest Day', focus: 'Rest', estimatedDuration: 0 },
      {
        day: 'Wednesday',
        dayType: 'workout',
        title: 'Full Body Session 2',
        focus: 'Full Body',
        estimatedDuration: 45,
        exercises: [
          { name: 'Romanian Deadlift', sets: 3, reps: '10-12', load: '30 kg', restSeconds: 60, tempo: '2-1-1', rpe: 7, notes: 'Hinge at the hips' },
          { name: 'Seated Cable Row', sets: 3, reps: '10-12', load: '35 kg', restSeconds: 60, tempo: '2-0-1', rpe: 7, notes: 'Squeeze shoulder blades' },
          { name: 'Dumbbell Shoulder Press', sets: 3, reps: '10-12', load: '10 kg', restSeconds: 60, tempo: '2-0-1', rpe: 7, notes: 'Press straight overhead' },
        ],
      },
      { day: 'Thursday', dayType: 'rest', title: 'Rest Day', focus: 'Rest', estimatedDuration: 0 },
      {
        day: 'Friday',
        dayType: 'workout',
        title: 'Full Body Session 3',
        focus: 'Full Body',
        estimatedDuration: 45,
        exercises: [
          { name: 'Leg Press', sets: 3, reps: '12-15', load: '80 kg', restSeconds: 60, tempo: '2-0-1', rpe: 7, notes: 'Controlled pace' },
          { name: 'Push-ups', sets: 3, reps: '8-12', load: 'Bodyweight', restSeconds: 60, tempo: '2-0-1', rpe: 7, notes: 'Modify on knees if needed' },
          { name: 'Plank', sets: 3, reps: '30-45s', load: 'Bodyweight', restSeconds: 45, tempo: 'Hold', rpe: 7, notes: 'Tight core' },
        ],
      },
      { day: 'Saturday', dayType: 'rest', title: 'Weekend Rest', focus: 'Rest', estimatedDuration: 0 },
      { day: 'Sunday', dayType: 'rest', title: 'Weekend Rest', focus: 'Rest', estimatedDuration: 0 },
    ],
  },
];

const MemberWorkout = () => {
  // Plans & Data State
  const [workout, setWorkout] = useState(null); // Official Coach Plan
  const [customWorkout, setCustomWorkout] = useState(null); // Member Custom Plan
  const [activePlanType, setActivePlanType] = useState('coach'); // 'coach' | 'custom'
  const [trainer, setTrainer] = useState(null);
  const [history, setHistory] = useState([]); // Plan History
  const [workoutLogsList, setWorkoutLogsList] = useState([]); // Past Session Logs
  const [exerciseHistoryMap, setExerciseHistoryMap] = useState({}); // PRs & Performance map
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Active Selected Day
  const [activeDay, setActiveDay] = useState('Monday');

  // History Modal & View Tabs
  const [showHistory, setShowHistory] = useState(false);
  const [historyTab, setHistoryTab] = useState('logs'); // 'logs' | 'plans' | 'prs'
  const [selectedHistoryPlan, setSelectedHistoryPlan] = useState(null);
  const [selectedLogDetail, setSelectedLogDetail] = useState(null);
  const [prSearchQuery, setPrSearchQuery] = useState('');

  // Daily Logging & Active Workout State
  const [todayDate] = useState(new Date().toISOString().split('T')[0]);
  const [completedExercises, setCompletedExercises] = useState({});
  const [actualWeights, setActualWeights] = useState({});
  const [actualReps, setActualReps] = useState({});
  const [actualRpes, setActualRpes] = useState({});
  const [exercisePersonalNotes, setExercisePersonalNotes] = useState({});
  const [exerciseSetLogs, setExerciseSetLogs] = useState({});
  const [detailedLoggingModes, setDetailedLoggingModes] = useState({});
  const [memberDailyNote, setMemberDailyNote] = useState('');
  const [energyLevel, setEnergyLevel] = useState('');
  const [difficultyFeeling, setDifficultyFeeling] = useState('');
  const [savingLog, setSavingLog] = useState(false);
  const [isSavedToday, setIsSavedToday] = useState(false);

  // Active Workout Mode (Timer & Tracking)
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [workoutStartTime, setWorkoutStartTime] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Rest Timer State
  const [restTimerOpen, setRestTimerOpen] = useState(false);
  const [restTimerSeconds, setRestTimerSeconds] = useState(90);
  const [restTimerInitial, setRestTimerInitial] = useState(90);
  const [restTimerRunning, setRestTimerRunning] = useState(false);
  const [restTimerExerciseName, setRestTimerExerciseName] = useState('');

  // Custom Workout Builder State
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [builderStep, setBuilderStep] = useState(1); // 1: Setup, 2: Schedule, 3: Exercises, 4: Review
  const [builderActiveDay, setBuilderActiveDay] = useState('Monday');
  const [savingBuilder, setSavingBuilder] = useState(false);
  const [builderPlan, setBuilderPlan] = useState({
    title: 'My Personal Training Routine',
    goal: 'General Fitness',
    difficulty: 'Intermediate',
    splitType: 'Push Pull Legs',
    duration: '8 Weeks',
    startDate: new Date().toISOString().split('T')[0],
    description: '',
    coachInstructions: '',
    weeklySchedule: DAYS_OF_WEEK.map((d) => ({
      day: d,
      dayType: d === 'Tuesday' || d === 'Thursday' || d === 'Sunday' ? 'rest' : 'workout',
      isRestDay: d === 'Tuesday' || d === 'Thursday' || d === 'Sunday',
      title: `${d} Routine`,
      focus: 'General Training',
      estimatedDuration: 60,
      warmupNotes: '',
      cooldownNotes: '',
      generalInstructions: '',
      restDayNotes: { recoveryNotes: 'Stay hydrated and sleep well.', stepsTarget: 8000, sleepTargetHours: 8, hydrationLiters: 3 },
      exercises: [],
    })),
  });

  // Exercise Search & Selection Modal
  const [exerciseModalOpen, setExerciseModalOpen] = useState(false);
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('');
  const [selectedMuscleFilter, setSelectedMuscleFilter] = useState('All');
  const [selectedEquipmentFilter, setSelectedEquipmentFilter] = useState('All');
  const [selectedMovementFilter, setSelectedMovementFilter] = useState('All');
  const [exerciseLibrary, setExerciseLibrary] = useState([]);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [targetDayForExercise, setTargetDayForExercise] = useState('Monday');

  // Custom Exercise Creation Modal
  const [customExerciseModalOpen, setCustomExerciseModalOpen] = useState(false);
  const [customExerciseForm, setCustomExerciseForm] = useState({
    name: '',
    primaryMuscleGroup: 'Chest',
    equipment: 'Barbell',
    movementPattern: 'Push',
    instructions: '',
    notes: '',
  });

  // Exercise Details Modal
  const [selectedExerciseForDetails, setSelectedExerciseForDetails] = useState(null);

  // Template Picker Modal
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);

  // Sound chime helper for rest timer
  const playTimerBeep = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch {
      // Audio autoplay gracefully handled
    }
  };

  // Workout Session Timer interval
  useEffect(() => {
    let interval = null;
    if (isWorkoutActive) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isWorkoutActive]);

  // Rest Countdown Timer interval
  useEffect(() => {
    let interval = null;
    if (restTimerOpen && restTimerRunning && restTimerSeconds > 0) {
      interval = setInterval(() => {
        setRestTimerSeconds((prev) => {
          if (prev <= 1) {
            playTimerBeep();
            setRestTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (restTimerSeconds === 0) {
      setRestTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [restTimerOpen, restTimerRunning, restTimerSeconds]);

  // Format MM:SS helper
  const formatTime = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Fetch initial plans, logs, and exercise records
  const fetchWorkoutData = async () => {
    try {
      setLoading(true);
      setError('');
      const [res, customRes, trainerRes, logRes, allLogsRes, prRes] = await Promise.allSettled([
        workoutService.getMyWorkout(),
        workoutService.getMyCustomWorkout(),
        memberService.getMyTrainer(),
        workoutService.getWorkoutLogs({ date: todayDate }),
        workoutService.getWorkoutLogs({ limit: 40 }),
        workoutService.getExercisePerformanceHistory(),
      ]);

      if (trainerRes.status === 'fulfilled' && trainerRes.value?.success) {
        setTrainer(trainerRes.value.trainer || null);
      }

      let activeCoachPlan = null;
      if (res.status === 'fulfilled' && res.value?.success && res.value.data) {
        activeCoachPlan = res.value.data;
        setWorkout(activeCoachPlan);
      } else {
        setWorkout(null);
      }

      let activeMemberCustom = null;
      if (customRes.status === 'fulfilled' && customRes.value?.success && customRes.value.data) {
        activeMemberCustom = customRes.value.data;
        setCustomWorkout(activeMemberCustom);
      } else {
        setCustomWorkout(null);
      }

      // Default active day: current weekday if it exists in active plan, else first scheduled day
      const todayWeekday = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      const currentPlan = activeMemberCustom || activeCoachPlan;
      if (currentPlan?.weeklySchedule?.length > 0) {
        const hasToday = currentPlan.weeklySchedule.some((d) => d.day === todayWeekday);
        setActiveDay(hasToday ? todayWeekday : currentPlan.weeklySchedule[0].day);
      } else {
        setActiveDay(todayWeekday);
      }

      // Load today's completion logs if saved previously
      if (logRes.status === 'fulfilled' && logRes.value?.success && logRes.value.data?.length > 0) {
        const todayLog = logRes.value.data[0];
        const compMap = {};
        const notesMap = {};
        const weightMap = {};
        const repsMap = {};
        const rpesMap = {};
        const setsMap = {};

        (todayLog.exerciseLogs || []).forEach((el) => {
          compMap[el.exerciseName] = Boolean(el.completed);
          if (el.personalNote || el.notes) notesMap[el.exerciseName] = el.personalNote || el.notes;
          if (el.actualWeight) weightMap[el.exerciseName] = el.actualWeight;
          if (el.actualReps) repsMap[el.exerciseName] = el.actualReps;
          if (el.rpe) rpesMap[el.exerciseName] = el.rpe;
          if (Array.isArray(el.setLogs) && el.setLogs.length > 0) {
            setsMap[el.exerciseName] = el.setLogs;
          }
        });

        setCompletedExercises(compMap);
        setExercisePersonalNotes(notesMap);
        setActualWeights(weightMap);
        setActualReps(repsMap);
        setActualRpes(rpesMap);
        setExerciseSetLogs(setsMap);
        setMemberDailyNote(todayLog.overallNotes || todayLog.memberNote || '');
        setEnergyLevel(todayLog.energyLevel || '');
        setDifficultyFeeling(todayLog.difficultyFeeling || '');
        setIsSavedToday(true);
      }

      if (allLogsRes.status === 'fulfilled' && allLogsRes.value?.success) {
        setWorkoutLogsList(allLogsRes.value.data || []);
      }

      if (prRes.status === 'fulfilled' && prRes.value?.success) {
        setExerciseHistoryMap(prRes.value.data || {});
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load your workout plan.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlanHistory = async () => {
    try {
      const res = await workoutService.getMyWorkoutHistory();
      if (res.success) {
        setHistory(res.data || []);
      }
    } catch {
      // Non-blocking
    }
  };

  useEffect(() => {
    fetchWorkoutData();
    fetchPlanHistory();
  }, []);

  // Fetch exercise library on demand
  const loadExerciseLibrary = async () => {
    try {
      setLoadingExercises(true);
      const res = await exerciseService.getExercises({ limit: 120 });
      if (res.success) {
        setExerciseLibrary(res.data || []);
      }
    } catch {
      // Handled silently
    } finally {
      setLoadingExercises(false);
    }
  };

  const openExerciseSelector = (dayName) => {
    setTargetDayForExercise(dayName);
    setExerciseModalOpen(true);
    if (exerciseLibrary.length === 0) {
      loadExerciseLibrary();
    }
  };

  // Filtered exercise library list
  const filteredExercises = useMemo(() => {
    return exerciseLibrary.filter((ex) => {
      const matchQuery =
        !exerciseSearchQuery.trim() ||
        ex.name.toLowerCase().includes(exerciseSearchQuery.toLowerCase()) ||
        ex.primaryMuscleGroup?.toLowerCase().includes(exerciseSearchQuery.toLowerCase());

      const matchMuscle =
        selectedMuscleFilter === 'All' || ex.primaryMuscleGroup === selectedMuscleFilter;

      const matchEquipment =
        selectedEquipmentFilter === 'All' || ex.equipment === selectedEquipmentFilter;

      const matchMovement =
        selectedMovementFilter === 'All' || ex.movementPattern === selectedMovementFilter;

      return matchQuery && matchMuscle && matchEquipment && matchMovement;
    });
  }, [
    exerciseLibrary,
    exerciseSearchQuery,
    selectedMuscleFilter,
    selectedEquipmentFilter,
    selectedMovementFilter,
  ]);

  // Current displayed plan based on active plan tab
  const currentPlan = activePlanType === 'custom' && customWorkout ? customWorkout : workout;

  // Selected day's schedule from active plan
  const selectedDaySchedule = currentPlan?.weeklySchedule?.find((s) => s.day === activeDay);

  // Derive weekly metrics safely
  const weeklyMetrics = useMemo(() => {
    if (!currentPlan?.weeklySchedule) return { workoutDays: 0, restDays: 0, totalExercises: 0, approxSets: 0, estMinutes: 0 };
    let workoutDays = 0;
    let restDays = 0;
    let totalExercises = 0;
    let approxSets = 0;
    let estMinutes = 0;

    currentPlan.weeklySchedule.forEach((d) => {
      if (d.isRestDay || d.dayType === 'rest' || d.dayType === 'recovery') {
        restDays++;
      } else if (d.dayType === 'workout' || (d.exercises && d.exercises.length > 0)) {
        workoutDays++;
        const exCount = d.exercises?.length || 0;
        totalExercises += exCount;
        estMinutes += d.estimatedDuration || 60;
        d.exercises?.forEach((ex) => {
          approxSets += Number(ex.sets) || 3;
        });
      }
    });

    return { workoutDays, restDays, totalExercises, approxSets, estMinutes };
  }, [currentPlan]);

  // Calculate day completion status
  const currentDayExercises = selectedDaySchedule?.exercises || [];
  const completedCount = currentDayExercises.filter((e) => completedExercises[e.name]).length;
  const isDayFullyCompleted = currentDayExercises.length > 0 && completedCount === currentDayExercises.length;
  const completionPercent = currentDayExercises.length > 0 ? Math.round((completedCount / currentDayExercises.length) * 100) : 0;

  // Weekly completion checkmarks map based on real logs
  const weeklyCompletionMap = useMemo(() => {
    const map = {};
    workoutLogsList.forEach((log) => {
      if (log.day) {
        map[log.day] = log.isWorkoutCompleted || (log.completedExercisesCount > 0 && log.completedExercisesCount === log.totalExercisesCount);
      }
    });
    return map;
  }, [workoutLogsList]);

  // Start Active Training Session
  const handleStartWorkout = () => {
    setIsWorkoutActive(true);
    setWorkoutStartTime(new Date());
    setSuccessMsg('Workout session active! Log your weights and use the rest timer between sets.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Launch Rest Timer for an exercise
  const handleOpenRestTimer = (seconds = 90, exName = '') => {
    const sec = Number(seconds) > 0 ? Number(seconds) : 90;
    setRestTimerInitial(sec);
    setRestTimerSeconds(sec);
    setRestTimerExerciseName(exName);
    setRestTimerOpen(true);
    setRestTimerRunning(true);
  };

  // Toggle Exercise Complete
  const toggleExerciseComplete = (exerciseName) => {
    setCompletedExercises((prev) => {
      const nextVal = !prev[exerciseName];
      const updated = { ...prev, [exerciseName]: nextVal };
      return updated;
    });
  };

  // Toggle Simple vs Detailed Sets
  const toggleDetailedLogging = (exerciseName, prescribedSets = 3, prescribedReps = '10') => {
    setDetailedLoggingModes((prev) => ({
      ...prev,
      [exerciseName]: !prev[exerciseName],
    }));

    // Initialize set logs if empty
    if (!exerciseSetLogs[exerciseName] || exerciseSetLogs[exerciseName].length === 0) {
      const count = Number(prescribedSets) || 3;
      const initialSets = Array.from({ length: count }, (_, idx) => ({
        setNumber: idx + 1,
        weight: actualWeights[exerciseName] || '',
        reps: actualReps[exerciseName] || prescribedReps,
        rpe: actualRpes[exerciseName] || 8,
        completed: false,
      }));
      setExerciseSetLogs((prev) => ({
        ...prev,
        [exerciseName]: initialSets,
      }));
    }
  };

  // Update specific set log
  const handleUpdateSetLog = (exerciseName, setIndex, field, value) => {
    setExerciseSetLogs((prev) => {
      const currentSets = prev[exerciseName] ? [...prev[exerciseName]] : [];
      if (currentSets[setIndex]) {
        currentSets[setIndex] = {
          ...currentSets[setIndex],
          [field]: value,
        };
      }
      return {
        ...prev,
        [exerciseName]: currentSets,
      };
    });
  };

  // Add set to detailed log
  const handleAddSet = (exerciseName) => {
    setExerciseSetLogs((prev) => {
      const currentSets = prev[exerciseName] ? [...prev[exerciseName]] : [];
      const newSetNumber = currentSets.length + 1;
      currentSets.push({
        setNumber: newSetNumber,
        weight: currentSets[currentSets.length - 1]?.weight || '',
        reps: currentSets[currentSets.length - 1]?.reps || '10',
        rpe: 8,
        completed: false,
      });
      return {
        ...prev,
        [exerciseName]: currentSets,
      };
    });
  };

  // Remove set from detailed log
  const handleRemoveSet = (exerciseName, setIndex) => {
    setExerciseSetLogs((prev) => {
      const currentSets = prev[exerciseName] ? [...prev[exerciseName]] : [];
      currentSets.splice(setIndex, 1);
      // Re-number remaining sets
      const renumbered = currentSets.map((s, idx) => ({ ...s, setNumber: idx + 1 }));
      return {
        ...prev,
        [exerciseName]: renumbered,
      };
    });
  };

  // Save Today's Workout Completion Log (Single sticky action)
  const handleSaveLog = async () => {
    if (!currentPlan) return;

    try {
      setSavingLog(true);
      setError('');

      const scheduleForDay = currentPlan.weeklySchedule?.find((s) => s.day === activeDay);
      const exercisesList = scheduleForDay?.exercises || [];

      const exerciseLogs = exercisesList.map((ex) => ({
        exerciseReference: ex.exercise || null,
        exerciseName: ex.name,
        completed: Boolean(completedExercises[ex.name]),
        actualSets: Number(ex.sets) || 3,
        actualReps: actualReps[ex.name] || ex.reps || '',
        actualWeight: actualWeights[ex.name] || ex.load || '',
        unit: ex.unit || 'kg',
        rpe: actualRpes[ex.name] || ex.rpe || null,
        personalNote: exercisePersonalNotes[ex.name] || '',
        setLogs: exerciseSetLogs[ex.name] || [],
      }));

      const payload = {
        workoutPlanId: currentPlan._id,
        planType: activePlanType === 'custom' ? 'custom' : 'coach',
        date: todayDate,
        day: activeDay,
        workoutTitle: scheduleForDay?.title || `${activeDay} Workout`,
        exerciseLogs,
        memberNote: memberDailyNote,
        overallNotes: memberDailyNote,
        energyLevel,
        difficultyFeeling,
        startedAt: workoutStartTime || new Date(),
        completedAt: new Date(),
        durationMinutes: elapsedSeconds > 0 ? Math.round(elapsedSeconds / 60) : scheduleForDay?.estimatedDuration || 60,
      };

      const res = await workoutService.logWorkoutCompletion(payload);

      if (res.success) {
        setIsSavedToday(true);
        setIsWorkoutActive(false);
        setSuccessMsg(
          isDayFullyCompleted
            ? '🎉 Outstanding! Entire workout completed and recorded to your training logs.'
            : 'Workout progress saved successfully. You can update this log anytime today.'
        );
        setTimeout(() => setSuccessMsg(''), 4500);

        // Refresh logs list and PRs
        const [updatedLogs, updatedPRs] = await Promise.allSettled([
          workoutService.getWorkoutLogs({ limit: 40 }),
          workoutService.getExercisePerformanceHistory(),
        ]);
        if (updatedLogs.status === 'fulfilled' && updatedLogs.value?.success) {
          setWorkoutLogsList(updatedLogs.value.data || []);
        }
        if (updatedPRs.status === 'fulfilled' && updatedPRs.value?.success) {
          setExerciseHistoryMap(updatedPRs.value.data || {});
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save today\'s workout. Please try again.');
    } finally {
      setSavingLog(false);
    }
  };

  // Handle Customize a Copy
  const handleCustomizeCopy = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await workoutService.duplicateMemberCustomWorkout();
      if (res.success) {
        setCustomWorkout(res.data);
        setActivePlanType('custom');
        // Open directly into builder edit mode
        setBuilderPlan({
          ...res.data,
          startDate: res.data.startDate ? new Date(res.data.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        });
        setIsBuilderOpen(true);
        setBuilderStep(1);
        setSuccessMsg('Created your personal editable copy! Customize your split, days, or exercises below.');
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create custom copy.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Start from Scratch
  const handleStartFromScratch = () => {
    setBuilderPlan({
      title: 'My Custom Strength Routine',
      goal: 'Strength',
      difficulty: 'Intermediate',
      splitType: 'Upper / Lower',
      duration: '8 Weeks',
      startDate: new Date().toISOString().split('T')[0],
      description: 'Personalized routine designed for consistent progression.',
      coachInstructions: '',
      weeklySchedule: DAYS_OF_WEEK.map((d) => ({
        day: d,
        dayType: d === 'Tuesday' || d === 'Thursday' || d === 'Sunday' ? 'rest' : 'workout',
        isRestDay: d === 'Tuesday' || d === 'Thursday' || d === 'Sunday',
        title: d === 'Tuesday' || d === 'Thursday' || d === 'Sunday' ? 'Rest & Recovery' : `${d} Training`,
        focus: d === 'Tuesday' || d === 'Thursday' || d === 'Sunday' ? 'Rest & Recovery' : 'General Training',
        estimatedDuration: 60,
        warmupNotes: '',
        cooldownNotes: '',
        generalInstructions: '',
        restDayNotes: { recoveryNotes: 'Prioritize adequate sleep, hydration, and mobility.', stepsTarget: 8000, sleepTargetHours: 8, hydrationLiters: 3 },
        exercises: [],
      })),
    });
    setBuilderStep(1);
    setIsBuilderOpen(true);
  };

  // Apply Predefined Template
  const handleApplyTemplate = (tmpl) => {
    setBuilderPlan({
      title: tmpl.title,
      goal: tmpl.goal,
      difficulty: tmpl.difficulty,
      splitType: tmpl.splitType,
      duration: tmpl.duration,
      startDate: new Date().toISOString().split('T')[0],
      description: tmpl.description,
      coachInstructions: '',
      weeklySchedule: tmpl.schedule.map((s) => ({
        ...s,
        isRestDay: s.dayType === 'rest' || s.dayType === 'recovery',
        exercises: s.exercises || [],
      })),
    });
    setTemplatePickerOpen(false);
    setIsBuilderOpen(true);
    setBuilderStep(1);
    setSuccessMsg(`Applied "${tmpl.title}" template! You can adjust every day and exercise before saving.`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Open Edit Mode for existing custom plan
  const handleEditExistingCustomPlan = () => {
    if (!customWorkout) return;
    setBuilderPlan({
      ...customWorkout,
      startDate: customWorkout.startDate ? new Date(customWorkout.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    });
    setIsBuilderOpen(true);
    setBuilderStep(1);
  };

  // Custom Workout Builder: Save Final Plan
  const handleSaveCustomPlan = async () => {
    try {
      setSavingBuilder(true);
      setError('');

      if (!builderPlan.title.trim()) {
        setError('Plan title is required.');
        setSavingBuilder(false);
        return;
      }

      let res;
      if (customWorkout && customWorkout._id) {
        res = await workoutService.updateMyCustomWorkout(customWorkout._id, builderPlan);
      } else {
        res = await workoutService.createMemberCustomWorkout(builderPlan);
      }

      if (res.success) {
        setCustomWorkout(res.data);
        setActivePlanType('custom');
        setIsBuilderOpen(false);
        setSuccessMsg('Your custom workout plan has been saved successfully!');
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save custom workout plan. Please try again.');
    } finally {
      setSavingBuilder(false);
    }
  };

  // Custom Workout Builder Day Manipulation
  const handleUpdateBuilderDay = (dayName, field, value) => {
    setBuilderPlan((prev) => ({
      ...prev,
      weeklySchedule: prev.weeklySchedule.map((d) => {
        if (d.day === dayName) {
          const updated = { ...d, [field]: value };
          if (field === 'dayType') {
            updated.isRestDay = value === 'rest' || value === 'recovery';
          }
          return updated;
        }
        return d;
      }),
    }));
  };

  // Custom Workout Builder: Add Exercise to Day
  const handleAddExerciseToBuilder = (dayName, exerciseItem) => {
    setBuilderPlan((prev) => ({
      ...prev,
      weeklySchedule: prev.weeklySchedule.map((d) => {
        if (d.day === dayName) {
          const newExList = d.exercises ? [...d.exercises] : [];
          newExList.push({
            exercise: exerciseItem._id || null,
            name: exerciseItem.name,
            sets: 3,
            reps: '10-12',
            load: exerciseItem.equipment === 'Bodyweight' ? 'Bodyweight' : '',
            unit: 'kg',
            restSeconds: 60,
            tempo: '2-0-1',
            rpe: 8,
            notes: exerciseItem.description || '',
          });
          return { ...d, exercises: newExList, dayType: 'workout', isRestDay: false };
        }
        return d;
      }),
    }));
    setExerciseModalOpen(false);
    setSuccessMsg(`Added ${exerciseItem.name} to ${dayName}!`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Duplicate Day in Builder (e.g. Copy Monday -> Thursday)
  const handleDuplicateDayInBuilder = (sourceDay, targetDay) => {
    const src = builderPlan.weeklySchedule.find((d) => d.day === sourceDay);
    if (!src) return;

    setBuilderPlan((prev) => ({
      ...prev,
      weeklySchedule: prev.weeklySchedule.map((d) => {
        if (d.day === targetDay) {
          return {
            ...d,
            dayType: src.dayType,
            isRestDay: src.isRestDay,
            title: `${src.title} (Copy)`,
            focus: src.focus,
            estimatedDuration: src.estimatedDuration,
            warmupNotes: src.warmupNotes,
            cooldownNotes: src.cooldownNotes,
            generalInstructions: src.generalInstructions,
            exercises: JSON.parse(JSON.stringify(src.exercises || [])),
          };
        }
        return d;
      }),
    }));
    setSuccessMsg(`Copied ${sourceDay}'s schedule to ${targetDay}!`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Reorder exercises in builder
  const handleMoveExercise = (dayName, index, direction) => {
    setBuilderPlan((prev) => ({
      ...prev,
      weeklySchedule: prev.weeklySchedule.map((d) => {
        if (d.day === dayName) {
          const list = [...d.exercises];
          const targetIdx = index + direction;
          if (targetIdx < 0 || targetIdx >= list.length) return d;
          const [moved] = list.splice(index, 1);
          list.splice(targetIdx, 0, moved);
          return { ...d, exercises: list };
        }
        return d;
      }),
    }));
  };

  // Delete exercise in builder
  const handleDeleteExerciseInBuilder = (dayName, index) => {
    setBuilderPlan((prev) => ({
      ...prev,
      weeklySchedule: prev.weeklySchedule.map((d) => {
        if (d.day === dayName) {
          const list = [...d.exercises];
          list.splice(index, 1);
          return { ...d, exercises: list };
        }
        return d;
      }),
    }));
  };

  // Update exercise properties in builder
  const handleUpdateExerciseInBuilder = (dayName, index, field, value) => {
    setBuilderPlan((prev) => ({
      ...prev,
      weeklySchedule: prev.weeklySchedule.map((d) => {
        if (d.day === dayName) {
          const list = [...d.exercises];
          if (list[index]) {
            list[index] = { ...list[index], [field]: value };
          }
          return { ...d, exercises: list };
        }
        return d;
      }),
    }));
  };

  // Create new custom exercise
  const handleCreateCustomExercise = async (e) => {
    e.preventDefault();
    if (!customExerciseForm.name.trim()) return;

    try {
      const res = await exerciseService.createExercise(customExerciseForm);
      if (res.success && res.data) {
        setExerciseLibrary((prev) => [res.data, ...prev]);
        handleAddExerciseToBuilder(targetDayForExercise, res.data);
        setCustomExerciseModalOpen(false);
        setCustomExerciseForm({
          name: '',
          primaryMuscleGroup: 'Chest',
          equipment: 'Barbell',
          movementPattern: 'Push',
          instructions: '',
          notes: '',
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create custom exercise.');
    }
  };

  // Reset or delete custom plan
  const handleDeleteCustomPlan = async () => {
    if (!customWorkout?._id) return;
    if (!window.confirm('Are you sure you want to remove your custom workout plan? This will return you to your coach\'s official prescription.')) return;

    try {
      setLoading(true);
      await workoutService.deleteMyCustomWorkout(customWorkout._id);
      setCustomWorkout(null);
      setActivePlanType('coach');
      setSuccessMsg('Custom plan removed. You are now viewing your coach\'s official plan.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove custom plan.');
    } finally {
      setLoading(false);
    }
  };

  // Loading Skeleton
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="h-48 rounded-3xl bg-slate-100 dark:bg-slate-800/60 animate-pulse border border-slate-200 dark:border-slate-800" />
        <div className="h-20 rounded-2xl bg-slate-100 dark:bg-slate-800/40 animate-pulse" />
        <div className="h-96 rounded-3xl bg-slate-100 dark:bg-slate-800/40 animate-pulse" />
      </div>
    );
  }

  // Pure Empty State (No coach plan & no custom plan)
  if (!workout && !customWorkout && !showHistory && !isBuilderOpen) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4 space-y-8">
        {/* Banner */}
        <div className="p-8 md:p-10 rounded-3xl bg-gradient-to-r from-primary-600 via-primary-700 to-indigo-800 text-white shadow-xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider text-primary-100">
            <Sparkles className="w-3.5 h-3.5 text-primary-300" />
            FitCore Training Experience
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            Build Your Own Workout
          </h1>
          <p className="text-sm md:text-base text-primary-100/90 max-w-xl leading-relaxed">
            Create a personal training routine or customize your coach's existing program. Take full control of your sets, reps, exercises, and schedule.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={handleStartFromScratch}
              icon={Plus}
              className="bg-white text-primary-900 hover:bg-slate-100 font-bold shadow-md"
            >
              Start From Scratch
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => setTemplatePickerOpen(true)}
              icon={Layers}
              className="border-white/30 text-white hover:bg-white/10"
            >
              Use Template
            </Button>
            {trainer && (
              <Link to="/member/trainer">
                <Button variant="outline" size="md" icon={UserCheck} className="border-white/30 text-white hover:bg-white/10">
                  Assigned Coach: {trainer.name}
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Informational Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 flex items-center justify-center font-bold">
              1
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Flexible Splits</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Design Push-Pull-Legs, Upper-Lower, Full Body, or customized training frequencies.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center font-bold">
              2
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Rich Exercise Library</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Filter by muscle groups, movement patterns, and equipment, or create custom exercises.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold">
              3
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Set-by-Set Logging</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Track actual weights lifted, reps, RPE, rest countdown, and celebrate new Personal Records.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24">
      {/* Top Banner & Plan Switcher */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-primary-600 via-primary-700 to-indigo-800 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          {/* Top Bar with Clear Plan Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {/* Plan Type Tabs */}
              <div className="flex items-center bg-black/25 backdrop-blur-md p-1 rounded-2xl border border-white/10 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActivePlanType('coach')}
                  className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                    activePlanType === 'coach'
                      ? 'bg-white text-primary-900 shadow-md font-black'
                      : 'text-primary-100 hover:text-white'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  <span>Coach Plan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActivePlanType('custom')}
                  className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                    activePlanType === 'custom'
                      ? 'bg-white text-primary-900 shadow-md font-black'
                      : 'text-primary-100 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>My Custom Plan</span>
                  {!customWorkout && (
                    <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-white/20 text-white">New</span>
                  )}
                </button>
              </div>

              {/* Mode Badge */}
              <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-[11px] font-semibold text-primary-100">
                {activePlanType === 'coach' ? (
                  <>
                    <User className="w-3 h-3 text-primary-300" />
                    <span>Official Coach Prescription (Read-Only)</span>
                  </>
                ) : (
                  <>
                    <Edit3 className="w-3 h-3 text-emerald-300" />
                    <span>Member Personal Training Program</span>
                  </>
                )}
              </div>
            </div>

            {/* Top Action Buttons */}
            <div className="flex items-center gap-2">
              {activePlanType === 'coach' && workout && (
                <button
                  type="button"
                  onClick={handleCustomizeCopy}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-semibold backdrop-blur-md border border-white/20 transition-all text-white shadow-sm"
                  title="Make a personal editable copy without modifying coach prescription"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Customize a Copy</span>
                </button>
              )}

              {activePlanType === 'custom' && customWorkout && (
                <>
                  <button
                    type="button"
                    onClick={handleEditExistingCustomPlan}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-primary-900 hover:bg-slate-100 text-xs font-bold shadow-md transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Plan</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteCustomPlan}
                    className="inline-flex items-center p-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-white border border-red-300/30 text-xs transition-colors"
                    title="Remove custom plan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}

              {activePlanType === 'custom' && !customWorkout && (
                <button
                  type="button"
                  onClick={handleStartFromScratch}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-primary-900 hover:bg-slate-100 text-xs font-bold shadow-md transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Build Routine</span>
                </button>
              )}

              {/* History Button */}
              <button
                type="button"
                onClick={() => setShowHistory(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-semibold backdrop-blur-md border border-white/20 transition-all text-white shadow-sm"
              >
                <History className="w-3.5 h-3.5" />
                <span>History ({workoutLogsList.length})</span>
              </button>
            </div>
          </div>

          {/* Plan Title & Explanation */}
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3">
              <span>{currentPlan?.title || (activePlanType === 'custom' ? 'My Custom Plan' : 'Official Workout Program')}</span>
              {currentPlan?.difficulty && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/20 text-white font-bold border border-white/20">
                  {currentPlan.difficulty}
                </span>
              )}
            </h1>
            <p className="text-xs md:text-sm text-primary-100/90 max-w-3xl leading-relaxed">
              {activePlanType === 'coach'
                ? 'Trainer-prescribed routine. Changes to your custom plan do not affect your coach’s official prescription.'
                : 'Your personal editable program. Customize exercises, target sets, reps, and weekly splits freely.'}
            </p>
          </div>

          {/* Quick Plan Meta & Derived Summary Metrics */}
          {currentPlan && (
            <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-y-3 gap-x-6 text-xs text-primary-100">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                {currentPlan.goal && (
                  <span className="flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-primary-300" />
                    Goal: <strong className="text-white capitalize">{currentPlan.goal}</strong>
                  </span>
                )}
                {currentPlan.splitType && (
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-primary-300" />
                    Split: <strong className="text-white">{currentPlan.splitType}</strong>
                  </span>
                )}
                {currentPlan.trainer && activePlanType === 'coach' && (
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-primary-300" />
                    Coach: <strong className="text-white">{currentPlan.trainer.name}</strong>
                  </span>
                )}
                {currentPlan.duration && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-primary-300" />
                    Duration: <strong className="text-white">{currentPlan.duration}</strong>
                  </span>
                )}
              </div>

              {/* Derived Plan Summary (Rule 26) */}
              <div className="flex items-center gap-3 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[11px]">
                <span>
                  <strong className="text-white">{weeklyMetrics.workoutDays}</strong> Days Training
                </span>
                <span className="text-white/40">·</span>
                <span>
                  <strong className="text-white">{weeklyMetrics.restDays}</strong> Rest Days
                </span>
                <span className="text-white/40">·</span>
                <span>
                  <strong className="text-white">{weeklyMetrics.approxSets}</strong> Total Weekly Sets
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notifications / Alerts */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm font-semibold flex items-center justify-between gap-2 shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-sm flex items-center justify-between gap-2 shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-red-600 hover:text-red-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Custom Plan Empty State Prompt if Custom Tab clicked but no plan exists */}
      {activePlanType === 'custom' && !customWorkout && (
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 mx-auto flex items-center justify-center">
            <Sparkles className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            No Custom Plan Created Yet
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            Create a personal training routine or customize your coach's existing program. Changes to your custom plan will not affect your coach's official prescription.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button variant="primary" size="sm" onClick={handleStartFromScratch} icon={Plus}>
              Start From Scratch
            </Button>
            {workout && (
              <Button variant="outline" size="sm" onClick={handleCustomizeCopy} icon={Copy}>
                Customize Coach Plan
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setTemplatePickerOpen(true)} icon={Layers}>
              Use Template
            </Button>
          </div>
        </div>
      )}

      {/* Active Workout Session Banner if workout is live */}
      {isWorkoutActive && (
        <div className="p-4 md:p-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg flex flex-wrap items-center justify-between gap-3 animate-pulse-subtle">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-black">
              <Zap className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                Workout In Progress
              </div>
              <h3 className="font-black text-base">
                {selectedDaySchedule?.title || `${activeDay} Workout`}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold">
            <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-xl border border-white/10">
              <Clock className="w-4 h-4 text-emerald-200" />
              <span>Elapsed: {formatTime(elapsedSeconds)}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-xl border border-white/10">
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span>{completedCount} / {currentDayExercises.length} Done</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Schedule & Exercises Display */}
      {currentPlan && (
        <div className="space-y-6">
          {/* Weekly Day Selector Tabs with intelligent labels & completion markers */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {DAYS_OF_WEEK.map((day) => {
              const dayData = currentPlan?.weeklySchedule?.find((s) => s.day === day);
              const isRest = dayData?.isRestDay || dayData?.dayType === 'rest' || dayData?.dayType === 'recovery';
              const isNotPlanned = !dayData || dayData.dayType === 'not_planned';
              const hasExercises = dayData && dayData.exercises && dayData.exercises.length > 0;
              const isSelected = activeDay === day;
              const isToday = day === new Date().toLocaleDateString('en-US', { weekday: 'long' });
              const isCompleted = Boolean(weeklyCompletionMap[day]);

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setActiveDay(day)}
                  className={`px-4 py-3 rounded-2xl font-bold text-xs shrink-0 transition-all flex flex-col items-center min-w-[95px] border relative ${
                    isSelected
                      ? 'bg-primary-600 text-white border-primary-500 shadow-md shadow-primary-500/20 scale-[1.02]'
                      : hasExercises
                      ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-primary-400'
                      : isRest
                      ? 'bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                      : 'bg-slate-50 dark:bg-slate-900/40 text-slate-400 border-dashed border-slate-200 dark:border-slate-800 opacity-60'
                  }`}
                >
                  {/* Today Badge */}
                  {isToday && (
                    <span className="absolute -top-2 px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[9px] font-black tracking-wider uppercase shadow-xs">
                      Today
                    </span>
                  )}

                  <div className="flex items-center gap-1">
                    <span className="text-xs uppercase">{day.slice(0, 3)}</span>
                    {isCompleted && (
                      <CheckCircle2 className={`w-3 h-3 ${isSelected ? 'text-emerald-200' : 'text-emerald-500'}`} />
                    )}
                  </div>

                  <span className="text-[10px] font-medium mt-0.5">
                    {isRest ? 'Rest' : isNotPlanned ? 'Not Planned' : hasExercises ? `${dayData.exercises.length} Ex` : 'Workout'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Day Detail Card */}
          <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
            {/* Day Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary-500">
                    {activeDay} Training Session
                  </span>
                  {activeDay === new Date().toLocaleDateString('en-US', { weekday: 'long' }) && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 font-bold text-[10px] border border-amber-200 dark:border-amber-800">
                      Scheduled for Today
                    </span>
                  )}
                </div>
                <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
                  {selectedDaySchedule?.title || selectedDaySchedule?.focus || (selectedDaySchedule?.isRestDay ? 'Rest & Recovery Day' : 'Strength Session')}
                </h2>
                {selectedDaySchedule?.focus && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Target Focus: <strong className="text-slate-700 dark:text-slate-300">{selectedDaySchedule.focus}</strong>
                  </p>
                )}
              </div>

              {/* Day Header Actions & Progress Indicator */}
              <div className="flex flex-wrap items-center gap-2.5">
                {currentDayExercises.length > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <div className="text-xs font-black text-slate-800 dark:text-slate-200">
                        {completedCount} / {currentDayExercises.length} Done ({completionPercent}%)
                      </div>
                      <div className="w-24 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 mt-1 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-300"
                          style={{ width: `${completionPercent}%` }}
                        />
                      </div>
                    </div>

                    {!isWorkoutActive && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleStartWorkout}
                        icon={Play}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                      >
                        Start Workout
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenRestTimer(90, 'Rest Interval')}
                      icon={Clock}
                    >
                      Rest Timer
                    </Button>
                  </div>
                )}

                {/* If custom plan & empty day */}
                {activePlanType === 'custom' && (!selectedDaySchedule || selectedDaySchedule.dayType === 'not_planned') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEditExistingCustomPlan}
                    icon={Plus}
                  >
                    Configure Day
                  </Button>
                )}
              </div>
            </div>

            {/* Warm-up & Cool-down Notes if configured */}
            {(selectedDaySchedule?.warmupNotes || selectedDaySchedule?.cooldownNotes) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {selectedDaySchedule.warmupNotes && (
                  <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 text-amber-900 dark:text-amber-200 space-y-1">
                    <strong className="font-bold flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                      <Flame className="w-3.5 h-3.5" /> Warm-up Guidance:
                    </strong>
                    <p>{selectedDaySchedule.warmupNotes}</p>
                  </div>
                )}
                {selectedDaySchedule.cooldownNotes && (
                  <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/30 text-indigo-900 dark:text-indigo-200 space-y-1">
                    <strong className="font-bold flex items-center gap-1.5 text-indigo-700 dark:text-indigo-400">
                      <Bed className="w-3.5 h-3.5" /> Cool-down & Mobility:
                    </strong>
                    <p>{selectedDaySchedule.cooldownNotes}</p>
                  </div>
                )}
              </div>
            )}

            {/* REST DAY VIEW (Rule 55) */}
            {(selectedDaySchedule?.isRestDay || selectedDaySchedule?.dayType === 'rest' || selectedDaySchedule?.dayType === 'recovery') ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 mx-auto flex items-center justify-center">
                  <Bed className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-black text-slate-900 dark:text-white text-lg">
                    Recovery & Rest Day
                  </h3>
                  <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    {selectedDaySchedule?.restDayNotes?.recoveryNotes ||
                      'No strength session scheduled today. Prioritize hydration, nutrition, and restorative sleep for muscular recovery.'}
                  </p>
                </div>

                {selectedDaySchedule?.restDayNotes && (
                  <div className="grid grid-cols-3 gap-3 max-w-md mx-auto pt-2 text-xs">
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-center border border-slate-100 dark:border-slate-700/60">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Steps Goal</span>
                      <strong className="text-slate-800 dark:text-slate-200 text-sm">
                        {selectedDaySchedule.restDayNotes.stepsTarget?.toLocaleString() || '8,000'}
                      </strong>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-center border border-slate-100 dark:border-slate-700/60">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Sleep Goal</span>
                      <strong className="text-slate-800 dark:text-slate-200 text-sm">
                        {selectedDaySchedule.restDayNotes.sleepTargetHours || 8} hrs
                      </strong>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-center border border-slate-100 dark:border-slate-700/60">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Hydration</span>
                      <strong className="text-slate-800 dark:text-slate-200 text-sm">
                        {selectedDaySchedule.restDayNotes.hydrationLiters || 3} L
                      </strong>
                    </div>
                  </div>
                )}
              </div>
            ) : (!currentDayExercises || currentDayExercises.length === 0) ? (
              /* NOT PLANNED VIEW (Rule 56) */
              <div className="py-12 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                  <Calendar className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-black text-slate-900 dark:text-white text-lg">
                    No Workout Planned
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {activePlanType === 'coach'
                      ? 'This day is not included in your coach\'s training schedule.'
                      : 'You haven\'t configured a workout session for this day in your personal routine.'}
                  </p>
                </div>
                {activePlanType === 'custom' && (
                  <Button variant="outline" size="sm" onClick={handleEditExistingCustomPlan} icon={Plus}>
                    Add Workout For {activeDay}
                  </Button>
                )}
              </div>
            ) : (
              /* EXERCISES LIST */
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-4">
                  {currentDayExercises.map((exercise, idx) => {
                    const isCompleted = Boolean(completedExercises[exercise.name]);
                    const isDetailedMode = Boolean(detailedLoggingModes[exercise.name]);
                    const currentSetsList = exerciseSetLogs[exercise.name] || [];
                    const exercisePR = exerciseHistoryMap[exercise.name]?.pr;
                    const pastSessions = exerciseHistoryMap[exercise.name]?.history || [];
                    const lastSession = pastSessions.length > 0 ? pastSessions[pastSessions.length - 1] : null;

                    return (
                      <div
                        key={idx}
                        className={`p-5 rounded-3xl border transition-all space-y-4 ${
                          isCompleted
                            ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60 shadow-xs'
                            : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800'
                        }`}
                      >
                        {/* Top Exercise Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {/* Checkbox (subtle completed styling, no heavy strikeout) */}
                            <button
                              type="button"
                              onClick={() => toggleExerciseComplete(exercise.name)}
                              className="text-slate-400 hover:text-emerald-500 transition-colors shrink-0"
                              title={isCompleted ? 'Mark incomplete' : 'Mark completed'}
                            >
                              {isCompleted ? (
                                <CheckSquare className="w-6 h-6 text-emerald-500" />
                              ) : (
                                <Square className="w-6 h-6" />
                              )}
                            </button>

                            <span className="w-7 h-7 rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400 font-black text-xs flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>

                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className={`font-black text-base md:text-lg ${isCompleted ? 'text-emerald-800 dark:text-emerald-300' : 'text-slate-900 dark:text-white'}`}>
                                  {exercise.name}
                                </h4>
                                {isCompleted && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                                    ✓ Completed
                                  </span>
                                )}
                              </div>

                              {exercise.techniqueTag && (
                                <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300">
                                  {exercise.techniqueTag}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Historical Performance Pill (Rules 35, 41) */}
                          <div className="flex flex-wrap items-center gap-2">
                            {lastSession && lastSession.actualWeight && (
                              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                Last: {lastSession.actualWeight} × {lastSession.actualReps || 'reps'}
                              </span>
                            )}
                            {exercisePR && exercisePR.maxWeight > 0 && (
                              <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                                <Trophy className="w-3 h-3 text-amber-500" />
                                PR: {exercisePR.maxWeight} kg
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenRestTimer(exercise.restSeconds || 90, exercise.name)}
                              className="text-xs font-bold px-2.5 py-1 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-300 hover:bg-primary-100 border border-primary-200 dark:border-primary-800 flex items-center gap-1 transition-colors"
                            >
                              <Clock className="w-3.5 h-3.5" />
                              <span>Rest {exercise.restSeconds || 60}s</span>
                            </button>
                          </div>
                        </div>

                        {/* Prescribed Specifications Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Prescribed Sets</span>
                            <span className="font-black text-slate-900 dark:text-white text-base">
                              {exercise.sets} Sets
                            </span>
                          </div>
                          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Target Reps</span>
                            <span className="font-black text-slate-900 dark:text-white text-base">
                              {exercise.reps}
                            </span>
                          </div>
                          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Target Load</span>
                            <span className="font-black text-slate-900 dark:text-white text-base">
                              {exercise.load || exercise.weightGuidance || 'Load by feel'}
                            </span>
                          </div>
                          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Tempo / RPE</span>
                            <span className="font-black text-slate-900 dark:text-white text-base">
                              {exercise.tempo || '2-0-1'} {exercise.rpe ? `· RPE ${exercise.rpe}` : ''}
                            </span>
                          </div>
                        </div>

                        {/* Coach Note Callout (Protected & Read-only) */}
                        {exercise.notes && (
                          <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                            <FileText className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                              <strong className="font-bold">Coach Prescription Note:</strong> {exercise.notes}
                            </div>
                          </div>
                        )}

                        {/* Member Performance Inputs (Simple vs Detailed Mode) */}
                        <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              Your Performance Recording
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleDetailedLogging(exercise.name, exercise.sets, exercise.reps)}
                              className="text-xs font-bold text-primary-500 hover:text-primary-600 dark:text-primary-400 flex items-center gap-1 transition-colors"
                            >
                              <span>{isDetailedMode ? 'Switch to Simple Mode' : 'Detailed Sets'}</span>
                              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isDetailedMode ? 'rotate-180' : ''}`} />
                            </button>
                          </div>

                          {/* SIMPLE LOGGING MODE */}
                          {!isDetailedMode ? (
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                              <div className="sm:col-span-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Actual Weight</label>
                                <input
                                  type="text"
                                  placeholder="e.g. 65 kg"
                                  value={actualWeights[exercise.name] || ''}
                                  onChange={(e) =>
                                    setActualWeights({ ...actualWeights, [exercise.name]: e.target.value })
                                  }
                                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                />
                              </div>
                              <div className="sm:col-span-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Actual Reps</label>
                                <input
                                  type="text"
                                  placeholder="e.g. 10"
                                  value={actualReps[exercise.name] || ''}
                                  onChange={(e) =>
                                    setActualReps({ ...actualReps, [exercise.name]: e.target.value })
                                  }
                                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                />
                              </div>
                              <div className="sm:col-span-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Personal Exercise Note</label>
                                <input
                                  type="text"
                                  placeholder="How did this movement feel? (e.g. Clean lockout, shoulder felt good)"
                                  value={exercisePersonalNotes[exercise.name] || ''}
                                  onChange={(e) =>
                                    setExercisePersonalNotes({ ...exercisePersonalNotes, [exercise.name]: e.target.value })
                                  }
                                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                />
                              </div>
                            </div>
                          ) : (
                            /* DETAILED SET-BY-SET LOGGING MODE */
                            <div className="space-y-2 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                              <div className="grid grid-cols-12 gap-2 font-bold text-[10px] uppercase text-slate-400 pb-1 border-b border-slate-100 dark:border-slate-800">
                                <div className="col-span-2">Set</div>
                                <div className="col-span-4">Weight (kg/lbs)</div>
                                <div className="col-span-3">Reps</div>
                                <div className="col-span-2 text-center">Done</div>
                                <div className="col-span-1"></div>
                              </div>

                              {currentSetsList.map((st, sIdx) => (
                                <div key={sIdx} className="grid grid-cols-12 gap-2 items-center">
                                  <div className="col-span-2 font-bold text-slate-700 dark:text-slate-300">
                                    Set {st.setNumber || sIdx + 1}
                                  </div>
                                  <div className="col-span-4">
                                    <input
                                      type="text"
                                      placeholder="60 kg"
                                      value={st.weight || ''}
                                      onChange={(e) =>
                                        handleUpdateSetLog(exercise.name, sIdx, 'weight', e.target.value)
                                      }
                                      className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                                    />
                                  </div>
                                  <div className="col-span-3">
                                    <input
                                      type="text"
                                      placeholder="10"
                                      value={st.reps || ''}
                                      onChange={(e) =>
                                        handleUpdateSetLog(exercise.name, sIdx, 'reps', e.target.value)
                                      }
                                      className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                                    />
                                  </div>
                                  <div className="col-span-2 flex justify-center">
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateSetLog(exercise.name, sIdx, 'completed', !st.completed)}
                                      className={`p-1 rounded-md transition-colors ${st.completed ? 'text-emerald-500' : 'text-slate-300 hover:text-slate-500'}`}
                                    >
                                      {st.completed ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                                    </button>
                                  </div>
                                  <div className="col-span-1 text-right">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveSet(exercise.name, sIdx)}
                                      className="text-slate-300 hover:text-red-500 p-1"
                                      title="Remove set"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}

                              <div className="pt-2 flex items-center justify-between">
                                <button
                                  type="button"
                                  onClick={() => handleAddSet(exercise.name)}
                                  className="text-xs font-bold text-primary-500 hover:text-primary-600 flex items-center gap-1"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Add Set</span>
                                </button>
                                <span className="text-[10px] text-slate-400">
                                  {currentSetsList.filter((s) => s.completed).length} of {currentSetsList.length} sets logged
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Overall Session Notes & Feeling (Rules 44, 45) */}
                <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary-500" />
                    Overall Workout Notes & Feedback
                  </h4>

                  <textarea
                    rows={2}
                    placeholder="How was your energy and workout feeling today? (e.g. Great intensity, hit all target sets smoothly)"
                    value={memberDailyNote}
                    onChange={(e) => setMemberDailyNote(e.target.value)}
                    className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                  />

                  <div className="flex flex-wrap items-center gap-4 pt-1">
                    {/* Energy Level */}
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-400">Energy:</span>
                      {['Low', 'Normal', 'High'].map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setEnergyLevel(energyLevel === lvl ? '' : lvl)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                            energyLevel === lvl
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>

                    {/* Difficulty */}
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-400">Session Difficulty:</span>
                      {['Easy', 'Moderate', 'Hard'].map((diff) => (
                        <button
                          key={diff}
                          type="button"
                          onClick={() => setDifficultyFeeling(difficultyFeeling === diff ? '' : diff)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                            difficultyFeeling === diff
                              ? 'bg-primary-600 text-white shadow-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {diff}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SINGLE STICKY BOTTOM ACTION AREA (Rules 32, 86: Remove duplicate CTAs, one clear action) */}
      {currentPlan && currentDayExercises.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-2xl">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                Today's Workout: <strong>{completedCount} / {currentDayExercises.length}</strong> Completed ({completionPercent}%)
              </span>
              {isSavedToday && (
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Saved
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="primary"
                size="md"
                loading={savingLog}
                onClick={handleSaveLog}
                icon={Save}
                className="w-full sm:w-auto font-black shadow-lg shadow-primary-500/20"
              >
                {isSavedToday ? 'Update Today\'s Workout Log' : 'Save Today\'s Workout Log'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* REST TIMER MODAL / DOCKED COMPONENT (Rule 34) */}
      {restTimerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 text-center">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary-500" />
                <h3 className="font-black text-slate-900 dark:text-white text-base">
                  Rest Interval
                </h3>
              </div>
              <button
                onClick={() => setRestTimerOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {restTimerExerciseName && (
              <p className="text-xs text-slate-500 font-medium">
                Resting after: <strong className="text-slate-800 dark:text-slate-200">{restTimerExerciseName}</strong>
              </p>
            )}

            {/* Large Digital Clock */}
            <div className="py-6 px-4 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <div className={`text-5xl font-black font-mono tracking-tight ${restTimerSeconds === 0 ? 'text-emerald-500 animate-bounce' : 'text-slate-900 dark:text-white'}`}>
                {formatTime(restTimerSeconds)}
              </div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                {restTimerSeconds === 0 ? 'Ready For Next Set!' : 'Take deep breaths & hydrate'}
              </div>
            </div>

            {/* Timer Controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setRestTimerRunning(!restTimerRunning)}
                className={`p-3 rounded-2xl font-bold flex items-center gap-1.5 transition-all shadow-md ${
                  restTimerRunning
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {restTimerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>

              <button
                type="button"
                onClick={() => setRestTimerSeconds(restTimerInitial)}
                className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Reset timer"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => setRestTimerSeconds((prev) => prev + 30)}
                className="px-3 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold transition-colors"
              >
                +30s
              </button>

              <button
                type="button"
                onClick={() => {
                  setRestTimerSeconds(0);
                  setRestTimerRunning(false);
                }}
                className="px-3 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold transition-colors"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5-STEP CUSTOM WORKOUT BUILDER MODAL (Rules 5-26) */}
      {isBuilderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
          <div className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
            {/* Builder Header */}
            <div className="p-6 bg-gradient-to-r from-primary-600 to-indigo-800 text-white flex items-center justify-between shrink-0">
              <div className="space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider text-primary-200">
                  Custom Workout Builder
                </div>
                <h3 className="text-xl font-black">
                  {builderPlan.title || 'Personal Training Routine'}
                </h3>
              </div>
              <button
                onClick={() => setIsBuilderOpen(false)}
                className="p-1 rounded-xl bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Tabs */}
            <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 px-6 py-2 overflow-x-auto shrink-0">
              {[
                { num: 1, label: 'Plan Setup' },
                { num: 2, label: 'Weekly Schedule' },
                { num: 3, label: 'Exercises' },
                { num: 4, label: 'Review & Save' },
              ].map((st) => (
                <button
                  key={st.num}
                  type="button"
                  onClick={() => setBuilderStep(st.num)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors shrink-0 flex items-center gap-2 ${
                    builderStep === st.num
                      ? 'bg-primary-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                    {st.num}
                  </span>
                  <span>{st.label}</span>
                </button>
              ))}
            </div>

            {/* Builder Body (Scrollable) */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* STEP 1: PLAN SETUP (Rule 6) */}
              {builderStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Plan Name *
                      </label>
                      <input
                        type="text"
                        value={builderPlan.title}
                        onChange={(e) => setBuilderPlan({ ...builderPlan, title: e.target.value })}
                        placeholder="e.g. My Upper / Lower Hypertrophy Split"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Primary Training Goal
                      </label>
                      <select
                        value={builderPlan.goal}
                        onChange={(e) => setBuilderPlan({ ...builderPlan, goal: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        {GOAL_OPTIONS.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Workout Split
                      </label>
                      <select
                        value={builderPlan.splitType}
                        onChange={(e) => setBuilderPlan({ ...builderPlan, splitType: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        {SPLIT_OPTIONS.map((sp) => (
                          <option key={sp} value={sp}>{sp}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Difficulty Level
                      </label>
                      <select
                        value={builderPlan.difficulty}
                        onChange={(e) => setBuilderPlan({ ...builderPlan, difficulty: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        {DIFFICULTY_OPTIONS.map((df) => (
                          <option key={df} value={df}>{df}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Duration (Weeks)
                      </label>
                      <input
                        type="text"
                        value={builderPlan.duration}
                        onChange={(e) => setBuilderPlan({ ...builderPlan, duration: e.target.value })}
                        placeholder="e.g. 8 Weeks"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={builderPlan.startDate}
                        onChange={(e) => setBuilderPlan({ ...builderPlan, startDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1 text-xs">
                      Description & Personal Notes
                    </label>
                    <textarea
                      rows={3}
                      value={builderPlan.description}
                      onChange={(e) => setBuilderPlan({ ...builderPlan, description: e.target.value })}
                      placeholder="Outline the focus of this program, target progression, or equipment availability..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: WEEKLY SCHEDULE (Rule 7, 8, 22) */}
              {builderStep === 2 && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        Configure Days of the Week
                      </h4>
                      <p className="text-xs text-slate-500">
                        Designate Workout Days, Rest Days, or Recovery Days without ambiguous labels.
                      </p>
                    </div>
                  </div>

                  {/* Days Accordion */}
                  <div className="space-y-3">
                    {builderPlan.weeklySchedule.map((dayItem) => {
                      const isExpanded = builderActiveDay === dayItem.day;

                      return (
                        <div
                          key={dayItem.day}
                          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 overflow-hidden"
                        >
                          <div
                            onClick={() => setBuilderActiveDay(dayItem.day)}
                            className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-black text-slate-900 dark:text-white text-sm w-24">
                                {dayItem.day}
                              </span>
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                dayItem.dayType === 'workout'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : dayItem.dayType === 'rest'
                                  ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                  : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                              }`}>
                                {dayItem.dayType === 'workout' ? 'Workout Day' : dayItem.dayType === 'rest' ? 'Rest Day' : 'Recovery Day'}
                              </span>
                              <span className="text-xs text-slate-500 hidden sm:inline">
                                {dayItem.title || dayItem.focus}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-400">
                                {dayItem.exercises?.length || 0} exercises
                              </span>
                              <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 space-y-4 text-xs">
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                    Day Type
                                  </label>
                                  <select
                                    value={dayItem.dayType}
                                    onChange={(e) => handleUpdateBuilderDay(dayItem.day, 'dayType', e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                  >
                                    <option value="workout">Workout Day</option>
                                    <option value="rest">Rest Day</option>
                                    <option value="recovery">Recovery Day</option>
                                    <option value="not_planned">Not Planned</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                    Workout Title
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="e.g. Push — Chest & Triceps"
                                    value={dayItem.title}
                                    onChange={(e) => handleUpdateBuilderDay(dayItem.day, 'title', e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                  />
                                </div>

                                <div>
                                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                    Focus Categories
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="Chest, Shoulders, Triceps"
                                    value={dayItem.focus}
                                    onChange={(e) => handleUpdateBuilderDay(dayItem.day, 'focus', e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                  />
                                </div>
                              </div>

                              {dayItem.dayType === 'workout' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                      Warm-up Guidance
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="e.g. 5 min light jog & shoulder circles"
                                      value={dayItem.warmupNotes}
                                      onChange={(e) => handleUpdateBuilderDay(dayItem.day, 'warmupNotes', e.target.value)}
                                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                      Cool-down / Stretching
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="e.g. Chest stretch & deep breathing"
                                      value={dayItem.cooldownNotes}
                                      onChange={(e) => handleUpdateBuilderDay(dayItem.day, 'cooldownNotes', e.target.value)}
                                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Duplicate Day Helper (Rule 22) */}
                              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                                <span className="text-[11px] text-slate-400">
                                  Duplicate this day to another weekday:
                                </span>
                                <div className="flex items-center gap-1.5">
                                  {DAYS_OF_WEEK.filter((d) => d !== dayItem.day).map((targetD) => (
                                    <button
                                      key={targetD}
                                      type="button"
                                      onClick={() => handleDuplicateDayInBuilder(dayItem.day, targetD)}
                                      className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-primary-400"
                                      title={`Copy ${dayItem.day} to ${targetD}`}
                                    >
                                      → {targetD.slice(0, 3)}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 3: EXERCISES (Rules 10-21) */}
              {builderStep === 3 && (
                <div className="space-y-5">
                  {/* Select day tab for adding exercises */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-100 dark:border-slate-800">
                    {builderPlan.weeklySchedule.map((d) => (
                      <button
                        key={d.day}
                        type="button"
                        onClick={() => setBuilderActiveDay(d.day)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 flex items-center gap-1.5 ${
                          builderActiveDay === d.day
                            ? 'bg-primary-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <span>{d.day}</span>
                        <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] flex items-center justify-center font-bold">
                          {d.exercises?.length || 0}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Day Exercise List */}
                  {(() => {
                    const currentDay = builderPlan.weeklySchedule.find((d) => d.day === builderActiveDay);
                    const exercises = currentDay?.exercises || [];

                    return (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                              {builderActiveDay} Exercises ({exercises.length})
                            </h4>
                            <p className="text-xs text-slate-500">
                              Add, reorder, and configure prescription for each movement.
                            </p>
                          </div>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => openExerciseSelector(builderActiveDay)}
                            icon={Plus}
                          >
                            Add Exercise
                          </Button>
                        </div>

                        {exercises.length === 0 ? (
                          <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-center space-y-2">
                            <Dumbbell className="w-8 h-8 text-slate-400 mx-auto" />
                            <p className="text-xs text-slate-500">No exercises added for {builderActiveDay} yet.</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openExerciseSelector(builderActiveDay)}
                              icon={Plus}
                            >
                              Browse Exercise Library
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {exercises.map((ex, exIdx) => (
                              <div
                                key={exIdx}
                                className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-primary-500/10 text-primary-600 font-bold text-xs flex items-center justify-center">
                                      {exIdx + 1}
                                    </span>
                                    <input
                                      type="text"
                                      value={ex.name}
                                      onChange={(e) => handleUpdateExerciseInBuilder(builderActiveDay, exIdx, 'name', e.target.value)}
                                      className="font-bold text-slate-900 dark:text-white bg-transparent border-b border-dashed border-slate-300 dark:border-slate-600 text-sm focus:outline-none"
                                    />
                                  </div>

                                  {/* Exercise Reorder & Delete Actions (Rules 20, 21) */}
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      disabled={exIdx === 0}
                                      onClick={() => handleMoveExercise(builderActiveDay, exIdx, -1)}
                                      className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 disabled:opacity-30"
                                      title="Move up"
                                    >
                                      <ArrowUp className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={exIdx === exercises.length - 1}
                                      onClick={() => handleMoveExercise(builderActiveDay, exIdx, 1)}
                                      className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 disabled:opacity-30"
                                      title="Move down"
                                    >
                                      <ArrowDown className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteExerciseInBuilder(builderActiveDay, exIdx)}
                                      className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500"
                                      title="Delete exercise"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>

                                {/* Exercise Prescription Fields Grid (Rule 17-19) */}
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                                  <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Sets</label>
                                    <input
                                      type="number"
                                      min={1}
                                      value={ex.sets}
                                      onChange={(e) => handleUpdateExerciseInBuilder(builderActiveDay, exIdx, 'sets', Number(e.target.value))}
                                      className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Reps / Format</label>
                                    <input
                                      type="text"
                                      placeholder="8-10, AMRAP"
                                      value={ex.reps}
                                      onChange={(e) => handleUpdateExerciseInBuilder(builderActiveDay, exIdx, 'reps', e.target.value)}
                                      className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Target Load</label>
                                    <input
                                      type="text"
                                      placeholder="60 kg, BW"
                                      value={ex.load || ''}
                                      onChange={(e) => handleUpdateExerciseInBuilder(builderActiveDay, exIdx, 'load', e.target.value)}
                                      className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Rest (sec)</label>
                                    <input
                                      type="number"
                                      value={ex.restSeconds || 60}
                                      onChange={(e) => handleUpdateExerciseInBuilder(builderActiveDay, exIdx, 'restSeconds', Number(e.target.value))}
                                      className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Tempo / RPE</label>
                                    <input
                                      type="text"
                                      placeholder="3-1-1 / RPE 8"
                                      value={ex.tempo || ''}
                                      onChange={(e) => handleUpdateExerciseInBuilder(builderActiveDay, exIdx, 'tempo', e.target.value)}
                                      className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* STEP 4: REVIEW & SAVE (Rule 26) */}
              {builderStep === 4 && (
                <div className="space-y-5 text-xs">
                  <div className="p-4 rounded-2xl bg-primary-50 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800 text-primary-900 dark:text-primary-200 space-y-1">
                    <h4 className="font-black text-sm">Review Your Custom Routine</h4>
                    <p>Confirm weekly scheduling and exercise prescriptions before finalizing your plan.</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Plan Title</span>
                      <strong className="text-slate-900 dark:text-white">{builderPlan.title}</strong>
                    </div>
                    <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Goal</span>
                      <strong className="text-slate-900 dark:text-white">{builderPlan.goal}</strong>
                    </div>
                    <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Split</span>
                      <strong className="text-slate-900 dark:text-white">{builderPlan.splitType}</strong>
                    </div>
                    <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Duration</span>
                      <strong className="text-slate-900 dark:text-white">{builderPlan.duration}</strong>
                    </div>
                  </div>

                  {/* Schedule Breakdown */}
                  <div className="space-y-2">
                    <h5 className="font-bold text-slate-800 dark:text-slate-200">Weekly Breakdown</h5>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                      {builderPlan.weeklySchedule.map((d) => (
                        <div key={d.day} className="p-3 flex items-center justify-between bg-white dark:bg-slate-850">
                          <span className="font-bold text-slate-800 dark:text-slate-200 w-24">{d.day}</span>
                          <span className="text-slate-500">
                            {d.dayType === 'workout'
                              ? `${d.exercises?.length || 0} exercises (${d.focus || d.title})`
                              : d.dayType === 'rest'
                              ? 'Rest & Active Recovery'
                              : 'Recovery Day'}
                          </span>
                          <span className="text-[11px] font-bold text-primary-500">
                            {d.exercises?.length ? `${d.exercises.length} Ex` : 'Rest'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Builder Footer Actions */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setBuilderStep((prev) => Math.max(1, prev - 1))}
                disabled={builderStep === 1}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 disabled:opacity-40"
              >
                Previous Step
              </button>

              <div className="flex items-center gap-2">
                {builderStep < 4 ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setBuilderStep((prev) => Math.min(4, prev + 1))}
                  >
                    Next Step
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    loading={savingBuilder}
                    onClick={handleSaveCustomPlan}
                    icon={Save}
                  >
                    Save & Activate Plan
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EXERCISE SELECTOR DRAWER / MODAL (Rules 10-15) */}
      {exerciseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-primary-500" />
                <h3 className="font-black text-slate-900 dark:text-white text-base">
                  Add Exercise to {targetDayForExercise}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCustomExerciseModalOpen(true)}
                  icon={Plus}
                >
                  Create Custom
                </Button>
                <button onClick={() => setExerciseModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 space-y-3 shrink-0 text-xs">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search exercise (e.g. Bench Press, Squat, Lat Pulldown)..."
                  value={exerciseSearchQuery}
                  onChange={(e) => setExerciseSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              {/* Filters Horizontal Chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-[10px] font-bold uppercase text-slate-400 shrink-0">Muscle:</span>
                {MUSCLE_GROUPS.slice(0, 10).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSelectedMuscleFilter(m)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-colors ${
                      selectedMuscleFilter === m
                        ? 'bg-primary-600 text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Exercise Results List */}
            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {loadingExercises ? (
                <div className="py-12 text-center text-xs text-slate-400">Loading exercise library...</div>
              ) : filteredExercises.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <p className="text-xs text-slate-500">No exercises found matching your search query.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCustomExerciseModalOpen(true)}
                    icon={Plus}
                  >
                    Create Custom Exercise
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredExercises.map((ex) => (
                    <div
                      key={ex._id || ex.name}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-primary-400 transition-all space-y-2 flex flex-col justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                            {ex.name}
                          </h4>
                          <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {ex.difficulty || 'Intermediate'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span>{ex.primaryMuscleGroup}</span>
                          <span>·</span>
                          <span>{ex.equipment}</span>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-700/60">
                        <button
                          type="button"
                          onClick={() => setSelectedExerciseForDetails(ex)}
                          className="text-[11px] font-bold text-primary-500 hover:underline flex items-center gap-0.5"
                        >
                          <Info className="w-3 h-3" />
                          <span>Instructions</span>
                        </button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleAddExerciseToBuilder(targetDayForExercise, ex)}
                          icon={Plus}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE CUSTOM EXERCISE MODAL (Rule 16) */}
      {customExerciseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary-500" />
                Create Custom Exercise
              </h3>
              <button onClick={() => setCustomExerciseModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomExercise} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Exercise Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bulgarian Split Squat"
                  value={customExerciseForm.name}
                  onChange={(e) => setCustomExerciseForm({ ...customExerciseForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Muscle Group</label>
                  <select
                    value={customExerciseForm.primaryMuscleGroup}
                    onChange={(e) => setCustomExerciseForm({ ...customExerciseForm, primaryMuscleGroup: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {MUSCLE_GROUPS.filter((m) => m !== 'All').map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Equipment</label>
                  <select
                    value={customExerciseForm.equipment}
                    onChange={(e) => setCustomExerciseForm({ ...customExerciseForm, equipment: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {EQUIPMENT_OPTIONS.filter((eq) => eq !== 'All').map((eq) => (
                      <option key={eq} value={eq}>{eq}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Movement Pattern</label>
                <select
                  value={customExerciseForm.movementPattern}
                  onChange={(e) => setCustomExerciseForm({ ...customExerciseForm, movementPattern: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {MOVEMENT_PATTERNS.filter((mp) => mp !== 'All').map((mp) => (
                    <option key={mp} value={mp}>{mp}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Instructions / Cues</label>
                <textarea
                  rows={2}
                  placeholder="Key form cues and setup instructions..."
                  value={customExerciseForm.instructions}
                  onChange={(e) => setCustomExerciseForm({ ...customExerciseForm, instructions: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button variant="outline" size="sm" type="button" onClick={() => setCustomExerciseModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Save to My Library
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXERCISE DETAILS / INSTRUCTIONS MODAL (Rule 79) */}
      {selectedExerciseForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 dark:text-white text-base">
                {selectedExerciseForDetails.name}
              </h3>
              <button onClick={() => setSelectedExerciseForDetails(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-300 font-bold">
                {selectedExerciseForDetails.primaryMuscleGroup}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                {selectedExerciseForDetails.equipment}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                {selectedExerciseForDetails.difficulty}
              </span>
            </div>

            <div className="space-y-1">
              <strong className="font-bold text-slate-800 dark:text-slate-200 block">Form Instructions:</strong>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {selectedExerciseForDetails.instructions || selectedExerciseForDetails.description || 'Perform with controlled tempo and full range of motion. Keep core braced throughout.'}
              </p>
            </div>

            <div className="pt-2">
              <Button variant="outline" size="sm" className="w-full" onClick={() => setSelectedExerciseForDetails(null)}>
                Close Details
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TEMPLATE PICKER MODAL (Rule 52) */}
      {templatePickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary-500" />
                <h3 className="font-black text-slate-900 dark:text-white text-base">
                  Choose a Training Template
                </h3>
              </div>
              <button onClick={() => setTemplatePickerOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 shrink-0">
              Templates create an editable custom draft without affecting your official coach prescription.
            </p>

            <div className="overflow-y-auto space-y-3 flex-1">
              {PREDEFINED_TEMPLATES.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-primary-400 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                      {tmpl.title}
                    </h4>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-300">
                      {tmpl.difficulty}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {tmpl.description}
                  </p>

                  <div className="pt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      Goal: <strong>{tmpl.goal}</strong> · Duration: <strong>{tmpl.duration}</strong>
                    </span>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleApplyTemplate(tmpl)}
                    >
                      Use Template
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* HISTORY MODAL (Plan History + Workout Log History + PRs) (Rules 36-41) */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            {/* History Header & Tabs */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-primary-500" />
                <h3 className="font-black text-slate-900 dark:text-white text-base">
                  Training History & Analytics
                </h3>
              </div>

              <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* History Navigation Tabs */}
            <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 px-6 py-2 gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setHistoryTab('logs')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                  historyTab === 'logs'
                    ? 'bg-primary-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Workout Log History ({workoutLogsList.length})
              </button>
              <button
                type="button"
                onClick={() => setHistoryTab('plans')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                  historyTab === 'plans'
                    ? 'bg-primary-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Plan History ({history.length})
              </button>
              <button
                type="button"
                onClick={() => setHistoryTab('prs')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                  historyTab === 'prs'
                    ? 'bg-primary-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Personal Records & Exercise Stats
              </button>
            </div>

            {/* History Content */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* TAB 1: WORKOUT LOG HISTORY (Rule 38) */}
              {historyTab === 'logs' && (
                <div className="space-y-3">
                  {workoutLogsList.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400">
                      No saved workout logs yet. Complete a training session to start logging history!
                    </div>
                  ) : (
                    workoutLogsList.map((log) => (
                      <div
                        key={log._id}
                        className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-2 hover:border-primary-400 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-primary-500 uppercase tracking-wider">
                              {log.date} · {log.day || 'Training Day'}
                            </span>
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                              {log.workoutTitle || 'Workout Session'}
                            </h4>
                          </div>

                          <div className="flex items-center gap-2">
                            {log.isWorkoutCompleted && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                                Completed
                              </span>
                            )}
                            {log.totalVolumeKg > 0 && (
                              <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-[10px]">
                                Volume: {log.totalVolumeKg} kg
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                          <span>Exercises: <strong>{log.exerciseLogs?.length || 0}</strong></span>
                          <span>Completed: <strong>{log.completedExercisesCount || 0}</strong></span>
                          {log.durationMinutes && (
                            <span>Duration: <strong>{log.durationMinutes} min</strong></span>
                          )}
                          {log.energyLevel && (
                            <span>Energy: <strong>{log.energyLevel}</strong></span>
                          )}
                        </div>

                        {log.overallNotes && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                            "{log.overallNotes}"
                          </p>
                        )}

                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => setSelectedLogDetail(selectedLogDetail?._id === log._id ? null : log)}
                            className="text-xs font-bold text-primary-500 hover:underline flex items-center gap-1"
                          >
                            <span>{selectedLogDetail?._id === log._id ? 'Hide Exercises' : 'View Exercises & Sets'}</span>
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${selectedLogDetail?._id === log._id ? 'rotate-180' : ''}`} />
                          </button>

                          {selectedLogDetail?._id === log._id && (
                            <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                              {log.exerciseLogs?.map((exLog, exIdx) => (
                                <div key={exIdx} className="flex items-center justify-between py-1 border-b border-slate-200/50 dark:border-slate-700/50">
                                  <span className="font-bold text-slate-800 dark:text-slate-200">
                                    {exLog.completed ? '✓ ' : '○ '}{exLog.exerciseName}
                                  </span>
                                  <span className="text-slate-500">
                                    {exLog.actualWeight ? `${exLog.actualWeight} × ${exLog.actualReps || 'reps'}` : `${exLog.actualSets || 3} sets`}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 2: PLAN HISTORY (Rule 37) */}
              {historyTab === 'plans' && (
                <div className="space-y-3">
                  {history.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400">
                      No previous workout plans on record.
                    </div>
                  ) : (
                    history.map((histPlan) => (
                      <div
                        key={histPlan._id}
                        className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                            {histPlan.title}
                          </h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 uppercase">
                            {histPlan.status || (histPlan.isActive ? 'Active' : 'Archived')}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                          <span>Goal: <strong>{histPlan.goal}</strong></span>
                          <span>Coach: <strong>{histPlan.trainer?.name || 'Assigned Coach'}</strong></span>
                          <span>Created: <strong>{new Date(histPlan.createdAt).toLocaleDateString()}</strong></span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 3: PERSONAL RECORDS & EXERCISE STATS (Rule 35, 40, 60) */}
              {historyTab === 'prs' && (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search exercise performance (e.g. Bench Press, Squat)..."
                      value={prSearchQuery}
                      onChange={(e) => setPrSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.values(exerciseHistoryMap)
                      .filter((exRecord) =>
                        !prSearchQuery.trim() ||
                        exRecord.exerciseName?.toLowerCase().includes(prSearchQuery.toLowerCase())
                      )
                      .map((exRecord) => (
                        <div
                          key={exRecord.exerciseName}
                          className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                              {exRecord.exerciseName}
                            </h4>
                            <span className="text-[10px] text-slate-400 font-semibold">
                              {exRecord.history?.length || 0} Sessions
                            </span>
                          </div>

                          {exRecord.pr && exRecord.pr.maxWeight > 0 ? (
                            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                              <div className="p-2 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/40">
                                <span className="text-[9px] uppercase font-bold text-amber-600 block">Max Weight</span>
                                <strong className="text-amber-800 dark:text-amber-300 text-xs">
                                  {exRecord.pr.maxWeight} kg
                                </strong>
                              </div>
                              <div className="p-2 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/40">
                                <span className="text-[9px] uppercase font-bold text-indigo-600 block">Max Reps</span>
                                <strong className="text-indigo-800 dark:text-indigo-300 text-xs">
                                  {exRecord.pr.maxReps}
                                </strong>
                              </div>
                              <div className="p-2 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/40">
                                <span className="text-[9px] uppercase font-bold text-emerald-600 block">Est. 1RM</span>
                                <strong className="text-emerald-800 dark:text-emerald-300 text-xs">
                                  {exRecord.pr.estimated1RM} kg
                                </strong>
                              </div>
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-400 italic">
                              Logged in sessions without numerical weight.
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberWorkout;
