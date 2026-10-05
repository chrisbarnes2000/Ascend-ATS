import { motion } from 'motion/react';
import { Building, Plus, Trash2 } from 'lucide-react';

interface AdminPartnerRequestsTabProps {
  activeRequests: any[];
  loadingRequests: boolean;
  onDeleteRequest: (id: string) => void;
  onConvertRequestToInvite: (req: any) => void;
}

export function AdminPartnerRequestsTab({
  activeRequests,
  loadingRequests,
  onDeleteRequest,
  onConvertRequestToInvite
}: AdminPartnerRequestsTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 text-left"
    >
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Building className="w-5 h-5 text-indigo-600" />
            Inbound Access & Partner Requests ({activeRequests.length})
          </h3>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
            Inbound partner and employer registration requests.
          </p>
        </div>

        <div className="max-h-[550px] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white dark:bg-slate-900 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800 z-10">
              <tr>
                <th className="px-8 py-4">Applicant & Company</th>
                <th className="px-4 py-4">Contact Details</th>
                <th className="px-4 py-4">Status & Date</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50 text-xs">
              {loadingRequests ? (
                <tr>
                  <td colSpan={4} className="px-8 py-12 text-center text-slate-400 italic">Fetching partner requests...</td>
                </tr>
              ) : activeRequests.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-12 text-center text-slate-400 italic">No inbound partner access requests found.</td>
                </tr>
              ) : (
                activeRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-8 py-4 text-left">
                      <div className="font-bold text-slate-900 dark:text-white">{req.fullName || req.name || 'Applicant'}</div>
                      <div className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">{req.companyName || req.firmName || 'Agency'}</div>
                    </td>
                    <td className="px-4 py-4 text-left">
                      <a href={`mailto:${req.email}`} className="font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-500 hover:underline block">
                        {req.email}
                      </a>
                      {req.phone && <span className="text-[10px] text-slate-400 block mt-0.5">{req.phone}</span>}
                    </td>
                    <td className="px-4 py-4 text-left">
                      <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
                        {req.status || 'pending'}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {req.createdAt?.toDate ? req.createdAt.toDate().toLocaleDateString() : 'Recent'}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onConvertRequestToInvite(req)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Convert to Token</span>
                        </button>
                        <button
                          onClick={() => onDeleteRequest(req.id)}
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-all cursor-pointer"
                          title="Delete Request"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
