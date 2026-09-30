import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  Mail,
  Phone,
  Clock,
  Calendar,
  Sparkles,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  Briefcase,
  UserCheck,
  Compass,
  ArrowRight,
  CreditCard,
  CalendarCheck,
} from 'lucide-react';
import memberService from '../../services/memberService';
import Button from '../../components/common/Button';

const MyTrainer = () => {
  const [trainer, setTrainer] = useState(null);
  const [hasActiveMembership, setHasActiveMembership] = useState(false);
  const [membershipPlan, setMembershipPlan] = useState(null);
  const [assignmentRequest, setAssignmentRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTrainer = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await memberService.getTrainer();
      if (res.success) {
        setTrainer(res.trainer || null);
        setHasActiveMembership(!!res.hasActiveMembership);
        setMembershipPlan(res.membershipPlan || null);
        setAssignmentRequest(res.assignmentRequest || null);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Failed to load assigned trainer.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainer();
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-64 rounded-3xl bg-slate-100 dark:bg-slate-800/60 animate-pulse border border-slate-200 dark:border-slate-800" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{error}</h2>
        <Button variant="primary" onClick={fetchTrainer}>
          Try Again
        </Button>
      </div>
    );
  }

  // STATE A — No Active Membership
  if (!hasActiveMembership) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            My Assigned Fitness Coach
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Personalized 1-on-1 coaching, tailored programming, and form analysis.
          </p>
        </div>

        <div className="p-10 sm:p-12 text-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
            <CreditCard className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Membership Required
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Choose an active membership before requesting a personal coach.
            </p>
          </div>
          <div className="pt-2">
            <Link to="/membership">
              <Button variant="primary" size="md" icon={ArrowRight} iconPosition="right">
                Explore Memberships
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // STATE B — Active Membership + Request Pending (or No Assigned Trainer Yet)
  if (!trainer) {
    const isPending = assignmentRequest?.status === 'pending';
    const preferredTrainer = assignmentRequest?.requestedTrainer;

    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            My Assigned Fitness Coach
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Personalized coaching status and coach allocation tracking.
          </p>
        </div>

        <div className="p-10 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto animate-pulse">
            <Clock className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Trainer Assignment In Progress
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Your membership is active. Our team is matching you with a FitCore coach.
            </p>
          </div>

          {/* Details Card */}
          <div className="max-w-md mx-auto p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 grid grid-cols-2 gap-4 text-left">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Membership
              </span>
              <span className="text-sm font-black text-slate-900 dark:text-white">
                {membershipPlan?.name || 'Active Membership'}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Request Status
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                <Clock className="w-3 h-3" /> Pending Review
              </span>
            </div>

            {preferredTrainer && (
              <div className="col-span-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Requested Coach Preference
                </span>
                <span className="text-xs font-bold text-primary-500">
                  {preferredTrainer.name}
                </span>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link to="/trainers">
              <Button variant="primary" size="md" icon={Compass}>
                Browse Trainers
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // STATE C — Trainer Assigned (Real Trainer Details)
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            My Assigned Fitness Coach
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review your coach's qualifications, expertise specializations, and schedule 1-on-1 sessions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/member/schedule">
            <Button variant="primary" size="sm" icon={CalendarCheck}>
              Book Session
            </Button>
          </Link>
          <Link to="/member/schedule">
            <Button variant="outline" size="sm" icon={Calendar}>
              View Schedule
            </Button>
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        {/* Main Coach Header Card */}
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500 to-primary-600 text-white font-black text-3xl flex items-center justify-center shadow-lg shrink-0">
            {trainer.name ? trainer.name.charAt(0).toUpperCase() : 'T'}
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                {trainer.name}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                Certified Coach
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  trainer.isAvailable !== false
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {trainer.isAvailable !== false ? 'Active Schedule' : 'Limited Hours'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {trainer.email}
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {trainer.phone || 'No direct phone'}
              </span>
              <span className="flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                {trainer.experienceYears || 0} Years Experience
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Coaching Specialties & Bio */}
          <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              Specializations &amp; Bio
            </h3>

            <div>
              <span className="text-xs font-semibold text-slate-400 block mb-2">
                Specialties
              </span>
              {trainer.specializations && trainer.specializations.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {trainer.specializations.map((spec, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-xl text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">General conditioning specialist.</p>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-400 block mb-1">
                Coach Philosophy
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {trainer.bio ||
                  'Dedicated to helping athletes build functional strength, mobility, and healthy habits.'}
              </p>
            </div>

            {trainer.qualifications && trainer.qualifications.length > 0 && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-400 block mb-1.5">
                  Certifications
                </span>
                <div className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                  {trainer.qualifications.map((q, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{q}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Schedule & Working Hours */}
          <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary-500" />
              Working Schedule &amp; Availability
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-1">Shift Hours</span>
                <span className="text-base font-bold text-slate-900 dark:text-white">
                  {trainer.availableTime || '06:00 AM - 02:00 PM'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-2">Facility Presence Days</span>
                {trainer.availableDays && trainer.availableDays.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {trainer.availableDays.map((d, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px]"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Monday through Friday</p>
                )}
              </div>

              {/* Direct Booking CTA */}
              <div className="p-5 rounded-2xl bg-primary-50 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800 text-xs space-y-3">
                <div>
                  <span className="font-bold text-primary-950 dark:text-primary-200 block text-sm">
                    Book Training Session
                  </span>
                  <p className="text-primary-800 dark:text-primary-300 text-[11px] mt-0.5">
                    Schedule 1-on-1 private workouts and technique reviews directly with {trainer.name}.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link to="/member/schedule">
                    <Button variant="primary" size="sm" icon={CalendarCheck}>
                      Book Now
                    </Button>
                  </Link>
                  <Link to="/member/schedule">
                    <Button variant="outline" size="sm" icon={Calendar}>
                      Schedule Calendar
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyTrainer;
