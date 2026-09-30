import React from 'react';
import { ArrowRight, Award, ShieldCheck } from 'lucide-react';
import SectionHeading from '../common/SectionHeading';
import Button from '../common/Button';

const trainersData = [
  {
    name: 'Rahul Sharma',
    specialization: 'Strength & Conditioning',
    experience: '5 Years Experience',
    initials: 'RS',
    color: 'from-blue-600 to-indigo-800',
    bio: 'Specialist in progressive overload, powerlifting techniques, and athletic speed mechanics.',
  },
  {
    name: 'Priya Mehta',
    specialization: 'Yoga & Mobility',
    experience: '4 Years Experience',
    initials: 'PM',
    color: 'from-emerald-600 to-teal-800',
    bio: 'Focuses on myofascial release, flexibility, postural restoration, and breathwork control.',
  },
  {
    name: 'Arjun Verma',
    specialization: 'Fat Loss & Functional Training',
    experience: '6 Years Experience',
    initials: 'AV',
    color: 'from-amber-600 to-orange-800',
    bio: 'High energy metabolic conditioning, kettlebell circuits, and sustainable fat-loss protocols.',
  },
];

const TrainersPreview = () => {
  return (
    <section className="py-16 sm:py-24 bg-white dark:bg-slate-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Expert Guidance"
          title="Meet Our Head Trainers"
          description="Learn from certified sports science coaches dedicated to elevating your training discipline and injury prevention."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {trainersData.map((trainer, idx) => (
            <div
              key={idx}
              className="group overflow-hidden rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-primary-500/50 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              {/* Trainer Graphic Header */}
              <div className={`h-48 bg-gradient-to-tr ${trainer.color} p-6 relative flex items-end justify-between`}>
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white text-2xl font-black shadow-inner">
                  {trainer.initials}
                </div>
                <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white text-xs font-semibold flex items-center gap-1.5 border border-white/20">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary-400" /> Certified Coach
                </span>
              </div>

              {/* Trainer Body */}
              <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-primary-500 transition-colors">
                    {trainer.name}
                  </h3>
                  <p className="text-sm font-semibold text-primary-500 mt-1">
                    {trainer.specialization}
                  </p>

                  <div className="flex items-center gap-2 mt-3 text-xs text-slate-500 dark:text-slate-400">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span>{trainer.experience}</span>
                  </div>

                  <p className="mt-4 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {trainer.bio}
                  </p>
                </div>

                <div className="pt-6">
                  <Button
                    to="/trainers"
                    variant="outlineMuted"
                    className="w-full justify-center group-hover:border-primary-500 group-hover:text-primary-500"
                    icon={ArrowRight}
                    iconPosition="right"
                  >
                    View Profile
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button to="/trainers" variant="outline" size="md">
            Explore All Trainers
          </Button>
        </div>
      </div>
    </section>
  );
};

export default TrainersPreview;
