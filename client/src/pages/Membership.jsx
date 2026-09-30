import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Sparkles, HelpCircle, Loader2, CheckCircle2 } from 'lucide-react';
import SectionHeading from '../components/common/SectionHeading';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import paymentService from '../services/paymentService';

// Fallback plans if network/database is temporarily unavailable
const defaultFallbackPlans = [
  {
    name: 'Monthly',
    price: 1499,
    durationMonths: 1,
    description: 'Ideal for travelers, short stays, or test runs.',
    benefits: [
      'Full Gym & Free Weights Access',
      'General Floor Trainer Assistance',
      'Basic Mobile App Workout Tracker',
      'Locker & Shower Amenities',
      'Free High-Speed Wi-Fi',
    ],
  },
  {
    name: 'Quarterly',
    price: 3999,
    durationMonths: 3,
    description: 'The standard choice for developing consistent exercise habits.',
    benefits: [
      'Full Gym & Free Weights Access',
      'Dedicated Trainer Consultation',
      'Customized 12-Week Workout Plan',
      'InBody Composition Analysis (1 Scan)',
      'Locker & Shower Amenities',
      'Access to Weekend Group Classes',
    ],
  },
  {
    name: 'Half-Yearly',
    price: 7499,
    durationMonths: 6,
    description: 'Substantial savings for intermediate to advanced strength training.',
    benefits: [
      'Full Gym Access Across All Hours',
      'Bi-Weekly Trainer Progression Review',
      'Personalized Workout & Split Design',
      'InBody Composition Analysis (3 Scans)',
      'Nutritional Guidelines & Macro Targets',
      'Complimentary Guest Pass (1 per month)',
      'Steam & Sauna Room Access',
    ],
  },
  {
    name: 'Annual',
    price: 11999,
    durationMonths: 12,
    popular: true,
    description: 'Ultimate value for dedicated fitness transformations and athletes.',
    benefits: [
      'All-Access VIP Pass 365 Days',
      'Full Personalized Training Strategy',
      'Dedicated Senior Coach Consultation',
      'Monthly InBody Scans & Body Diagnostics',
      'Tailored Diet & Supplement Protocol',
      'Unlimited Steam, Sauna & Recovery Lounge',
      'FitCore Athlete Welcome Kit & Shaker',
      '2 Free Guest Passes Every Month',
    ],
  },
];

const faqs = [
  {
    q: 'Can I freeze or pause my membership?',
    a: 'Yes, Quarterly, Half-Yearly, and Annual plans can be frozen up to 30 to 60 days with advance notice.',
  },
  {
    q: 'Are there any hidden admission or joining fees?',
    a: 'None at all. All fees quoted above are completely inclusive of gym taxes, basic orientation, and onboarding.',
  },
  {
    q: 'Can I upgrade my plan later?',
    a: 'Absolutely. You can easily upgrade from a Monthly to Quarterly or Annual plan at any time through our member payment portal.',
  },
];

import memberService from '../services/memberService';

