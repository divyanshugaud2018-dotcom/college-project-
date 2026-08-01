import React, { useState } from 'react';
import { X, Flag, AlertTriangle, ShieldCheck } from 'lucide-react';
import { submitReport } from '../services/storage';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'doubt' | 'answer';
  targetId: string;
  doubtId: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  doubtId,
}) => {
  const [reason, setReason] = useState<'spam' | 'abuse' | 'fake_info' | 'other'>('spam');
  const [details, setDetails] = useState('');
  const [isDone, setIsDone] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitReport({
      targetType,
      targetId,
      doubtId,
      reason,
      details: details.trim(),
    });
    setIsDone(true);
    setTimeout(() => {
      setIsDone(false);
      setDetails('');
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden p-6">
        
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-rose-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Report {targetType === 'doubt' ? 'Question' : 'Answer'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isDone ? (
          <div className="py-8 text-center space-y-3">
            <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Report Submitted
            </h4>
            <p className="text-xs text-slate-500">
              Campus administrators will review your report shortly before taking moderation action.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Reason for reporting
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as any)}
                className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="spam">Spam / Unsolicited Promotion</option>
                <option value="abuse">Hate Speech, Harassment, or Abuse</option>
                <option value="fake_info">Incorrect or Fake Exam Information</option>
                <option value="other">Other Violation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Additional Details
              </label>
              <textarea
                rows={3}
                required
                placeholder="Explain why this content breaks college community rules..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md"
              >
                Send Report
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
