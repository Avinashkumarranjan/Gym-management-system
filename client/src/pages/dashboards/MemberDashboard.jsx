import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Dumbbell, Calendar, Activity, ArrowRight } from 'lucide-react';
import Button from '../../components/common/Button';

const MemberDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="py-12 sm:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Welcome Banner */}
        <div className="p-8 sm:p-10 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-500/20 text-primary-400 text-xs font-bold uppercase tracking-wider border border-primary-500/30">
                <User className="w-3.5 h-3.5" /> Member Portal
              </span>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                Welcome, {user?.name || 'Athlete'}!
              </h1>
              <p className="text-sm text-slate-300 max-w-xl">
                Your authenticated member session is active. You have full access to FitCore gym facilities and workout utilities.
              </p>
            </div>
            <div className="shrink-0 p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-center">
              <p className="text-xs text-slate-400 uppercase font-semibold">Account Status</p>
              <p className="text-sm font-bold text-emerald-400 mt-0.5">Active Member</p>
            </div>
          </div>
        </div>

        {/* Phase 2 Informational Note */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-3 text-primary-500">
            <Dumbbell className="w-6 h-6" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Member Workspace
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Full member dashboard features (personalized workout logging, attendance tracking, diet charts, and trainer bookings) will be unlocked in upcoming development phases.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Button to="/calculators" variant="outline" size="sm">
              Explore Fitness Calculators
            </Button>
            <Button to="/services" variant="outlineMuted" size="sm">
              Browse Training Programs
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberDashboard;
