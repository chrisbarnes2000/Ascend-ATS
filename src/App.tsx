import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';
import { motion, AnimatePresence } from 'motion/react';
import { JobSeekerDashboard } from './pages/JobSeekerDashboard';
import { ProfileWizard } from './pages/ProfileWizard';
import { CompanyWizard } from './pages/CompanyWizard';
import { ProfileEditor } from './pages/ProfileEditor';
import { EmployerSourcing } from './pages/EmployerSourcing';
import { EmployerDashboard } from './pages/EmployerDashboard';
import { PublicProfile } from './pages/PublicProfile';
import { JobDescription } from './pages/JobDescription';
import { JobSeekerAnalytics } from './pages/JobSeekerAnalytics';
import { CompanyDirectory } from './pages/CompanyDirectory';
import { CompanyProfileView } from './pages/CompanyProfileView';
import { CompanyManagement } from './pages/CompanyManagement';
import AdminPanel from './pages/AdminPanel';
import { 
  LogOut, 
  TrendingUp,
  Plus,
  Rocket,
  UserCircle,
  Briefcase,
  Send,
  Clock,
  CheckCircle2,
  LayoutDashboard,
  AlertCircle,
  Moon,
  Sun,
  Monitor,
  User,
  ChevronDown,
  Settings,
  Eye,
  Edit3,
  Search,
  Terminal,
  Database,
  Sparkles,
  ShieldAlert,
  Building
} from 'lucide-react';
import { doc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from './firebase/config';

// Components
const Navbar = () => {
  const { user, appUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [profileData, setProfileData] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      setProfileData(null);
      return;
    }

    const isCompany = ['company', 'recruiter', 'staffingFirm'].includes(appUser?.accountType || '');
    const path = isCompany ? `users/${user.uid}/profiles/company` : `users/${user.uid}/profiles/main`;
    
    const unsubscribe = onSnapshot(doc(db, path), (docSnap) => {
      if (docSnap.exists()) {
        setProfileData(docSnap.data());
      } else {
        setProfileData(null);
      }
    }, (err) => {
      console.error("Failed to stream navbar profile data", err);
    });

    return unsubscribe;
  }, [user, appUser?.accountType]);

  const getCompleteness = () => {
    if (!profileData) return 0;
    let points = 0;
    if (profileData.personalInfo?.firstName) points += 20;
    if (profileData.professionalSummary) points += 20;
    if (profileData.targetRole) points += 20;
    if (profileData.workExperience && profileData.workExperience.length > 0) points += 20;
    if (profileData.skills && profileData.skills.length > 0) points += 20;
    return points;
  };

  const getCompanyCompleteness = () => {
    if (!profileData) return 0;
    let points = 0;
    if (profileData.companyName) points += 25;
    if (profileData.industry) points += 25;
    if (profileData.size) points += 25;
    if (profileData.description) points += 25;
    return points;
  };

  const isCompany = ['company', 'recruiter', 'staffingFirm'].includes(appUser?.accountType || '');
  
  const displayName = isCompany 
    ? (profileData?.companyName || appUser?.email?.split('@')[0] || 'Employer')
    : (profileData?.personalInfo?.preferredName || profileData?.personalInfo?.firstName || appUser?.email?.split('@')[0] || 'Candidate');
  
  const displayRole = isCompany
    ? (profileData?.industry || 'Recruiter')
    : (profileData?.targetRole || 'Job Seeker');

  const progress = isCompany ? getCompanyCompleteness() : getCompleteness();

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md z-50">
      <div className="w-full md:w-[75vw] max-w-none mx-auto px-4 h-full flex items-center justify-between">
        <a href="#" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-200">
            <TrendingUp className="text-white w-5 h-5" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">Ascend ATS</span>
        </a>

        <div className="flex items-center gap-4">
          {/* Theme Selector */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setTheme('light')}
              className={`p-1.5 rounded-lg transition-colors ${theme === 'light' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
              title="Light Mode"
            >
              <Sun className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTheme('system')}
              className={`p-1.5 rounded-lg transition-colors ${theme === 'system' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
              title="System Theme"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`p-1.5 rounded-lg transition-colors ${theme === 'dark' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
              title="Dark Mode"
            >
              <Moon className="w-4 h-4" />
            </button>
          </div>

          {user && (
            <div className="relative flex items-center">
              {/* Profile Toggle Menu */}
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800/80 p-1.5 pr-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 transition-all shadow-sm group"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-md shadow-indigo-100 dark:shadow-none group-hover:scale-105 transition-transform">
                  {displayName.substring(0, 2).toUpperCase()}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 max-w-[120px]">
                    {displayName}
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {progress}% Complete
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
              </button>

              {/* Float Dropdown Card */}
              {isDropdownOpen && (
                <>
                  {/* Click Backdrop to Close */}
                  <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                  
                  <div className="absolute right-0 top-12 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 z-50 mt-2">
                    {/* Header profile metrics */}
                    <div className="mb-5 pb-5 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3.5 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white font-extrabold flex items-center justify-center text-base shadow-lg shadow-indigo-150 dark:shadow-none">
                          {displayName.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-extrabold text-sm truncate text-slate-900 dark:text-white">{displayName}</div>
                          <div className="text-xs text-indigo-600 dark:text-indigo-400 font-bold truncate">{displayRole}</div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">{user.email}</div>
                        </div>
                      </div>

                      {/* Completeness state bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500 dark:text-slate-400 font-semibold">Profile Strength</span>
                          <span className="font-bold text-slate-900 dark:text-white">{progress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Navigation Options */}
                    <div className="space-y-1">
                      <div className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2.5 mb-2.5">
                        My Workspaces
                      </div>

                      {/* Candidate Roles */}
                      {!isCompany && (
                        <>
                          <a 
                            href={`#profile/${user.uid}`} 
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-3 p-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 transition-colors"
                          >
                            <Eye className="w-4.5 h-4.5 text-slate-400 dark:text-slate-500" />
                            View Public Profile
                          </a>
                          <a 
                            href="#edit-profile" 
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-3 p-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 transition-colors"
                          >
                            <Edit3 className="w-4.5 h-4.5 text-slate-400 dark:text-slate-500" />
                            Edit Profile Builder
                          </a>
                          <a 
                            href="#analytics" 
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-3 p-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 transition-colors"
                          >
                            <TrendingUp className="w-4.5 h-4.5 text-slate-400 dark:text-slate-500" />
                            View Sourcing Analytics
                          </a>
                          <a 
                            href="#companies" 
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-3 p-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 transition-colors"
                          >
                            <Building className="w-4.5 h-4.5 text-slate-400 dark:text-slate-500" />
                            Browse Companies
                          </a>
                          <a 
                            href="#" 
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-3 p-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 transition-colors"
                          >
                            <LayoutDashboard className="w-4.5 h-4.5 text-slate-400 dark:text-slate-500" />
                            Seeker Dashboard
                          </a>
                        </>
                      )}

                      {/* Recruiter / Employer Roles */}
                      {isCompany && (
                        <>
                          <a 
                            href="#companies" 
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-3 p-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 transition-colors"
                          >
                            <Building className="w-4.5 h-4.5 text-slate-400 dark:text-slate-500" />
                            Browse Companies
                          </a>
                          <a 
                            href="#sourcing" 
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-3 p-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 transition-colors"
                          >
                            <Search className="w-4.5 h-4.5 text-slate-400 dark:text-slate-500" />
                            Talent Sourcing Engine
                          </a>
                          <a 
                            href="#" 
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-3 p-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 transition-colors"
                          >
                            <LayoutDashboard className="w-4.5 h-4.5 text-slate-400 dark:text-slate-500" />
                            Employer Dashboard
                          </a>
                        </>
                      )}

                      <div className="my-2.5 border-t border-slate-100 dark:border-slate-800/80" />

                      {/* Developer Admin Dashboard */}
                      <a 
                        href="#admin" 
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 p-2.5 rounded-xl text-sm font-semibold bg-indigo-50/50 hover:bg-indigo-50 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 transition-colors"
                      >
                        <Terminal className="w-4.5 h-4.5 text-indigo-500 dark:text-indigo-400" />
                        Admin Panel (Seeder)
                      </a>

                      {/* Sign Out Trigger */}
                      <button 
                        onClick={() => {
                          setIsDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-3 p-2.5 rounded-xl text-sm font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 transition-colors mt-1"
                      >
                        <LogOut className="w-4.5 h-4.5 text-rose-500 dark:text-rose-400" />
                        Sign Out Account
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

const RegistrationFlow = () => {
  const { signInWithGoogle } = useAuth();
  const [selectedType, setSelectedType] = useState<'jobSeeker' | 'company' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setError(null);
    try {
      if (selectedType) {
        await signInWithGoogle(selectedType);
      } else {
        await signInWithGoogle();
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please try again.");
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        <h1 className="text-4xl font-bold mb-4">Join Ascend ATS</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-12">Choose how you want to use the platform to get started, or just sign in.</p>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800 text-sm">
            {error}
          </div>
        )}

        <div className="grid gap-4 mb-8">
          <button 
            onClick={() => setSelectedType('jobSeeker')}
            className={`p-6 rounded-2xl border-2 transition-all text-left flex items-start gap-4 ${
              selectedType === 'jobSeeker' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl text-blue-600 dark:text-blue-400">
              <UserCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">Job Seeker</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">I want to find my next role with intelligent automation.</p>
            </div>
          </button>

          <button 
            onClick={() => setSelectedType('company')}
            className={`p-6 rounded-2xl border-2 transition-all text-left flex items-start gap-4 ${
              selectedType === 'company' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl text-indigo-600 dark:text-indigo-400">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">Company / Firm</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">I want to post jobs and find top talent instantly.</p>
            </div>
          </button>
        </div>

        <button
          onClick={handleSignIn}
          className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 shadow-xl"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/component/google_signin_buttons/google-icon.svg" className="w-5 h-5" alt="Google" />
          {selectedType ? 'Continue with Google' : 'Sign In with Google'}
        </button>
      </motion.div>
    </div>
  );
};

const DashboardSkeleton = () => {
  const { appUser } = useAuth();
  
  return (
    <div className="min-h-screen pt-24 pb-12 px-4 w-full md:w-[75vw] max-w-none mx-auto">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-bold">Welcome back!</h1>
          <p className="text-slate-500">Here's what's happening with your applications.</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
          <Plus className="w-5 h-5" />
          {appUser?.accountType === 'jobSeeker' ? 'Add Resume' : 'Post Job'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        {[
          { label: 'Applied', count: 12, icon: Send, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Viewed', count: 5, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Interviewing', count: 2, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Offers', count: 1, icon: TrendingUp, color: 'text-indigo-500', bg: 'bg-indigo-50' }
        ].map((stat) => (
          <div key={stat.label} className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 ${stat.bg} ${stat.color} rounded-lg`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-slate-400">Total</span>
            </div>
            <div className="text-2xl font-bold">{stat.count}</div>
            <div className="text-sm text-slate-500 capitalize">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-slate-400" />
            Recent Activity
          </h2>
          <div className="p-12 bg-white rounded-3xl border border-dashed border-slate-300 flex flex-col items-center text-center">
            <div className="p-4 bg-slate-50 rounded-full mb-4">
              <AlertCircle className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="font-bold text-slate-900">No activity yet</h3>
            <p className="text-slate-500 max-w-xs">Start by completing your profile to unlock intelligent job matching.</p>
          </div>
        </div>
        
        <div className="space-y-6">
          <h2 className="text-xl font-bold">Profile Strength</h2>
          <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl text-white shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm font-medium text-slate-400">Completeness</span>
              <span className="text-2xl font-bold font-display">35%</span>
            </div>
            <div className="w-full bg-slate-700 h-2 rounded-full mb-8 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '35%' }}
                className="bg-blue-500 h-full rounded-full"
              />
            </div>
            <ul className="space-y-4">
              {[
                { task: 'Upload Resume', done: true },
                { task: 'Work Experience', done: false },
                { task: 'Target Preferences', done: false }
              ].map((t) => (
                <li key={t.task} className="flex items-center gap-3 text-sm">
                  {t.done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-slate-600" />
                  )}
                  <span className={t.done ? 'text-slate-300' : 'text-slate-500'}>{t.task}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const AppContent = () => {
  const { user, appUser, loading } = useAuth();
  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    const handleHash = () => setHash(window.location.hash);
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full shadow-xl"
        />
      </div>
    );
  }

  return (
    <div className="selection:bg-blue-100 selection:text-blue-900 dark:selection:bg-blue-900 dark:selection:text-blue-100 min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Navbar />
      <AnimatePresence mode="wait">
        {hash.startsWith('#profile/') ? (
          <motion.div
            key="public-profile"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <PublicProfile />
          </motion.div>
        ) : !user ? (
          <RegistrationFlow key="auth" />
        ) : !appUser?.profileCompleted ? (
          <motion.div
            key="wizard"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {appUser?.accountType === 'company' || appUser?.accountType === 'recruiter' ? (
              <CompanyWizard onComplete={() => { window.location.hash = ''; }} />
            ) : (
              <ProfileWizard onComplete={() => { window.location.hash = ''; }} />
            )}
          </motion.div>
        ) : hash === '#onboarding' ? (
          <motion.div
            key="wizard-rebuild"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {appUser?.accountType === 'company' || appUser?.accountType === 'recruiter' ? (
              <CompanyWizard onComplete={() => { window.location.hash = '#edit-profile'; }} />
            ) : (
              <ProfileWizard onComplete={() => { window.location.hash = '#edit-profile'; }} />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="dashboard-or-editor"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {hash === '#edit-profile' ? (
              <ProfileEditor />
            ) : hash === '#analytics' ? (
              <JobSeekerAnalytics />
            ) : hash === '#sourcing' ? (
              <EmployerSourcing />
            ) : hash === '#companies' ? (
              <CompanyDirectory />
            ) : hash === '#company-management' || hash === '#company-crud' ? (
              <CompanyManagement />
            ) : hash.startsWith('#company/') ? (
              <CompanyProfileView />
            ) : hash === '#admin' ? (
              <AdminPanel />
            ) : hash.startsWith('#job/') ? (
              <JobDescription />
            ) : ['company', 'recruiter', 'staffingFirm'].includes(appUser?.accountType || '') ? (
              <EmployerDashboard />
            ) : (
              <JobSeekerDashboard />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
