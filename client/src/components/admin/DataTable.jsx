import React from 'react';
import { Inbox, Loader2 } from 'lucide-react';

const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'No records found.',
  className = '',
  children,
}) => {
  if (loading) {
    return (
      <div className="w-full py-20 flex flex-col items-center justify-center space-y-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        <p className="text-xs uppercase font-bold tracking-wider text-slate-400">
          Loading Data...
        </p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center space-y-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center px-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
          <Inbox className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`px-5 py-4 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
            {children}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
