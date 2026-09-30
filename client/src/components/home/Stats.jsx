import React from 'react';
import { Users, Award, Dumbbell, Star } from 'lucide-react';

const statsData = [
  {
    icon: Users,
    value: '500+',
    label: 'Active Members',
    detail: 'Growing vibrant community',
  },
  {
    icon: Award,
    value: '20+',
    label: 'Certified Trainers',
    detail: 'Elite professional coaches',
  },
  {
    icon: Dumbbell,
    value: '15+',
    label: 'Training Programs',
    detail: 'Personalized fitness tracks',
  },
  {
    icon: Star,
    value: '4.9/5',
    label: 'Member Rating',
    detail: 'Based on 1,200+ reviews',
  },
];

const Stats = () => {
  return (
    <section className="py-12 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {statsData.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="group p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 hover:border-primary-500/50 dark:hover:border-primary-500/50 hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary-100 dark:bg-primary-950/80 text-primary-500 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                      {stat.value}
                    </h3>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {stat.label}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  {stat.detail}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Stats;
