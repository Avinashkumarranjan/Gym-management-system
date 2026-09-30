import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Check,
  Shield,
  HelpCircle,
  Download,
  History,
  RefreshCw,
  Loader2,
  Award,
} from 'lucide-react';
import memberService from '../../services/memberService';
import paymentService from '../../services/paymentService';
import Button from '../../components/common/Button';

const DEFAULT_BENEFITS = [
  'Gym Access',
  'Trainer Guidance',
  'Workout Plan',
  'Diet Plan',
  'Progress Tracking',
];

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const calculateDaysRemaining = (endDate) => {
  if (!endDate) return 0;
  const diffTime = new Date(endDate).getTime() - new Date().getTime();
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
};

const MyMembership = () => {
  const [membership, setMembership] = useState(null);
  const [onboarding, setOnboarding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  const fetchMembership = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await memberService.getMembership();
      if (res.success) {
        setMembership(res.membership);
        setOnboarding(res.onboarding || null);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Failed to load membership details.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembership();
  }, []);

  const handleDownloadLatestReceipt = async () => {
    try {
      setDownloading(true);
      const res = await paymentService.getMyPayments({ limit: 1 });
      if (res.success && res.data && res.data.length > 0) {
        const latest = res.data[0];
        await paymentService.downloadReceipt(latest._id, latest.invoiceNumber);
      } else {
        alert('No payment receipt available yet. Complete a payment to generate your official tax invoice.');
      }
    } catch (err) {
      console.error('Failed to download receipt:', err);
      alert('Could not download receipt. You can also view receipts in the Payments section.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="h-96 rounded-3xl bg-slate-100 dark:bg-slate-800/60 animate-pulse border border-slate-200 dark:border-slate-800" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-sm">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{error}</h2>
        <Button variant="primary" onClick={fetchMembership}>
          Try Again
        </Button>
      </div>
    );
  }

  const plan = membership?.plan;
  const isExpired = membership?.status === 'expired';
  const isActive = membership?.status === 'active';
  const daysRemaining = calculateDaysRemaining(membership?.endDate);

  const displayBenefits =
    plan?.benefits && plan.benefits.length > 0 ? plan.benefits : DEFAULT_BENEFITS;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header / Banner */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
          FITCORE MEMBERSHIP
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review your enrolled subscription package, active timeline, and facility privileges.
        </p>
      </div>

      {!plan ? (
        /* Empty State */
        <div className="p-12 text-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
            <CreditCard className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              No Membership Plan Assigned
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              You are currently registered as an athlete without an active subscription package. Select a plan below to activate full gym access and coaching features.
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link to="/member/payments">
              <Button variant="primary" size="sm">
                Buy Membership Plan
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline" size="sm">
                Front Desk Support
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        /* FitCore Membership Card */
        <div className="rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-2xl overflow-hidden relative">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Card Top Header */}
          <div className="p-6 sm:p-8 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-primary-500/20 text-primary-400 border border-primary-500/30">
                  FITCORE ATHLETE CARD
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {plan.name}
              </h2>
              {plan.description && (
                <p className="text-xs text-slate-400 mt-1 max-w-lg leading-relaxed">
                  {plan.description}
                </p>
              )}
            </div>

            {/* Status Badge */}
            <div className="shrink-0">
              <span
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black tracking-wider uppercase border ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : isExpired
                    ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                    : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                Status: {isActive ? 'ACTIVE' : isExpired ? 'EXPIRED' : 'PENDING'}
              </span>
            </div>
          </div>

          {/* Key Dates & Days Remaining Grid */}
          <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-3 gap-6 border-b border-slate-800/80 bg-slate-950/40">
            {/* Started */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary-500" /> Started:
              </span>
              <p className="text-lg font-black text-white">
                {formatDate(membership.startDate)}
              </p>
              <span className="text-[10px] text-slate-500 block">Enrollment date</span>
            </div>

            {/* Expires */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary-500" /> Expires:
              </span>
              <p
                className={`text-lg font-black ${
                  isExpired ? 'text-rose-400' : 'text-white'
                }`}
              >
                {formatDate(membership.endDate)}
              </p>
              <span className="text-[10px] text-slate-500 block">Subscription term end</span>
            </div>

            {/* Days Remaining */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Days Remaining:
              </span>
              <p
                className={`text-2xl font-black ${
                  daysRemaining <= 7 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {daysRemaining}
              </p>
              <span className="text-[10px] text-slate-500 block">
                {isExpired ? 'Membership term ended' : 'Active days unlocked'}
              </span>
            </div>
          </div>

          {/* Benefits Section */}
          <div className="p-6 sm:p-8 border-b border-slate-800/80 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Benefits:
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {displayBenefits.map((benefit, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/50 border border-slate-800 text-xs sm:text-sm font-semibold text-slate-200"
                >
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-3 bg-slate-900/90">
            <Link to="/member/payments" className="w-full sm:w-auto">
              <Button
                variant="primary"
                icon={RefreshCw}
                className="w-full justify-center shadow-lg shadow-primary-500/20"
              >
                Renew Membership
              </Button>
            </Link>

            <Button
              variant="secondary"
              icon={downloading ? Loader2 : Download}
              loading={downloading}
              onClick={handleDownloadLatestReceipt}
              className="w-full sm:w-auto justify-center"
            >
              Download Receipt
            </Button>

            <Link to="/member/payments" className="w-full sm:w-auto">
              <Button
                variant="outlineMuted"
                icon={History}
                className="w-full justify-center"
              >
                Payment History
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* FITCORE ONBOARDING Progress Tracker (Derived from real DB data) */}
      {plan && isActive && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary-500 block">
                Post-Membership Setup
              </span>
              <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">
                FITCORE ONBOARDING
              </h2>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 w-fit">
              {onboarding?.isComplete ? 'Onboarding Complete' : 'Setup In Progress'}
            </span>
          </div>

          {/* Visual Step Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {/* Step 1: Membership */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-center space-y-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto text-xs font-bold shadow-sm">
                ✓
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-900 dark:text-white block">
                  Membership
                </span>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  Active
                </span>
              </div>
            </div>

            {/* Step 2: Trainer Assignment */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-center space-y-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto text-xs font-bold shadow-sm ${
                  onboarding?.trainerStatus === 'assigned'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-amber-500 text-white animate-pulse'
                }`}
              >
                {onboarding?.trainerStatus === 'assigned' ? '✓' : '⏳'}
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-900 dark:text-white block">
                  Trainer
                </span>
                <span
                  className={`text-[10px] font-semibold ${
                    onboarding?.trainerStatus === 'assigned'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {onboarding?.trainerStatus === 'assigned'
                    ? onboarding.trainerName
                    : 'Assignment Pending'}
                </span>
              </div>
            </div>

            {/* Step 3: Workout Setup */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-center space-y-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto text-xs font-bold shadow-sm ${
                  onboarding?.hasWorkout
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                }`}
              >
                {onboarding?.hasWorkout ? '✓' : '○'}
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-900 dark:text-white block">
                  Workout Plan
                </span>
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                  {onboarding?.hasWorkout
                    ? 'Active'
                    : onboarding?.trainerStatus === 'assigned'
                    ? 'Pending'
                    : 'Waiting for Trainer'}
                </span>
              </div>
            </div>

            {/* Step 4: Diet Setup */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-center space-y-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto text-xs font-bold shadow-sm ${
                  onboarding?.hasDiet
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                }`}
              >
                {onboarding?.hasDiet ? '✓' : '○'}
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-900 dark:text-white block">
                  Diet Plan
                </span>
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                  {onboarding?.hasDiet
                    ? 'Active'
                    : onboarding?.trainerStatus === 'assigned'
                    ? 'Pending'
                    : 'Waiting for Trainer'}
                </span>
              </div>
            </div>

            {/* Step 5: Ready to Train */}
            <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-center space-y-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto text-xs font-bold shadow-sm ${
                  onboarding?.isComplete
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                }`}
              >
                {onboarding?.isComplete ? '✓' : '○'}
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-900 dark:text-white block">
                  Ready to Train
                </span>
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                  {onboarding?.isComplete ? 'All Clear' : 'In Progress'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyMembership;
