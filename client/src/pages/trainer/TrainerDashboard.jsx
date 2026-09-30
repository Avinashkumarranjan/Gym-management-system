import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Award,
  Clock,
  Briefcase,
  ArrowRight,
  Eye,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Dumbbell,
  Apple,
  CalendarCheck,
  TrendingUp,
} from 'lucide-react';
import trainerService from '../../services/trainerService';
import TrainerStatCard from '../../components/trainer/TrainerStatCard';
import Button from '../../components/common/Button';

const TrainerDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await trainerService.getDashboard();
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Failed to load trainer dashboard.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
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
      <div className="max-w-xl mx-auto p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          {error || 'Unable to load coach dashboard'}
        </h2>
        <Button variant="primary" onClick={fetchDashboard}>
          Try Again
        </Button>
      </div>
    );
  }

  const { trainer, assignedMemberCount, recentMembers } = data;
  const firstName = trainer?.name ? trainer.name.split(' ')[0] : 'Coach';

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider border border-amber-500/30">
              <Award className="w-3.5 h-3.5" /> Performance Staff Workspace
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Welcome, Coach {firstName}!
            </h1>
            <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
              Manage your assigned athlete roster, review member goals, and maintain your availability schedule from your coaching hub.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/trainer/profile">
              <Button variant="outlineMuted" size="sm">
                Edit Shift Info
              </Button>
            </Link>
            <Link to="/trainer/members">
              <Button variant="primary" size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold border-none shadow-md shadow-amber-500/20">
                View All Clients
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <TrainerStatCard
          icon={Users}
          label="Active Clients"
          value={assignedMemberCount || 0}
          badge={`${assignedMemberCount || 0} Assigned`}
          badgeVariant="amber"
          color="amber"
          subtext="Athletes currently under your guidance"
        />

        <TrainerStatCard
          icon={Briefcase}
          label="Experience"
          value={`${trainer?.experienceYears || 0} yrs`}
          badge="Verified"
          badgeVariant="emerald"
          color="emerald"
          subtext="Professional coaching tenure"
        />

        <TrainerStatCard
          icon={Award}
          label="Specializations"
          value={trainer?.specializations?.length || 0}
          badge="Focus Areas"
          badgeVariant="primary"
          color="primary"
          subtext={
            trainer?.specializations?.length > 0
              ? trainer.specializations.slice(0, 2).join(', ')
              : 'Add specialties in profile'
          }
        />

        <TrainerStatCard
          icon={Clock}
          label="Facility Schedule"
          value={trainer?.isAvailable !== false ? 'Accepting' : 'Full'}
          badge={trainer?.isAvailable !== false ? 'Active Shift' : 'Capacity'}
          badgeVariant={trainer?.isAvailable !== false ? 'emerald' : 'amber'}
          color="amber"
          subtext={trainer?.availableTime || 'Shift hours not specified'}
        />
      </div>

      {/* Assigned Members Preview Section */}
      <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-500" />
              Recent Assigned Athletes
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Athletes assigned to your coaching program by gym administration.
            </p>
          </div>

          <Link
            to="/trainer/members"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:gap-2 transition-all"
          >
            <span>View All ({assignedMemberCount})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentMembers && recentMembers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Athlete</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Fitness Goal</th>
                  <th className="py-3 px-4">Plan</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentMembers.map((m) => (
                  <tr key={m._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {m.user?.name}
                      </div>
                      <div className="text-[11px] text-slate-400">{m.user?.email}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {m.user?.phone || '—'}
                    </td>
                    <td className="py-3.5 px-4 capitalize font-medium text-slate-700 dark:text-slate-300">
                      {m.fitnessGoal ? m.fitnessGoal.replace('_', ' ') : 'General'}
                    </td>
                    <td className="py-3.5 px-4">
                      {m.membershipPlan ? (
                        <span className="font-medium text-amber-600 dark:text-amber-400">
                          {m.membershipPlan.name}
                        </span>
                      ) : (
                        <span className="text-slate-400">None</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/trainer/members/${m._id}`}
                        className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 inline-block transition-colors"
                        title="View Athlete Record"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
            <Users className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              No Athletes Currently Assigned
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Athletes assigned to you by gym administration will appear here with contact information and training goals.
            </p>
          </div>
        )}
      </div>

      {/* Coach Command Tools */}
      <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Coach Command Tools
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Access your coaching protocols, athlete meal schedules, appointment bookings, and performance tracking.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 self-start sm:self-auto bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800">
            Active Features
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: 'Workout Program Builder',
              desc: 'Prescribe custom workout routines and exercise reps.',
              icon: Dumbbell,
              link: '/trainer/workouts',
            },
            {
              title: 'Meal & Macro Planner',
              desc: 'Build customized nutrition schedules and hydration targets.',
              icon: Apple,
              link: '/trainer/diets',
            },
            {
              title: 'Schedule & Slot Booking',
              desc: 'Manage athlete training slots and appointments.',
              icon: CalendarCheck,
              link: '/trainer/schedule',
            },
            {
              title: 'Client Progress & Attendance',
              desc: 'Record athlete strength gains and biometric changes.',
              icon: TrendingUp,
              link: '/trainer/members',
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <Link
                key={idx}
                to={item.link}
                className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-2 hover:border-amber-500/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group block"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs text-slate-400 group-hover:text-amber-500 transition-colors">
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

export default TrainerDashboard;
