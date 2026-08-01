import React from 'react';
import { X, ShieldCheck, Clock, EyeOff, AlertTriangle, CheckCircle } from 'lucide-react';

interface CommunityRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommunityRulesModal: React.FC<CommunityRulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden p-6 max-h-[85vh] overflow-y-auto">
        
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <ShieldCheck className="w-6 h-6" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              DoubtNest Community Standards & Rules
            </h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-start gap-2.5">
            <Clock className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 dark:text-white block font-bold">1. Zero Expiry Policy</strong>
              Questions stay permanently on DoubtNest to help future batches of students during exams unless explicitly deleted by the question owner or an administrator.
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 flex items-start gap-2.5">
            <EyeOff className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 dark:text-white block font-bold">2. Anonymous Posting & Safety</strong>
              Posting anonymously hides your profile details from classmates and faculty. To protect community safety, campus system administrators retain de-anonymization audit capability to prevent harassment, abuse, or academic dishonesty.
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 dark:text-white block font-bold">3. Correct Answer Verification & Warnings</strong>
              If an answer accumulates 3 or more "Incorrect" votes from peers, DoubtNest automatically flags it with an alert. Faculty & Admins can manually audit and mark answers as "Verified Correct".
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-start gap-2.5">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 dark:text-white block font-bold">4. Reputation & Peer Support</strong>
              Upvote accurate answers! Top contributors gain reputation points and earn badges on the Campus Leaderboard.
            </div>
          </div>

        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-700 text-right">
          <button
            onClick={onClose}
            className="px-6 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
          >
            I Understand & Agree
          </button>
        </div>

      </div>
    </div>
  );
};
