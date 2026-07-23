import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Briefcase, 
  History, 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle2, 
  FileText, 
  Sparkles, 
  Edit3, 
  DollarSign, 
  Clock, 
  UserCheck, 
  Copy, 
  X, 
  Check, 
  HelpCircle,
  Eye,
  TrendingUp,
  Award,
  Layers,
  ArrowRight,
  Filter
} from 'lucide-react';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../hooks/useAuth';
import { Job, JobRevision, JobTemplateBenchmark } from '../types';

// Curated Top-Performing Community Job Templates
export const COMMUNITY_TEMPLATES: JobTemplateBenchmark[] = [
  {
    id: 'tmpl-1',
    title: 'Senior Full-Stack Systems Engineer',
    industry: 'Technology & Software',
    roleCategory: 'Engineering',
    description: 'We are seeking a Senior Full-Stack Systems Engineer to lead key architecture for real-time distributed platforms. You will collaborate directly with product design and infrastructure engineering to ship performant features with high test coverage.\n\nKey Responsibilities:\n- Architect scalable TypeScript microservices and React frontends.\n- Optimize PostgreSQL & Redis data pipelines for sub-100ms latency.\n- Participate in peer design reviews and mentor junior developers.',
    requirements: '- 5+ years building web services with React, Node.js / TypeScript.\n- Strong experience with relational databases (PostgreSQL/Cloud SQL).\n- Clear communication skills and focus on developer experience.\n- Experience with CI/CD, Docker, and Cloud Run / GCP is a plus.',
    salaryMin: 140000,
    salaryMax: 185000,
    authenticityScore: 98,
    avgConversionRate: '94% Application Completion',
    appliedCount: 142,
    transparencyRating: 'Verified Community Gold',
    keyHighlights: ['Fully Transparent Compensation', 'Zero Post-Posting Requirement Shifts', 'High Candidate Conversion Rate']
  },
  {
    id: 'tmpl-2',
    title: 'Lead Clinical Research Nurse Specialist',
    industry: 'Healthcare & Life Sciences',
    roleCategory: 'Medical & Clinical',
    description: 'Join our hospital network to lead clinical trials and patient care coordination. Ensure full protocol compliance, oversee IRB documentation, and deliver compassionate, patient-centered care.\n\nKey Responsibilities:\n- Coordinate phase II/III clinical trial protocols across multi-specialty clinics.\n- Conduct initial candidate screenings and consent documentation.\n- Work closely with principal investigators to audit patient safety logs.',
    requirements: '- Active RN license in good standing.\n- 3+ years clinical trial coordination experience.\n- Familiarity with GCP (Good Clinical Practice) standards and EPIC EHR.',
    salaryMin: 95000,
    salaryMax: 125000,
    authenticityScore: 96,
    avgConversionRate: '91% Candidate Engagement',
    appliedCount: 88,
    transparencyRating: 'Verified Community Gold',
    keyHighlights: ['Clear Shift Schedule Details', 'Standardized Nursing Pay Scale', 'Strong Accommodation Score']
  },
  {
    id: 'tmpl-3',
    title: 'Cloud Infrastructure & DevOps Lead',
    industry: 'Cloud Infrastructure',
    roleCategory: 'DevOps / Site Reliability',
    description: 'Lead automated cloud deployment pipelines, Kubernetes cluster health, and zero-trust security postures. Support high-availability applications across multi-region environments.\n\nKey Responsibilities:\n- Manage Terraform infrastructure-as-code deployments on GCP/AWS.\n- Build zero-downtime blue/green deployment workflows.\n- Maintain observability dashboards using Prometheus, Grafana, and Cloud Logging.',
    requirements: '- 4+ years managing production Kubernetes & Terraform.\n- Solid Linux internals, scripting (Bash/Python/Go), and networking knowledge.\n- Experience with automated security compliance scanning.',
    salaryMin: 135000,
    salaryMax: 175000,
    authenticityScore: 97,
    avgConversionRate: '95% Conversion Rate',
    appliedCount: 110,
    transparencyRating: 'Verified Community Gold',
    keyHighlights: ['Clear On-Call Expectations', 'High Salary Range Precision', 'Zero Ambiguity Rating']
  }
];

