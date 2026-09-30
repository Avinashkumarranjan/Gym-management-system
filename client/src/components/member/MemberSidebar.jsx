import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  User,
  CreditCard,
  Award,
  LogOut,
  X,
  Dumbbell,
  Apple,
  CalendarCheck,
  TrendingUp,
  Clock,
  Sparkles,
  Bell,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const MemberSidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    {
      to: '/member/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      end: true,
    },
    {
      to: '/member/profile',
      label: 'My Profile',
      icon: User,
    },
    {
      to: '/member/membership',
      label: 'My Membership',
      icon: CreditCard,
    },
    {
      to: '/member/payments',
      label: 'Payments & Plans',
      icon: CreditCard,
    },
    {
      to: '/member/trainer',
      label: 'My Trainer',
      icon: Award,
    },
    {
      to: '/member/workout',
      label: 'Workout Plan',
      icon: Dumbbell,
    },
    {
      to: '/member/diet',
      label: 'Diet Plan',
      icon: Apple,
    },
    {
      to: '/member/schedule',
      label: 'My Schedule',
      icon: CalendarCheck,
    },
    {
      to: '/member/attendance',
      label: 'Attendance',
      icon: Clock,
    },
    {
      to: '/member/progress',
      label: 'Progress Tracking',
      icon: TrendingUp,
    },
    {
      to: '/member/notifications',
      label: 'Notifications',
      icon: Bell,
    },
  ];

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between p-6 bg-slate-900 text-slate-300 border-r border-slate-800">
      <div>
        {/* Brand Logo */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-800">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-primary-500 text-white flex items-center justify-center shadow-md shadow-primary-500/20 group-hover:scale-105 transition-transform">
              <Dumbbell className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white">
                Fit<span className="text-primary-500">Core</span>
              </span>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-primary-400">
                Member Hub
              </span>
            </div>
          </Link>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <div className="mt-6 space-y-1">
          <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Self-Service Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-md shadow-primary-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* User Card & Logout */}
      <div className="pt-6 border-t border-slate-800 space-y-3">
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/60 border border-slate-800">
          <div className="w-9 h-9 rounded-lg bg-primary-500 text-white font-bold flex items-center justify-center text-sm shadow">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'M'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-white truncate">{user?.name}</div>
            <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-950/40 hover:text-red-300 border border-red-900/30 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Persistent) */}
      <aside className="hidden lg:block w-64 h-screen sticky top-0 shrink-0 z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Collapsible) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export default MemberSidebar;
