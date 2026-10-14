import { motion } from 'motion/react';
import { Mail, Plus, Trash2, Sparkles } from 'lucide-react';

interface AdminRecruiterLeadsTabProps {
  activeLeads: any[];
  loadingLeads: boolean;
  onSyncLeads: () => void;
  onDeleteLead: (id: string) => void;
  onInviteLead: (lead: any) => void;
  onImportFromRoster?: () => void;
}

export function AdminRecruiterLeadsTab({
  activeLeads,
  loadingLeads,
  onSyncLeads,
  onDeleteLead,
  onInviteLead,
  onImportFromRoster
}: AdminRecruiterLeadsTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 text-left"
    >
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden">
        <div className="bg-amber-50/60 dark:bg-amber-950/30 p-6 sm:p-8 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-left">
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-amber-600" />
              Inbound Recruiter Leads (Auto-Discovered)
            </h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
              Recruiters extracted from candidate outreach imports (Dice, GovJobs, and direct reach-outs).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {onImportFromRoster && (
              <button 
                onClick={onImportFromRoster} 
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Import from Network Roster</span>
              </button>
            )}
            <button onClick={onSyncLeads} className="px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all cursor-pointer">
              Sync Ingested Leads ({activeLeads.length})
            </button>
          </div>
        </div>

        <div className="max-h-[550px] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white dark:bg-slate-900 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800 z-10">
              <tr>
                <th className="px-8 py-4">Recruiter & Agency</th>
                <th className="px-4 py-4">Contact Details</th>
                <th className="px-4 py-4">Sourced Role & Client</th>
                <th className="px-4 py-4">Discovered By</th>
                <th className="px-8 py-4 text-right">Outreach Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {loadingLeads ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-xs text-slate-400 font-bold uppercase tracking-widest italic">Fetching recruiter leads...</td>
                </tr>
              ) : activeLeads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-xs text-slate-400 font-bold uppercase tracking-widest italic">No recruiter leads discovered yet. Upload a Dice outreach email in Candidate Tracker to test!</td>
                </tr>
              ) : (
                activeLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group text-xs">
                    <td className="px-8 py-4 text-left">
                      <div className="font-extrabold text-slate-900 dark:text-white">{lead.recruiterName}</div>
                      <div className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">{lead.firmName}</div>
                    </td>
                    <td className="px-4 py-4 text-left">
                      <a href={`mailto:${lead.recruiterEmail}`} className="font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-500 hover:underline block">
                        {lead.recruiterEmail}
                      </a>
                      {lead.recruiterPhone && (
                        <span className="text-[10px] text-slate-400 block mt-0.5">{lead.recruiterPhone}</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-left">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{lead.jobTitle || 'Role Not Specified'}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          {lead.sourceBoard || 'Dice'}
                        </span>
                        {lead.clientName && (
                          <span className="text-[10px] text-slate-400">for {lead.clientName}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-left">
                      <span className="text-[11px] text-slate-600 dark:text-slate-400 block">{lead.discoveredByEmail}</span>
                      <span className="text-[9px] text-slate-400">{lead.createdAt?.toDate ? lead.createdAt.toDate().toLocaleDateString() : 'Recent'}</span>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => onInviteLead(lead)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                          title="Invite Recruiter to Ascend Portal"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Invite</span>
                        </button>
                        <button 
                          onClick={() => onDeleteLead(lead.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-all cursor-pointer"
                          title="Delete Lead"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
