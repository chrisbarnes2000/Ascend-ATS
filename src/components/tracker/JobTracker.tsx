import { useState, useEffect, FormEvent } from 'react';
import { db } from '../../firebase/config';
import { collection, onSnapshot, query, orderBy, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { getMatchBreakdown } from '../../hooks/useJobMatching';
import { JobSeekerProfile } from '../../types';
import { canonicalizeJobUrl, extractJobIdentifier } from '../../utils/jobDedup';
import { sanitizeFirestorePayload } from '../../utils/firestoreSanitizer';
import {
  Link as LinkIcon, Trash2, FileText, Sparkles, Bot, Download,
  Search, Loader2, Check, X, ArrowRight, MessageSquare, Send, RefreshCw, AlertCircle, FileUp, Edit3, Save,
  Globe, Mail, Building2, Phone, UserCheck, Copy, Key, ShieldCheck, CheckCircle2, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface IngestedJob {
  id: string;
  title: string;
  companyName: string;
  description: string;
  requirements: string;
  location: string;
  workplaceType: 'Remote' | 'Hybrid' | 'On-Site';
  salaryMin?: number;
  salaryMax?: number;
  salaryType?: string;
  requiredSkills: string[];
  preferredSkills: string[];
  benefits: string[];
  extractedId?: string | null;
  status: 'ingested' | 'researched' | 'tailored' | 'applied';
  createdAt?: any;
  isAiEnhanced?: boolean;
  sourceBoard?: string;
  jobNumber?: string;
  department?: string;
  recruiterInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    firmName?: string;
    firmWebsite?: string;
    clientName?: string;
    workAuth?: string;
    contractType?: string;
    rate?: string;
  };
  insights?: {
    interviewQuestions: { question: string; answer: string }[];
    unstatedExpectations: string[];
    matchStrategy: string;
  };
}

interface JobTrackerProps {
  profile: JobSeekerProfile | null;
}

const renderSimpleMarkdown = (text: string) => {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, index) => {
    if (line.startsWith('### ')) {
      return <h4 key={index} className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-3 mb-1 uppercase tracking-wider">{line.replace('### ', '')}</h4>;
    }
    if (line.startsWith('## ')) {
      return <h3 key={index} className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-4 mb-2 border-b border-slate-100 dark:border-slate-800 pb-1">{line.replace('## ', '')}</h3>;
    }
    if (line.startsWith('# ')) {
      return <h2 key={index} className="text-base font-bold text-slate-950 dark:text-white mt-5 mb-2">{line.replace('# ', '')}</h2>;
    }
    if (line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*')) {
      const cleanLine = line.trim().replace(/^[•\-\*]\s*/, '');
      return (
        <ul key={index} className="list-disc pl-5 my-1 text-xs text-slate-600 dark:text-slate-400">
          <li className="leading-relaxed">{renderBoldText(cleanLine)}</li>
        </ul>
      );
    }
    if (!line.trim()) return <div key={index} className="h-2" />;
    return <p key={index} className="text-xs text-slate-600 dark:text-slate-400 my-1 leading-relaxed">{renderBoldText(line)}</p>;
  });
};

const renderBoldText = (text: string) => {
  const parts = text.split('**');
  return parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-semibold text-slate-900 dark:text-white">{part}</strong> : part);
};

