import React, { useState, useEffect, useRef } from 'react';
import { EyeOff, X, AlertTriangle, CheckCircle2, Loader2, Building, ShieldAlert } from 'lucide-react';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../hooks/useAuth';

interface IgnoreJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: {
    id: string;
    title: string;
    companyName: string;
  };
  onIgnored?: () => void;
}

const IGNORE_REASONS = [
  { id: 'poor_match_fit', label: 'Poor Match Fit / Skills Mismatch', description: 'Agree with poor match rating or skill gaps' },
  { id: 'salary_too_low', label: 'Salary / Compensation Below Expectations', description: 'Compensation does not align with requirements' },
  { id: 'location_mismatch', label: 'Location or Commute Mismatch', description: 'Workplace model or geography does not work' },
  { id: 'not_interested_company', label: 'Not Interested in Company / Industry', description: 'Industry or organization profile is not a fit' },
  { id: 'other', label: 'Other Reason (Optional)', description: 'General preference to hide this listing' }
];

export const IgnoreJobModal: React.FC<IgnoreJobModalProps> = ({
  isOpen,
  onClose,
  job,
  onIgnored
}) => {
  const { user } = useAuth();
  const [reasonCategory, setReasonCategory] = useState('poor_match_fit');
  const [reasonNotes, setReasonNotes] = useState('');
  const [addToExcludedCompanies, setAddToExcludedCompanies] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [ignored, setIgnored] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const firstSelectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (isOpen) {
      setIgnored(false);
      setError(null);
      setReasonCategory('poor_match_fit');
      setReasonNotes('');
      setAddToExcludedCompanies(true);
      setTimeout(() => firstSelectRef.current?.focus(), 50);
    }
  }, [isOpen]);

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
      if (user?.uid) {
        const userRef = doc(db, 'user_profiles', user.uid);
        const updateData: any = {
          ignoredJobIds: arrayUnion(job.id)
        };

        if (addToExcludedCompanies && job.companyName) {
          updateData['privacy.excludedCompanies'] = arrayUnion(job.companyName.trim());
        }

        await updateDoc(userRef, updateData);
      }

      setIgnored(true);
      if (onIgnored) {
        onIgnored();
      }

      setTimeout(() => {
        onClose();
        window.location.hash = '';
      }, 1500);
    } catch (err: any) {
      console.error('Error ignoring job:', err);
      setError(err.message || 'Failed to ignore job. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ignore-modal-title"
    >
      <div
        ref={modalRef}
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 overflow-hidden"
      >
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl border border-slate-200 dark:border-slate-700">
              <EyeOff className="w-5 h-5" />
            </div>
            <div>
              <h2 id="ignore-modal-title" className="text-lg font-black text-slate-900 dark:text-white">
                Ignore / Not Interested
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                {job.title} • <span className="font-semibold">{job.companyName}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {ignored ? (
          <div className="py-8 flex flex-col items-center text-center space-y-3">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-emerald-800 animate-in zoom-in-75 duration-300">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Job Ignored & Company Excluded</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
              This posting has been hidden and <strong>{job.companyName}</strong> has been added to your exclusion filter list.
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

            <div>
              <label htmlFor="ignore-reason" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                Reason for Passing (Optional)
              </label>
              <select
                id="ignore-reason"
                ref={firstSelectRef}
                value={reasonCategory}
                onChange={(e) => setReasonCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              >
                {IGNORE_REASONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {IGNORE_REASONS.find((r) => r.id === reasonCategory)?.description}
              </p>
            </div>

            {/* Add to Excluded Companies list option */}
            {job.companyName && (
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60">
                <input
                  id="exclude-company"
                  type="checkbox"
                  checked={addToExcludedCompanies}
                  onChange={(e) => setAddToExcludedCompanies(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="exclude-company" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  <strong className="block font-bold text-slate-900 dark:text-white mb-0.5">Add "{job.companyName}" to Excluded Companies</strong>
                  Automatically filter out and block future job postings from this employer so you do not have to manually ignore them again.
                </label>
              </div>
            )}

            <div>
              <label htmlFor="ignore-notes" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Additional Notes / Feedback (Optional)
              </label>
              <textarea
                id="ignore-notes"
                rows={2}
                value={reasonNotes}
                onChange={(e) => setReasonNotes(e.target.value)}
                placeholder="Share any details to help tune future recommendations..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

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
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>Ignore & Exclude Employer</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
