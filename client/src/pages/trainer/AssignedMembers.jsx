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
    <div className="space-y-6">
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
              placeholder="Search assigned athletes by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            className="shrink-0 px-5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold border-none"
          >
            Search
          </Button>
          {search && (
            <Button
              type="button"
              variant="outline"
              onClick={handleResetSearch}
              className="shrink-0 text-xs"
            >
              Clear
            </Button>
          )}
        </form>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Athletes List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-16 rounded-2xl bg-slate-100 dark:bg-slate-800/50 animate-pulse border border-slate-200 dark:border-slate-800"
            />
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <Users className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            {search ? 'No Athletes Found Matching Search' : 'No Athletes Currently Assigned'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            {search
              ? 'Try modifying your search query or clear the filter.'
              : 'When gym administrators assign members to your coaching roster, they will appear here.'}
          </p>
          {search && (
            <Button variant="outline" size="sm" onClick={handleResetSearch}>
              Clear Search
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Athlete</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Fitness Goal</th>
                  <th className="py-3.5 px-4">Vitals</th>
                  <th className="py-3.5 px-4">Plan</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
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
                      <Link
                        to={`/trainer/members/${m._id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-semibold"
                        title="View Full Athlete Record"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-500" />
                        <span>Profile</span>
                      </Link>
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
