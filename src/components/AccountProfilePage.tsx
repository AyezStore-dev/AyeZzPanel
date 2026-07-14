import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  ArrowLeft, 
  RotateCw, 
  Mail, 
  Lock, 
  ShieldAlert, 
  CheckCircle2, 
  Calendar,
  Sparkles,
  Info
} from 'lucide-react';

interface AccountProfilePageProps {
  currentUser: any;
  updateCurrentUser: (user: any) => void;
  addCustomNotification: (msg: string) => void;
  onBack: () => void;
}

export default function AccountProfilePage({
  currentUser,
  updateCurrentUser,
  addCustomNotification,
  onBack
}: AccountProfilePageProps) {
  const [pageLoading, setPageLoading] = useState(true);
  const [username, setUsername] = useState(currentUser?.username || 'admin');
  const [email, setEmail] = useState(currentUser?.email || 'srosmawati810@gmail.com');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setPageLoading(false), 450);
    return () => clearTimeout(t);
  }, []);

  const handleUpdateProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim()) return;

    setIsSavingProfile(true);
    setTimeout(() => {
      const updatedUser = {
        ...currentUser,
        username: username.trim(),
        email: email.trim()
      };
      updateCurrentUser(updatedUser);
      setIsSavingProfile(false);
      addCustomNotification('👤 Account profile credentials updated successfully! Changes persist instantly.');
    }, 1000);
  };

  const handleUpdatePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      alert("New password confirmation mismatch. Please verify passwords.");
      return;
    }

    setIsChangingPassword(true);
    setTimeout(() => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsChangingPassword(false);
      addCustomNotification('🔑 Administrative account credentials password has been successfully altered.');
    }, 1250);
  };

  if (pageLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
        <RotateCw className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-sm font-mono tracking-wider text-slate-400">RETRIEVING CLIENT PROFILE RECORDS...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/35 border border-white/5 rounded-2xl p-5 mb-2 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mb-1">
            <span>AyeZzPanel</span>
            <span className="text-slate-600">/</span>
            <span className="text-indigo-400 font-semibold font-semibold">User Account</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-400" />
            Profil Akun & User Session
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Modify developer attributes, update administrative credentials email, or configure advanced login security.
          </p>
        </div>

        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold cursor-pointer transition-all shrink-0 self-start sm:self-center"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COMPONENT: PROFILE DETAILS CHANGER */}
        <div className="lg:col-span-4 bg-slate-900/30 backdrop-blur-xl border border-white/10 rounded-3xl p-5 text-center flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center font-bold text-3xl text-slate-950 border-2 border-slate-800 shadow-md">
              {username.substring(0, 2).toUpperCase()}
            </div>
            <span className="absolute bottom-0 right-1 w-5 h-5 bg-emerald-500 border-2 border-slate-950 rounded-full animate-pulse" title="Active on panel"></span>
          </div>

          <div className="space-y-1">
            <span className="text-base font-bold text-slate-100 capitalize">{username}</span>
            <span className="text-[10px] font-mono font-semibold bg-indigo-500/10 border border-indigo-900/30 px-2 py-0.5 rounded text-indigo-300 block w-fit mx-auto uppercase">
              {currentUser?.role || 'admin'}
            </span>
          </div>

          <div className="w-full space-y-2 mt-4 pt-4 border-t border-slate-900 text-left text-xs text-slate-400 font-mono">
            <div className="flex justify-between"><span>User Ident:</span><span className="text-slate-300">#{currentUser?.id || 'UID-3000'}</span></div>
            <div className="flex justify-between"><span>IP Session:</span><span className="text-slate-300">127.0.0.1 (Self)</span></div>
            <div className="flex justify-between"><span>Session Origin:</span><span className="text-slate-300">Reverse proxy</span></div>
          </div>
        </div>

        {/* RIGHT COMPONENTS: EDIT FORMS */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* PROFILE EDIT FORM */}
          <div className="bg-slate-900/15 border border-slate-900 rounded-3xl p-6 space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 border-b border-slate-850 pb-2 flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-indigo-400" />
              Administrative Identity
            </h3>

            <form onSubmit={handleUpdateProfileSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-400">Panel User Account name</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl p-2.5 outline-none focus:border-indigo-500 text-slate-300"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400">Administrative Email Coordinates</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="srosmawati810@gmail.com"
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl p-2.5 outline-none focus:border-indigo-500 text-slate-300 animate-fadeIn"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingProfile}
                className="md:col-span-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md cursor-pointer transition-colors"
              >
                {isSavingProfile ? 'Saving profile details...' : 'Synch Identity Changes'}
              </button>
            </form>
          </div>

          {/* PASSWORD RESET FORM */}
          <div className="bg-slate-900/15 border border-slate-900 rounded-3xl p-6 space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 border-b border-slate-850 pb-2 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-indigo-400" />
              Credentials Password Swap
            </h3>

            <form onSubmit={handleUpdatePasswordSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold block">Current password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl p-2.5 outline-none focus:border-indigo-500 text-slate-300"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold block">New Password swap</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl p-2.5 outline-none focus:border-indigo-500 text-slate-300"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold block">Verify verification copy</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl p-2.5 outline-none focus:border-indigo-500 text-slate-300"
                />
              </div>

              <button
                type="submit"
                disabled={isChangingPassword}
                className="md:col-span-3 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md cursor-pointer transition-colors"
              >
                {isChangingPassword ? 'Transmitting cryptographic updates...' : 'Alter Account Password'}
              </button>
            </form>
          </div>

        </div>

      </div>
    </motion.div>
  );
}
