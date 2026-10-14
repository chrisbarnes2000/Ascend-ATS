import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { motion } from 'motion/react';
import { 
  UserCircle, 
  Users, 
  Briefcase, 
  ShieldAlert, 
  CheckCircle2, 
  Loader2 
} from 'lucide-react';
import { doc, setDoc, serverTimestamp, onSnapshot, collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

// Pages
import { JobSeekerDashboard } from '../../pages/JobSeekerDashboard';
import { ProfileWizard } from '../../pages/ProfileWizard';
import { CompanyWizard } from '../../pages/CompanyWizard';
import { ProfileEditor } from '../../pages/ProfileEditor';
import { EmployerSourcing } from '../../pages/EmployerSourcing';
import { EmployerDashboard } from '../../pages/EmployerDashboard';
import { PublicProfile } from '../../pages/PublicProfile';
import { JobDescription } from '../../pages/JobDescription';
import { JobSeekerAnalytics } from '../../pages/JobSeekerAnalytics';
import { CompanyDirectory } from '../../pages/CompanyDirectory';
import { CompanyProfileView } from '../../pages/CompanyProfileView';
import { CompanyManagement } from '../../pages/CompanyManagement';
import { LandingPage } from '../../pages/LandingPage';
import AdminPanel from '../../pages/AdminPanel';
import { LegalPage } from '../../pages/LegalPage';
import { AffiliatesPage } from '../../pages/AffiliatesPage';
import { RapportVersePage } from '../../pages/RapportVersePage';
import { ProfileRestartPrompt } from '../profile/ProfileRestartPrompt';

export const RegistrationFlow = ({ initialRequestMode = false }: { initialRequestMode?: boolean }) => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } = useAuth();
  const [selectedType, setSelectedType] = useState<'jobSeeker' | 'recruiter' | 'companyOwner' | 'company' | null>(initialRequestMode ? 'companyOwner' : null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>(initialRequestMode ? 'signup' : 'login');
  const [isRequestMode, setIsRequestMode] = useState(initialRequestMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [requestSource] = useState('LinkedIn');
  const [requestNote, setRequestNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
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
        if (urlRole === 'recruiter' || urlInvite.toUpperCase().startsWith('REC-')) {
          setSelectedType('recruiter');
        } else {
          setSelectedType('companyOwner');
        }
        setAuthMode('signup');
        setIsRequestMode(false);
      } else if (urlRole) {
        if (urlRole === 'recruiter') setSelectedType('recruiter');
        else if (urlRole === 'companyOwner' || urlRole === 'company') setSelectedType('companyOwner');
        else if (urlRole === 'jobSeeker') setSelectedType('jobSeeker');
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
      if (isRequestMode) {
        if (!email) throw new Error("Please provide your professional email.");
        await addDoc(collection(db, 'partner_requests'), {
          email,
          source: requestSource,
          details: requestNote,
          status: 'pending',
          createdAt: serverTimestamp()
        });
        setSuccess("Access request sent! Our team will review your credentials and contact you shortly.");
        setIsRequestMode(false);
        setEmail('');
        setRequestNote('');
      } else if (authMode === 'signup') {
        if (!selectedType) throw new Error("Please select an account type to join.");
        await signUpWithEmail(email, password, selectedType, inviteCode);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
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
        className="max-w-md w-full text-left"
      >
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black tracking-tight mb-3 text-slate-900 dark:text-white">
            {authMode === 'signup' ? 'Create your Account' : 'Welcome Back'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-xs">
            {authMode === 'signup' 
              ? 'Join the next generation of intelligent applicant tracking.' 
              : 'Sign in to access your dashboard and active pipelines.'}
          </p>
        </div>
        
        {error && (
          <div className="mb-6 p-5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-3xl border border-rose-200 dark:border-rose-800/50 text-xs font-bold flex items-start gap-4 shadow-sm">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-3xl border border-emerald-200 dark:border-emerald-800/50 text-xs font-bold flex items-start gap-4 shadow-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{success}</p>
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
          {authMode === 'signup' && (
            <div className="p-2 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <div className="grid grid-cols-3 gap-2">
                <button 
                  type="button"
                  onClick={() => setSelectedType('jobSeeker')}
                  className={`p-3 rounded-2xl transition-all flex flex-col items-center gap-1.5 border-2 text-center cursor-pointer ${
                    selectedType === 'jobSeeker' 
                      ? 'border-blue-500 bg-white dark:bg-slate-900 shadow-sm' 
                      : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                >
                  <UserCircle className={`w-5 h-5 ${selectedType === 'jobSeeker' ? 'text-blue-500' : ''}`} />
                  <span className="text-[10px] font-black uppercase tracking-tight">Job Seeker</span>
                </button>

                <button 
                  type="button"
                  onClick={() => setSelectedType('recruiter')}
                  className={`p-3 rounded-2xl transition-all flex flex-col items-center gap-1.5 border-2 text-center cursor-pointer ${
                    selectedType === 'recruiter' 
                      ? 'border-indigo-500 bg-white dark:bg-slate-900 shadow-sm' 
                      : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                >
                  <Users className={`w-5 h-5 ${selectedType === 'recruiter' ? 'text-indigo-500' : ''}`} />
                  <span className="text-[10px] font-black uppercase tracking-tight">Recruiter</span>
                </button>

                <button 
                  type="button"
                  onClick={() => setSelectedType('companyOwner')}
                  className={`p-3 rounded-2xl transition-all flex flex-col items-center gap-1.5 border-2 text-center cursor-pointer ${
                    selectedType === 'companyOwner' || selectedType === 'company'
                      ? 'border-emerald-500 bg-white dark:bg-slate-900 shadow-sm' 
                      : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                >
                  <Briefcase className={`w-5 h-5 ${selectedType === 'companyOwner' || selectedType === 'company' ? 'text-emerald-500' : ''}`} />
                  <span className="text-[10px] font-black uppercase tracking-tight">Company Owner</span>
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
                        className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-500 transition-colors cursor-pointer"
                      >
                        Forgot Password?
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

              {authMode === 'signup' && (
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 px-1">
                    Partner Activation Token (Optional)
                  </label>
                  <input 
                    type="text"
                    value={inviteCode}
                    onChange={e => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="e.g. REC-99A12B"
                    className="w-full px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 mt-4"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>{authMode === 'signup' ? 'Create Account' : 'Sign In'}</span>
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
              <button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-2xl transition-all cursor-pointer"
              >
                Sign in with Google
              </button>

              <div className="mt-4 text-xs font-semibold text-slate-500">
                {authMode === 'login' ? (
                  <span>Need an account? <button onClick={() => setAuthMode('signup')} className="text-indigo-600 font-bold hover:underline cursor-pointer">Sign Up</button></span>
                ) : (
                  <span>Already registered? <button onClick={() => setAuthMode('login')} className="text-indigo-600 font-bold hover:underline cursor-pointer">Log In</button></span>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export const AppRoutes = () => {
  const { user, appUser, loading } = useAuth();
  const [hash, setHash] = useState(window.location.hash || '');
  const [profileData, setProfileData] = useState<any>(null);
  const [restartPromptOpen, setRestartPromptOpen] = useState(false);

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash || '');
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (!user) {
      setProfileData(null);
      return;
    }
    const isCompany = ['company', 'recruiter', 'staffingFirm', 'companyOwner'].includes(appUser?.accountType || '');
    const path = isCompany ? `users/${user.uid}/profiles/company` : `users/${user.uid}/profiles/main`;
    
    const unsubscribe = onSnapshot(doc(db, path), (docSnap) => {
      if (docSnap.exists()) {
        setProfileData(docSnap.data());
      }
    });

    return unsubscribe;
  }, [user, appUser?.accountType]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  const routePath = hash.split('?')[0].replace('#', '');
  const isCompany = ['company', 'recruiter', 'staffingFirm', 'companyOwner'].includes(appUser?.accountType || '');
  const isAdmin = user?.email === 'Chris.Barnes.2000@me.com' || user?.uid === '393uzPXnOdPW3CE3rdhmDMEldzm1' || appUser?.accountType === 'admin';

  // Unauthenticated Views
  if (!user) {
    if (routePath === 'login') return <RegistrationFlow initialRequestMode={false} />;
    if (routePath === 'signup') return <RegistrationFlow initialRequestMode={false} />;
    if (routePath === 'partner-request') return <RegistrationFlow initialRequestMode={true} />;
    if (routePath === 'legal') return <LegalPage />;
    if (routePath === 'affiliates') return <AffiliatesPage />;
    if (routePath === 'rapportverse') return <RapportVersePage />;
    if (routePath.startsWith('profile/')) return <PublicProfile profileId={routePath.replace('profile/', '')} />;
    if (routePath.startsWith('job/')) return <JobDescription jobId={routePath.replace('job/', '')} />;
    if (routePath.startsWith('company/')) return <CompanyProfileView companyId={routePath.replace('company/', '')} />;
    if (routePath === 'companies') return <CompanyDirectory />;
    return <LandingPage />;
  }

  // Authenticated Hash Views
  if (routePath === 'legal') return <LegalPage />;
  if (routePath === 'affiliates') return <AffiliatesPage />;
  if (routePath === 'rapportverse') return <RapportVersePage />;
  if (routePath.startsWith('profile/')) return <PublicProfile profileId={routePath.replace('profile/', '')} />;
  if (routePath.startsWith('job/')) return <JobDescription jobId={routePath.replace('job/', '')} />;
  if (routePath.startsWith('company/')) return <CompanyProfileView companyId={routePath.replace('company/', '')} />;
  if (routePath === 'companies') return <CompanyDirectory />;
  if (routePath === 'admin' && isAdmin) return <AdminPanel />;

  // Specific Authenticated Feature Views
  if (routePath === 'sourcing') return <EmployerSourcing />;
  if (routePath === 'company-manage') return <CompanyManagement />;
  if (routePath === 'company-wizard') return <CompanyWizard onComplete={() => window.location.hash = '#employer'} />;
  if (routePath === 'wizard') return <ProfileWizard onComplete={() => window.location.hash = '#seeker'} />;
  if (routePath === 'editor') return <ProfileEditor />;
  if (routePath === 'analytics') return <JobSeekerAnalytics />;

  // Default Account Landing Dashboards
  if (isCompany) {
    return <EmployerDashboard />;
  }

  return (
    <>
      <JobSeekerDashboard />
      {restartPromptOpen && (
        <ProfileRestartPrompt
          onContinueSetup={() => {
            setRestartPromptOpen(false);
            window.location.hash = '#wizard';
          }}
        />
      )}
    </>
  );
};
