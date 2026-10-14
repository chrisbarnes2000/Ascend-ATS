import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  Search, 
  Sparkles, 
  Clipboard, 
  ArrowRight, 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  History,
  Info,
  DollarSign,
  Calendar,
  Layers,
  ShieldCheck,
  Globe,
  Mail,
  Download,
  X,
  UserCheck
} from 'lucide-react';
import { db } from '../firebase/config';
import { collection, addDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { sanitizeFirestorePayload } from '../utils/firestoreSanitizer';

interface GovJobData {
  title: string;
  companyName: string;
  description: string;
  requirements: string;
  jobNumber?: string;
  department?: string;
  location?: string;
  workplaceType?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryType?: string;
  expiresAt?: string;
  requiredSkills: string[];
  preferredSkills: string[];
  benefits: string[];
  sourceBoard?: string;
  recruiterInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    firmName?: string;
    firmWebsite?: string;
    linkedInUrl?: string;
    clientName?: string;
    workAuth?: string;
    contractType?: string;
    rate?: string;
  };
  insights?: {
    interviewQuestions: Array<{ question: string; answer: string }>;
    unstatedExpectations: string[];
    matchStrategy: string;
  };
}

interface GovJobsBridgeProps {
  companyId?: string;
  companyName?: string;
  onJobIngested?: () => void;
}

