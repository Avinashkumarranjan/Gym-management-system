import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  Eye,
  Mail,
  Phone,
  Calendar,
  Target,
  AlertCircle,
  Dumbbell,
  Scale,
  Apple,
  CalendarCheck,
  TrendingUp,
  Plus,
  MoreVertical,
  Sliders,
} from 'lucide-react';
import trainerService from '../../services/trainerService';
import Pagination from '../../components/admin/Pagination';
import Button from '../../components/common/Button';

const AssignedMembers = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Pagination State
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Active action menu state
  const [activeMenuMemberId, setActiveMenuMemberId] = useState(null);

  const fetchAssignedMembers = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        page,
        limit: 10,
        search: search.trim() || undefined,
      };

      const res = await trainerService.getAssignedMembers(params);
      if (res.success) {
        setMembers(res.data);
        setPages(res.pages);
        setTotal(res.total);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Failed to load assigned members.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedMembers();
  }, [page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchAssignedMembers();
  };

  const handleResetSearch = () => {
    setSearch('');
    setPage(1);
  };

  const formatGoal = (goal) => {
    if (!goal) return 'General Fitness';
    return goal
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  return (
    <div className="space-y-6" onClick={() => activeMenuMemberId && setActiveMenuMemberId(null)}>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Assigned Athletes
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Athletes currently assigned to your mentorship and training programs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            {total} Total Athletes
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by athlete name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
            />
          </div>
          <Button variant="primary" size="sm" type="submit" className="bg-amber-600 hover:bg-amber-700">
            Search
          </Button>
          {search && (
            <Button variant="outline" size="sm" type="button" onClick={handleResetSearch}>
              Clear
            </Button>
          )}
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Athletes List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium">Loading athlete roster...</p>
        </div>
      ) : members.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3">
          <Users className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="font-bold text-slate-800 dark:text-slate-200">No Athletes Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {search
              ? 'No assigned athletes matched your search criteria.'
              : 'You have not been assigned any athletes yet. Administrators allocate members to your coaching roster.'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/75 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3 px-4">Athlete</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Fitness Goal</th>
                  <th className="py-3 px-4">Body Metrics</th>
                  <th className="py-3 px-4">Plan</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {members.map((m) => (
                  <tr key={m._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 font-bold flex items-center justify-center shrink-0">
                          {m.user?.name ? m.user.name.charAt(0).toUpperCase() : 'M'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {m.user?.name}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Joined {new Date(m.joinDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 space-y-0.5 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[150px]">{m.user?.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        <span>{m.user?.phone || 'No phone'}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        <Target className="w-3 h-3 text-amber-500" />
                        {formatGoal(m.fitnessGoal)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">
                      {m.height && m.weight ? (
                        <span>
                          {m.weight} kg · {m.height} cm
                        </span>
                      ) : (
                        <span className="text-slate-400">Not recorded</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {m.membershipPlan ? (
                        <span className="font-semibold text-amber-600 dark:text-amber-400">
                          {m.membershipPlan.name}
                        </span>
                      ) : (
                        <span className="text-slate-400">None</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          m.membershipStatus === 'active'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        {m.membershipStatus || 'Pending'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="relative inline-flex items-center gap-1.5 justify-end">
                        <Link
                          to={`/trainer/members/${m._id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-semibold text-xs"
                          title="View Full Athlete Record"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-500" />
                          <span>Profile</span>
                        </Link>

                        {/* Actions Dropdown Toggle */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuMemberId(activeMenuMemberId === m._id ? null : m._id);
                            }}
                            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                            title="More Actions"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {activeMenuMemberId === m._id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 top-full mt-1.5 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-30 py-2 text-left animate-in fade-in zoom-in-95 duration-150"
                            >
                              <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                Athlete Actions
                              </div>

                              <Link
                                to={`/trainer/members/${m._id}`}
                                className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-amber-500"
                              >
                                <Eye className="w-4 h-4 text-slate-400" />
                                <span>View Profile</span>
                              </Link>

                              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                              <Link
                                to={`/trainer/members/${m._id}/workout/new`}
                                className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-amber-500"
                              >
                                <Plus className="w-4 h-4 text-emerald-500" />
                                <span>Create Workout Plan</span>
                              </Link>

                              <Link
                                to={`/trainer/workouts?memberId=${m._id}`}
                                className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-amber-500"
                              >
                                <Dumbbell className="w-4 h-4 text-amber-500" />
                                <span>Manage Workout Plan</span>
                              </Link>

                              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                              <Link
                                to={`/trainer/members/${m._id}/diet/new`}
                                className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-emerald-500"
                              >
                                <Plus className="w-4 h-4 text-emerald-500" />
                                <span>Create Diet Plan</span>
                              </Link>

                              <Link
                                to={`/trainer/diets?memberId=${m._id}`}
                                className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-emerald-500"
                              >
                                <Apple className="w-4 h-4 text-emerald-500" />
                                <span>Manage Diet Plan</span>
                              </Link>

                              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                              <Link
                                to={`/trainer/members/${m._id}#progress`}
                                className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-amber-500"
                              >
                                <TrendingUp className="w-4 h-4 text-cyan-500" />
                                <span>View Progress</span>
                              </Link>

                              <Link
                                to="/trainer/schedule"
                                className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-amber-500"
                              >
                                <CalendarCheck className="w-4 h-4 text-indigo-500" />
                                <span>View Sessions</span>
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {members.length > 0 && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800">
              <Pagination
                currentPage={page}
                totalPages={pages}
                totalItems={total}
                itemsPerPage={10}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AssignedMembers;
