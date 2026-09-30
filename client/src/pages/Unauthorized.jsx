import React from 'react';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';
import Button from '../components/common/Button';

const Unauthorized = () => {
  return (
    <div className="py-20 sm:py-32 flex items-center justify-center">
      <div className="max-w-md mx-auto px-4 text-center space-y-6">
        <div className="inline-flex p-4 rounded-3xl bg-red-100 dark:bg-red-950/80 text-red-500 shadow-inner">
          <ShieldAlert className="w-16 h-16" />
        </div>
        <div className="space-y-2">
          <span className="text-xs uppercase font-extrabold tracking-widest text-red-500">
            Error 403 • Forbidden
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Access Denied
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            You do not have the required permissions or role tier to view this protected FitCore resource.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button to="/" variant="primary" icon={Home} iconPosition="left">
            Return Home
          </Button>
          <Button
            type="button"
            variant="outlineMuted"
            icon={ArrowLeft}
            iconPosition="left"
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
