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
  Globe
} from 'lucide-react';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';

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
  insights?: {
    interviewQuestions: Array<{ question: string; answer: string }>;
    unstatedExpectations: string[];
    matchStrategy: string;
  };
}

export const GovJobsBridge: React.FC = () => {
  const { user } = useAuth();
  const [pastedText, setPastedText] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestedJob, setIngestedJob] = useState<GovJobData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleIngest = async () => {
    if (!pastedText.trim()) return;
    setIsIngesting(true);
    setError(null);
    setIngestedJob(null);

    try {
      const response = await fetch('/api/ingest-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pastedText, boardType: 'govjobs' })
      });

      if (!response.ok) throw new Error('Failed to ingest job posting');

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
      const jobPayload = {
        ...ingestedJob,
        companyId: user.uid, // Default to user's UID as companyId if not linked
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        parsedCriteria: {
          skills: [...ingestedJob.requiredSkills, ...ingestedJob.preferredSkills],
          requiredSkills: ingestedJob.requiredSkills,
          preferredSkills: ingestedJob.preferredSkills,
          minExperience: 2,
          salaryRange: { min: ingestedJob.salaryMin || 0, max: ingestedJob.salaryMax || 0 },
          workplaceType: ingestedJob.workplaceType || 'On-Site',
          location: ingestedJob.location || 'Washington',
          benefits: ingestedJob.benefits
        }
      };

      await addDoc(collection(db, 'jobs'), jobPayload);
      setSuccess(`Successfully mirrored "${ingestedJob.title}" to your Ascend ATS requisitions.`);
      setTimeout(() => setSuccess(null), 5000);
      setIngestedJob(null);
      setPastedText('');
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
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Building2 className="w-6 h-6 text-indigo-400" /> GovJobs Strategic Bridge
            </h2>
            <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-500/30 uppercase tracking-widest">
              NEOGOV Integration
            </span>
          </div>
          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
            Ingest, parse, and mirror public sector job listings from GovernmentJobs.com and local state boards. Our heuristic engine automatically extracts salary, job numbers, and department hierarchies for high-fidelity matching.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input Area */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Clipboard className="w-4 h-4 text-indigo-500" /> Raw Job Text Ingestion
              </h3>
              <button 
                onClick={() => setPastedText('')}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase"
              >
                Clear All
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Copy the entire job listing from GovernmentJobs.com (including headers like "Salary", "Job Number", etc.) and paste it below.
            </p>

            <textarea
              rows={12}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste GovJob listing here... (e.g. Job Number: 26-00987, Salary: $24.55 Hourly...)"
              className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
            />

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleIngest}
                disabled={isIngesting || !pastedText.trim()}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl text-sm font-bold flex items-center gap-2 shadow-lg transition-all"
              >
                {isIngesting ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    <span>Parsing Gov Schema...</span>
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4" />
                    <span>Analyze Gov Job</span>
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
