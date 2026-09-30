import React from 'react';
import { Home, ArrowLeft } from 'lucide-react';
import Button from '../components/common/Button';

const NotFound = () => {
  return (
    <div className="py-20 sm:py-32 flex items-center justify-center">
      <div className="max-w-md mx-auto px-4 text-center space-y-6">
        <div className="inline-flex p-4 rounded-3xl bg-primary-100 dark:bg-primary-950/80 text-primary-500 font-black text-6xl tracking-tight">
          404
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Page Not Found
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            The page you are looking for doesn't exist, has been removed, or is undergoing scheduled training.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button to="/" variant="primary" icon={Home} iconPosition="left">
            Back to Home
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

export default NotFound;
