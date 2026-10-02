import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Dumbbell,
  Search,
  Filter,
  Plus,
  Calendar,
  User,
  Target,
  Edit3,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Copy,
  Archive,
  Trash2,
  Send,
} from 'lucide-react';
import trainerService from '../../services/trainerService';
import workoutService from '../../services/workoutService';
import Button from '../../components/common/Button';

const TrainerWorkouts = () => {
  const [searchParams] = useSearchParams();
  const paramMemberId = searchParams.get('memberId');

  const [assignedMembers, setAssignedMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [memberWorkouts, setMemberWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workoutsLoading, setWorkoutsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | active | draft | archived
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // 1. Fetch assigned members first
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await trainerService.getAssignedMembers();
        if (res.success && res.data) {
          setAssignedMembers(res.data);
          if (paramMemberId && res.data.some((m) => m._id === paramMemberId)) {
            setSelectedMemberId(paramMemberId);
          } else if (res.data.length > 0) {
            setSelectedMemberId(res.data[0]._id);
          }
        }
      } catch (err) {
        setError(
          err.response?.data?.message || err.message || 'Failed to load assigned athletes.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [paramMemberId]);

  // 2. Fetch workouts for the selected member
  const loadWorkouts = async (memberId) => {
    if (!memberId) return;
    try {
      setWorkoutsLoading(true);
      setError('');
      const res = await workoutService.getTrainerMemberWorkouts(memberId);
      if (res.success) {
        setMemberWorkouts(res.data || []);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Failed to load athlete workouts.'
      );
    } finally {
      setWorkoutsLoading(false);
    }
  };

  useEffect(() => {
    loadWorkouts(selectedMemberId);
  }, [selectedMemberId]);

  // Action handlers
  const handlePublish = async (planId) => {
    try {
      setActionLoading(true);
      const res = await workoutService.publishWorkoutPlan(planId);
      if (res.success) {
        setSuccessMsg('Workout plan published and made active for member!');
        await loadWorkouts(selectedMemberId);
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to publish plan.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDuplicate = async (planId) => {
    try {
      setActionLoading(true);
      const res = await workoutService.duplicateWorkoutPlan(planId);
      if (res.success) {
        setSuccessMsg('Plan duplicated into a draft copy!');
        await loadWorkouts(selectedMemberId);
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to duplicate plan.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchive = async (planId) => {
    try {
      setActionLoading(true);
      const res = await workoutService.archiveWorkoutPlan(planId);
      if (res.success) {
        setSuccessMsg('Workout plan archived.');
        await loadWorkouts(selectedMemberId);
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to archive plan.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (planId) => {
    if (!window.confirm('Are you sure you want to permanently delete this draft workout plan?')) {
      return;
    }
    try {
      setActionLoading(true);
      const res = await workoutService.deleteWorkoutPlan(planId);
      if (res.success) {
        setSuccessMsg('Draft plan deleted successfully.');
        await loadWorkouts(selectedMemberId);
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to delete plan.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredMembers = assignedMembers.filter((m) => {
    const name = m.user?.name || '';
    const email = m.user?.email || '';
    return (
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const displayedWorkouts = memberWorkouts.filter((plan) => {
    if (statusFilter === 'active') return plan.status === 'active' || (plan.isActive && !plan.status);
    if (statusFilter === 'draft') return plan.status === 'draft';
    if (statusFilter === 'archived') return plan.status === 'archived' || (!plan.isActive && plan.status !== 'draft');
    return true;
  });

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="h-44 rounded-3xl bg-slate-100 dark:bg-slate-800/60 animate-pulse border border-slate-200 dark:border-slate-800" />
        <div className="h-64 rounded-3xl bg-slate-100 dark:bg-slate-800/40 animate-pulse" />
      </div>
    );
  }

  const currentMember = assignedMembers.find((m) => m._id === selectedMemberId);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider text-amber-100">
            <Dumbbell className="w-3.5 h-3.5 text-amber-300" />
            Athlete Workout Management
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            Workout Protocols
          </h1>
          <p className="text-sm text-amber-100 max-w-xl">
            Design tailored athletic splits, assign sets & reps, configure rest intervals, and track prescribed regimens.
          </p>
        </div>

        {selectedMemberId && (
          <Link to={`/trainer/members/${selectedMemberId}/workout/new`}>
            <Button
              variant="outline"
              size="md"
              className="bg-white text-amber-700 hover:bg-amber-50 border-white font-bold shadow-md shrink-0"
              icon={Plus}
            >
              Build New Workout
            </Button>
          </Link>
        )}
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {assignedMembers.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <User className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
            No Athletes Assigned
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            You do not currently have assigned athletes to create workout protocols for.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Athlete Selector Column */}
          <div className="space-y-4">
            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <User className="w-4 h-4 text-amber-500" />
                Select Assigned Athlete
              </h3>

              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter athletes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Members List */}
              <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
                {filteredMembers.map((m) => {
                  const isSelected = m._id === selectedMemberId;
                  return (
                    <button
                      key={m._id}
                      type="button"
                      onClick={() => setSelectedMemberId(m._id)}
                      className={`w-full p-3 rounded-2xl text-left transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-bold text-sm truncate">{m.user?.name}</div>
                        <div
                          className={`text-[11px] truncate ${
                            isSelected ? 'text-amber-100' : 'text-slate-400'
                          }`}
                        >
                          Goal: {m.fitnessGoal || 'Fitness'}
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 uppercase tracking-wider ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {m.membershipStatus || 'active'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Workouts Content Column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filter and stats */}
            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {currentMember?.user?.name}'s Workouts
                </h3>
                <span className="text-xs text-slate-400">
                  {memberWorkouts.length} total protocols on file
                </span>
              </div>

              {/* Status Filters */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
                {['all', 'active', 'draft', 'archived'].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setStatusFilter(f)}
                    className={`px-3 py-1 rounded-lg capitalize transition-colors ${
                      statusFilter === f
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Workouts List */}
            {workoutsLoading ? (
              <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800">
                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm font-medium">Fetching workout protocols...</p>
              </div>
            ) : displayedWorkouts.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                <Dumbbell className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-base">
                  No Workout Plans Found
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {statusFilter !== 'all'
                    ? `No ${statusFilter} workout plans found for this athlete.`
                    : 'This athlete does not have any workout programs created yet.'}
                </p>
                <Link to={`/trainer/members/${selectedMemberId}/workout/new`}>
                  <Button variant="primary" size="sm" icon={Plus} className="bg-amber-600 hover:bg-amber-700">
                    Build Workout Plan
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {displayedWorkouts.map((plan) => {
                  const isPlanActive = plan.status === 'active' || (plan.isActive && !plan.status);
                  const isDraft = plan.status === 'draft';
                  const isArchived = plan.status === 'archived' || (!plan.isActive && !isDraft);

                  return (
                    <div
                      key={plan._id}
                      className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 hover:border-amber-400/50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-slate-900 dark:text-white text-base">
                              {plan.title}
                            </h4>
                            {isPlanActive && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                Active Plan
                              </span>
                            )}
                            {isDraft && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                Draft
                              </span>
                            )}
                            {isArchived && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                Archived
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                            <span>Goal: <strong className="text-slate-700 dark:text-slate-300 capitalize">{plan.goal}</strong></span>
                            <span>Split: <strong>{plan.splitType || 'Custom'}</strong></span>
                            <span>Difficulty: <strong>{plan.difficulty || 'Intermediate'}</strong></span>
                            <span>Days: <strong>{plan.weeklySchedule?.length || 0}</strong></span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          {isDraft && (
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() => handlePublish(plan._id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
                              title="Publish plan for member"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Publish</span>
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleDuplicate(plan._id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                            title="Duplicate to draft copy"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Duplicate</span>
                          </button>

                          {isPlanActive && (
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() => handleArchive(plan._id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                              title="Archive plan"
                            >
                              <Archive className="w-3.5 h-3.5" />
                              <span>Archive</span>
                            </button>
                          )}

                          <Link to={`/trainer/workouts/${plan._id}/edit`}>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 transition-colors"
                              title="Edit Plan"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                          </Link>

                          {isDraft && (
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() => handleDelete(plan._id)}
                              className="p-1.5 rounded-xl text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                              title="Delete Draft"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Schedule breakdown preview */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        {plan.weeklySchedule?.map((d) => (
                          <div
                            key={d.day}
                            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
                          >
                            <span className="font-bold text-amber-600 dark:text-amber-400 block text-[11px]">
                              {d.day}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate block">
                              {d.isRestDay ? 'Rest Day' : (d.focus || d.title || 'Workout')}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {d.isRestDay ? 'Recovery' : `${d.exercises?.length || 0} Exercises`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainerWorkouts;
