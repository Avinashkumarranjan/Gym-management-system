import React from 'react';

const MemberStatCard = ({
  icon: Icon,
  label,
  value,
  subtext,
  badge,
  badgeVariant = 'primary',
  color = 'primary',
}) => {
  const colorMap = {
    primary: 'bg-primary-500/10 text-primary-500 border-primary-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  };

  const badgeMap = {
    primary: 'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-950/60 dark:text-primary-300 dark:border-primary-800',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    amber: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    red: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800',
    slate: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all hover:shadow-md space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {label}
        </span>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colorMap[color] || colorMap.primary}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {value}
          </div>
          {badge && (
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${badgeMap[badgeVariant] || badgeMap.primary}`}>
              {badge}
            </span>
          )}
        </div>
        {subtext && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
};

export default MemberStatCard;
