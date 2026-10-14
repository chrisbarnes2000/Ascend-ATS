import React, { useEffect, useRef } from 'react';
import { X, ExternalLink, Building, Briefcase, MapPin, DollarSign, Calendar, ShieldCheck, AlertTriangle, Tag } from 'lucide-react';
import { Job } from '../../types';
import { CleanEmployerContactCard } from '../CleanEmployerContactCard';

interface AdminPostDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
}

export const AdminPostDetailsModal: React.FC<AdminPostDetailsModalProps> = ({
  isOpen,
  onClose,
  job
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation & accessibility: Escape key dismiss
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formattedSalary = job.salaryMin || job.salaryMax
    ? `$${(job.salaryMin || 0).toLocaleString()} - $${(job.salaryMax || 0).toLocaleString()}`
    : 'Not Specified';

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-post-details-title"
    >
      <div
        ref={modalRef}
        className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden text-slate-800 dark:text-slate-100"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/60 dark:bg-slate-950/40">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
                Full Requisition View
              </span>
              {job.flaggedForReview && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Flagged For Review
                </span>
              )}
              {job.transparencyRating && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  {job.transparencyRating}
                </span>
              )}
            </div>
            <h2 id="admin-post-details-title" className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
              {job.title}
            </h2>
            <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 font-medium flex-wrap">
              <span className="flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-bold text-slate-800 dark:text-slate-200">{job.companyName}</span>
              </span>
              {job.posterFirmName && (
                <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                  <Briefcase className="w-3.5 h-3.5" />
                  Via agency: {job.posterFirmName}
                </span>
              )}
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {job.location || 'Location Unspecified'} ({job.workplaceType || 'Remote'})
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                {formattedSalary}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`#job/${job.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs font-bold"
              title="Open public job page in new tab"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Open Live Page</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close post details modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm leading-relaxed">
          {/* Clean Employer Contact Card (Scrubbed Dice Boilerplate & Verified Entity Details) */}
          <CleanEmployerContactCard
            companyName={job.companyName}
            posterFirmName={job.posterFirmName}
            location={job.location}
            description={job.description}
          />

          {/* Metadata Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Requisition ID</span>
              <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 truncate block">
                {job.jobNumber || job.id}
              </span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Workplace Mode</span>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {job.workplaceType || 'Remote'}
              </span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Status</span>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 capitalize">
                {job.status || 'Active'}
              </span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Reports Received</span>
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                {job.reportCount ?? 0}
              </span>
            </div>
          </div>

          {/* Complete Uncut Job Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Full Posting Description
              </h3>
              <span className="text-[10px] font-mono text-slate-400">
                {job.description?.length || 0} characters
              </span>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200 dark:border-slate-800 whitespace-pre-wrap font-sans text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed max-h-[380px] overflow-y-auto">
              {job.description || '(No description text recorded)'}
            </div>
          </div>

          {/* Requirements if provided */}
          {job.requirements && (
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Requirements & Qualifications
              </h3>
              <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200 dark:border-slate-800 whitespace-pre-wrap font-sans text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed max-h-48 overflow-y-auto">
                {job.requirements}
              </div>
            </div>
          )}

          {/* Skills Badges */}
          {((job.requiredSkills && job.requiredSkills.length > 0) || (job.preferredSkills && job.preferredSkills.length > 0)) && (
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Identified Skills & Keywords
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {job.requiredSkills?.map((skill, idx) => (
                  <span
                    key={`req-${idx}`}
                    className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-semibold border border-indigo-200 dark:border-indigo-800"
                  >
                    {skill}
                  </span>
                ))}
                {job.preferredSkills?.map((skill, idx) => (
                  <span
                    key={`pref-${idx}`}
                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Benefits Badges */}
          {job.benefits && job.benefits.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Benefits & Perks
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {job.benefits.map((benefit, idx) => (
                  <span
                    key={`ben-${idx}`}
                    className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-medium border border-emerald-200 dark:border-emerald-800 flex items-center gap-1"
                  >
                    <Tag className="w-3 h-3 text-emerald-500" />
                    {benefit}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Requisition inspection mode • Ascend ATS
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold transition-colors"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
