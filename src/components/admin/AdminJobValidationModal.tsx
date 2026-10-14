import React, { useState, useEffect } from 'react';
import { X, Check, Trash2, AlertTriangle, Building, UserCheck, FileText, DollarSign, MapPin, ArrowRight, ShieldCheck, Undo2, Maximize2, Minimize2, ExternalLink, History } from 'lucide-react';
import { doc, updateDoc, deleteDoc, serverTimestamp, deleteField, arrayUnion, query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Job, JobReport, JobRevision } from '../../types';
import { AdminPostDetailsModal } from './AdminPostDetailsModal';
import { sanitizeFirestorePayload } from '../../utils/firestoreSanitizer';
import { detectMaterialShifts, calculateSemanticVersion } from '../../utils/materialShiftEngine';
import { useAuth } from '../../hooks/useAuth';

interface AdminJobValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
  report?: JobReport | null;
  onSaved: (updatedJob: Job) => void;
  onDeleted: (jobId: string) => void;
  onDismissReport?: (reportId: string) => void;
}

export const AdminJobValidationModal: React.FC<AdminJobValidationModalProps> = ({
  isOpen,
  onClose,
  job,
  report,
  onSaved,
  onDeleted,
  onDismissReport
}) => {
  const { user } = useAuth();
  const [companyName, setCompanyName] = useState(job.companyName || '');
  const [posterFirmName, setPosterFirmName] = useState(job.posterFirmName || '');
  const [title, setTitle] = useState(job.title || '');
  const [workplaceType, setWorkplaceType] = useState<Job['workplaceType']>(job.workplaceType || 'Remote');
  const [location, setLocation] = useState(job.location || '');
  const [salaryMin, setSalaryMin] = useState<number>(job.salaryMin || 0);
  const [salaryMax, setSalaryMax] = useState<number>(job.salaryMax || 0);

  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isContextExpanded, setIsContextExpanded] = useState(false);
  const [showPostDetailsModal, setShowPostDetailsModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCompanyName(job.companyName || '');
      setPosterFirmName(job.posterFirmName || '');
      setTitle(job.title || '');
      setWorkplaceType(job.workplaceType || 'Remote');
      setLocation(job.location || '');
      setSalaryMin(job.salaryMin || 0);
      setSalaryMax(job.salaryMax || 0);
      setConfirmDelete(false);
      setError(null);
    }
  }, [isOpen, job]);

  if (!isOpen) return null;

  // Diff detection
  const isCompanyDiff = companyName.trim() !== (job.companyName || '').trim();
  const isPosterDiff = posterFirmName.trim() !== (job.posterFirmName || '').trim();
  const isTitleDiff = title.trim() !== (job.title || '').trim();
  const isWorkplaceDiff = workplaceType !== (job.workplaceType || 'Remote');
  const isLocationDiff = location.trim() !== (job.location || '').trim();
  const isSalaryDiff = salaryMin !== (job.salaryMin || 0) || salaryMax !== (job.salaryMax || 0);

  const totalDiffs = [isCompanyDiff, isPosterDiff, isTitleDiff, isWorkplaceDiff, isLocationDiff, isSalaryDiff].filter(Boolean).length;

  // Preview semantic version bump for audit trail
  const draftJobForPreview: Partial<Job> = {
    ...job,
    companyName: companyName.trim(),
    posterFirmName: posterFirmName.trim() || undefined,
    title: title.trim(),
    workplaceType,
    location: location.trim() || 'Remote',
    salaryMin: salaryMin || 0,
    salaryMax: salaryMax || 0
  };
  const previewEvaluation = detectMaterialShifts(job, draftJobForPreview);
  const previewNextVersion = previewEvaluation.nextVersionNumber || calculateSemanticVersion(job.currentVersion || 'v1.0.0', previewEvaluation.flaggedRiskLevel);

  const handleApplyReporterSuggestions = () => {
    if (report?.proposedCompanyName) {
      setCompanyName(report.proposedCompanyName);
    }
    if (report?.proposedPosterFirmName) {
      setPosterFirmName(report.proposedPosterFirmName);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const cleanCompany = companyName.trim();
      const cleanTitle = title.trim();
      const cleanPosterFirm = posterFirmName.trim();
      const cleanLoc = location.trim();

      const changesList: string[] = [];
      if (isCompanyDiff) changesList.push(`Hiring entity: "${job.companyName || 'N/A'}" ➔ "${cleanCompany}"`);
      if (isPosterDiff) changesList.push(`Recruiter firm: "${job.posterFirmName || 'Direct Hire'}" ➔ "${cleanPosterFirm || 'Direct Hire'}"`);
      if (isTitleDiff) changesList.push(`Title: "${job.title || 'N/A'}" ➔ "${cleanTitle}"`);
      if (isWorkplaceDiff) changesList.push(`Workplace: "${job.workplaceType || 'Remote'}" ➔ "${workplaceType}"`);
      if (isLocationDiff) changesList.push(`Location: "${job.location || 'Remote'}" ➔ "${cleanLoc || 'Remote'}"`);
      if (isSalaryDiff) changesList.push(`Salary: $${salaryMin.toLocaleString()} - $${salaryMax.toLocaleString()}`);

      const updatedDraft: Partial<Job> = {
        ...job,
        companyName: cleanCompany,
        posterFirmName: cleanPosterFirm || undefined,
        title: cleanTitle,
        workplaceType,
        location: cleanLoc || 'Remote',
        salaryMin: salaryMin || 0,
        salaryMax: salaryMax || 0
      };

      const evaluation = detectMaterialShifts(job, updatedDraft);
      const nextVersionNumber = evaluation.nextVersionNumber || calculateSemanticVersion(job.currentVersion || 'v1.0.0', evaluation.flaggedRiskLevel);

      // Create JobRevision to track in Candidate Version History & Audit Trail
      const newRevision: JobRevision = {
        id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        versionNumber: nextVersionNumber,
        timestamp: new Date().toISOString(),
        modifiedByEmail: user?.email || 'admin@ascend.io',
        modifiedByUid: user?.uid || 'admin-system',
        editReasonCategory: report ? 'support_ticket' : 'scope_refinement',
        editReasonNotes: report
          ? `Admin resolved discrepancy report (${report.reason.replace(/_/g, ' ')}): ${changesList.join('; ') || 'Verified posting accuracy'}`
          : `Admin verified posting integrity: ${changesList.join('; ') || 'Verified posting accuracy'}`,
        previousValues: {
          title: job.title,
          companyName: job.companyName,
          posterFirmName: job.posterFirmName,
          workplaceType: job.workplaceType,
          location: job.location,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax
        },
        newValues: {
          title: cleanTitle,
          companyName: cleanCompany,
          posterFirmName: cleanPosterFirm || undefined,
          workplaceType,
          location: cleanLoc || 'Remote',
          salaryMin: salaryMin > 0 ? salaryMin : undefined,
          salaryMax: salaryMax > 0 ? salaryMax : undefined
        },
        materialChangeDetected: evaluation.shifts.length > 0,
        materialChangeDetails: evaluation.shifts.map(s => s.description),
        materialShifts: evaluation.shifts,
        flaggedRiskLevel: evaluation.flaggedRiskLevel
      };

      const jobRef = doc(db, 'jobs', job.id);
      const updateData: Record<string, any> = {
        companyName: cleanCompany,
        posterFirmName: cleanPosterFirm ? cleanPosterFirm : deleteField(),
        title: cleanTitle,
        workplaceType,
        location: cleanLoc ? cleanLoc : 'Remote',
        salaryMin: salaryMin > 0 ? salaryMin : deleteField(),
        salaryMax: salaryMax > 0 ? salaryMax : deleteField(),
        flaggedForReview: false,
        reportCount: 0,
        currentVersion: nextVersionNumber,
        revisions: arrayUnion(newRevision),
        transparencyRating: evaluation.transparencyRating || 'verified_transparent',
        nefariousRiskScore: evaluation.totalRiskScore,
        materialShifts: evaluation.shifts,
        updatedAt: serverTimestamp()
      };

      // Strip all undefined values so updateDoc never throws Unsupported field value: undefined
      const cleanPayload = sanitizeFirestorePayload(updateData);
      await updateDoc(jobRef, cleanPayload as any);

      // Auto-resolve all pending reports for this job ID
      try {
        const reportsQuery = query(collection(db, 'job_reports'), where('jobId', '==', job.id));
        const reportsSnap = await getDocs(reportsQuery);
        for (const rDoc of reportsSnap.docs) {
          await updateDoc(doc(db, 'job_reports', rDoc.id), {
            status: 'resolved',
            resolvedAt: serverTimestamp(),
            resolvedNotes: `Admin validated posting (${nextVersionNumber}): ${changesList.join('; ') || 'Verified accuracy'}`
          });
        }
      } catch (rErr) {
        console.warn('Could not auto-resolve sibling reports:', rErr);
      }

      const mergedJob: Job = {
        ...job,
        companyName: cleanCompany,
        posterFirmName: cleanPosterFirm || undefined,
        title: cleanTitle,
        workplaceType,
        location: cleanLoc || 'Remote',
        salaryMin: salaryMin > 0 ? salaryMin : undefined,
        salaryMax: salaryMax > 0 ? salaryMax : undefined,
        flaggedForReview: false,
        reportCount: 0,
        currentVersion: nextVersionNumber,
        revisions: [...(job.revisions || []), newRevision],
        transparencyRating: evaluation.transparencyRating || 'verified_transparent',
        nefariousRiskScore: evaluation.totalRiskScore,
        materialShifts: evaluation.shifts
      };
      onSaved(mergedJob);
      onClose();
    } catch (err: any) {
      console.error('Failed to update job posting:', err);
      setError(err.message || 'Failed to update job posting');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    setError(null);
    try {
      // Delete from Firestore jobs collection
      const jobRef = doc(db, 'jobs', job.id);
      await deleteDoc(jobRef);

      // Resolve report as purged
      if (report?.id) {
        try {
          const reportRef = doc(db, 'job_reports', report.id);
          await updateDoc(reportRef, {
            status: 'resolved',
            resolvedAt: serverTimestamp(),
            resolvedNotes: 'Admin permanently purged invalid job posting.'
          });
        } catch (rErr) {
          console.warn('Could not mark report resolved:', rErr);
        }
      }

      onDeleted(job.id);
      onClose();
    } catch (err: any) {
      console.error('Failed to purge job posting:', err);
      setError(err.message || 'Failed to delete job posting');
    } finally {
      setSaving(false);
    }
  };

  const handleDismissReport = async () => {
    if (!report?.id) return;
    setSaving(true);
    try {
      const reportRef = doc(db, 'job_reports', report.id);
      await updateDoc(reportRef, {
        status: 'dismissed',
        resolvedAt: serverTimestamp(),
        resolvedNotes: 'Admin dismissed report as non-actionable.'
      });

      // Clear flag on job
      try {
        const jobRef = doc(db, 'jobs', job.id);
        await updateDoc(jobRef, { flaggedForReview: false });
      } catch (jErr) {
        console.warn('Could not unflag job:', jErr);
      }

      if (onDismissReport) {
        onDismissReport(report.id);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to dismiss report');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="validation-diff-title"
    >
      <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-200 dark:border-indigo-800">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="validation-diff-title" className="text-xl font-black text-slate-900 dark:text-white">
                  Validation Diff Window
                </h2>
                {report && (
                  <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                    Flagged: {report.reason.replace(/_/g, ' ')}
                  </span>
                )}
                {totalDiffs > 0 && (
                  <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {totalDiffs} field{totalDiffs > 1 ? 's' : ''} modified
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Side-by-side comparison of original ingested values vs live verified corrections.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Reporter Quick Suggestion Banner */}
        {report && (report.proposedCompanyName || report.proposedPosterFirmName) && (
          <div className="mx-6 mt-4 p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-800 dark:text-amber-300">Reporter Suggested:</span>
              {report.proposedCompanyName && (
                <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md font-semibold text-slate-800 dark:text-slate-200 border border-amber-200 dark:border-amber-700">
                  Company: {report.proposedCompanyName}
                </span>
              )}
              {report.proposedPosterFirmName && (
                <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md font-semibold text-slate-800 dark:text-slate-200 border border-amber-200 dark:border-amber-700">
                  Managed By: {report.proposedPosterFirmName}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleApplyReporterSuggestions}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] transition-colors flex items-center gap-1 shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              Apply Suggestion to Form
            </button>
          </div>
        )}

        {/* Side-by-Side Diff Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Original Ingested State */}
          <div className="p-5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                Original Ingested Snapshot
              </span>
              <span className="text-[11px] font-semibold text-slate-400">
                Source: {job.sourceBoard || 'System Ingest'} (v{job.currentVersion || '1.0.0'})
              </span>
            </div>

            {/* Version & Subsequent Modification Warning */}
            {job.currentVersion && job.currentVersion !== 'v1.0.0' && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <strong className="font-bold block">Subsequent Updates Detected (v{job.currentVersion})</strong>
                  This posting was modified after the report was filed. You are comparing proposed corrections against the latest live state.
                </div>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold text-slate-500 uppercase text-[10px] block mb-0.5">Company Name</span>
                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  <span className={isCompanyDiff ? 'line-through text-rose-500' : ''}>{job.companyName}</span>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-500 uppercase text-[10px] block mb-0.5">Posted / Managed By</span>
                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span className={isPosterDiff ? 'line-through text-rose-500' : ''}>
                    {job.posterFirmName || job.recruiterInfo?.firmName || '(None detected)'}
                  </span>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-500 uppercase text-[10px] block mb-0.5">Job Title</span>
                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 font-medium text-slate-700 dark:text-slate-300">
                  <span className={isTitleDiff ? 'line-through text-rose-500' : ''}>{job.title}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-bold text-slate-500 uppercase text-[10px] block mb-0.5">Workplace</span>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                    {job.workplaceType || 'Remote'}
                  </div>
                </div>
                <div>
                  <span className="font-bold text-slate-500 uppercase text-[10px] block mb-0.5">Location</span>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 truncate">
                    {job.location || 'N/A'}
                  </div>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-500 uppercase text-[10px] block mb-0.5">Salary Range</span>
                <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                  {job.salaryMin ? `$${job.salaryMin.toLocaleString()}` : '$0'} - {job.salaryMax ? `$${job.salaryMax.toLocaleString()}` : '$0'}
                </div>
              </div>

              {/* Raw Excerpt Context */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-500 uppercase text-[10px] block">
                    Posting Context & Description ({job.description?.length || 0} chars)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsContextExpanded(!isContextExpanded)}
                      className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                      aria-label={isContextExpanded ? 'Collapse context viewer' : 'Expand context viewer'}
                    >
                      {isContextExpanded ? (
                        <>
                          <Minimize2 className="w-3 h-3" />
                          <span>Compact</span>
                        </>
                      ) : (
                        <>
                          <Maximize2 className="w-3 h-3" />
                          <span>Expand</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPostDetailsModal(true)}
                      className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 flex items-center gap-0.5"
                      aria-label="Open full post details dialog"
                    >
                      <FileText className="w-3 h-3" />
                      <span>Full Requisition</span>
                    </button>
                  </div>
                </div>
                <div className={`p-3 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-600 dark:text-slate-400 ${isContextExpanded ? 'max-h-96' : 'max-h-44'} overflow-y-auto whitespace-pre-wrap leading-relaxed transition-all duration-200`}>
                  {job.description || '(No description text recorded)'}
                </div>
              </div>

              {/* Report Context if present */}
              {report && (
                <div className="p-3 bg-rose-50/60 dark:bg-rose-950/20 rounded-xl border border-rose-200/60 dark:border-rose-900/40 space-y-1">
                  <div className="font-bold text-rose-700 dark:text-rose-400 text-[10px] uppercase">
                    Reporter Notes ({report.reporterEmail}):
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 italic">{report.notes || 'No notes provided'}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Live Editable Corrections */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-indigo-100 dark:border-indigo-900/40">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Live Corrections & Diff Editor
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                    totalDiffs > 0
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    {totalDiffs > 0 ? `${totalDiffs} Pending Diff${totalDiffs === 1 ? '' : 's'}` : 'In Sync with Posting'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Fields with <span className="text-rose-600 dark:text-rose-400 font-bold">Required</span> must be non-empty. <span className="text-slate-500 font-semibold">Optional</span> fields can be left blank.
                </p>
              </div>
              {totalDiffs > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setCompanyName(job.companyName || '');
                    setPosterFirmName(job.posterFirmName || '');
                    setTitle(job.title || '');
                    setWorkplaceType(job.workplaceType || 'Remote');
                    setLocation(job.location || '');
                    setSalaryMin(job.salaryMin || 0);
                    setSalaryMax(job.salaryMax || 0);
                  }}
                  className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 font-semibold"
                >
                  <Undo2 className="w-3 h-3" /> Revert All
                </button>
              )}
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="edit-company" className="font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px]">
                    Validated Company Name
                  </label>
                  <div className="flex items-center gap-1.5">
                    {isCompanyDiff && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                        Modified
                      </span>
                    )}
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-900/60">
                      Required
                    </span>
                  </div>
                </div>
                <input
                  id="edit-company"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Boeing, Microsoft, Pierce County"
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-bold transition-colors ${
                    isCompanyDiff
                      ? 'border-emerald-500 ring-2 ring-emerald-500/10 bg-emerald-50/20 text-emerald-900 dark:text-emerald-100'
                      : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100'
                  }`}
                />
                <p className="text-[10px] text-slate-400 mt-1">Legal employer or principal entity hiring for this requisition</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="edit-poster" className="font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px]">
                    Posted / Managed By Firm (Recruiter Agency)
                  </label>
                  <div className="flex items-center gap-1.5">
                    {isPosterDiff && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                        Modified
                      </span>
                    )}
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      Optional
                    </span>
                    {posterFirmName && (
                      <button
                        type="button"
                        onClick={() => setPosterFirmName('')}
                        className="text-[10px] text-rose-500 hover:text-rose-700 underline font-semibold ml-1"
                      >
                        Clear Agency
                      </button>
                    )}
                  </div>
                </div>
                <input
                  id="edit-poster"
                  type="text"
                  value={posterFirmName}
                  onChange={(e) => setPosterFirmName(e.target.value)}
                  placeholder="e.g. Apex Systems, Tekfortune (or leave blank if direct hire)"
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold transition-colors ${
                    isPosterDiff
                      ? 'border-emerald-500 ring-2 ring-emerald-500/10 bg-emerald-50/20 text-emerald-900 dark:text-emerald-100'
                      : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100'
                  }`}
                />
                <p className="text-[10px] text-slate-400 mt-1">Staffing agency or headhunter firm. Leave blank or clear for direct employer postings.</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="edit-title" className="font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px]">
                    Job Title
                  </label>
                  <div className="flex items-center gap-1.5">
                    {isTitleDiff && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                        Modified
                      </span>
                    )}
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-900/60">
                      Required
                    </span>
                  </div>
                </div>
                <input
                  id="edit-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="edit-workplace" className="font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px]">
                      Workplace Mode
                    </label>
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-900/60">
                      Required
                    </span>
                  </div>
                  <select
                    id="edit-workplace"
                    value={workplaceType}
                    onChange={(e) => setWorkplaceType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-semibold"
                  >
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="On-Site">On-Site</option>
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="edit-location" className="font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px]">
                      Location
                    </label>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      Optional
                    </span>
                  </div>
                  <input
                    id="edit-location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Tukwila, WA (or Remote)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Defaults to 'Remote' if blank</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="edit-sal-min" className="font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px]">
                      Min Salary ($)
                    </label>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      Optional
                    </span>
                  </div>
                  <input
                    id="edit-sal-min"
                    type="number"
                    step="5000"
                    value={salaryMin || ''}
                    onChange={(e) => setSalaryMin(parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="edit-sal-max" className="font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px]">
                      Max Salary ($)
                    </label>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      Optional
                    </span>
                  </div>
                  <input
                    id="edit-sal-max"
                    type="number"
                    step="5000"
                    value={salaryMax || ''}
                    onChange={(e) => setSalaryMax(parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400">Compensation bounds in USD (set to 0 if undisclosed in description)</p>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-rose-600">Permanently delete posting?</span>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleDelete}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                >
                  Yes, Delete
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="px-4 py-2.5 rounded-xl border border-rose-300 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Bad Posting</span>
              </button>
            )}

            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 border-l border-slate-200 dark:border-slate-800 pl-3">
              <History className="w-3.5 h-3.5 text-indigo-500" />
              <span>Next Candidate Audit Version: <strong className="text-slate-800 dark:text-slate-200 font-mono">{previewNextVersion}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Post Details Action Button */}
            <button
              type="button"
              onClick={() => setShowPostDetailsModal(true)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
              aria-label="View full post details"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>View Post Details</span>
            </button>

            {report && (
              <button
                type="button"
                onClick={handleDismissReport}
                disabled={saving}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Dismiss Report
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Close
            </button>

            <button
              type="button"
              disabled={saving || !companyName.trim() || !title.trim()}
              onClick={handleSave}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>
                {totalDiffs > 0
                  ? `Approve & Record (${totalDiffs} Diff${totalDiffs === 1 ? '' : 's'})`
                  : 'Approve & Mark Verified'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Full Requisition Detail Modal */}
      {showPostDetailsModal && (
        <AdminPostDetailsModal
          isOpen={showPostDetailsModal}
          onClose={() => setShowPostDetailsModal(false)}
          job={job}
        />
      )}
    </div>
  );
};
