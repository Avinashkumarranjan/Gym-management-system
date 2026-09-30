import React from 'react';
import { Check, Sparkles } from 'lucide-react';
import SectionHeading from '../common/SectionHeading';
import Button from '../common/Button';

const plans = [
  {
    name: 'Monthly',
    price: '₹1,499',
    period: '1 Month',
    popular: false,
    description: 'Great for short-term fitness goals and flexible schedules.',
    benefits: [
      'Full Gym & Equipment Access',
      'General Trainer Guidance',
      'Standard Workout Plan',
      'Basic Progress Tracking',
      'Locker Room Access',
    ],
  },
  {
    name: 'Quarterly',
    price: '₹3,999',
    period: '3 Months',
    popular: false,
    description: 'Perfect for committed athletes aiming for sustainable body recomposition.',
    benefits: [
      'Full Gym & Equipment Access',
      'Assigned Trainer Guidance',
      'Customized Workout Plan',
      'Detailed Progress Tracking',
      '1 Complimentary Body Composition Scan',
    ],
  },
  {
    name: 'Annual',
    price: '₹11,999',
    period: '12 Months',
    popular: true,
    description: 'Best overall value for relentless athletes committed to transformation.',
    benefits: [
      'Unlimited All-Hours Gym Access',
      'Priority Trainer Guidance & Consults',
      'Advanced Workout & Periodization Plan',
      'Complete Progress & Analytics Tracking',
      'Diet & Nutrition Strategy Included',
      'Free FitCore Performance Kit',
    ],
  },
];

const MembershipPreview = () => {
  return (
    <section className="py-16 sm:py-24 bg-white dark:bg-slate-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Membership Plans"
          title="Invest in Your Physical Excellence"
          description="Transparent, flexible pricing designed to match your training intensity. No hidden joining fees."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`relative rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 ${
                plan.popular
                  ? 'bg-slate-900 text-white dark:bg-slate-800 border-2 border-primary-500 shadow-2xl scale-[1.02] ring-4 ring-primary-500/10'
                  : 'bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 hover:shadow-lg'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary-500 text-white text-xs font-black tracking-wider uppercase flex items-center gap-1.5 shadow-md">
                  <Sparkles className="w-3.5 h-3.5" /> Most Popular
                </div>
              )}

              <div>
                <div className="flex justify-between items-baseline mb-2">
                  <h3 className="text-xl font-black">{plan.name}</h3>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    plan.popular ? 'bg-primary-500/20 text-primary-400' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    {plan.period}
                  </span>
                </div>

                <p className={`text-xs mb-6 ${plan.popular ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
                  {plan.description}
                </p>

                <div className="mb-6 flex items-baseline gap-1">
                  <span className="text-4xl font-black tracking-tight">{plan.price}</span>
                  <span className={`text-xs font-medium ${plan.popular ? 'text-slate-400' : 'text-slate-500'}`}>
                    /{plan.period}
                  </span>
                </div>

                {/* Benefits */}
                <div className="space-y-3 pt-4 border-t border-slate-200/50 dark:border-slate-800">
                  <p className="text-xs font-bold uppercase tracking-wider text-primary-500">
                    What's included:
                  </p>
                  <ul className="space-y-2.5 text-sm">
                    {plan.benefits.map((benefit, bIdx) => (
                      <li key={bIdx} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-primary-500 shrink-0 mt-0.5" />
                        <span className={plan.popular ? 'text-slate-200' : 'text-slate-600 dark:text-slate-300'}>
                          {benefit}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-8">
                <Button
                  to="/membership"
                  variant={plan.popular ? 'primary' : 'outline'}
                  className="w-full justify-center"
                >
                  Choose Plan
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MembershipPreview;
