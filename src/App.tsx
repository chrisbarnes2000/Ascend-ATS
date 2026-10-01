import { useState, useEffect, FormEvent } from 'react';
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
import { LandingPage } from './pages/LandingPage';
import AdminPanel from './pages/AdminPanel';
import { LegalPage } from './pages/LegalPage';
import { AffiliatesPage } from './pages/AffiliatesPage';
import { RapportVersePage } from './pages/RapportVersePage';
import { Footer } from './components/Footer';
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
  Shield,
  Building,
  Loader2
} from 'lucide-react';
import { doc, setDoc, serverTimestamp, onSnapshot, collection, addDoc } from 'firebase/firestore';
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
  const isAdmin = user?.email === 'Chris.Barnes.2000@me.com' || user?.uid === '393uzPXnOdPW3CE3rdhmDMEldzm1';
  
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
                      {isAdmin && (
                        <a 
                          href="#admin" 
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-3 p-2.5 rounded-xl text-sm font-semibold bg-indigo-50/50 hover:bg-indigo-50 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 transition-colors"
                        >
                          <Terminal className="w-4.5 h-4.5 text-indigo-500 dark:text-indigo-400" />
                          Admin Panel (Seeder)
                        </a>
                      )}

                      {/* Legal Center Links */}
                      <a 
                        href="#legal" 
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 p-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 transition-colors"
                      >
                        <Shield className="w-4.5 h-4.5 text-slate-400 dark:text-slate-500" />
                        Platform Legal Center
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

