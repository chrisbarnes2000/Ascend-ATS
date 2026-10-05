import { motion } from 'motion/react';
import { Database, Sparkles, Loader2 } from 'lucide-react';
import { sampleJobSets } from './adminMockData';

interface AdminDataSeedingTabProps {
  isProcessing: boolean;
  selectedJobSet: string;
  onSelectJobSet: (id: string) => void;
  onSeedSingleSet: (jobs: any[], setName: string) => void;
  onBulkSeed: () => void;
}

export function AdminDataSeedingTab({
  isProcessing,
  selectedJobSet,
  onSelectJobSet,
  onSeedSingleSet,
  onBulkSeed
}: AdminDataSeedingTabProps) {
  const currentSet = sampleJobSets.find(s => s.id === selectedJobSet) || sampleJobSets[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 text-left"
    >
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-600" />
              Realistic Platform Data Sampling
            </h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
              Inject rich candidate profiles, staffing agencies, and industry job requisitions into Firestore.
            </p>
          </div>
          <button
            onClick={onBulkSeed}
            disabled={isProcessing}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all cursor-pointer whitespace-nowrap"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
            <span>Inject Full Multi-Industry Sample Suite</span>
          </button>
        </div>

        <div className="space-y-4">
          <label className="block text-xs font-black uppercase tracking-widest text-slate-400">Select Industry Set to Sample Single Category</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {sampleJobSets.map((set) => (
              <button
                key={set.id}
                onClick={() => onSelectJobSet(set.id)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  selectedJobSet === set.id
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-extrabold shadow-sm'
                    : 'bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold hover:border-slate-300'
                }`}
              >
                <div className="text-xs font-black">{set.name}</div>
                <div className="text-[10px] opacity-75 mt-0.5">{set.jobs.length} Positions</div>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">{currentSet.name} Role Preview</h4>
            <button
              onClick={() => onSeedSingleSet(currentSet.jobs, currentSet.name)}
              disabled={isProcessing}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Inject {currentSet.name} ({currentSet.jobs.length} Roles)
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentSet.jobs.map((job, idx) => (
              <div key={idx} className="p-4 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                <div className="font-extrabold text-slate-900 dark:text-white">{job.title}</div>
                <div className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">{job.companyName}</div>
                <div className="text-[10px] text-slate-500 line-clamp-2 mt-1">{job.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
