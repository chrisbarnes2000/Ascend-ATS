import React, { useState, useEffect, useRef } from 'react';
import { Flag, X, AlertTriangle, CheckCircle2, Loader2, Building, UserCheck } from 'lucide-react';
import { collection, doc, setDoc, updateDoc, increment, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../hooks/useAuth';
import { JobReportReason } from '../types';

interface ReportJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: {
    id: string;
    title: string;
    companyName: string;
    posterFirmName?: string;
  };
  onReportSubmitted?: () => void;
}

const REPORT_REASONS: { id: JobReportReason; label: string; description: string }[] = [
  {
    id: 'incorrect_company',
    label: 'Incorrect Company Name',
    description: 'Company was incorrectly extracted (e.g. branch name, snippet, or generic phrase)'
  },
  {
    id: 'incorrect_poster',
    label: 'Incorrect Recruiter / Managed-By',
    description: 'Recruiter or agency name was misparsed from description text'
  },
  {
    id: 'misleading_text',
    label: 'Misleading or Broken Description',
    description: 'Job posting content contains bad formatting or garbled text'
  },
  {
    id: 'expired_or_closed',
    label: 'Expired or Closed Role',
    description: 'This position is no longer accepting applications'
  },
  {
    id: 'scam_or_suspicious',
    label: 'Suspicious / Potential Scam',
    description: 'Posting appears fraudulent, demands payment, or violates policies'
  },
  {
    id: 'other',
    label: 'Other Quality Issue',
    description: 'Any other data inconsistency requiring administrator validation'
  }
];

export const ReportJobModal: React.FC<ReportJobModalProps> = ({
  isOpen,
  onClose,
  job,
  onReportSubmitted
}) => {
  const { user } = useAuth();
  const [reason, setReason] = useState<JobReportReason>('incorrect_company');
  const [suggestedCompany, setSuggestedCompany] = useState('');
  const [suggestedPoster, setSuggestedPoster] = useState('');
  const [notes, setNotes] = useState('');
  const [markAsIgnored, setMarkAsIgnored] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSubmitted(false);
      setError(null);
      setSuggestedCompany('');
      setSuggestedPoster('');
      setNotes('');
      setMarkAsIgnored(true);
      setReason('incorrect_company');
      setTimeout(() => firstInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard accessibility: Escape to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const reportId = `rep_${job.id}_${Date.now()}`;
      const reporterRole = user?.role === 'recruiter' || user?.role === 'employer' ? 'recruiter' : 'candidate';

      const reportPayload = {
        id: reportId,
        jobId: job.id,
        jobTitle: job.title,
        companyName: job.companyName,
        posterFirmName: job.posterFirmName || null,
        reporterUid: user?.uid || 'anonymous',
        reporterEmail: user?.email || 'anonymous@platform.local',
        reporterRole,
        reason,
        notes: notes.trim() || null,
        proposedCompanyName: suggestedCompany.trim() || null,
        proposedPosterFirmName: suggestedPoster.trim() || null,
        status: 'pending',
        createdAt: serverTimestamp()
      };

      // Clean undefined fields
      const cleanPayload = Object.fromEntries(
        Object.entries(reportPayload).filter(([_, v]) => v !== undefined)
      );

      // Write to Firestore job_reports collection
      await setDoc(doc(db, 'job_reports', reportId), cleanPayload);

      // Flag the job in the jobs collection
      try {
        const jobRef = doc(db, 'jobs', job.id);
        await updateDoc(jobRef, {
          flaggedForReview: true,
          reportCount: increment(1)
        });
      } catch (err) {
        console.warn('Could not increment job report count:', err);
      }

      // If user selected markAsIgnored, hide job from view
      if (markAsIgnored && user?.uid) {
        try {
          const userRef = doc(db, 'user_profiles', user.uid);
          await updateDoc(userRef, {
            ignoredJobIds: arrayUnion(job.id)
          });
        } catch (err) {
          console.warn('Could not mark job as ignored for user:', err);
        }
      }

      setSubmitted(true);
      if (onReportSubmitted) {
        onReportSubmitted();
      }
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: any) {
      console.error('Error submitting job report:', err);
      setError(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      <div
        ref={modalRef}
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-200 dark:border-rose-800/60">
              <Flag className="w-5 h-5" />
            </div>
            <div>
              <h2 id="report-modal-title" className="text-lg font-black text-slate-900 dark:text-white">
                Report Job Posting
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                {job.title} • <span className="font-semibold">{job.companyName}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 flex flex-col items-center text-center space-y-3">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-emerald-800 animate-in zoom-in-75 duration-300">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Report Submitted</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
              Thank you! Our platform moderation team will review this posting in the validation diff window and update or remove it.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Current Detected Values */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs space-y-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Detected Metadata:</div>
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Company: <strong className="text-slate-900 dark:text-slate-100">{job.companyName}</strong></span>
              </div>
              {job.posterFirmName && (
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Managed by: <strong className="text-indigo-600 dark:text-indigo-400">{job.posterFirmName}</strong></span>
                </div>
              )}
            </div>

            {/* Reason Select */}
            <div>
              <label htmlFor="report-reason" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                Issue Category <span className="text-rose-500">*</span>
              </label>
              <select
                id="report-reason"
                ref={firstInputRef}
                value={reason}
                onChange={(e) => setReason(e.target.value as JobReportReason)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                {REPORT_REASONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {REPORT_REASONS.find((r) => r.id === reason)?.description}
              </p>
            </div>

            {/* Suggested Corrections */}
            {reason === 'incorrect_company' && (
              <div>
                <label htmlFor="suggested-company" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Actual Company Name (Optional)
                </label>
                <input
                  id="suggested-company"
                  type="text"
                  value={suggestedCompany}
                  onChange={(e) => setSuggestedCompany(e.target.value)}
                  placeholder="e.g. Acme Corp (if listed in description)"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            )}

            {reason === 'incorrect_poster' && (
              <div>
                <label htmlFor="suggested-poster" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Actual Recruiter / Staffing Firm (Optional)
                </label>
                <input
                  id="suggested-poster"
                  type="text"
                  value={suggestedPoster}
                  onChange={(e) => setSuggestedPoster(e.target.value)}
                  placeholder="e.g. Talent Solutions Inc"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            )}

            {/* Notes / Details */}
            <div>
              <label htmlFor="report-notes" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Explanation & Details
              </label>
              <textarea
                id="report-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe what is incorrect (e.g. 'Company is listed as our Tukwila Branch in error; actual employer is Boeing')..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Remove from view / mark as ignored option */}
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
              <input
                id="mark-ignored"
                type="checkbox"
                checked={markAsIgnored}
                onChange={(e) => setMarkAsIgnored(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="mark-ignored" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                <strong className="block font-bold text-slate-900 dark:text-white mb-0.5">Remove from view / set to ignored</strong>
                Hide this posting from my active recommendations and matches (recommended for scams, bad posts, or uninterested roles). Uncheck if you are only reporting for updates and wish to keep it visible.
              </label>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-600/20 flex items-center gap-1.5 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Flag className="w-3.5 h-3.5" />}
                <span>Submit Report</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
