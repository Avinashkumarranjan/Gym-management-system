import React from 'react';
import { ArrowRight, Flame } from 'lucide-react';
import Button from '../common/Button';

const CTA = () => {
  return (
    <section className="relative overflow-hidden py-20 bg-slate-900 dark:bg-slate-950 text-white">
      {/* Decorative background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary-500/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-500/20 border border-primary-500/30 text-primary-400 text-xs font-bold uppercase tracking-wider">
          <Flame className="w-4 h-4 text-primary-500" /> Start Today
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
          Your Transformation Starts Today
        </h2>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Join FitCore and take control of your fitness journey with world-class facilities, personalized coaching, and an inspiring fitness community.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            to="/register"
            variant="primary"
            size="lg"
            icon={ArrowRight}
            iconPosition="right"
            className="w-full sm:w-auto shadow-lg shadow-primary-500/25"
          >
            Become a Member
          </Button>
          <Button
            to="/contact"
            variant="outline"
            size="lg"
            className="w-full sm:w-auto text-white border-slate-700 hover:border-slate-500 hover:bg-slate-800"
          >
            Schedule a Visit
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CTA;
