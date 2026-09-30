import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  X,
  FileText,
  AlertCircle,
  CheckCircle2,
  CalendarCheck,
  CalendarX,
  MessageSquare,
  Search,
} from 'lucide-react';
import sessionService from '../../services/sessionService';
import Button from '../../components/common/Button';

const TrainerSchedule = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Cancel Modal
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  // Coach Note Modal
  const [noteTarget, setNoteTarget] = useState(null);
  const [coachNote, setCoachNote] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await sessionService.getTrainerSessions();
      if (res.success) {
        setSessions(res.data || []);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Failed to load coaching schedule.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleCancelSession = async () => {
    if (!cancelTarget) return;

    try {
      setCancelLoading(true);
      const res = await sessionService.cancelTrainerSession(cancelTarget._id, cancelReason);
      if (res.success) {
        setSuccessMsg('Session cancelled.');
        setCancelTarget(null);
        setCancelReason('');
        fetchSessions();
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Cancellation failed.');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!noteTarget) return;

    try {
      setNoteLoading(true);
      const res = await sessionService.updateTrainerSessionNote(noteTarget._id, coachNote);
      if (res.success) {
        setSuccessMsg('Session notes updated.');
        setNoteTarget(null);
        setCoachNote('');
        fetchSessions();
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save note.');
    } finally {
      setNoteLoading(false);
    }
  };

  // Group by Today vs Upcoming vs Past
  const todayStr = new Date().toISOString().split('T')[0];

  const filteredSessions = sessions.filter((s) => {
    const memberName = s.member?.name || '';
    return memberName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const todaySessions = filteredSessions.filter((s) => {
    const sDate = new Date(s.sessionDate).toISOString().split('T')[0];
    return sDate === todayStr && s.status === 'scheduled';
  });

  const upcomingSessions = filteredSessions.filter((s) => {
    const sDate = new Date(s.sessionDate).toISOString().split('T')[0];
    return sDate > todayStr && s.status === 'scheduled';
  });

  const historySessions = filteredSessions.filter((s) => {
    const sDate = new Date(s.sessionDate).toISOString().split('T')[0];
    return s.status === 'cancelled' || s.status === 'completed' || sDate < todayStr;
  });

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="h-44 rounded-3xl bg-slate-100 dark:bg-slate-800/60 animate-pulse border border-slate-200 dark:border-slate-800" />
        <div className="h-64 rounded-3xl bg-slate-100 dark:bg-slate-800/40 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider text-amber-100">
            <CalendarCheck className="w-3.5 h-3.5 text-amber-300" />
            Coach Master Schedule
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            Personal Coaching Calendar
          </h1>
          <p className="text-xs md:text-sm text-amber-100/90 max-w-xl">
            View today's booked athlete sessions, upcoming appointments, and add tactical session feedback notes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-xs font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            {todaySessions.length} Sessions Today
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

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by athlete name..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium"
          />
        </div>
      </div>

      {/* Section 1: Today's Sessions */}
      <div className="space-y-4">
        <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-500" />
          Today's Scheduled Appointments ({todaySessions.length})
        </h2>

        {todaySessions.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
            No training sessions scheduled for today.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {todaySessions.map((session) => (
              <div
                key={session._id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border-2 border-amber-500/50 shadow-md space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-white font-bold flex items-center justify-center text-sm shadow">
                      {session.member?.name ? session.member.name.charAt(0).toUpperCase() : 'M'}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        {session.member?.name}
                      </h4>
                      <p className="text-[11px] text-slate-400">{session.member?.email}</p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 text-xs font-black">
                    {session.startTime} - {session.endTime}
                  </span>
                </div>

                {session.memberNote && (
                  <div className="text-xs text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    "{session.memberNote}"
                  </div>
                )}

                {session.trainerNote && (
                  <div className="text-xs text-amber-900 dark:text-amber-200 bg-amber-50/60 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-200/60 dark:border-amber-900/40">
                    <strong>Coach Note:</strong> {session.trainerNote}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setNoteTarget(session);
                      setCoachNote(session.trainerNote || '');
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    {session.trainerNote ? 'Edit Note' : 'Add Note'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCancelTarget(session);
                      setCancelReason('');
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 font-semibold"
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Upcoming Sessions List */}
      <div className="space-y-4">
        <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-500" />
          Upcoming Coaching Calendar ({upcomingSessions.length})
        </h2>

        {upcomingSessions.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
            No upcoming sessions scheduled ahead.
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingSessions.map((session) => (
              <div
                key={session._id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-amber-400/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex flex-col items-center justify-center font-black shrink-0">
                    <span className="text-[10px] uppercase font-bold">
                      {new Date(session.sessionDate).toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                    <span className="text-sm leading-tight">
                      {new Date(session.sessionDate).getDate()}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                      {session.member?.name}
                    </h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      {session.startTime} - {session.endTime} •{' '}
                      {new Date(session.sessionDate).toLocaleDateString()}
                    </p>
                    {session.memberNote && (
                      <p className="text-xs text-slate-500 italic mt-1">
                        Athlete note: "{session.memberNote}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => {
                      setNoteTarget(session);
                      setCoachNote(session.trainerNote || '');
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Note
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCancelTarget(session);
                      setCancelReason('');
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-semibold"
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 3: Past / Cancelled Sessions Accordion/List */}
      {historySessions.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Archived & Cancelled Appointments ({historySessions.length})
          </h3>
          <div className="space-y-2">
            {historySessions.slice(0, 10).map((session) => (
              <div
                key={session._id}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs opacity-75"
              >
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {session.member?.name}
                  </span>
                  <span className="text-slate-400 ml-2">
                    {new Date(session.sessionDate).toLocaleDateString()} • {session.startTime}
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    session.status === 'cancelled'
                      ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800'
                  }`}
                >
                  {session.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coach Note Modal */}
      {noteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl">
            <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-500" />
              Coach Session Note
            </h3>
            <p className="text-xs text-slate-500">
              Session with <strong>{noteTarget.member?.name}</strong> on{' '}
              {new Date(noteTarget.sessionDate).toLocaleDateString()} at {noteTarget.startTime}.
            </p>

            <textarea
              rows="4"
              value={coachNote}
              onChange={(e) => setCoachNote(e.target.value)}
              placeholder="Enter preparation notes, performance cues, or post-workout observations..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-amber-500"
            />

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setNoteTarget(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={noteLoading}
                onClick={handleSaveNote}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
              >
                {noteLoading ? 'Saving...' : 'Save Note'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl">
            <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarX className="w-5 h-5 text-red-500" />
              Cancel Appointment?
            </h3>
            <p className="text-xs text-slate-500">
              Cancel session for <strong>{cancelTarget.member?.name}</strong> on{' '}
              {new Date(cancelTarget.sessionDate).toLocaleDateString()} at {cancelTarget.startTime}?
            </p>

            <input
              type="text"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation (optional)..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium"
            />

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCancelTarget(null)}
              >
                Keep
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

export default TrainerSchedule;
