import { useState } from 'react';
import { 
  Search, 
  Filter, 
  MessageSquare, 
  Loader2, 
  Send, 
  X, 
  ExternalLink 
} from 'lucide-react';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebase/config';

export interface ApplicationRecord {
  id: string;
  jobId: string;
  seekerId: string;
  companyId?: string;
  companyName?: string;
  jobTitle?: string;
  status: 'applied' | 'viewed' | 'interviewing' | 'offered' | 'rejected' | string;
  appliedAt?: any;
  seekerName?: string;
  seekerEmail?: string;
  seekerHeadline?: string;
  matchPercentage?: number;
  method?: string;
  transitionExplanation?: string;
  communications?: Array<{ sender: string; text: string; timestamp: any }>;
}

interface EmployerApplicantPipelineProps {
  applications: ApplicationRecord[];
  loading: boolean;
  onRefresh: () => void;
}

export function EmployerApplicantPipeline({ applications, loading, onRefresh }: EmployerApplicantPipelineProps) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState<ApplicationRecord | null>(null);
  const [recruiterNote, setRecruiterNote] = useState('');
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const filteredApps = applications.filter(app => {
    const matchesFilter = statusFilter === 'all' || app.status === statusFilter;
    const matchesSearch = !searchQuery.trim() || 
      (app.seekerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.jobTitle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.seekerEmail || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleUpdateStatus = async (appId: string, newStatus: string, note?: string) => {
    setUpdatingStatusId(appId);
    try {
      const payload: any = {
        status: newStatus,
        updatedAt: new Date().toISOString()
      };

      if (note && note.trim()) {
        payload.communications = arrayUnion({
          sender: 'Employer',
          text: note.trim(),
          timestamp: new Date().toISOString()
        });
      }

      await updateDoc(doc(db, 'applications', appId), payload);
      setRecruiterNote('');
      setSelectedApp(null);
      onRefresh();
    } catch (err: any) {
      console.error("Failed to update status", err);
      alert("Status update failed: " + err.message);
    } finally {
      setUpdatingStatusId(null);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 space-y-6 text-left shadow-sm">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search candidate, email, or role..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          {['all', 'applied', 'viewed', 'interviewing', 'offered'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl font-bold text-[11px] uppercase tracking-wider cursor-pointer whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <th className="pb-3 px-2">Candidate</th>
              <th className="pb-3 px-2">Role Requisition</th>
              <th className="pb-3 px-2">Match Score</th>
              <th className="pb-3 px-2">Pipeline Stage</th>
              <th className="pb-3 px-2 text-right">Recruiter Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-xs">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400 italic">Fetching candidate applications...</td>
              </tr>
            ) : filteredApps.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400 italic">No candidates match the selected filter.</td>
              </tr>
            ) : (
              filteredApps.map(app => (
                <tr key={app.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 px-2">
                    <div className="font-extrabold text-slate-900 dark:text-white">{app.seekerName || 'Candidate'}</div>
                    <div className="text-[11px] text-slate-400">{app.seekerEmail}</div>
                  </td>
                  <td className="py-4 px-2">
                    <div className="font-bold text-slate-800 dark:text-slate-200">{app.jobTitle || 'Role'}</div>
                    <div className="text-[10px] font-semibold text-indigo-600">{app.companyName}</div>
                  </td>
                  <td className="py-4 px-2 font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                    {app.matchPercentage ? `${app.matchPercentage}%` : '85%'}
                  </td>
                  <td className="py-4 px-2">
                    <select
                      value={app.status}
                      onChange={e => handleUpdateStatus(app.id, e.target.value)}
                      disabled={updatingStatusId === app.id}
                      className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      <option value="applied">Applied</option>
                      <option value="viewed">Reviewing / Viewed</option>
                      <option value="interviewing">Interviewing</option>
                      <option value="offered">Offered</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </td>
                  <td className="py-4 px-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedApp(app)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors cursor-pointer"
                        title="Open Communication & Note Drawer"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <a
                        href={`#profile/${app.seekerId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors cursor-pointer"
                        title="View Verified Profile"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Recruiter Communication Modal Drawer */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 text-left">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Candidate Communication & Notes</h3>
                <p className="text-xs text-slate-500 font-bold">{selectedApp.seekerName} • {selectedApp.jobTitle}</p>
              </div>
              <button onClick={() => setSelectedApp(null)} className="p-2 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-52 overflow-y-auto space-y-2 p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
              {selectedApp.communications && selectedApp.communications.length > 0 ? (
                selectedApp.communications.map((c, i) => (
                  <div key={i} className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="font-bold text-[10px] text-indigo-600 uppercase">{c.sender}</div>
                    <p className="text-slate-700 dark:text-slate-300 font-medium mt-0.5">{c.text}</p>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-slate-400 italic">No notes or candidate communications logged yet.</div>
              )}
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Send Note to Candidate or Internal Log</label>
              <textarea
                rows={3}
                value={recruiterNote}
                onChange={e => setRecruiterNote(e.target.value)}
                placeholder="Type update message (e.g., 'Selected for technical interview on Thursday')..."
                className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 resize-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => handleUpdateStatus(selectedApp.id, selectedApp.status, recruiterNote)}
                  disabled={!recruiterNote.trim()}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-indigo-500/20 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Message</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
