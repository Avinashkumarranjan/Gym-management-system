import React, { useState, useEffect, useMemo } from 'react';
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
  Search,
  Filter,
  ArrowUp,
  ArrowDown,
  Copy,
  Eye,
  Sliders,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  X,
  Send,
  Bed,
  Footprints,
  Moon,
  Droplets,
  Layers,
} from 'lucide-react';
import workoutService from '../../services/workoutService';
import trainerService from '../../services/trainerService';
import exerciseService from '../../services/exerciseService';
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
  'Mobility',
  'Rehabilitation',
  'Powerlifting',
  'Bodybuilding',
  'HIIT',
  'Functional Fitness',
  'Custom',
];

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

const DIFFICULTY_OPTIONS = ['Beginner', 'Intermediate', 'Advanced', 'Athlete'];

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
  'Olympic',
  'Other',
];

const EQUIPMENT_OPTIONS = [
  'All',
  'Bodyweight',
  'Barbell',
  'Dumbbell',
  'Cable',
  'Machine',
  'Kettlebell',
  'Resistance Band',
  'Smith Machine',
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
  'Anti-Rotation',
  'Isolation',
  'Cardio',
  'Mobility',
  'Plyometric',
  'Olympic',
  'Other',
];

// Optional Starter Templates
const OPTIONAL_TEMPLATES = {
  'Push Pull Legs': {
    title: 'Push Pull Legs 6-Day Split',
    goal: 'Muscle Building',
    splitType: 'Push Pull Legs',
    difficulty: 'Intermediate',
    duration: '12 Weeks',
    description: 'Classic high-frequency hypertrophy split targeting all major muscle groups twice per week.',
    schedule: [
      {
        day: 'Monday',
        isRestDay: false,
        title: 'Push Day A',
        focus: 'Chest, Shoulders & Triceps',
        estimatedDuration: 65,
        exercises: [
          { name: 'Barbell Bench Press', sets: 4, reps: '8-10', load: '75% 1RM', restSeconds: 90, tempo: '3-0-1', notes: 'Scapulae retracted' },
          { name: 'Incline Dumbbell Press', sets: 3, reps: '10-12', load: 'Moderate', restSeconds: 60, tempo: '2-0-1', notes: 'Upper chest focus' },
          { name: 'Dumbbell Lateral Raise', sets: 4, reps: '12-15', load: 'Light', restSeconds: 45, tempo: '2-0-1', notes: 'Lead with elbows' },
          { name: 'Tricep Rope Pushdown', sets: 3, reps: '12-15', load: 'Moderate', restSeconds: 60, tempo: '2-0-1', notes: 'Peak contraction' },
        ],
      },
      {
        day: 'Tuesday',
        isRestDay: false,
        title: 'Pull Day A',
        focus: 'Back & Biceps',
        estimatedDuration: 65,
        exercises: [
          { name: 'Conventional Barbell Deadlift', sets: 3, reps: '5', load: '80% 1RM', restSeconds: 150, tempo: '2-1-1', notes: 'Reset each rep' },
          { name: 'Pull-Ups', sets: 4, reps: '8-10', load: 'Bodyweight', restSeconds: 90, tempo: '2-0-1', notes: 'Chest to bar' },
          { name: 'Barbell Bent-Over Row', sets: 3, reps: '8-10', load: 'Moderate', restSeconds: 75, tempo: '2-0-1', notes: 'Pull to bellybutton' },
          { name: 'Barbell Bicep Curl', sets: 3, reps: '10-12', load: 'Moderate', restSeconds: 60, tempo: '2-0-1', notes: 'Strict form' },
        ],
      },
      {
        day: 'Wednesday',
        isRestDay: false,
        title: 'Legs Day A',
        focus: 'Quads, Hamstrings & Calves',
        estimatedDuration: 70,
        exercises: [
          { name: 'Barbell Back Squat', sets: 4, reps: '6-8', load: '75% 1RM', restSeconds: 120, tempo: '3-0-1', notes: 'Below parallel' },
          { name: 'Romanian Deadlift (RDL)', sets: 3, reps: '8-10', load: 'Moderate', restSeconds: 90, tempo: '3-1-1', notes: 'Hips back' },
          { name: 'Leg Press', sets: 3, reps: '12-15', load: 'Moderate-Heavy', restSeconds: 75, tempo: '2-0-1', notes: 'Full depth' },
          { name: 'Standing Calf Raise', sets: 4, reps: '15', load: 'Moderate', restSeconds: 45, tempo: '2-2-1', notes: 'Pause at top' },
        ],
      },
      {
        day: 'Thursday',
        isRestDay: true,
        title: 'Active Recovery',
        focus: 'Rest & Mobility',
        estimatedDuration: 30,
        restDayNotes: { recoveryNotes: 'Light walk and foam rolling', stepsTarget: 10000, sleepTargetHours: 8, hydrationLiters: 3.5, mobilityNotes: 'Hamstring and shoulder mobility drills' },
        exercises: [],
      },
      {
        day: 'Friday',
        isRestDay: false,
        title: 'Push Day B',
        focus: 'Shoulders, Chest & Triceps',
        estimatedDuration: 60,
        exercises: [
          { name: 'Overhead Barbell Press', sets: 4, reps: '6-8', load: '75% 1RM', restSeconds: 90, tempo: '2-0-1', notes: 'Brace core' },
          { name: 'Push-Ups', sets: 3, reps: 'AMRAP', load: 'Bodyweight', restSeconds: 60, tempo: '2-0-1', notes: 'Full extension' },
          { name: 'Cable Chest Fly', sets: 3, reps: '12-15', load: 'Light-Moderate', restSeconds: 45, tempo: '2-1-1', notes: 'Deep stretch' },
          { name: 'Dumbbell Skull Crushers', sets: 3, reps: '10-12', load: 'Moderate', restSeconds: 60, tempo: '2-0-1', notes: 'Control descent' },
        ],
      },
      {
        day: 'Saturday',
        isRestDay: false,
        title: 'Pull Day B',
        focus: 'Lats & Upper Back',
        estimatedDuration: 60,
        exercises: [
          { name: 'Lat Pulldown', sets: 4, reps: '10-12', load: 'Moderate', restSeconds: 60, tempo: '2-1-1', notes: 'Squeeze lats' },
          { name: 'Seated Cable Row', sets: 3, reps: '10-12', load: 'Moderate', restSeconds: 60, tempo: '2-0-1', notes: 'Retract scapulae' },
          { name: 'Face Pulls', sets: 4, reps: '15', load: 'Light', restSeconds: 45, tempo: '2-1-1', notes: 'High elbows' },
          { name: 'Incline Dumbbell Curl', sets: 3, reps: '10-12', load: 'Moderate', restSeconds: 60, tempo: '2-0-1', notes: 'Full supination' },
        ],
      },
      {
        day: 'Sunday',
        isRestDay: true,
        title: 'Complete Rest',
        focus: 'Sleep & Hydration',
        estimatedDuration: 0,
        restDayNotes: { recoveryNotes: 'Full physical rest, hydrate and replenish glycogen.', stepsTarget: 6000, sleepTargetHours: 9, hydrationLiters: 3, mobilityNotes: 'Gentle stretching if desired' },
        exercises: [],
      },
    ],
  },
  'Upper Lower': {
    title: 'Upper / Lower 4-Day Strength & Size',
    goal: 'Strength',
    splitType: 'Upper / Lower',
    difficulty: 'Intermediate',
    duration: '8 Weeks',
    description: 'Efficient 4-day split balancing upper and lower body muscle mass and compound strength.',
    schedule: [
      {
        day: 'Monday',
        isRestDay: false,
        title: 'Upper Strength',
        focus: 'Chest, Back & Shoulders',
        estimatedDuration: 65,
        exercises: [
          { name: 'Barbell Bench Press', sets: 4, reps: '6-8', load: '80% 1RM', restSeconds: 120, tempo: '3-0-1', notes: 'Pause on chest' },
          { name: 'Barbell Bent-Over Row', sets: 4, reps: '6-8', load: '80% 1RM', restSeconds: 90, tempo: '2-0-1', notes: 'Keep torso stable' },
          { name: 'Overhead Barbell Press', sets: 3, reps: '8', load: 'Moderate', restSeconds: 90, tempo: '2-0-1', notes: 'Full lockout' },
          { name: 'Pull-Ups', sets: 3, reps: '8-10', load: 'Bodyweight', restSeconds: 75, tempo: '2-0-1', notes: 'Smooth pull' },
        ],
      },
      {
        day: 'Tuesday',
        isRestDay: false,
        title: 'Lower Strength',
        focus: 'Quads & Hamstrings',
        estimatedDuration: 65,
        exercises: [
          { name: 'Barbell Back Squat', sets: 4, reps: '5', load: '82% 1RM', restSeconds: 150, tempo: '3-1-1', notes: 'Solid brace' },
          { name: 'Romanian Deadlift (RDL)', sets: 4, reps: '6-8', load: '75% 1RM', restSeconds: 120, tempo: '3-0-1', notes: 'Feel hamstring load' },
          { name: 'Walking Dumbbell Lunges', sets: 3, reps: '10/leg', load: 'Moderate', restSeconds: 75, tempo: '2-0-1', notes: 'Upright chest' },
          { name: 'Plank Hold', sets: 3, reps: '45 sec', load: 'Bodyweight', restSeconds: 45, tempo: 'Static', notes: 'Tight glutes' },
        ],
      },
      {
        day: 'Wednesday',
        isRestDay: true,
        title: 'Active Recovery',
        focus: 'Rest & Mobility',
        estimatedDuration: 20,
        restDayNotes: { recoveryNotes: 'Mobility work and gentle walking', stepsTarget: 8000, sleepTargetHours: 8, hydrationLiters: 3, mobilityNotes: 'Hip flexor stretch' },
        exercises: [],
      },
      {
        day: 'Thursday',
        isRestDay: false,
        title: 'Upper Hypertrophy',
        focus: 'High Volume Upper Body',
        estimatedDuration: 60,
        exercises: [
          { name: 'Incline Dumbbell Press', sets: 3, reps: '10-12', load: 'Moderate', restSeconds: 60, tempo: '2-0-1', notes: 'Upper chest' },
          { name: 'Lat Pulldown', sets: 3, reps: '10-12', load: 'Moderate', restSeconds: 60, tempo: '2-0-1', notes: 'Controlled squeeze' },
          { name: 'Dumbbell Lateral Raise', sets: 4, reps: '15', load: 'Light', restSeconds: 45, tempo: '2-0-1', notes: 'No swinging' },
          { name: 'Barbell Bicep Curl', sets: 3, reps: '12', load: 'Moderate', restSeconds: 45, tempo: '2-0-1', notes: 'Peak contraction' },
          { name: 'Tricep Rope Pushdown', sets: 3, reps: '12', load: 'Moderate', restSeconds: 45, tempo: '2-0-1', notes: 'Flare out' },
        ],
      },
      {
        day: 'Friday',
        isRestDay: false,
        title: 'Lower Hypertrophy',
        focus: 'Leg Volume & Calves',
        estimatedDuration: 60,
        exercises: [
          { name: 'Leg Press', sets: 4, reps: '12-15', load: 'Moderate', restSeconds: 90, tempo: '2-0-1', notes: 'Full depth' },
          { name: 'Walking Dumbbell Lunges', sets: 3, reps: '12/leg', load: 'Moderate', restSeconds: 60, tempo: '2-0-1', notes: 'Steady pace' },
          { name: 'Standing Calf Raise', sets: 4, reps: '15-20', load: 'Moderate', restSeconds: 45, tempo: '2-1-1', notes: 'Full stretch' },
          { name: 'Hanging Leg Raise', sets: 3, reps: '12-15', load: 'Bodyweight', restSeconds: 45, tempo: '2-0-1', notes: 'No swing' },
        ],
      },
      {
        day: 'Saturday',
        isRestDay: true,
        title: 'Weekend Recovery',
        focus: 'Rest',
        estimatedDuration: 0,
        restDayNotes: { recoveryNotes: 'Rest and recovery.', stepsTarget: 8000, sleepTargetHours: 8, hydrationLiters: 3, mobilityNotes: '' },
        exercises: [],
      },
      {
        day: 'Sunday',
        isRestDay: true,
        title: 'Rest Day',
        focus: 'Rest',
        estimatedDuration: 0,
        restDayNotes: { recoveryNotes: 'Prepare for upcoming training week.', stepsTarget: 7000, sleepTargetHours: 8, hydrationLiters: 3, mobilityNotes: '' },
        exercises: [],
      },
    ],
  },
};

