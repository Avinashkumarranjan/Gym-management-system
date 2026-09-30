import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Apple,
  Search,
  Plus,
  Calendar,
  User,
  Target,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Flame,
  Droplets,
} from 'lucide-react';
import trainerService from '../../services/trainerService';
import dietService from '../../services/dietService';
import Button from '../../components/common/Button';

const TrainerDiets = () => {
  const [assignedMembers, setAssignedMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [memberDiets, setMemberDiets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dietsLoading, setDietsLoading] = useState(false);
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

  // 2. Fetch diets for the selected member
  useEffect(() => {
    if (!selectedMemberId) return;

    const fetchDiets = async () => {
      try {
        setDietsLoading(true);
        setError('');
        const res = await dietService.getTrainerMemberDiets(selectedMemberId);
        if (res.success) {
          setMemberDiets(res.data || []);
        }
      } catch (err) {
        setError(
          err.response?.data?.message || err.message || 'Failed to load athlete diet plans.'
        );
      } finally {
        setDietsLoading(false);
      }
    };

    fetchDiets();
  }, [selectedMemberId]);

  // Handle status toggle
  const handleToggleStatus = async (planId, currentStatus) => {
    try {
      const res = await dietService.toggleDietPlanStatus(planId, !currentStatus);
      if (res.success) {
        setSuccessMsg(
          !currentStatus
            ? 'Diet plan activated! (Previous active plan deactivated).'
            : 'Diet plan deactivated.'
        );
        // Refresh list
        const refreshRes = await dietService.getTrainerMemberDiets(selectedMemberId);
        if (refreshRes.success) {
          setMemberDiets(refreshRes.data || []);
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

  const displayedDiets = memberDiets.filter((plan) => {
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
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-700 to-cyan-700 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider text-emerald-100">
            <Apple className="w-3.5 h-3.5 text-emerald-300" />
            Athlete Nutrition Management
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            Diet Protocols
          </h1>
          <p className="text-xs md:text-sm text-emerald-100/90 max-w-xl">
            Design, oversee, and fine-tune meal plans and macro distributions for all assigned athletes.
          </p>
        </div>

        {selectedMemberId && (
          <Link to={`/trainer/members/${selectedMemberId}/diet`}>
            <Button
              variant="primary"
              className="bg-white hover:bg-slate-100 text-emerald-800 font-bold border-none shadow-md shrink-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              Build Diet Plan
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
            Club administration has not assigned any members to your coaching roster yet.
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
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-md shadow-emerald-600/20'
                        : 'bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-slate-800 hover:border-emerald-400'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
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
                          isSelected ? 'text-emerald-100' : 'text-slate-400'
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

          {/* Member's Diet Plans Column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Header with filter */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Active Athlete View
                </span>
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  {currentMember?.user?.name}'s Nutrition Protocols
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

                <Link to={`/trainer/members/${selectedMemberId}/diet`}>
                  <Button variant="primary" className="text-xs bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    New Diet
                  </Button>
                </Link>
              </div>
            </div>

            {/* Diets List */}
            {dietsLoading ? (
              <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse text-center text-xs text-slate-400">
                Loading nutrition plans...
              </div>
            ) : displayedDiets.length === 0 ? (
              <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
                <Apple className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  No Diet Plans Created
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  This athlete has no meal plans saved under this filter. Design a personalized diet program below.
                </p>
                <Link to={`/trainer/members/${selectedMemberId}/diet`}>
                  <Button variant="primary" className="mt-2 text-xs bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Build Diet Plan
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {displayedDiets.map((plan) => (
                  <div
                    key={plan._id}
                    className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 hover:border-emerald-400/50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-slate-900 dark:text-white text-base">
                            {plan.title}
                          </h4>
                          {plan.isActive ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              Active Diet
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                              Archived
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                          <span>Calories: <strong className="text-slate-700 dark:text-slate-300">{plan.dailyCalories} kcal</strong></span>
                          <span>Meals: <strong>{plan.meals?.length || 0} scheduled</strong></span>
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

                        <Link to={`/trainer/diets/${plan._id}/edit`}>
                          <button
                            type="button"
                            className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition-colors"
                            title="Edit Plan"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </Link>
                      </div>
                    </div>

                    {/* Macro snapshot */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Protein</span>
                        <span className="font-black text-rose-600 dark:text-rose-400 text-sm">
                          {plan.macros?.proteinGrams ?? 0}g
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Carbs</span>
                        <span className="font-black text-amber-600 dark:text-amber-400 text-sm">
                          {plan.macros?.carbsGrams ?? 0}g
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Fats</span>
                        <span className="font-black text-sky-600 dark:text-sky-400 text-sm">
                          {plan.macros?.fatGrams ?? 0}g
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Water</span>
                        <span className="font-black text-blue-600 dark:text-blue-400 text-sm">
                          {plan.waterLiters ?? 0}L
                        </span>
                      </div>
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

export default TrainerDiets;
