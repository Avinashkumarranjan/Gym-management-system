import React from 'react';
import { Menu, Globe, User, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from '../common/ThemeToggle';
import { useAuth } from '../../context/AuthContext';

import NotificationBell from '../common/NotificationBell';

const MemberTopbar = ({ onOpenSidebar, pageTitle = 'Member Portal' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 h-20 w-full bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Left: Mobile hamburger & Page Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
            aria-label="Open sidebar"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {pageTitle}
            </h1>
          </div>
        </div>

        {/* Right: Public Site Link, Notification Bell, ThemeToggle & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="FitCore Public Home"
          >
            <Globe className="w-3.5 h-3.5 text-primary-500" />
            <span>Public Site</span>
          </Link>

          <NotificationBell />

          <ThemeToggle />

          <Link
            to="/member/profile"
            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-primary-500 text-white flex items-center justify-center font-bold text-xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'M'}
            </div>
            <span className="hidden md:inline-block text-xs font-bold text-slate-800 dark:text-slate-200 max-w-[120px] truncate">
              {user?.name || 'Athlete'}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default MemberTopbar;
