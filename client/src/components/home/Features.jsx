import React from 'react';
import {
  UserCheck,
  ClipboardList,
  Apple,
  TrendingUp,
  CalendarCheck,
  Clock,
} from 'lucide-react';
import SectionHeading from '../common/SectionHeading';

const featuresData = [
  {
    icon: UserCheck,
    title: 'Personal Training',
    description:
      'One-on-one customized coaching with certified fitness experts focused on your biomechanics and individual milestones.',
  },
  {
    icon: ClipboardList,
    title: 'Workout Plans',
    description:
      'Scientifically designed split routines for hypertrophy, strength conditioning, functional endurance, and mobility.',
  },
  {
    icon: Apple,
    title: 'Diet & Nutrition',
    description:
      'Macro-tailored nutrition guidelines and dietary recommendations aligned to fuel your workouts and recovery.',
  },
  {
    icon: TrendingUp,
    title: 'Progress Tracking',
    description:
      'Comprehensive metrics for strength progression, body composition, volume load, and fitness milestones.',
  },
  {
    icon: CalendarCheck,
    title: 'Attendance Tracking',
    description:
      'Seamless digital check-ins and session logging to keep your workout consistency transparent and accountable.',
  },
  {
    icon: Clock,
    title: 'Trainer Scheduling',
    description:
      'Easy booking system to coordinate your training slots, consultations, and workout appointments without conflicts.',
  },
];

const Features = () => {
  return (
    <section className="py-16 sm:py-24 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Key Offerings"
          title="Everything You Need to Reach Your Goals"
          description="FitCore integrates modern sports science with intelligent management tools to support every phase of your transformation."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {featuresData.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="group relative p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-primary-500/50 dark:hover:border-primary-500/50 hover:shadow-xl transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-950/80 text-primary-500 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-primary-500 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
