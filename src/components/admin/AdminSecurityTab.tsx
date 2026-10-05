import { motion } from 'motion/react';
import { Terminal, Trash2, AlertTriangle } from 'lucide-react';

interface AdminSecurityTabProps {
  onOpenConfirmModal: (message: string, action: () => void) => void;
}

export function AdminSecurityTab({ onOpenConfirmModal }: AdminSecurityTabProps) {
  const handlePurgeMockData = () => {
    onOpenConfirmModal(
      'Are you sure you want to purge all test applications and mock job listings? Active production users will remain untouched.',
      async () => {
        // Purge logic
      }
    );
  };

  const handleHardReset = () => {
    onOpenConfirmModal(
      'CRITICAL WARNING: This will reset system telemetry counters and prune orphaned records. Proceed with extreme caution.',
      async () => {
        // Reset logic
      }
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 text-left"
    >
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 sm:p-8 space-y-6">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-rose-600" />
            Security & System Maintenance Terminal
          </h3>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
            Data pruning, audit log checks, and system maintenance utilities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
              <Trash2 className="w-4 h-4 text-rose-500" />
              <span>Purge Sample & Test Data</span>
            </div>
            <p className="text-xs text-slate-500">
              Remove test job applications, sample company profiles, and simulated records from Firestore without touching real user accounts.
            </p>
            <button
              onClick={handlePurgeMockData}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl uppercase tracking-wider transition-all cursor-pointer"
            >
              Purge Sample Data
            </button>
          </div>

          <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Prune Orphaned Records</span>
            </div>
            <p className="text-xs text-slate-500">
              Clean up unlinked job descriptions and historical expired tokens. Maintains database indexing health.
            </p>
            <button
              onClick={handleHardReset}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl uppercase tracking-wider transition-all cursor-pointer"
            >
              Prune Orphaned Data
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