const createBlankDays = () =>
  DAYS_OF_WEEK.map((day) => ({
    day,
    isRestDay: day === 'Sunday' || day === 'Thursday',
    title: day === 'Sunday' || day === 'Thursday' ? 'Rest & Recovery' : `${day} Workout`,
    focus: day === 'Sunday' || day === 'Thursday' ? 'Rest' : 'Full Body',
    estimatedDuration: day === 'Sunday' || day === 'Thursday' ? 0 : 60,
    warmupNotes: '',
    cooldownNotes: '',
    generalInstructions: '',
    restDayNotes: {
      recoveryNotes: '',
      stepsTarget: 8000,
      sleepTargetHours: 8,
      hydrationLiters: 3,
      mobilityNotes: '',
    },
    exercises: [],
  }));

const TrainerWorkoutBuilder = () => {
  const { memberId, planId } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(planId);

  // Core Data
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Active builder tab
  const [activeTab, setActiveTab] = useState('schedule'); // overview | schedule | preview
  const [activeDayIndex, setActiveDayIndex] = useState(0);

  // Plan Details State
  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('Muscle Building');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [splitType, setSplitType] = useState('Custom Split');
  const [duration, setDuration] = useState('12 Weeks');
  const [description, setDescription] = useState('');
  const [coachInstructions, setCoachInstructions] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('draft'); // draft | active | archived

  // Weekly Schedule State
  const [weeklySchedule, setWeeklySchedule] = useState(createBlankDays);

  // Exercise Library Modal State
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [targetDayIndexForAdd, setTargetDayIndexForAdd] = useState(0);
  const [exerciseLibrary, setExerciseLibrary] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [searchExercise, setSearchExercise] = useState('');
  const [filterMuscle, setFilterMuscle] = useState('All');
  const [filterEquipment, setFilterEquipment] = useState('All');
  const [filterDifficulty, setFilterDifficulty] = useState('All');
  const [filterPattern, setFilterPattern] = useState('All');

  // Custom Exercise Creation Modal State
  const [isCustomExerciseOpen, setIsCustomExerciseOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customMuscle, setCustomMuscle] = useState('Chest');
  const [customEquipment, setCustomEquipment] = useState('Barbell');
  const [customPattern, setCustomPattern] = useState('Push');
  const [customDifficulty, setCustomDifficulty] = useState('Intermediate');
  const [customInstructions, setCustomInstructions] = useState('');
  const [customSaving, setCustomSaving] = useState(false);

  // Copy Day Modal State
  const [isCopyDayModalOpen, setIsCopyDayModalOpen] = useState(false);
  const [sourceDayIndex, setSourceDayIndex] = useState(0);
  const [targetDayName, setTargetDayName] = useState('Tuesday');

  // Initial Load
  useEffect(() => {
    const initBuilder = async () => {
      try {
        setLoading(true);
        setError('');

        if (isEditMode) {
          const res = await workoutService.getWorkoutPlanById(planId);
          if (res.success && res.data) {
            const plan = res.data;
            setTitle(plan.title || '');
            setGoal(plan.goal || 'General Fitness');
            setDifficulty(plan.difficulty || 'Intermediate');
            setSplitType(plan.splitType || 'Custom Split');
            setDuration(plan.duration || '12 Weeks');
            setDescription(plan.description || '');
            setCoachInstructions(plan.coachInstructions || '');
            setStatus(plan.status || (plan.isActive ? 'active' : 'draft'));
            if (plan.startDate) {
              setStartDate(new Date(plan.startDate).toISOString().split('T')[0]);
            }
            if (plan.endDate) {
              setEndDate(new Date(plan.endDate).toISOString().split('T')[0]);
            }

            // Sync Weekly Schedule
            if (Array.isArray(plan.weeklySchedule) && plan.weeklySchedule.length > 0) {
              setWeeklySchedule(plan.weeklySchedule);
            }

            if (plan.member) {
              setMember(plan.member);
            }
          }
        } else if (memberId) {
          const memberRes = await trainerService.getAssignedMemberDetails(memberId);
          if (memberRes.success && memberRes.data) {
            setMember(memberRes.data);
            if (memberRes.data.fitnessGoal) {
              setGoal(memberRes.data.fitnessGoal);
            }
            setTitle(`${memberRes.data.user?.name || 'Athlete'}'s Customized Protocol`);
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

    initBuilder();
  }, [memberId, planId, isEditMode]);

  // Load Exercise Library
  const fetchExercises = async () => {
    try {
      setLibraryLoading(true);
      const params = {};
      if (searchExercise) params.search = searchExercise;
      if (filterMuscle !== 'All') params.muscleGroup = filterMuscle;
      if (filterEquipment !== 'All') params.equipment = filterEquipment;
      if (filterDifficulty !== 'All') params.difficulty = filterDifficulty;
      if (filterPattern !== 'All') params.movementPattern = filterPattern;

      const res = await exerciseService.getExercises(params);
      if (res.success) {
        setExerciseLibrary(res.data || []);
      }
    } catch {
      // Non-critical background fetch
    } finally {
      setLibraryLoading(false);
    }
  };

  useEffect(() => {
    if (isExerciseModalOpen) {
      fetchExercises();
    }
  }, [isExerciseModalOpen, searchExercise, filterMuscle, filterEquipment, filterDifficulty, filterPattern]);

  // Real-Time Calculated Summary
  const calculatedSummary = useMemo(() => {
    let trainingDays = 0;
    let restDays = 0;
    let totalExercises = 0;
    let approxWeeklySets = 0;
    let estimatedWeeklyMinutes = 0;
    const muscleDistribution = {};

    weeklySchedule.forEach((d) => {
      if (d.isRestDay) {
        restDays += 1;
      } else {
        trainingDays += 1;
        estimatedWeeklyMinutes += Number(d.estimatedDuration) || 0;
        (d.exercises || []).forEach((ex) => {
          totalExercises += 1;
          const setsCount = Number(ex.sets) || 0;
          approxWeeklySets += setsCount;

          const muscle = ex.primaryMuscleGroup || ex.focus || d.focus || 'Other';
          muscleDistribution[muscle] = (muscleDistribution[muscle] || 0) + setsCount;
        });
      }
    });

    return {
      trainingDays,
      restDays,
      totalExercises,
      approxWeeklySets,
      estimatedWeeklyMinutes,
      muscleDistribution,
    };
  }, [weeklySchedule]);

  // Mark form as touched
  const markDirty = () => setHasUnsavedChanges(true);

  // Day mutation helpers
  const updateDayField = (dayIndex, field, value) => {
    markDirty();
    setWeeklySchedule((prev) => {
      const copy = [...prev];
      copy[dayIndex] = { ...copy[dayIndex], [field]: value };
      return copy;
    });
  };

  const updateRestNotes = (dayIndex, field, value) => {
    markDirty();
    setWeeklySchedule((prev) => {
      const copy = [...prev];
      const existing = copy[dayIndex].restDayNotes || {};
      copy[dayIndex] = {
        ...copy[dayIndex],
        restDayNotes: { ...existing, [field]: value },
      };
      return copy;
    });
  };

  const toggleRestDay = (dayIndex) => {
    markDirty();
    setWeeklySchedule((prev) => {
      const copy = [...prev];
      const isRest = !copy[dayIndex].isRestDay;
      copy[dayIndex] = {
        ...copy[dayIndex],
        isRestDay: isRest,
        focus: isRest ? 'Rest & Recovery' : 'Full Body',
      };
      return copy;
    });
  };

  // Exercise mutation helpers
  const addExerciseToDay = (dayIndex, exerciseObj) => {
    markDirty();
    setWeeklySchedule((prev) => {
      const copy = [...prev];
      const currentList = copy[dayIndex].exercises || [];
      const newEx = {
        exercise: exerciseObj._id || null,
        name: exerciseObj.name,
        sets: 3,
        reps: '10-12',
        restSeconds: 60,
        load: '',
        tempo: '',
        rpe: null,
        rir: null,
        notes: exerciseObj.instructions || '',
        weightGuidance: '',
        primaryMuscleGroup: exerciseObj.primaryMuscleGroup || '',
      };
      copy[dayIndex] = {
        ...copy[dayIndex],
        exercises: [...currentList, newEx],
      };
      return copy;
    });
  };

  const updateExercise = (dayIndex, exIndex, field, value) => {
    markDirty();
    setWeeklySchedule((prev) => {
      const copy = [...prev];
      const day = { ...copy[dayIndex] };
      const exList = [...(day.exercises || [])];
      exList[exIndex] = { ...exList[exIndex], [field]: value };
      day.exercises = exList;
      copy[dayIndex] = day;
      return copy;
    });
  };

  const removeExercise = (dayIndex, exIndex) => {
    markDirty();
    setWeeklySchedule((prev) => {
      const copy = [...prev];
      const day = { ...copy[dayIndex] };
      day.exercises = day.exercises.filter((_, idx) => idx !== exIndex);
      copy[dayIndex] = day;
      return copy;
    });
  };

  const moveExercise = (dayIndex, exIndex, direction) => {
    markDirty();
    setWeeklySchedule((prev) => {
      const copy = [...prev];
      const day = { ...copy[dayIndex] };
      const exList = [...(day.exercises || [])];
      const targetIndex = exIndex + direction;
      if (targetIndex < 0 || targetIndex >= exList.length) return prev;
      const temp = exList[exIndex];
      exList[exIndex] = exList[targetIndex];
      exList[targetIndex] = temp;
      day.exercises = exList;
      copy[dayIndex] = day;
      return copy;
    });
  };

  const duplicateExercise = (dayIndex, exIndex, targetDayIndex = dayIndex) => {
    markDirty();
    setWeeklySchedule((prev) => {
      const copy = [...prev];
      const sourceDay = copy[dayIndex];
      const exToCopy = sourceDay.exercises[exIndex];
      const targetDay = { ...copy[targetDayIndex] };
      targetDay.exercises = [...(targetDay.exercises || []), { ...exToCopy, _id: undefined }];
      copy[targetDayIndex] = targetDay;
      return copy;
    });
  };

  // Copy entire day
  const handleCopyDay = () => {
    const targetIdx = weeklySchedule.findIndex((d) => d.day === targetDayName);
    if (targetIdx === -1 || targetIdx === sourceDayIndex) return;
    markDirty();
    setWeeklySchedule((prev) => {
      const copy = [...prev];
      const src = copy[sourceDayIndex];
      copy[targetIdx] = {
        ...copy[targetIdx],
        isRestDay: src.isRestDay,
        focus: src.focus,
        estimatedDuration: src.estimatedDuration,
        warmupNotes: src.warmupNotes,
        cooldownNotes: src.cooldownNotes,
        generalInstructions: src.generalInstructions,
        restDayNotes: src.restDayNotes ? { ...src.restDayNotes } : undefined,
        exercises: (src.exercises || []).map((e) => ({ ...e, _id: undefined })),
      };
      return copy;
    });
    setIsCopyDayModalOpen(false);
    setSuccessMsg(`Copied ${weeklySchedule[sourceDayIndex].day} to ${targetDayName}!`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Apply Starter Template
  const applyTemplate = (templateKey) => {
    const tpl = OPTIONAL_TEMPLATES[templateKey];
    if (!tpl) return;
    if (weeklySchedule.some((d) => d.exercises?.length > 0)) {
      if (!window.confirm('Applying this template will overwrite current schedule entries. Continue?')) {
        return;
      }
    }
    markDirty();
    setTitle(tpl.title);
    setGoal(tpl.goal);
    setSplitType(tpl.splitType);
    setDifficulty(tpl.difficulty);
    setDuration(tpl.duration);
    setDescription(tpl.description);
    setWeeklySchedule(tpl.schedule);
    setSuccessMsg(`Applied template: ${templateKey}`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Create Custom Exercise & Add to plan
  const handleCreateCustomExercise = async (e) => {
    e.preventDefault();
    if (!customName.trim()) return;
    try {
      setCustomSaving(true);
      const res = await exerciseService.createExercise({
        name: customName.trim(),
        primaryMuscleGroup: customMuscle,
        equipment: customEquipment,
        movementPattern: customPattern,
        difficulty: customDifficulty,
        instructions: customInstructions,
      });

      if (res.success && res.data) {
        addExerciseToDay(targetDayIndexForAdd, res.data);
        setIsCustomExerciseOpen(false);
        setCustomName('');
        setCustomInstructions('');
        setSuccessMsg(`Created and added custom exercise: ${res.data.name}`);
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create custom exercise.');
    } finally {
      setCustomSaving(false);
    }
  };

  // Validation
  const validatePlan = (isPublishingMode = false) => {
    if (!title.trim()) {
      setError('Workout plan title is required.');
      return false;
    }

    if (isPublishingMode) {
      const activeDays = weeklySchedule.filter((d) => !d.isRestDay);
      if (activeDays.length === 0) {
        setError('At least one workout day is required to publish.');
        return false;
      }
      const totalEx = weeklySchedule.reduce((sum, d) => sum + (d.exercises?.length || 0), 0);
      if (totalEx === 0) {
        setError('Add at least one exercise to the plan before publishing.');
        return false;
      }
    }

    setError('');
    return true;
  };

  // Save / Publish
  const handleSave = async (publishNow = false) => {
    if (!validatePlan(publishNow)) return;

    try {
      if (publishNow) {
        setPublishing(true);
      } else {
        setSaving(true);
      }
      setError('');

      const targetMemberId = memberId || (member?._id || member?.user?._id);
      const payload = {
        title: title.trim(),
        goal,
        difficulty,
        splitType,
        duration,
        description: description.trim(),
        coachInstructions: coachInstructions.trim(),
        startDate,
        endDate: endDate || null,
        weeklySchedule,
        status: publishNow ? 'active' : 'draft',
        isActive: publishNow,
      };

      let res;
      if (isEditMode) {
        res = await workoutService.updateWorkoutPlan(planId, payload);
        if (publishNow && res.success) {
          res = await workoutService.publishWorkoutPlan(planId);
        }
      } else {
        res = await workoutService.createTrainerWorkout(targetMemberId, payload);
      }

      if (res.success) {
        setHasUnsavedChanges(false);
        setSuccessMsg(
          publishNow
            ? 'Workout plan published successfully! Visible to athlete.'
            : 'Workout plan draft saved.'
        );
        setTimeout(() => {
          navigate('/trainer/workouts');
        }, 1200);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Unable to save workout plan. Please try again.'
      );
    } finally {
      setSaving(false);
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="h-44 rounded-3xl bg-slate-100 dark:bg-slate-800/60 animate-pulse border border-slate-200 dark:border-slate-800" />
        <div className="h-96 rounded-3xl bg-slate-100 dark:bg-slate-800/40 animate-pulse" />
      </div>
    );
  }

  const currentDay = weeklySchedule[activeDayIndex] || weeklySchedule[0];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Top Header / Member Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/trainer/workouts"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-amber-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
                {isEditMode ? 'Edit Workout Protocol' : 'Manual Workout Plan Builder'}
              </h1>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  status === 'active'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                }`}
              >
                {status}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Athlete:{' '}
              <strong className="text-slate-800 dark:text-slate-200">
                {member?.user?.name || member?.name || 'Selected Athlete'}
              </strong>{' '}
              {member?.fitnessGoal ? `· Goal: ${member.fitnessGoal}` : ''}
              {member?.weight ? ` · Current Weight: ${member.weight} kg` : ''}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
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

      {/* Notifications */}
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
        </div>
      )}

      {/* Real-time Summary Card */}
      <div className="p-4 md:p-5 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider text-[11px]">
            <Flame className="w-4 h-4" />
            Live Protocol Statistics (Calculated from inputs)
          </div>
          <div className="text-slate-400">
            {hasUnsavedChanges && (
              <span className="text-amber-400 font-semibold animate-pulse">
                ● Unsaved modifications
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 text-center">
          <div className="p-2.5 rounded-2xl bg-slate-800/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Training Days</span>
            <span className="text-lg font-black text-amber-400">{calculatedSummary.trainingDays} Days</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-800/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Rest Days</span>
            <span className="text-lg font-black text-slate-200">{calculatedSummary.restDays} Days</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-800/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Exercises</span>
            <span className="text-lg font-black text-emerald-400">{calculatedSummary.totalExercises}</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-800/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Weekly Sets</span>
            <span className="text-lg font-black text-cyan-400">~{calculatedSummary.approxWeeklySets} Sets</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-800/60 border border-slate-800 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Est. Training Time</span>
            <span className="text-lg font-black text-indigo-400">
              {Math.floor(calculatedSummary.estimatedWeeklyMinutes / 60)}h{' '}
              {calculatedSummary.estimatedWeeklyMinutes % 60}m
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-6 text-sm font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'border-b-2 border-amber-500 text-amber-600 dark:text-amber-400'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Info className="w-4 h-4" />
          <span>1. Plan Overview</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('schedule')}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === 'schedule'
              ? 'border-b-2 border-amber-500 text-amber-600 dark:text-amber-400'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>2. Weekly Schedule & Exercises</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === 'preview'
              ? 'border-b-2 border-amber-500 text-amber-600 dark:text-amber-400'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>3. Member View Preview</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Optional Starter Templates Bar */}
          {!isEditMode && (
            <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Optional Starting Point: Start blank or load a structured template.</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setWeeklySchedule(createBlankDays())}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Start Blank (Default)
                </button>
                {Object.keys(OPTIONAL_TEMPLATES).map((tplKey) => (
                  <button
                    key={tplKey}
                    type="button"
                    onClick={() => applyTemplate(tplKey)}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold transition-colors"
                  >
                    Template: {tplKey}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="text-base font-black text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-500" />
              General Plan Specifications
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Plan Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    markDirty();
                  }}
                  placeholder="e.g. Elite Power & Hypertrophy Split"
                  className="w-full px-4 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Primary Fitness Goal
                </label>
                <select
                  value={goal}
                  onChange={(e) => {
                    setGoal(e.target.value);
                    markDirty();
                  }}
                  className="w-full px-3 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                >
                  {GOAL_OPTIONS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Workout Split Type
                </label>
                <select
                  value={splitType}
                  onChange={(e) => {
                    setSplitType(e.target.value);
                    markDirty();
                  }}
                  className="w-full px-3 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                >
                  {SPLIT_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Target Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => {
                    setDifficulty(e.target.value);
                    markDirty();
                  }}
                  className="w-full px-3 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                >
                  {DIFFICULTY_OPTIONS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Program Duration
                </label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => {
                    setDuration(e.target.value);
                    markDirty();
                  }}
                  placeholder="e.g. 12 Weeks"
                  className="w-full px-3 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    markDirty();
                  }}
                  className="w-full px-3 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Optional End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    markDirty();
                  }}
                  className="w-full px-3 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Protocol Description / Focus
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    markDirty();
                  }}
                  placeholder="Summarize the core strategy (e.g. Progressive overload on compound movements with accessory hypertrophy work)."
                  className="w-full px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Coach Special Instructions
                </label>
                <textarea
                  rows={2}
                  value={coachInstructions}
                  onChange={(e) => {
                    setCoachInstructions(e.target.value);
                    markDirty();
                  }}
                  placeholder="Special guidelines on warm-up, deload weeks, recovery, or hydration."
                  className="w-full px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button
                variant="primary"
                size="md"
                onClick={() => setActiveTab('schedule')}
                className="bg-amber-600 hover:bg-amber-700"
              >
                Continue to Weekly Schedule →
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WEEKLY SCHEDULE & EXERCISES */}
      {activeTab === 'schedule' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Days Navigation Sidebar */}
          <div className="space-y-2">
            <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 px-1">
                Days of the Week
              </span>
              <div className="space-y-1">
                {weeklySchedule.map((d, idx) => {
                  const isSelected = idx === activeDayIndex;
                  return (
                    <button
                      key={d.day}
                      type="button"
                      onClick={() => setActiveDayIndex(idx)}
                      className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between text-xs font-bold ${
                        isSelected
                          ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {d.isRestDay ? (
                          <Bed className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                        ) : (
                          <Dumbbell className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-amber-500'}`} />
                        )}
                        <span>{d.day}</span>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : d.isRestDay
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        {d.isRestDay ? 'Rest' : `${d.exercises?.length || 0} ex`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setSourceDayIndex(activeDayIndex);
                  setIsCopyDayModalOpen(true);
                }}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Copy className="w-3.5 h-3.5 text-amber-500" />
                <span>Duplicate {currentDay.day} →</span>
              </button>
            </div>
          </div>

          {/* Active Day Editor */}
          <div className="lg:col-span-3 space-y-4">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
              {/* Day Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-slate-900 dark:text-white">
                      {currentDay.day}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        currentDay.isRestDay
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {currentDay.isRestDay ? 'Rest Day' : 'Training Day'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {currentDay.isRestDay
                      ? 'Recovery, hydration, sleep, and mobility protocols.'
                      : 'Structured exercises, sets, reps, load, and rest periods.'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleRestDay(activeDayIndex)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                      currentDay.isRestDay
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {currentDay.isRestDay ? (
                      <>
                        <Dumbbell className="w-3.5 h-3.5" />
                        <span>Convert to Workout Day</span>
                      </>
                    ) : (
                      <>
                        <Bed className="w-3.5 h-3.5" />
                        <span>Mark as Rest Day</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Day Details Configuration */}
              {!currentDay.isRestDay ? (
                /* Workout Day Details */
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Day Routine Title
                      </label>
                      <input
                        type="text"
                        value={currentDay.title || ''}
                        onChange={(e) => updateDayField(activeDayIndex, 'title', e.target.value)}
                        placeholder="e.g. Push Hypertrophy"
                        className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Primary Muscle Focus
                      </label>
                      <input
                        type="text"
                        value={currentDay.focus || ''}
                        onChange={(e) => updateDayField(activeDayIndex, 'focus', e.target.value)}
                        placeholder="e.g. Chest & Triceps"
                        className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Estimated Duration (mins)
                      </label>
                      <input
                        type="number"
                        value={currentDay.estimatedDuration || 60}
                        onChange={(e) =>
                          updateDayField(activeDayIndex, 'estimatedDuration', Number(e.target.value))
                        }
                        className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-600 dark:text-slate-400">
                        Warm-up Instructions
                      </label>
                      <input
                        type="text"
                        value={currentDay.warmupNotes || ''}
                        onChange={(e) => updateDayField(activeDayIndex, 'warmupNotes', e.target.value)}
                        placeholder="e.g. 5 min treadmill incline walk + band dislocates"
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-600 dark:text-slate-400">
                        Cool-down Instructions
                      </label>
                      <input
                        type="text"
                        value={currentDay.cooldownNotes || ''}
                        onChange={(e) => updateDayField(activeDayIndex, 'cooldownNotes', e.target.value)}
                        placeholder="e.g. Pec stretch and thoracic extensions"
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Exercises List */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                        <Dumbbell className="w-4 h-4 text-amber-500" />
                        Prescribed Exercises ({currentDay.exercises?.length || 0})
                      </h4>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setTargetDayIndexForAdd(activeDayIndex);
                            setIsCustomExerciseOpen(true);
                          }}
                          icon={Plus}
                        >
                          + Custom Exercise
                        </Button>

                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setTargetDayIndexForAdd(activeDayIndex);
                            setIsExerciseModalOpen(true);
                          }}
                          className="bg-amber-600 hover:bg-amber-700 text-white"
                          icon={Search}
                        >
                          Select from Library
                        </Button>
                      </div>
                    </div>

                    {/* Exercise Cards */}
                    {(!currentDay.exercises || currentDay.exercises.length === 0) ? (
                      <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-2">
                        <Dumbbell className="w-8 h-8 text-slate-400 mx-auto" />
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                          No exercises added for {currentDay.day} yet.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setTargetDayIndexForAdd(activeDayIndex);
                            setIsExerciseModalOpen(true);
                          }}
                          className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
                        >
                          Browse Exercise Library →
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {currentDay.exercises.map((ex, exIdx) => (
                          <div
                            key={ex._id || exIdx}
                            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3"
                          >
                            {/* Exercise Card Header */}
                            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
                              <div className="flex items-center gap-2.5">
                                <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-black text-xs flex items-center justify-center shrink-0">
                                  {exIdx + 1}
                                </span>
                                <div>
                                  <input
                                    type="text"
                                    value={ex.name}
                                    onChange={(e) =>
                                      updateExercise(activeDayIndex, exIdx, 'name', e.target.value)
                                    }
                                    className="font-bold text-sm bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-amber-500 focus:outline-none text-slate-900 dark:text-white"
                                  />
                                </div>
                              </div>

                              {/* Action controls */}
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  disabled={exIdx === 0}
                                  onClick={() => moveExercise(activeDayIndex, exIdx, -1)}
                                  className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 disabled:opacity-30"
                                  title="Move Up"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={exIdx === currentDay.exercises.length - 1}
                                  onClick={() => moveExercise(activeDayIndex, exIdx, 1)}
                                  className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 disabled:opacity-30"
                                  title="Move Down"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => duplicateExercise(activeDayIndex, exIdx)}
                                  className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
                                  title="Duplicate Exercise"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeExercise(activeDayIndex, exIdx)}
                                  className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/50 text-red-500"
                                  title="Delete Exercise"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Detailed Inputs */}
                            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
                              <div>
                                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                                  Sets
                                </label>
                                <input
                                  type="number"
                                  min={1}
                                  value={ex.sets || 3}
                                  onChange={(e) =>
                                    updateExercise(activeDayIndex, exIdx, 'sets', Number(e.target.value))
                                  }
                                  className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                                  Reps / Target
                                </label>
                                <input
                                  type="text"
                                  value={ex.reps || '10-12'}
                                  onChange={(e) =>
                                    updateExercise(activeDayIndex, exIdx, 'reps', e.target.value)
                                  }
                                  placeholder="e.g. 8-10, AMRAP"
                                  className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                                  Load / Weight
                                </label>
                                <input
                                  type="text"
                                  value={ex.load || ''}
                                  onChange={(e) =>
                                    updateExercise(activeDayIndex, exIdx, 'load', e.target.value)
                                  }
                                  placeholder="e.g. 60 kg, 75%"
                                  className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                                  Rest (sec)
                                </label>
                                <input
                                  type="number"
                                  step={15}
                                  value={ex.restSeconds || 60}
                                  onChange={(e) =>
                                    updateExercise(activeDayIndex, exIdx, 'restSeconds', Number(e.target.value))
                                  }
                                  className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                                  Tempo
                                </label>
                                <input
                                  type="text"
                                  value={ex.tempo || ''}
                                  onChange={(e) =>
                                    updateExercise(activeDayIndex, exIdx, 'tempo', e.target.value)
                                  }
                                  placeholder="e.g. 3-0-1"
                                  className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                                  RPE / RIR
                                </label>
                                <input
                                  type="number"
                                  min={1}
                                  max={10}
                                  value={ex.rpe || ''}
                                  onChange={(e) =>
                                    updateExercise(activeDayIndex, exIdx, 'rpe', Number(e.target.value))
                                  }
                                  placeholder="RPE 8"
                                  className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                                />
                              </div>
                            </div>

                            {/* Coach Notes */}
                            <div>
                              <input
                                type="text"
                                value={ex.notes || ''}
                                onChange={(e) =>
                                  updateExercise(activeDayIndex, exIdx, 'notes', e.target.value)
                                }
                                placeholder="Form cues, safety reminders, or alternative cues..."
                                className="w-full px-2.5 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Rest Day Details */
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
                      <Bed className="w-4 h-4 text-amber-500" />
                      Rest & Recovery Prescription
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mb-1">
                          <Footprints className="w-3.5 h-3.5 text-cyan-500" />
                          Steps Target
                        </label>
                        <input
                          type="number"
                          step={500}
                          value={currentDay.restDayNotes?.stepsTarget || 8000}
                          onChange={(e) =>
                            updateRestNotes(activeDayIndex, 'stepsTarget', Number(e.target.value))
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mb-1">
                          <Moon className="w-3.5 h-3.5 text-indigo-500" />
                          Sleep Goal (Hours)
                        </label>
                        <input
                          type="number"
                          step={0.5}
                          value={currentDay.restDayNotes?.sleepTargetHours || 8}
                          onChange={(e) =>
                            updateRestNotes(activeDayIndex, 'sleepTargetHours', Number(e.target.value))
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mb-1">
                          <Droplets className="w-3.5 h-3.5 text-blue-500" />
                          Hydration (Liters)
                        </label>
                        <input
                          type="number"
                          step={0.5}
                          value={currentDay.restDayNotes?.hydrationLiters || 3}
                          onChange={(e) =>
                            updateRestNotes(activeDayIndex, 'hydrationLiters', Number(e.target.value))
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      <label className="font-semibold text-slate-600 dark:text-slate-400">
                        Mobility & Stretching Notes
                      </label>
                      <input
                        type="text"
                        value={currentDay.restDayNotes?.mobilityNotes || ''}
                        onChange={(e) => updateRestNotes(activeDayIndex, 'mobilityNotes', e.target.value)}
                        placeholder="e.g. Foam roll quads, hip flexor couch stretch 2 mins per side."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                      />
                    </div>

                    <div className="space-y-1 text-xs">
                      <label className="font-semibold text-slate-600 dark:text-slate-400">
                        General Recovery Instructions
                      </label>
                      <textarea
                        rows={2}
                        value={currentDay.restDayNotes?.recoveryNotes || ''}
                        onChange={(e) => updateRestNotes(activeDayIndex, 'recoveryNotes', e.target.value)}
                        placeholder="Nutritional emphasis, relaxation, sauna, or active walk guidelines."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MEMBER VIEW PREVIEW */}
      {activeTab === 'preview' && (
        <div className="space-y-6">
          {/* Member view banner preview */}
          <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-primary-600 via-primary-700 to-indigo-800 text-white shadow-lg space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary-200">
              <Eye className="w-4 h-4" />
              <span>Simulated Member Portal Display</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black">{title || 'Untitled Workout Plan'}</h2>
            <p className="text-sm text-primary-100 max-w-2xl">{description || 'No description provided.'}</p>
            <div className="flex flex-wrap items-center gap-4 text-xs pt-2">
              <span className="px-3 py-1 rounded-xl bg-white/10 backdrop-blur-md">
                Goal: <strong>{goal}</strong>
              </span>
              <span className="px-3 py-1 rounded-xl bg-white/10 backdrop-blur-md">
                Split: <strong>{splitType}</strong>
              </span>
              <span className="px-3 py-1 rounded-xl bg-white/10 backdrop-blur-md">
                Difficulty: <strong>{difficulty}</strong>
              </span>
              <span className="px-3 py-1 rounded-xl bg-white/10 backdrop-blur-md">
                Duration: <strong>{duration}</strong>
              </span>
            </div>
          </div>

          {/* Schedule view */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {weeklySchedule.map((d) => (
              <div
                key={d.day}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {d.isRestDay ? <Bed className="w-4 h-4 text-slate-400" /> : <Dumbbell className="w-4 h-4 text-amber-500" />}
                    <span>{d.day}</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      d.isRestDay
                        ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    }`}
                  >
                    {d.isRestDay ? 'Rest' : d.focus || 'Training'}
                  </span>
                </div>

                {!d.isRestDay ? (
                  <div className="space-y-2">
                    {(d.exercises || []).map((ex, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60"
                      >
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {idx + 1}. {ex.name}
                        </div>
                        <div className="text-slate-500 font-mono text-[11px]">
                          {ex.sets} × {ex.reps} {ex.load ? `· ${ex.load}` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    {d.restDayNotes?.recoveryNotes || 'Active rest and recovery.'}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EXERCISE SELECTOR MODAL */}
      {isExerciseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[85vh] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-amber-500" />
                  Select Exercise from Library
                </h3>
                <p className="text-xs text-slate-400">
                  Adding to {weeklySchedule[targetDayIndexForAdd]?.day}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsExerciseModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filters */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search exercises by name or instructions..."
                  value={searchExercise}
                  onChange={(e) => setSearchExercise(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Muscle</label>
                  <select
                    value={filterMuscle}
                    onChange={(e) => setFilterMuscle(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    {MUSCLE_GROUPS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Equipment</label>
                  <select
                    value={filterEquipment}
                    onChange={(e) => setFilterEquipment(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    {EQUIPMENT_OPTIONS.map((eq) => (
                      <option key={eq} value={eq}>
                        {eq}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Pattern</label>
                  <select
                    value={filterPattern}
                    onChange={(e) => setFilterPattern(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    {MOVEMENT_PATTERNS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Difficulty</label>
                  <select
                    value={filterDifficulty}
                    onChange={(e) => setFilterDifficulty(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    {['All', ...DIFFICULTY_OPTIONS].map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Exercises List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {libraryLoading ? (
                <div className="p-8 text-center text-slate-400 text-xs">Loading library...</div>
              ) : exerciseLibrary.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                  <p>No matching exercises found.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsExerciseModalOpen(false);
                      setIsCustomExerciseOpen(true);
                    }}
                    className="text-amber-500 font-bold hover:underline"
                  >
                    + Create this as a custom exercise
                  </button>
                </div>
              ) : (
                exerciseLibrary.map((ex) => (
                  <div
                    key={ex._id}
                    className="p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500/50 transition-colors flex items-center justify-between gap-3 bg-white dark:bg-slate-900"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {ex.name}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span className="text-amber-500 font-semibold">{ex.primaryMuscleGroup}</span>
                        <span>·</span>
                        <span>{ex.equipment}</span>
                        <span>·</span>
                        <span>{ex.movementPattern}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        addExerciseToDay(targetDayIndexForAdd, ex);
                        setIsExerciseModalOpen(false);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shrink-0 transition-colors"
                    >
                      + Add
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE CUSTOM EXERCISE MODAL */}
      {isCustomExerciseOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-slate-900 dark:text-white text-base">
                Create Custom Exercise
              </h3>
              <button
                type="button"
                onClick={() => setIsCustomExerciseOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomExercise} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Exercise Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Bulgarian Split Squat (Deficit)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Primary Muscle Group
                  </label>
                  <select
                    value={customMuscle}
                    onChange={(e) => setCustomMuscle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    {MUSCLE_GROUPS.filter((m) => m !== 'All').map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Equipment
                  </label>
                  <select
                    value={customEquipment}
                    onChange={(e) => setCustomEquipment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    {EQUIPMENT_OPTIONS.filter((e) => e !== 'All').map((eq) => (
                      <option key={eq} value={eq}>
                        {eq}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Movement Pattern
                  </label>
                  <select
                    value={customPattern}
                    onChange={(e) => setCustomPattern(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    {MOVEMENT_PATTERNS.filter((p) => p !== 'All').map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Difficulty
                  </label>
                  <select
                    value={customDifficulty}
                    onChange={(e) => setCustomDifficulty(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    {DIFFICULTY_OPTIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Instructions / Cues
                </label>
                <textarea
                  rows={2}
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="Key form cues and setup instructions..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setIsCustomExerciseOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  loading={customSaving}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  Save & Add to Day
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COPY DAY MODAL */}
      {isCopyDayModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-slate-900 dark:text-white text-base">
                Duplicate Workout Day
              </h3>
              <button
                type="button"
                onClick={() => setIsCopyDayModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Copy all exercises, sets, reps, and notes from{' '}
              <strong className="text-amber-500">{weeklySchedule[sourceDayIndex]?.day}</strong> to:
            </p>

            <select
              value={targetDayName}
              onChange={(e) => setTargetDayName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
            >
              {DAYS_OF_WEEK.filter((d) => d !== weeklySchedule[sourceDayIndex]?.day).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <div className="pt-3 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCopyDayModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCopyDay}
                className="bg-amber-600 hover:bg-amber-700"
              >
                Duplicate Day
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainerWorkoutBuilder;
