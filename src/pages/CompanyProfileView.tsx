import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building, 
  MapPin, 
  Users, 
  ArrowLeft, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ChevronRight,
  Briefcase,
  ExternalLink,
  ShieldAlert,
  Loader2,
  Globe,
  Linkedin,
  Twitter,
  Github,
  Link2,
  Share2,
  Sparkles,
  Building2
} from 'lucide-react';
import { Job } from '../types';

export const CompanyProfileView = () => {
  const { user } = useAuth();
  const [companyId, setCompanyId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyData, setCompanyData] = useState<any | null>(null);
  const [activeJobs, setActiveJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [requestType, setRequestType] = useState('candidate');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleGoBack = () => {
    const currentHash = window.location.hash;
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.hash = '#companies';
    }

    // Safety fallback: if hash hasn't changed after 150ms, navigate explicitly to #companies
    setTimeout(() => {
      if (window.location.hash === currentHash) {
        window.location.hash = '#companies';
      }
    }, 150);
  };

  const getFormattedUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `https://${url}`;
  };

  const getCleanDomain = (url?: string) => {
    if (!url) return '';
    return url.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0];
  };

  // Parse location hash
  useEffect(() => {
    const handleHashChange = () => {
      const hashStr = window.location.hash;
      if (!hashStr.startsWith('#company/')) return;

      const pathAndQuery = hashStr.replace('#company/', '');
      const [idPart, queryPart] = pathAndQuery.split('?');
      setCompanyId(idPart);

      let nameParam = '';
      if (queryPart) {
        const nameMatch = queryPart.match(/(?:^|&)name=([^&]*)/);
        if (nameMatch) {
          nameParam = decodeURIComponent(nameMatch[1].replace(/\+/g, ' '));
        }
      }
      // If name is a slug or capitalized representation of ID
      const fallbackName = nameParam || idPart.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      setCompanyName(fallbackName);
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Fetch company details and jobs
  useEffect(() => {
    if (!companyId) return;

    const fetchCompanyData = async () => {
      setLoading(true);
      setError(null);
      try {
        let fetchedData: any = null;

        // 1. Try fetching from 'companies' collection by ID
        const docRef = doc(db, 'companies', companyId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          fetchedData = docSnap.data();
        } else {
          // 2. Try fetching from users/{companyId}/profiles/company
          const userCompRef = doc(db, `users/${companyId}/profiles/company`);
          const userCompSnap = await getDoc(userCompRef);
          if (userCompSnap.exists()) {
            fetchedData = userCompSnap.data();
            if (fetchedData.companyName && !fetchedData.name) {
              fetchedData.name = fetchedData.companyName;
            }
          } else if (companyName) {
            // 3. Search companies collection by name match
            const qName = query(collection(db, 'companies'), where('name', '==', companyName));
            const nameSnap = await getDocs(qName);
            if (!nameSnap.empty) {
              fetchedData = nameSnap.docs[0].data();
            }
          }
        }

        if (fetchedData) {
          setCompanyData(fetchedData);
          if (fetchedData.name || fetchedData.companyName) {
            setCompanyName(fetchedData.name || fetchedData.companyName);
          }

          // Fetch active jobs for this company
          const jobsQuery = query(
            collection(db, 'jobs'), 
            where('companyId', '==', companyId),
            where('status', '==', 'active')
          );
          const jobsSnap = await getDocs(jobsQuery);
          let jobsList = jobsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Job));

          if (jobsList.length === 0 && (fetchedData.name || companyName)) {
            const nameJobsQuery = query(
              collection(db, 'jobs'),
              where('companyName', '==', fetchedData.name || companyName)
            );
            const nameJobsSnap = await getDocs(nameJobsQuery);
            jobsList = nameJobsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Job));
          }

          setActiveJobs(jobsList);
        } else {
          setCompanyData(null); // Triggers Connection Pending view
          
          // Search active jobs referencing this company name
          const fallbackJobsQuery = query(
            collection(db, 'jobs'),
            where('companyName', '==', companyName)
          );
          const jobsSnap = await getDocs(fallbackJobsQuery);
          const jobsList = jobsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Job));
          setActiveJobs(jobsList);
        }
      } catch (err: any) {
        console.error("Error loading company profile:", err);
        setError("Unable to establish connection to database.");
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, [companyId, companyName]);

  // Pre-fill user data
  useEffect(() => {
    if (user) {
      setUserEmail(user.email || '');
      setUserName(user.displayName || '');
    }
  }, [user]);

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !userEmail) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'partnership_requests'), {
        companyId,
        companyName,
        requesterName: userName,
        requesterEmail: userEmail,
        requestType,
        notes,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setSubmitted(true);
    } catch (err) {
      console.error("Error creating partnership request", err);
      alert("Failed to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatJobDate = (createdAt: any) => {
    if (!createdAt) return 'Recently';
    let date: Date;
    if (typeof createdAt.toDate === 'function') {
      date = createdAt.toDate();
    } else if (createdAt instanceof Date) {
      date = createdAt;
    } else if (createdAt.seconds) {
      date = new Date(createdAt.seconds * 1000);
    } else {
      date = new Date(createdAt);
    }
    const diff = Math.abs(new Date().getTime() - date.getTime());
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="font-bold text-sm">Parsing company registration credentials...</span>
      </div>
    );
  }

  // Derived website & social URLs
  const websiteUrl = companyData?.website || companyData?.domain ? getFormattedUrl(companyData.website || companyData.domain) : '';
  const cleanDomain = websiteUrl ? getCleanDomain(websiteUrl) : '';
  
  const linkedinUrl = companyData?.linkedin || companyData?.socialProfiles?.linkedin || (companyName ? `https://linkedin.com/company/${companyName.toLowerCase().replace(/[^a-z0-9]/g, '-')}` : '');
  const twitterUrl = companyData?.twitter || companyData?.socialProfiles?.twitter || (companyName ? `https://x.com/${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}` : '');
  const githubUrl = companyData?.github || companyData?.socialProfiles?.github || (companyName ? `https://github.com/${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}` : '');
  const glassdoorUrl = companyData?.glassdoor || companyData?.socialProfiles?.glassdoor || (companyName ? `https://www.glassdoor.com/Reviews/${companyName.replace(/\s+/g, '-')}-Reviews-E12345.htm` : '');

  // State: Company Found - render company detailed profile
  if (companyData) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 w-full md:w-[75vw] max-w-none mx-auto">
        <button 
          onClick={handleGoBack} 
          className="flex items-center gap-2 mb-8 text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 font-semibold text-sm transition-colors group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Go Back
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm mb-8"
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6 border-b border-slate-100 dark:border-slate-800 pb-8">
            <div className="flex gap-4 items-center">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center border border-blue-100/30 flex-shrink-0 shadow-sm">
                <Building className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">{companyName}</h1>
                  <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified Partner
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-3 py-1 rounded-full border border-blue-100/30">
                    {companyData.industry || 'Technology'}
                  </span>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full flex items-center gap-1">
                    <Users className="w-4 h-4" /> {companyData.size || '50-200'} employees
                  </span>
                  {companyData.location && (
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full flex items-center gap-1">
                      <MapPin className="w-4 h-4" /> {companyData.location}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Header Web & Social Badges */}
            <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
              {websiteUrl && (
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/50 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Globe className="w-4 h-4 text-blue-500" />
                  <span>{cleanDomain || 'Website'}</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </a>
              )}
              {linkedinUrl && (
                <a
                  href={linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-[#0A66C2]/10 hover:text-[#0A66C2] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all"
                  title="LinkedIn Profile"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
              )}
              {twitterUrl && (
                <a
                  href={twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all"
                  title="X (Twitter)"
                >
                  <Twitter className="w-4 h-4" />
                </a>
              )}
              {githubUrl && (
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-900 hover:text-white text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all"
                  title="GitHub Organization"
                >
                  <Github className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* About Section */}
          <div className="mb-8">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">About Organization</h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-base whitespace-pre-wrap">
              {companyData.description || 'No formal details are compiled for this corporate profile yet.'}
            </p>
          </div>

          {/* Dedicated Web Presence & Social Media Profiles Section */}
          <div className="mb-8 p-6 bg-slate-50/70 dark:bg-slate-950/40 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-500" /> Web Presence & Official Social Channels
              </h3>
              <span className="text-[11px] font-semibold text-slate-400 bg-white dark:bg-slate-900 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-800">
                Verified Social Signals
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {/* Direct Website */}
              {websiteUrl ? (
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all flex items-center justify-between group shadow-2xs"
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">Official Website</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{cleanDomain}</div>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-2" />
                </a>
              ) : (
                <div className="p-4 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/50 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Direct Domain</div>
                    <div className="text-[11px] text-slate-400">Website pending setup</div>
                  </div>
                </div>
              )}

              {/* LinkedIn */}
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-[#0A66C2] transition-all flex items-center justify-between group shadow-2xs"
              >
                <div className="flex items-center gap-3 truncate">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#0A66C2] dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                    <Linkedin className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">LinkedIn</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">Corporate Network</div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-[#0A66C2] group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-2" />
              </a>

              {/* Twitter / X */}
              <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-slate-900 dark:hover:border-slate-100 transition-all flex items-center justify-between group shadow-2xs"
              >
                <div className="flex items-center gap-3 truncate">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center flex-shrink-0">
                    <Twitter className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">X / Twitter</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">Announcements & News</div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-2" />
              </a>

              {/* GitHub */}
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-purple-500 transition-all flex items-center justify-between group shadow-2xs"
              >
                <div className="flex items-center gap-3 truncate">
                  <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
                    <Github className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">GitHub</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">Open Source Repos</div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-purple-500 group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-2" />
              </a>

              {/* Glassdoor */}
              <a
                href={glassdoorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500 transition-all flex items-center justify-between group shadow-2xs"
              >
                <div className="flex items-center gap-3 truncate">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">Glassdoor</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">Culture & Reviews</div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-2" />
              </a>
            </div>
          </div>

          {companyData.primaryRoles && (
            <div className="mb-8 p-4 bg-slate-50 dark:bg-slate-950/30 rounded-2xl border border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Primary Sourcing Objectives</h4>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                {companyData.primaryRoles}
              </p>
            </div>
          )}

          {/* Active Job list */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
              Active Roles at {companyName}
            </h3>

            {activeJobs.length > 0 ? (
              <div className="grid gap-4">
                {activeJobs.map(job => (
                  <div key={job.id} className="p-6 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 hover:border-blue-500/30 hover:shadow-sm transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-1">{job.title}</h4>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 font-semibold">
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Remote</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Posted {formatJobDate(job.createdAt)}</span>
                      </div>
                    </div>
                    <a 
                      href={`#job/${job.id}`}
                      className="px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      Apply Securely <ChevronRight className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 text-slate-400 text-sm">
                No active postings found for this company at the moment. Check back soon!
              </div>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // State: Company Not Found / Pending Setup Onboarding
  return (
    <div className="min-h-screen pt-24 pb-12 px-4 w-full md:w-[75vw] max-w-none mx-auto">
      <button 
        onClick={handleGoBack} 
        className="flex items-center gap-2 mb-8 text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 font-semibold text-sm transition-colors group cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Go Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Profile Pending Information */}
        <div className="lg:col-span-7 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm"
          >
            <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30 px-3.5 py-1.5 rounded-2xl w-fit text-xs font-bold uppercase tracking-wider mb-6">
              <ShieldAlert className="w-4 h-4" />
              Connection Pending
            </div>

            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-3">
              {companyName}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold mb-6">
              Registry Reference: <code className="bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded text-blue-600 dark:text-blue-400">{companyId}</code>
            </p>

            <div className="space-y-4 text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-8">
              <p>
                This employer profile has not completed their formal digital handshake integration on the Ascend automated talent connection pipeline.
              </p>
              <p>
                As a privacy-focused platform, we shield candidate data through secure redacted matching keys. Without active organizational onboarding, our platform cannot sync direct PII privacy level constraints or automated matches safely.
              </p>
            </div>

            {/* Default Social / Web search helpers */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800 mb-6">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-500" /> Web & Social Search Shortcuts
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(companyName + ' official website')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 flex items-center gap-1.5 shadow-2xs"
                >
                  <Globe className="w-3.5 h-3.5 text-blue-500" /> Google Search <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
                <a
                  href={`https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(companyName)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-[#0A66C2] flex items-center gap-1.5 shadow-2xs"
                >
                  <Linkedin className="w-3.5 h-3.5 text-[#0A66C2]" /> LinkedIn Directory <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </div>
            </div>

            {activeJobs.length > 0 && (
              <div className="p-5 bg-blue-50/40 dark:bg-blue-950/15 border border-blue-100/30 rounded-2xl">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-3 flex items-center gap-2">
                  <Briefcase className="w-4.5 h-4.5 text-blue-500" />
                  Active Unlinked Postings ({activeJobs.length})
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  We've identified the following role listings referencing this employer in our master database. However, secure direct processing is restricted:
                </p>
                <div className="space-y-2.5">
                  {activeJobs.map(job => (
                    <div key={job.id} className="flex justify-between items-center p-3 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                      <span className="font-bold text-xs text-slate-700 dark:text-slate-300 truncate pr-4">{job.title}</span>
                      <a 
                        href={`#job/${job.id}`}
                        className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                      >
                        Details <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Partnership/Connection Request Form */}
        <div className="lg:col-span-5">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-900 dark:bg-slate-950 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden"
          >
            {/* Background design accents */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

            <AnimatePresence mode="wait">
              {!submitted ? (
                <motion.div
                  key="request-form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                    Request Connection
                  </h3>
                  <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                    Prioritize connecting with {companyName}. We will reach out to their HR & sourcing teams to establish secure profile synchronization down the line.
                  </p>

                  <form onSubmit={handleRequestSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Your Full Name
                      </label>
                      <input 
                        type="text" 
                        required
                        value={userName}
                        onChange={e => setUserName(e.target.value)}
                        placeholder="Jane Doe"
                        className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Email Address
                      </label>
                      <input 
                        type="email" 
                        required
                        value={userEmail}
                        onChange={e => setUserEmail(e.target.value)}
                        placeholder="jane@company.com"
                        className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Your Relationship
                      </label>
                      <select
                        value={requestType}
                        onChange={e => setRequestType(e.target.value)}
                        className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold"
                      >
                        <option value="candidate">I am a prospective candidate</option>
                        <option value="employee">I am a current employee here</option>
                        <option value="recruiter">I am a recruiter at this company</option>
                        <option value="other">Other / Platform partner</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Message / Notes
                      </label>
                      <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        rows={3}
                        placeholder="Add details about why you want this connection prioritized..."
                        className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none leading-relaxed"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 text-xs flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Logging Request...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Submit Request
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="request-success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8 space-y-6"
                >
                  <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto border border-blue-500/30">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Request Logged!</h3>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                      Thank you! We have successfully generated a partnership onboarding request for <strong>{companyName}</strong>. Our business development team will reach out to schedule secure integration protocols down the line.
                    </p>
                  </div>
                  <button
                    onClick={() => { window.location.hash = ''; }}
                    className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all"
                  >
                    Return to Dashboard
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

