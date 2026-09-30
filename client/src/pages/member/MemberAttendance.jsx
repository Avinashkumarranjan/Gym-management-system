import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  CalendarCheck,
  Flame,
  Award,
  Calendar,
  LogIn,
  LogOut,
  AlertCircle,
  CheckCircle2,
  Activity,
  History,
  TrendingUp,
} from 'lucide-react';
import attendanceService from '../../services/attendanceService';
import memberService from '../../services/memberService';
import Button from '../../components/common/Button';

const MemberAttendance = () => {
  const [stats, setStats] = useState(null);
  const [records, setRecords] = useState([]);
  const [hasActiveMembership, setHasActiveMembership] = useState(true);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [notes, setNotes] = useState('');

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      setError('');
      const [statsRes, historyRes, memberRes] = await Promise.allSettled([
        attendanceService.getMyAttendanceStats(),
        attendanceService.getMyAttendance({ limit: 20 }),
        memberService.getMembership(),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value?.success) {
        setStats(statsRes.value.data);
      }
      if (historyRes.status === 'fulfilled' && historyRes.value?.success) {
        setRecords(historyRes.value.data || []);
      }
      if (memberRes.status === 'fulfilled' && memberRes.value?.success) {
        setHasActiveMembership(memberRes.value.membership?.status === 'active');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Failed to load attendance records.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const handleCheckIn = async () => {
    try {
      setActionLoading(true);
      setError('');
      setSuccessMsg('');
      const res = await attendanceService.checkIn(notes);
      if (res.success) {
        setSuccessMsg(res.message || 'Checked in successfully! Have a powerful session.');
        setNotes('');
        await fetchAttendanceData();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Check-in failed. Please verify your membership.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setActionLoading(true);
      setError('');
      setSuccessMsg('');
      const res = await attendanceService.checkOut();
      if (res.success) {
        setSuccessMsg(res.message || 'Checked out successfully. Rest and recover!');
        await fetchAttendanceData();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Check-out failed.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="h-44 rounded-3xl bg-slate-100 dark:bg-slate-800/60 animate-pulse border border-slate-200 dark:border-slate-800" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800/40 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const isCheckedIn = stats?.isCurrentlyCheckedIn;
  const todayRecord = stats?.todayRecord;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-700 to-indigo-800 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider text-emerald-100">
              <CalendarCheck className="w-3.5 h-3.5 text-emerald-300" />
              Club Check-In & Attendance
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              My Gym Attendance
            </h1>
            <p className="text-xs md:text-sm text-emerald-100/90 max-w-xl">
              Track your daily training frequency, log session durations, and maintain your personal consistency streak.
            </p>
          </div>

          {/* Quick Check-in/Check-out Action Box */}
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center shrink-0 space-y-2 min-w-[220px]">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-200">
              {isCheckedIn ? 'STATUS: CHECKED IN' : 'STATUS: CHECKED OUT'}
            </div>

            {!hasActiveMembership ? (
              <div className="text-center space-y-2 w-full">
                <span className="text-[11px] font-bold text-amber-200 block">
                  Active membership required.
                </span>
                <Link to="/membership" className="block w-full">
                  <Button variant="primary" size="sm" className="w-full bg-white hover:bg-slate-100 text-emerald-950 text-xs font-black border-none shadow-md">
                    Explore Plans
                  </Button>
                </Link>
              </div>
            ) : isCheckedIn ? (
              <>
                <Button
                  variant="danger"
                  disabled={actionLoading}
                  onClick={handleCheckOut}
                  className="w-full bg-rose-600 hover:bg-rose-700 font-bold text-xs shadow-md"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {actionLoading ? 'Checking Out...' : 'Check Out'}
                </Button>
                {todayRecord?.checkInTime && (
                  <span className="text-[11px] text-emerald-100 font-medium">
                    Check-in Time: {new Date(todayRecord.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </>
            ) : (
              <Button
                variant="primary"
                disabled={actionLoading}
                onClick={handleCheckIn}
                className="w-full bg-white hover:bg-slate-100 text-emerald-900 font-black text-xs border-none shadow-md"
              >
                <LogIn className="w-4 h-4 mr-2 text-emerald-600" />
                {actionLoading ? 'Checking In...' : 'Check In'}
              </Button>
            )}
          </div>
        </div>
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

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Visits This Month */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">This Month</span>
            <Calendar className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats?.attendanceThisMonth || 0}
          </div>
          <div className="text-[10px] text-slate-400">Recorded Workouts</div>
        </div>

        {/* Total Visits */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">All-Time Visits</span>
            <Activity className="w-4 h-4 text-primary-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats?.totalVisits || 0}
          </div>
          <div className="text-[10px] text-slate-400">Lifetime Club Entries</div>
        </div>

        {/* Average Duration */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Avg Session</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats?.averageSessionDuration || 0} <span className="text-sm font-semibold text-slate-400">min</span>
          </div>
          <div className="text-[10px] text-slate-400">Time Under Iron</div>
        </div>

        {/* Active Streak */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Current Streak</span>
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-1.5">
            {stats?.currentStreak || 0}
            <span className="text-sm font-bold text-orange-500">Days</span>
          </div>
          <div className="text-[10px] text-slate-400">
            Best: {stats?.longestStreak || 0} Days
          </div>
        </div>
      </div>

      {/* Attendance History Section */}
      <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-500" />
            Recent Check-In History
          </h2>
          <span className="text-xs text-slate-400 font-semibold">
            {records.length} Sessions Logged
          </span>
        </div>

        {records.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-500 mx-auto flex items-center justify-center">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              No Attendance Records Yet
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Your facility check-ins will appear here with entry times, exits, and recorded session lengths.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50 dark:bg-slate-800/20">
                  <th className="p-3.5 pl-4">Date</th>
                  <th className="p-3.5">Check In</th>
                  <th className="p-3.5">Check Out</th>
                  <th className="p-3.5">Duration</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 pr-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {records.map((r) => (
                  <tr
                    key={r._id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="p-3.5 pl-4 font-bold text-slate-900 dark:text-white">
                      {new Date(r.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="p-3.5 font-semibold text-slate-700 dark:text-slate-300">
                      {new Date(r.checkInTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="p-3.5 text-slate-500">
                      {r.checkOutTime
                        ? new Date(r.checkOutTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </td>
                    <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">
                      {r.durationMinutes > 0 ? `${r.durationMinutes} min` : 'In Progress'}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          r.status === 'checked_in'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 animate-pulse'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        }`}
                      >
                        {r.status === 'checked_in' ? 'Inside' : 'Completed'}
                      </span>
                    </td>
                    <td className="p-3.5 pr-4 text-slate-400 italic max-w-xs truncate">
                      {r.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberAttendance;
