import React, { useState, useEffect } from 'react';
import {
  Apple,
  Search,
  Filter,
  Eye,
  X,
  Target,
  Clock,
  Flame,
  Droplets,
  AlertCircle,
  Utensils,
} from 'lucide-react';
import dietService from '../../services/dietService';
import Button from '../../components/common/Button';

const AdminDietPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [inspectPlan, setInspectPlan] = useState(null);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (statusFilter !== 'all') {
        params.isActive = statusFilter === 'active';
      }
      const res = await dietService.getAdminDiets(params);
      if (res.success) {
        setPlans(res.data || []);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Failed to load diet protocols.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [statusFilter]);

  const filteredPlans = plans.filter((p) => {
    const memberName = p.member?.name || '';
    const trainerName = p.trainer?.name || '';
    const title = p.title || '';
    const q = searchQuery.toLowerCase();
    return (
      memberName.toLowerCase().includes(q) ||
      trainerName.toLowerCase().includes(q) ||
      title.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
            <Apple className="w-3.5 h-3.5" />
            Club Oversight
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Diet Protocols Management
          </h1>
          <p className="text-xs md:text-sm text-slate-400 max-w-xl">
            Facility-wide oversight of athlete nutrition regimens, calorie thresholds, and macro programs prescribed by coaches.
          </p>
        </div>

        <div className="px-4 py-2 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs font-bold text-slate-300">
          {plans.length} Total Diet Plans
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-xs font-semibold flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search member, coach, or plan..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Archived Only</option>
          </select>
        </div>
      </div>

      {/* Plans Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 animate-pulse">
            Loading diet plans...
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No diet plans match the search or filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50 dark:bg-slate-800/20">
                  <th className="p-4 pl-6">Plan Title & Goal</th>
                  <th className="p-4">Member Athlete</th>
                  <th className="p-4">Assigned Coach</th>
                  <th className="p-4">Calories & Macros</th>
                  <th className="p-4">Meals</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPlans.map((plan) => (
                  <tr
                    key={plan._id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="p-4 pl-6 font-bold text-slate-900 dark:text-white">
                      <div>{plan.title}</div>
                      <span className="text-[10px] text-emerald-500 uppercase tracking-wider font-semibold">
                        {plan.goal}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">
                      {plan.member?.name || '—'}
                      <div className="text-[10px] text-slate-400 font-normal">
                        {plan.member?.email}
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">
                      {plan.trainer?.name || '—'}
                    </td>
                    <td className="p-4 text-slate-700 dark:text-slate-300">
                      <div className="font-bold">{plan.dailyCalories} kcal</div>
                      <div className="text-[10px] text-slate-400">
                        P: {plan.macros?.proteinGrams}g | C: {plan.macros?.carbsGrams}g | F: {plan.macros?.fatGrams}g
                      </div>
                    </td>
                    <td className="p-4 text-slate-500">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {plan.meals?.length || 0} Meals
                      </span>
                    </td>
                    <td className="p-4">
                      {plan.isActive ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 dark:bg-slate-800">
                          Archived
                        </span>
                      )}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <button
                        type="button"
                        onClick={() => setInspectPlan(plan)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Plan Inspection Modal */}
      {inspectPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                  Nutrition Protocol Inspection
                </span>
                <h3 className="font-black text-lg text-slate-900 dark:text-white">
                  {inspectPlan.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectPlan(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                <span className="text-slate-400 block text-[10px]">Calories</span>
                <strong className="text-base text-slate-900 dark:text-white">{inspectPlan.dailyCalories} kcal</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                <span className="text-slate-400 block text-[10px]">Protein</span>
                <strong className="text-base text-slate-900 dark:text-white">{inspectPlan.macros?.proteinGrams}g</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                <span className="text-slate-400 block text-[10px]">Carbs</span>
                <strong className="text-base text-slate-900 dark:text-white">{inspectPlan.macros?.carbsGrams}g</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                <span className="text-slate-400 block text-[10px]">Water Target</span>
                <strong className="text-base text-slate-900 dark:text-white">{inspectPlan.waterLiters}L</strong>
              </div>
            </div>

            {inspectPlan.notes && (
              <p className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                {inspectPlan.notes}
              </p>
            )}

            {/* Meals */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                Prescribed Meals ({inspectPlan.meals?.length || 0})
              </h4>
              {inspectPlan.meals?.map((m, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-emerald-600 dark:text-emerald-400">{m.mealName}</span>
                    <span className="text-slate-400">{m.time}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {m.items?.map((item, itemIdx) => (
                      <div
                        key={itemIdx}
                        className="p-2 rounded-lg bg-white dark:bg-slate-800 text-[11px] flex justify-between border border-slate-100 dark:border-slate-700/60"
                      >
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{item.food}</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" onClick={() => setInspectPlan(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDietPlans;
