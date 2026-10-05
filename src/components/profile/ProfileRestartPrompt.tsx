import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  AlertCircle, 
  UserCircle, 
  Users, 
  Briefcase, 
  CheckCircle2, 
  ArrowRight, 
  LogOut, 
  RotateCcw,
  Loader2,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { AccountType } from '../../types';

interface ProfileRestartPromptProps {
  onContinueSetup: () => void;
}

export const ProfileRestartPrompt = ({ onContinueSetup }: ProfileRestartPromptProps) => {
  const { user, appUser, resetProfileSetup, logout } = useAuth();
  const [selectedRole, setSelectedRole] = useState<AccountType | null>(appUser?.accountType || null);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentRole = appUser?.accountType;
  const currentRoleLabel = currentRole === 'recruiter' 
    ? 'Recruiter' 
    : currentRole === 'companyOwner' || currentRole === 'company' 
    ? 'Company Owner' 
    : currentRole === 'admin' 
    ? 'Administrator' 
    : 'Job Seeker';

  const handleRestartWithRole = async (newRole: AccountType) => {
    setError(null);
    setIsResetting(true);
    try {
      await resetProfileSetup(newRole);
      onContinueSetup();
    } catch (err: any) {
      console.error('Failed to restart profile setup:', err);
      setError(err.message || 'Failed to update profile setup. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl p-8 md:p-12 relative overflow-hidden"
      >
        {/* Subtle accent glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Header Alert */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-300 mb-2">
              Setup Required
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Profile Configuration Required
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
              You are signed in as <span className="font-bold text-slate-700 dark:text-slate-200">{user?.email}</span>. Your master profile is not yet configured for your account role.
            </p>
          </div>
        </div>

        {error && (
          <div 
            role="alert"
            className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-200 dark:border-rose-800 text-xs font-semibold"
          >
            {error}
          </div>
        )}

        {/* Primary Action: Continue with current detected role */}
        {currentRole && (
          <div className="mb-8 p-5 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-3xl border border-indigo-100 dark:border-indigo-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-indigo-500 dark:text-indigo-400 mb-0.5">
                Current Assigned Role
              </div>
              <div className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{currentRoleLabel}</span>
                <span className="text-xs font-normal text-slate-500 dark:text-slate-400">• Unconfigured</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onContinueSetup}
              disabled={isResetting}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 shrink-0 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              Configure as {currentRoleLabel}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Secondary Section: Restart Setup with a Profile Type */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-slate-400" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Or Choose a Profile Type to Restart Setup
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* 1. Job Seeker */}
            <button
              type="button"
              disabled={isResetting}
              onClick={() => handleRestartWithRole('jobSeeker')}
              className={`p-4 rounded-3xl border-2 text-left transition-all flex flex-col justify-between group focus-visible:ring-2 focus-visible:ring-blue-500 ${
                selectedRole === 'jobSeeker'
                  ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-950/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
              }`}
            >
              <div>
                <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                  <UserCircle className="w-5 h-5" />
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white mb-1">Job Seeker</div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Candidate profile with resume upload and privacy controls.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 flex items-center gap-1 group-hover:gap-1.5 transition-all">
                Select Role <ArrowRight className="w-3 h-3" />
              </div>
            </button>

            {/* 2. Recruiter */}
            <button
              type="button"
              disabled={isResetting}
              onClick={() => handleRestartWithRole('recruiter')}
              className={`p-4 rounded-3xl border-2 text-left transition-all flex flex-col justify-between group focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                selectedRole === 'recruiter'
                  ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
              }`}
            >
              <div>
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                  <Users className="w-5 h-5" />
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white mb-1">Recruiter</div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Verified public profile, candidate sourcing, and open requisitions.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-1 group-hover:gap-1.5 transition-all">
                Select Role <ArrowRight className="w-3 h-3" />
              </div>
            </button>

            {/* 3. Company Owner */}
            <button
              type="button"
              disabled={isResetting}
              onClick={() => handleRestartWithRole('companyOwner')}
              className={`p-4 rounded-3xl border-2 text-left transition-all flex flex-col justify-between group focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                selectedRole === 'companyOwner' || selectedRole === 'company'
                  ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
              }`}
            >
              <div>
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white mb-1">Company Owner</div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Manage company branding, invite recruiters, and oversee jobs.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center gap-1 group-hover:gap-1.5 transition-all">
                Select Role <ArrowRight className="w-3 h-3" />
              </div>
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400 font-medium">
            {isResetting ? (
              <span className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Updating profile role...
              </span>
            ) : (
              'Choose your role or configure now to continue.'
            )}
          </div>

          <button
            type="button"
            onClick={logout}
            className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 flex items-center gap-2 transition-colors rounded-xl focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </motion.div>
    </div>
  );
};
