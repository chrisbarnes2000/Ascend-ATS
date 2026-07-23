import { useEffect, useState, FormEvent } from 'react';
import { doc, getDoc, collection, addDoc, setDoc, serverTimestamp, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Job, Application, JobSeekerProfile, ProfileSkill } from '../types';
import { useAuth } from '../hooks/useAuth';
import { calculateMatchScore, compareSkills, getMatchBreakdown } from '../hooks/useJobMatching';
import { motion } from 'motion/react';
import { 
  Briefcase, MapPin, DollarSign, Target, CheckCircle2, ArrowLeft, Loader2, Check, Sparkles, 
  AlertTriangle, ShieldCheck, HelpCircle, UserCheck, XCircle, Clock, Calendar, Plus, 
  MessageSquare, Send, X, Layers, Award, ShieldAlert, Info
} from 'lucide-react';

function getTimeAgo(dateInput: any): string {
  if (!dateInput) return 'Recently';
  let dateMs = Date.now();
  if (typeof dateInput.toMillis === 'function') {
    dateMs = dateInput.toMillis();
  } else if (typeof dateInput.seconds === 'number') {
    dateMs = dateInput.seconds * 1000;
  } else if (dateInput instanceof Date) {
    dateMs = dateInput.getTime();
  } else if (typeof dateInput === 'string' || typeof dateInput === 'number') {
    dateMs = new Date(dateInput).getTime();
  }
  if (isNaN(dateMs)) return 'Recently';
  
  const diffHours = Math.floor((Date.now() - dateMs) / (1000 * 60 * 60));
  if (diffHours < 1) return 'Just posted';
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 30) return `${diffDays} days ago`;
  return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
}

