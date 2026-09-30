import React from 'react';

const StatCard = ({
  icon: Icon,
  title,
  value,
  detail,
  trend,
  color = 'orange',
  className = '',
}) => {
  const colorMap = {
    orange: 'bg-primary-500/10 text-primary-500 border-primary-500/20',
    blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    purple: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    amber: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  };

  const selectedColor = colorMap[color] || colorMap.orange;

  return (
    <div
      className={`p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </span>
        {Icon && (
          <div className={`p-2.5 rounded-xl border ${selectedColor}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between">
        <div className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          {value !== undefined && value !== null ? value : '—'}
        </div>
        {trend && (
          <span className="text-xs font-bold text-emerald-500 flex items-center">
            {trend}
          </span>
        )}
      </div>

      {detail && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {detail}
        </p>
      )}
    </div>
  );
};

export default StatCard;
