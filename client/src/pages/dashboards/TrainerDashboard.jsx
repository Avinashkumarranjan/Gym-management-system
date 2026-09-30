import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Award, Users, Calendar, Dumbbell } from 'lucide-react';
import Button from '../../components/common/Button';

const TrainerDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="py-12 sm:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Welcome Banner */}
        <div className="p-8 sm:p-10 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider border border-amber-500/30">
                <Award className="w-3.5 h-3.5" /> Trainer Portal
              </span>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                Welcome, Coach {user?.name || 'Trainer'}!
              </h1>
              <p className="text-sm text-slate-300 max-w-xl">
                Your authenticated trainer session is active. Access your athlete rosters, schedule appointments, and manage workout routines.
              </p>
            </div>
            <div className="shrink-0 p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-center">
              <p className="text-xs text-slate-400 uppercase font-semibold">Role Tier</p>
              <p className="text-sm font-bold text-amber-400 mt-0.5">Certified Trainer</p>
            </div>
          </div>
        </div>

        {/* Informational Placeholder */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-3 text-amber-500">
            <Users className="w-6 h-6" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Trainer Workspace
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Full trainer management features (member roster management, session scheduling, workout assigner, and client progress analytics) will be implemented in upcoming phases.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Button to="/trainers" variant="outline" size="sm">
              View Public Trainer Roster
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainerDashboard;