export const JobTracker = ({ profile }: JobTrackerProps) => {
  const { user } = useAuth();
  const [ingestedJobs, setIngestedJobs] = useState<IngestedJob[]>([]);
  const [url, setUrl] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [ingestionTab, setIngestionTab] = useState<'url' | 'paste' | 'govjobs' | 'dice_email'>('url');
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestionError, setIngestionError] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceError, setEnhanceError] = useState<string | null>(null);
  const [isEditingText, setIsEditingText] = useState(false);
  const [editDescription, setEditDescription] = useState('');
  const [editRequirements, setEditRequirements] = useState('');
  const [isFormattingDesc, setIsFormattingDesc] = useState(false);
  const [isFormattingReq, setIsFormattingReq] = useState(false);

  // Client-Side Gemini AI API Key State
  const [userApiKey, setUserApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem('ascend_user_gemini_api_key') || '';
    } catch {
      return '';
    }
  });
  const [tempApiKey, setTempApiKey] = useState<string>(userApiKey);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [copiedEmailKey, setCopiedEmailKey] = useState<string | null>(null);

  // Custom Modal States
  const [customConfirm, setCustomConfirm] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: (() => void) | null;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  const [customAlert, setCustomAlert] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: '',
    message: ''
  });

  // Detail View State
  const [selectedJob, setSelectedJob] = useState<IngestedJob | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'insights' | 'chat' | 'resume'>('insights');

  // Copilot Chat State
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'bot'; text: string; timestamp: string }[]>([]);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Resume Tailoring State
  const [isGeneratingResume, setIsGeneratingResume] = useState(false);
  const [tailoredResume, setTailoredResume] = useState<any | null>(null);
  const [resumeTemplate, setResumeTemplate] = useState<'classic' | 'modern' | 'minimalist'>('classic');

  const handlePdfFileSelect = (file: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setIngestionError('Please upload a valid .pdf file.');
      return;
    }
    setPdfFileName(file.name);
    setPdfFile(file);
    setIngestionError(null);

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setPdfBase64(base64);
    };
    reader.onerror = () => {
      setIngestionError('Failed to read PDF file.');
    };
    reader.readAsDataURL(file);
  };

  // Load Ingested Jobs
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, `users/${user.uid}/ingestedJobs`),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setIngestedJobs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as IngestedJob)));
    });
    return unsubscribe;
  }, [user]);

  // Handle Ingestion
  const handleIngest = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const isUrlMode = ingestionTab === 'url';
    const isPdfMode = !!pdfBase64;
    const resolvedUrl = isUrlMode ? url.trim() : '';
    const resolvedText = isUrlMode || isPdfMode ? '' : pastedText.trim();

    if (isUrlMode && !resolvedUrl) {
      setIngestionError('Please enter a valid job posting URL.');
      return;
    }
    if (!isUrlMode && !resolvedText && !isPdfMode) {
      setIngestionError('Please paste the job description/email text or select a PDF document.');
      return;
    }

    setIsIngesting(true);
    setIngestionError(null);

    const boardType = ingestionTab === 'dice_email' ? 'dice_email' : (ingestionTab === 'govjobs' ? 'govjobs' : (isUrlMode ? 'url' : 'paste'));

    try {
      const response = await fetch('/api/ingest-job', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(userApiKey.trim() ? { 'x-gemini-api-key': userApiKey.trim() } : {})
        },
        body: JSON.stringify({ 
          url: resolvedUrl || undefined, 
          pastedText: resolvedText || undefined,
          fileContent: pdfBase64 || undefined,
          isPdf: isPdfMode,
          fileName: pdfFileName || undefined,
          boardType,
          apiKey: userApiKey.trim() || undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to ingest job posting. Please check the document/text and try again.');
      }

      const jobData = await response.json();
      
      // Canonicalize URL and deterministically extract stable job document identifier
      const canonicalUrl = resolvedUrl ? canonicalizeJobUrl(resolvedUrl) : '';
      const jobDocId = extractJobIdentifier(canonicalUrl || resolvedUrl, resolvedText || pdfFileName || jobData.description || jobData.title);

      // 1. Save to Candidate's Personal Ingested Tracker under users/{uid}/ingestedJobs/{jobDocId}
      const jobRef = doc(db, `users/${user.uid}/ingestedJobs`, jobDocId);
      const rawPayload: any = {
        title: jobData.title || 'Unknown Role',
        companyName: jobData.companyName || 'Unknown Employer',
        description: jobData.description || '',
        requirements: jobData.requirements || '',
        location: jobData.location || 'Not Specified',
        workplaceType: jobData.workplaceType || 'Remote',
        salaryMin: jobData.salaryMin || undefined,
        salaryMax: jobData.salaryMax || undefined,
        salaryType: jobData.salaryType || undefined,
        requiredSkills: jobData.requiredSkills || [],
        preferredSkills: jobData.preferredSkills || [],
        benefits: jobData.benefits || [],
        extractedId: jobDocId,
        canonicalUrl: canonicalUrl || undefined,
        status: 'ingested',
        sourceBoard: jobData.sourceBoard || (ingestionTab === 'dice_email' ? 'Dice Recruiter Email' : (ingestionTab === 'govjobs' ? 'GovernmentJobs / NEOGOV' : undefined)),
        jobNumber: jobData.jobNumber || undefined,
        department: jobData.department || undefined,
        recruiterInfo: jobData.recruiterInfo || undefined,
        expiresAt: jobData.expiresAt || undefined,
        lastSeenAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        insights: jobData.insights || undefined
      };

      const cleanPayload = sanitizeFirestorePayload(rawPayload);
      await setDoc(jobRef, cleanPayload, { merge: true });

      // 2. Canonical Recruiter/ATS Parity: Mirror to global canonical `jobs/{jobDocId}` collection
      try {
        const globalJobRef = doc(db, 'jobs', jobDocId);
        const leadId = (jobData.recruiterInfo?.email || '').toLowerCase().replace(/[^a-z0-9]/g, '_');
        const canonicalGlobalPayload = sanitizeFirestorePayload({
          id: jobDocId,
          companyId: jobData.recruiterInfo?.firmName ? `firm_${leadId}` : `company_${jobDocId}`,
          companyName: jobData.companyName || 'Employer',
          posterFirmId: jobData.recruiterInfo?.firmName ? user.uid : undefined,
          posterFirmName: jobData.recruiterInfo?.firmName || undefined,
          recruiterInfo: jobData.recruiterInfo || undefined,
          sourceBoard: jobData.sourceBoard || (ingestionTab === 'dice_email' ? 'Dice Recruiter Email' : (ingestionTab === 'govjobs' ? 'GovernmentJobs / NEOGOV' : 'Candidate Ingestion')),
          title: jobData.title || 'Position',
          description: jobData.description || '',
          requirements: jobData.requirements || '',
          jobNumber: jobData.jobNumber || undefined,
          department: jobData.department || undefined,
          workplaceType: jobData.workplaceType || 'Remote',
          location: jobData.location || 'United States',
          salaryMin: jobData.salaryMin || undefined,
          salaryMax: jobData.salaryMax || undefined,
          salaryType: jobData.salaryType || undefined,
          benefits: jobData.benefits || [],
          requiredSkills: jobData.requiredSkills || [],
          preferredSkills: jobData.preferredSkills || [],
          parsedCriteria: {
            skills: [...(jobData.requiredSkills || []), ...(jobData.preferredSkills || [])],
            requiredSkills: jobData.requiredSkills || [],
            preferredSkills: jobData.preferredSkills || [],
            minExperience: 2,
            salaryRange: { min: jobData.salaryMin || 0, max: jobData.salaryMax || 0 },
            workplaceType: jobData.workplaceType || 'Remote',
            location: jobData.location || 'United States',
            benefits: jobData.benefits || []
          },
          status: 'active',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          isIngestedFromCandidate: true,
          candidateIngestedBy: user.uid
        });
        await setDoc(globalJobRef, canonicalGlobalPayload, { merge: true });
      } catch (mirrorErr) {
        console.warn("Could not mirror to canonical jobs collection:", mirrorErr);
      }

      // Discovered Recruiter Lead generation for Admin Outreach
      if (jobData.recruiterInfo?.email) {
        try {
          const leadId = (jobData.recruiterInfo.email || '').toLowerCase().replace(/[^a-z0-9]/g, '_');
          const leadRef = doc(db, 'recruiter_leads', leadId);
          const leadPayload = sanitizeFirestorePayload({
            recruiterName: jobData.recruiterInfo.name || 'Unknown Recruiter',
            recruiterEmail: jobData.recruiterInfo.email,
            recruiterPhone: jobData.recruiterInfo.phone || null,
            firmName: jobData.recruiterInfo.firmName || jobData.companyName,
            clientName: jobData.recruiterInfo.clientName || null,
            sourceBoard: jobData.sourceBoard || 'Dice Recruiter Email',
            jobTitle: jobData.title,
            discoveredByUid: user.uid,
            discoveredByEmail: user.email,
            status: 'discovered',
            createdAt: serverTimestamp(),
            lastDiscoveredAt: serverTimestamp()
          });
          await setDoc(leadRef, leadPayload, { merge: true });
        } catch (leadErr) {
          console.warn("Could not save recruiter lead for admin outreach:", leadErr);
        }
      }

      setUrl('');
      setPastedText('');
      setPdfFile(null);
      setPdfBase64(null);
      setPdfFileName(null);
      
      // Select the newly ingested job automatically to load details
      setSelectedJob({ id: jobDocId, ...cleanPayload });
      setActiveDetailTab('insights');
      setChatMessages([]);
      setTailoredResume(null);

    } catch (err: any) {
      console.error(err);
      setIngestionError(err.message || 'Failed to parse the job details. Please try pasting the text or re-uploading the PDF.');
    } finally {
      setIsIngesting(false);
    }
  };

  // Handle AI deep second pass enhancement
  const handleEnhanceJob = async (job: IngestedJob) => {
    if (!user || !job) return;
    setIsEnhancing(true);
    setEnhanceError(null);

    try {
      const response = await fetch('/api/ingest-job/enhance', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(userApiKey.trim() ? { 'x-gemini-api-key': userApiKey.trim() } : {})
        },
        body: JSON.stringify({ 
          job, 
          apiKey: userApiKey.trim() || undefined 
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to perform deep AI analysis.');
      }

      const enhancedJob = await response.json();

      // Update Firestore with the enhanced fields and mark as AI enhanced
      const jobRef = doc(db, `users/${user.uid}/ingestedJobs`, job.id);
      const updatePayload = {
        title: enhancedJob.title,
        companyName: enhancedJob.companyName,
        description: enhancedJob.description,
        requirements: enhancedJob.requirements,
        location: enhancedJob.location,
        workplaceType: enhancedJob.workplaceType,
        salaryMin: enhancedJob.salaryMin || null,
        salaryMax: enhancedJob.salaryMax || null,
        requiredSkills: enhancedJob.requiredSkills || [],
        preferredSkills: enhancedJob.preferredSkills || [],
        benefits: enhancedJob.benefits || [],
        insights: enhancedJob.insights,
        isAiEnhanced: true,
        status: 'researched' as const
      };

      await setDoc(jobRef, updatePayload, { merge: true });

      // Update selectedJob state instantly
      setSelectedJob(prev => prev ? { ...prev, ...updatePayload } : null);

      setCustomAlert({
        isOpen: true,
        title: 'Gemini Deep Scan Active!',
        message: 'Successfully completed the advanced AI second pass. Extracted latent qualifications, custom interview responses, and a tailored pitch strategy!'
      });
    } catch (err: any) {
      console.error(err);
      setEnhanceError(err.message || 'AI Enhancement failed. Please check your network and Gemini API key.');
      setCustomAlert({
        isOpen: true,
        title: 'Deep Scan Failed',
        message: err.message || 'We could not complete the deep AI second-pass. Please make sure the Gemini API is correctly configured.'
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  // Delete Job Tracker item
  const handleDeleteJob = (jobId: string, e: any) => {
    e.stopPropagation();
    if (!user) return;

    setCustomConfirm({
      isOpen: true,
      title: 'Remove Position?',
      message: 'Are you sure you want to remove this job from your tracker? This will delete all parsed criteria and saved insights.',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, `users/${user.uid}/ingestedJobs`, jobId));
          if (selectedJob?.id === jobId) setSelectedJob(null);
        } catch (err) {
          console.error(err);
          setCustomAlert({
            isOpen: true,
            title: 'Delete Failed',
            message: 'Failed to delete job entry. Please check your network and try again.'
          });
        }
      }
    });
  };

  // Update Status
  const handleUpdateStatus = async (jobId: string, newStatus: IngestedJob['status']) => {
    if (!user) return;
    try {
      const jobRef = doc(db, `users/${user.uid}/ingestedJobs`, jobId);
      await setDoc(jobRef, { status: newStatus }, { merge: true });
      if (selectedJob?.id === jobId) {
        setSelectedJob(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save manually edited / customized description & requirements
  const handleSaveChanges = async () => {
    if (!user || !selectedJob) return;
    try {
      const jobRef = doc(db, `users/${user.uid}/ingestedJobs`, selectedJob.id);
      const updatePayload = {
        description: editDescription,
        requirements: editRequirements
      };
      await setDoc(jobRef, updatePayload, { merge: true });

      // Update selectedJob state instantly
      setSelectedJob(prev => prev ? { ...prev, ...updatePayload } : null);
      
      // Update ingestedJobs list to keep them in sync
      setIngestedJobs(prev => prev.map(job => job.id === selectedJob.id ? { ...job, ...updatePayload } : job));

      setIsEditingText(false);

      setCustomAlert({
        isOpen: true,
        title: 'Changes Saved Successfully',
        message: 'Your custom formatting changes have been saved and applied to this job posting.'
      });
    } catch (err: any) {
      console.error(err);
      setCustomAlert({
        isOpen: true,
        title: 'Error Saving Changes',
        message: err.message || 'Failed to save custom text updates. Please try again.'
      });
    }
  };

  const handleReapplyHeuristics = async (type: 'desc' | 'req') => {
    const textToFormat = type === 'desc' ? editDescription : editRequirements;
    if (!textToFormat || !textToFormat.trim()) {
      setCustomAlert({
        isOpen: true,
        title: 'Empty Content',
        message: 'Please paste or write some text before running the styling engine.'
      });
      return;
    }

    if (type === 'desc') setIsFormattingDesc(true);
    else setIsFormattingReq(true);

    try {
      const response = await fetch('/api/ingest-job/heuristic-format', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToFormat })
      });

      if (!response.ok) {
        throw new Error('Failed to apply heuristic formatting.');
      }

      const data = await response.json();
      if (type === 'desc') {
        setEditDescription(data.formatted);
      } else {
        setEditRequirements(data.formatted);
      }
    } catch (err: any) {
      console.error(err);
      setCustomAlert({
        isOpen: true,
        title: 'Formatting Failed',
        message: err.message || 'Could not re-apply heuristic formatting. Please try again.'
      });
    } finally {
      setIsFormattingDesc(false);
      setIsFormattingReq(false);
    }
  };

  // Trigger Copilot Message
  const handleSendCopilotMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedJob || isSendingMessage) return;

    const userMsg = { sender: 'user' as const, text: chatInput.trim(), timestamp: new Date().toLocaleTimeString() };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsSendingMessage(true);

    try {
      const response = await fetch('/api/ingest-job/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(userApiKey.trim() ? { 'x-gemini-api-key': userApiKey.trim() } : {})
        },
        body: JSON.stringify({
          messages: [...chatMessages, userMsg],
          job: selectedJob,
          profile,
          apiKey: userApiKey.trim() || undefined
        })
      });

      if (!response.ok) throw new Error('Copilot went offline.');
      const resData = await response.json();
      setChatMessages(prev => [...prev, {
        sender: 'bot',
        text: resData.text,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } catch (err: any) {
      setChatMessages(prev => [...prev, {
        sender: 'bot',
        text: `Error: ${err.message || 'Copilot failed to respond. Please verify your connection.'}`,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Trigger Resume Tailoring
  const handleTailorResume = async () => {
    if (!selectedJob || isGeneratingResume) return;
    setIsGeneratingResume(true);
    setTailoredResume(null);

    try {
      const response = await fetch('/api/tailor-resume', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(userApiKey.trim() ? { 'x-gemini-api-key': userApiKey.trim() } : {})
        },
        body: JSON.stringify({ 
          job: selectedJob, 
          profile,
          apiKey: userApiKey.trim() || undefined 
        })
      });

      if (!response.ok) throw new Error('Failed to generate tailored resume.');
      const resumeData = await response.json();
      setTailoredResume(resumeData);
      
      // Update local tracking status to "tailored"
      await handleUpdateStatus(selectedJob.id, 'tailored');
    } catch (err: any) {
      console.error(err);
      setCustomAlert({
        isOpen: true,
        title: 'Generation Failed',
        message: 'Failed to generate tailored resume. Please verify that your profile experience section contains valid data and try again.'
      });
    } finally {
      setIsGeneratingResume(false);
    }
  };

  // Printing Action
  const handlePrintResume = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      {/* 1. Job Ingest Section */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white rounded-[2rem] p-6 sm:p-8 border border-slate-700/60 shadow-2xl relative overflow-hidden">
        {/* Decorative ambient background glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-700/50">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <div className="bg-blue-500/20 text-blue-400 p-1.5 rounded-xl border border-blue-500/30">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-blue-400">Candidate Ingestion Engine</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                  Canonical Job & Outreach Parser
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setTempApiKey(userApiKey);
                    setIsApiKeyModalOpen(true);
                  }}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all flex items-center gap-1.5 cursor-pointer ${
                    userApiKey.trim()
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 hover:bg-purple-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200 hover:bg-slate-700'
                  }`}
                  title="Configure personal Gemini AI API key for client-side execution"
                >
                  <Key className="w-3 h-3 text-purple-400" />
                  <span>{userApiKey.trim() ? 'Personal AI Key Active' : 'Configure Custom AI Key'}</span>
                </button>
              </div>
              <h2 className="text-2xl font-black tracking-tight">Ingest & Map Position Specifications</h2>
            </div>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed hidden md:block">
              Analyze job postings from URLs, raw text, or PDF outreach emails. Maps required skills, calculates match percentages against your profile, and unlocks AI STAR interview coaching.
            </p>
          </div>

          {/* Ingestion Mode Segmented Navigation */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 bg-slate-950/70 border border-slate-700/60 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => {
                setIngestionTab('url');
                setIngestionError(null);
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                ingestionTab === 'url'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span className="truncate">Job URL</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIngestionTab('paste');
                setIngestionError(null);
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                ingestionTab === 'paste'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <FileUp className="w-3.5 h-3.5" />
              <span className="truncate">Standard Job Text</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIngestionTab('govjobs');
                setIngestionError(null);
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                ingestionTab === 'govjobs'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="truncate">GovJobs / NEOGOV</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIngestionTab('dice_email');
                setIngestionError(null);
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                ingestionTab === 'dice_email'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span className="truncate">Dice Outreach</span>
            </button>
          </div>

          <form onSubmit={handleIngest} className="space-y-4">
            {ingestionTab === 'url' ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="url"
                      placeholder="Paste LinkedIn, Indeed, Dice, or direct job posting URL (https://...)"
                      value={url}
                      onChange={e => setUrl(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-950/90 border border-slate-700/80 rounded-2xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-100 placeholder-slate-500 shadow-inner"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isIngesting || !url.trim()}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all cursor-pointer whitespace-nowrap"
                  >
                    {isIngesting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Extracting URL...</span>
                      </>
                    ) : (
                      <>
                        <span>Ingest Job Link</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3 text-xs text-amber-300">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Scraper Notice:</strong> Career platforms like LinkedIn and Indeed often require active user authentication. If URL extraction produces limited details, switch to the <strong>Standard Job Text</strong> or <strong>Dice Outreach</strong> tabs to paste text or upload the PDF for 100% precision!
                  </p>
                </div>
              </div>
            ) : ingestionTab === 'govjobs' ? (
              <div className="space-y-4">
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-300">
                  <Globe className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>GovJobs & Public Sector Engine:</strong> Upload a PDF export or paste the full listing from GovernmentJobs.com, municipal portals, or NEOGOV. Automatically extracts Job Number, Department/Division, closing dates, and calculates annual salary from hourly pay scales.
                  </p>
                </div>

                {/* PDF File Upload Bar */}
                <div className="flex items-center justify-between bg-slate-950/80 p-3.5 rounded-2xl border border-emerald-500/30">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-slate-200 font-bold truncate max-w-xs sm:max-w-md">
                      {pdfFileName ? `Selected PDF: ${pdfFileName}` : 'Upload PDF export or paste listing text below'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs flex items-center gap-1.5 border border-slate-600 transition-all shadow-xs">
                      <Download className="w-3.5 h-3.5 text-emerald-400 rotate-180" />
                      <span>{pdfFileName ? 'Change PDF' : 'Upload PDF'}</span>
                      <input
                        type="file"
                        accept="application/pdf,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handlePdfFileSelect(e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                    {pdfFileName && (
                      <button
                        type="button"
                        onClick={() => {
                          setPdfFile(null);
                          setPdfBase64(null);
                          setPdfFileName(null);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-400 cursor-pointer"
                        title="Remove PDF"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {!pdfFileName && (
                  <textarea
                    rows={8}
                    placeholder="Paste raw GovernmentJobs / NEOGOV job listing text here (e.g. Job Number: 26-00987, Department: Public Works, Salary: $42.50 - $55.00 Hourly)..."
                    value={pastedText}
                    onChange={e => setPastedText(e.target.value)}
                    className="w-full p-4 bg-slate-950/90 border border-emerald-500/30 rounded-2xl text-xs text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 placeholder-slate-500 leading-relaxed font-mono shadow-inner resize-none"
                  />
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isIngesting || (!pastedText.trim() && !pdfBase64)}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer whitespace-nowrap"
                  >
                    {isIngesting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Parsing Public Sector Listing...</span>
                      </>
                    ) : (
                      <>
                        <Globe className="w-4 h-4" />
                        <span>Ingest GovJob Posting</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : ingestionTab === 'dice_email' ? (
              <div className="space-y-4">
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-2.5 text-xs text-amber-300">
                  <Mail className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Dice & Outreach Parser:</strong> Upload the email PDF printout or paste the recruiter message. Automatically captures recruiter contact details, staffing agency, W2/C2C contract models, client names, and compensation rates.
                  </p>
                </div>

                {/* PDF File Upload Bar */}
                <div className="flex items-center justify-between bg-slate-950/80 p-3.5 rounded-2xl border border-amber-500/30">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span className="text-xs text-slate-200 font-bold truncate max-w-xs sm:max-w-md">
                      {pdfFileName ? `Selected PDF: ${pdfFileName}` : 'Upload email PDF printout or paste email text below'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs flex items-center gap-1.5 border border-slate-600 transition-all shadow-xs">
                      <Download className="w-3.5 h-3.5 text-amber-400 rotate-180" />
                      <span>{pdfFileName ? 'Change PDF' : 'Upload PDF'}</span>
                      <input
                        type="file"
                        accept="application/pdf,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handlePdfFileSelect(e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                    {pdfFileName && (
                      <button
                        type="button"
                        onClick={() => {
                          setPdfFile(null);
                          setPdfBase64(null);
                          setPdfFileName(null);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-400 cursor-pointer"
                        title="Remove PDF"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {!pdfFileName && (
                  <textarea
                    rows={8}
                    placeholder="Paste the recruiter email reach-out here (e.g. 'This is Nitin from Tekfortune... Role: DevOps Engineer... Location: Atlanta, GA... Work Auth: W2... Email: nitin@tekfortune.com')..."
                    value={pastedText}
                    onChange={e => setPastedText(e.target.value)}
                    className="w-full p-4 bg-slate-950/90 border border-amber-500/30 rounded-2xl text-xs text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500 placeholder-slate-500 leading-relaxed font-mono shadow-inner resize-none"
                  />
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isIngesting || (!pastedText.trim() && !pdfBase64)}
                    className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer whitespace-nowrap"
                  >
                    {isIngesting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Parsing Recruiter Outreach...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        <span>Ingest Recruiter Outreach</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-slate-950/80 p-3.5 rounded-2xl border border-slate-700/60">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span className="text-xs text-slate-200 font-bold truncate max-w-xs sm:max-w-md">
                      {pdfFileName ? `Selected PDF: ${pdfFileName}` : 'Upload job specification PDF or paste text below'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs flex items-center gap-1.5 border border-slate-600 transition-all shadow-xs">
                      <Download className="w-3.5 h-3.5 text-blue-400 rotate-180" />
                      <span>{pdfFileName ? 'Change PDF' : 'Upload PDF'}</span>
                      <input
                        type="file"
                        accept="application/pdf,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handlePdfFileSelect(e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                    {pdfFileName && (
                      <button
                        type="button"
                        onClick={() => {
                          setPdfFile(null);
                          setPdfBase64(null);
                          setPdfFileName(null);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-400 cursor-pointer"
                        title="Remove PDF"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {!pdfFileName && (
                  <textarea
                    rows={8}
                    placeholder="Paste the raw job description, qualifications, and requirements text directly here to bypass platform scraper restrictions and achieve 100% extraction accuracy..."
                    value={pastedText}
                    onChange={e => setPastedText(e.target.value)}
                    className="w-full p-4 bg-slate-950/90 border border-slate-700/80 rounded-2xl text-xs text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 placeholder-slate-500 leading-relaxed shadow-inner resize-none"
                  />
                )}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isIngesting || (!pastedText.trim() && !pdfBase64)}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all cursor-pointer whitespace-nowrap"
                  >
                    {isIngesting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Analyzing Position Document...</span>
                      </>
                    ) : (
                      <>
                        <span>Analyze & Ingest Document</span>
                        <Check className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {ingestionError && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-rose-300 animate-pulse">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Ingestion Warning: </span>
                  {ingestionError}
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* 2. Ingested List Table & Detail view */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left column: Tracker List */}
        <div className={`${selectedJob ? 'lg:col-span-5' : 'lg:col-span-12'} space-y-4`}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Pipeline Tracker</h3>
            <span className="text-xs text-slate-500 font-semibold">{ingestedJobs.length} Positions tracked</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {ingestedJobs.map((job) => {
              const breakdown = getMatchBreakdown(profile, {
                ...job,
                title: job.title || 'Role',
                description: job.description || '',
                requirements: job.requirements || '',
                workplaceType: job.workplaceType || 'Remote',
                requiredSkills: job.requiredSkills || [],
                preferredSkills: job.preferredSkills || [],
                parsedCriteria: {
                  salaryRange: { min: job.salaryMin || 100000, max: job.salaryMax || 150000 },
                  workplaceType: job.workplaceType || 'Remote',
                  minExperience: 1,
                  benefits: job.benefits || [],
                  requiredSkills: job.requiredSkills || [],
                  preferredSkills: job.preferredSkills || [],
                  ...(job.parsedCriteria || {})
                }
              } as any);

              const isSelected = selectedJob?.id === job.id;

              return (
                <div
                  key={job.id}
                  onClick={() => {
                    setSelectedJob(job);
                    setChatMessages([]);
                    setTailoredResume(null);
                    setActiveDetailTab('insights');
                    setIsEditingText(false);
                    setEditDescription(job.description || '');
                    setEditRequirements(job.requirements || '');
                  }}
                  className={`p-6 bg-white dark:bg-slate-900 rounded-3xl border transition-all cursor-pointer text-left relative group ${
                    isSelected
                      ? 'border-blue-500 ring-2 ring-blue-500/10'
                      : 'border-slate-100 dark:border-slate-800/80 hover:shadow-lg'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h4 className="font-bold text-base text-slate-900 dark:text-slate-100 leading-tight group-hover:text-blue-600 transition-colors">{job.title}</h4>
                      <p className="text-xs font-semibold text-slate-500 mt-1">{job.companyName}</p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteJob(job.id, e)}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-all"
                      title="Delete from tracker"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4 text-[10px] font-bold">
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg">
                      {job.workplaceType} • {job.location}
                    </span>
                    <span className={`px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                      job.status === 'applied' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                      job.status === 'tailored' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' :
                      job.status === 'researched' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                      'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      {job.status}
                    </span>
                    {job.isAiEnhanced ? (
                      <span className="bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 px-2.5 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1 font-extrabold shrink-0">
                        <Sparkles className="w-3 h-3 text-purple-500 animate-pulse" /> AI Deep Scan
                      </span>
                    ) : (
                      <span className="bg-blue-50/80 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 px-2.5 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1 shrink-0">
                        <Check className="w-3 h-3 text-blue-500" /> Local NLP
                      </span>
                    )}
                    {job.sourceBoard && (
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg flex items-center gap-1 font-bold">
                        {job.sourceBoard.includes('Dice') ? <Mail className="w-3 h-3 text-amber-500" /> : <Globe className="w-3 h-3 text-emerald-500" />}
                        {job.sourceBoard}
                      </span>
                    )}
                    {job.jobNumber && (
                      <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-lg font-mono font-bold">
                        #{job.jobNumber}
                      </span>
                    )}
                    {job.recruiterInfo?.name && (
                      <span className="bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-lg flex items-center gap-1 font-bold">
                        <UserCheck className="w-3 h-3 text-amber-500" /> {job.recruiterInfo.name} ({job.recruiterInfo.firmName || 'Agency'})
                      </span>
                    )}
                    <span className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 ${
                      breakdown.overallScore >= 85 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      breakdown.overallScore >= 70 ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                      breakdown.overallScore >= 50 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300'
                    }`}>
                      <Sparkles className="w-3 h-3 text-purple-400" />
                      <span>{breakdown.overallScore}% Match</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-3 border-t border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                    <span>Added {job.createdAt ? new Date(job.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}</span>
                    <span className="text-blue-600 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                      Analyze Job & Resume <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}

            {ingestedJobs.length === 0 && (
              <div className="py-16 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl text-slate-400">
                <FileText className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                <h4 className="font-bold text-sm mb-1">Your Tracker is Empty</h4>
                <p className="text-xs max-w-xs mx-auto">Ingest your first LinkedIn or Indeed job URL above to start tracking and tailoring applications.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Copilot & Resume Tool Drawer */}
        {selectedJob && (
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col h-[680px]">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900 flex items-center justify-between gap-4 shrink-0">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full">
                    {selectedJob.workplaceType}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">{selectedJob.companyName}</span>
                </div>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100 leading-snug">{selectedJob.title}</h3>
              </div>
              
              <button
                onClick={() => setSelectedJob(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* In-Drawer Sub Tabs */}
            <div className="flex border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/20 dark:bg-slate-950 px-4 shrink-0">
              <button
                onClick={() => setActiveDetailTab('insights')}
                className={`py-3 px-4 font-bold text-xs relative ${
                  activeDetailTab === 'insights' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> Core Insights
                </span>
                {activeDetailTab === 'insights' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
              </button>

              <button
                onClick={() => setActiveDetailTab('chat')}
                className={`py-3 px-4 font-bold text-xs relative ${
                  activeDetailTab === 'chat' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4" /> Copilot Chat
                </span>
                {activeDetailTab === 'chat' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
              </button>

              <button
                onClick={() => setActiveDetailTab('resume')}
                className={`py-3 px-4 font-bold text-xs relative ${
                  activeDetailTab === 'resume' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4" /> Tailored Resume
                </span>
                {activeDetailTab === 'resume' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
              </button>
            </div>

            {/* Active Content Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 dark:bg-slate-900/10">
              {activeDetailTab === 'insights' && (
                <div className="space-y-6 text-left">
                  {/* AI Deep Scan Second-Pass Invitation Banner */}
                  {!selectedJob.isAiEnhanced && (
                    <div className="p-5 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-purple-500/5 border border-blue-500/20 dark:border-blue-500/30 rounded-3xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 font-extrabold text-xs uppercase tracking-wider mb-1">
                          <Sparkles className="w-4 h-4 animate-pulse text-blue-500" /> Local NLP Active
                        </div>
                        <h5 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 mb-1">Extract Latent Insights with Gemini</h5>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg">
                          Basic local parsing successfully processed this job posting. Do you want to run a deep second pass with Gemini to identify unstated expectations, generate specialized interview guides, and refine your pitch strategy?
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleEnhanceJob(selectedJob)}
                        disabled={isEnhancing}
                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold text-xs px-5 py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/15 cursor-pointer whitespace-nowrap"
                      >
                        {isEnhancing ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Scanning Post...</span>
                          </>
                        ) : (
                          <>
                            <span>Run Deep AI Scan</span>
                            <Sparkles className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Recruiter Outreach Card (Dice / Email Reach-out) */}
                  {selectedJob.recruiterInfo && (
                    <div className="p-5 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-orange-500/10 border border-amber-500/30 rounded-3xl space-y-4 shadow-sm">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-500 dark:text-amber-400 uppercase tracking-wider">
                          <div className="p-1.5 bg-amber-500/20 rounded-lg">
                            <Mail className="w-4 h-4 text-amber-500" />
                          </div>
                          <span>Direct Recruiter Outreach Intelligence</span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {selectedJob.recruiterInfo.contractType && (
                            <span className="text-[10px] bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold px-2.5 py-1 rounded-full border border-amber-500/30">
                              {selectedJob.recruiterInfo.contractType}
                            </span>
                          )}
                          {selectedJob.recruiterInfo.workAuth && (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold px-2.5 py-1 rounded-full border border-emerald-500/30">
                              {selectedJob.recruiterInfo.workAuth}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {selectedJob.recruiterInfo.name && (
                          <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-2xl border border-amber-200/50 dark:border-slate-800 shadow-xs">
                            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Recruiter</span>
                            <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">{selectedJob.recruiterInfo.name}</span>
                            {selectedJob.recruiterInfo.firmName && (
                              <span className="text-slate-500 dark:text-slate-400 block text-[11px] font-medium mt-0.5">
                                @ {selectedJob.recruiterInfo.firmName}
                              </span>
                            )}
                          </div>
                        )}

                        {selectedJob.recruiterInfo.email && (
                          <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-2xl border border-amber-200/50 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Direct Email</span>
                              <span className="font-bold text-blue-600 dark:text-blue-400 text-xs break-all block">
                                {selectedJob.recruiterInfo.email}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                              <button
                                type="button"
                                onClick={() => {
                                  if (selectedJob.recruiterInfo?.email) {
                                    navigator.clipboard.writeText(selectedJob.recruiterInfo.email);
                                    setCopiedEmailKey('recruiter_email');
                                    setTimeout(() => setCopiedEmailKey(null), 2500);
                                  }
                                }}
                                className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer transition-all"
                              >
                                {copiedEmailKey === 'recruiter_email' ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                    <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy Email</span>
                                  </>
                                )}
                              </button>
                              <a
                                href={`mailto:${selectedJob.recruiterInfo.email}?subject=${encodeURIComponent(`Application / Interest: ${selectedJob.title}`)}&body=${encodeURIComponent(`Hi ${selectedJob.recruiterInfo.name || 'there'},\n\nI saw your reach-out regarding the ${selectedJob.title} position at ${selectedJob.recruiterInfo.firmName || selectedJob.companyName}. My experience strongly aligns with your qualifications.\n\nBest regards,\n${profile?.personalInfo ? `${profile.personalInfo.firstName} ${profile.personalInfo.lastName}` : ''}`)}`}
                                className="text-[10px] font-bold px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1 cursor-pointer transition-all"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Email Recruiter</span>
                              </a>
                            </div>
                          </div>
                        )}

                        {selectedJob.recruiterInfo.phone && (
                          <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-2xl border border-amber-200/50 dark:border-slate-800 shadow-xs">
                            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Direct Phone / Desk</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1">
                              <Phone className="w-3 h-3 text-amber-500" />
                              {selectedJob.recruiterInfo.phone}
                            </span>
                          </div>
                        )}

                        {selectedJob.recruiterInfo.clientName && (
                          <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-2xl border border-amber-200/50 dark:border-slate-800 shadow-xs">
                            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">End Client</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-indigo-500" />
                              {selectedJob.recruiterInfo.clientName}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Public Sector / GovJobs Card */}
                  {(selectedJob.jobNumber || selectedJob.department) && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                        <Globe className="w-4 h-4 text-emerald-400" /> GovernmentJobs / NEOGOV Specification
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {selectedJob.jobNumber && (
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase block">Requisition #</span>
                            <span className="font-mono font-bold text-slate-200">#{selectedJob.jobNumber}</span>
                          </div>
                        )}
                        {selectedJob.department && (
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase block">Department / Agency</span>
                            <span className="font-bold text-slate-200">{selectedJob.department}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Matching breakdown metrics */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Matching Skills Mapping</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedJob.requiredSkills.map(skill => {
                        const hasSkill = profile?.skills?.some(s => {
                          const name = typeof s === 'string' ? s : s.name;
                          return name.toLowerCase() === skill.toLowerCase();
                        });

                        return (
                          <span
                            key={skill}
                            className={`text-xs px-3 py-1.5 rounded-xl font-semibold border flex items-center gap-1.5 ${
                              hasSkill
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60'
                                : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-800/60'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${hasSkill ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            {skill}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* AI Generated Strategy Insight Card */}
                  {selectedJob.insights?.matchStrategy && (
                    <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-2xl">
                      <h4 className="text-xs font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5 mb-2 uppercase tracking-wider">
                        <Sparkles className="w-4 h-4 text-blue-500" /> Strategic Application Angle
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                        {selectedJob.insights.matchStrategy}
                      </p>
                    </div>
                  )}

                  {/* Unstated Expectations section */}
                  {selectedJob.insights?.unstatedExpectations && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Unstated & Implicit Expectations</h4>
                      <div className="space-y-2">
                        {selectedJob.insights.unstatedExpectations.map((exp, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                            <span className="text-blue-500 font-bold shrink-0 mt-0.5">•</span>
                            <span>{exp}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mock Interview Prep questions */}
                  {selectedJob.insights?.interviewQuestions && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Mock Interview Preparation</h4>
                      <div className="space-y-4">
                        {selectedJob.insights.interviewQuestions.map((q, idx) => (
                          <div key={idx} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">Q: {q.question}</p>
                            <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-100/50 dark:border-slate-800/50">
                              <span className="font-bold text-[10px] uppercase text-blue-600 dark:text-blue-400 block mb-1">Recruiter Advice:</span>
                              {q.answer}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Complete Role Details, Formatting, and Customizer Segment */}
                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Position Details & Formatting</h4>
                      {!isEditingText && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditDescription(selectedJob.description || '');
                            setEditRequirements(selectedJob.requirements || '');
                            setIsEditingText(true);
                          }}
                          className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-500 flex items-center gap-1 cursor-pointer bg-blue-500/5 hover:bg-blue-500/10 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 px-3 py-1.5 rounded-xl transition-all"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Customize Formatting</span>
                        </button>
                      )}
                    </div>

                    {isEditingText ? (
                      <div className="space-y-4 bg-slate-50/50 dark:bg-slate-900/60 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 text-left">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                              Role Description <span className="text-slate-400 font-normal">(Markdown Supported)</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => handleReapplyHeuristics('desc')}
                              disabled={isFormattingDesc}
                              className="text-[10px] font-bold text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg cursor-pointer transition-all disabled:opacity-50"
                            >
                              {isFormattingDesc ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                                  <span>Formatting...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3 h-3 text-amber-500" />
                                  <span>Auto-Format Description</span>
                                </>
                              )}
                            </button>
                          </div>
                          <textarea
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            rows={6}
                            placeholder="Paste or write the general job description details..."
                            className="w-full text-xs p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-200 leading-relaxed font-mono overscroll-contain"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                              Key Requirements & Skills <span className="text-slate-400 font-normal">(Markdown Supported)</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => handleReapplyHeuristics('req')}
                              disabled={isFormattingReq}
                              className="text-[10px] font-bold text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg cursor-pointer transition-all disabled:opacity-50"
                            >
                              {isFormattingReq ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                                  <span>Formatting...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3 h-3 text-amber-500" />
                                  <span>Auto-Format Requirements</span>
                                </>
                              )}
                            </button>
                          </div>
                          <textarea
                            value={editRequirements}
                            onChange={(e) => setEditRequirements(e.target.value)}
                            rows={6}
                            placeholder="Paste or write the specific required skills and qualifications..."
                            className="w-full text-xs p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-200 leading-relaxed font-mono overscroll-contain"
                          />
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                          <button
                            type="button"
                            onClick={handleSaveChanges}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer shadow-sm transition-all flex items-center gap-1.5"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Save Custom Formats</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsEditingText(false)}
                            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {/* Role Description Panel */}
                        {selectedJob.description && (
                          <div className="space-y-2">
                            <h5 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Description</h5>
                            <div className="prose dark:prose-invert max-w-none text-xs text-slate-600 dark:text-slate-400 space-y-2 max-h-60 overflow-y-auto bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 leading-relaxed">
                              {renderSimpleMarkdown(selectedJob.description)}
                            </div>
                          </div>
                        )}

                        {/* Requirements Panel */}
                        {selectedJob.requirements && (
                          <div className="space-y-2">
                            <h5 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Requirements & Qualifications</h5>
                            <div className="prose dark:prose-invert max-w-none text-xs text-slate-600 dark:text-slate-400 space-y-2 max-h-60 overflow-y-auto bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 leading-relaxed">
                              {renderSimpleMarkdown(selectedJob.requirements)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeDetailTab === 'chat' && (
                <div className="flex flex-col h-full text-left">
                  {/* Messages list */}
                  <div className="flex-1 space-y-4 pb-4 overflow-y-auto min-h-[350px]">
                    {chatMessages.length === 0 && (
                      <div className="text-center py-12 text-slate-400 max-w-sm mx-auto">
                        <Bot className="w-10 h-10 mx-auto text-blue-500 mb-3" />
                        <h5 className="font-bold text-sm text-slate-700 dark:text-slate-200 mb-1">Ascend Career Copilot</h5>
                        <p className="text-xs leading-relaxed">Ask any specific technical, operational, or strategic questions about this job description. I will break down exactly how your profile can stand out.</p>
                      </div>
                    )}

                    {chatMessages.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-500/10'
                            : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800 rounded-bl-none shadow-xs'
                        }`}>
                          {msg.sender === 'bot' ? (
                            <div className="space-y-1">{renderSimpleMarkdown(msg.text)}</div>
                          ) : (
                            <p>{msg.text}</p>
                          )}
                          <span className={`block text-[10px] mt-2 ${msg.sender === 'user' ? 'text-blue-200' : 'text-slate-400'} text-right`}>
                            {msg.timestamp}
                          </span>
                        </div>
                      </div>
                    ))}

                    {isSendingMessage && (
                      <div className="flex justify-start">
                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl rounded-bl-none p-4 flex items-center gap-2 text-xs text-slate-500">
                          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                          <span>Copilot is formulating response...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input form */}
                  <form onSubmit={handleSendCopilotMessage} className="flex gap-2 border-t border-slate-100 dark:border-slate-800/80 pt-4 bg-white dark:bg-slate-900 mt-auto shrink-0">
                    <input
                      type="text"
                      placeholder="Ask copilot: e.g. How do my React skills match this posting? What salary ranges should I target?"
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/60 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim() || isSendingMessage}
                      className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}

              {activeDetailTab === 'resume' && (
                <div className="text-left space-y-6">
                  {/* Preset settings */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                    <div>
                      <h4 className="font-bold text-xs">Aesthetic Layout Preset</h4>
                      <p className="text-[10px] text-slate-400">Select typography matches for your role archetype</p>
                    </div>
                    <div className="flex gap-2">
                      {(['classic', 'modern', 'minimalist'] as const).map((theme) => (
                        <button
                          key={theme}
                          onClick={() => setResumeTemplate(theme)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all border cursor-pointer ${
                            resumeTemplate === theme
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
                          }`}
                        >
                          {theme}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tailoring actions */}
                  {!tailoredResume ? (
                    <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-8 max-w-md mx-auto shadow-xs">
                      <Sparkles className="w-10 h-10 mx-auto text-blue-500 mb-3 animate-pulse" />
                      <h4 className="font-bold text-sm mb-1">Tailor Your Profile Resume</h4>
                      <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                        Gemini will dynamically rephrase and restructure your profile experience, summary, and highlighted skills to emphasize the exact keywords, achievements, and criteria in this job description.
                      </p>
                      <button
                        onClick={handleTailorResume}
                        disabled={isGeneratingResume}
                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/10 cursor-pointer w-full"
                      >
                        {isGeneratingResume ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Tailoring Bullet Points & Key Phrases...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            <span>Generate Tailored Resume with Gemini</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Check className="w-4 h-4" /> Customized Resume Active
                        </span>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={handleTailorResume}
                            disabled={isGeneratingResume}
                            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-100 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                            title="Regenerate tailoring"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingResume ? 'animate-spin' : ''}`} />
                            <span>Regen</span>
                          </button>

                          <button
                            onClick={handlePrintResume}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 shadow-md shadow-blue-500/10 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Print / Save PDF</span>
                          </button>
                        </div>
                      </div>

                      {/* Mock Paper Preview Container */}
                      <div
                        id="printable-resume"
                        className={`bg-white text-slate-900 p-8 sm:p-10 border border-slate-200 shadow-lg rounded-2xl mx-auto w-full max-w-[21cm] text-left relative aspect-[1/1.4] select-text overflow-hidden ${
                          resumeTemplate === 'classic' ? 'font-serif' : 'font-sans'
                        }`}
                      >
                        {/* Print styles injected locally */}
                        <style>{`
                          @media print {
                            body * {
                              visibility: hidden !important;
                            }
                            #printable-resume, #printable-resume * {
                              visibility: visible !important;
                            }
                            #printable-resume {
                              position: absolute !important;
                              left: 0 !important;
                              top: 0 !important;
                              width: 100% !important;
                              margin: 0 !important;
                              padding: 2cm !important;
                              box-shadow: none !important;
                              border: none !important;
                              background: white !important;
                              color: black !important;
                            }
                          }
                        `}</style>

                        {/* Candidate Information Header */}
                        <div className="text-center border-b pb-4 mb-6 border-slate-300">
                          <h1 className="text-2xl font-extrabold uppercase tracking-wide text-slate-900 leading-tight">
                            {profile?.personalInfo ? `${profile.personalInfo.firstName} ${profile.personalInfo.lastName}` : 'Candidate Name'}
                          </h1>
                          <p className="text-xs text-slate-500 mt-1 font-medium tracking-tight">
                            {profile?.targetRole || 'Professional Title'}
                          </p>
                          <div className="text-[10px] text-slate-400 mt-2 flex flex-wrap justify-center gap-3 font-semibold">
                            <span>{user?.email || 'candidate@example.com'}</span>
                            {profile?.personalInfo?.phone && <span>• {profile.personalInfo.phone}</span>}
                            {profile?.personalInfo?.portfolioUrl && <span>• {profile.personalInfo.portfolioUrl}</span>}
                          </div>
                        </div>

                        {/* Executive Summary */}
                        <div className="mb-6">
                          <h2 className="text-xs uppercase tracking-widest font-bold text-slate-800 mb-2 border-b pb-1 border-slate-200">
                            Professional Summary
                          </h2>
                          <p className="text-[11px] text-slate-700 leading-relaxed">
                            {tailoredResume.professionalSummary}
                          </p>
                        </div>

                        {/* Work Experience */}
                        <div className="mb-6">
                          <h2 className="text-xs uppercase tracking-widest font-bold text-slate-800 mb-3 border-b pb-1 border-slate-200">
                            Professional Experience
                          </h2>
                          <div className="space-y-4">
                            {tailoredResume.workExperience?.map((exp: any, i: number) => (
                              <div key={i} className="text-xs">
                                <div className="flex justify-between items-start font-bold text-slate-900 mb-1">
                                  <span>{exp.role}</span>
                                  <span className="text-[10px] text-slate-500 font-medium">{exp.startDate} - {exp.endDate}</span>
                                </div>
                                <div className="text-[10px] text-slate-500 font-bold mb-1.5 uppercase tracking-wide">{exp.company}</div>
                                <div className="text-[10px] text-slate-600 leading-relaxed pl-1">
                                  {renderSimpleMarkdown(exp.description)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Skills */}
                        <div className="mb-6">
                          <h2 className="text-xs uppercase tracking-widest font-bold text-slate-800 mb-2 border-b pb-1 border-slate-200">
                            Core Competencies & Skills
                          </h2>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-700 font-semibold pl-1">
                            {tailoredResume.skills?.map((skill: string, i: number) => (
                              <span key={i}>• {skill}</span>
                            ))}
                          </div>
                        </div>

                        {/* Education */}
                        {tailoredResume.education && tailoredResume.education.length > 0 && (
                          <div>
                            <h2 className="text-xs uppercase tracking-widest font-bold text-slate-800 mb-2 border-b pb-1 border-slate-200">
                              Education
                            </h2>
                            <div className="space-y-2">
                              {tailoredResume.education.map((edu: any, i: number) => (
                                <div key={i} className="text-[10px] flex justify-between">
                                  <div>
                                    <strong className="text-slate-900 font-bold">{edu.degree} in {edu.field}</strong>
                                    <p className="text-slate-500 mt-0.5">{edu.institution}</p>
                                  </div>
                                  <span className="text-slate-400 font-semibold">{edu.graduationDate}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Custom Confirmation Dialog */}
      <AnimatePresence>
        {customConfirm.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCustomConfirm(prev => ({ ...prev, isOpen: false }))}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs"
            />
            
            {/* Dialog Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl z-10 text-left"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-full flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">{customConfirm.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{customConfirm.message}</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setCustomConfirm(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (customConfirm.onConfirm) customConfirm.onConfirm();
                    setCustomConfirm(prev => ({ ...prev, isOpen: false }));
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-md shadow-rose-500/15 transition-all cursor-pointer"
                >
                  Remove Position
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Custom Alert Dialog */}
        {customAlert.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCustomAlert(prev => ({ ...prev, isOpen: false }))}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs"
            />
            
            {/* Dialog Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl z-10 text-left"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">{customAlert.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{customAlert.message}</p>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setCustomAlert(prev => ({ ...prev, isOpen: false }))}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md shadow-blue-500/15 transition-all cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {/* Custom API Key Configuration Modal */}
        {isApiKeyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsApiKeyModalOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
            />
            
            {/* Dialog Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 text-left"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-50 dark:bg-purple-950/40 text-purple-600 rounded-2xl flex items-center justify-center shrink-0 border border-purple-200 dark:border-purple-800">
                    <Key className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">Client-Side Gemini API Key</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Direct user execution for candidate AI calls</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsApiKeyModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                All client-side AI calls (PDF parsing, Deep second-pass scan, Copilot chat, and tailored resume generation) run seamlessly. You can provide your personal Gemini API key stored securely in your browser session.
              </p>

              <div className="space-y-3 mb-6">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Gemini API Key (AI Studio)
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="AIzaSy..."
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Keys are stored strictly in local browser storage.</span>
                  {userApiKey && (
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.removeItem('ascend_user_gemini_api_key');
                        setUserApiKey('');
                        setTempApiKey('');
                      }}
                      className="text-rose-500 hover:underline font-bold cursor-pointer"
                    >
                      Clear Saved Key
                    </button>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsApiKeyModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const cleanKey = tempApiKey.trim();
                    if (cleanKey) {
                      localStorage.setItem('ascend_user_gemini_api_key', cleanKey);
                      setUserApiKey(cleanKey);
                    } else {
                      localStorage.removeItem('ascend_user_gemini_api_key');
                      setUserApiKey('');
                    }
                    setIsApiKeyModalOpen(false);
                    setCustomAlert({
                      isOpen: true,
                      title: 'API Key Saved',
                      message: cleanKey 
                        ? 'Your custom Gemini API key is active. All subsequent AI requests will run with your dedicated quota.' 
                        : 'Custom API key removed. Returning to default system configuration.'
                    });
                  }}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-md shadow-purple-500/20 transition-all cursor-pointer"
                >
                  Save API Key
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
