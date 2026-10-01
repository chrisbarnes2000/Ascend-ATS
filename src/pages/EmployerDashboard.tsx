import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  TrendingUp, 
  Filter, 
  Phone, 
  CheckCircle2, 
  Clock, 
  Building, 
  Eye, 
  Check, 
  X, 
  Send, 
  MessageSquare, 
  Search, 
  Sparkles, 
  ExternalLink, 
  ArrowUpRight, 
  FileText,
  Briefcase,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  HelpCircle,
  Link,
  DollarSign
} from 'lucide-react';
import { collection, query, onSnapshot, doc, getDoc, setDoc, getDocs, updateDoc, orderBy, serverTimestamp, arrayUnion, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../hooks/useAuth';
import { EmployerSourcing } from './EmployerSourcing';
import { CompanyManagement } from './CompanyManagement';
import { JobRequisitionEditor } from '../components/JobRequisitionEditor';
import { GovJobsBridge } from '../components/GovJobsBridge';
import { Edit3, Globe } from 'lucide-react';

interface ApplicationRecord {
  id: string;
  jobId: string;
  seekerId: string;
  companyId?: string;
  companyName?: string;
  jobTitle?: string;
  status: 'applied' | 'viewed' | 'interviewing' | 'offered' | 'rejected' | string;
  appliedAt?: any;
  seekerName?: string;
  seekerEmail?: string;
  seekerHeadline?: string;
  matchPercentage?: number;
  method?: string;
  transitionExplanation?: string;
  advisoryReport?: any;
  communications?: Array<{ sender: string; text: string; timestamp: any }>;
}

export const EmployerDashboard = () => {
  const { user, appUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'pipeline' | 'sourcing' | 'requisitions' | 'company' | 'govbridge'>('pipeline');
  
  // Real-time Applications State
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState<ApplicationRecord | null>(null);

  // Recruiter Company Profile & Association State
  const [recruiterCompany, setRecruiterCompany] = useState<{ companyName: string; companyId: string; claimedCompanyId?: string }>({
    companyName: '',
    companyId: ''
  });
  const [companyFilterMode, setCompanyFilterMode] = useState<'my-company' | 'all'>('my-company');
  const [showClaimCompanyModal, setShowClaimCompanyModal] = useState(false);
  const [availableCompaniesList, setAvailableCompaniesList] = useState<Array<{ name: string; id: string }>>([]);
  const [customClaimName, setCustomClaimName] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);
  
  // Recruiter Message / Rationale State inside Modal
  const [recruiterNote, setRecruiterNote] = useState('');
  const [communicationCategory, setCommunicationCategory] = useState<'general' | 'offer_rationale' | 'info_request' | 'interview_notes'>('general');
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Load Recruiter Company Profile and System Companies for Claiming
  useEffect(() => {
    if (!user) return;
    const fetchCompanyData = async () => {
      try {
        // 1. Fetch User's Company Profile
        const profileRef = doc(db, `users/${user.uid}/profiles/company`);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          const pData = profileSnap.data();
          setRecruiterCompany({
            companyName: pData.companyName || '',
            companyId: pData.companyId || user.uid,
            claimedCompanyId: pData.claimedCompanyId || ''
          });
        } else if (appUser?.companyName) {
          setRecruiterCompany({
            companyName: appUser.companyName,
            companyId: user.uid
          });
        }

        // 2. Aggregate registered companies for claiming selector
        const jobsSnap = await getDocs(collection(db, 'jobs'));
        const compsMap = new Map<string, string>();
        jobsSnap.forEach(d => {
          const data = d.data();
          if (data.companyName) {
            const compId = data.companyId || data.companyName.toLowerCase().replace(/[^a-z0-9]/g, '-');
            compsMap.set(data.companyName, compId);
          }
        });

        // Default seed companies
        if (!compsMap.has('Acme Corp')) compsMap.set('Acme Corp', 'acme-corp');
        if (!compsMap.has('CloudScale Infrastructure')) compsMap.set('CloudScale Infrastructure', 'cloudscale');
        if (!compsMap.has('General Hospital')) compsMap.set('General Hospital', 'general-hospital');
        if (!compsMap.has('NextGen Apps')) compsMap.set('NextGen Apps', 'nextgen-apps');
        if (!compsMap.has('BioHealth Labs')) compsMap.set('BioHealth Labs', 'biohealth');

        setAvailableCompaniesList(Array.from(compsMap.entries()).map(([name, id]) => ({ name, id })));
      } catch (err) {
        console.error("Error loading recruiter company profile:", err);
      }
    };

    fetchCompanyData();
  }, [user, appUser]);

  // Handle Recruiter Claiming / Associating a Company
  const handleClaimCompany = async (cName: string, cId?: string) => {
    if (!user || !cName.trim()) return;
    setIsClaiming(true);
    try {
      const compId = cId || cName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const profileRef = doc(db, `users/${user.uid}/profiles/company`);
      await setDoc(profileRef, {
        companyName: cName.trim(),
        companyId: user.uid,
        claimedCompanyId: compId,
        updatedAt: serverTimestamp()
      }, { merge: true });

      setRecruiterCompany({
        companyName: cName.trim(),
        companyId: user.uid,
        claimedCompanyId: compId
      });

      setSuccessToast(`Successfully linked account to "${cName.trim()}"!`);
      setTimeout(() => setSuccessToast(null), 3000);
      setShowClaimCompanyModal(false);
      setCompanyFilterMode('my-company');
    } catch (err) {
      console.error("Failed to claim company:", err);
      alert("Failed to associate company profile. Please try again.");
    } finally {
      setIsClaiming(false);
    }
  };

  // Real-time Firestore Listener
  useEffect(() => {
    setLoading(true);
    // Query applications ordered by appliedAt descending
    const q = query(
      collection(db, 'applications'),
      orderBy('appliedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs: ApplicationRecord[] = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      } as ApplicationRecord));

      setApplications(docs);
      setLoading(false);
    }, (err) => {
      console.error("Error subscribing to applications:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Staffing Invitation Acceptance Logic
  useEffect(() => {
    const handleInvitation = async () => {
      const params = new URLSearchParams(window.location.search);
      const inviteCode = params.get('invite');
      if (inviteCode && user) {
        try {
          const inviteSnap = await getDocs(query(collection(db, 'staffing_invitations'), where('inviteCode', '==', inviteCode), where('status', '==', 'pending')));
          if (!inviteSnap.empty) {
            const inviteDoc = inviteSnap.docs[0];
            const inviteData = inviteDoc.data();
            await updateDoc(doc(db, 'users', user.uid), {
              accountType: inviteData.role === 'recruiter' ? 'recruiter' : 'staffingFirm',
              staffingFirmName: inviteData.targetFirmName,
              staffingRole: inviteData.role,
              profileCompleted: false 
            });
            await updateDoc(doc(db, 'staffing_invitations', inviteDoc.id), {
              status: 'accepted',
              acceptedByUid: user.uid,
              acceptedAt: serverTimestamp()
            });
            setSuccessToast(`Welcome to ${inviteData.targetFirmName}! Your account has been upgraded to ${inviteData.role}.`);
            window.location.search = ''; 
          }
        } catch (err) {
          console.error("Failed to process invitation:", err);
        }
      }
    };
    handleInvitation();
  }, [user]);

  // 6-Second Auto-Mark as Viewed Timer when inspecting candidate profile / application details
  useEffect(() => {
    if (!selectedApp || selectedApp.status !== 'applied') return;

    const timer = setTimeout(() => {
      handleUpdateStatus(selectedApp.id, 'viewed');
      setSuccessToast("Application automatically marked as 'Viewed' after 6s of profile inspection.");
      setTimeout(() => setSuccessToast(null), 3000);
    }, 6000);

    return () => clearTimeout(timer);
  }, [selectedApp?.id, selectedApp?.status]);

  // Handle Application Status Progression & Category Messaging
  const handleUpdateStatus = async (appId: string, newStatus: string, noteText?: string, category = communicationCategory) => {
    setUpdatingStatusId(appId);
    try {
      const appRef = doc(db, 'applications', appId);
      const updatePayload: any = {
        status: newStatus,
        lastReviewedAt: serverTimestamp()
      };

      let formattedNote = (noteText || '').trim();
      if (formattedNote) {
        if (category === 'offer_rationale') {
          formattedNote = `[Offer Terms & Rationale] ${formattedNote}`;
        } else if (category === 'info_request') {
          formattedNote = `[Information Request from Recruiter] ${formattedNote}`;
        } else if (category === 'interview_notes') {
          formattedNote = `[Interview Instructions] ${formattedNote}`;
        }

        updatePayload.communications = arrayUnion({
          sender: recruiterCompany.companyName || 'Employer Talent Team',
          text: formattedNote,
          timestamp: new Date().toISOString()
        });
      }

      await updateDoc(appRef, updatePayload);

      setSuccessToast(`Application status updated to "${newStatus.toUpperCase()}"`);
      setTimeout(() => setSuccessToast(null), 3000);

      // Keep selectedApp in sync if open
      if (selectedApp && selectedApp.id === appId) {
        setSelectedApp(prev => prev ? { 
          ...prev, 
          status: newStatus,
          communications: formattedNote ? [...(prev.communications || []), { sender: recruiterCompany.companyName || 'Employer Talent Team', text: formattedNote, timestamp: new Date().toISOString() }] : prev.communications
        } : null);
      }
      setRecruiterNote('');
    } catch (err) {
      console.error("Failed to update application status:", err);
      alert("Failed to update status. Please try again.");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // Direct Message Sending without Status Change
  const handleSendDirectMessage = async () => {
    if (!selectedApp || !recruiterNote.trim()) return;
    try {
      let formattedText = recruiterNote.trim();
      if (communicationCategory === 'offer_rationale') {
        formattedText = `[Offer Adjustment / Rationale] ${formattedText}`;
      } else if (communicationCategory === 'info_request') {
        formattedText = `[Information Request] ${formattedText}`;
      }

      const appRef = doc(db, 'applications', selectedApp.id);
      await updateDoc(appRef, {
        communications: arrayUnion({
          sender: recruiterCompany.companyName || 'Employer Talent Team',
          text: formattedText,
          timestamp: new Date().toISOString()
        })
      });

      setSelectedApp(prev => prev ? {
        ...prev,
        communications: [...(prev.communications || []), { sender: recruiterCompany.companyName || 'Employer Talent Team', text: formattedText, timestamp: new Date().toISOString() }]
      } : null);

      setRecruiterNote('');
      setSuccessToast("Message sent to candidate!");
      setTimeout(() => setSuccessToast(null), 2500);
    } catch (err) {
      console.error("Failed to send message to candidate:", err);
      alert("Failed to send message.");
    }
  };

  // Restrict application list to current company or claimed company profile unless Admin / All Pool selected
  const isAdmin = appUser?.role === 'admin';
  const companyApplications = applications.filter(app => {
    if (isAdmin || companyFilterMode === 'all') return true;

    const recruiterCompName = (recruiterCompany.companyName || '').toLowerCase().trim();
    const appCompName = (app.companyName || '').toLowerCase().trim();
    const appCompId = app.companyId;

    // Direct User ID match (jobs posted directly by this recruiter account)
    if (appCompId === user?.uid) return true;

    // Claimed Company ID match
    if (recruiterCompany.claimedCompanyId && appCompId === recruiterCompany.claimedCompanyId) return true;

    // Company Name match
    if (recruiterCompName && appCompName && appCompName === recruiterCompName) return true;

    // Fallback if recruiter has not specified a company name yet
    if (!recruiterCompName && (appCompId === 'company' || appCompId === 'general-hospital' || appCompId === 'cloudscale' || appCompId === 'acme-corp')) {
      return true;
    }

    return false;
  });

  // Filter applications
  const filteredApps = companyApplications.filter(app => {
    // Status Filter
    if (statusFilter !== 'all' && app.status !== statusFilter) {
      return false;
    }
    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = (app.seekerName || 'Candidate').toLowerCase();
      const email = (app.seekerEmail || '').toLowerCase();
      const title = (app.jobTitle || '').toLowerCase();
      const company = (app.companyName || '').toLowerCase();
      return name.includes(q) || email.includes(q) || title.includes(q) || company.includes(q);
    }
    return true;
  });

  // Calculate ATS Stats
  const countTotal = companyApplications.length;
  const countApplied = companyApplications.filter(a => a.status === 'applied').length;
  const countViewed = companyApplications.filter(a => a.status === 'viewed').length;
  const countInterviewing = companyApplications.filter(a => a.status === 'interviewing').length;
  const countOffered = companyApplications.filter(a => a.status === 'offered').length;

  const pipelineStats = [
    { label: 'New Applied', count: countApplied, icon: Filter, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/40' },
    { label: 'Under Review', count: countViewed, icon: Eye, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/40' },
    { label: 'Interviewing', count: countInterviewing, icon: Clock, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/40' },
    { label: 'Offers Extended', count: countOffered, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
  ];

  const formatTimeAgo = (ts: any) => {
    if (!ts) return 'Recently';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 2) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'applied':
        return <span className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1"><Filter className="w-3 h-3" /> New Applied</span>;
      case 'viewed':
        return <span className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1"><Eye className="w-3 h-3" /> Under Review</span>;
      case 'interviewing':
        return <span className="bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1"><Clock className="w-3 h-3" /> Interviewing</span>;
      case 'offered':
        return <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Offer Extended</span>;
      case 'rejected':
        return <span className="bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1"><X className="w-3 h-3" /> Passed</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-2.5 py-1 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 w-full md:w-[75vw] max-w-none mx-auto">
      {/* Toast Notification */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-8 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl font-bold text-xs flex items-center gap-2 border border-emerald-400"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">Recruitment Workspace</h1>
            <span className="bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Real-Time ATS
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Review live candidate submissions, manage pipeline stages, and advance applications.</p>
        </div>
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto max-w-full">
          <button 
            onClick={() => setActiveTab('pipeline')}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'pipeline' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
          >
            <Users className="w-4 h-4" /> ATS Pipeline ({countTotal})
          </button>
          <button 
            onClick={() => setActiveTab('sourcing')}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors whitespace-nowrap ${activeTab === 'sourcing' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
          >
            Talent Search
          </button>
          <button 
            onClick={() => setActiveTab('requisitions')}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'requisitions' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
          >
            <Edit3 className="w-4 h-4 text-indigo-500" /> Requisitions & Audits
          </button>
          <button 
            onClick={() => setActiveTab('govbridge')}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'govbridge' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
          >
            <Globe className="w-4 h-4 text-emerald-500" /> GovJobs Bridge
          </button>
          <button 
            onClick={() => setActiveTab('company')}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'company' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
          >
            <Building className="w-4 h-4" /> Company & Jobs
          </button>
        </div>
      </div>

      {activeTab === 'pipeline' ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Recruiter Company Association Banner */}
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-indigo-900 to-slate-900 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg border border-indigo-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 font-bold">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">Associated Employer Entity:</span>
                  <span className="font-extrabold text-sm text-white">
                    {recruiterCompany.companyName ? recruiterCompany.companyName : 'Unlinked Account (Individual Recruiter)'}
                  </span>
                  {recruiterCompany.claimedCompanyId && (
                    <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                      Verified Link
                    </span>
                  )}
                </div>
                <p className="text-xs text-indigo-200 mt-0.5">
                  {recruiterCompany.companyName 
                    ? `Showing applications submitted specifically to ${recruiterCompany.companyName}.`
                    : 'Claim or link your user profile to a registered company entity to filter applications.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto justify-end">
              {/* Filter Mode Toggle */}
              <div className="bg-slate-800/80 p-1 rounded-xl border border-slate-700 flex items-center text-xs">
                <button
                  onClick={() => setCompanyFilterMode('my-company')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${companyFilterMode === 'my-company' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'}`}
                >
                  My Company ({companyApplications.length})
                </button>
                <button
                  onClick={() => setCompanyFilterMode('all')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${companyFilterMode === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'}`}
                >
                  All Candidate Pool ({applications.length})
                </button>
              </div>

              <button
                onClick={() => setShowClaimCompanyModal(true)}
                className="px-3.5 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition-all border border-indigo-400/30"
              >
                <Link className="w-3.5 h-3.5" />
                {recruiterCompany.companyName ? 'Change Link' : 'Claim Company Profile'}
              </button>
            </div>
          </div>

          {/* Dynamic Pipeline Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {pipelineStats.map((stat) => (
              <div key={stat.label} className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 ${stat.bg} ${stat.color} rounded-xl`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-400">Live Stage</span>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">{stat.count}</div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Main Candidate Activity Panel */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 md:p-8 shadow-2xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-500" /> Recent Candidate Activity & Submissions
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Live feed of candidate applications. Updating candidate status immediately updates candidate progression.
                </p>
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                {['all', 'applied', 'viewed', 'interviewing', 'offered', 'rejected'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap capitalize ${
                      statusFilter === st
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {st === 'all' ? `All (${countTotal})` : st === 'applied' ? `New (${countApplied})` : st === 'viewed' ? `Under Review (${countViewed})` : st}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input Bar */}
            <div className="relative mb-6">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search candidate by name, role, email, or company..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Loading Spinner */}
            {loading ? (
              <div className="py-16 text-center text-slate-400 flex flex-col items-center">
                <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
                <p className="text-sm font-semibold">Streaming live candidate activity...</p>
              </div>
            ) : filteredApps.length === 0 ? (
              <div className="text-center py-16 px-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <TrendingUp className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">No candidate submissions found</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                  {searchQuery || statusFilter !== 'all' 
                    ? "No candidate activity matches your current filters. Try resetting the search or status filter."
                    : "No job seekers have applied to your active postings yet. Once candidates apply on the job board, their submissions stream here in real-time."}
                </p>
                {(searchQuery || statusFilter !== 'all') && (
                  <button
                    onClick={() => { setStatusFilter('all'); setSearchQuery(''); }}
                    className="mt-4 px-4 py-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            ) : (
              /* Applications List */
              <div className="space-y-3.5">
                {filteredApps.map((app) => {
                  const candidateName = app.seekerName || 'Candidate';
                  const jobTitle = app.jobTitle || 'Position';
                  const matchVal = app.matchPercentage || 85;

                  return (
                    <motion.div
                      key={app.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      {/* Candidate Header & Role Info */}
                      <div className="flex items-start gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-black text-base flex-shrink-0 shadow-2xs border border-indigo-200/50 dark:border-indigo-800/50">
                          {candidateName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base">{candidateName}</h3>
                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full border border-indigo-200/40">
                              {matchVal}% Match
                            </span>
                            {app.method && (
                              <span className="text-[11px] font-semibold text-slate-500 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 capitalize">
                                {app.method.replace('-', ' ')}
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1 flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{jobTitle}</span>
                            {app.companyName && <span className="text-slate-400">• {app.companyName}</span>}
                            {app.seekerHeadline && <span className="text-slate-400 truncate max-w-xs">• {app.seekerHeadline}</span>}
                          </div>

                          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-3">
                            <span>Applied {formatTimeAgo(app.appliedAt)}</span>
                            {app.seekerEmail && <span>• {app.seekerEmail}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Status & Action Buttons */}
                      <div className="flex items-center gap-2.5 flex-wrap self-end lg:self-center">
                        <div className="mr-1">
                          {getStatusBadge(app.status)}
                        </div>

                        {/* Status Change Buttons */}
                        {app.status === 'applied' && (
                          <button
                            onClick={() => handleUpdateStatus(app.id, 'viewed')}
                            disabled={updatingStatusId === app.id}
                            className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                            title="Mark application as under review"
                          >
                            <Eye className="w-3.5 h-3.5" /> Mark Viewed
                          </button>
                        )}

                        {app.status !== 'interviewing' && app.status !== 'offered' && (
                          <button
                            onClick={() => handleUpdateStatus(app.id, 'interviewing')}
                            disabled={updatingStatusId === app.id}
                            className="px-3 py-1.5 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                            title="Invite candidate to interview"
                          >
                            <Clock className="w-3.5 h-3.5" /> Invite Interview
                          </button>
                        )}

                        {app.status !== 'offered' && (
                          <button
                            onClick={() => handleUpdateStatus(app.id, 'offered')}
                            disabled={updatingStatusId === app.id}
                            className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                            title="Extend job offer to candidate"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Extend Offer
                          </button>
                        )}

                        {/* View Details Drawer Trigger */}
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="px-3.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs transition-all"
                        >
                          <span>Review</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      ) : activeTab === 'sourcing' ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="employer-sourcing-embedded">
            <EmployerSourcing isEmbedded={true} />
          </div>
        </motion.div>
      ) : activeTab === 'requisitions' ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <JobRequisitionEditor 
            companyId={recruiterCompany.claimedCompanyId || user?.uid} 
            companyName={recruiterCompany.companyName} 
          />
        </motion.div>
      ) : activeTab === 'govbridge' ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <GovJobsBridge />
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="company-management-embedded">
            <CompanyManagement />
          </div>
        </motion.div>
      )}

      {/* Candidate Review Modal */}
      <AnimatePresence>
        {selectedApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-black text-lg">
                    {(selectedApp.seekerName || 'Candidate').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      {selectedApp.seekerName || 'Candidate Submission'}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Applied for <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedApp.jobTitle || 'Position'}</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedApp(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status and Match Details */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800 mb-6 flex flex-wrap justify-between items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400">Current Status:</span>
                  {getStatusBadge(selectedApp.status)}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400">Match Accuracy:</span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200/50">
                    {selectedApp.matchPercentage || 85}% Alignment
                  </span>
                </div>
              </div>

              {/* Transition Explanation or Advisory Report */}
              {selectedApp.transitionExplanation && (
                <div className="mb-6 p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/40 rounded-2xl">
                  <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Candidate Capability Transition Bridge
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {selectedApp.transitionExplanation}
                  </p>
                </div>
              )}

              {/* Recruiter Communications History */}
              {selectedApp.communications && selectedApp.communications.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" /> Recruiter Notes & Communications
                  </h4>
                  <div className="space-y-2 max-h-36 overflow-y-auto p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                    {selectedApp.communications.map((msg, idx) => (
                      <div key={idx} className="text-xs p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                        <div className="font-bold text-indigo-600 dark:text-indigo-400 mb-0.5">{msg.sender}</div>
                        <div className="text-slate-700 dark:text-slate-300">{msg.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recruiter Communication & Rationale Input */}
              <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-500" /> Message & Rationale to Candidate
                  </label>
                  <span className="text-[11px] text-slate-400">Visible on Candidate Dashboard</span>
                </div>

                {/* Message Category Selector */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-3 p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold">
                  <button
                    onClick={() => setCommunicationCategory('general')}
                    className={`px-2.5 py-1.5 rounded-lg transition-all ${communicationCategory === 'general' ? 'bg-indigo-600 text-white shadow-2xs font-bold' : 'text-slate-600 dark:text-slate-400'}`}
                  >
                    General Note
                  </button>
                  <button
                    onClick={() => setCommunicationCategory('offer_rationale')}
                    className={`px-2.5 py-1.5 rounded-lg transition-all ${communicationCategory === 'offer_rationale' ? 'bg-indigo-600 text-white shadow-2xs font-bold' : 'text-slate-600 dark:text-slate-400'}`}
                  >
                    Offer Rationale
                  </button>
                  <button
                    onClick={() => setCommunicationCategory('info_request')}
                    className={`px-2.5 py-1.5 rounded-lg transition-all ${communicationCategory === 'info_request' ? 'bg-indigo-600 text-white shadow-2xs font-bold' : 'text-slate-600 dark:text-slate-400'}`}
                  >
                    Info Request
                  </button>
                  <button
                    onClick={() => setCommunicationCategory('interview_notes')}
                    className={`px-2.5 py-1.5 rounded-lg transition-all ${communicationCategory === 'interview_notes' ? 'bg-indigo-600 text-white shadow-2xs font-bold' : 'text-slate-600 dark:text-slate-400'}`}
                  >
                    Interview Notes
                  </button>
                </div>

                <textarea
                  rows={3}
                  value={recruiterNote}
                  onChange={e => setRecruiterNote(e.target.value)}
                  placeholder={
                    communicationCategory === 'offer_rationale'
                      ? "Explain offer terms, salary structure, equity details, or reasons for any adjustment..."
                      : communicationCategory === 'info_request'
                      ? "Specify what additional details or portfolio samples are requested from the candidate..."
                      : communicationCategory === 'interview_notes'
                      ? "Provide interview preparation tips, video call link, or team introduction notes..."
                      : "Add a message or note for the candidate..."
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 mb-2.5"
                />

                <div className="flex justify-end">
                  <button
                    onClick={handleSendDirectMessage}
                    disabled={!recruiterNote.trim()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all"
                  >
                    <Send className="w-3.5 h-3.5" /> Send Message
                  </button>
                </div>
              </div>

              {/* Status Update Quick Action Bar */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Advance Candidate Pipeline Status & Attach Note
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => handleUpdateStatus(selectedApp.id, 'viewed', recruiterNote)}
                    disabled={updatingStatusId === selectedApp.id}
                    className="p-2.5 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" /> Mark Viewed
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedApp.id, 'interviewing', recruiterNote)}
                    disabled={updatingStatusId === selectedApp.id}
                    className="p-2.5 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all"
                  >
                    <Clock className="w-3.5 h-3.5" /> Interviewing
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedApp.id, 'offered', recruiterNote)}
                    disabled={updatingStatusId === selectedApp.id}
                    className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Extend Offer
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedApp.id, 'rejected', recruiterNote)}
                    disabled={updatingStatusId === selectedApp.id}
                    className="p-2.5 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all"
                  >
                    <X className="w-3.5 h-3.5" /> Pass / Reject
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <a
                  href={`#profile/${selectedApp.seekerId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> View Candidate Public Profile
                </a>

                <button
                  onClick={() => setSelectedApp(null)}
                  className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs"
                >
                  Close Drawer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Claim / Link Company Profile Modal */}
      <AnimatePresence>
        {showClaimCompanyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Building className="w-5 h-5 text-indigo-500" /> Link Employer Account
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select or enter the company profile to associate with your recruiter profile.
                  </p>
                </div>
                <button
                  onClick={() => setShowClaimCompanyModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Registered Companies Dropdown List */}
              <div className="mb-5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Select Registered Company Entity:
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {availableCompaniesList.map((comp) => (
                    <button
                      key={comp.id}
                      onClick={() => handleClaimCompany(comp.name, comp.id)}
                      disabled={isClaiming}
                      className="w-full text-left p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 transition-all flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200"
                    >
                      <span>{comp.name}</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Company Name Input */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Or Enter Custom Company Name:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customClaimName}
                    onChange={e => setCustomClaimName(e.target.value)}
                    placeholder="e.g. Apex Health Technologies"
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={() => handleClaimCompany(customClaimName)}
                    disabled={isClaiming || !customClaimName.trim()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs"
                  >
                    Link
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
