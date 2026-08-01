import React, { useState } from 'react';
import { Trophy, Award, Zap, ShieldCheck, Filter, Users } from 'lucide-react';
import { getUsers } from '../services/storage';

export const Leaderboard: React.FC = () => {
  const [deptFilter, setDeptFilter] = useState('All');

  const users = getUsers();
  
  const filtered = users.filter((u) => {
    if (deptFilter === 'All') return true;
    return u.department === deptFilter;
  });

  const sorted = [...filtered].sort((a, b) => b.reputationPoints - a.reputationPoints);

  const departments = [
    'All',
    'Computer Science',
    'Electronics & Communication',
    'Mechanical Engineering',
    'Civil Engineering',
    'Electrical Engineering',
    'Basic Sciences / Math'
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      
      {/* Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
            <Trophy className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black">Campus Contributor Leaderboard</h1>
            <p className="text-xs text-indigo-200">Recognizing students, seniors & TAs who provide helpful solutions</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 bg-white/10 p-1.5 rounded-2xl border border-white/10 text-xs">
          <Filter className="w-4 h-4 text-amber-400" />
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
          >
            {departments.map((d) => (
              <option key={d} value={d} className="bg-slate-900 text-white">
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Point scoring system legend */}
      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-200 flex flex-wrap items-center justify-around gap-3 font-medium">
        <span>⚡ <strong>+10 pts</strong> per Answer Upvote</span>
        <span>🌟 <strong>+25 pts</strong> for Best Answer</span>
        <span>✅ <strong>+50 pts</strong> for Verified Correct</span>
        <span>❓ <strong>+5 pts</strong> per Helpful Doubt</span>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md overflow-hidden">
        <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
          <span>Rank & Contributor</span>
          <span>Department & Score</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {sorted.map((user, idx) => {
            const rank = idx + 1;
            let rankBadge = null;
            if (rank === 1) {
              rankBadge = <span className="px-2.5 py-1 rounded-full bg-amber-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm">🥇 #1 Gold</span>;
            } else if (rank === 2) {
              rankBadge = <span className="px-2.5 py-1 rounded-full bg-slate-300 text-slate-800 font-bold text-xs flex items-center gap-1">🥈 #2 Silver</span>;
            } else if (rank === 3) {
              rankBadge = <span className="px-2.5 py-1 rounded-full bg-amber-700 text-white font-bold text-xs flex items-center gap-1">🥉 #3 Bronze</span>;
            } else {
              rankBadge = <span className="font-bold text-slate-400 text-xs">#{rank}</span>;
            }

            return (
              <div
                key={user.id}
                className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 text-center">{rankBadge}</div>
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/20"
                  />
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      {user.name}
                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 capitalize">
                        {user.role}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      {user.year} • {user.rollNumber}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-black text-amber-600 dark:text-amber-400 flex items-center justify-end gap-1">
                    <Zap className="w-4 h-4 fill-amber-500" />
                    {user.reputationPoints} pts
                  </div>
                  <div className="text-[11px] text-slate-400">{user.department}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
