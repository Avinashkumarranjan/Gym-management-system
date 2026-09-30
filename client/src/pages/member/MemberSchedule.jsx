import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  User,
  Plus,
  X,
  AlertCircle,
  CheckCircle2,
  CalendarCheck,
  CalendarX,
  FileText,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import sessionService from '../../services/sessionService';
import memberService from '../../services/memberService';
import Button from '../../components/common/Button';

const MemberSchedule = () => {
  const [sessions, setSessions] = useState([]);
  const [trainerInfo, setTrainerInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Booking Modal State
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [bookDate, setBookDate] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [memberNote, setMemberNote] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Reschedule Modal State
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleStartTime, setRescheduleStartTime] = useState('10:00');
  const [rescheduleEndTime, setRescheduleEndTime] = useState('11:00');
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [rescheduleError, setRescheduleError] = useState('');

  // Cancel Confirmation Modal State
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState('');

  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'history'

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [sessionRes, trainerRes] = await Promise.all([
        sessionService.getMySessions(),
        memberService.getMyTrainer(),
      ]);

      if (sessionRes.success) {
        setSessions(sessionRes.data || []);
      }
      if (trainerRes.success) {
        setTrainerInfo(trainerRes.trainer || trainerRes.data || null);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Failed to load scheduling data.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Today formatted as YYYY-MM-DD for min date
  const minDate = new Date().toISOString().split('T')[0];

  const handleBookSession = async (e) => {
    e.preventDefault();
    if (!bookDate || !startTime || !endTime) {
      setBookingError('Please select session date, start time, and end time.');
      return;
    }

    try {
      setBookingLoading(true);
      setBookingError('');
      const res = await sessionService.bookSession({
        sessionDate: bookDate,
        startTime,
        endTime,
        memberNote,
      });

      if (res.success) {
        setSuccessMsg('Session booked successfully with your personal coach!');
        setIsBookModalOpen(false);
        setBookDate('');
        setMemberNote('');
        fetchData();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setBookingError(
        err.response?.data?.message || err.message || 'Unable to book session. Please try a different slot.'
      );
    } finally {
      setBookingLoading(false);
    }
  };

  const handleReschedule = async (e) => {
    e.preventDefault();
    if (!rescheduleTarget || !rescheduleDate || !rescheduleStartTime || !rescheduleEndTime) {
      setRescheduleError('Please select valid date and times.');
      return;
    }

    try {
      setRescheduleLoading(true);
      setRescheduleError('');
      const res = await sessionService.rescheduleMemberSession(rescheduleTarget._id, {
        sessionDate: rescheduleDate,
        startTime: rescheduleStartTime,
        endTime: rescheduleEndTime,
      });

      if (res.success) {
        setSuccessMsg('Session rescheduled successfully!');
        setRescheduleTarget(null);
        fetchData();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setRescheduleError(
        err.response?.data?.message || err.message || 'Rescheduling failed.'
      );
    } finally {
      setRescheduleLoading(false);
    }
  };

  const handleCancelSession = async () => {
    if (!cancelTarget) return;

    try {
      setCancelLoading(true);
      setCancelError('');
      const res = await sessionService.cancelMemberSession(cancelTarget._id, cancelReason);

      if (res.success) {
        setSuccessMsg('Session cancelled.');
        setCancelTarget(null);
        setCancelReason('');
        fetchData();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setCancelError(
        err.response?.data?.message || err.message || 'Failed to cancel session.'
      );
    } finally {
      setCancelLoading(false);
    }
  };

  // Filter sessions
  const upcomingSessions = sessions.filter(
    (s) => s.status === 'scheduled' && new Date(s.sessionDate) >= new Date(new Date().setHours(0, 0, 0, 0))
  );

  const historySessions = sessions.filter(
    (s) => s.status === 'cancelled' || s.status === 'completed' || new Date(s.sessionDate) < new Date(new Date().setHours(0, 0, 0, 0))
  );

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="h-44 rounded-3xl bg-slate-100 dark:bg-slate-800/60 animate-pulse border border-slate-200 dark:border-slate-800" />
        <div className="h-64 rounded-3xl bg-slate-100 dark:bg-slate-800/40 animate-pulse" />
      </div>
    );
  }

  const assignedCoach = trainerInfo?.trainer || trainerInfo?._id ? (trainerInfo?.trainer || trainerInfo) : null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-800 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider text-blue-100">
              <CalendarCheck className="w-3.5 h-3.5 text-blue-300" />
              1-on-1 Coaching Schedule
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              My Training Sessions
            </h1>
            <p className="text-sm text-blue-100/90 max-w-xl">
              Book, reschedule, or manage private coaching sessions with your designated FitCore personal trainer.
            </p>
          </div>

          <div>
            <Button
              variant="primary"
              disabled={!assignedCoach}
              onClick={() => {
                setBookingError('');
                setIsBookModalOpen(true);
              }}
              className="bg-white hover:bg-slate-100 text-blue-700 font-bold border-none shadow-md"
            >
              <Plus className="w-4 h-4 mr-2" />
              Book New Session
            </Button>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-xs font-semibold flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Coach Info Banner */}
      {!assignedCoach ? (
        <div className="p-6 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-bold text-amber-900 dark:text-amber-200 text-sm">
                No Trainer Assigned
              </h3>
              <p className="text-xs text-amber-800 dark:text-amber-300">
                Session booking becomes available after your coach assignment is approved.
              </p>
            </div>
          </div>
          <Link to="/member/trainer" className="shrink-0">
            <Button variant="outline" size="sm">
              View Trainer Status
            </Button>
          </Link>
        </div>
      ) : (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-black text-lg flex items-center justify-center shrink-0 shadow">
              {assignedCoach?.name ? assignedCoach.name.charAt(0).toUpperCase() : 'T'}
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Assigned Personal Trainer
              </span>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {assignedCoach?.name}
              </h3>
              <p className="text-xs text-slate-500">
                {assignedCoach?.email} {assignedCoach?.phone ? `• ${assignedCoach.phone}` : ''}
              </p>
            </div>
          </div>

          {trainerInfo?.specialization && (
            <div className="text-xs text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 w-fit">
              Specialization: <strong className="text-slate-900 dark:text-white">{trainerInfo.specialization}</strong>
            </div>
          )}
        </div>
      )}

      {/* Sessions Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'upcoming'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Upcoming Sessions ({upcomingSessions.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'history'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Past & Cancelled ({historySessions.length})
        </button>
      </div>

      {/* Session List Display */}
      {activeTab === 'upcoming' ? (
        upcomingSessions.length === 0 ? (
          <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-500 mx-auto flex items-center justify-center">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              No Upcoming Sessions Booked
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Schedule your next workout, form check, or progress consultation with your personal trainer.
            </p>
            {assignedCoach && (
              <Button
                variant="primary"
                onClick={() => {
                  setBookingError('');
                  setIsBookModalOpen(true);
                }}
                className="mt-2 text-xs"
              >
                Book a Session Now
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingSessions.map((session) => (
              <div
                key={session._id}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 hover:border-blue-400/50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-base">
                        {new Date(session.sessionDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                        {session.startTime} - {session.endTime}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      Confirmed
                    </span>
                  </div>
                </div>

                {/* Trainer & Notes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Trainer
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {session.trainer?.name || 'Personal Coach'}
                    </span>
                  </div>

                  {session.memberNote && (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Your Note
                      </span>
                      <span className="text-slate-600 dark:text-slate-300 italic">
                        "{session.memberNote}"
                      </span>
                    </div>
                  )}

                  {session.trainerNote && (
                    <div className="col-span-full p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-blue-900 dark:text-blue-200">
                      <strong className="font-bold">Coach Note:</strong> {session.trainerNote}
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setRescheduleTarget(session);
                      setRescheduleDate(new Date(session.sessionDate).toISOString().split('T')[0]);
                      setRescheduleStartTime(session.startTime);
                      setRescheduleEndTime(session.endTime);
                      setRescheduleError('');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reschedule
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCancelTarget(session);
                      setCancelReason('');
                      setCancelError('');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancel Session
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* History & Cancelled View */
        historySessions.length === 0 ? (
          <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
            No past or cancelled session records found.
          </div>
        ) : (
          <div className="space-y-3">
            {historySessions.map((session) => (
              <div
                key={session._id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs opacity-80"
              >
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    {new Date(session.sessionDate).toLocaleDateString()} • {session.startTime} - {session.endTime}
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Trainer: {session.trainer?.name}
                  </div>
                </div>

                <div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      session.status === 'cancelled'
                        ? 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-900'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {session.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Book Session Modal */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-blue-600" />
                Book Coaching Session
              </h3>
              <button
                type="button"
                onClick={() => setIsBookModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {bookingError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold">
                {bookingError}
              </div>
            )}

            <form onSubmit={handleBookSession} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 text-xs">
                Booking with assigned coach: <strong>{assignedCoach?.name}</strong>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Session Date *
                </label>
                <input
                  type="date"
                  min={minDate}
                  value={bookDate}
                  onChange={(e) => setBookDate(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    End Time *
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Session Focus / Notes for Coach (Optional)
                </label>
                <textarea
                  rows="3"
                  value={memberNote}
                  onChange={(e) => setMemberNote(e.target.value)}
                  placeholder="e.g., Focus on squat technique, form review..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsBookModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={bookingLoading}
                  className="bg-blue-600 hover:bg-blue-700 font-bold"
                >
                  {bookingLoading ? 'Reserving Slot...' : 'Confirm Booking'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-blue-600" />
                Reschedule Session
              </h3>
              <button
                type="button"
                onClick={() => setRescheduleTarget(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {rescheduleError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold">
                {rescheduleError}
              </div>
            )}

            <form onSubmit={handleReschedule} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  New Date *
                </label>
                <input
                  type="date"
                  min={minDate}
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={rescheduleStartTime}
                    onChange={(e) => setRescheduleStartTime(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    End Time *
                  </label>
                  <input
                    type="time"
                    value={rescheduleEndTime}
                    onChange={(e) => setRescheduleEndTime(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRescheduleTarget(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={rescheduleLoading}
                  className="bg-blue-600 hover:bg-blue-700 font-bold"
                >
                  {rescheduleLoading ? 'Updating Schedule...' : 'Save New Time'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl">
            <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarX className="w-5 h-5 text-red-500" />
              Cancel Scheduled Session?
            </h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to cancel the session on{' '}
              <strong>{new Date(cancelTarget.sessionDate).toLocaleDateString()}</strong> at{' '}
              <strong>{cancelTarget.startTime}</strong>?
            </p>

            {cancelError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold">
                {cancelError}
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 text-xs mb-1">
                Reason for cancellation (Optional)
              </label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g., Work conflict, feeling unwell..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCancelTarget(null)}
              >
                Keep Session
              </Button>
              <Button
                type="button"
                variant="danger"
                disabled={cancelLoading}
                onClick={handleCancelSession}
              >
                {cancelLoading ? 'Cancelling...' : 'Confirm Cancel'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberSchedule;
