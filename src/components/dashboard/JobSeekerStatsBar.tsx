import { Send, Clock, CheckCircle2, TrendingUp } from 'lucide-react';
import { Application } from '../../types';

interface JobSeekerStatsBarProps {
  applications: Application[];
}

export function JobSeekerStatsBar({ applications }: JobSeekerStatsBarProps) {
  const stats = [
    { label: 'Applied', count: applications.length, icon: Send, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/40' },
    { label: 'Viewed', count: applications.filter(a => a.status === 'viewed').length, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/40' },
    { label: 'Interviewing', count: applications.filter(a => a.status === 'interviewing').length, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
    { label: 'Offers', count: applications.filter(a => a.status === 'offered').length, icon: TrendingUp, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-950/40' }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {stats.map((s, idx) => {
        const Icon = s.icon;
        return (
          <div key={idx} className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 text-left">
            <div className={`p-3 rounded-xl ${s.bg}`}>
              <Icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">{s.count}</div>
              <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{s.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