const Membership = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [plans, setPlans] = useState([]);
  const [currentMembership, setCurrentMembership] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlansAndMembership = async () => {
      try {
        setLoading(true);
        const [plansRes, memberRes] = await Promise.allSettled([
          paymentService.getPlans(),
          user?.role === 'member' ? memberService.getMembership() : Promise.resolve(null),
        ]);

        if (plansRes.status === 'fulfilled' && plansRes.value?.success && plansRes.value.data?.length > 0) {
          setPlans(plansRes.value.data);
        } else {
          setPlans(defaultFallbackPlans);
        }

        if (memberRes.status === 'fulfilled' && memberRes.value?.success) {
          setCurrentMembership(memberRes.value.membership || null);
        }
      } catch (err) {
        console.warn('Could not load database plans, using verified fallbacks:', err.message);
        setPlans(defaultFallbackPlans);
      } finally {
        setLoading(false);
      }
    };

    fetchPlansAndMembership();
  }, [user]);

  const isUserCurrentPlan = (plan) => {
    if (!currentMembership || currentMembership.status !== 'active') return false;
    const activePlan = currentMembership.plan;
    if (!activePlan) return false;
    if (activePlan._id && plan._id && activePlan._id.toString() === plan._id.toString()) return true;
    if (activePlan.name && plan.name && activePlan.name.trim().toLowerCase() === plan.name.trim().toLowerCase()) return true;
    return false;
  };

  const handlePlanCTA = (plan) => {
    // Unauthenticated: Redirect to login or register
    if (!user) {
      navigate(`/login?redirect=/member/payments${plan._id ? `&plan=${plan._id}` : ''}`);
      return;
    }

    // Authenticated member
    if (user.role === 'member') {
      if (isUserCurrentPlan(plan)) {
        navigate('/member/membership');
        return;
      }
      navigate(`/member/payments${plan._id ? `?plan=${plan._id}` : ''}`);
      return;
    }

    // Admin: Redirect to admin membership management
    if (user.role === 'admin') {
      navigate('/admin/membership-plans');
      return;
    }

    // Trainer: Redirect to trainer dashboard
    if (user.role === 'trainer') {
      navigate('/trainer/dashboard');
      return;
    }
  };

  const getButtonText = (plan) => {
    if (!user) return 'Enroll & Checkout';
    if (user.role === 'member') {
      if (isUserCurrentPlan(plan)) return 'View Membership';
      if (currentMembership?.status === 'active') return 'Switch / Renew Plan';
      return 'Enroll & Checkout';
    }
    if (user.role === 'admin') return 'Manage Plan (Admin)';
    return 'Staff Portal';
  };

  return (
    <div className="py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary-500 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-950/50 border border-primary-200 dark:border-primary-900">
            Clear &amp; Flexible Rates
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Membership Packages
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 font-normal leading-relaxed">
            Choose a plan that fits your workout rhythm. From month-to-month agility to full year commitment, we ensure every rupee translates into performance.
          </p>
        </div>

        {/* 4 Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-96 rounded-3xl bg-slate-100 dark:bg-slate-800/60 animate-pulse border border-slate-200 dark:border-slate-800"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {plans.map((plan, idx) => {
              const isAnnual = plan.durationMonths === 12;
              const isPopular = plan.popular || isAnnual;
              const isCurrent = isUserCurrentPlan(plan);
              const durationLabel = `${plan.durationMonths} ${plan.durationMonths === 1 ? 'Month' : 'Months'}`;

              return (
                <div
                  key={plan._id || idx}
                  className={`relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 ${
                    isCurrent
                      ? 'bg-slate-900 text-white dark:bg-slate-800 border-2 border-emerald-500 shadow-2xl scale-[1.02] ring-4 ring-emerald-500/10'
                      : isPopular
                      ? 'bg-slate-900 text-white dark:bg-slate-800 border-2 border-primary-500 shadow-2xl scale-[1.02] ring-4 ring-primary-500/10'
                      : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 hover:shadow-lg'
                  }`}
                >
                  {isCurrent ? (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black tracking-wider uppercase flex items-center gap-1 shadow-md">
                      <CheckCircle2 className="w-3 h-3" /> Current Plan
                    </div>
                  ) : isPopular ? (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary-500 text-white text-[10px] font-black tracking-wider uppercase flex items-center gap-1 shadow-md">
                      <Sparkles className="w-3 h-3" /> Most Popular
                    </div>
                  ) : null}

                  <div>
                    <div className="flex justify-between items-baseline mb-2">
                      <h3 className="text-lg font-black">{plan.name}</h3>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          isCurrent
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : isPopular
                            ? 'bg-primary-500/20 text-primary-400'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {durationLabel}
                      </span>
                    </div>

                    <p
                      className={`text-xs mb-5 ${
                        isCurrent || isPopular ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {plan.description || 'Full gym facility and locker access.'}
                    </p>

                    <div className="mb-6 flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-black tracking-tight">
                        ₹{Number(plan.price).toLocaleString()}
                      </span>
                      <span
                        className={`text-xs font-medium ${
                          isCurrent || isPopular ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        /{durationLabel}
                      </span>
                    </div>

                    {/* Benefits */}
                    <div className="space-y-2.5 pt-4 border-t border-slate-200/50 dark:border-slate-800">
                      <p className="text-xs font-bold uppercase tracking-wider text-primary-500">
                        Included Benefits:
                      </p>
                      <ul className="space-y-2 text-xs">
                        {plan.benefits && plan.benefits.length > 0 ? (
                          plan.benefits.map((benefit, bIdx) => (
                            <li key={bIdx} className="flex items-start gap-2">
                              <Check className="w-3.5 h-3.5 text-primary-500 shrink-0 mt-0.5" />
                              <span
                                className={
                                  isCurrent || isPopular
                                    ? 'text-slate-200'
                                    : 'text-slate-600 dark:text-slate-300'
                                }
                              >
                                {benefit}
                              </span>
                            </li>
                          ))
                        ) : (
                          <li className="text-slate-400">Gym floor access and workout track.</li>
                        )}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-6">
                    <Button
                      variant={isCurrent ? 'primary' : isPopular ? 'primary' : 'outline'}
                      size="sm"
                      className={`w-full justify-center ${
                        isCurrent
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-none shadow-md'
                          : ''
                      }`}
                      onClick={() => handlePlanCTA(plan)}
                    >
                      {getButtonText(plan)}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* FAQs */}
        <div className="max-w-3xl mx-auto pt-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Have questions regarding membership rules and renewals?
            </p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                <div className="flex items-start gap-3">
                  <HelpCircle className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {faq.q}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Membership;