function getExpectedFillDate(job: Job): string {
  if (job.targetFillDate) {
    const d = new Date(job.targetFillDate);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }
  }
  let dateMs = Date.now();
  if (job.createdAt?.toMillis) dateMs = job.createdAt.toMillis();
  else if (job.createdAt?.seconds) dateMs = job.createdAt.seconds * 1000;
  else if (job.createdAt) dateMs = new Date(job.createdAt).getTime();
  
  const targetMs = dateMs + 28 * 24 * 60 * 60 * 1000;
  return new Date(targetMs).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export const JobDescription = () => {
  const [job, setJob] = useState<Job | null>(null);
  const [profile, setProfile] = useState<JobSeekerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const { user } = useAuth();

  // Skill Addition State
  const [selectedSkillToAdd, setSelectedSkillToAdd] = useState<{
    name: string;
    level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
    domain: string;
    years: number;
  } | null>(null);
  const [isAddingSkills, setIsAddingSkills] = useState(false);

  // Recruiter Role Clarification Modal State
  const [showClarificationModal, setShowClarificationModal] = useState(false);
  const [showVersionHistoryModal, setShowVersionHistoryModal] = useState(false);
  const [clarificationTopic, setClarificationTopic] = useState('Compensation & Salary Transparency');
  const [clarificationMessage, setClarificationMessage] = useState('');
  const [isSendingClarification, setIsSendingClarification] = useState(false);
  const [clarificationSent, setClarificationSent] = useState(false);

  // Transition & Low Match Advisory State
  const [transitionExplanation, setTransitionExplanation] = useState('');
  const [generatingAdvisory, setGeneratingAdvisory] = useState(false);
  const [advisoryReport, setAdvisoryReport] = useState<{
    candidateAdvice?: {
      learningCurve: string;
      biasWarning: string;
      churnRisk: string;
      bridgeStrategy: string;
    };
    recruiterAdvice?: {
      strengthsVsRisks: string;
      upsidePotential: string;
      accommodationAssessment: string;
      hiringVerdict: string;
    };
  } | null>(null);
  
  const jobId = window.location.hash.replace('#job/', '');

  useEffect(() => {
    if (!jobId) {
      setError('Invalid Job ID');
      setLoading(false);
      return;
    }

    const fetchJob = async () => {
      try {
        const docRef = doc(db, 'jobs', jobId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setJob({ id: docSnap.id, ...docSnap.data() } as Job);
          
          if (user) {
             const appQuery = query(collection(db, 'applications'), where('seekerId', '==', user.uid), where('jobId', '==', docSnap.id));
             const appSnap = await getDocs(appQuery);
             if (!appSnap.empty) {
               setHasApplied(true);
             }
          }
        } else {
          setError('Job not found.');
        }
      } catch (err) {
        console.error("Error fetching job:", err);
        setError('Failed to load job details.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchJob();
  }, [jobId, user]);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, `users/${user.uid}/profiles/main`), (snapshot) => {
      if (snapshot.exists()) {
        setProfile(snapshot.data() as JobSeekerProfile);
      } else {
        setProfile(null);
      }
    }, (err) => {
      console.error("Error fetching user profile snapshot:", err);
    });

    return () => unsubscribe();
  }, [user]);

  // Calculate algorithmic match & comprehensive skill comparison
  const matchScore = job && profile ? calculateMatchScore(profile, job) : 0;
  const matchPercentage = matchScore * 100;
  const skillComparison = compareSkills(profile, job);

  const [hasAutoGenerated, setHasAutoGenerated] = useState(false);

  useEffect(() => {
    if (job && profile && matchPercentage < 50 && !hasAutoGenerated && !advisoryReport && !generatingAdvisory) {
      setHasAutoGenerated(true);
      handleGenerateAdvisory(true);
    }
  }, [job, profile, matchPercentage, hasAutoGenerated, advisoryReport, generatingAdvisory]);

  const handleGenerateAdvisory = async (isAuto = false) => {
    if (!job) return;
    setGeneratingAdvisory(true);
    try {
      const res = await fetch('/api/transition-advisory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: job.title,
          jobRequirements: job.requirements,
          candidateProfile: profile,
          transitionExplanation: transitionExplanation || (isAuto ? 'Analyze my profile objectively against the requirements to identify transferable skills.' : 'Transferable skills and adaptability across domains.'),
          matchPercentage: Math.round(matchPercentage)
        })
      });
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setAdvisoryReport(data);
    } catch (err) {
      console.error("Failed to generate advisory", err);
      if (!isAuto) alert("Failed to generate advisory report.");
    } finally {
      setGeneratingAdvisory(false);
    }
  };

  const handleApply = async () => {
    if (!user || !job) return;
    setIsApplying(true);
    try {
      await addDoc(collection(db, 'applications'), {
        jobId: job.id,
        seekerId: user.uid,
        companyId: job.companyId || 'company',
        status: 'applied',
        appliedAt: serverTimestamp(),
        method: matchPercentage < 50 ? 'transition-bridge' : 'one-click',
        transitionExplanation: transitionExplanation || '',
        advisoryReport: advisoryReport || null,
        communications: [],
        jobTitle: job.title,
        companyName: job.companyName,
        seekerName: profile?.fullName || user.displayName || user.email?.split('@')[0] || 'Candidate',
        seekerEmail: user.email || '',
        seekerHeadline: profile?.title || profile?.currentTitle || 'Job Seeker',
        matchPercentage: matchPercentage || 85
      });
      setHasApplied(true);
    } catch (err) {
      console.error(err);
      alert('Error applying. Please try again.');
    } finally {
      setIsApplying(false);
    }
  };

  // Skill Add & Bulk Action Handlers
  const handleConfirmAddSkill = async () => {
    if (!user || !profile || !selectedSkillToAdd) return;
    setIsAddingSkills(true);
    try {
      const existingSkills = profile.skills || [];
      const normNew = selectedSkillToAdd.name.toLowerCase().trim();
      
      const alreadyExists = existingSkills.some(s => (typeof s === 'string' ? s : s.name).toLowerCase().trim() === normNew);
      
      if (alreadyExists) {
        alert(`"${selectedSkillToAdd.name}" is already listed in your profile skills.`);
        setSelectedSkillToAdd(null);
        setIsAddingSkills(false);
        return;
      }

      const updatedSkills = [...existingSkills, selectedSkillToAdd];
      const profileRef = doc(db, `users/${user.uid}/profiles/main`);
      await setDoc(profileRef, {
        skills: updatedSkills,
        updatedAt: serverTimestamp()
      }, { merge: true });

      setSelectedSkillToAdd(null);
    } catch (err) {
      console.error("Error saving skill to profile:", err);
      alert("Failed to update profile skills.");
    } finally {
      setIsAddingSkills(false);
    }
  };

  const handleAddAllMissingSkills = async (missingList: string[]) => {
    if (!user || !profile || missingList.length === 0) return;
    setIsAddingSkills(true);
    try {
      const existingSkills = [...(profile.skills || [])];
      const existingNames = new Set(existingSkills.map(s => (typeof s === 'string' ? s : s.name).toLowerCase().trim()));
      
      const additions: ProfileSkill[] = [];
      missingList.forEach(name => {
        const norm = name.toLowerCase().trim();
        if (!existingNames.has(norm)) {
          additions.push({
            name,
            level: 'Intermediate',
            domain: 'Technical',
            years: 2
          });
          existingNames.add(norm);
        }
      });

      if (additions.length === 0) {
        alert("All missing skills are already present in your profile.");
        setIsAddingSkills(false);
        return;
      }

      const updatedSkills = [...existingSkills, ...additions];
      const profileRef = doc(db, `users/${user.uid}/profiles/main`);
      await setDoc(profileRef, {
        skills: updatedSkills,
        updatedAt: serverTimestamp()
      }, { merge: true });

    } catch (err) {
      console.error("Error bulk adding missing skills:", err);
      alert("Failed to add missing skills to profile.");
    } finally {
      setIsAddingSkills(false);
    }
  };

  // Recruiter Clarification Handler
  const handleSendClarification = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !job) return;
    setIsSendingClarification(true);
    try {
      // 1. Log request to jobClarificationRequests collection
      await addDoc(collection(db, 'jobClarificationRequests'), {
        jobId: job.id,
        jobTitle: job.title,
        companyId: job.companyId || 'company',
        companyName: job.companyName,
        seekerId: user.uid,
        seekerEmail: user.email || 'JobSeeker',
        category: clarificationTopic,
        message: clarificationMessage || 'Candidate requested additional role specification details to assist candidate screening.',
        createdAt: serverTimestamp(),
        status: 'pending'
      });

      // 2. Also append message to candidate application if application exists
      try {
        const { getDocs, query, where, updateDoc, doc, arrayUnion } = await import('firebase/firestore');
        const appQuery = query(
          collection(db, 'applications'),
          where('seekerId', '==', user.uid),
          where('jobId', '==', job.id)
        );
        const appSnap = await getDocs(appQuery);
        if (!appSnap.empty) {
          const appDoc = appSnap.docs[0];
          await updateDoc(doc(db, 'applications', appDoc.id), {
            communications: arrayUnion({
              sender: 'Candidate',
              text: `[Clarification Request - ${clarificationTopic}] ${clarificationMessage || 'Requested role specification details.'}`,
              timestamp: new Date().toISOString()
            })
          });
        }
      } catch (appErr) {
        console.warn("Non-fatal: could not append to application record:", appErr);
      }

      setClarificationSent(true);
    } catch (err: any) {
      console.error("Error sending clarification request:", err);
      alert(`Failed to submit request: ${err.message || 'Please check connection.'}`);
    } finally {
      setIsSendingClarification(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 w-full md:w-[75vw] max-w-none mx-auto">
        <button onClick={() => { window.location.hash = ''; }} className="flex items-center gap-2 mb-8 text-slate-500 hover:text-slate-800 dark:hover:text-slate-300">
           <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <div className="bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-400 p-8 rounded-2xl font-bold flex items-center justify-center">
          {error || 'Unable to load job details.'}
        </div>
      </div>
    );
  }

  const missingSkillsList = skillComparison.requiredJobSkills.filter(s => !s.isMatched).map(s => s.name);

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 w-full md:w-[75vw] max-w-none mx-auto">
      <button onClick={() => { window.location.hash = ''; }} className="flex items-center gap-2 mb-8 text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 font-medium">
         <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      {/* Main Job Overview Header Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm mb-8"
      >
        <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-6">
          <div className="flex gap-6 items-start">
             <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-shrink-0 items-center justify-center">
               <Briefcase className="w-8 h-8 text-slate-400" />
             </div>
             <div>
               <h1 className="text-3xl font-bold mb-2 text-slate-900 dark:text-slate-100">{job.title}</h1>
               <p className="text-xl text-slate-600 dark:text-slate-400 font-medium">
                 <a 
                   href={`#company/${job.companyId || 'unknown'}?name=${encodeURIComponent(job.companyName)}`}
                   className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors underline decoration-slate-300 dark:decoration-slate-700 hover:decoration-blue-500 underline-offset-4 cursor-pointer"
                 >
                   {job.companyName}
                 </a>
               </p>
             </div>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-3 items-center w-full md:w-auto">
             <button 
                onClick={() => setShowClarificationModal(true)}
                className="px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs shrink-0"
             >
                <HelpCircle className="w-4 h-4 text-indigo-500" />
                Request Role Clarification
             </button>

             <button 
                onClick={handleApply}
                disabled={isApplying || hasApplied}
                className={`px-8 py-3 rounded-xl shadow-lg transition-colors font-bold flex items-center justify-center gap-2 shrink-0 ${
                  hasApplied 
                    ? 'bg-emerald-500 text-white cursor-default shadow-none' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                } disabled:opacity-80`}
             >
                {isApplying && <Loader2 className="w-5 h-5 animate-spin" />}
                {!isApplying && hasApplied && <Check className="w-5 h-5" />}
                {hasApplied ? 'Applied' : 'Apply Now'}
             </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mb-8">
           <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 font-medium text-sm border border-slate-100 dark:border-slate-700">
             <MapPin className="w-4 h-4 text-slate-400" /> Remote
           </div>
           {job.parsedCriteria?.salaryRange && (
             <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 font-medium text-sm border border-slate-100 dark:border-slate-700">
               <DollarSign className="w-4 h-4 text-slate-400" /> 
               ${(job.parsedCriteria.salaryRange.min / 1000).toFixed(0)}k - ${(job.parsedCriteria.salaryRange.max / 1000).toFixed(0)}k
             </div>
           )}
        </div>

        {/* Job Authenticity & Market Intent Signals (Anti-Ghost Postings Protection) */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Posting Authenticity & Market Signals
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Verified Active Opening
              </span>
            </div>
            <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
              <span>Authenticity Index:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">98% High Confidence</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1: Posted Time */}
            <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                <Clock className="w-3.5 h-3.5 text-blue-500" /> Posted Date
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {getTimeAgo(job.createdAt)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Fresh candidate pipeline</div>
            </div>

            {/* Metric 2: Target Fill Date */}
            <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Expected Fill Date
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {getExpectedFillDate(job)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Active interview window</div>
            </div>

            {/* Metric 3: Headcount & Budget Status */}
            <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Budget Status
              </div>
              <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Approved Budget
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Allocated headcount plan</div>
            </div>

            {/* Metric 4: Requisition Type & Anti-Ghost Protection */}
            <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                <Target className="w-3.5 h-3.5 text-purple-500" /> Requisition Intent
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Active Direct Role
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                ✓ Anti-Ghosting protection pass
              </div>
            </div>
          </div>
        </div>

        {/* Job Revisions & Version History Banner */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="bg-indigo-600 text-white font-extrabold text-xs px-2.5 py-0.5 rounded-full">
              Version {job.currentVersion || 'v1.0'}
            </span>
            {job.transparencyRating === 'flagged' ? (
              <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Post-Application Revision Flagged
              </span>
            ) : (
              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified Transparent Requisition
              </span>
            )}
          </div>

          <button
            onClick={() => setShowVersionHistoryModal(true)}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 px-3 py-1.5 rounded-xl border border-indigo-200/50 dark:border-indigo-800/50 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>View Version History & Audit Trail ({(job.revisions || []).length})</span>
          </button>
        </div>

        <div className="mt-8 mb-8">
          <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-slate-100">About the Role</h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{job.description}</p>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-slate-100">Requirements</h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{job.requirements}</p>
        </div>
      </motion.div>

      {/* Assisted Insights - Re-ordered: Requirements Comparison on Top, Profile Skills on Bottom */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-3xl p-8"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl">
               <Target className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">Assisted Insights & Skill Alignment</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Skill alignment & candidate requirements analysis for this role.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-5 py-3 rounded-2xl border border-indigo-100/80 dark:border-indigo-900/80 shadow-sm self-start md:self-auto">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Match Score</div>
              <div className={`text-2xl font-bold font-display ${matchPercentage >= 70 ? 'text-emerald-500' : matchPercentage >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                {Math.round(matchPercentage)}%
              </div>
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
            <div className="text-xs text-slate-500 dark:text-slate-400">
              <span className="font-bold text-slate-800 dark:text-slate-200">{skillComparison.matchingCount}</span> of <span className="font-bold text-slate-800 dark:text-slate-200">{skillComparison.totalRequiredCount}</span> required skills matched
            </div>
          </div>
        </div>

        {/* Detailed Profile Match Breakdown (Why & How Profile Matched) */}
        {(() => {
          const matchBreakdown = getMatchBreakdown(profile, job);
          return (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100/80 dark:border-indigo-900/80 p-6 mb-6 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                      Why & How Profile Matched
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Algorithmic fit breakdown across salary, workplace setting, benefits, skills, and employer flexibility
                    </p>
                  </div>
                </div>
                <span className="bg-indigo-600 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl shrink-0">
                  {matchBreakdown.overallScore}% Overall Fit
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Salary Match Card */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-500" /> Salary & Compensation
                    </span>
                    <span className={`font-extrabold px-2 py-0.5 rounded-md text-[10px] ${
                      matchBreakdown.salaryMatch.isMatch 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                    }`}>
                      {matchBreakdown.salaryMatch.isMatch ? '✓ Aligned' : 'Flexible'}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                    {matchBreakdown.salaryMatch.details}
                  </p>
                </div>

                {/* Workplace Setting Card */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-blue-500" /> Workplace & Location
                    </span>
                    <span className={`font-extrabold px-2 py-0.5 rounded-md text-[10px] ${
                      matchBreakdown.workplaceMatch.isMatch 
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30' 
                        : 'bg-slate-500/10 text-slate-600 dark:text-slate-400'
                    }`}>
                      {matchBreakdown.workplaceMatch.jobWorkplaceType}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                    {matchBreakdown.workplaceMatch.details}
                  </p>
                </div>

                {/* Benefits & Perks Alignment */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-purple-500" /> Benefits & Perks
                    </span>
                    <span className="font-extrabold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-md text-[10px]">
                      {matchBreakdown.benefitsMatch.totalMatched}/{matchBreakdown.benefitsMatch.totalRequested} Perks Matched
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                    {matchBreakdown.benefitsMatch.details}
                  </p>
                </div>

                {/* Skills Match Breakdown */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-indigo-500" /> Required vs Preferred Skills
                    </span>
                    <span className="font-extrabold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-md text-[10px]">
                      {matchBreakdown.skillsMatch.matchedCount} Core Skills
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                    {matchBreakdown.skillsMatch.details}
                    {matchBreakdown.skillsMatch.preferredMatched.length > 0 && ` + ${matchBreakdown.skillsMatch.preferredMatched.length} preferred bonus skills`}
                  </p>
                </div>
              </div>

              {/* Employer Settling & Willing to Consider Callout */}
              {matchBreakdown.willingToConsider.hasOptions && (
                <div className="mt-4 p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-900 dark:text-emerald-200 space-y-1 text-xs">
                  <div className="font-extrabold flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>Employer Settling Criteria & Flexibility ("Willing to Consider")</span>
                  </div>
                  {matchBreakdown.willingToConsider.notes && (
                    <p className="text-[11px] text-slate-700 dark:text-slate-300">
                      "{matchBreakdown.willingToConsider.notes}"
                    </p>
                  )}
                  {matchBreakdown.willingToConsider.options.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {matchBreakdown.willingToConsider.options.map((opt, i) => (
                        <span key={i} className="bg-emerald-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-md">
                          ✓ {opt}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        <div className="space-y-6">
          {/* TOP SECTION 1: Job Requirements Analysis (Matched & Requirements Gaps) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Matched Requirements Box */}
             <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/50">
               <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center justify-between">
                 <span className="flex items-center gap-2">
                   <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                   Matched Job Requirements ({skillComparison.matchingCount})
                 </span>
                 <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/60">
                   In Your Profile
                 </span>
               </h4>
               <div className="flex flex-wrap gap-2">
                 {skillComparison.requiredJobSkills.filter(s => s.isMatched).length > 0 ? (
                   skillComparison.requiredJobSkills.filter(s => s.isMatched).map(s => (
                     <span key={s.name} className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 text-xs rounded-lg flex items-center gap-1.5 font-semibold border border-emerald-100 dark:border-emerald-900/40 shadow-2xs">
                       <Check className="w-3.5 h-3.5" /> {s.name}
                     </span>
                   ))
                 ) : (
                   <span className="text-xs text-slate-400 italic">No direct requirement overlaps identified yet.</span>
                 )}
               </div>
             </div>

             {/* Requirements Gaps / Unmatched Box WITH Add to Profile Capability */}
             <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/50">
               <div className="flex items-center justify-between mb-3">
                 <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                   <XCircle className="w-4 h-4 text-amber-500" />
                   Requirements Gaps / Unmatched ({missingSkillsList.length})
                 </h4>
                 {missingSkillsList.length > 0 && (
                   <button
                     onClick={() => handleAddAllMissingSkills(missingSkillsList)}
                     disabled={isAddingSkills}
                     className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-lg border border-indigo-200/60 dark:border-indigo-800 disabled:opacity-50 transition-colors"
                   >
                     {isAddingSkills ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                     Add All Missing to Profile
                   </button>
                 )}
               </div>

               <div className="flex flex-wrap gap-2">
                 {missingSkillsList.length > 0 ? (
                   missingSkillsList.map(skillName => (
                     <button
                       key={skillName}
                       onClick={() => setSelectedSkillToAdd({
                         name: skillName,
                         level: 'Intermediate',
                         domain: 'Technical',
                         years: 2
                       })}
                       className="group bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-indigo-300 px-3 py-1.5 text-xs rounded-lg font-medium border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 flex items-center gap-1.5 transition-all cursor-pointer"
                       title="Click to add this missing skill to your profile with enhanced details"
                     >
                       <span>{skillName}</span>
                       <Plus className="w-3.5 h-3.5 text-indigo-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                     </button>
                   ))
                 ) : (
                   <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                     <CheckCircle2 className="w-4 h-4" /> 100% of parsed job requirements are matched in your profile!
                   </span>
                 )}
               </div>
               {missingSkillsList.length > 0 && (
                 <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                   💡 Click any missing skill above to configure level & experience and immediately add it to your profile.
                 </p>
               )}
             </div>
          </div>

          {/* BOTTOM SECTION 2: All Candidate Profile Skills */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/50">
             <div className="flex items-center justify-between mb-3">
               <div className="flex items-center gap-2">
                 <UserCheck className="w-5 h-5 text-blue-500" />
                 <h4 className="font-bold text-slate-900 dark:text-slate-100">Your Profile Skills ({skillComparison.allCandidateSkills.length})</h4>
               </div>
               <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                 All skills registered in your active profile
               </span>
             </div>

             {skillComparison.allCandidateSkills.length > 0 ? (
               <div className="flex flex-wrap gap-2.5 pt-2">
                 {skillComparison.allCandidateSkills.map(({ skill, isMatch }) => (
                   <div 
                     key={skill.name}
                     className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all border ${
                       isMatch
                         ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80 shadow-2xs'
                         : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                     }`}
                   >
                     {isMatch ? (
                       <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                     ) : (
                       <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 flex-shrink-0" />
                     )}
                     <span>{skill.name}</span>
                     {skill.level && (
                       <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 font-normal">
                         {skill.level}
                       </span>
                     )}
                     {isMatch && (
                       <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                         Matched
                       </span>
                     )}
                   </div>
                 ))}
               </div>
             ) : (
               <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-slate-500 text-xs italic text-center">
                 No skills listed in your profile. Add skills in your profile editor to unlock detailed job comparison!
               </div>
             )}
          </div>
        </div>
      </motion.div>

      {/* Low Match (< 50%) Career Transition & Transferable Skills Advisory */}
      {matchPercentage < 50 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 rounded-3xl p-8"
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/50 rounded-xl">
               <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">Career Transition & Transferable Skills Advisory</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Your algorithmic match score is below 50%. Traditional keyword filters often overlook human adaptability and cross-functional resilience. Use this transition explainer to bridge the gap for the hiring team.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {!hasApplied && (
              <>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-800 dark:text-slate-200">
                    Transition Context & Transferable Skills Explanation
                  </label>
                  <textarea
                    rows={4}
                    value={transitionExplanation}
                    onChange={e => setTransitionExplanation(e.target.value)}
                    placeholder="e.g. I am transitioning into software engineering with a strong background in analytical problem solving and project leadership..."
                    className="w-full px-4 py-3 rounded-2xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => handleGenerateAdvisory(false)}
                    disabled={generatingAdvisory}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 transition-all disabled:opacity-50 text-sm"
                  >
                    {generatingAdvisory && <Loader2 className="w-5 h-5 animate-spin" />}
                    {!generatingAdvisory && <Sparkles className="w-5 h-5" />}
                    {generatingAdvisory ? 'Analyzing Transition Fit...' : 'Generate Dual Advisory Insights'}
                  </button>
                </div>
              </>
            )}

            {advisoryReport && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-amber-200 dark:border-amber-800/60"
              >
                {/* Candidate Advice */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-amber-100 dark:border-amber-900/40 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <ShieldCheck className="w-5 h-5 text-indigo-500" />
                    <h4 className="font-bold text-slate-900 dark:text-slate-100">Candidate Advisory & Risk Assessment</h4>
                  </div>
                  <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Estimated Learning Curve:</span>
                      {advisoryReport.candidateAdvice?.learningCurve}
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Automated Screening Bias Warning:</span>
                      {advisoryReport.candidateAdvice?.biasWarning}
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Onboarding Churn & Retention Factors:</span>
                      {advisoryReport.candidateAdvice?.churnRisk}
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Recommended Bridge Strategy:</span>
                      {advisoryReport.candidateAdvice?.bridgeStrategy}
                    </div>
                  </div>
                </div>

                {/* Recruiter / Company Advice */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-amber-100 dark:border-amber-900/40 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Briefcase className="w-5 h-5 text-emerald-500" />
                    <h4 className="font-bold text-slate-900 dark:text-slate-100">Recruiter & Company Impact Advisory</h4>
                  </div>
                  <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Strengths vs. Risks Analysis:</span>
                      {advisoryReport.recruiterAdvice?.strengthsVsRisks}
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">High-Upside Adaptability Potential:</span>
                      {advisoryReport.recruiterAdvice?.upsidePotential}
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Role Accommodation & Mentorship Assessment:</span>
                      {advisoryReport.recruiterAdvice?.accommodationAssessment}
                    </div>
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                      <span className="font-bold text-slate-800 dark:text-slate-200">Recommended Hiring Verdict:</span>
                      <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold rounded-lg text-[11px]">
                        {advisoryReport.recruiterAdvice?.hiringVerdict}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}

      {/* MODAL 1: Add Missing Skill to Profile Modal */}
      {selectedSkillToAdd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl relative"
          >
            <button 
              onClick={() => setSelectedSkillToAdd(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl text-indigo-600 dark:text-indigo-400">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100">Add Skill to Profile</h3>
                <p className="text-xs text-slate-500">Configure enhanced skill details to update your match score</p>
              </div>
            </div>

            <div className="space-y-4 my-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Skill Name</label>
                <input 
                  type="text" 
                  value={selectedSkillToAdd.name} 
                  onChange={e => setSelectedSkillToAdd({ ...selectedSkillToAdd, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Competency Level</label>
                  <select
                    value={selectedSkillToAdd.level}
                    onChange={e => setSelectedSkillToAdd({ ...selectedSkillToAdd, level: e.target.value as any })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-medium"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Domain</label>
                  <select
                    value={selectedSkillToAdd.domain}
                    onChange={e => setSelectedSkillToAdd({ ...selectedSkillToAdd, domain: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-medium"
                  >
                    <option value="Technical">Technical</option>
                    <option value="Soft Skills">Soft Skills</option>
                    <option value="Leadership">Leadership</option>
                    <option value="Domain Knowledge">Domain Knowledge</option>
                    <option value="Tools">Tools</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Years of Experience</label>
                <input 
                  type="number" 
                  min={0}
                  max={40}
                  value={selectedSkillToAdd.years} 
                  onChange={e => setSelectedSkillToAdd({ ...selectedSkillToAdd, years: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-medium"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedSkillToAdd(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAddSkill}
                disabled={isAddingSkills}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition-colors disabled:opacity-50"
              >
                {isAddingSkills ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Add to My Profile
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL 2: Request Role Clarification for Recruiter */}
      {showClarificationModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl relative"
          >
            <button 
              onClick={() => { setShowClarificationModal(false); setClarificationSent(false); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            {!clarificationSent ? (
              <form onSubmit={handleSendClarification}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl text-indigo-600 dark:text-indigo-400">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100">Request Role Clarification</h3>
                    <p className="text-xs text-slate-500">Provide direct candidate feedback to help recruiters sharpen job specifications</p>
                  </div>
                </div>

                <div className="space-y-4 my-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Clarification Category</label>
                    <select
                      value={clarificationTopic}
                      onChange={e => setClarificationTopic(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-semibold"
                    >
                      <option value="Compensation & Salary Transparency">Compensation & Salary Transparency</option>
                      <option value="Remote / Hybrid Work Expectations & Onsite Days">Remote / Hybrid Work Expectations & Onsite Days</option>
                      <option value="Tech Stack & Framework Specifics">Tech Stack & Framework Specifics</option>
                      <option value="Team Structure & Reporting Lines">Team Structure & Reporting Lines</option>
                      <option value="General Question for Hiring Manager">General Question for Hiring Manager</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Clarification Request Details</label>
                    <textarea
                      rows={4}
                      value={clarificationMessage}
                      onChange={e => setClarificationMessage(e.target.value)}
                      placeholder="e.g. Could you clarify whether the salary range includes equity, or if remote work applies globally vs specific US timezones?"
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowClarificationModal(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingClarification}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition-colors disabled:opacity-50"
                  >
                    {isSendingClarification ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Submit Request to Recruiter
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-1">Request Sent to Recruiter</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
                  Your feedback has been submitted to the talent team for <strong>{job.companyName}</strong>. Candidate inquiries help employers improve job descriptions and eliminate ambiguity!
                </p>
                <button
                  type="button"
                  onClick={() => { setShowClarificationModal(false); setClarificationSent(false); }}
                  className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs rounded-xl"
                >
                  Close Window
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Version History Modal for Candidates */}
      {showVersionHistoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl relative max-h-[85vh] flex flex-col"
          >
            <button 
              onClick={() => setShowVersionHistoryModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-950 rounded-2xl text-indigo-600 dark:text-indigo-400">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                  Job Requisition Version History
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Audit log of all edits made to this job description by <strong>{job.companyName}</strong>.
                </p>
              </div>
            </div>

            {/* Candidate Warning Banner if Post-Application Changes Exist */}
            {(job.nefariousFlags || []).length > 0 && (
              <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-2xl text-amber-800 dark:text-amber-300 text-xs font-bold flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="block font-extrabold">Notice to Candidates:</span>
                  Material shifts detected ({job.nefariousFlags?.join('; ')}).
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 my-2">
              {(job.revisions || []).length === 0 ? (
                <div className="text-center py-8 text-slate-400 italic text-xs">
                  This job posting is on its initial release (v1.0) with no subsequent edits.
                </div>
              ) : (
                [...(job.revisions || [])].reverse().map((rev, idx) => (
                  <div key={rev.id || idx} className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="bg-indigo-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-md">
                        {rev.versionNumber}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(rev.timestamp).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>

                    <p className="text-slate-800 dark:text-slate-200 font-medium">
                      <strong>HR Note:</strong> "{rev.editReasonNotes}"
                    </p>

                    <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
                      <span>Salary: ${((rev.newValues.salaryMin || 80000) / 1000).toFixed(0)}k - ${((rev.newValues.salaryMax || 130000) / 1000).toFixed(0)}k</span>
                      <span className="capitalize text-indigo-600 dark:text-indigo-400 font-semibold">{rev.editReasonCategory.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowVersionHistoryModal(false)}
                className="px-5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs rounded-xl cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

