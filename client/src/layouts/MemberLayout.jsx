import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import MemberSidebar from '../components/member/MemberSidebar';
import MemberTopbar from '../components/member/MemberTopbar';
import ScrollToTop from '../components/common/ScrollToTop';

const MemberLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/member/dashboard' || path === '/member') return 'Athlete Dashboard';
    if (path === '/member/profile') return 'My Fitness Profile';
    if (path === '/member/membership') return 'My Membership Plan';
    if (path === '/member/trainer') return 'My Assigned Coach';
    return 'Member Portal';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors">
      <ScrollToTop />

      {/* Sidebar */}
      <MemberSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <MemberTopbar
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

export default MemberLayout;
