import React from 'react';

const StatusBadge = ({ status, className = '' }) => {
  const norm = String(status || '').toLowerCase();

  let styles = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700';

  if (norm === 'active' || norm === 'true') {
    styles = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60';
  } else if (norm === 'inactive' || norm === 'false') {
    styles = 'bg-slate-100 text-slate-600 dark:bg-slate-800/80 dark:text-slate-400 border-slate-300 dark:border-slate-700';
  } else if (norm === 'expired') {
    styles = 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border-red-200 dark:border-red-800/60';
  } else if (norm === 'pending') {
    styles = 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800/60';
  }

  const label =
    norm === 'true'
      ? 'Active'
      : norm === 'false'
      ? 'Inactive'
      : norm.charAt(0).toUpperCase() + norm.slice(1);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles} ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          norm === 'active' || norm === 'true'
            ? 'bg-emerald-500'
            : norm === 'expired'
            ? 'bg-red-500'
            : norm === 'pending'
            ? 'bg-amber-500'
            : 'bg-slate-400'
        }`}
      />
      {label}
    </span>
  );
};

export default StatusBadge;
