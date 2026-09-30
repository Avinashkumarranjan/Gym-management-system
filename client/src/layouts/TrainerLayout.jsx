import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import TrainerSidebar from '../components/trainer/TrainerSidebar';
import TrainerTopbar from '../components/trainer/TrainerTopbar';
import ScrollToTop from '../components/common/ScrollToTop';

const TrainerLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/trainer/dashboard' || path === '/trainer') return 'Coach Operations Center';
    if (path === '/trainer/members') return 'Assigned Athletes';
    if (path.startsWith('/trainer/members/')) return 'Athlete Performance Record';
    if (path === '/trainer/profile') return 'Coach Credentials & Shift';
    return 'Coach Portal';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors">
      <ScrollToTop />

      {/* Sidebar */}
      <TrainerSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TrainerTopbar
          pageTitle={getPageTitle()}
          onOpenSidebar={() => setSidebarOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default TrainerLayout;
