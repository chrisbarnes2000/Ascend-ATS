import { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Users, Loader2, Copy, Check, ExternalLink, Trash2, Mail } from 'lucide-react';

interface AdminInvitationsTabProps {
  inviteEmail: string;
  setInviteEmail: (v: string) => void;
  inviteFirmName: string;
  setInviteFirmName: (v: string) => void;
  inviteRole: 'admin' | 'recruiter' | 'owner';
  setInviteRole: (v: 'admin' | 'recruiter' | 'owner') => void;
  isInviting: boolean;
  activeInvitations: any[];
  loadingInvites: boolean;
  onSendInvite: () => void;
  onRevokeInvite: (code: string) => void;
  onDeleteInvite: (code: string) => void;
  inviteModalData: {
    isOpen: boolean;
    email: string;
    targetFirmName: string;
    role: string;
    inviteCode: string;
  } | null;
  onCloseInviteModal: () => void;
  getInviteDetails: (inv: any) => {
    joinUrl: string;
    subject: string;
    body: string;
    mailtoLink: string;
    gmailUrl: string;
    outlookUrl: string;
  };
  handleLaunchMailApp: (url: string) => void;
}

export function AdminInvitationsTab({
  inviteEmail,
  setInviteEmail,
  inviteFirmName,
  setInviteFirmName,
  inviteRole,
  setInviteRole,
  isInviting,
  activeInvitations,
  loadingInvites,
  onSendInvite,
  onRevokeInvite,
  onDeleteInvite,
  inviteModalData,
  onCloseInviteModal,
  getInviteDetails,
  handleLaunchMailApp
}: AdminInvitationsTabProps) {
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmailDraft, setCopiedEmailDraft] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 text-left"
    >
      {/* Create Partner Token Card */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 sm:p-8 space-y-6">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-indigo-600" />
            Issue Single-Use Partner Invitation Token
          </h3>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
            Generate pre-authenticated onboarding links for Staffing Firm Owners, Recruiters, and Enterprise Admins.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Partner Email</label>
            <input
              type="email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="e.g. sarah@toprecruiting.com"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Agency / Firm Name</label>
            <input
              type="text"
              value={inviteFirmName}
              onChange={e => setInviteFirmName(e.target.value)}
              placeholder="e.g. Top Tier Staffing Inc"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Target Access Role</label>
            <select
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value as any)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="recruiter">Recruiter / Staffing Agent</option>
              <option value="owner">Agency Owner / Practice Lead</option>
              <option value="admin">Platform Administrator</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onSendInvite}
            disabled={isInviting || !inviteEmail || !inviteFirmName}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
          >
            {isInviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            <span>Issue Token & Prepare Email</span>
          </button>
        </div>
      </div>

      {/* Active Tokens Table */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Issued Partner Invitations ({activeInvitations.length})
          </h3>
        </div>

        <div className="max-h-[500px] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white dark:bg-slate-900 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800 z-10">
              <tr>
                <th className="px-8 py-4">Recipient & Agency</th>
                <th className="px-4 py-4">Role & Status</th>
                <th className="px-4 py-4">Token Code</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50 text-xs">
              {loadingInvites ? (
                <tr>
                  <td colSpan={4} className="px-8 py-12 text-center text-slate-400 italic">Fetching partner invitations...</td>
                </tr>
              ) : activeInvitations.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-12 text-center text-slate-400 italic">No partner invitations issued yet.</td>
                </tr>
              ) : (
                activeInvitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-8 py-4 font-bold text-slate-900 dark:text-white">
                      <div>{inv.email}</div>
                      <div className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">{inv.targetFirmName || 'Staffing Firm'}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {inv.role || 'recruiter'}
                      </span>
                      <span className={`ml-2 text-[10px] font-bold uppercase ${inv.status === 'expired' ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {inv.status || 'active'}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-mono font-bold text-slate-600 dark:text-slate-300">
                      {inv.inviteCode}
                    </td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(inv.inviteCode);
                            setCopiedCodeId(inv.id);
                            setTimeout(() => setCopiedCodeId(null), 2000);
                          }}
                          className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                          title="Copy Token Code"
                        >
                          {copiedCodeId === inv.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                        {inv.status !== 'expired' && (
                          <button
                            onClick={() => onRevokeInvite(inv.inviteCode)}
                            className="px-2.5 py-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 rounded-lg hover:bg-amber-100 transition-all cursor-pointer"
                          >
                            Revoke
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteInvite(inv.inviteCode)}
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-all cursor-pointer"
                          title="Delete Invitation"
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

      {/* Invitation Dispatch Modal */}
      {inviteModalData?.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-6 text-left">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-indigo-600" />
                Partner Token Issued
              </h3>
              <button onClick={onCloseInviteModal} className="p-2 text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>

            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-2xl text-xs space-y-1">
              <div className="font-bold text-indigo-900 dark:text-indigo-200">Token Issued for {inviteModalData.email}</div>
              <div className="text-[11px] text-indigo-700 dark:text-indigo-400">Firm: {inviteModalData.targetFirmName} • Code: <span className="font-mono font-bold">{inviteModalData.inviteCode}</span></div>
            </div>

            <div className="space-y-3 text-xs font-semibold">
              <label className="block text-slate-400 font-bold uppercase tracking-wider text-[10px]">Send Direct Invite Link</label>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={getInviteDetails(inviteModalData).joinUrl}
                  className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-[11px]"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(getInviteDetails(inviteModalData).joinUrl);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center gap-1 cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  onClick={() => handleLaunchMailApp(getInviteDetails(inviteModalData).mailtoLink)}
                  className="px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-xl font-extrabold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Launch Default Mail App</span>
                </button>

                <a
                  href={getInviteDetails(inviteModalData).gmailUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-extrabold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Gmail</span>
                </a>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(getInviteDetails(inviteModalData).body);
                    setCopiedEmailDraft(true);
                    setTimeout(() => setCopiedEmailDraft(false), 2000);
                  }}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedEmailDraft ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedEmailDraft ? 'Copied Draft' : 'Copy Text Draft'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
