import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  Scale,
  Heart,
  Target,
  ShieldAlert,
  AlertCircle,
  Activity,
  Award,
  Dumbbell,
  Apple,
  CalendarCheck,
  Flame,
  TrendingUp,
  Plus,
  X,
  CheckCircle2,
} from 'lucide-react';
import trainerService from '../../services/trainerService';
import workoutService from '../../services/workoutService';
import dietService from '../../services/dietService';
import attendanceService from '../../services/attendanceService';
import progressService from '../../services/progressService';
import Button from '../../components/common/Button';

const AssignedMemberDetails = () => {
  const { memberId } = useParams();
  const navigate = useNavigate();

  const [member, setMember] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [diets, setDiets] = useState([]);
  const [attendanceData, setAttendanceData] = useState(null);
  const [progressEntries, setProgressEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isForbidden, setIsForbidden] = useState(false);

  // Progress modal state
  const [isProgModalOpen, setIsProgModalOpen] = useState(false);
  const [progWeight, setProgWeight] = useState('');
  const [progBodyFat, setProgBodyFat] = useState('');
  const [progChest, setProgChest] = useState('');
  const [progWaist, setProgWaist] = useState('');
  const [progArms, setProgArms] = useState('');
  const [progNotes, setProgNotes] = useState('');
  const [progLoading, setProgLoading] = useState(false);
  const [progError, setProgError] = useState('');
  const [progSuccess, setProgSuccess] = useState('');

  const fetchMemberDetails = async () => {
    try {
      setLoading(true);
      setError('');
      setIsForbidden(false);
      const [memberRes, workoutRes, dietRes, attRes, progRes] = await Promise.allSettled([
        trainerService.getAssignedMemberDetails(memberId),
        workoutService.getTrainerMemberWorkouts(memberId),
        dietService.getTrainerMemberDiets(memberId),
        attendanceService.getTrainerMemberAttendance(memberId),
        progressService.getTrainerMemberProgress(memberId),
      ]);

      if (memberRes.status === 'fulfilled' && memberRes.value.success) {
        setMember(memberRes.value.data);
      } else if (memberRes.status === 'rejected') {
        const err = memberRes.reason;
        if (err.response?.status === 403) {
          setIsForbidden(true);
          setError('Access forbidden: This athlete is not assigned to your coaching roster.');
          return;
        }
        setError(err.response?.data?.message || err.message || 'Failed to load athlete record.');
        return;
      }

      if (workoutRes.status === 'fulfilled' && workoutRes.value.success) {
        setWorkouts(workoutRes.value.data || []);
      }
      if (dietRes.status === 'fulfilled' && dietRes.value.success) {
        setDiets(dietRes.value.data || []);
      }
      if (attRes.status === 'fulfilled' && attRes.value.success) {
        setAttendanceData(attRes.value.data);
      }
      if (progRes.status === 'fulfilled' && progRes.value.success) {
        setProgressEntries(progRes.value.data || []);
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setIsForbidden(true);
        setError('Access forbidden: This athlete is not assigned to your coaching roster.');
      } else {
        setError(
          err.response?.data?.message || err.message || 'Failed to load athlete record.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemberDetails();
  }, [memberId]);

  const handleAddProgress = async (e) => {
    e.preventDefault();
    if (!progWeight || Number(progWeight) <= 0) {
      setProgError('Please enter a valid weight in kg.');
      return;
    }

    try {
      setProgLoading(true);
      setProgError('');
      const res = await progressService.addTrainerMemberProgress(memberId, {
        weight: Number(progWeight),
        bodyFatPercentage: progBodyFat ? Number(progBodyFat) : undefined,
        measurements: {
          chest: progChest ? Number(progChest) : undefined,
          waist: progWaist ? Number(progWaist) : undefined,
          arms: progArms ? Number(progArms) : undefined,
        },
        notes: progNotes,
      });

      if (res.success) {
        setProgSuccess('Athlete metrics recorded successfully!');
        setIsProgModalOpen(false);
        setProgWeight('');
        setProgBodyFat('');
        setProgChest('');
        setProgWaist('');
        setProgArms('');
        setProgNotes('');
        await fetchMemberDetails();
        setTimeout(() => setProgSuccess(''), 4000);
      }
    } catch (err) {
      setProgError(err.response?.data?.message || err.message || 'Failed to record progress.');
    } finally {
      setProgLoading(false);
    }
  };

  const activeWorkout = workouts.find((w) => w.isActive);
  const activeDiet = diets.find((d) => d.isActive);

  const formatGoal = (goal) => {
    if (!goal) return 'General Fitness';
    return goal
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-44 rounded-3xl bg-slate-100 dark:bg-slate-800/60 animate-pulse border border-slate-200 dark:border-slate-800" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 rounded-2xl bg-slate-100 dark:bg-slate-800/40 animate-pulse" />
          <div className="h-64 rounded-2xl bg-slate-100 dark:bg-slate-800/40 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="max-w-xl mx-auto p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-sm">
        {isForbidden ? (
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
        ) : (
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
        )}
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          {error || 'Athlete Not Found'}
        </h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          {isForbidden
            ? 'You only have permission to view performance records for athletes explicitly assigned to you by club administration.'
            : 'Please return to your athlete roster.'}
        </p>
        <Link to="/trainer/members">
          <Button variant="primary" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold border-none">
            Return to Athletes Roster
          </Button>
        </Link>
      </div>
    );
  }

  const { user, membershipPlan } = member;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/trainer/members"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Assigned Athletes
        </Link>

        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          Read-Only Athlete Record
        </span>
      </div>

      {/* Main Profile Header Card */}
      <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500 to-primary-600 text-white font-black text-3xl flex items-center justify-center shadow-lg shrink-0">
          {user?.name ? user.name.charAt(0).toUpperCase() : 'M'}
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              {user?.name}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Active Member
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              Your Athlete
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              {user?.email}
            </span>
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              {user?.phone || 'No phone set'}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Joined {new Date(member.joinDate).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Coaching Management: Workout & Diet Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Workout Plan Action Card */}
        <div className="p-6 md:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <Dumbbell className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Workout Protocol
              </h3>
            </div>
            {activeWorkout && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Active Plan
              </span>
            )}
          </div>

          {activeWorkout ? (
            <div className="space-y-3 text-xs">
              <div>
                <span className="font-black text-slate-900 dark:text-white text-base block">
                  {activeWorkout.title}
                </span>
                <span className="text-slate-500 text-[11px]">
                  {activeWorkout.weeklySchedule?.length || 0} training days configured
                </span>
              </div>
              <Link to={`/trainer/workouts/${activeWorkout._id}/edit`}>
                <Button variant="primary" className="w-full mt-2 text-xs bg-amber-600 hover:bg-amber-700 font-bold">
                  View / Edit Workout Plan
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              <p className="text-slate-500 text-[11px]">
                No workout protocol has been assigned to this athlete yet.
              </p>
              <Link to={`/trainer/members/${memberId}/workout`}>
                <Button variant="primary" className="w-full mt-2 text-xs bg-amber-600 hover:bg-amber-700 font-bold">
                  <Dumbbell className="w-3.5 h-3.5 mr-1.5" />
                  Create Workout Plan
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Diet Plan Action Card */}
        <div className="p-6 md:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Apple className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Nutrition Protocol
              </h3>
            </div>
            {activeDiet && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Active Diet
              </span>
            )}
          </div>

          {activeDiet ? (
            <div className="space-y-3 text-xs">
              <div>
                <span className="font-black text-slate-900 dark:text-white text-base block">
                  {activeDiet.title}
                </span>
                <span className="text-slate-500 text-[11px]">
                  {activeDiet.dailyCalories} kcal • {activeDiet.meals?.length || 0} meals
                </span>
              </div>
              <Link to={`/trainer/diets/${activeDiet._id}/edit`}>
                <Button variant="primary" className="w-full mt-2 text-xs bg-emerald-600 hover:bg-emerald-700 font-bold">
                  View / Edit Diet Plan
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              <p className="text-slate-500 text-[11px]">
                No nutrition plan has been assigned to this athlete yet.
              </p>
              <Link to={`/trainer/members/${memberId}/diet`}>
                <Button variant="primary" className="w-full mt-2 text-xs bg-emerald-600 hover:bg-emerald-700 font-bold">
                  <Apple className="w-3.5 h-3.5 mr-1.5" />
                  Create Diet Plan
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Grid: Health Vitals & Membership Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Health & Conditioning Vitals */}
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Scale className="w-4 h-4 text-amber-500" />
            Biometric Vitals & Training Goal
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <span className="text-slate-400 block mb-1">Target Fitness Goal</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-sm">
                <Target className="w-4 h-4 text-amber-500" />
                {formatGoal(member.fitnessGoal)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-slate-400 block mb-0.5">Recorded Height</span>
                <span className="text-base font-black text-slate-900 dark:text-white">
                  {member.height ? `${member.height} cm` : 'Not recorded'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Recorded Weight</span>
                <span className="text-base font-black text-slate-900 dark:text-white">
                  {member.weight ? `${member.weight} kg` : 'Not recorded'}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-slate-400 block mb-0.5">Calculated BMI</span>
                <span className="text-xl font-black text-slate-900 dark:text-white">
                  {member.bmi ? `${member.bmi}` : '—'}
                </span>
              </div>
              {member.bmiCategory && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {member.bmiCategory}
                </span>
              )}
            </div>

            {member.emergencyContact && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block mb-1">Emergency Contact</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {member.emergencyContact}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Membership Subscription Overview */}
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary-500" />
            Facility Membership Tier
          </h3>

          {membershipPlan ? (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Enrolled Plan
                </span>
                <span className="text-lg font-black text-slate-900 dark:text-white block">
                  {membershipPlan.name}
                </span>
                <span className="text-xs text-slate-500">
                  {membershipPlan.durationMonths} Months Duration
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 block mb-0.5">Plan Start</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {member.membershipStartDate
                      ? new Date(member.membershipStartDate).toLocaleDateString()
                      : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Plan Expiration</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {member.membershipEndDate
                      ? new Date(member.membershipEndDate).toLocaleDateString()
                      : '—'}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block mb-1">Status</span>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    member.membershipStatus === 'active'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                  }`}
                >
                  {member.membershipStatus || 'Pending'}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
              No active membership package recorded for this athlete.
            </div>
          )}
        </div>
      </div>

      {/* Attendance & Consistency Section */}
      <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-amber-500" />
              Gym Facility Attendance & Consistency
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified check-ins at gym access turnstiles for this athlete.
            </p>
          </div>
          {attendanceData?.streak > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
              {attendanceData.streak} Day Active Streak
            </span>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Visits This Month
            </span>
            <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
              {attendanceData?.visitsThisMonth ?? 0}
            </span>
            <span className="text-[11px] text-slate-500">Facility check-ins</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Last Facility Visit
            </span>
            <span className="text-base font-bold text-slate-900 dark:text-white mt-2 block">
              {attendanceData?.lastVisit
                ? new Date(attendanceData.lastVisit.checkInTime).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Never'}
            </span>
            <span className="text-[11px] text-slate-500">
              {attendanceData?.lastVisit
                ? new Date(attendanceData.lastVisit.checkInTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'No check-in record'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Consistency Streak
            </span>
            <span className="text-2xl font-black text-amber-500 mt-1 block">
              {attendanceData?.streak ?? 0}{' '}
              <span className="text-xs font-normal text-slate-500">days</span>
            </span>
            <span className="text-[11px] text-slate-500">Consecutive workouts</span>
          </div>
        </div>

        {/* History Table */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Recent Attendance Log (Last 10 Visits)
          </h4>
          <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Date</th>
                  <th className="py-2.5 px-4 font-semibold">Check In</th>
                  <th className="py-2.5 px-4 font-semibold">Check Out</th>
                  <th className="py-2.5 px-4 font-semibold">Duration</th>
                  <th className="py-2.5 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {attendanceData?.records && attendanceData.records.length > 0 ? (
                  attendanceData.records.slice(0, 10).map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        {r.date}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">
                        {new Date(r.checkInTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">
                        {r.checkOutTime
                          ? new Date(r.checkOutTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">
                        {r.durationMinutes ? `${r.durationMinutes} mins` : '—'}
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            r.status === 'checked_in'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}
                        >
                          {r.status === 'checked_in' ? 'Inside Gym' : 'Completed'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      className="py-6 text-center text-slate-400 italic"
                    >
                      No attendance records found for this athlete.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Progress & Biometric Tracking Section */}
      <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              Body Composition & Progress Tracking
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Historical measurements, body fat analysis, and physical metrics.
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => {
              setIsProgModalOpen(true);
              setProgError('');
            }}
            className="text-xs bg-emerald-600 hover:bg-emerald-700 font-bold"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Record Measurement
          </Button>
        </div>

        {progSuccess && (
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {progSuccess}
          </div>
        )}

        {/* Progress History Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Date</th>
                <th className="py-2.5 px-4 font-semibold">Weight</th>
                <th className="py-2.5 px-4 font-semibold">BMI</th>
                <th className="py-2.5 px-4 font-semibold">Body Fat</th>
                <th className="py-2.5 px-4 font-semibold">Waist</th>
                <th className="py-2.5 px-4 font-semibold">Chest</th>
                <th className="py-2.5 px-4 font-semibold">Arms</th>
                <th className="py-2.5 px-4 font-semibold">Recorded By</th>
                <th className="py-2.5 px-4 font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {progressEntries && progressEntries.length > 0 ? (
                progressEntries.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {new Date(p.date).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">
                      {p.weight} kg
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300">
                      {p.bmi ? `${p.bmi}` : '—'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300">
                      {p.bodyFatPercentage ? `${p.bodyFatPercentage}%` : '—'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500">
                      {p.measurements?.waist ? `${p.measurements.waist} cm` : '—'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500">
                      {p.measurements?.chest ? `${p.measurements.chest} cm` : '—'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500">
                      {p.measurements?.arms ? `${p.measurements.arms} cm` : '—'}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="capitalize px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {p.recordedBy?.name || 'Coach'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 max-w-xs truncate">
                      {p.notes || '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="9"
                    className="py-6 text-center text-slate-400 italic"
                  >
                    No progress measurements recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Measurement Modal */}
      {isProgModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Log Athlete Biometrics
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsProgModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {progError && (
              <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs">
                {progError}
              </div>
            )}

            <form onSubmit={handleAddProgress} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Weight (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    required
                    value={progWeight}
                    onChange={(e) => setProgWeight(e.target.value)}
                    placeholder="e.g. 78.5"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Body Fat %
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="60"
                    value={progBodyFat}
                    onChange={(e) => setProgBodyFat(e.target.value)}
                    placeholder="e.g. 15.2"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Chest (cm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={progChest}
                    onChange={(e) => setProgChest(e.target.value)}
                    placeholder="100"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Waist (cm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={progWaist}
                    onChange={(e) => setProgWaist(e.target.value)}
                    placeholder="82"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Arms (cm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={progArms}
                    onChange={(e) => setProgArms(e.target.value)}
                    placeholder="36"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Coach Observations / Notes
                </label>
                <textarea
                  rows="2"
                  value={progNotes}
                  onChange={(e) => setProgNotes(e.target.value)}
                  placeholder="e.g. Significant improvement in waist definition and stamina."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsProgModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={progLoading}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 font-bold"
                >
                  {progLoading ? 'Saving...' : 'Save Biometrics'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignedMemberDetails;
