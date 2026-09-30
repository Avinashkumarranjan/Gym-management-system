import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Award,
  UserCheck,
  ShieldCheck,
  CreditCard,
  User,
  LogOut,
  X,
  Dumbbell,
  ClipboardList,
  Apple,
  CalendarCheck,
  BarChart3,
  Lock,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AdminSidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    {
      to: '/admin/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      end: true,
    },
    {
      to: '/admin/members',
      label: 'All Members',
      icon: Users,
    },
    {
      to: '/admin/members/new',
      label: 'Add Member',
      icon: UserPlus,
    },
    {
      to: '/admin/trainers',
      label: 'All Trainers',
      icon: Award,
    },
    {
      to: '/admin/trainer-assignments',
      label: 'Trainer Assignments',
      icon: UserCheck,
    },
    {
      to: '/admin/trainers/new',
      label: 'Add Trainer',
      icon: ShieldCheck,
    },
    {
      to: '/admin/membership-plans',
      label: 'Membership Plans',
      icon: CreditCard,
    },
    {
      to: '/admin/payments',
      label: 'Payments & Revenue',
      icon: CreditCard,
    },
    {
      to: '/admin/attendance',
      label: 'Attendance',
      icon: Clock,
    },
    {
      to: '/admin/progress',
      label: 'Progress Oversight',
      icon: TrendingUp,
    },
    {
      to: '/admin/workout-plans',
      label: 'Workout Plans',
      icon: Dumbbell,
    },
    {
      to: '/admin/diet-plans',
      label: 'Diet Plans',
      icon: Apple,
    },
    {
      to: '/admin/sessions',
      label: 'Sessions',
      icon: CalendarCheck,
    },
    {
      to: '/admin/reports',
      label: 'Executive Reports',
      icon: BarChart3,
    },
    {
      to: '/admin/contact-inquiries',
      label: 'Contact Inquiries',
      icon: ClipboardList,
    },
    {
      to: '/admin/profile',
      label: 'Admin Profile',
      icon: User,
    },
  ];

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between p-6 bg-slate-900 text-slate-300 border-r border-slate-800">
      <div>
        {/* Brand Logo & Close Button (on mobile) */}
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
                Admin Center
              </span>
            </div>
          </Link>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="mt-6 space-y-1.5 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Main Management
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-primary-500 text-white shadow-sm shadow-primary-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Admin User Footer / Logout */}
      <div className="pt-6 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-primary-500/20 text-primary-400 flex items-center justify-center font-bold text-sm shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {user?.name || 'Administrator'}
              </p>
              <p className="text-[10px] text-primary-400 font-semibold uppercase tracking-wider">
                Master Admin
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
            title="Log out"
            aria-label="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile / Tablet Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />
          <div className="fixed inset-y-0 left-0 max-w-xs w-full z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export default AdminSidebar;
