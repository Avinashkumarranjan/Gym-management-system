import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Search,
  Scale,
  Calendar,
  AlertCircle,
  User,
} from 'lucide-react';
import progressService from '../../services/progressService';
import { calculateBMI, getBMICategory } from '../../utils/fitnessCalculations';

const AdminProgress = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });

  const fetchProgress = async (page = 1) => {
    try {
      setLoading(true);
      setError('');
      const params = { page, limit: 20 };
      if (searchQuery) params.search = searchQuery;

      const res = await progressService.getAdminProgress(params);
      if (res.success) {
        setEntries(res.data || []);
        if (res.pagination) setPagination(res.pagination);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Failed to load progress oversight records.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress(1);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProgress(1);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-bold uppercase tracking-wider text-purple-400 mb-2">
            <TrendingUp className="w-3.5 h-3.5" />
            Athlete Analytics Oversight
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Member Progress Logs
          </h1>
          <p className="text-xs md:text-sm text-slate-400 max-w-xl">
            Club-wide registry of athlete body weights, circumferences, and body composition updates.
          </p>
        </div>

        <div className="px-4 py-2 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs font-bold text-slate-300">
          {pagination.total} Logged Checkpoints
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-xs font-semibold flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4 shadow-sm text-xs">
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search member by name or email..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
          />
        </form>
      </div>

      {/* Progress Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 animate-pulse">
            Loading progress records...
          </div>
        ) : entries.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No progress checkpoints found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50 dark:bg-slate-800/20">
                  <th className="p-4 pl-6">Date</th>
                  <th className="p-4">Member Athlete</th>
                  <th className="p-4">Weight</th>
                  <th className="p-4">Height &amp; BMI</th>
                  <th className="p-4">Body Fat</th>
                  <th className="p-4">Measurements</th>
                  <th className="p-4">Logged By</th>
                  <th className="p-4 pr-6">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {entries.map((entry) => {
                  const derivedBmi =
                    entry.height && entry.weight ? calculateBMI(entry.weight, entry.height) : null;
                  const bmiCat = derivedBmi ? getBMICategory(derivedBmi) : null;

                  return (
                    <tr
                      key={entry._id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="p-4 pl-6 font-bold text-slate-900 dark:text-white">
                        {new Date(entry.date).toLocaleDateString()}
                      </td>
                      <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">
                        <div>{entry.member?.name || '—'}</div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          {entry.member?.email}
                        </div>
                      </td>
                      <td className="p-4 font-black text-purple-600 dark:text-purple-400 text-sm">
                        {entry.weight} kg
                      </td>
                      <td className="p-4 text-slate-700 dark:text-slate-300">
                        {entry.height ? `${entry.height} cm` : '—'}
                        {derivedBmi && (
                          <div className="text-[10px] text-slate-400 font-semibold">
                            BMI: {derivedBmi} ({bmiCat})
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-slate-700 dark:text-slate-300">
                        {entry.bodyFatPercentage != null ? `${entry.bodyFatPercentage}%` : '—'}
                      </td>
                      <td className="p-4 text-slate-500">
                        {entry.measurements ? (
                          <div className="flex flex-wrap gap-1 text-[10px]">
                            {entry.measurements.waist && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                                W: {entry.measurements.waist}cm
                              </span>
                            )}
                            {entry.measurements.chest && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                                C: {entry.measurements.chest}cm
                              </span>
                            )}
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-400">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {entry.recordedBy?.name || 'Self'}
                        </span>
                        <span className="block text-[10px] text-slate-400 capitalize">
                          {entry.recordedBy?.role || 'Member'}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-slate-400 italic max-w-xs truncate">
                        {entry.notes || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        {pagination.pages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {pagination.page} of {pagination.pages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => fetchProgress(pagination.page - 1)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.pages}
                onClick={() => fetchProgress(pagination.page + 1)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProgress;
