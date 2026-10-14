import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { 
  TrendingUp, 
  Sun, 
  Monitor, 
  Moon, 
  ChevronDown, 
  LayoutDashboard, 
  User, 
  Edit3, 
  Building, 
  Search, 
  Plus, 
  Eye, 
  LogOut, 
  Briefcase, 
  Terminal, 
  FileText
} from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';

export const Navbar = () => {
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

  const isRecruiter = appUser?.accountType === 'recruiter' || appUser?.staffingRole === 'recruiter';
  const isCompanyOwner = appUser?.accountType === 'company' || appUser?.accountType === 'companyOwner';
  const isCompany = ['company', 'recruiter', 'staffingFirm', 'companyOwner'].includes(appUser?.accountType || '');
  const isAdmin = user?.email === 'Chris.Barnes.2000@me.com' || user?.uid === '393uzPXnOdPW3CE3rdhmDMEldzm1' || appUser?.accountType === 'admin';
  
  const displayName = isCompany 
    ? (profileData?.companyName || appUser?.companyName || appUser?.email?.split('@')[0] || 'Employer')
    : (profileData?.personalInfo?.preferredName || profileData?.personalInfo?.firstName || appUser?.email?.split('@')[0] || 'Candidate');
  
  const displayRole = isAdmin
    ? 'System Administrator'
    : isCompanyOwner
    ? 'Company Owner'
    : isRecruiter
    ? 'Recruiter'
    : (profileData?.targetRole || 'Job Seeker');

  const progress = isCompany ? getCompanyCompleteness() : getCompleteness();

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md z-50">
      <div className="w-full md:w-[75vw] max-w-none mx-auto px-4 h-full flex items-center justify-between">
        <a 
          href={isAdmin ? "#admin" : isCompany ? "#employer" : user ? "#seeker" : "#"} 
          className="flex items-center gap-2"
        >
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
                className="flex items-center gap-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800/80 p-1.5 pr-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 transition-all shadow-sm group cursor-pointer"
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
                  <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                  
                  <div className="absolute right-0 top-12 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 z-50 mt-2 text-left">
                    <div className="mb-5 pb-5 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3.5 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white font-extrabold flex items-center justify-center text-base shadow-lg shadow-indigo-150 dark:shadow-none">
                          {displayName.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                            {displayName}
                          </h4>
                          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium truncate">
                            {user.email}
                          </p>
                          <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
                            {displayRole}
                          </span>
                        </div>
                      </div>

                      {/* Profile Completeness Bar */}
                      <div>
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                          <span>{isCompany ? 'Company Profile Health' : 'Profile Health'}</span>
                          <span className="text-indigo-600 dark:text-indigo-400">{progress}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Menu Navigation Links */}
                    <div className="space-y-1">
                      {isCompany ? (
                        <>
                          <a 
                            href="#employer" 
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                          >
                            <LayoutDashboard className="w-4 h-4 text-slate-400" />
                            <span>Employer Dashboard</span>
                          </a>

                          <a 
                            href="#company-manage" 
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                          >
                            <Building className="w-4 h-4 text-slate-400" />
                            <span>Manage Company Directory</span>
                          </a>

                          <a 
                            href="#company-wizard" 
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                          >
                            <Edit3 className="w-4 h-4 text-slate-400" />
                            <span>Edit Employer Profile</span>
                          </a>

                          <a 
                            href="#sourcing" 
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                          >
                            <Search className="w-4 h-4 text-slate-400" />
                            <span>Source Candidates</span>
                          </a>
                        </>
                      ) : (
                        <>
                          <a 
                            href="#seeker" 
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                          >
                            <LayoutDashboard className="w-4 h-4 text-slate-400" />
                            <span>Candidate Dashboard</span>
                          </a>

                          <a 
                            href={`#profile/${user.uid}`} 
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                          >
                            <Eye className="w-4 h-4 text-slate-400" />
                            <span>View Public Profile</span>
                          </a>

                          <a 
                            href="#editor" 
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                          >
                            <Edit3 className="w-4 h-4 text-slate-400" />
                            <span>Edit Profile & Experience</span>
                          </a>

                          <a 
                            href="#analytics" 
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                          >
                            <TrendingUp className="w-4 h-4 text-slate-400" />
                            <span>Application Analytics</span>
                          </a>
                        </>
                      )}

                      <a 
                        href="#companies" 
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                      >
                        <Building className="w-4 h-4 text-slate-400" />
                        <span>Company Directory</span>
                      </a>

                      <a 
                        href="#affiliates" 
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                      >
                        <Briefcase className="w-4 h-4 text-slate-400" />
                        <span>Partner & Referral Kit</span>
                      </a>

                      {isAdmin && (
                        <a 
                          href="#admin" 
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors font-bold"
                        >
                          <Terminal className="w-4 h-4 text-purple-500" />
                          <span>Admin Control Center</span>
                        </a>
                      )}

                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors mt-2 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>Sign Out</span>
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
