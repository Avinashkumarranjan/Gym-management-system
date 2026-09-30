import React from 'react';
import { Scale, Flame, ArrowRight } from 'lucide-react';
import SectionHeading from '../common/SectionHeading';
import Button from '../common/Button';

const tools = [
  {
    icon: Scale,
    title: 'BMI Calculator',
    description:
      'Evaluate your Body Mass Index based on current height and weight metrics to identify optimal weight ranges and health markers.',
    badge: 'Quick Assessment',
  },
  {
    icon: Flame,
    title: 'Calorie Calculator',
    description:
      'Estimate your Basal Metabolic Rate (BMR) and Total Daily Energy Expenditure (TDEE) based on your activity level and fitness targets.',
    badge: 'Nutrition Planner',
  },
];

const FitnessToolsPreview = () => {
  return (
    <section className="py-16 sm:py-24 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Interactive Utilities"
          title="Fitness Tools"
          description="Take the guesswork out of nutrition and body composition with our upcoming fitness diagnostic calculators."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {tools.map((tool, idx) => {
            const Icon = tool.icon;
            return (
              <div
                key={idx}
                className="group p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-primary-500/50 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-950/80 text-primary-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className="w-7 h-7" />
                    </div>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {tool.badge}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-primary-500 transition-colors">
                    {tool.title}
                  </h3>

                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                    {tool.description}
                  </p>
                </div>

                <div>
                  <Button
                    to="/calculators"
                    variant="outline"
                    className="w-full justify-center group-hover:bg-primary-500 group-hover:text-white"
                    icon={ArrowRight}
                    iconPosition="right"
                  >
                    Open Calculator
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FitnessToolsPreview;
