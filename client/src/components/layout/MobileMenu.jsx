import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { X, LogOut, LayoutDashboard, User } from 'lucide-react';
import Button from '../common/Button';
import ThemeToggle from '../common/ThemeToggle';
import { useAuth } from '../../context/AuthContext';

const MobileMenu = ({ isOpen, onClose, navLinks }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleLogout = async () => {
    await logout();
    onClose();
    navigate('/');
  };

  const getDashboardRoute = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'trainer') return '/trainer/dashboard';
    return '/member/dashboard';
  };

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white dark:bg-slate-900 shadow-2xl p-6 flex flex-col justify-between z-10 animate-in slide-in-from-right duration-200">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-primary-500 text-white flex items-center justify-center font-black text-lg">
                F
              </span>
              <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Fit<span className="text-primary-500">Core</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
                aria-label="Close menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* User Status Bar if Logged In */}
          {isAuthenticated && user && (
            <div className="mt-4 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary-500/20 text-primary-500 flex items-center justify-center font-bold text-xs uppercase">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    {user.name}
                  </p>
                  <p className="text-[10px] uppercase font-semibold text-primary-500">
                    {user.role}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="mt-4 flex flex-col space-y-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-950/40 text-primary-500 font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}

            {isAuthenticated && (
              <NavLink
                to={getDashboardRoute()}
                onClick={onClose}
                className="px-4 py-2.5 rounded-lg text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/40 flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard ({user?.role})</span>
              </NavLink>
            )}
          </nav>
        </div>

        {/* Auth Buttons */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-3">
          {isAuthenticated ? (
            <Button
              type="button"
              variant="outline"
              className="w-full justify-center text-red-500 border-red-300 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/40"
              icon={LogOut}
              iconPosition="right"
              onClick={handleLogout}
            >
              Log Out
            </Button>
          ) : (
            <>
              <Button
                to="/login"
                variant="ghost"
                className="w-full justify-center"
                onClick={onClose}
              >
                Log In
              </Button>
              <Button
                to="/register"
                variant="primary"
                className="w-full justify-center"
                onClick={onClose}
              >
                Join Now
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
