import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserCheck,
  UserX,
  Award,
  CreditCard,
  UserPlus,
  ArrowRight,
  TrendingUp,
  PieChart as PieIcon,
  ShieldCheck,
  Clock,
  Flame,
  DollarSign,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import adminService from '../../services/adminService';
import attendanceService from '../../services/attendanceService';
import StatCard from '../../components/admin/StatCard';
import StatusBadge from '../../components/admin/StatusBadge';
import Button from '../../components/common/Button';

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'];

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [attStats, setAttStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const [dashRes, attRes] = await Promise.allSettled([
        adminService.getDashboard(),
        attendanceService.getAdminAttendanceStats(),
      ]);

      if (dashRes.status === 'fulfilled' && dashRes.value.success) {
        setData(dashRes.value);
      } else if (dashRes.status === 'rejected') {
        throw dashRes.reason;
      }

      if (attRes.status === 'fulfilled' && attRes.value.success) {
        setAttStats(attRes.value.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-primary-500/20 text-primary-500 flex items-center justify-center animate-spin">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <p className="text-xs uppercase font-bold tracking-wider text-slate-400">
          Loading Admin Analytics...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 rounded-3xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-center space-y-3">
        <p className="text-sm font-bold text-red-600 dark:text-red-400">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchDashboard}>
          Retry Fetching
        </Button>
      </div>
    );
  }

  const { stats, recentMembers, recentTrainers, membershipDistribution, memberGrowth } =
    data || {};

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 to-slate-950 text-white border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-primary-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-primary-500" /> System Governance Active
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            FitCore Facility Overview
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time analytics and management controls powered by MongoDB.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Button to="/admin/members/new" variant="primary" size="sm" icon={UserPlus} iconPosition="left">
            Add Member
          </Button>
          <Button to="/admin/trainers/new" variant="outline" size="sm" className="text-white border-slate-700 hover:border-slate-500">
            Add Coach
          </Button>
        </div>
      </div>

      {/* Pending Trainer Assignments Notification Card */}
      <Link
        to="/admin/trainer-assignments"
        className="block p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 hover:border-amber-500/60 transition-all group shadow-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-amber-500/20 shrink-0">
              {stats?.pendingTrainerAssignments ?? 0}
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                Trainer Assignments Pending
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                  Action Required
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Athletes with active memberships waiting for certified coach pairing.
              </p>
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform">
            Review &amp; Assign Coaches <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </Link>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-5">
        <StatCard
          icon={Users}
          title="Total Members"
          value={stats?.totalMembers}
          detail="All registered athletes"
          color="orange"
        />
        <StatCard
          icon={UserCheck}
          title="Active Members"
          value={stats?.activeMembers}
          detail="Currently active accounts"
          color="emerald"
        />
        <StatCard
          icon={UserX}
          title="Inactive Members"
          value={stats?.inactiveMembers}
          detail="Deactivated members"
          color="purple"
        />
        <StatCard
          icon={Award}
          title="Total Trainers"
          value={stats?.totalTrainers}
          detail="Certified staff"
          color="blue"
        />
        <StatCard
          icon={CreditCard}
          title="Active Plans"
          value={stats?.activeMemberships}
          detail="Active membership subscriptions"
          color="amber"
        />
        <StatCard
          icon={TrendingUp}
          title="New This Month"
          value={stats?.newMembersThisMonth}
          detail="Registered in current month"
          color="orange"
        />
      </div>

      {/* Attendance & Facility Traffic Snapshot (Phase 6) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Live Facility Turnstile & Attendance Overview
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Real-time daily footfall and monthly gym utilization metrics.
            </p>
          </div>
          <Link to="/admin/attendance">
            <Button variant="outline" size="sm" className="text-xs">
              View Detailed Logs <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
              Today's Check-ins
            </span>
            <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
              {attStats?.todayCheckIns ?? 0}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Total sessions today</span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
              Currently Inside Gym
            </span>
            <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
              {attStats?.currentlyInside ?? 0}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Active workout floor load</span>
          </div>

          <div className="p-4 rounded-2xl bg-primary-500/10 border border-primary-500/20">
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 block">
              Monthly Total Visits
            </span>
            <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
              {attStats?.visitsThisMonth ?? 0}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Visits this calendar month</span>
          </div>

          <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
              Peak Traffic Hour
            </span>
            <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
              {attStats?.peakHour !== undefined && attStats?.peakHour !== null ? `${attStats.peakHour}:00` : '—'}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Highest density hour</span>
          </div>
        </div>
      </div>

      {/* Financial Revenue Snapshot (Phase 7) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-500" />
              Financial &amp; Revenue Overview
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Verified MongoDB transaction receipts from Razorpay online gateway and cash counters.
            </p>
          </div>
          <Link to="/admin/payments">
            <Button variant="outline" size="sm" className="text-xs">
              Open Payments Ledger <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20">
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 block">
              Total Gross Revenue
            </span>
            <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
              ₹{Number(stats?.totalRevenue || 0).toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">All-time paid memberships</span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
              Revenue This Month
            </span>
            <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
              ₹{Number(stats?.revenueThisMonth || 0).toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Current calendar month</span>
          </div>

          <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
              Today's Collections
            </span>
            <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
              ₹{Number(stats?.paymentsTodayAmount || 0).toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">{stats?.paymentsTodayCount || 0} transaction(s) today</span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
              Verified Receipts
            </span>
            <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
              {stats?.successfulPaymentsCount || 0} Paid
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">{stats?.pendingPaymentsCount || 0} pending · {stats?.failedPaymentsCount || 0} failed</span>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Member Growth */}
        <div className="lg:col-span-7 p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Member Registrations
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                New athlete sign-ups over the past 6 months
              </p>
            </div>
            <span className="p-2 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-500 border border-primary-200/60 dark:border-primary-800/60">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>

          <div className="h-64 w-full pt-4">
            {memberGrowth && memberGrowth.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={memberGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      border: '1px solid #334155',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="members" fill="#f97316" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No monthly historical data yet.
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Membership Distribution */}
        <div className="lg:col-span-5 p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Membership Distribution
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Subscribers categorized by plan tier
              </p>
            </div>
            <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-500 border border-blue-200/60 dark:border-blue-800/60">
              <PieIcon className="w-4 h-4" />
            </span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {membershipDistribution && membershipDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={membershipDistribution}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                    fontSize={11}
                  >
                    {membershipDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      border: '1px solid #334155',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center space-y-2">
                <p className="text-xs text-slate-400">No active memberships assigned yet.</p>
                <Link to="/admin/members" className="text-xs text-primary-500 font-bold hover:underline">
                  Assign plans to members &rarr;
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity: Members & Trainers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Members */}
        <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Recently Enrolled Members
            </h3>
            <Link
              to="/admin/members"
              className="text-xs font-bold text-primary-500 hover:text-primary-600 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentMembers && recentMembers.length > 0 ? (
              recentMembers.map((member) => (
                <div
                  key={member._id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                      {member.user?.name ? member.user.name.charAt(0) : 'M'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {member.user?.name || 'Member'}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {member.user?.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge status={member.membershipStatus} />
                    <Link
                      to={`/admin/members/${member._id}`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-primary-500 transition-colors"
                      title="View Member"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">No members registered yet.</p>
            )}
          </div>
        </div>

        {/* Recent Trainers */}
        <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Coaching Staff Roster
            </h3>
            <Link
              to="/admin/trainers"
              className="text-xs font-bold text-primary-500 hover:text-primary-600 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentTrainers && recentTrainers.length > 0 ? (
              recentTrainers.map((trainer) => (
                <div
                  key={trainer._id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                      {trainer.user?.name ? trainer.user.name.charAt(0) : 'T'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {trainer.user?.name || 'Trainer'}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {trainer.specializations?.slice(0, 2).join(', ') || 'Coach'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge status={trainer.user?.isActive ? 'active' : 'inactive'} />
                    <Link
                      to={`/admin/trainers/${trainer._id}`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 transition-colors"
                      title="View Coach"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">No trainers added yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
