import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminTopbar from '../components/admin/AdminTopbar';
import ScrollToTop from '../components/common/ScrollToTop';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/admin/dashboard' || path === '/admin') return 'Admin Overview';
    if (path === '/admin/members/new') return 'Register New Member';
    if (path.startsWith('/admin/members/')) return 'Member Profile Details';
    if (path === '/admin/members') return 'Member Directory';
    if (path === '/admin/trainers/new') return 'Add Coach Account';
    if (path.startsWith('/admin/trainers/')) return 'Coach Profile Details';
    if (path === '/admin/trainers') return 'Coaching Staff';
    if (path === '/admin/membership-plans') return 'Membership Plans';
    if (path === '/admin/profile') return 'My Administrator Profile';
    return 'Admin Control Portal';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors">
      <ScrollToTop />

      {/* Sidebar */}
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopbar
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

export default AdminLayout;
