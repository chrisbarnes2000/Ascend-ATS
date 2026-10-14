import React, { useState } from 'react';
import { Flag, Building, UserCheck, ShieldAlert, CheckCircle2, Trash2, Eye, Filter, RefreshCw, AlertTriangle, ExternalLink } from 'lucide-react';
import { Job, JobReport } from '../../types';
import { AdminJobValidationModal } from './AdminJobValidationModal';

interface AdminJobModerationTabProps {
  reports: JobReport[];
  jobs: Job[];
  loading: boolean;
  onRefresh: () => void;
  onJobUpdated: (updatedJob: Job) => void;
  onJobDeleted: (jobId: string) => void;
  onReportDismissed: (reportId: string) => void;
}

export const AdminJobModerationTab: React.FC<AdminJobModerationTabProps> = ({
  reports,
  jobs,
  loading,
  onRefresh,
  onJobUpdated,
  onJobDeleted,
  onReportDismissed
}) => {
  const [filterReason, setFilterReason] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<JobReport | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);

  // Combine reports with their corresponding job object
  const activeReports = reports.filter((r) => r.status === 'pending');
  const filteredReports = activeReports.filter((r) => {
    if (filterReason === 'all') return true;
    return r.reason === filterReason;
  });

  const handleOpenDiff = (report: JobReport) => {
    // Find matching job in jobs list, or construct fallback from report
    const match = jobs.find((j) => j.id === report.jobId);
    const jobToReview: Job = match || {
      id: report.jobId,
      companyId: 'unknown',
      companyName: report.companyName,
      posterFirmName: report.posterFirmName,
      title: report.jobTitle,
      description: report.notes || 'Ingested job posting flagged for moderation.',
      requirements: 'See original posting.',
      workplaceType: 'Remote',
      status: 'active',
      createdAt: new Date()
    };

    setSelectedReport(report);
    setSelectedJob(jobToReview);
    setIsDiffModalOpen(true);
  };

  const handleOpenJobDirect = (job: Job) => {
    setSelectedReport(null);
    setSelectedJob(job);
    setIsDiffModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Tab Banner */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-200 dark:border-rose-800">
            <Flag className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Job Quality & Moderation Queue
              </h2>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                {activeReports.length} Pending
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Review flagged company names, misparsed recruiter/branch entities, and launch the side-by-side validation diff window.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Filter:
        </span>
        {[
          { id: 'all', label: `All Reports (${activeReports.length})` },
          { id: 'incorrect_company', label: 'Company Misparsed' },
          { id: 'incorrect_poster', label: 'Managed-By / Agency' },
          { id: 'misleading_text', label: 'Broken Text' },
          { id: 'scam_or_suspicious', label: 'Suspicious' }
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilterReason(f.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterReason === f.id
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Reports Table / List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {filteredReports.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Moderation Queue Clear</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No pending reports matching the current filter. Ingested postings are clean or all issues have been verified.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredReports.map((report) => {
              const matchedJob = jobs.find((j) => j.id === report.jobId);
              return (
                <div
                  key={report.id}
                  className="p-5 sm:p-6 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                        {report.reason.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        Reported by <strong className="text-slate-600 dark:text-slate-300">{report.reporterEmail}</strong> ({report.reporterRole})
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        {report.jobTitle}
                      </h4>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          Company: <span className="text-rose-600 dark:text-rose-400 font-bold">{report.companyName}</span>
                        </span>
                        {report.posterFirmName && (
                          <span className="flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                            Managed by: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{report.posterFirmName}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Reporter Notes & Suggested Corrections */}
                    {(report.notes || report.proposedCompanyName || report.proposedPosterFirmName) && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60 text-xs space-y-1">
                        {report.notes && (
                          <p className="text-slate-700 dark:text-slate-300 italic">
                            "{report.notes}"
                          </p>
                        )}
                        {report.proposedCompanyName && (
                          <p className="font-bold text-emerald-600 dark:text-emerald-400">
                            Suggested Actual Company: {report.proposedCompanyName}
                          </p>
                        )}
                        {report.proposedPosterFirmName && (
                          <p className="font-bold text-indigo-600 dark:text-indigo-400">
                            Suggested Actual Agency: {report.proposedPosterFirmName}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                    <a
                      href={`#job/${report.jobId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                      title="View public posting in new tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      <span>View Post</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => handleOpenDiff(report)}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Open Validation Diff</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal instance */}
      {selectedJob && (
        <AdminJobValidationModal
          isOpen={isDiffModalOpen}
          onClose={() => {
            setIsDiffModalOpen(false);
            setSelectedJob(null);
            setSelectedReport(null);
          }}
          job={selectedJob}
          report={selectedReport}
          onSaved={(updated) => {
            onJobUpdated(updated);
            onRefresh();
          }}
          onDeleted={(id) => {
            onJobDeleted(id);
            onRefresh();
          }}
          onDismissReport={(rId) => {
            onReportDismissed(rId);
            onRefresh();
          }}
        />
      )}
    </div>
  );
};
