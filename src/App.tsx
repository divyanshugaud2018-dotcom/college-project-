import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Plus,
  HelpCircle,
  MessageSquare,
  Bookmark,
  Sparkles,
  Layers,
  GraduationCap,
  TrendingUp,
  Clock,
  ThumbsUp,
  AlertCircle
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { DoubtCard } from './components/DoubtCard';
import { AskDoubtModal } from './components/AskDoubtModal';
import { DoubtDetailModal } from './components/DoubtDetailModal';
import { AuthModal } from './components/AuthModal';
import { ReportModal } from './components/ReportModal';
import { AdminDashboard } from './components/AdminDashboard';
import { UserProfile } from './components/UserProfile';
import { Leaderboard } from './components/Leaderboard';
import { CommunityRulesModal } from './components/CommunityRulesModal';
import { NestAIChat } from './components/NestAIChat';

import {
  initStorage,
  getDoubts,
  getAnswers,
  getCurrentUser,
  STORAGE_EVENT
} from './services/storage';
import { Doubt, Category } from './types';

const CATEGORIES: ('All' | Category)[] = [
  'All',
  'Subject',
  'Semester',
  'Department',
  'Programming',
  'Assignments',
  'Exams',
  'Notes',
];

const DEPARTMENTS = [
  'All Departments',
  'Computer Science',
  'Electronics & Communication',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical Engineering',
  'Basic Sciences / Math',
];

const SEMESTERS = ['All Semesters', 'Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8'];