export const GovJobsBridge: React.FC<GovJobsBridgeProps> = ({
  companyId,
  companyName,
  onJobIngested
}) => {
  const { user, appUser } = useAuth();
  const [bridgeMode, setBridgeMode] = useState<'govjobs' | 'dice_email'>('govjobs');
  const [pastedText, setPastedText] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [promptVersion, setPromptVersion] = useState<'v1' | 'v2' | 'v3'>('v2');
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestedJob, setIngestedJob] = useState<(GovJobData & { posterFirmName?: string; posterFirmId?: string }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handlePdfFileSelect = (file: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setError('Please upload a valid .pdf file.');
      return;
    }
    setPdfFileName(file.name);
    setPdfFile(file);
    setError(null);

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setPdfBase64(base64);
    };
    reader.onerror = () => {
      setError('Failed to read PDF document.');
    };
    reader.readAsDataURL(file);
  };

  const handleIngest = async () => {
    if (!pastedText.trim() && !pdfBase64) return;
    setIsIngesting(true);
    setError(null);
    setIngestedJob(null);

    try {
      const response = await fetch('/api/ingest-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          pastedText: pastedText.trim() || undefined,
          fileContent: pdfBase64 || undefined,
          isPdf: !!pdfBase64,
          fileName: pdfFileName || undefined,
          boardType: bridgeMode, 
          promptVersion,
          isRequisition: true,
          userSession: {
            uid: user?.uid,
            email: user?.email,
            accountType: appUser?.accountType,
            staffingFirmName: appUser?.staffingFirmName,
            staffingFirmId: appUser?.staffingFirmId
          }
        })
      });

      if (!response.ok) throw new Error('Failed to ingest job posting. Please check the document/text and try again.');

      const data = await response.json();
      setIngestedJob(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred during ingestion');
    } finally {
      setIsIngesting(false);
    }
  };

  const handleMirrorToAscend = async () => {
    if (!user || !ingestedJob) return;
    setIsIngesting(true);
    try {
      const rawJobPayload = {
        ...ingestedJob,
        companyId: companyId || user.uid,
        companyName: companyName || ingestedJob.companyName || 'Public Sector Agency',
        posterFirmId: ingestedJob.posterFirmId || user.uid,
        posterFirmName: ingestedJob.posterFirmName || appUser?.staffingFirmName || 'Ascend GovBridge',
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        parsedCriteria: {
          skills: [...(ingestedJob.requiredSkills || []), ...(ingestedJob.preferredSkills || [])],
          requiredSkills: ingestedJob.requiredSkills || [],
          preferredSkills: ingestedJob.preferredSkills || [],
          minExperience: 2,
          salaryRange: { min: ingestedJob.salaryMin || 0, max: ingestedJob.salaryMax || 0 },
          workplaceType: ingestedJob.workplaceType || 'On-Site',
          location: ingestedJob.location || 'Washington',
          benefits: ingestedJob.benefits || []
        }
      };

      const cleanPayload = sanitizeFirestorePayload(rawJobPayload);
      await addDoc(collection(db, 'jobs'), cleanPayload);

      // Auto-record discovered recruiter lead for Admin Outreach CRM
      if (ingestedJob.recruiterInfo?.email) {
        try {
          const leadId = (ingestedJob.recruiterInfo.email || '').toLowerCase().replace(/[^a-z0-9]/g, '_');
          const leadRef = doc(db, 'recruiter_leads', leadId);
          const leadPayload = sanitizeFirestorePayload({
            recruiterName: ingestedJob.recruiterInfo.name || 'Unknown Recruiter',
            recruiterEmail: ingestedJob.recruiterInfo.email,
            recruiterPhone: ingestedJob.recruiterInfo.phone || null,
            firmName: ingestedJob.recruiterInfo.firmName || ingestedJob.companyName || 'Staffing Firm',
            clientName: ingestedJob.recruiterInfo.clientName || null,
            sourceBoard: ingestedJob.sourceBoard || (bridgeMode === 'dice_email' ? 'Dice Recruiter Email' : 'GovernmentJobs / NEOGOV'),
            jobTitle: ingestedJob.title,
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

      setSuccess(`Successfully mirrored "${ingestedJob.title}" to your Ascend ATS requisitions.`);
      if (onJobIngested) {
        onJobIngested();
      }
      setTimeout(() => setSuccess(null), 5000);
      setIngestedJob(null);
      setPastedText('');
      setPdfFile(null);
      setPdfBase64(null);
      setPdfFileName(null);
    } catch (err: any) {
      setError('Failed to save job to database: ' + err.message);
    } finally {
      setIsIngesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl border border-indigo-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Globe className="w-32 h-32 text-indigo-400" />
        </div>
        
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                {bridgeMode === 'govjobs' ? <Building2 className="w-6 h-6 text-indigo-400" /> : <Mail className="w-6 h-6 text-amber-400" />}
                {bridgeMode === 'govjobs' ? 'GovJobs Strategic Bridge' : 'Dice & Recruiter Reach-Out Bridge'}
              </h2>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-widest ${
                bridgeMode === 'govjobs' 
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' 
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}>
                {bridgeMode === 'govjobs' ? 'NEOGOV Integration' : 'Dice Email Parser'}
              </span>
            </div>

            {/* Source Mode Toggle */}
            <div className="flex bg-slate-800/80 p-1 rounded-2xl border border-slate-700/80 gap-1">
              <button
                type="button"
                onClick={() => setBridgeMode('govjobs')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  bridgeMode === 'govjobs'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-indigo-300" /> GovJobs / NEOGOV
              </button>
              <button
                type="button"
                onClick={() => setBridgeMode('dice_email')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  bridgeMode === 'dice_email'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Mail className="w-3.5 h-3.5 text-amber-300" /> Dice / Email Outreach
              </button>
            </div>
          </div>
          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
            {bridgeMode === 'govjobs'
              ? 'Ingest, parse, and mirror public sector job listings from GovernmentJobs.com and local state boards. Our heuristic engine automatically extracts salary, job numbers, and department hierarchies for high-fidelity matching.'
              : 'Ingest and parse recruiter outreach emails from Dice, Tekfortune, Sibitalent, Applab Systems, and agency outreach. Extracts recruiter contact info, W2/C2C contract rates, and requirements.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input Area */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Clipboard className="w-4 h-4 text-indigo-500" /> 
                {bridgeMode === 'govjobs' ? 'Public Sector Listing Ingestion' : 'Dice & Outreach Email Ingestion'}
              </h3>
              <button 
                onClick={() => {
                  setPastedText('');
                  setPdfFile(null);
                  setPdfBase64(null);
                  setPdfFileName(null);
                }}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase cursor-pointer"
              >
                Clear All
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              {bridgeMode === 'govjobs' 
                ? 'Upload a PDF export or copy the entire job listing from GovernmentJobs.com (including headers like "Salary", "Job Number", etc.) and paste below.'
                : 'Upload the PDF printout of the recruiter outreach email or paste the email text below. Direct recruiter contact info and firm details will be automatically parsed and added to Admin Leads.'}
            </p>

            {/* PDF File Upload Bar */}
            <div className="mb-4 flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className={`w-4 h-4 ${bridgeMode === 'dice_email' ? 'text-amber-500' : 'text-indigo-500'}`} />
                <span className="text-xs text-slate-700 dark:text-slate-300 font-bold truncate max-w-[200px] sm:max-w-xs">
                  {pdfFileName ? `Selected PDF: ${pdfFileName}` : 'Accepts PDF export or email PDF printout'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 shadow-xs transition-all">
                  <Download className={`w-3.5 h-3.5 rotate-180 ${bridgeMode === 'dice_email' ? 'text-amber-500' : 'text-indigo-500'}`} />
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
                    className="p-1.5 text-slate-400 hover:text-rose-500"
                    title="Remove PDF"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Prompt Tier Selector */}
            <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  Ingestion Prompt Tier
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {promptVersion === 'v1' ? '~300ms (Heuristic)' : (promptVersion === 'v2' ? '~1.2s (Taxonomy)' : '~2.5s (STAR Prep)')}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPromptVersion('v1')}
                  className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                    promptVersion === 'v1'
                      ? 'border-indigo-500 bg-white dark:bg-slate-900 shadow-xs ring-1 ring-indigo-500 text-indigo-700 dark:text-indigo-300 font-bold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900 font-medium'
                  }`}
                >
                  <div className="text-xs font-bold">V1 Fast</div>
                  <div className="text-[9px] text-slate-400 uppercase">Regex Engine</div>
                </button>
                <button
                  type="button"
                  onClick={() => setPromptVersion('v2')}
                  className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                    promptVersion === 'v2'
                      ? 'border-indigo-500 bg-white dark:bg-slate-900 shadow-xs ring-1 ring-indigo-500 text-indigo-700 dark:text-indigo-300 font-bold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900 font-medium'
                  }`}
                >
                  <div className="text-xs font-bold">V2 Semantic</div>
                  <div className="text-[9px] text-slate-400 uppercase">Taxonomy</div>
                </button>
                <button
                  type="button"
                  onClick={() => setPromptVersion('v3')}
                  className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                    promptVersion === 'v3'
                      ? 'border-violet-500 bg-white dark:bg-slate-900 shadow-xs ring-1 ring-violet-500 text-violet-700 dark:text-violet-300 font-bold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900 font-medium'
                  }`}
                >
                  <div className="text-xs font-bold">V3 Executive</div>
                  <div className="text-[9px] text-slate-400 uppercase">STAR & Strategy</div>
                </button>
              </div>
            </div>

            {!pdfFileName && (
              <textarea
                rows={10}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder={bridgeMode === 'govjobs' ? "Paste GovJob listing here... (e.g. Job Number: 26-00987, Salary: $24.55 Hourly...)" : "Paste recruiter reach-out email here... (e.g. Hi Chris, I have an urgent opening for DevOps Engineer...)"}
                className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
              />
            )}

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleIngest}
                disabled={isIngesting || (!pastedText.trim() && !pdfBase64)}
                className={`px-6 py-3 text-white rounded-2xl text-sm font-bold flex items-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50 ${
                  bridgeMode === 'dice_email' ? 'bg-amber-600 hover:bg-amber-500' : 'bg-indigo-600 hover:bg-indigo-500'
                }`}
              >
                {isIngesting ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    <span>Parsing Document...</span>
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4" />
                    <span>{bridgeMode === 'dice_email' ? 'Analyze Recruiter Email' : 'Analyze Gov Job'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}
        </div>

        {/* Right: Preview Area */}
        <div className="relative">
          <AnimatePresence mode="wait">
            {!ingestedJob ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-950/30"
              >
                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm mb-4">
                  <Search className="w-10 h-10 text-slate-300 dark:text-slate-700" />
                </div>
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">Waiting for Ingestion</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-xs">
                  Paste a GovernmentJobs listing on the left to see the high-fidelity parsed preview and strategic matching insights.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-indigo-200 dark:border-indigo-900 p-6 shadow-xl space-y-6 max-h-[800px] overflow-y-auto"
              >
                {/* Parsed Header */}
                <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                      {ingestedJob.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" /> {ingestedJob.companyName}
                      </span>
                      {ingestedJob.jobNumber && (
                        <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500 dark:text-slate-400">
                          #{ingestedJob.jobNumber}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Parsed & Validated
                    </span>
                  </div>
                </div>

                {/* Gov Details Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <DollarSign className="w-3 h-3" /> Est. Annual Pay
                    </div>
                    <div className="text-sm font-black text-slate-900 dark:text-white">
                      ${ingestedJob.salaryMin?.toLocaleString()} - ${ingestedJob.salaryMax?.toLocaleString()}
                    </div>
                    {ingestedJob.salaryType && (
                      <div className="text-[9px] text-slate-500 mt-0.5">Parsed from {ingestedJob.salaryType} Rate</div>
                    )}
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Closing Date
                    </div>
                    <div className="text-sm font-black text-rose-600 dark:text-rose-400">
                      {ingestedJob.expiresAt || 'Continuous'}
                    </div>
                  </div>
                  {ingestedJob.department && (
                    <div className="col-span-2 p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                        <Layers className="w-3 h-3" /> Department / Division
                      </div>
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {ingestedJob.department}
                      </div>
                    </div>
                  )}
                </div>

                {/* Recruiter & Outreach Details (Dice & GovJobs Mode) */}
                {ingestedJob.recruiterInfo && (
                  <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2">
                    <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-amber-400" /> Outreach & Process Flow Manager
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {ingestedJob.recruiterInfo.name && (
                        <div>
                          <span className="text-[10px] text-slate-400 block">Outreach / Recruiter Manager</span>
                          <span className="font-bold text-slate-200">{ingestedJob.recruiterInfo.name}</span>
                        </div>
                      )}
                      {ingestedJob.recruiterInfo.linkedInUrl && (
                        <div>
                          <span className="text-[10px] text-slate-400 block">LinkedIn Connection</span>
                          <a 
                            href={ingestedJob.recruiterInfo.linkedInUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="font-bold text-sky-400 hover:underline flex items-center gap-1"
                          >
                            <Globe className="w-3 h-3 text-sky-400" /> Connect on LinkedIn
                          </a>
                        </div>
                      )}
                      {ingestedJob.recruiterInfo.firmName && (
                        <div>
                          <span className="text-[10px] text-slate-400 block">Organization / Agency</span>
                          <span className="font-bold text-slate-200">{ingestedJob.recruiterInfo.firmName}</span>
                        </div>
                      )}
                      {ingestedJob.recruiterInfo.email && (
                        <div>
                          <span className="text-[10px] text-slate-400 block">Contact Email</span>
                          <a href={`mailto:${ingestedJob.recruiterInfo.email}`} className="font-bold text-indigo-400 hover:underline">
                            {ingestedJob.recruiterInfo.email}
                          </a>
                        </div>
                      )}
                      {ingestedJob.recruiterInfo.phone && (
                        <div>
                          <span className="text-[10px] text-slate-400 block">Contact Phone</span>
                          <span className="font-bold text-slate-200">{ingestedJob.recruiterInfo.phone}</span>
                        </div>
                      )}
                      {ingestedJob.recruiterInfo.workAuth && (
                        <div>
                          <span className="text-[10px] text-slate-400 block">Work Authorization</span>
                          <span className="font-bold text-emerald-400">{ingestedJob.recruiterInfo.workAuth}</span>
                        </div>
                      )}
                      {ingestedJob.recruiterInfo.contractType && (
                        <div>
                          <span className="text-[10px] text-slate-400 block">Contract Terms</span>
                          <span className="font-bold text-amber-300">{ingestedJob.recruiterInfo.contractType}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Skills & Requirements Summary */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Extracted Success Requirements</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {ingestedJob.requiredSkills.map((s, idx) => (
                        <span key={idx} className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold px-2 py-1 rounded-lg border border-indigo-200/50 dark:border-indigo-800/50">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* AI Match Insights */}
                {ingestedJob.insights && (
                  <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 rounded-2xl space-y-3">
                    <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Strategic Gov-Matching Insights
                    </h4>
                    <p className="text-[11px] text-slate-700 dark:text-slate-300 italic leading-relaxed">
                      "{ingestedJob.insights.matchStrategy}"
                    </p>
                    <div className="space-y-2">
                      <div className="text-[10px] font-bold text-amber-800 dark:text-amber-300">Unstated Expectations:</div>
                      <ul className="space-y-1">
                        {ingestedJob.insights.unstatedExpectations.map((exp, idx) => (
                          <li key={idx} className="text-[10px] text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                            <span>{exp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Final Action */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={handleMirrorToAscend}
                    disabled={isIngesting}
                    className="w-full py-3 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white rounded-2xl text-sm font-black flex items-center justify-center gap-2 shadow-xl transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Mirror to Ascend Requisitions</span>
                  </button>
                  <p className="text-[10px] text-center text-slate-400 mt-2">
                    Mirroring will create an active job posting in your Ascend ATS dashboard.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
