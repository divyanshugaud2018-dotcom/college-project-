import React, { useState, useEffect } from 'react';
import {
  X,
  ThumbsUp,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  Award,
  EyeOff,
  Shield,
  Flag,
  Send,
  Trash2,
  Edit2,
  Bookmark,
  ChevronDown,
  ChevronUp,
  Check,
  UserCheck
} from 'lucide-react';
import { Doubt, Answer, User } from '../types';
import {
  getAnswers,
  createAnswer,
  toggleUpvoteAnswer,
  voteAnswerCorrectness,
  toggleBestAnswer,
  toggleAdminVerifiedCorrect,
  addAnswerComment,
  deleteAnswer,
  getCurrentUser,
  STORAGE_EVENT,
  deleteDoubt
} from '../services/storage';

interface DoubtDetailModalProps {
  doubt: Doubt | null;
  onClose: () => void;
  onOpenReport: (targetType: 'doubt' | 'answer', targetId: string, doubtId: string) => void;
}

export const DoubtDetailModal: React.FC<DoubtDetailModalProps> = ({
  doubt,
  onClose,
  onOpenReport,
}) => {
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [newAnswerText, setNewAnswerText] = useState('');
  const [isAnsAnon, setIsAnsAnon] = useState(false);
  const [commentInputs, setCommentInputs] = useState<{ [ansId: string]: string }>({});
  const [expandedComments, setExpandedComments] = useState<{ [ansId: string]: boolean }>({});
  const [user, setUser] = useState<User | null>(getCurrentUser());

  useEffect(() => {
    if (!doubt) return;

    const loadData = () => {
      const allAnswers = getAnswers();
      const filtered = allAnswers.filter((a) => a.doubtId === doubt.id);
      setAnswers(filtered);
      setUser(getCurrentUser());
    };

    loadData();
    window.addEventListener(STORAGE_EVENT, loadData);
    return () => window.removeEventListener(STORAGE_EVENT, loadData);
  }, [doubt]);

  if (!doubt) return null;

  const isQuestionOwner = user?.id === doubt.authorId;
  const isAdmin = user?.role === 'admin';
  const isFaculty = user?.role === 'faculty';

  const handlePostAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnswerText.trim()) return;

    createAnswer(doubt.id, newAnswerText.trim(), isAnsAnon);
    setNewAnswerText('');
    setIsAnsAnon(false);
  };

  const handleCommentSubmit = (ansId: string) => {
    const text = commentInputs[ansId];
    if (!text || !text.trim()) return;

    addAnswerComment(ansId, text.trim());
    setCommentInputs({ ...commentInputs, [ansId]: '' });
  };

  const handleDeleteDoubt = () => {
    if (confirm('Are you sure you want to delete this doubt?')) {
      deleteDoubt(doubt.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300">
              {doubt.category}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {doubt.department} • {doubt.subject} ({doubt.semester})
            </span>
          </div>

          <div className="flex items-center gap-2">
            {(isQuestionOwner || isAdmin) && (
              <button
                onClick={handleDeleteDoubt}
                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="Delete question"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => onOpenReport('doubt', doubt.id, doubt.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Report Doubt"
            >
              <Flag className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 divide-y divide-slate-100 dark:divide-slate-700">
          
          {/* Main Doubt Post */}
          <div className="space-y-4">
            
            {/* Admin Audit Banner for Anonymous */}
            {doubt.isAnonymous && isAdmin && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span>
                  <strong>🔒 System Admin Access:</strong> Anonymous doubt asked by <u>{doubt.authorName}</u> ({doubt.authorDepartment}, {doubt.authorRole}).
                </span>
              </div>
            )}

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-snug">
              {doubt.title}
            </h1>

            {/* Question Author info */}
            <div className="flex items-center gap-3 text-xs text-slate-500">
              {doubt.isAnonymous ? (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                    <EyeOff className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 dark:text-slate-300 block">
                      Anonymous Student
                    </span>
                    <span className="text-[10px] text-slate-400">Verified College User</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                    {doubt.authorName.charAt(0)}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">
                      {doubt.authorName}
                    </span>
                    <span className="text-[10px] text-slate-400 capitalize">
                      {doubt.authorRole} • {doubt.authorDepartment}
                    </span>
                  </div>
                </div>
              )}
              <span className="ml-auto text-[11px] text-slate-400">
                Asked {new Date(doubt.createdAt).toLocaleDateString()}
              </span>
            </div>

            {/* Body */}
            <div className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed font-normal bg-slate-50/50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              {doubt.content}
            </div>

            {/* Tags */}
            {doubt.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {doubt.tags.map((t) => (
                  <span
                    key={t}
                    className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ANSWERS SECTION */}
          <div className="pt-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-600" />
                Answers ({answers.length})
              </h2>
            </div>

            {answers.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/60">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No answers yet. Be the first senior, classmate, or TA to help out!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {answers.map((ans) => {
                  const isAnsOwner = user?.id === ans.authorId;
                  const hasUpvoted = user ? ans.upvotedBy.includes(user.id) : false;
                  const votedCorrect = user ? ans.votedCorrectBy.includes(user.id) : false;
                  const votedIncorrect = user ? ans.votedIncorrectBy.includes(user.id) : false;
                  const commentsCount = ans.comments.length;

                  // Incorrect warning trigger: >= 3 incorrect votes & not admin verified
                  const showIncorrectWarning = ans.incorrectVotes >= 3 && !ans.isVerifiedCorrect;

                  return (
                    <div
                      key={ans.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        ans.isBestAnswer
                          ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700/60 shadow-sm'
                          : ans.isVerifiedCorrect
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700/60'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {/* Top Badges for Best Answer or Verified Correct */}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        {ans.isBestAnswer && (
                          <span className="px-3 py-1 rounded-lg bg-amber-500 text-white text-xs font-bold flex items-center gap-1 shadow-sm">
                            <Award className="w-3.5 h-3.5" /> Best Answer
                          </span>
                        )}

                        {ans.isVerifiedCorrect && (
                          <span className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 shadow-sm">
                            <CheckCircle className="w-3.5 h-3.5" /> Verified Correct
                          </span>
                        )}

                        {/* Incorrect Vote Warning Banner */}
                        {showIncorrectWarning && (
                          <div className="w-full p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                            <span>This answer may be incorrect. Please verify before using.</span>
                          </div>
                        )}
                      </div>

                      {/* Author header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          {ans.isAnonymous ? (
                            <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 text-xs">
                              <EyeOff className="w-3.5 h-3.5" />
                            </div>
                          ) : (
                            <img
                              src={ans.authorAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'}
                              alt={ans.authorName}
                              className="w-7 h-7 rounded-full object-cover"
                            />
                          )}

                          <div>
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {ans.isAnonymous ? 'Anonymous Contributor' : ans.authorName}
                            </span>
                            <span className="ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 capitalize">
                              {ans.authorRole}
                            </span>
                          </div>
                        </div>

                        {/* Best Answer Toggle Button (Author or Admin) */}
                        {(isQuestionOwner || isAdmin) && (
                          <button
                            onClick={() => toggleBestAnswer(ans.id)}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-colors ${
                              ans.isBestAnswer
                                ? 'bg-amber-500 text-white border-amber-600'
                                : 'text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/50'
                            }`}
                          >
                            {ans.isBestAnswer ? '✓ Selected Best Answer' : 'Mark as Best Answer'}
                          </button>
                        )}

                        {/* Faculty/Admin Mark Verified Correct */}
                        {(isFaculty || isAdmin) && (
                          <button
                            onClick={() => toggleAdminVerifiedCorrect(ans.id)}
                            className={`ml-2 px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-colors ${
                              ans.isVerifiedCorrect
                                ? 'bg-emerald-600 text-white border-emerald-700'
                                : 'text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
                            }`}
                          >
                            {ans.isVerifiedCorrect ? '✓ Verified Correct' : 'Verify Correct'}
                          </button>
                        )}
                      </div>

                      {/* Content */}
                      <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed mb-4">
                        {ans.content}
                      </p>

                      {/* Action Bar: Upvote, Correct/Incorrect, Comment, Report */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-700/60 text-xs">
                        
                        <div className="flex items-center gap-3">
                          
                          {/* Upvotes */}
                          <button
                            onClick={() => toggleUpvoteAnswer(ans.id)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-colors ${
                              hasUpvoted
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                            <span>{ans.upvotes}</span>
                          </button>

                          {/* Correctness Voting System */}
                          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden text-[11px]">
                            <button
                              onClick={() => voteAnswerCorrectness(ans.id, true)}
                              className={`px-2 py-1 font-semibold flex items-center gap-1 ${
                                votedCorrect
                                  ? 'bg-emerald-600 text-white'
                                  : 'hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-600'
                              }`}
                              title="Vote as Correct"
                            >
                              <Check className="w-3 h-3" />
                              <span>{ans.correctVotes} Correct</span>
                            </button>
                            <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700" />
                            <button
                              onClick={() => voteAnswerCorrectness(ans.id, false)}
                              className={`px-2 py-1 font-semibold flex items-center gap-1 ${
                                votedIncorrect
                                  ? 'bg-rose-600 text-white'
                                  : 'hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600'
                              }`}
                              title="Vote as Incorrect"
                            >
                              <X className="w-3 h-3" />
                              <span>{ans.incorrectVotes} Incorrect</span>
                            </button>
                          </div>

                          {/* Toggle Comments */}
                          <button
                            onClick={() =>
                              setExpandedComments({
                                ...expandedComments,
                                [ans.id]: !expandedComments[ans.id],
                              })
                            }
                            className="flex items-center gap-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Comments ({commentsCount})</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onOpenReport('answer', ans.id, doubt.id)}
                            className="text-slate-400 hover:text-rose-500 p-1"
                            title="Report answer"
                          >
                            <Flag className="w-3.5 h-3.5" />
                          </button>

                          {(isAnsOwner || isAdmin) && (
                            <button
                              onClick={() => deleteAnswer(ans.id)}
                              className="text-slate-400 hover:text-rose-500 p-1"
                              title="Delete answer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                      </div>

                      {/* THREADED COMMENTS AREA */}
                      {expandedComments[ans.id] && (
                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 space-y-3 bg-slate-50/50 dark:bg-slate-900/40 p-3 rounded-xl">
                          
                          {/* Existing Comments */}
                          {ans.comments.map((c) => (
                            <div key={c.id} className="text-xs space-y-0.5">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                  {c.authorName} <span className="font-normal text-[10px] text-slate-400">({c.authorRole})</span>
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-slate-700 dark:text-slate-300">{c.content}</p>
                            </div>
                          ))}

                          {/* Add Comment Input */}
                          <div className="flex gap-2 pt-2">
                            <input
                              type="text"
                              placeholder="Add a polite comment..."
                              value={commentInputs[ans.id] || ''}
                              onChange={(e) =>
                                setCommentInputs({ ...commentInputs, [ans.id]: e.target.value })
                              }
                              onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit(ans.id)}
                              className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                            <button
                              onClick={() => handleCommentSubmit(ans.id)}
                              className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700"
                            >
                              Post
                            </button>
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}

            {/* ANSWER SUBMISSION FORM */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                Your Answer
              </h3>

              <form onSubmit={handlePostAnswer} className="space-y-3">
                <textarea
                  rows={4}
                  required
                  placeholder="Provide a clear, detailed answer with formulas or logic..."
                  value={newAnswerText}
                  onChange={(e) => setNewAnswerText(e.target.value)}
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50"
                />

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAnsAnon}
                      onChange={(e) => setIsAnsAnon(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                    />
                    <span>Answer Anonymously</span>
                  </label>

                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" /> Submit Answer
                  </button>
                </div>
              </form>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