interface JobRequisitionEditorProps {
  companyId?: string;
  companyName?: string;
  onJobUpdated?: () => void;
}

export const JobRequisitionEditor: React.FC<JobRequisitionEditorProps> = ({
  companyId,
  companyName,
  onJobUpdated
}) => {
  const { user, appUser } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'editor' | 'audits' | 'templates'>('editor');

  // Edit Form State
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editRequirements, setEditRequirements] = useState('');
  const [editSalaryMin, setEditSalaryMin] = useState('80000');
  const [editSalaryMax, setEditSalaryMax] = useState('130000');
  const [editSkills, setEditSkills] = useState('');
  const [editRequiredSkills, setEditRequiredSkills] = useState('');
  const [editPreferredSkills, setEditPreferredSkills] = useState('');
  const [editWorkplaceType, setEditWorkplaceType] = useState<'Remote' | 'Hybrid' | 'On-Site'>('Remote');
  const [editLocation, setEditLocation] = useState('San Francisco, CA');
  const [editBenefits, setEditBenefits] = useState<string[]>([
    'Health & Dental Insurance', '401(k) Matching', 'Unlimited PTO', 'Equity / Stock Options'
  ]);
  const [editWillingToConsiderNotes, setEditWillingToConsiderNotes] = useState('');
  const [editSettlingOptions, setEditSettlingOptions] = useState<string[]>([]);
  
  // Mandatory Audit Justification State
  const [editReasonCategory, setEditReasonCategory] = useState<JobRevision['editReasonCategory']>('candidate_info_request');
  const [editReasonNotes, setEditReasonNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [riskAlertMessage, setRiskAlertMessage] = useState<string | null>(null);

  // Template Preview Modal
  const [previewTemplate, setPreviewTemplate] = useState<JobTemplateBenchmark | null>(null);

  // Fetch Jobs
  const fetchRequisitions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let q = query(collection(db, 'jobs'));
      if (appUser?.role !== 'admin' && companyId) {
        q = query(collection(db, 'jobs'), where('companyId', '==', companyId));
      }
      
      const snap = await getDocs(q);
      const list: Job[] = [];
      snap.forEach(d => {
        list.push({ id: d.id, ...d.data() } as Job);
      });

      // Fallback matching by company name if no companyId matches
      if (list.length === 0 && companyName) {
        const nameQ = query(collection(db, 'jobs'), where('companyName', '==', companyName));
        const nameSnap = await getDocs(nameQ);
        nameSnap.forEach(d => {
          if (!list.some(j => j.id === d.id)) {
            list.push({ id: d.id, ...d.data() } as Job);
          }
        });
      }

      setJobs(list);
      if (list.length > 0 && !selectedJob) {
        selectJobForEditing(list[0]);
      }
    } catch (err) {
      console.error("Failed to load requisitions for editing:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequisitions();
  }, [user, companyId, companyName]);

  const selectJobForEditing = (j: Job) => {
    setSelectedJob(j);
    setEditTitle(j.title || '');
    setEditDescription(j.description || '');
    setEditRequirements(j.requirements || '');
    setEditSalaryMin(String(j.parsedCriteria?.salaryRange?.min || 80000));
    setEditSalaryMax(String(j.parsedCriteria?.salaryRange?.max || 130000));
    setEditSkills(j.parsedCriteria?.skills?.join(', ') || 'TypeScript, React');
    setEditRequiredSkills(
      (j.requiredSkills || j.parsedCriteria?.requiredSkills || j.parsedCriteria?.skills || ['TypeScript', 'React']).join(', ')
    );
    setEditPreferredSkills(
      (j.preferredSkills || j.parsedCriteria?.preferredSkills || ['Docker', 'AWS']).join(', ')
    );
    setEditWorkplaceType(
      (j.workplaceType || j.parsedCriteria?.workplaceType || 'Remote') as 'Remote' | 'Hybrid' | 'On-Site'
    );
    setEditLocation(j.location || j.parsedCriteria?.location || 'San Francisco, CA');
    setEditBenefits(
      j.benefits || j.parsedCriteria?.benefits || [
        'Health & Dental Insurance', '401(k) Matching', 'Unlimited PTO', 'Equity / Stock Options'
      ]
    );
    setEditWillingToConsiderNotes(
      j.willingToConsiderNotes || j.parsedCriteria?.willingToConsiderNotes || ''
    );
    setEditSettlingOptions(
      j.settlingOptions || j.parsedCriteria?.settlingOptions || []
    );
    setEditReasonNotes('');
    setSaveSuccess(null);
    setRiskAlertMessage(null);
  };

  // Pre-fill Edit Form from a Community Benchmark Template
  const handleApplyTemplate = (tmpl: JobTemplateBenchmark) => {
    setEditTitle(tmpl.title);
    setEditDescription(tmpl.description);
    setEditRequirements(tmpl.requirements);
    setEditSalaryMin(String(tmpl.salaryMin));
    setEditSalaryMax(String(tmpl.salaryMax));
    setEditReasonCategory('scope_refinement');
    setEditReasonNotes(`Applied community best-performing template: "${tmpl.title}"`);
    setActiveSubTab('editor');
    setSaveSuccess(`Loaded benchmark template "${tmpl.title}". Review and save updates.`);
    setTimeout(() => setSaveSuccess(null), 3000);
  };

  // Submit Job Modification with Nefarious Behavior Detection & Audit Logging
  const handleSaveModification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedJob) return;
    if (!editReasonNotes.trim()) {
      alert("Please provide a valid justification note explaining this job description modification.");
      return;
    }

    setIsSaving(true);
    setSaveSuccess(null);
    setRiskAlertMessage(null);

    try {
      const oldMin = selectedJob.parsedCriteria?.salaryRange?.min || 80000;
      const oldMax = selectedJob.parsedCriteria?.salaryRange?.max || 130000;
      const newMin = Number(editSalaryMin) || oldMin;
      const newMax = Number(editSalaryMax) || oldMax;

      // 1. Calculate Nefarious / Material Shift Flags
      const materialDetails: string[] = [];
      let flaggedRisk: 'low' | 'moderate' | 'high_bait_and_switch' = 'low';
      let riskScoreIncrease = 0;

      // Check max salary drop post-creation
      if (newMax < oldMax * 0.95) {
        const dropPct = Math.round(((oldMax - newMax) / oldMax) * 100);
        materialDetails.push(`Max salary reduced by ${dropPct}% ($${oldMax.toLocaleString()} ➔ $${newMax.toLocaleString()})`);
        flaggedRisk = 'high_bait_and_switch';
        riskScoreIncrease += 40;
      }

      // Check min salary drop
      if (newMin < oldMin * 0.90) {
        const dropPct = Math.round(((oldMin - newMin) / oldMin) * 100);
        materialDetails.push(`Min salary reduced by ${dropPct}% ($${oldMin.toLocaleString()} ➔ $${newMin.toLocaleString()})`);
        if (flaggedRisk !== 'high_bait_and_switch') flaggedRisk = 'moderate';
        riskScoreIncrease += 25;
      }

      // Check scope expansion / requirements length increase (>50% longer text added)
      if (editRequirements.length > selectedJob.requirements.length * 1.5 && selectedJob.requirements.length > 50) {
        materialDetails.push(`Substantial requirements scope expansion (+${editRequirements.length - selectedJob.requirements.length} chars)`);
        if (flaggedRisk === 'low') flaggedRisk = 'moderate';
        riskScoreIncrease += 15;
      }

      // Calculate new Version string
      const currentRevCount = (selectedJob.revisions || []).length;
      const nextVersionNumber = `v${1 + Math.floor((currentRevCount + 1) / 2)}.${(currentRevCount + 1) % 2 === 0 ? '0' : '5'}`;

      const newRevision: JobRevision = {
        id: `rev-${Date.now()}`,
        versionNumber: nextVersionNumber,
        timestamp: new Date().toISOString(),
        modifiedByEmail: user.email || 'HR Personnel',
        modifiedByUid: user.uid,
        editReasonCategory,
        editReasonNotes: editReasonNotes.trim(),
        previousValues: {
          title: selectedJob.title,
          description: selectedJob.description,
          requirements: selectedJob.requirements,
          salaryMin: oldMin,
          salaryMax: oldMax
        },
        newValues: {
          title: editTitle,
          description: editDescription,
          requirements: editRequirements,
          salaryMin: newMin,
          salaryMax: newMax
        },
        materialChangeDetected: materialDetails.length > 0,
        materialChangeDetails: materialDetails,
        flaggedRiskLevel: flaggedRisk
      };

      const updatedRiskScore = Math.min(100, (selectedJob.nefariousRiskScore || 0) + riskScoreIncrease);
      const updatedNefariousFlags = Array.from(new Set([...(selectedJob.nefariousFlags || []), ...materialDetails]));
      
      let transparencyRating: 'verified_transparent' | 'minor_edits' | 'under_review' | 'flagged' = 'verified_transparent';
      if (updatedRiskScore > 35) transparencyRating = 'flagged';
      else if (updatedRiskScore > 15) transparencyRating = 'under_review';
      else if (currentRevCount > 0) transparencyRating = 'minor_edits';

      const reqSkillsArr = editRequiredSkills ? editRequiredSkills.split(',').map(s => s.trim()).filter(Boolean) : (editSkills ? editSkills.split(',').map(s => s.trim()).filter(Boolean) : ['Communication']);
      const prefSkillsArr = editPreferredSkills ? editPreferredSkills.split(',').map(s => s.trim()).filter(Boolean) : [];
      const combinedSkills = Array.from(new Set([...reqSkillsArr, ...prefSkillsArr]));

      // 2. Persist to Firestore
      const jobRef = doc(db, 'jobs', selectedJob.id);
      const updateData = {
        title: editTitle.trim(),
        description: editDescription.trim(),
        requirements: editRequirements.trim(),
        workplaceType: editWorkplaceType,
        location: editLocation.trim(),
        benefits: editBenefits,
        requiredSkills: reqSkillsArr,
        preferredSkills: prefSkillsArr,
        willingToConsiderNotes: editWillingToConsiderNotes.trim(),
        settlingOptions: editSettlingOptions,
        currentVersion: nextVersionNumber,
        updatedAt: serverTimestamp(),
        parsedCriteria: {
          skills: combinedSkills,
          requiredSkills: reqSkillsArr,
          preferredSkills: prefSkillsArr,
          minExperience: selectedJob.parsedCriteria?.minExperience || 2,
          salaryRange: { min: newMin, max: newMax },
          workplaceType: editWorkplaceType,
          location: editLocation.trim(),
          benefits: editBenefits,
          willingToConsiderNotes: editWillingToConsiderNotes.trim(),
          settlingOptions: editSettlingOptions
        },
        revisions: arrayUnion(newRevision),
        nefariousRiskScore: updatedRiskScore,
        nefariousFlags: updatedNefariousFlags,
        transparencyRating
      };

      await updateDoc(jobRef, updateData);

      // 3. Local State Sync
      const updatedJobObj: Job = {
        ...selectedJob,
        title: editTitle.trim(),
        description: editDescription.trim(),
        requirements: editRequirements.trim(),
        workplaceType: editWorkplaceType,
        location: editLocation.trim(),
        benefits: editBenefits,
        requiredSkills: reqSkillsArr,
        preferredSkills: prefSkillsArr,
        willingToConsiderNotes: editWillingToConsiderNotes.trim(),
        settlingOptions: editSettlingOptions,
        currentVersion: nextVersionNumber,
        parsedCriteria: {
          skills: combinedSkills,
          requiredSkills: reqSkillsArr,
          preferredSkills: prefSkillsArr,
          minExperience: selectedJob.parsedCriteria?.minExperience || 2,
          salaryRange: { min: newMin, max: newMax },
          workplaceType: editWorkplaceType,
          location: editLocation.trim(),
          benefits: editBenefits,
          willingToConsiderNotes: editWillingToConsiderNotes.trim(),
          settlingOptions: editSettlingOptions
        },
        revisions: [...(selectedJob.revisions || []), newRevision],
        nefariousRiskScore: updatedRiskScore,
        nefariousFlags: updatedNefariousFlags,
        transparencyRating
      };

      setSelectedJob(updatedJobObj);
      setJobs(prev => prev.map(j => j.id === selectedJob.id ? updatedJobObj : j));
      
      if (materialDetails.length > 0) {
        setRiskAlertMessage(`⚠️ Audit Guardrail Alert: Potential material change flagged (${materialDetails.join('; ')}). Logged for HR transparency compliance.`);
      }
      setSaveSuccess(`Job description updated successfully! Revision ${nextVersionNumber} logged in audit history.`);
      setEditReasonNotes('');
      if (onJobUpdated) onJobUpdated();

    } catch (err: any) {
      console.error("Failed to update job description:", err);
      alert("Failed to save modifications: " + (err.message || 'Firestore update error'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-5 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-indigo-500" /> Requisition Manager & Audit Engine
            </h2>
            <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> HR Compliance Active
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Edit live job descriptions, justify changes for audit transparency, and benchmark against top-performing community templates.
          </p>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setActiveSubTab('editor')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              activeSubTab === 'editor' 
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs font-extrabold' 
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" /> Requisition Editor
          </button>
          <button
            onClick={() => setActiveSubTab('audits')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              activeSubTab === 'audits' 
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs font-extrabold' 
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" /> Audit Logs ({(selectedJob?.revisions || []).length})
          </button>
          <button
            onClick={() => setActiveSubTab('templates')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              activeSubTab === 'templates' 
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs font-extrabold' 
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Community Templates
          </button>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Job Selection List */}
        <div className="lg:col-span-4 border-r border-slate-100 dark:border-slate-800 pr-0 lg:pr-6 space-y-3">
          <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-between">
            <span>Select Requisition ({jobs.length})</span>
            <span className="text-[10px] text-indigo-500 lowercase font-normal">Active & Drafts</span>
          </label>

          {loading ? (
            <div className="p-6 text-center text-slate-400 text-xs italic">Loading requisitions...</div>
          ) : jobs.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs italic bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
              No active job requisitions found for this company profile.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {jobs.map((j) => {
                const isSelected = selectedJob?.id === j.id;
                const hasFlags = (j.nefariousFlags || []).length > 0;
                const revCount = (j.revisions || []).length;

                return (
                  <button
                    key={j.id}
                    onClick={() => selectJobForEditing(j)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all relative ${
                      isSelected
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-500 shadow-sm'
                        : 'bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100 line-clamp-1">
                        {j.title}
                      </span>
                      <span className="text-[10px] font-bold bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded-md text-slate-700 dark:text-slate-300 shrink-0">
                        {j.currentVersion || 'v1.0'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-2">
                      <span>${((j.parsedCriteria?.salaryRange?.min || 80000) / 1000).toFixed(0)}k - ${((j.parsedCriteria?.salaryRange?.max || 130000) / 1000).toFixed(0)}k</span>
                      <span>•</span>
                      <span>{j.companyName}</span>
                    </div>

                    <div className="flex items-center justify-between gap-1 text-[10px] pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                      <span className="text-slate-400 flex items-center gap-1">
                        <History className="w-3 h-3 text-slate-400" /> {revCount} revision{revCount === 1 ? '' : 's'}
                      </span>

                      {hasFlags ? (
                        <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-2 py-0.5 rounded-md border border-amber-500/30 flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5" /> Material Shift Flag
                        </span>
                      ) : (
                        <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-md border border-emerald-500/30 flex items-center gap-1">
                          <ShieldCheck className="w-2.5 h-2.5" /> High Integrity
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Active Tab Content */}
        <div className="lg:col-span-8">
          {/* Sub-Tab 1: Requisition Editor */}
          {activeSubTab === 'editor' && (
            selectedJob ? (
              <form onSubmit={handleSaveModification} className="space-y-4">
                {/* Save Feedback Banners */}
                {saveSuccess && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{saveSuccess}</span>
                  </div>
                )}
                {riskAlertMessage && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-2xl text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>{riskAlertMessage}</span>
                  </div>
                )}

                {/* Job Title & Version Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="bg-indigo-600 text-white font-extrabold text-xs px-2.5 py-1 rounded-xl">
                      Editing {selectedJob.currentVersion || 'v1.0'}
                    </span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      ID: {selectedJob.id.slice(0, 8)}...
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium">
                    All modifications log timestamp & editor identity in HR Audit Trail.
                  </div>
                </div>

                {/* Title & Salary Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Job Title
                    </label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Salary Min ($)
                      </label>
                      <input
                        type="number"
                        value={editSalaryMin}
                        onChange={e => setEditSalaryMin(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Salary Max ($)
                      </label>
                      <input
                        type="number"
                        value={editSalaryMax}
                        onChange={e => setEditSalaryMax(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Description Textarea */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Job Description & Role Summary
                  </label>
                  <textarea
                    rows={4}
                    value={editDescription}
                    onChange={e => setEditDescription(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Requirements Textarea */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Core Requirements & Qualifications
                  </label>
                  <textarea
                    rows={3}
                    value={editRequirements}
                    onChange={e => setEditRequirements(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Workplace Setting & Location */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Workplace Setting
                    </label>
                    <select
                      value={editWorkplaceType}
                      onChange={e => setEditWorkplaceType(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Remote">Remote (Work from Anywhere)</option>
                      <option value="Hybrid">Hybrid (Partially On-Site / Remote)</option>
                      <option value="On-Site">On-Site (Office / Facility Based)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Target Location / Headquarters
                    </label>
                    <input
                      type="text"
                      value={editLocation}
                      onChange={e => setEditLocation(e.target.value)}
                      placeholder="e.g. San Francisco, CA or Remote (US)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Required Skills vs Preferred Skills */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Required / Must-Have Skills (Comma Separated)
                    </label>
                    <input
                      type="text"
                      value={editRequiredSkills}
                      onChange={e => setEditRequiredSkills(e.target.value)}
                      placeholder="e.g. React, TypeScript, Node.js"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Preferred / Nice-To-Have Skills (Comma Separated)
                    </label>
                    <input
                      type="text"
                      value={editPreferredSkills}
                      onChange={e => setEditPreferredSkills(e.target.value)}
                      placeholder="e.g. Docker, Kubernetes, GraphQL"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 dark:border-amber-900 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Benefits & Perks Checklist */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Provided Benefits & Compensation Perks
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {[
                      'Health & Dental Insurance',
                      '401(k) Matching',
                      'Unlimited PTO',
                      'Equity / Stock Options',
                      'Remote Work Stipend',
                      'Paid Parental Leave',
                      'Flexible Hours',
                      'Learning & Tuition Stipend'
                    ].map(b => {
                      const isChecked = editBenefits.includes(b);
                      return (
                        <button
                          type="button"
                          key={b}
                          onClick={() => {
                            if (isChecked) {
                              setEditBenefits(prev => prev.filter(item => item !== b));
                            } else {
                              setEditBenefits(prev => [...prev, b]);
                            }
                          }}
                          className={`p-2 rounded-xl border text-left flex items-center justify-between gap-1 transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-bold'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <span className="text-[11px] truncate">{b}</span>
                          {isChecked && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Settling / Willing to Consider Options & Employer Flexibility */}
                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-extrabold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-emerald-600" /> Settling Criteria & Employer Flexibility ("Willing to Consider")
                    </label>
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900 px-2 py-0.5 rounded-md">
                      Attracts Top Transferable Talent
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Specify if your hiring team is open to alternative candidate backgrounds, equivalent experience, or flexible onboarding.
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {[
                      'Willing to consider equivalent experience in lieu of degree',
                      'Open to transferable skills in similar programming languages/frameworks',
                      'Open to lower years of experience for candidates with exceptional portfolio/projects',
                      'Flexible on candidate location / willing to support relocation or remote work',
                      'Open to providing dedicated technical training & mentorship during onboarding'
                    ].map(opt => {
                      const isSel = editSettlingOptions.includes(opt);
                      return (
                        <button
                          type="button"
                          key={opt}
                          onClick={() => {
                            if (isSel) {
                              setEditSettlingOptions(prev => prev.filter(o => o !== opt));
                            } else {
                              setEditSettlingOptions(prev => [...prev, opt]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                            isSel
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-400'
                          }`}
                        >
                          {isSel ? '✓ ' : '+ '} {opt}
                        </button>
                      );
                    })}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Custom Flexibility Notes for Candidates
                    </label>
                    <input
                      type="text"
                      value={editWillingToConsiderNotes}
                      onChange={e => setEditWillingToConsiderNotes(e.target.value)}
                      placeholder="e.g., Willing to consider Python/Java engineers who are willing to transition to Go; open to bootcamp graduates..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Mandatory Justification & Audit Trail Section */}
                <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-800 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <label className="block text-xs font-extrabold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-indigo-500" /> Mandatory Justification for Revision Log
                    </label>
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900 px-2 py-0.5 rounded-md">
                      Required for HR Audit
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Modification Category
                      </label>
                      <select
                        value={editReasonCategory}
                        onChange={e => setEditReasonCategory(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="candidate_info_request">Candidate Request for Info / Inquiries</option>
                        <option value="salary_range_update">Compensation & Salary Transparency Adjustment</option>
                        <option value="scope_refinement">Job Scope & Requirement Refinement</option>
                        <option value="typo_fix">Typo & Formatting Correction</option>
                        <option value="support_ticket">Support Ticket & Compliance Review</option>
                        <option value="other">General Operational Update</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Detailed Explanation / Justification Notes
                      </label>
                      <input
                        type="text"
                        value={editReasonNotes}
                        onChange={e => setEditReasonNotes(e.target.value)}
                        placeholder="e.g., Clarified remote flexibility and salary range max following candidate inquiries..."
                        required
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Submit Button */}
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSaving || !editReasonNotes.trim()}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl text-xs font-extrabold flex items-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isSaving ? 'Logging Revision...' : 'Save & Log Revision in HR Audit'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs italic bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                Select a job requisition from the left panel to begin editing and logging revisions.
              </div>
            )
          )}

          {/* Sub-Tab 2: HR Audit Logs */}
          {activeSubTab === 'audits' && (
            selectedJob ? (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <History className="w-4 h-4 text-indigo-500" /> Audit Trail for "{selectedJob.title}"
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Immutable timeline of all job description updates, HR authors, justifications, and risk flags.
                    </p>
                  </div>
                  <span className="text-xs font-extrabold bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
                    {(selectedJob.revisions || []).length} Logged Revisions
                  </span>
                </div>

                {(selectedJob.revisions || []).length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs italic bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                    No prior revisions recorded. This job is on its initial version (v1.0).
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                    {[...(selectedJob.revisions || [])].reverse().map((rev, idx) => (
                      <div
                        key={rev.id || idx}
                        className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="bg-indigo-600 text-white font-extrabold text-[11px] px-2.5 py-0.5 rounded-md">
                              {rev.versionNumber}
                            </span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              Edited by {rev.modifiedByEmail}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {new Date(rev.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                          </span>
                        </div>

                        <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800/60 text-xs">
                          <div className="font-bold text-slate-700 dark:text-slate-300 mb-0.5 capitalize flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-indigo-500" />
                            Reason: {rev.editReasonCategory.replace(/_/g, ' ')}
                          </div>
                          <p className="text-slate-600 dark:text-slate-400 italic">
                            "{rev.editReasonNotes}"
                          </p>
                        </div>

                        {/* Diff Highlights */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                          <div className="p-2 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/50 rounded-lg text-rose-800 dark:text-rose-300">
                            <strong>Previous Salary:</strong> ${((rev.previousValues.salaryMin || 80000) / 1000).toFixed(0)}k - ${((rev.previousValues.salaryMax || 130000) / 1000).toFixed(0)}k
                          </div>
                          <div className="p-2 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/50 rounded-lg text-emerald-800 dark:text-emerald-300">
                            <strong>Updated Salary:</strong> ${((rev.newValues.salaryMin || 80000) / 1000).toFixed(0)}k - ${((rev.newValues.salaryMax || 130000) / 1000).toFixed(0)}k
                          </div>
                        </div>

                        {/* Risk Flags */}
                        {rev.materialChangeDetected && (
                          <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-700 dark:text-amber-300 text-[11px] font-bold flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>Flagged: {rev.materialChangeDetails?.join('; ')}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs italic bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                Select a job requisition from the left panel to inspect its full audit history.
              </div>
            )
          )}

          {/* Sub-Tab 3: Community Best-Performing Job Posting Templates */}
          {activeSubTab === 'templates' && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl shadow-md border border-indigo-700/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-extrabold flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" /> Community Best-Performing Job Templates
                  </h3>
                  <p className="text-xs text-indigo-200 mt-0.5">
                    Utilize proven, high-converting job templates with verified transparency ratings to boost candidate quality.
                  </p>
                </div>
                <span className="text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 px-3 py-1 rounded-full">
                  High Conversion Standard
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {COMMUNITY_TEMPLATES.map((tmpl) => (
                  <div
                    key={tmpl.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {tmpl.title}
                          </h4>
                          <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {tmpl.transparencyRating}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {tmpl.industry} • {tmpl.roleCategory}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPreviewTemplate(tmpl)}
                          className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all"
                        >
                          <Eye className="w-3.5 h-3.5 inline mr-1" /> Preview
                        </button>
                        <button
                          onClick={() => handleApplyTemplate(tmpl)}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" /> Use Template
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        ${(tmpl.salaryMin / 1000).toFixed(0)}k - ${(tmpl.salaryMax / 1000).toFixed(0)}k
                      </span>
                      <span>•</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">{tmpl.avgConversionRate}</span>
                      <span>•</span>
                      <span>{tmpl.appliedCount} applicants benchmarked</span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {tmpl.keyHighlights.map((hl, i) => (
                        <span key={i} className="text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 rounded-md border border-indigo-200/50 dark:border-indigo-800/50">
                          ✓ {hl}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Template Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setPreviewTemplate(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-extrabold text-slate-900 dark:text-white text-base mb-1 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" /> Template: {previewTemplate.title}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Benchmark Salary: ${(previewTemplate.salaryMin / 1000).toFixed(0)}k - ${(previewTemplate.salaryMax / 1000).toFixed(0)}k
            </p>

            <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300">
              <div>
                <strong className="block font-bold text-slate-900 dark:text-white mb-1">Description:</strong>
                <p className="whitespace-pre-wrap bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  {previewTemplate.description}
                </p>
              </div>

              <div>
                <strong className="block font-bold text-slate-900 dark:text-white mb-1">Requirements:</strong>
                <p className="whitespace-pre-wrap bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  {previewTemplate.requirements}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleApplyTemplate(previewTemplate);
                  setPreviewTemplate(null);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-extrabold shadow-xs"
              >
                Use This Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
