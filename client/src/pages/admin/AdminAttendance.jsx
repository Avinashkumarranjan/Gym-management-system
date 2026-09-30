import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Search,
  Filter,
  Users,
  Clock,
  Flame,
  Calendar,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import attendanceService from '../../services/attendanceService';

const AdminAttendance = () => {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });

  const fetchData = async (page = 1) => {
    try {
      setLoading(true);
      setError('');

      const params = { page, limit: 20 };
      if (searchQuery) params.search = searchQuery;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (dateFilter) params.date = dateFilter;

      const [recordsRes, statsRes] = await Promise.all([
        attendanceService.getAdminAttendance(params),
        attendanceService.getAdminAttendanceStats(),
      ]);

      if (recordsRes.success) {
        setRecords(recordsRes.data || []);
        if (recordsRes.pagination) setPagination(recordsRes.pagination);
      }
      if (statsRes.success) {
        setStats(statsRes.data);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Failed to load attendance oversight.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1);
  }, [statusFilter, dateFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchData(1);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-xs font-bold uppercase tracking-wider text-teal-400 mb-2">
            <CalendarCheck className="w-3.5 h-3.5" />
            Facility Operations
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Gym Attendance &amp; Foot Traffic
          </h1>
          <p className="text-xs md:text-sm text-slate-400 max-w-xl">
            Live facility entry logging, member check-out durations, and peak-hour density analytics across the club.
          </p>
        </div>

        <div className="px-4 py-2 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs font-bold text-slate-300">
          {pagination.total} Recorded Visits
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-xs font-semibold flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Analytics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
            Today's Check-ins
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats?.todayCheckIns || 0}
          </div>
          <span className="text-[10px] text-teal-500 font-semibold">Today's Total Entries</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
            Inside Facility
          </span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            {stats?.currentlyInside || 0}
          </div>
          <span className="text-[10px] text-slate-400">Active Workouts Now</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
            Visits This Month
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats?.monthlyVisits || 0}
          </div>
          <span className="text-[10px] text-slate-400">Total Monthly Volume</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
            Avg Daily Traffic
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats?.averageDailyVisits || 0}
          </div>
          <span className="text-[10px] text-slate-400">Members/Day</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
            Peak Density Hour
          </span>
          <div className="text-sm font-black text-amber-500 truncate pt-1">
            {stats?.peakHour || '18:00 - 19:00'}
          </div>
          <span className="text-[10px] text-slate-400">Prime Gym Window</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm text-xs">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search member by name or email..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
            >
              <option value="all">All Statuses</option>
              <option value="checked_in">Currently Inside</option>
              <option value="checked_out">Completed Sessions</option>
            </select>
          </div>

          {dateFilter && (
            <button
              type="button"
              onClick={() => setDateFilter('')}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white font-semibold underline text-[11px]"
            >
              Clear Date
            </button>
          )}
        </div>
      </div>

      {/* Attendance Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 animate-pulse">
            Loading attendance records...
          </div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No attendance records match the search or filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50 dark:bg-slate-800/20">
                  <th className="p-4 pl-6">Date</th>
                  <th className="p-4">Member Athlete</th>
                  <th className="p-4">Check-In</th>
                  <th className="p-4">Check-Out</th>
                  <th className="p-4">Duration</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {records.map((r) => (
                  <tr
                    key={r._id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="p-4 pl-6 font-bold text-slate-900 dark:text-white">
                      {new Date(r.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">
                      <div>{r.member?.name || '—'}</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        {r.member?.email}
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">
                      {new Date(r.checkInTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="p-4 text-slate-500">
                      {r.checkOutTime
                        ? new Date(r.checkOutTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </td>
                    <td className="p-4 font-bold text-slate-800 dark:text-slate-200">
                      {r.durationMinutes > 0 ? `${r.durationMinutes} min` : 'In Progress'}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          r.status === 'checked_in'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        }`}
                      >
                        {r.status === 'checked_in' ? 'Inside' : 'Completed'}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-slate-400 italic max-w-xs truncate">
                      {r.notes || '—'}
                    </td>
                  </tr>
                ))}
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
                onClick={() => fetchData(pagination.page - 1)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.pages}
                onClick={() => fetchData(pagination.page + 1)}
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

export default AdminAttendance;
