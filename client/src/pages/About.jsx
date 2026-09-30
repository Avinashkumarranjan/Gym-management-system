import React from 'react';
import { Target, HeartHandshake, Shield, Sparkles, Trophy, Users, Award, Dumbbell } from 'lucide-react';
import SectionHeading from '../components/common/SectionHeading';
import Button from '../components/common/Button';

const coreValues = [
  {
    icon: Trophy,
    title: 'Relentless Excellence',
    desc: 'We uphold the highest benchmarks in training technique, facility sanitation, and scientific programming.',
  },
  {
    icon: Target,
    title: 'Goal Accountability',
    desc: 'Your goals are tracked, measured, and actively refined so real, tangible transformation is achieved.',
  },
  {
    icon: HeartHandshake,
    title: 'Inclusive Community',
    desc: 'A supportive, ego-free fitness culture that celebrates personal bests for both beginners and seasoned athletes.',
  },
  {
    icon: Shield,
    title: 'Science & Safety First',
    desc: 'Movement biomechanics and injury prevention guide every single program and equipment selection.',
  },
];

const whyChooseUs = [
  'Over 15,000 sq. ft. of elite strength, Olympic lifting, and functional turf spaces.',
  'Dedicated sports recovery zone featuring hydro-therapy and infrared saunas.',
  'Internationally certified coaches with continuous sports science credentialing.',
  'Integrated mobile-friendly tracking tools for attendance, splits, and nutrition.',
];

const About = () => {
  return (
    <div className="py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        {/* Hero Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary-500 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-950/50 border border-primary-200 dark:border-primary-900">
            About FitCore
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Forging Stronger Bodies, Sharper Minds &amp; Unbreakable Habits
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 font-normal leading-relaxed">
            Founded with a conviction that fitness is not a seasonal trend but a lifelong pursuit of human potential.
          </p>
        </div>

        {/* Our Story & Mission */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-950 text-primary-500 flex items-center justify-center font-bold">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Our Story</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              FitCore began in 2021 as a collective of strength coaches and sports nutritionists tired of overcrowded commercial gyms lacking personal accountability. We envisioned an environment where state-of-the-art biomechanical machinery, high-performance coaching, and intelligent tracking come together seamlessly.
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Today, FitCore has transformed into a high-energy community center where hundreds of athletes break barriers, rehabilitate injuries, and cultivate resilient mindsets every single day.
            </p>
          </div>

          <div className="p-8 sm:p-10 rounded-3xl bg-slate-900 text-white dark:bg-slate-900 border border-slate-800 shadow-xl space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary-500/20 rounded-full blur-2xl pointer-events-none" />
            <div className="w-12 h-12 rounded-xl bg-primary-500/20 border border-primary-500/30 text-primary-400 flex items-center justify-center font-bold">
              <Target className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-white">Our Mission</h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              To democratize evidence-based physical training by combining top-tier coaching with intelligent management technology.
            </p>
            <p className="text-sm text-slate-300 leading-relaxed">
              We empower every member with clear workout progression, nutritional literacy, and relentless encouragement, ensuring no effort is wasted.
            </p>
            <div className="pt-2">
              <Button to="/membership" variant="primary" size="sm">
                Join Our Mission
              </Button>
            </div>
          </div>
        </div>

        {/* Why FitCore */}
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          <div className="max-w-3xl mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Why FitCore Stands Apart
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Unlike cookie-cutter gyms, we invest in every detail of your athlete experience.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {whyChooseUs.map((point, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                <span className="w-6 h-6 rounded-full bg-primary-500/10 text-primary-500 flex items-center justify-center shrink-0 text-xs font-black">
                  ✓
                </span>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {point}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Core Values */}
        <div>
          <SectionHeading
            eyebrow="Our Foundation"
            title="Core Values That Drive Us"
            description="Our fundamental pillars guide every interaction, workout program, and coaching decision."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {coreValues.map((val, idx) => {
              const Icon = val.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-primary-500/50 hover:shadow-md transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-950 text-primary-500 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                    {val.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {val.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Small Statistics Section */}
        <div className="rounded-3xl bg-slate-900 text-white p-8 sm:p-10 border border-slate-800">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <Users className="w-6 h-6 text-primary-500 mx-auto mb-2" />
              <div className="text-2xl sm:text-3xl font-black">500+</div>
              <div className="text-xs text-slate-400 mt-1">Active Athletes</div>
            </div>
            <div>
              <Award className="w-6 h-6 text-primary-500 mx-auto mb-2" />
              <div className="text-2xl sm:text-3xl font-black">20+</div>
              <div className="text-xs text-slate-400 mt-1">Master Coaches</div>
            </div>
            <div>
              <Dumbbell className="w-6 h-6 text-primary-500 mx-auto mb-2" />
              <div className="text-2xl sm:text-3xl font-black">15,000+</div>
              <div className="text-xs text-slate-400 mt-1">Sq. Ft. Facility</div>
            </div>
            <div>
              <Trophy className="w-6 h-6 text-primary-500 mx-auto mb-2" />
              <div className="text-2xl sm:text-3xl font-black">98%</div>
              <div className="text-xs text-slate-400 mt-1">Goal Success Rate</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