const RegistrationFlow = ({ initialRequestMode = false }: { initialRequestMode?: boolean, key?: string }) => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } = useAuth();
  const [selectedType, setSelectedType] = useState<'jobSeeker' | 'company' | null>(initialRequestMode ? 'company' : null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>(initialRequestMode ? 'signup' : 'login');
  const [isRequestMode, setIsRequestMode] = useState(initialRequestMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [requestSource, setRequestSource] = useState('LinkedIn');
  const [requestNote, setRequestNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Extract query parameters from hash (e.g. #signup?invite=ABC123XYZ&email=user@example.com) or search
    const hashPart = window.location.hash;
    const queryString = hashPart.includes('?') 
      ? hashPart.split('?')[1] 
      : (window.location.search ? window.location.search.substring(1) : '');
      
    if (queryString) {
      const params = new URLSearchParams(queryString);
      const urlInvite = params.get('invite');
      const urlEmail = params.get('email');
      const urlRole = params.get('role');
      
      if (urlInvite) {
        setInviteCode(urlInvite.toUpperCase().trim());
        setSelectedType('company');
        setAuthMode('signup');
        setIsRequestMode(false);
      }
      if (urlEmail) {
        setEmail(decodeURIComponent(urlEmail));
      }
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    try {
      console.log("Submitting registration:", { authMode, selectedType, isRequestMode });
      if (isRequestMode) {
        if (!email) throw new Error("Please provide your professional email.");
        console.log("Creating partner request in Firestore...");
        await addDoc(collection(db, 'partner_requests'), {
          email,
          source: requestSource,
          details: requestNote,
          status: 'pending',
          createdAt: serverTimestamp()
        });
        console.log("Partner request created successfully.");
        setSuccess("Access request sent! Our team will review your credentials and contact you shortly.");
        setIsRequestMode(false);
        setEmail('');
        setRequestNote('');
      } else if (authMode === 'signup') {
        if (!selectedType) throw new Error("Please select an account type to join.");
        console.log("Starting signup flow...");
        await signUpWithEmail(email, password, selectedType, inviteCode);
      } else {
        console.log("Starting signin flow...");
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      console.error("Registration error details:", err);
      setError(err.message || "Operation failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email address first to reset your password.");
      return;
    }
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    try {
      await resetPassword(email);
      setSuccess("Password reset email sent! Please check your inbox.");
    } catch (err: any) {
      setError(err.message || "Failed to send reset email.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    try {
      await signInWithGoogle(selectedType || undefined, inviteCode);
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black tracking-tight mb-3 text-slate-900 dark:text-white">
            {authMode === 'signup' ? 'Create your Account' : 'Welcome Back'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            {authMode === 'signup' 
              ? 'Join the next generation of intelligent applicant tracking.' 
              : 'Sign in to access your dashboard and active pipelines.'}
          </p>
        </div>
        
        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-3xl border border-rose-200 dark:border-rose-800/50 text-xs font-bold flex items-start gap-4 shadow-sm"
          >
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="uppercase tracking-widest text-[9px] opacity-60">System Notification</div>
              <p className="leading-relaxed">{error}</p>
            </div>
          </motion.div>
        )}

        {success && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-3xl border border-emerald-200 dark:border-emerald-800/50 text-xs font-bold flex items-start gap-4 shadow-sm"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="uppercase tracking-widest text-[9px] opacity-60">Success</div>
              <p className="leading-relaxed">{success}</p>
            </div>
          </motion.div>
        )}

        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
          {authMode === 'signup' && (
            <div className="p-2 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setSelectedType('jobSeeker')}
                  className={`p-4 rounded-3xl transition-all flex flex-col items-center gap-2 border-2 ${
                    selectedType === 'jobSeeker' 
                      ? 'border-blue-500 bg-white dark:bg-slate-900 shadow-sm' 
                      : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                >
                  <UserCircle className={`w-6 h-6 ${selectedType === 'jobSeeker' ? 'text-blue-500' : ''}`} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Job Seeker</span>
                </button>
                <button 
                  onClick={() => setSelectedType('company')}
                  className={`p-4 rounded-3xl transition-all flex flex-col items-center gap-2 border-2 ${
                    selectedType === 'company' 
                      ? 'border-indigo-500 bg-white dark:bg-slate-900 shadow-sm' 
                      : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                >
                  <Briefcase className={`w-6 h-6 ${selectedType === 'company' ? 'text-indigo-500' : ''}`} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Company / Firm</span>
                </button>
              </div>
            </div>
          )}

          <div className="p-8 md:p-10">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 px-1">Professional Email</label>
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              {!isRequestMode && (
                <div>
                  <div className="flex items-center justify-between px-1 mb-2">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Password</label>
                    {authMode === 'login' && (
                      <button 
                        type="button"
                        onClick={handleForgotPassword}
                        className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-500 transition-colors"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <input 
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              )}

              {isRequestMode && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 px-1">Source / Referral</label>
                    <select 
                      value={requestSource}
                      onChange={e => setRequestSource(e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                    >
                      <option value="LinkedIn">LinkedIn</option>
                      <option value="Dice">Dice</option>
                      <option value="Glassdoor">Glassdoor / GreenDoor</option>
                      <option value="Referral">Direct Referral</option>
                      <option value="Other">Other Source</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 px-1">Job Details / Link / Invite Type</label>
                    <textarea 
                      required
                      rows={3}
                      value={requestNote}
                      onChange={e => setRequestNote(e.target.value)}
                      placeholder="Paste the job description, link, or details about the invitation you received..."
                      className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                    />
                  </div>
                </motion.div>
              )}

              {authMode === 'signup' && selectedType === 'company' && !isRequestMode && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                  <div className="flex items-center justify-between px-1 mb-2">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">Staffing Invite Code</label>
                    <button 
                      type="button"
                      onClick={() => setIsRequestMode(true)}
                      className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-500 transition-colors"
                    >
                      No code?
                    </button>
                  </div>
                  <input 
                    type="text"
                    required
                    value={inviteCode}
                    onChange={e => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="ABC-123-XYZ"
                    className="w-full px-5 py-4 rounded-2xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/30 dark:bg-indigo-950/20 text-sm font-black text-indigo-600 dark:text-indigo-400 focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </motion.div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                  isRequestMode ? 'Submit Access Request' :
                  (authMode === 'signup' ? 'Create Account' : 'Sign In')}
              </button>
              
              {isRequestMode && (
                <button 
                  type="button"
                  onClick={() => setIsRequestMode(false)}
                  className="w-full text-center text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Back to Registration
                </button>
              )}
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
              </div>
              <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
                <span className="px-4 bg-white dark:bg-slate-900 text-slate-400">Or continue with</span>
              </div>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Google</span>
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button 
            onClick={() => {
              setAuthMode(authMode === 'login' ? 'signup' : 'login');
              setError(null);
              setSuccess(null);
            }}
            className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
          >
            {authMode === 'login' ? "Don't have an account? Create one" : "Already have an account? Sign in"}
          </button>
        </div>

        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-10 font-bold leading-relaxed text-center">
          By continuing, you agree to our{' '}
          <a href="#terms" className="text-slate-600 dark:text-slate-300 hover:underline">Terms of Service</a>
          {' '}and{' '}
          <a href="#privacy" className="text-slate-600 dark:text-slate-300 hover:underline">Privacy Policy</a>.
        </p>
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

  useEffect(() => {
    if (loading) {
      document.title = "Loading... | Ascend ATS";
      return;
    }
    
    let title = "Ascend ATS";
    if (hash.startsWith('#profile/')) {
      title = "Candidate Profile | Ascend ATS";
    } else if (hash === '#legal') {
      title = "Legal Center | Ascend ATS";
    } else if (hash === '#terms') {
      title = "Terms of Service | Ascend ATS";
    } else if (hash === '#privacy') {
      title = "Privacy Policy | Ascend ATS";
    } else if (hash === '#affiliates') {
      title = "Affiliate Partner Program | Ascend ATS";
    } else if (hash === '#rapportverse' || hash === '#trust-network') {
      title = "RapportVerse Strategic Bridge | Ascend ATS";
    } else if (hash.startsWith('#signup') || hash.startsWith('#partner-request')) {
      title = "Join Ascend ATS | Smart Application Tracking";
    } else if (hash.startsWith('#login')) {
      title = "Sign In | Ascend ATS";
    } else if (!user) {
      title = "Ascend ATS | Intelligent Applicant Tracking & Recruitment";
    } else if (!appUser?.profileCompleted) {
      title = "Profile Onboarding Wizard | Ascend ATS";
    } else if (hash === '#onboarding') {
      title = "Profile Onboarding Wizard | Ascend ATS";
    } else if (hash === '#edit-profile') {
      title = "Edit Master Profile | Ascend ATS";
    } else if (hash === '#analytics') {
      title = "Sourcing Analytics | Ascend ATS";
    } else if (hash === '#sourcing') {
      title = "Talent Sourcing Engine | Ascend ATS";
    } else if (hash === '#companies') {
      title = "Browse Companies | Ascend ATS";
    } else if (hash === '#company-management' || hash === '#company-crud') {
      title = "Company Management | Ascend ATS";
    } else if (hash.startsWith('#company/')) {
      title = "Company Profile View | Ascend ATS";
    } else if (hash === '#admin' && (user?.email === 'Chris.Barnes.2000@me.com' || user?.uid === '393uzPXnOdPW3CE3rdhmDMEldzm1')) {
      title = "Developer Seeder & Admin Panel | Ascend ATS";
    } else if (hash.startsWith('#job/')) {
      title = "Job Details & Direct Match Assessment | Ascend ATS";
    } else if (['company', 'recruiter', 'staffingFirm'].includes(appUser?.accountType || '')) {
      title = "Employer Dashboard | Ascend ATS";
    } else {
      title = "Candidate Dashboard | Ascend ATS";
    }
    
    document.title = title;
  }, [hash, user, appUser, loading]);

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
        ) : hash === '#legal' || hash === '#terms' || hash === '#privacy' ? (
          <motion.div
            key="legal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <LegalPage initialTab={hash === '#privacy' ? 'privacy' : 'tos'} />
          </motion.div>
        ) : hash === '#affiliates' ? (
          <motion.div
            key="affiliates"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <AffiliatesPage />
          </motion.div>
        ) : hash === '#rapportverse' || hash === '#trust-network' ? (
          <motion.div
            key="rapportverse"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <RapportVersePage />
          </motion.div>
        ) : !user ? (
          (hash.startsWith('#signup') || hash.startsWith('#login') || hash.startsWith('#partner-request')) ? (
            <RegistrationFlow key="auth" initialRequestMode={hash.startsWith('#partner-request')} />
          ) : (
            <LandingPage key="landing" />
          )
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
              (user?.email === 'Chris.Barnes.2000@me.com' || user?.uid === '393uzPXnOdPW3CE3rdhmDMEldzm1') ? (
                <AdminPanel />
              ) : (
                <div className="min-h-screen pt-24 flex flex-col items-center justify-center p-4">
                  <div className="p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-200 dark:border-rose-800 flex items-center gap-3">
                    <ShieldAlert className="w-6 h-6" />
                    <div>
                      <h2 className="font-bold">Access Denied</h2>
                      <p className="text-xs">This workspace is restricted to platform administrators.</p>
                    </div>
                  </div>
                </div>
              )
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
      <Footer />
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
