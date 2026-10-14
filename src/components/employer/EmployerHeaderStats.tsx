import { Users, Eye, CheckCircle2, TrendingUp, Building } from 'lucide-react';

interface EmployerHeaderStatsProps {
  applicationsCount: number;
  viewedCount: number;
  interviewingCount: number;
  offeredCount: number;
  recruiterCompany: { companyName: string; companyId: string; claimedCompanyId?: string };
  onOpenClaimModal: () => void;
}

export function EmployerHeaderStats({
  applicationsCount,
  viewedCount,
  interviewingCount,
  offeredCount,
  recruiterCompany,
  onOpenClaimModal
}: EmployerHeaderStatsProps) {
  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Employer & Recruiter Hub</h1>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Requisition Management, Talent Pipeline & Candidate Sourcing</p>
        </div>

        <button
          onClick={onOpenClaimModal}
          className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-indigo-500 flex items-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <Building className="w-4 h-4 text-indigo-500" />
          <span>{recruiterCompany.companyName ? `Firm: ${recruiterCompany.companyName}` : 'Associate Employer / Agency'}</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{applicationsCount}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Applicants</div>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-600">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{viewedCount}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reviewing</div>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{interviewingCount}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Interviewing</div>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{offeredCount}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Offered</div>
          </div>
        </div>
      </div>
    </div>
  );
}
