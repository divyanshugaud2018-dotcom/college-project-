import React from 'react';
import {
  MessageSquare,
  ThumbsUp,
  Bookmark,
  Eye,
  Shield,
  EyeOff,
  UserCheck,
  Tag,
  Clock,
  BookOpen
} from 'lucide-react';
import { Doubt, UserRole } from '../types';
import { getCurrentUser, toggleUpvoteDoubt, toggleSaveBookmark } from '../services/storage';

interface DoubtCardProps {
  doubt: Doubt;
  answerCount: number;
  onClick: () => void;
}

export const DoubtCard: React.FC<DoubtCardProps> = ({ doubt, answerCount, onClick }) => {
  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';
  const hasUpvoted = currentUser ? doubt.upvotedBy.includes(currentUser.id) : false;
  const isBookmarked = currentUser ? currentUser.savedDoubts.includes(doubt.id) : false;

  const handleUpvote = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleUpvoteDoubt(doubt.id);
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSaveBookmark(doubt.id);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      onClick={onClick}
      className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:border-teal-500/60 dark:hover:border-teal-500/60 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
    >
      {/* Category & Dept Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-md bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border border-teal-200/50 dark:border-teal-800/50">
            {doubt.category}
          </span>
          <span className="px-2.5 py-0.5 text-[11px] font-medium rounded-md bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300">
            {doubt.department}
          </span>
          <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
            {doubt.semester}
          </span>
        </div>

        <span className="text-[11px] text-slate-400 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {formatDate(doubt.createdAt)}
        </span>
      </div>

      {/* Admin Anonymous Trace Banner */}
      {doubt.isAnonymous && isAdmin && (
        <div className="mb-3 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-[11px] font-medium flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
          <span>
            <strong>🔒 Admin Audit:</strong> Anonymous post by <u>{doubt.authorName}</u> ({doubt.authorDepartment})
          </span>
        </div>
      )}

      {/* Title */}
      <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors line-clamp-2 mb-2">
        {doubt.title}
      </h3>

      {/* Content Preview */}
      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-4 leading-relaxed">
        {doubt.content}
      </p>

      {/* Tags */}
      {doubt.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          {doubt.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer: Author & Metrics */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2 text-xs">
        
        {/* Author info */}
        <div className="flex items-center gap-2">
          {doubt.isAnonymous ? (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                <EyeOff className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-slate-500 dark:text-slate-400">
                Anonymous Student
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-[10px]">
                {doubt.authorName.charAt(0)}
              </div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {doubt.authorName}
              </span>
              <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 capitalize">
                {doubt.authorRole}
              </span>
            </div>
          )}
        </div>

        {/* Action Counters */}
        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
          
          <button
            onClick={handleUpvote}
            className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
              hasUpvoted
                ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold'
                : 'hover:bg-slate-100 dark:hover:bg-slate-700/60'
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>{doubt.votes}</span>
          </button>

          <div className="flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">{answerCount}</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-slate-400 hidden sm:flex">
            <Eye className="w-3.5 h-3.5" />
            <span>{doubt.views}</span>
          </div>

          <button
            onClick={handleBookmark}
            className={`p-1 rounded-md transition-colors ${
              isBookmarked ? 'text-amber-500 fill-amber-500' : 'hover:bg-slate-100 dark:hover:bg-slate-700/60'
            }`}
            title="Bookmark doubt"
          >
            <Bookmark className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
