import { AlertTriangle } from 'lucide-react';

interface AdminConfirmationModalProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function AdminConfirmationModal({
  isOpen,
  message,
  onConfirm,
  onCancel
}: AdminConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 text-center">
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-full w-16 h-16 mx-auto flex items-center justify-center border border-rose-200 dark:border-rose-800">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-black text-slate-900 dark:text-white">Confirm System Action</h3>
          <p className="text-xs text-slate-500 font-semibold leading-relaxed">{message}</p>
        </div>

        <div className="flex gap-3 justify-center pt-2">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl uppercase tracking-wider transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onCancel();
            }}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl uppercase tracking-wider transition-all shadow-lg shadow-rose-500/20 cursor-pointer"
          >
            Proceed Action
          </button>
        </div>
      </div>
    </div>
  );
}
