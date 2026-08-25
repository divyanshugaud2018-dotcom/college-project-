import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Search,
  Bell,
  Moon,
  Sun,
  Shield,
  Plus,
  User as UserIcon,
  LogOut,
  Trophy,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  Lock,
  Layers,
  Sparkles
} from 'lucide-react';
import {
  getCurrentUser,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsRead,
  switchUserRoleForDemo,
  setCurrentUser,
  STORAGE_EVENT
} from '../services/storage';
import { User, UserRole, NotificationItem } from '../types';

interface NavbarProps {
  onOpenAuth: () => void;
  onOpenAskDoubt: () => void;
  onOpenAdmin: () => void;
  onOpenProfile: () => void;
  onOpenLeaderboard: () => void;
  onOpenRules: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeTab: string;
  setActiveTab: (tab: 'feed' | 'bookmarks' | 'my_doubts' | 'leaderboard' | 'admin') => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onSelectDoubt: (doubtId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuth,
  onOpenAskDoubt,
  onOpenAdmin,
  onOpenProfile,
  onOpenLeaderboard,
  onOpenRules,
  searchQuery,
  setSearchQuery,
  activeTab,
  setActiveTab,
  darkMode,
  setDarkMode,
  onSelectDoubt
}) => {
  const [user, setUser] = useState<User | null>(getCurrentUser());
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      const curr = getCurrentUser();
      setUser(curr);
      if (curr) {
        setNotifications(getNotifications(curr.id));
      } else {
        setNotifications([]);
      }
    };

    handleUpdate();
    window.addEventListener(STORAGE_EVENT, handleUpdate);
    return () => window.removeEventListener(STORAGE_EVENT, handleUpdate);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleRoleSwitch = (role: UserRole) => {
    switchUserRoleForDemo(role);
    setShowRoleMenu(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setShowUserMenu(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab('feed')}
              className="flex items-center gap-2.5 text-left group focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-700 via-teal-800 to-cyan-700 flex items-center justify-center text-white shadow-md shadow-teal-700/20 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
                  Doubt<span className="text-teal-700 dark:text-teal-300">Nest</span>
                </span>
                <span className="text-[10px] tracking-wider uppercase font-semibold text-slate-500 dark:text-slate-400 block -mt-1">
                  College Academic Hub
                </span>
              </div>
            </button>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
              <button
                onClick={() => setActiveTab('feed')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'feed'
                    ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Doubt Feed
              </button>

              <button
                onClick={() => {
                  setActiveTab('leaderboard');
                  onOpenLeaderboard();
                }}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                  activeTab === 'leaderboard'
                    ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Trophy className="w-4 h-4 text-amber-500" />
                Leaderboard
              </button>

              <button
                onClick={onOpenRules}
                className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Rules
              </button>

              {user?.role === 'admin' && (
                <button
                  onClick={() => {
                    setActiveTab('admin');
                    onOpenAdmin();
                  }}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                    activeTab === 'admin'
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/30'
                      : 'text-amber-600 dark:text-amber-400 hover:bg-amber-500/10'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  Admin Panel
                </button>
              )}
            </nav>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md hidden lg:block">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search doubts, subjects, topics, codes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
              />
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Quick Ask Button */}
            <button
              onClick={onOpenAskDoubt}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-sm shadow-teal-700/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Ask Doubt</span>
            </button>

            {/* Demo Quick Role Switcher */}
            <div className="relative hidden xl:block">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                title="Switch persona for testing"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Role: <strong className="capitalize">{user?.role || 'Guest'}</strong></span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-50 animate-in fade-in slide-in-from-top-1">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase border-b border-slate-100 dark:border-slate-700">
                    Switch Test Persona
                  </div>
                  {(['student', 'senior', 'faculty', 'admin'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => handleRoleSwitch(r)}
                      className={`w-full text-left px-3 py-1.5 text-xs font-medium capitalize flex items-center justify-between ${
                        user?.role === r
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span>{r}</span>
                      {user?.role === r && <CheckCircle className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications Menu */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifMenu(!showNotifMenu)}
                  className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 relative transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifMenu && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700 py-2 z-50">
                    <div className="px-4 py-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-700">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Bell className="w-4 h-4 text-indigo-600" /> Notifications
                      </h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => user && markAllNotificationsRead(user.id)}
                          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-400">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              markNotificationAsRead(n.id);
                              setShowNotifMenu(false);
                              if (n.linkDoubtId) onSelectDoubt(n.linkDoubtId);
                            }}
                            className={`p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer ${
                              !n.isRead ? 'bg-indigo-50/50 dark:bg-indigo-950/20 font-medium' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                                {n.title}
                              </span>
                              {!n.isRead && <span className="w-2 h-2 rounded-full bg-indigo-600 flex-shrink-0 mt-1" />}
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                              {n.message}
                            </p>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Toggle theme"
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* User Profile / Auth Toggle */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1 rounded-full border-2 border-teal-600/30 hover:border-teal-600 transition-all"
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700 py-2 z-50">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {user.name}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {user.email}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 capitalize">
                          {user.role}
                        </span>
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                          ⚡ {user.reputationPoints} pts
                        </span>
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onOpenProfile();
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        My Profile & Dashboard
                      </button>

                      {user.role === 'admin' && (
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            onOpenAdmin();
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 flex items-center gap-2 font-medium"
                        >
                          <Shield className="w-4 h-4 text-amber-500" />
                          Admin Console
                        </button>
                      )}

                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 mt-1 border-t border-slate-100 dark:border-slate-700"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-4 py-1.5 text-xs font-bold text-teal-700 dark:text-teal-300 hover:text-teal-800 border border-teal-600/30 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-950/50 transition-colors"
              >
                Sign In
              </button>
            )}

          </div>

        </div>

        <div className="lg:hidden pb-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search doubts, subjects, topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
              aria-label="Search doubts"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
