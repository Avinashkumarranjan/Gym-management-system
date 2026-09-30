import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  Dumbbell,
  CheckCircle2,
  AlertCircle,
  Filter,
  Loader2,
  ShieldAlert,
  BarChart3,
  UserCheck,
  Award,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import reportService from '../../services/reportService';
import Button from '../../components/common/Button';

const COLORS = ['#ef4444', '#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899'];

const AdminReports = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'members', 'revenue', 'attendance', 'trainers'

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await reportService.getSummary(params);
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load reports summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleApplyFilter = (e) => {
    e.preventDefault();
    fetchReports();
  };

  const handleClearFilter = () => {
    setStartDate('');
    setEndDate('');
    setTimeout(fetchReports, 50);
  };

  const handleExport = async (type) => {
    try {
      setExporting(type);
      if (type === 'members') await reportService.exportMembers();
      else if (type === 'payments') await reportService.exportPayments({ startDate, endDate });
      else if (type === 'attendance') await reportService.exportAttendance({ startDate, endDate });
      else if (type === 'expiring') await reportService.exportExpiring();
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(null);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
        <p className="text-sm font-medium">Aggregating FitCore analytics & reports...</p>
      </div>
    );
  }

  const { membership, revenue, attendance, growth, trainerWorkload } = data || {};

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Executive Reports & Analytics
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time data aggregation on memberships, verified revenue, gym footfall, and coach workloads.
          </p>
        </div>

        {/* CSV Export Dropdown / Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={Download}
            loading={exporting === 'members'}
            onClick={() => handleExport('members')}
            title="Download full members registry CSV"
          >
            Members CSV
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={Download}
            loading={exporting === 'payments'}
            onClick={() => handleExport('payments')}
            title="Download verified transactions CSV"
          >
            Payments CSV
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={Download}
            loading={exporting === 'attendance'}
            onClick={() => handleExport('attendance')}
            title="Download attendance log CSV"
          >
            Attendance CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={Download}
            loading={exporting === 'expiring'}
            onClick={() => handleExport('expiring')}
            title="Download 30-day expiry forecast CSV"
          >
            Expiring CSV
          </Button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <form
        onSubmit={handleApplyFilter}
        className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-primary-500" /> Date Range:
          </span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            />
          </div>
          <Button type="submit" variant="primary" size="sm">
            Apply
          </Button>
          {(startDate || endDate) && (
            <button
              type="button"
              onClick={handleClearFilter}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline"
            >
              Clear
            </button>
          )}
        </div>

        {/* Section Quick Jump Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
          {['all', 'members', 'revenue', 'attendance', 'trainers'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded-lg capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-primary-500 text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </form>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Verified Revenue
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            ₹{revenue?.totalRevenue ? revenue.totalRevenue.toLocaleString('en-IN') : '0'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {revenue?.paidTransactionsCount || 0} completed payments
          </p>
        </div>

        {/* Active Memberships */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Members
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {membership?.totalActive || 0}
          </p>
          <p className="text-xs text-rose-500 dark:text-rose-400 font-medium">
            {membership?.expiringIn7Days || 0} expiring in next 7 days
          </p>
        </div>

        {/* Today's Attendance */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Today's Check-ins
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {attendance?.todayCount || 0}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Avg {attendance?.averageDailyAttendance || 0} visits / day this month
          </p>
        </div>

        {/* Peak Training Hours */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Peak Traffic
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {attendance?.peakHour || '6:00 PM'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Busiest on {attendance?.peakDay || 'Mondays'}
          </p>
        </div>
      </div>

      {/* SECTION 1: REVENUE REPORT */}
      {(activeTab === 'all' || activeTab === 'revenue') && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-500" />
                Revenue & Financial Performance
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Verified collections only (Payment.status = paid).
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500">
              Total ₹{revenue?.totalRevenue?.toLocaleString('en-IN') || 0}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            {/* Monthly Trend Chart */}
            <div className="lg:col-span-2 h-72">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Monthly Collections (INR)
              </h3>
              {revenue?.monthlyRevenue && revenue.monthlyRevenue.length > 0 ? (
                <ResponsiveContainer width="100%" height="90%">
                  <AreaChart data={revenue.monthlyRevenue}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip
                      formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#ef4444"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#revenueGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No monthly revenue data available.
                </div>
              )}
            </div>

            {/* Revenue by Plan */}
            <div className="h-72 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Revenue by Tier
                </h3>
                <div className="space-y-3">
                  {revenue?.revenueByPlan && revenue.revenueByPlan.length > 0 ? (
                    revenue.revenueByPlan.map((p, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {p.plan}
                        </span>
                        <div className="text-right">
                          <span className="font-bold text-slate-900 dark:text-white">
                            ₹{p.revenue.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {p.count} member(s)
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400">No plan breakdown available</p>
                  )}
                </div>
              </div>

              {/* Payment Methods */}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Payment Channels
                </span>
                <div className="flex flex-wrap gap-2">
                  {revenue?.paymentMethods &&
                    revenue.paymentMethods.map((m, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                      >
                        {m.method}: {m.count}
                      </span>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: MEMBERSHIP & GROWTH REPORT */}
      {(activeTab === 'all' || activeTab === 'members') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Membership Status & Expiry Forecast */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-500" />
                  Membership Health
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Active vs expired lifecycle and upcoming renewals.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Active
                </span>
                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {membership?.totalActive || 0}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-500/10 border border-slate-500/20 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Expired
                </span>
                <p className="text-xl font-black text-slate-600 dark:text-slate-300 mt-0.5">
                  {membership?.totalExpired || 0}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Expiring 7d
                </span>
                <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
                  {membership?.expiringIn7Days || 0}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  Expiring 30d
                </span>
                <p className="text-xl font-black text-purple-600 dark:text-purple-400 mt-0.5">
                  {membership?.expiringIn30Days || 0}
                </p>
              </div>
            </div>

            {/* Distribution */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Plan Distribution
              </h3>
              <div className="space-y-2">
                {membership?.distribution && membership.distribution.length > 0 ? (
                  membership.distribution.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {item.planName}
                      </span>
                      <span className="font-bold text-primary-500">
                        {item.count} subscriber(s)
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">No active subscriptions registered</p>
                )}
              </div>
            </div>
          </div>

          {/* Member Growth Graph */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary-500" />
                  Member Acquisition
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Monthly new member onboarding trend.
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {growth?.totalMembers || 0} Total Members
              </span>
            </div>

            <div className="h-64">
              {growth?.monthlyGrowth && growth.monthlyGrowth.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={growth.monthlyGrowth}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="newMembers" fill="#f97316" radius={[6, 6, 0, 0]} name="New Members" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No registration trend data recorded yet.
                </div>
              )}
            </div>

            <div className="flex items-center justify-around text-center pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[11px] text-slate-400">Active Accounts</span>
                <p className="text-lg font-bold text-emerald-500">{growth?.activeMembers || 0}</p>
              </div>
              <div>
                <span className="text-[11px] text-slate-400">Inactive Accounts</span>
                <p className="text-lg font-bold text-slate-400">{growth?.inactiveMembers || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: TRAINER WORKLOAD REPORT */}
      {(activeTab === 'all' || activeTab === 'trainers') && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-amber-500" />
                Coach Workload & Assignment Distribution
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Roster distribution, upcoming 1-on-1 sessions, and active training plans.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4 sm:px-6">Trainer</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Assigned Athletes</th>
                  <th className="py-3 px-4 text-center">Upcoming Sessions</th>
                  <th className="py-3 px-4 text-center">Active Workouts</th>
                  <th className="py-3 px-4 text-center">Active Diets</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs sm:text-sm">
                {trainerWorkload && trainerWorkload.length > 0 ? (
                  trainerWorkload.map((t) => (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-900 dark:text-white">
                        <div>
                          <p>{t.name}</p>
                          <p className="text-xs text-slate-400 font-normal">{t.email}</p>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            t.isActive
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                              : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {t.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold text-slate-800 dark:text-slate-200">
                        {t.assignedMembers}
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold text-purple-500">
                        {t.upcomingSessions}
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold text-blue-500">
                        {t.activeWorkouts}
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold text-amber-500">
                        {t.activeDiets}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-xs text-slate-400">
                      No trainers configured in the gym system.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReports;
