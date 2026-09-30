import React from 'react';
import {
  UserCheck,
  Dumbbell,
  Flame,
  Zap,
  Flower2,
  Apple,
  Users2,
  LineChart,
  ArrowRight,
} from 'lucide-react';
import SectionHeading from '../components/common/SectionHeading';
import Button from '../components/common/Button';

const services = [
  {
    icon: UserCheck,
    title: 'Personal Training',
    tag: 'One-on-One',
    description:
      'Dedicated one-on-one sessions tailored specifically to your body mechanics, fitness level, and timeline with continuous form checks.',
    features: ['Custom split routine', 'Posture & form correction', 'Direct coach messaging'],
  },
  {
    icon: Dumbbell,
    title: 'Strength Training',
    tag: 'Performance',
    description:
      'Periodized compound lifting protocols utilizing Olympic barbells, power racks, and specialized strength machinery to build raw power.',
    features: ['Progressive overload tracking', 'Powerlifting techniques', 'RPE coaching'],
  },
  {
    icon: Flame,
    title: 'Weight Loss',
    tag: 'Metabolic',
    description:
      'High-energy metabolic circuits combined with sustainable caloric deficits to incinerate stubborn body fat while preserving lean muscle mass.',
    features: ['HIIT & cardio conditioning', 'Heart-rate monitoring', 'Weekly body scans'],
  },
  {
    icon: Dumbbell,
    title: 'Muscle Building',
    tag: 'Hypertrophy',
    description:
      'Targeted hypertrophy routines engineered to optimize muscle fiber recruitment, time-under-tension, and post-workout protein synthesis.',
    features: ['Hypertrophy splits', 'Volume autoregulation', 'Recovery management'],
  },
  {
    icon: Flower2,
    title: 'Yoga & Mobility',
    tag: 'Flexibility',
    description:
      'Deep restorative yoga flows, myofascial release, and joint mobility drills to enhance range of motion and prevent chronic injuries.',
    features: ['Joint decompression', 'Breathwork guidance', 'Injury rehabilitation'],
  },
  {
    icon: Apple,
    title: 'Diet & Nutrition',
    tag: 'Fueling',
    description:
      'Custom macronutrient breakdowns and flexible meal planning formulated by registered sports nutritionists to power your output.',
    features: ['Targeted calorie goals', 'Macro balance guides', 'Supplement advice'],
  },
  {
    icon: Users2,
    title: 'Group Classes',
    tag: 'Community',
    description:
      'High-octane, coach-led team workouts including Bootcamp, Functional Turf Conditioning, Spin, and Core Blast to keep motivation high.',
    features: ['Dynamic community vibe', 'Structured playlists', 'Scalable for all levels'],
  },
  {
    icon: LineChart,
    title: 'Progress Tracking',
    tag: 'Analytics',
    description:
      'Data-backed performance logging, strength benchmarks, and body measurements consolidated into actionable visual progress curves.',
    features: ['1RM strength history', 'Body fat & circumference logs', 'Attendance streak metrics'],
  },
];

const Services = () => {
  return (
    <div className="py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary-500 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-950/50 border border-primary-200 dark:border-primary-900">
            Comprehensive Programs
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            World-Class Fitness Services
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 font-normal leading-relaxed">
            Whether your goal is shattering personal lifting records, leaning down, or restoring physical balance, FitCore has a scientific program built for you.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, idx) => {
            const Icon = service.icon;
            return (
              <div
                key={idx}
                className="group p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-primary-500/50 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-950/80 text-primary-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {service.tag}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-primary-500 transition-colors">
                    {service.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                    {service.description}
                  </p>

                  <ul className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                    {service.features.map((feat, fIdx) => (
                      <li key={fIdx} className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6">
                  <Button
                    to={`/contact?service=${encodeURIComponent(service.title.toLowerCase().replace(/\s+/g, '-'))}`}
                    variant="outlineMuted"
                    size="sm"
                    className="w-full justify-center group-hover:border-primary-500 group-hover:text-primary-500"
                    icon={ArrowRight}
                    iconPosition="right"
                  >
                    Inquire Now
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Banner */}
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900 text-white border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-2xl font-bold">Unsure which program fits your goals?</h2>
            <p className="text-sm text-slate-400 max-w-xl">
              Schedule a complimentary 20-minute movement screen and fitness consultation with one of our master trainers.
            </p>
          </div>
          <Button to="/contact" variant="primary" size="lg" className="shrink-0">
            Book Free Assessment
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Services;
