import React, { useState, useRef } from 'react';
import { X, GraduationCap, Mail, Lock, User as UserIcon, Shield, CheckCircle, AlertCircle, RefreshCw, Upload, Camera, Sparkles } from 'lucide-react';
import { registerCollegeUser, loginCollegeUser, isCollegeEmail } from '../services/storage';
import { UserRole } from '../types';
import { AvatarCreatorModal } from './AvatarCreatorModal';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const REGISTER_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200', // male
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200', // female
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=200', // male
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200', // female
];

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [tab, setTab] = useState<'login' | 'register' | 'verify' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [department, setDepartment] = useState('Computer Science');
  const [year, setYear] = useState('2nd Year');
  const [rollNumber, setRollNumber] = useState('');
  const [avatar, setAvatar] = useState(REGISTER_AVATARS[0]);
  const [verifyCode, setVerifyCode] = useState('');
  const [isAvatarCreatorOpen, setIsAvatarCreatorOpen] = useState(false);
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('Image size must be less than 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const res = loginCollegeUser(email);
      if (res.success) {
        setSuccessMsg(res.message);
        setTimeout(() => onClose(), 600);
      } else {
        setErrorMsg(res.message);
      }
    }, 400);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!isCollegeEmail(email)) {
      setErrorMsg('Strict Policy: You must use your official college email ending with .ac.in (e.g. name@college.ac.in)');
      return;
    }

    if (!name || !rollNumber) {
      setErrorMsg('Please fill in all required profile fields.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to send verification code.');
      setIsLoading(false);
      setTab('verify');
      setSuccessMsg(result.message);
    } catch (error) {
      setIsLoading(false);
      setErrorMsg(error instanceof Error ? error.message : 'Unable to send verification code.');
    }
  };

  const handleConfirmVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verifyCode }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to verify email.');
      setIsLoading(false);
      const res = registerCollegeUser(email, name, role, department, year, rollNumber, avatar);
      if (res.success) {
        setSuccessMsg(res.message);
        setTimeout(() => onClose(), 800);
      } else {
        setErrorMsg(res.message);
      }
    } catch (error) {
      setIsLoading(false);
      setErrorMsg(error instanceof Error ? error.message : 'Unable to verify email.');
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCollegeEmail(email)) {
      setErrorMsg('Enter a valid college .ac.in email address.');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSuccessMsg(`A password reset link and 6-digit code has been dispatched to ${email}.`);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-teal-700 via-teal-800 to-cyan-700 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-xl bg-white/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold">College Account Access</h2>
          </div>
          <p className="text-xs text-teal-100">
            Exclusive platform for verified students, faculty, and campus staff.
          </p>
        </div>

        {/* Tab Toggle */}
        {(tab === 'login' || tab === 'register') && (
          <div className="flex border-b border-slate-200 dark:border-slate-700">
            <button
              onClick={() => {
                setTab('login');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-3 text-xs font-bold border-b-2 transition-colors ${
                tab === 'login'
                  ? 'border-teal-700 text-teal-700 dark:text-teal-300 bg-teal-50/50 dark:bg-teal-950/30'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setTab('register');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-3 text-xs font-bold border-b-2 transition-colors ${
                tab === 'register'
                  ? 'border-teal-700 text-teal-700 dark:text-teal-300 bg-teal-50/50 dark:bg-teal-950/30'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Register Account
            </button>
          </div>
        )}

        <div className="p-6">
          
          {/* Status Banners */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  College Email (.ac.in required)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="student@college.ac.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setTab('forgot');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="text-xs text-teal-700 dark:text-teal-300 hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-lg shadow-teal-700/20 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Sign In to Campus Hub'}
              </button>
            </form>
          )}

          {/* REGISTER FORM */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rohan Gupta"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  College Email (Must end in .ac.in)
                </label>
                <input
                  type="email"
                  required
                  placeholder="rohan@college.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              {/* Profile Photo Choice */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Profile Photo (Cartoon Bitmoji, Custom Upload, or Presets)
                </label>
                <div className="flex flex-col gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  
                  <div className="flex items-center gap-2">
                    <img
                      src={avatar}
                      alt="Selected Profile"
                      className="w-11 h-11 rounded-xl object-cover ring-2 ring-teal-500 flex-shrink-0"
                    />

                    <button
                      type="button"
                      onClick={() => setIsAvatarCreatorOpen(true)}
                      className="px-3 py-1.5 text-[11px] font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-lg flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
                    >
                      <Sparkles className="w-3.5 h-3.5 fill-amber-900" /> Create Snapchat Cartoon Avatar
                    </button>

                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-1 shadow-sm"
                    >
                      <Upload className="w-3.5 h-3.5" /> Upload Photo
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <span>Quick presets:</span>
                    {REGISTER_AVATARS.map((preset, idx) => (
                      <img
                        key={idx}
                        src={preset}
                        alt="preset"
                        onClick={() => setAvatar(preset)}
                        className={`w-6 h-6 rounded-md object-cover cursor-pointer ring-1 transition-all ${
                          avatar === preset ? 'ring-teal-600 scale-110' : 'ring-transparent opacity-60'
                        }`}
                      />
                    ))}
                  </div>

                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-2 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option value="student">Student</option>
                    <option value="senior">Senior Student</option>
                    <option value="faculty">Faculty Member</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Year / Rank
                  </label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="PG/Master">PG / Master</option>
                    <option value="Faculty">Faculty</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Electronics & Communication">Electronics & Comm.</option>
                    <option value="Mechanical Engineering">Mechanical Eng.</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                    <option value="Electrical Engineering">Electrical Eng.</option>
                    <option value="Basic Sciences / Math">Math & Sciences</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Roll / ID Number
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="23CS3012"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 mt-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-lg shadow-teal-700/20 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Send Email Verification Code'}
              </button>
            </form>
          )}

          {/* EMAIL VERIFICATION STEP */}
          {tab === 'verify' && (
            <form onSubmit={handleConfirmVerification} className="space-y-4">
              <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900 text-xs text-teal-800 dark:text-teal-200">
                We sent a 6-digit verification code to <strong>{email}</strong>. Enter code below (e.g. 123456).
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="123456"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  className="w-full px-3 py-2 text-center text-lg font-mono tracking-widest rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Verify Email & Create Profile'}
              </button>

              <button
                type="button"
                onClick={() => setTab('register')}
                className="w-full text-center text-xs text-slate-500 hover:underline"
              >
                Back to registration details
              </button>
            </form>
          )}

          {/* FORGOT PASSWORD */}
          {tab === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Your College Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@college.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl transition-all"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : 'Send Reset Instructions'}
              </button>

              <button
                type="button"
                onClick={() => setTab('login')}
                className="w-full text-center text-xs text-slate-500 hover:underline"
              >
                Back to Login
              </button>
            </form>
          )}

        </div>
      </div>

      <AvatarCreatorModal
        isOpen={isAvatarCreatorOpen}
        onClose={() => setIsAvatarCreatorOpen(false)}
        onSaveAvatar={(newAvatarDataUri) => {
          setAvatar(newAvatarDataUri);
        }}
      />
    </div>
  );
};
