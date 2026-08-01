import React, { useState, useEffect, useRef } from 'react';
import {
  User as UserIcon,
  HelpCircle,
  MessageSquare,
  Bookmark,
  Award,
  Zap,
  Edit3,
  CheckCircle,
  GraduationCap,
  Shield,
  Layers,
  Save,
  Check,
  Mail,
  Building,
  Calendar,
  Sparkles,
  Pin,
  Camera,
  Upload,
  Image as ImageIcon,
  RotateCcw
} from 'lucide-react';
import { getCurrentUser, getDoubts, getAnswers, saveUsers, getUsers, STORAGE_EVENT } from '../services/storage';
import { User, Doubt, Answer } from '../types';
import { DoubtCard } from './DoubtCard';
import { AvatarCreatorModal } from './AvatarCreatorModal';

interface UserProfileProps {
  onSelectDoubt: (doubtId: string) => void;
}

const MALE_PRESETS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
];

const FEMALE_PRESETS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
];

export const UserProfile: React.FC<UserProfileProps> = ({ onSelectDoubt }) => {
  const [user, setUser] = useState<User | null>(getCurrentUser());
  const [activeSubTab, setActiveSubTab] = useState<'my_doubts' | 'my_answers' | 'saved'>('my_doubts');
  const [isEditing, setIsEditing] = useState(false);
  const [isAvatarCreatorOpen, setIsAvatarCreatorOpen] = useState(false);

  const [editName, setEditName] = useState(user?.name || '');
  const [editDept, setEditDept] = useState(user?.department || '');
  const [editYear, setEditYear] = useState(user?.year || '');
  const [editRoll, setEditRoll] = useState(user?.rollNumber || '');
  const [editAvatar, setEditAvatar] = useState(user?.avatar || '');
  const [avatarCategory, setAvatarCategory] = useState<'custom' | 'male' | 'female'>('custom');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCustomPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Please select an image smaller than 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setEditAvatar(reader.result);
          setAvatarCategory('custom');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const handleUpdate = () => {
      const curr = getCurrentUser();
      setUser(curr);
      if (curr) {
        setEditName(curr.name);
        setEditDept(curr.department);
        setEditYear(curr.year);
        setEditRoll(curr.rollNumber);
        setEditAvatar(curr.avatar);
      }
    };
    handleUpdate();
    window.addEventListener(STORAGE_EVENT, handleUpdate);
    return () => window.removeEventListener(STORAGE_EVENT, handleUpdate);
  }, []);

  if (!user) return null;

  const allDoubts = getDoubts();
  const allAnswers = getAnswers();

  const myDoubts = allDoubts.filter((d) => d.authorId === user.id);
  const myAnswers = allAnswers.filter((a) => a.authorId === user.id);
  const savedDoubts = allDoubts.filter((d) => user.savedDoubts.includes(d.id));

  // Calculating stats
  const totalUpvotesEarned = myAnswers.reduce((acc, curr) => acc + curr.upvotes, 0);
  const verifiedAnswersCount = myAnswers.filter((a) => a.isVerifiedCorrect).length;
  const bestAnswersCount = myAnswers.filter((a) => a.isBestAnswer).length;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const users = getUsers();
    const index = users.findIndex((u) => u.id === user.id);
    if (index !== -1) {
      users[index].name = editName;
      users[index].department = editDept;
      users[index].year = editYear;
      users[index].rollNumber = editRoll;
      users[index].avatar = editAvatar;
      saveUsers(users);
      setIsEditing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* PROFILE HEADER CARD */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          
          <div className="flex items-center gap-5">
            <div className="relative group">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover ring-4 ring-indigo-500/20 shadow-lg"
              />
              {user.isVerified && (
                <div
                  title="Verified College ID"
                  className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 text-white rounded-full ring-2 ring-white dark:ring-slate-800"
                >
                  <CheckCircle className="w-4 h-4" />
                </div>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {user.name}
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 capitalize">
                  {user.role}
                </span>
                {user.isVerified && (
                  <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Verified College ID
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                <span className="flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  {user.department}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                  {user.year}
                </span>
                <span>•</span>
                <span>
                  Roll No: <strong className="text-slate-700 dark:text-slate-300 font-mono">{user.rollNumber}</strong>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-3 text-xs">
                <span className="flex items-center gap-1.5 font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-3 py-1 rounded-xl border border-amber-200 dark:border-amber-900/50 shadow-sm">
                  <Zap className="w-4 h-4 fill-amber-500" /> {user.reputationPoints} Reputation Points
                </span>
                <span className="flex items-center gap-1 text-slate-400">
                  <Mail className="w-3.5 h-3.5" /> {user.email}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
          >
            <Edit3 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            {isEditing ? 'Cancel Edit' : 'Edit Profile'}
          </button>

        </div>

        {/* Edit Form Drawer */}
        {isEditing && (
          <form onSubmit={handleSaveProfile} className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 space-y-5 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Camera className="w-4 h-4 text-indigo-600" /> Custom Profile Picture & Details
              </h3>
            </div>

            {/* Profile Photo Options Box */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                
                {/* Active Photo Preview */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={editAvatar}
                      alt="Preview"
                      className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-500 shadow-sm"
                    />
                    <span className="absolute -bottom-1 -right-1 bg-indigo-600 text-white p-1 rounded-full text-[9px]">
                      <Camera className="w-3 h-3" />
                    </span>
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-xs">Profile Photo Preview</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Upload your real photo or pick a student preset below
                    </div>
                  </div>
                </div>

                {/* BUTTONS: CARTOON BITMOJI CREATOR & FILE UPLOAD */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAvatarCreatorOpen(true)}
                    className="px-4 py-2.5 text-xs font-bold text-amber-950 dark:text-amber-200 bg-amber-400 hover:bg-amber-300 rounded-xl flex items-center gap-2 shadow-md shadow-amber-400/20 transition-all active:scale-95"
                  >
                    <Sparkles className="w-4 h-4 fill-amber-900 dark:fill-amber-100" />
                    Create Snapchat Cartoon Avatar
                  </button>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleCustomPhotoUpload}
                    className="hidden"
                    id="profile-photo-file-input"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-2 shadow-sm transition-all active:scale-95"
                  >
                    <Upload className="w-4 h-4 text-indigo-600" />
                    Upload Device Photo
                  </button>
                </div>
              </div>

              {/* Presets Tab Switcher */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Or Select Realistic Student Preset:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setAvatarCategory('male')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                        avatarCategory === 'male'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Male Students
                    </button>
                    <button
                      type="button"
                      onClick={() => setAvatarCategory('female')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                        avatarCategory === 'female'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Female Students
                    </button>
                  </div>
                </div>

                {/* Presets list */}
                <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                  {(avatarCategory === 'female' ? FEMALE_PRESETS : MALE_PRESETS).map((preset, idx) => (
                    <img
                      key={idx}
                      src={preset}
                      alt={`Preset ${idx}`}
                      onClick={() => setEditAvatar(preset)}
                      className={`w-12 h-12 rounded-xl object-cover cursor-pointer ring-2 transition-all flex-shrink-0 ${
                        editAvatar === preset ? 'ring-indigo-600 scale-105 shadow-md' : 'ring-transparent opacity-75 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Department</label>
                <input
                  type="text"
                  required
                  value={editDept}
                  onChange={(e) => setEditDept(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Year / Position</label>
                <input
                  type="text"
                  required
                  value={editYear}
                  onChange={(e) => setEditYear(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Roll Number / ID</label>
                <input
                  type="text"
                  required
                  value={editRoll}
                  onChange={(e) => setEditRoll(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Or Direct Image URL</label>
                <input
                  type="url"
                  value={editAvatar}
                  onChange={(e) => setEditAvatar(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 flex items-center gap-1.5 shadow-md"
              >
                <Save className="w-4 h-4" /> Save Profile
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ACADEMIC BADGES & REPUTATION BREAKDOWN */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
            <Zap className="w-5 h-5 fill-amber-500" />
          </div>
          <div>
            <div className="text-slate-400 font-medium">Reputation Points</div>
            <div className="text-lg font-black text-slate-900 dark:text-white">{user.reputationPoints} pts</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-500">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-slate-400 font-medium">Upvotes Received</div>
            <div className="text-lg font-black text-slate-900 dark:text-white">+{totalUpvotesEarned}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
            <Sparkles className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <div className="text-slate-400 font-medium">Best Answers</div>
            <div className="text-lg font-black text-slate-900 dark:text-white">{bestAnswersCount} Awards</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <div className="text-slate-400 font-medium">Verified Solutions</div>
            <div className="text-lg font-black text-slate-900 dark:text-white">{verifiedAnswersCount} Verified</div>
          </div>
        </div>
      </div>

      {/* STAT COUNTERS & ACTIVITY SUBTABS */}
      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={() => setActiveSubTab('my_doubts')}
          className={`p-5 rounded-2xl border text-left transition-all ${
            activeSubTab === 'my_doubts'
              ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-500 shadow-sm ring-1 ring-indigo-500'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Questions Asked</span>
            <HelpCircle className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{myDoubts.length}</p>
        </button>

        <button
          onClick={() => setActiveSubTab('my_answers')}
          className={`p-5 rounded-2xl border text-left transition-all ${
            activeSubTab === 'my_answers'
              ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-500 shadow-sm ring-1 ring-indigo-500'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Answers Contributed</span>
            <MessageSquare className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{myAnswers.length}</p>
        </button>

        <button
          onClick={() => setActiveSubTab('saved')}
          className={`p-5 rounded-2xl border text-left transition-all ${
            activeSubTab === 'saved'
              ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-500 shadow-sm ring-1 ring-indigo-500'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Saved Bookmarks</span>
            <Bookmark className="w-5 h-5 text-amber-500 fill-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{savedDoubts.length}</p>
        </button>
      </div>

      {/* CONTENT LIST FOR SUBTABS */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white capitalize">
          {activeSubTab === 'my_doubts' && 'My Asked Doubts'}
          {activeSubTab === 'my_answers' && 'My Answer Contributions'}
          {activeSubTab === 'saved' && 'Bookmarked Doubts for Revision'}
        </h2>

        {activeSubTab === 'my_doubts' && (
          <div className="space-y-4">
            {myDoubts.length === 0 ? (
              <p className="text-xs text-slate-400 p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                You haven't asked any doubts yet.
              </p>
            ) : (
              myDoubts.map((d) => (
                <DoubtCard
                  key={d.id}
                  doubt={d}
                  answerCount={allAnswers.filter((a) => a.doubtId === d.id).length}
                  onClick={() => onSelectDoubt(d.id)}
                />
              ))
            )}
          </div>
        )}

        {activeSubTab === 'my_answers' && (
          <div className="space-y-3">
            {myAnswers.length === 0 ? (
              <p className="text-xs text-slate-400 p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                You haven't answered any doubts yet. Help peers to earn reputation points!
              </p>
            ) : (
              myAnswers.map((ans) => {
                const parentDoubt = allDoubts.find((d) => d.id === ans.doubtId);
                return (
                  <div
                    key={ans.id}
                    onClick={() => onSelectDoubt(ans.doubtId)}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 cursor-pointer space-y-2 transition-colors"
                  >
                    <span className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400">
                      On Question: {parentDoubt?.title || 'Academic Question'}
                    </span>
                    <p className="text-xs text-slate-800 dark:text-slate-200 line-clamp-2 font-medium">
                      "{ans.content}"
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                      <span>👍 {ans.upvotes} Upvotes</span>
                      {ans.isBestAnswer && <span className="text-amber-500 font-bold">★ Best Answer</span>}
                      {ans.isVerifiedCorrect && <span className="text-emerald-500 font-bold">✓ Verified Correct</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeSubTab === 'saved' && (
          <div className="space-y-4">
            {savedDoubts.length === 0 ? (
              <p className="text-xs text-slate-400 p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                No saved doubts. Click the bookmark icon on any doubt to save it for exams!
              </p>
            ) : (
              savedDoubts.map((d) => (
                <DoubtCard
                  key={d.id}
                  doubt={d}
                  answerCount={allAnswers.filter((a) => a.doubtId === d.id).length}
                  onClick={() => onSelectDoubt(d.id)}
                />
              ))
            )}
          </div>
        )}
      </div>

      <AvatarCreatorModal
        isOpen={isAvatarCreatorOpen}
        onClose={() => setIsAvatarCreatorOpen(false)}
        onSaveAvatar={(newAvatarDataUri) => {
          setEditAvatar(newAvatarDataUri);
          setAvatarCategory('custom');
        }}
        initialGender={user.role === 'senior' || user.name.toLowerCase().includes('aisha') || user.name.toLowerCase().includes('priya') ? 'female' : 'male'}
      />

    </div>
  );
};

