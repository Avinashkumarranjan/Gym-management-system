import React from 'react';
import { ArrowRight, Flame, Trophy, Activity, CheckCircle2 } from 'lucide-react';
import Button from '../common/Button';

const Hero = () => {
  return (
    <section className="relative overflow-hidden pt-8 pb-16 lg:py-24 bg-gradient-to-b from-white via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900/60 dark:to-slate-950">
      {/* Background subtle radial accents */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-primary-500/10 dark:bg-primary-500/15 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-100/80 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800/60">
              <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                TRAIN • TRACK • TRANSFORM
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">
              Build Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 via-orange-500 to-amber-500">
                Strongest Self
              </span>
            </h1>

            {/* Supporting Text */}
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
              A smarter way to manage your fitness journey with personalized workouts, nutrition guidance, expert trainers and progress tracking.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Button
                to="/register"
                variant="primary"
                size="lg"
                icon={ArrowRight}
                iconPosition="right"
                className="w-full sm:w-auto"
              >
                Join Now
              </Button>
              <Button
                to="/membership"
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
              >
                Explore Plans
              </Button>
            </div>

            {/* Social Proof Badges */}
            <div className="pt-8 border-t border-slate-200 dark:border-slate-800/80 grid grid-cols-3 gap-4 max-w-lg mx-auto lg:mx-0 text-center lg:text-left">
              <div>
                <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">500+</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Active Members</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">20+</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Certified Trainers</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">15+</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Training Programs</p>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Graphic */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="relative w-full max-w-md">
              {/* Main Card Frame */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 p-6 sm:p-8 text-white shadow-2xl border border-slate-800">
                {/* Background decorative glow */}
                <div className="absolute top-0 right-0 w-44 h-44 bg-primary-500/20 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary-400 bg-primary-950/80 px-2.5 py-1 rounded-full border border-primary-900/60">
                    Live Session
                  </span>
                </div>

                {/* Athlete Artwork SVG Frame */}
                <div className="relative h-64 rounded-2xl bg-gradient-to-b from-slate-800/80 to-slate-900 flex items-center justify-center p-4 border border-slate-800">
                  <div className="text-center space-y-3">
                    <div className="inline-flex p-4 rounded-2xl bg-primary-500/20 border border-primary-500/30 text-primary-400 mb-1">
                      <Trophy className="w-12 h-12" />
                    </div>
                    <h3 className="text-xl font-bold text-white tracking-wide">
                      HYBRID STRENGTH &amp; HIIT
                    </h3>
                    <p className="text-xs text-slate-400 max-w-xs">
                      High intensity functional resistance protocol supervised by FitCore Masters.
                    </p>
                  </div>
                </div>

                {/* Floating Metric 1 */}
                <div className="mt-4 p-3.5 rounded-xl bg-slate-800/70 border border-slate-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-500/20 text-orange-400">
                      <Flame className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Active Burn</p>
                      <p className="text-sm font-bold text-white">680 kcal / 45 min</p>
                    </div>
                  </div>
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Target Met
                  </span>
                </div>

                {/* Floating Metric 2 */}
                <div className="mt-2.5 p-3.5 rounded-xl bg-slate-800/70 border border-slate-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary-500/20 text-primary-400">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Heart Rate Zone</p>
                      <p className="text-sm font-bold text-white">142 bpm (Aerobic)</p>
                    </div>
                  </div>
                  <span className="text-xs text-primary-400 font-semibold">Optimal</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
