import { useState } from 'react';
import { Building, Plus, Loader2, X } from 'lucide-react';

interface EmployerCompanyClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableCompanies: Array<{ name: string; id: string; ownerId?: string }>;
  onClaimCompany: (companyName: string, companyId?: string, ownerId?: string) => Promise<void>;
  isClaiming: boolean;
}

export function EmployerCompanyClaimModal({
  isOpen,
  onClose,
  availableCompanies,
  onClaimCompany,
  isClaiming
}: EmployerCompanyClaimModalProps) {
  const [customName, setCustomName] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 text-left">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-600" />
              Associate or Claim Employer Profile
            </h3>
            <p className="text-xs text-slate-500 font-bold mt-0.5">Link your recruiter profile to an authorized company directory entry.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Select Existing Directory Firm</label>
            <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-semibold">
              {availableCompanies.map(c => (
                <button
                  key={c.id}
                  onClick={() => onClaimCompany(c.name, c.id, c.ownerId)}
                  disabled={isClaiming}
                  className="w-full p-2.5 rounded-xl text-left bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between group transition-all cursor-pointer"
                >
                  <span className="text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 font-bold">{c.name}</span>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-600 dark:text-indigo-400">Request Link</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Or Register New Agency / Firm</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                placeholder="e.g. Apex Staffing Partners"
                className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={() => {
                  if (customName.trim()) {
                    onClaimCompany(customName.trim());
                    setCustomName('');
                  }
                }}
                disabled={isClaiming || !customName.trim()}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-indigo-500/20 cursor-pointer shrink-0"
              >
                {isClaiming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                <span>Register</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
