import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  CreditCard,
  Award,
  Activity,
  ArrowRight,
  Calendar,
  Scale,
  Target,
  Sparkles,
  Dumbbell,
  Apple,
  CalendarCheck,
  TrendingUp,
  AlertCircle,
  Clock,
  Phone,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import memberService from '../../services/memberService';
import attendanceService from '../../services/attendanceService';
import progressService from '../../services/progressService';
import MemberStatCard from '../../components/member/MemberStatCard';
import Button from '../../components/common/Button';

const MemberDashboard = () => {
  const [data, setData] = useState(null);
  const [attStats, setAttStats] = useState(null);
  const [latestProgress, setLatestProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const [dashRes, attRes, progRes] = await Promise.allSettled([
        memberService.getDashboard(),
        attendanceService.getMyAttendanceStats(),
        progressService.getLatestProgress(),
      ]);

      if (dashRes.status === 'fulfilled' && dashRes.value.success) {
        setData(dashRes.value);
      } else if (dashRes.status === 'rejected') {
        throw dashRes.reason;
      }

      if (attRes.status === 'fulfilled' && attRes.value.success) {
        setAttStats(attRes.value.data);
      }
      if (progRes.status === 'fulfilled' && progRes.value.success) {
        setLatestProgress(progRes.value.data);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Failed to load member dashboard.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-44 rounded-3xl bg-slate-100 dark:bg-slate-800/60 animate-pulse border border-slate-200 dark:border-slate-800" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 rounded-2xl bg-slate-100 dark:bg-slate-800/50 animate-pulse border border-slate-200 dark:border-slate-800"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-xl mx-auto p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-sm">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          {error || 'Unable to load member dashboard'}
        </h2>
        <Button variant="primary" onClick={fetchDashboardData}>
          Try Again
        </Button>
      </div>
    );
  }

  const { member, membership, trainer } = data;
  const firstName = member?.name ? member.name.split(' ')[0] : 'Athlete';

  const formatGoal = (goal) => {
    if (!goal) return 'General Fitness';
    return goal
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  const getBmiBadgeVariant = (cat) => {
    if (cat === 'Normal') return 'emerald';
    if (cat === 'Underweight' || cat === 'Overweight') return 'amber';
    if (cat === 'Obese') return 'red';
    return 'slate';
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-500/20 text-primary-400 text-xs font-bold uppercase tracking-wider border border-primary-500/30">
              <Sparkles className="w-3.5 h-3.5" /> Athlete Performance Hub
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Welcome Back, {firstName}!
            </h1>
            <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
              Track your membership tier, review coaching guidance, and manage your health metrics from your personal self-service portal.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/member/profile">
              <Button variant="outlineMuted" size="sm">
                Edit Profile
              </Button>
            </Link>
            <Link to="/member/payments">
              <Button variant="primary" size="sm" className="shadow-md shadow-primary-500/20">
                {membership?.status === 'active' ? 'Renew Membership' : 'Buy Membership'}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* YOUR FITCORE SETUP (Compact Onboarding Card) */}
      {membership?.status === 'active' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary-500 block">
                Athlete Progress Tracker
              </span>
              <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
                YOUR FITCORE SETUP
              </h3>
            </div>
            <Link
              to={
                !trainer
                  ? '/member/trainer'
                  : !data.onboarding?.hasWorkout
                  ? '/member/workout'
                  : '/member/diet'
              }
            >
              <Button variant="primary" size="sm" icon={ArrowRight} iconPosition="right">
                Continue Setup
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Membership */}
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                ✓
              </div>
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">
                  {membership?.plan?.name || 'Active'} Membership
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  Active
                </span>
              </div>
            </div>

            {/* Trainer Assignment */}
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-sm ${
                  trainer
                    ? 'bg-emerald-500 text-white'
                    : 'bg-amber-500 text-white animate-pulse'
                }`}
              >
                {trainer ? '✓' : '⏳'}
              </div>
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">
                  Trainer Assignment
                </span>
                <span
                  className={`text-[10px] font-semibold ${
                    trainer
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {trainer ? trainer.name : 'Assignment Pending'}
                </span>
              </div>
            </div>

            {/* Workout Plan */}
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-sm ${
                  data.onboarding?.hasWorkout
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                }`}
              >
                {data.onboarding?.hasWorkout ? '✓' : '○'}
              </div>
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">
                  Workout Plan
                </span>
                <span className="text-[10px] text-slate-500 font-semibold">
                  {data.onboarding?.hasWorkout
                    ? 'Published'
                    : trainer
                    ? 'Preparing'
                    : 'Waiting for Trainer'}
                </span>
              </div>
            </div>

            {/* Diet Plan */}
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-sm ${
                  data.onboarding?.hasDiet
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                }`}
              >
                {data.onboarding?.hasDiet ? '✓' : '○'}
              </div>
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">
                  Diet Plan
                </span>
                <span className="text-[10px] text-slate-500 font-semibold">
                  {data.onboarding?.hasDiet
                    ? 'Published'
                    : trainer
                    ? 'Preparing'
                    : 'Waiting for Trainer'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MemberStatCard
          icon={CreditCard}
          label="Membership Status"
          value={
            membership?.status === 'active'
              ? 'Active'
              : membership?.status === 'expired'
              ? 'Expired'
              : 'Pending'
          }
          badge={membership?.status === 'active' ? 'Active' : 'Action Required'}
          badgeVariant={membership?.status === 'active' ? 'emerald' : 'amber'}
          color="primary"
          subtext={
            membership?.plan
              ? `${membership.plan.name} (${membership.plan.durationMonths}m)`
              : 'No subscription tier assigned'
          }
        />

        <MemberStatCard
          icon={Award}
          label="Assigned Coach"
          value={trainer ? trainer.name : 'Unassigned'}
          badge={trainer ? 'Assigned' : 'None'}
          badgeVariant={trainer ? 'primary' : 'slate'}
          color="amber"
          subtext={
            trainer
              ? `${trainer.experienceYears || 0} years experience`
              : 'Contact admin to assign coach'
          }
        />

        <MemberStatCard
          icon={Target}
          label="Current Goal"
          value={formatGoal(member?.fitnessGoal)}
          badge="In Progress"
          badgeVariant="primary"
          color="blue"
          subtext={`Joined ${new Date(member?.joinDate || Date.now()).toLocaleDateString()}`}
        />

        <MemberStatCard
          icon={Scale}
          label="Health Vitals (BMI)"
          value={member?.bmi ? `${member.bmi}` : '—'}
          badge={member?.bmiCategory || 'Vitals Incomplete'}
          badgeVariant={getBmiBadgeVariant(member?.bmiCategory)}
          color="emerald"
          subtext={
            member?.weight && member?.height
              ? `${member.weight} kg · ${member.height} cm`
              : 'Update vitals in profile'
          }
        />
      </div>

      {/* Attendance & Biometrics Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-1">Visits This Month</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {attStats?.attendanceThisMonth ?? 0}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              {attStats?.currentStreak > 0 ? `${attStats.currentStreak}-day active streak` : 'No active streak'}
            </span>
          </div>
          <Link to="/member/attendance">
            <Button variant="outline" size="sm" className="text-xs">
              Check-In <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-1">Latest Body Weight</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {latestProgress?.weight ? `${latestProgress.weight} kg` : (member?.weight ? `${member.weight} kg` : '—')}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              {latestProgress?.bodyFatPercentage ? `${latestProgress.bodyFatPercentage}% body fat` : (latestProgress?.date ? `Logged ${new Date(latestProgress.date).toLocaleDateString()}` : 'No logs yet')}
            </span>
          </div>
          <Link to="/member/progress">
            <Button variant="outline" size="sm" className="text-xs">
              Log Progress <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-1">Calculators</span>
            <span className="text-base font-bold text-slate-900 dark:text-white">
              BMI & TDEE Tools
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Mifflin-St Jeor engine
            </span>
          </div>
          <Link to="/calculators">
            <Button variant="outline" size="sm" className="text-xs">
              Open <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Mid Section: Current Plan & Assigned Trainer Summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Membership Summary Card */}
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Current Membership
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Active subscription tier & expiration dates
                  </p>
                </div>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  membership?.status === 'active'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                }`}
              >
                {membership?.status || 'No Plan'}
              </span>
            </div>

            {membership?.plan ? (
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                    {membership.plan.name}
                  </h3>
                  <span className="text-lg font-black text-primary-600 dark:text-primary-400">
                    ₹{Number(membership.plan.price).toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Start Date</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {membership.startDate
                        ? new Date(membership.startDate).toLocaleDateString()
                        : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Valid Until</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {membership.endDate
                        ? new Date(membership.endDate).toLocaleDateString()
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-2">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  No Active Subscription
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  You do not currently have an assigned membership plan. Please consult front-desk administration to activate your plan.
                </p>
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center justify-between">
            <Link
              to="/member/membership"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
            >
              <span>View Full Benefits</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link to="/member/payments">
              <Button variant="outline" size="sm" className="text-xs">
                {membership?.status === 'active' ? 'Renew / Extend' : 'Buy Membership'}
              </Button>
            </Link>
          </div>
        </div>

        {/* Assigned Trainer Summary Card */}
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Assigned Fitness Coach
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Your personal mentor & fitness specialist
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {trainer ? 'Active Coach' : 'Unassigned'}
              </span>
            </div>

            {trainer ? (
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-primary-500 text-white font-black text-lg flex items-center justify-center shadow-md">
                    {trainer.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {trainer.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {trainer.experienceYears} Years Experience
                    </p>
                  </div>
                </div>

                {trainer.specializations && trainer.specializations.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {trainer.specializations.slice(0, 3).map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-2">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  No Coach Assigned Yet
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  A certified trainer can be assigned to guide your conditioning and posture. Please speak to gym staff.
                </p>
              </div>
            )}
          </div>

          <div className="pt-2">
            <Link
              to="/member/trainer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 dark:text-primary-400 hover:gap-2 transition-all"
            >
              <span>View Coach Availability</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Access Tools */}
      <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary-500" />
              Athlete Performance Hub
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Access your training routines, nutritional allocations, attendance consistency, and physical metrics.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 self-start sm:self-auto bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
            Active Features
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: 'Personalized Workouts',
              desc: 'Digital routines & exercise logs designed by your coach.',
              icon: Dumbbell,
              link: '/member/workout',
            },
            {
              title: 'Nutrition & Diet Plans',
              desc: 'Custom macro allocations and targeted meal plans.',
              icon: Apple,
              link: '/member/diet',
            },
            {
              title: 'Facility Attendance',
              desc: 'Check-in histories, facility streak, and visit analytics.',
              icon: CalendarCheck,
              link: '/member/attendance',
            },
            {
              title: 'Body Composition Trends',
              desc: 'Periodic weight milestones and strength progression.',
              icon: TrendingUp,
              link: '/member/progress',
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <Link
                key={idx}
                to={item.link}
                className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-2 hover:border-primary-500/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group block"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-primary-500/10 text-primary-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs text-slate-400 group-hover:text-primary-500 transition-colors">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 pt-1">
                  {item.title}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {item.desc}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MemberDashboard;
