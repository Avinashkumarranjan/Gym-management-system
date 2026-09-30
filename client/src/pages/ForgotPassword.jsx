import React from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, ArrowLeft, Mail, Phone } from 'lucide-react';
import Button from '../components/common/Button';

const ForgotPassword = () => {
  return (
    <div className="py-16 sm:py-24 flex items-center justify-center">
      <div className="w-full max-w-md mx-auto px-4">
        <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 text-center">
          <div className="inline-flex p-4 rounded-2xl bg-primary-100 dark:bg-primary-950 text-primary-500">
            <KeyRound className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              Password Recovery
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Automated email reset dispatch will be enabled in upcoming releases. If you need immediate account recovery, please reach out to the FitCore front desk or support desk.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-left text-xs space-y-2.5">
            <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
              <Mail className="w-4 h-4 text-primary-500 shrink-0" />
              <span>contact@fitcoregym.com</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
              <Phone className="w-4 h-4 text-primary-500 shrink-0" />
              <span>+91 (120) 489-3200</span>
            </div>
          </div>

          <div className="pt-2">
            <Button
              to="/login"
              variant="outline"
              className="w-full justify-center"
              icon={ArrowLeft}
              iconPosition="left"
            >
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
