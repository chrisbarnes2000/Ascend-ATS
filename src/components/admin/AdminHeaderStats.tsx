import { Briefcase, Users, FileText, Building, RefreshCw, Loader2, ExternalLink } from 'lucide-react';

interface AdminHeaderStatsProps {
  stats: {
    jobsCount: number;
    appsCount: number;
    usersCount: number;
    companiesCount: number;
  };
  isProcessing: boolean;
  onSyncCompanies: () => void;
  onSelectTab?: (tab: string) => void;
}

export function AdminHeaderStats({ stats, isProcessing, onSyncCompanies, onSelectTab }: AdminHeaderStatsProps) {
  return (
    <div className="space-y-6 mb-8 text-left">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Admin Executive Command Center</h1>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Platform Telemetry, Partner Invitations & Data Governance</p>
        </div>
        <button
          onClick={onSyncCompanies}
          disabled={isProcessing}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
          title="Deep sync company profiles across all candidate and recruiter nodes"
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <RefreshCw className="w-4 h-4 text-white" />
          )}
          <span>Deep Company Sync</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Active Jobs Card -> Links to Data Seeding / Job Requisitions */}
        <div 
          onClick={() => onSelectTab?.('simulation')}
          className="p-5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl flex items-center justify-between shadow-sm hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group"
          title="Click to view Active Jobs & Data Seeding Engine"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-2xl text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">{stats.jobsCount}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Jobs</div>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
        </div>

        {/* Applications Card -> Links to Access Requests / Applications */}
        <div 
          onClick={() => onSelectTab?.('requests')}
          className="p-5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl flex items-center justify-between shadow-sm hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group"
          title="Click to view Access Requests & Applications"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">{stats.appsCount}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Applications</div>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
        </div>

        {/* Total Users Card -> Links to Talent Pool / Employer Sourcing */}
        <div 
          onClick={() => { window.location.hash = '#sourcing'; }}
          className="p-5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl flex items-center justify-between shadow-sm hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer group"
          title="Click to view Talent Pool / Employer Sourcing"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">{stats.usersCount}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Users</div>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
        </div>

        {/* Companies Card -> Links to Company Directory */}
        <div 
          onClick={() => { window.location.hash = '#companies'; }}
          className="p-5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl flex items-center justify-between shadow-sm hover:border-amber-500 hover:shadow-md transition-all cursor-pointer group"
          title="Click to view Company Directory page"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">{stats.companiesCount}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Companies</div>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-amber-500 transition-colors" />
        </div>
      </div>
    </div>
  );
}
