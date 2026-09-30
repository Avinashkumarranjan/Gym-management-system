import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
} from 'lucide-react';
import trainerService from '../../services/trainerService';
import workoutService from '../../services/workoutService';
import Button from '../../components/common/Button';

const TrainerWorkouts = () => {
  const [assignedMembers, setAssignedMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [memberWorkouts, setMemberWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workoutsLoading, setWorkoutsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | active | inactive
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Fetch assigned members first
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await trainerService.getAssignedMembers();
        if (res.success && res.data) {
          setAssignedMembers(res.data);
          if (res.data.length > 0) {
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
  }, []);

  // 2. Fetch workouts for the selected member
  useEffect(() => {
    if (!selectedMemberId) return;

    const fetchWorkouts = async () => {
      try {
        setWorkoutsLoading(true);
        setError('');
        const res = await workoutService.getTrainerMemberWorkouts(selectedMemberId);
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

    fetchWorkouts();
  }, [selectedMemberId]);

  // Handle status toggle
  const handleToggleStatus = async (planId, currentStatus) => {
    try {
      const res = await workoutService.toggleWorkoutPlanStatus(planId, !currentStatus);
      if (res.success) {
        setSuccessMsg(
          !currentStatus
            ? 'Plan set to active! (Previous active plan deactivated).'
            : 'Plan deactivated.'
        );
        // Refresh list
        const refreshRes = await workoutService.getTrainerMemberWorkouts(selectedMemberId);
        if (refreshRes.success) {
          setMemberWorkouts(refreshRes.data || []);
        }
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Status toggle failed.');
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
    if (statusFilter === 'active') return plan.isActive;
    if (statusFilter === 'inactive') return !plan.isActive;
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
          <p className="text-xs md:text-sm text-amber-100/90 max-w-xl">
            Design and oversee periodized training splits for all athletes on your assigned coaching roster.
          </p>
        </div>

        {selectedMemberId && (
          <Link to={`/trainer/members/${selectedMemberId}/workout`}>
            <Button
              variant="primary"
              className="bg-white hover:bg-slate-100 text-amber-800 font-bold border-none shadow-md shrink-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              Build New Plan
            </Button>
          </Link>
        )}
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-xs font-semibold flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {assignedMembers.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <User className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            No Assigned Athletes Found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Club administration has not assigned any members to your coaching roster yet. Workout plans can be built once athletes are assigned.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Athlete Selector Column */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center justify-between">
              <span>Select Athlete</span>
              <span className="text-xs text-slate-400 font-semibold">
                {assignedMembers.length} Total
              </span>
            </h3>

            {/* Search filter */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search athletes..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium"
              />
            </div>

            <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
              {filteredMembers.map((m) => {
                const isSelected = m._id === selectedMemberId;
                return (
                  <button
                    key={m._id}
                    type="button"
                    onClick={() => setSelectedMemberId(m._id)}
                    className={`w-full p-3 rounded-2xl text-left transition-all flex items-center gap-3 border ${
                      isSelected
                        ? 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/20'
                        : 'bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-slate-800 hover:border-amber-400'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}
                    >
                      {m.user?.name ? m.user.name.charAt(0).toUpperCase() : 'M'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs truncate">
                        {m.user?.name}
                      </div>
                      <div
                        className={`text-[10px] truncate ${
                          isSelected ? 'text-amber-100' : 'text-slate-400'
                        }`}
                      >
                        Goal: {m.fitnessGoal || 'General Fitness'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Member's Workout Plans Column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Header with filter */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Active Athlete View
                </span>
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  {currentMember?.user?.name}'s Workout History
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
                >
                  <option value="all">All Plans</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Archived Only</option>
                </select>

                <Link to={`/trainer/members/${selectedMemberId}/workout`}>
                  <Button variant="primary" className="text-xs bg-amber-600 hover:bg-amber-700">
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    New Plan
                  </Button>
                </Link>
              </div>
            </div>

            {/* Plans List */}
            {workoutsLoading ? (
              <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse text-center text-xs text-slate-400">
                Loading workout programs...
              </div>
            ) : displayedWorkouts.length === 0 ? (
              <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
                <Dumbbell className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  No Workout Plans Created
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  This athlete has no workout protocols saved under this filter. Click below to craft a tailored lifting routine.
                </p>
                <Link to={`/trainer/members/${selectedMemberId}/workout`}>
                  <Button variant="primary" className="mt-2 text-xs bg-amber-600 hover:bg-amber-700">
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Build Workout Plan
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {displayedWorkouts.map((plan) => (
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
                          {plan.isActive ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              Active Plan
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                              Archived
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                          <span>Goal: <strong className="text-slate-700 dark:text-slate-300 capitalize">{plan.goal}</strong></span>
                          <span>Days: <strong>{plan.weeklySchedule?.length || 0} scheduled</strong></span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(plan._id, plan.isActive)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                            plan.isActive
                              ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                              : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          }`}
                        >
                          {plan.isActive ? 'Deactivate' : 'Set as Active'}
                        </button>

                        <Link to={`/trainer/workouts/${plan._id}/edit`}>
                          <button
                            type="button"
                            className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-amber-600 transition-colors"
                            title="Edit Plan"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </Link>
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
                            {d.focus}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {d.exercises?.length || 0} Exercises
                          </span>
                        </div>
                      ))}
                    </div>
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

export default TrainerWorkouts;
