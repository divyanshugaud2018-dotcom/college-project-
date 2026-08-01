import React, { useState, useEffect } from 'react';
import {
  Users,
  MessageSquare,
  HelpCircle,
  Shield,
  BarChart2,
  TrendingUp,
  Search,
  UserX,
  UserCheck,
  Flag,
  Trash2,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Layers,
  Activity
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';
import {
  getUsers,
  getDoubts,
  getAnswers,
  getReports,
  getActivityData,
  getDeptStats,
  updateUserStatus,
  reviewReport,
  STORAGE_EVENT
} from '../services/storage';
import { User, Doubt, Report } from '../types';

interface AdminDashboardProps {
  onSelectDoubt: (doubtId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onSelectDoubt }) => {
  const [users, setUsers] = useState<User[]>(getUsers());
  const [doubts, setDoubts] = useState<Doubt[]>(getDoubts());
  const [reports, setReports] = useState<Report[]>(getReports());
  const [userSearch, setUserSearch] = useState('');
  const [activeAdminTab, setActiveAdminTab] = useState<'overview' | 'users' | 'reports' | 'anonymous'>('overview');

  const activityData = getActivityData();
  const deptStats = getDeptStats();

  const refreshData = () => {
    setUsers(getUsers());
    setDoubts(getDoubts());
    setReports(getReports());
  };

  useEffect(() => {
    refreshData();
    window.addEventListener(STORAGE_EVENT, refreshData);
    return () => window.removeEventListener(STORAGE_EVENT, refreshData);
  }, []);

  const totalAnswers = getAnswers().length;
  const activeUsers = users.filter((u) => u.status === 'active').length;
  const pendingReports = reports.filter((r) => r.status === 'pending');
  const anonymousDoubts = doubts.filter((d) => d.isAnonymous);

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.rollNumber.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.department.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold flex items-center gap-2">
              Campus Admin Control Console
            </h1>
            <p className="text-xs text-slate-300">
              Platform Analytics, Identity Verification, User Safety & Moderation
            </p>
          </div>
        </div>

        {/* Admin Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/10 text-xs font-semibold">
          <button
            onClick={() => setActiveAdminTab('overview')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeAdminTab === 'overview' ? 'bg-amber-500 text-slate-900 font-bold' : 'hover:bg-white/10 text-slate-200'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveAdminTab('users')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeAdminTab === 'users' ? 'bg-amber-500 text-slate-900 font-bold' : 'hover:bg-white/10 text-slate-200'
            }`}
          >
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveAdminTab('reports')}
            className={`px-3 py-1.5 rounded-lg transition-colors relative ${
              activeAdminTab === 'reports' ? 'bg-amber-500 text-slate-900 font-bold' : 'hover:bg-white/10 text-slate-200'
            }`}
          >
            Reports
            {pendingReports.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px]">
                {pendingReports.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveAdminTab('anonymous')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeAdminTab === 'anonymous' ? 'bg-amber-500 text-slate-900 font-bold' : 'hover:bg-white/10 text-slate-200'
            }`}
          >
            Anon Audit
          </button>
        </div>
      </div>

      {/* METRICS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Registered Users</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{users.length}</h3>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">100% College Verified</span>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Campus Users</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{activeUsers}</h3>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Active this semester</span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Doubts Asked</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{doubts.length}</h3>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">{anonymousDoubts.length} asked anonymously</span>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <HelpCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Answers Provided</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalAnswers}</h3>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">Peer & Faculty answers</span>
          </div>
          <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <MessageSquare className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* OVERVIEW ANALYTICS TAB */}
      {activeAdminTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Daily Activity Chart */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600" /> Daily Campus Activity Trend
                </h3>
                <p className="text-[11px] text-slate-500">Doubts & Answers posted over the past week</p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="date" stroke="#888888" fontSize={11} />
                  <YAxis stroke="#888888" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      color: '#ffffff',
                      fontSize: '12px',
                    }}
                  />
                  <Line type="monotone" dataKey="doubts" stroke="#6366f1" strokeWidth={2.5} name="Doubts" />
                  <Line type="monotone" dataKey="answers" stroke="#10b981" strokeWidth={2.5} name="Answers" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Department Breakdown Bar Chart */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-emerald-600" /> Department-Wise Statistics
                </h3>
                <p className="text-[11px] text-slate-500">Volume of questions asked by academic department</p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptStats}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="department" stroke="#888888" fontSize={10} tickFormatter={(val) => val.split(' ')[0]} />
                  <YAxis stroke="#888888" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      color: '#ffffff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="doubts" fill="#6366f1" radius={[6, 6, 0, 0]} name="Doubts" />
                  <Bar dataKey="answers" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Answers" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {/* USER MANAGEMENT TAB */}
      {activeAdminTab === 'users' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Campus User Directory & Permissions
              </h3>
              <p className="text-xs text-slate-500">Manage user account statuses, suspensions, and roles</p>
            </div>

            <div className="relative max-w-xs">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search name, roll no, email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Role & Year</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Roll No.</th>
                  <th className="p-3">Reputation</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                    <td className="p-3 font-medium flex items-center gap-2">
                      <img src={u.avatar} alt={u.name} className="w-7 h-7 rounded-full object-cover" />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{u.name}</div>
                        <div className="text-[10px] text-slate-400">{u.email}</div>
                      </div>
                    </td>
                    <td className="p-3 capitalize font-semibold text-slate-700 dark:text-slate-300">
                      {u.role} ({u.year})
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">{u.department}</td>
                    <td className="p-3 font-mono text-slate-600 dark:text-slate-400">{u.rollNumber}</td>
                    <td className="p-3 font-bold text-amber-600 dark:text-amber-400">⚡ {u.reputationPoints}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                          u.status === 'active'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                            : u.status === 'suspended'
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                            : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-1">
                      {u.status !== 'active' ? (
                        <button
                          onClick={() => updateUserStatus(u.id, 'active')}
                          className="px-2 py-1 text-[10px] font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          Restore
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => updateUserStatus(u.id, 'suspended')}
                            className="px-2 py-1 text-[10px] font-bold rounded-lg bg-amber-500 text-white hover:bg-amber-600"
                          >
                            Suspend
                          </button>
                          <button
                            onClick={() => updateUserStatus(u.id, 'blocked')}
                            className="px-2 py-1 text-[10px] font-bold rounded-lg bg-rose-600 text-white hover:bg-rose-700"
                          >
                            Block
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORTS REVIEW QUEUE TAB */}
      {activeAdminTab === 'reports' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Flag className="w-4 h-4 text-rose-500" /> Pending Community Reports ({pendingReports.length})
            </h3>
            <p className="text-xs text-slate-500">Review reported spam, abuse, or misleading answers</p>
          </div>

          {reports.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No reports submitted yet.</p>
          ) : (
            <div className="space-y-3">
              {reports.map((rep) => (
                <div
                  key={rep.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-bold uppercase text-[10px]">
                        {rep.reason}
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        Target: {rep.targetType.toUpperCase()}
                      </span>
                      <span className="text-slate-400">Reported by {rep.reporterName}</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 italic">"{rep.details}"</p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => onSelectDoubt(rep.doubtId)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400"
                    >
                      View Post
                    </button>
                    {rep.status === 'pending' && (
                      <>
                        <button
                          onClick={() => reviewReport(rep.id, 'dismiss')}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                        >
                          Dismiss
                        </button>
                        <button
                          onClick={() => reviewReport(rep.id, 'remove_post')}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-600 text-white hover:bg-rose-700"
                        >
                          Remove Post
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ANONYMOUS DOUBT AUDIT LOG */}
      {activeAdminTab === 'anonymous' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-amber-500" /> Anonymous Doubt De-anonymization Audit Log
            </h3>
            <p className="text-xs text-slate-500">
              Only accessible to campus system administrators for safety, plagiarism, or harassment audits.
            </p>
          </div>

          <div className="space-y-3">
            {anonymousDoubts.map((d) => (
              <div
                key={d.id}
                onClick={() => onSelectDoubt(d.id)}
                className="p-4 rounded-xl border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/20 dark:bg-amber-950/10 hover:border-amber-400 cursor-pointer transition-all flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">{d.title}</h4>
                  <p className="text-slate-500 mt-0.5">{d.subject} • {d.department}</p>
                </div>

                <div className="text-right">
                  <span className="font-bold text-amber-700 dark:text-amber-400 block">
                    {d.authorName}
                  </span>
                  <span className="text-[10px] text-slate-400 capitalize">
                    {d.authorRole} • {d.authorDepartment}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