export default function App() {
  // Initialize storage with seed data
  useEffect(() => {
    initStorage();
  }, []);

  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [answers, setAnswers] = useState(getAnswers());
  const [currentUser, setCurrentUser] = useState(getCurrentUser());

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | Category>('All');
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [selectedSem, setSelectedSem] = useState('All Semesters');
  const [sortBy, setSortBy] = useState<'newest' | 'votes' | 'unanswered'>('newest');

  const [activeTab, setActiveTab] = useState<'feed' | 'bookmarks' | 'my_doubts' | 'leaderboard' | 'admin' | 'profile'>('feed');
  const [selectedDoubtId, setSelectedDoubtId] = useState<string | null>(null);

  // Modals
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAskOpen, setIsAskOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [reportConfig, setReportConfig] = useState<{
    isOpen: boolean;
    targetType: 'doubt' | 'answer';
    targetId: string;
    doubtId: string;
  }>({
    isOpen: false,
    targetType: 'doubt',
    targetId: '',
    doubtId: '',
  });

  // Dark mode
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Sync data from storage changes
  const refreshData = () => {
    setDoubts(getDoubts());
    setAnswers(getAnswers());
    setCurrentUser(getCurrentUser());
  };

  useEffect(() => {
    refreshData();
    window.addEventListener(STORAGE_EVENT, refreshData);
    return () => window.removeEventListener(STORAGE_EVENT, refreshData);
  }, []);

  // Filter & Sort Logic
  const filteredDoubts = doubts.filter((d) => {
    // Search
    const q = searchQuery.toLowerCase().trim();
    if (
      q &&
      !d.title.toLowerCase().includes(q) &&
      !d.content.toLowerCase().includes(q) &&
      !d.subject.toLowerCase().includes(q) &&
      !d.tags.some((t) => t.toLowerCase().includes(q))
    ) {
      return false;
    }

    // Category
    if (selectedCategory !== 'All' && d.category !== selectedCategory) {
      return false;
    }

    // Department
    if (selectedDept !== 'All Departments' && d.department !== selectedDept) {
      return false;
    }

    // Semester
    if (selectedSem !== 'All Semesters' && d.semester !== selectedSem) {
      return false;
    }

    return true;
  });

  const sortedDoubts = [...filteredDoubts].sort((a, b) => {
    if (sortBy === 'votes') {
      return b.votes - a.votes;
    }
    if (sortBy === 'unanswered') {
      const ansA = answers.filter((ans) => ans.doubtId === a.id).length;
      const ansB = answers.filter((ans) => ans.doubtId === b.id).length;
      return ansA - ansB; // fewest answers first
    }
    // Newest first default
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const selectedDoubt = doubts.find((d) => d.id === selectedDoubtId) || null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200 flex flex-col">
      
      {/* NAVBAR */}
      <Navbar
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenAskDoubt={() => {
          if (!currentUser) {
            setIsAuthOpen(true);
          } else {
            setIsAskOpen(true);
          }
        }}
        onOpenAdmin={() => setActiveTab('admin')}
        onOpenProfile={() => setActiveTab('profile')}
        onOpenLeaderboard={() => setActiveTab('leaderboard')}
        onOpenRules={() => setIsRulesOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeTab={activeTab as any}
        setActiveTab={(t) => setActiveTab(t as any)}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onSelectDoubt={(id) => setSelectedDoubtId(id)}
      />

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* RENDER ADMIN DASHBOARD TAB */}
        {activeTab === 'admin' ? (
          <AdminDashboard onSelectDoubt={(id) => setSelectedDoubtId(id)} />
        ) : activeTab === 'profile' ? (
          <UserProfile onSelectDoubt={(id) => setSelectedDoubtId(id)} />
        ) : activeTab === 'leaderboard' ? (
          <Leaderboard />
        ) : (
          /* REGULAR DOUBT FEED VIEW */
          <div className="space-y-6">
            
            {/* Campus Banner / Stats */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-teal-700 via-teal-800 to-cyan-700 text-white shadow-xl shadow-teal-900/15 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-md">
                  <GraduationCap className="w-4 h-4 text-lime-300" />
                  Official College Peer Discussion Hub
                </div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                  Solve Academic Doubts Anonymously & Collaborate
                </h1>
                <p className="text-xs text-teal-100 max-w-2xl">
                  Ask questions without fear, get verified answers from professors and top seniors, and build your campus academic reputation.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => {
                    if (!currentUser) setIsAuthOpen(true);
                    else setIsAskOpen(true);
                  }}
                  className="px-5 py-2.5 text-xs font-bold text-teal-800 bg-white hover:bg-teal-50 rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4 text-teal-700" />
                  Ask Question Anonymously
                </button>
              </div>
            </div>

            {/* CATEGORY PILLS BAR */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-teal-700 text-white shadow-md shadow-teal-700/30'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* FILTERS & SORTING ROW */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
              
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Dept Filter */}
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-semibold focus:outline-none"
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>

                {/* Semester Filter */}
                <select
                  value={selectedSem}
                  onChange={(e) => setSelectedSem(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-semibold focus:outline-none"
                >
                  {SEMESTERS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort selector */}
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <span>Sort:</span>
                <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setSortBy('newest')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      sortBy === 'newest'
                        ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Newest
                  </button>
                  <button
                    onClick={() => setSortBy('votes')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      sortBy === 'votes'
                        ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Top Upvoted
                  </button>
                  <button
                    onClick={() => setSortBy('unanswered')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      sortBy === 'unanswered'
                        ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Unanswered
                  </button>
                </div>
              </div>

            </div>

            {/* DOUBTS FEED GRID */}
            {sortedDoubts.length === 0 ? (
              <div className="py-16 text-center space-y-3 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm">
                <HelpCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                  No doubts match your search filter
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Try clearing your search query or department filters, or ask a new doubt!
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                    setSelectedDept('All Departments');
                    setSelectedSem('All Semesters');
                  }}
                  className="px-4 py-2 text-xs font-bold text-teal-700 dark:text-teal-300 hover:underline"
                >
                  Reset all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sortedDoubts.map((d) => {
                  const ansCount = answers.filter((a) => a.doubtId === d.id).length;
                  return (
                    <DoubtCard
                      key={d.id}
                      doubt={d}
                      answerCount={ansCount}
                      onClick={() => setSelectedDoubtId(d.id)}
                    />
                  );
                })}
              </div>
            )}

          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-teal-700" />
            <span className="font-bold text-slate-700 dark:text-slate-300">DoubtNest Campus Platform</span>
            <span>• Private & Secure College Discussion</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <button onClick={() => setIsRulesOpen(true)} className="hover:underline">
              Community Rules
            </button>
            <button onClick={() => setActiveTab('leaderboard')} className="hover:underline">
              Top Contributors
            </button>
            <button
              onClick={() => {
                if (currentUser) setActiveTab('profile');
                else setIsAuthOpen(true);
              }}
              className="hover:underline"
            >
              My Dashboard
            </button>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      <AskDoubtModal
        isOpen={isAskOpen}
        onClose={() => setIsAskOpen(false)}
        onDoubtCreated={(id) => {
          setSelectedDoubtId(id);
        }}
      />

      <DoubtDetailModal
        doubt={selectedDoubt}
        onClose={() => setSelectedDoubtId(null)}
        onOpenReport={(type, targetId, doubtId) => {
          setReportConfig({
            isOpen: true,
            targetType: type,
            targetId,
            doubtId,
          });
        }}
      />

      <ReportModal
        isOpen={reportConfig.isOpen}
        onClose={() => setReportConfig({ ...reportConfig, isOpen: false })}
        targetType={reportConfig.targetType}
        targetId={reportConfig.targetId}
        doubtId={reportConfig.doubtId}
      />

      <CommunityRulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />

      <NestAIChat doubts={doubts} answers={answers} currentUser={currentUser} />

    </div>
  );
}
