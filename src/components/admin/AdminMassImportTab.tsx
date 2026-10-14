import { useState, useMemo, ChangeEvent, FormEvent } from 'react';
import { motion } from 'motion/react';
import { 
  Upload, FileText, Sparkles, Check, Copy, ExternalLink, 
  Users, Mail, Building, ShieldCheck, Download, Trash2, Search, Filter, AlertCircle, Plus
} from 'lucide-react';
import { 
  parseOutreachCsv, 
  ParsedOutreachContact, 
  OutreachClassification, 
  generateOutreachTemplates, 
  exportContactsToCsv 
} from '../../utils/massOutreachParser';
import { MASTER_CONTACT_ROSTER } from '../../data/masterContactRoster';

interface AdminMassImportTabProps {
  onBatchIssueInvitations: (contacts: ParsedOutreachContact[]) => Promise<number>;
  onBatchSyncRecruiterLeads: (contacts: ParsedOutreachContact[]) => Promise<number>;
  onBatchConvertRequests: (contacts: ParsedOutreachContact[]) => Promise<number>;
  isProcessing: boolean;
  showStatus: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export function AdminMassImportTab({
  onBatchIssueInvitations,
  onBatchSyncRecruiterLeads,
  onBatchConvertRequests,
  isProcessing,
  showStatus
}: AdminMassImportTabProps) {
  const [pastedText, setPastedText] = useState('');
  const [contacts, setContacts] = useState<ParsedOutreachContact[]>(MASTER_CONTACT_ROSTER);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState<OutreachClassification | 'all'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Single contact email outreach modal
  const [outreachModalContact, setOutreachModalContact] = useState<ParsedOutreachContact | null>(null);
  const [copiedDraft, setCopiedDraft] = useState(false);

  // Manual entry modal state
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualFirstName, setManualFirstName] = useState('');
  const [manualLastName, setManualLastName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualCompany, setManualCompany] = useState('');
  const [manualPosition, setManualPosition] = useState('');
  const [manualClassification, setManualClassification] = useState<OutreachClassification>('recruiter_lead');
  const [manualRelationship, setManualRelationship] = useState('Recruiter');
  const [manualLinkedIn, setManualLinkedIn] = useState('');

  // Manual Add Handler
  const handleManualAddContact = (e: FormEvent) => {
    e.preventDefault();
    if (!manualFirstName && !manualLastName && !manualEmail && !manualCompany) {
      showStatus('Please provide at least a name, email, or company for manual entry.', 'error');
      return;
    }
    const fullName = [manualFirstName, manualLastName].filter(Boolean).join(' ') || manualCompany || 'Manual Contact';
    const id = manualEmail ? manualEmail.toLowerCase().replace(/[^a-z0-9]/g, '_') : `manual_${Math.random().toString(36).substring(2, 9)}`;

    const newContact: ParsedOutreachContact = {
      id,
      firstName: manualFirstName,
      lastName: manualLastName,
      fullName,
      email: manualEmail,
      phone: manualPhone,
      company: manualCompany,
      position: manualPosition,
      linkedInUrl: manualLinkedIn,
      relationship: manualRelationship,
      classification: manualClassification,
      source: 'generic_csv'
    };

    setContacts([newContact, ...contacts]);
    setSelectedIds(new Set([newContact.id]));
    setIsManualModalOpen(false);
    setManualFirstName('');
    setManualLastName('');
    setManualEmail('');
    setManualPhone('');
    setManualCompany('');
    setManualPosition('');
    setManualLinkedIn('');
    showStatus(`Successfully added ${fullName} to roster!`, 'success');
  };

  // File Upload Handler
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        const parsed = parseOutreachCsv(content);
        if (parsed.length > 0) {
          setContacts(parsed);
          setSelectedIds(new Set());
          showStatus(`Successfully parsed ${parsed.length} contacts from ${file.name}!`, 'success');
        } else {
          showStatus('Could not parse any valid contacts from the uploaded file.', 'error');
        }
      }
    };
    reader.readAsText(file);
  };

  // Text Ingestion Handler
  const handleIngestPastedText = () => {
    if (!pastedText.trim()) return;
    const parsed = parseOutreachCsv(pastedText);
    if (parsed.length > 0) {
      setContacts(parsed);
      setSelectedIds(new Set());
      setPastedText('');
      showStatus(`Successfully parsed ${parsed.length} contacts from raw CSV text!`, 'success');
    } else {
      showStatus('No valid contacts detected in pasted text. Verify CSV headers.', 'error');
    }
  };

  // Load Master Roster
  const handleLoadMasterRoster = () => {
    setContacts(MASTER_CONTACT_ROSTER);
    setSelectedIds(new Set());
    showStatus(`Loaded Chris's Master Verified Network Roster (${MASTER_CONTACT_ROSTER.length} records)!`, 'success');
  };

  // Filtered contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter(c => {
      const matchesSearch = !searchQuery || 
        c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesClass = filterClass === 'all' || c.classification === filterClass;
      return matchesSearch && matchesClass;
    });
  }, [contacts, searchQuery, filterClass]);

  // Checkbox helpers
  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectAllFiltered = () => {
    const next = new Set(selectedIds);
    filteredContacts.forEach(c => next.add(c.id));
    setSelectedIds(next);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const selectedContacts = useMemo(() => {
    return contacts.filter(c => selectedIds.has(c.id));
  }, [contacts, selectedIds]);

  // Batch actions
  const handleBatchInvites = async () => {
    if (selectedContacts.length === 0) {
      showStatus('Please select at least one contact to issue partner tokens.', 'error');
      return;
    }
    const count = await onBatchIssueInvitations(selectedContacts);
    showStatus(`Issued ${count} partner invitations!`, 'success');
  };

  const handleBatchLeads = async () => {
    if (selectedContacts.length === 0) {
      showStatus('Please select at least one contact to sync to Recruiter Leads.', 'error');
      return;
    }
    const count = await onBatchSyncRecruiterLeads(selectedContacts);
    showStatus(`Synced ${count} contacts to Recruiter Leads!`, 'success');
  };

  const handleBatchRequests = async () => {
    if (selectedContacts.length === 0) {
      showStatus('Please select at least one contact to convert into Access Requests.', 'error');
      return;
    }
    const count = await onBatchConvertRequests(selectedContacts);
    showStatus(`Created ${count} Inbound Access Requests!`, 'success');
  };

  const handleExportCsv = () => {
    const target = selectedContacts.length > 0 ? selectedContacts : filteredContacts;
    const csvContent = exportContactsToCsv(target);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ascend_outreach_campaign_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showStatus(`Exported ${target.length} contacts to CSV.`, 'info');
  };

  const activeModalTemplate = outreachModalContact 
    ? generateOutreachTemplates(outreachModalContact, outreachModalContact.classification === 'staffing_partner' ? 'partner_invite' : 'recruiter_lead')
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 text-left"
    >
      {/* Hero Header & Telemetry Card */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-600" />
              Mass Network Ingestion & Outreach Hub
            </h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
              Direct ingestion for LinkedIn connection exports, Apple/Google contacts, and staffing agency rosters.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsManualModalOpen(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Manual Entry / Quick Add</span>
            </button>
            <button
              onClick={handleLoadMasterRoster}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>Load Chris's Roster ({MASTER_CONTACT_ROSTER.length})</span>
            </button>
            <label className="px-4 py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>Upload CSV File</span>
              <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Telemetry Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Contacts</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{contacts.length}</div>
          </div>
          <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Staffing Partners</span>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
              {contacts.filter(c => c.classification === 'staffing_partner').length}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Recruiter Leads</span>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {contacts.filter(c => c.classification === 'recruiter_lead').length}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">With Email / Phone</span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {contacts.filter(c => c.email || c.phone).length}
            </div>
          </div>
        </div>

        {/* Optional Collapsible Paste Box */}
        <div className="pt-2">
          <details className="text-xs text-slate-500">
            <summary className="font-bold cursor-pointer hover:text-indigo-600 select-none">
              Paste raw CSV or TSV text directly...
            </summary>
            <div className="mt-3 space-y-3">
              <textarea
                value={pastedText}
                onChange={e => setPastedText(e.target.value)}
                placeholder="Paste CSV rows here (e.g. First Name, Last Name, Company, Position, Email...)"
                rows={3}
                className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleIngestPastedText}
                className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-bold uppercase tracking-wider text-[11px] cursor-pointer"
              >
                Parse Pasted Text
              </button>
            </div>
          </details>
        </div>
      </div>

      {/* Filter and Batch Action Bar */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Filter by name, company, role..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl text-[11px] font-bold">
              {(['all', 'staffing_partner', 'recruiter_lead', 'employer_lead'] as const).map(cls => (
                <button
                  key={cls}
                  onClick={() => setFilterClass(cls)}
                  className={`px-3 py-1 rounded-lg transition-colors capitalize cursor-pointer ${
                    filterClass === cls 
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs' 
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {cls.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={selectAllFiltered}
              className="px-3 py-2 text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer"
            >
              Select All ({filteredContacts.length})
            </button>
            {selectedIds.size > 0 && (
              <button
                onClick={clearSelection}
                className="px-3 py-2 text-[11px] font-black uppercase tracking-wider text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-xl cursor-pointer"
              >
                Clear ({selectedIds.size})
              </button>
            )}
            <button
              onClick={handleExportCsv}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
              title="Download selected or filtered contacts as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Quick Batch Sync Actions without requiring manual checkbox selection */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>1-Click Sync for All Loaded Records ({contacts.length} Contacts):</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={async () => {
                const leads = contacts.filter(c => c.classification === 'recruiter_lead' || c.classification === 'staffing_partner');
                if (leads.length === 0) return;
                const count = await onBatchSyncRecruiterLeads(leads);
                showStatus(`Synced all ${count} recruiter contacts to Recruiter Leads tab!`, 'success');
              }}
              disabled={isProcessing}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Sync All Leads ({contacts.filter(c => c.classification === 'recruiter_lead' || c.classification === 'staffing_partner').length})</span>
            </button>
            <button
              onClick={async () => {
                const partners = contacts.filter(c => c.classification === 'staffing_partner');
                if (partners.length === 0) return;
                const count = await onBatchIssueInvitations(partners);
                showStatus(`Issued partner invitation tokens for all ${count} staffing partners!`, 'success');
              }}
              disabled={isProcessing}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Issue All Tokens ({contacts.filter(c => c.classification === 'staffing_partner').length})</span>
            </button>
          </div>
        </div>

        {/* Batch Operations Bar */}
        {selectedIds.size > 0 && (
          <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 rounded-2xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2 text-xs font-black text-indigo-900 dark:text-indigo-200">
              <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px]">{selectedIds.size}</span>
              <span>Contacts Selected for Batch Execution</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleBatchInvites}
                disabled={isProcessing}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Issue Partner Tokens</span>
              </button>

              <button
                onClick={handleBatchLeads}
                disabled={isProcessing}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Sync to Recruiter Leads</span>
              </button>

              <button
                onClick={handleBatchRequests}
                disabled={isProcessing}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <Building className="w-3.5 h-3.5" />
                <span>Queue Access Requests</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Roster Table */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white dark:bg-slate-900 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800 z-10">
              <tr>
                <th className="px-6 py-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={filteredContacts.length > 0 && filteredContacts.every(c => selectedIds.has(c.id))}
                    onChange={(e) => e.target.checked ? selectAllFiltered() : clearSelection()}
                    className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-4">Contact & Company</th>
                <th className="px-4 py-4">Title / Role</th>
                <th className="px-4 py-4">Classification</th>
                <th className="px-4 py-4">Contact Info</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50 text-xs">
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-16 text-center text-slate-400 italic">
                    No contacts matching current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredContacts.map(c => {
                  const isSelected = selectedIds.has(c.id);
                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors ${
                        isSelected ? 'bg-indigo-50/30 dark:bg-indigo-950/20' : ''
                      }`}
                    >
                      <td className="px-6 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(c.id)}
                          className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                        />
                      </td>

                      <td className="px-4 py-4">
                        <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{c.fullName}</span>
                          {c.linkedInUrl && (
                            <a
                              href={c.linkedInUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-400 hover:text-indigo-600 transition-colors"
                              title="Open LinkedIn"
                            >
                              <ExternalLink className="w-3 h-3 inline" />
                            </a>
                          )}
                        </div>
                        <div className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                          {c.company || 'Independent'}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-slate-700 dark:text-slate-300 font-medium">
                        {c.position || 'Professional Contact'}
                      </td>

                      <td className="px-4 py-4">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          c.classification === 'staffing_partner'
                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                            : c.classification === 'recruiter_lead'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            : c.classification === 'employer_lead'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {c.classification.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        {c.email ? (
                          <a href={`mailto:${c.email}`} className="font-bold text-slate-800 dark:text-slate-200 hover:underline block">
                            {c.email}
                          </a>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic block">No Email</span>
                        )}
                        {c.phone && (
                          <span className="text-[10px] text-slate-400 block mt-0.5">{c.phone}</span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={async () => {
                              await onBatchSyncRecruiterLeads([c]);
                              showStatus(`Synced ${c.fullName} to Recruiter Leads!`, 'success');
                            }}
                            className="px-2.5 py-1.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-1"
                            title="Sync contact into Recruiter Leads tab"
                          >
                            <Mail className="w-3 h-3 text-amber-600" />
                            <span>Sync Lead</span>
                          </button>
                          <button
                            onClick={() => setOutreachModalContact(c)}
                            className="px-2.5 py-1.5 bg-slate-900 dark:bg-slate-100 hover:bg-indigo-600 dark:hover:bg-indigo-500 text-white dark:text-slate-900 hover:text-white dark:hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            <Mail className="w-3 h-3" />
                            <span>Outreach</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Outreach Email Modal */}
      {outreachModalContact && activeModalTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] w-full max-w-xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white">
                  Direct Outreach: {outreachModalContact.fullName}
                </h4>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">
                  {outreachModalContact.position} at {outreachModalContact.company}
                </p>
              </div>
              <button
                onClick={() => setOutreachModalContact(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Subject</span>
                <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {activeModalTemplate.subject}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Message Body</span>
                <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {activeModalTemplate.body}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${activeModalTemplate.subject}\n\n${activeModalTemplate.body}`);
                  setCopiedDraft(true);
                  setTimeout(() => setCopiedDraft(false), 2000);
                }}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                {copiedDraft ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedDraft ? 'Copied' : 'Copy Full Draft'}</span>
              </button>

              <div className="flex items-center gap-2">
                <a
                  href={activeModalTemplate.gmailUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
                >
                  Gmail
                </a>
                <a
                  href={activeModalTemplate.outlookUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
                >
                  Outlook
                </a>
                <a
                  href={activeModalTemplate.mailtoLink}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
                >
                  Mail App
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Manual Entry Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] w-full max-w-xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-indigo-600" />
                  Manual Contact Entry & Triage
                </h4>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                  Add a recruiter, staffing partner, or employer lead directly into the triage pool.
                </p>
              </div>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleManualAddContact} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">First Name</label>
                  <input
                    type="text"
                    value={manualFirstName}
                    onChange={e => setManualFirstName(e.target.value)}
                    placeholder="e.g. Sarah"
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={manualLastName}
                    onChange={e => setManualLastName(e.target.value)}
                    placeholder="e.g. Jenkins"
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={manualEmail}
                    onChange={e => setManualEmail(e.target.value)}
                    placeholder="sarah@agency.com"
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={manualPhone}
                    onChange={e => setManualPhone(e.target.value)}
                    placeholder="+1-555-0199"
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Company / Agency Name</label>
                  <input
                    type="text"
                    value={manualCompany}
                    onChange={e => setManualCompany(e.target.value)}
                    placeholder="e.g. Tekfortune Inc"
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Position / Title</label>
                  <input
                    type="text"
                    value={manualPosition}
                    onChange={e => setManualPosition(e.target.value)}
                    placeholder="e.g. Technical Recruiter"
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Classification Type</label>
                  <select
                    value={manualClassification}
                    onChange={e => setManualClassification(e.target.value as OutreachClassification)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="staffing_partner">Staffing Partner / Agency</option>
                    <option value="recruiter_lead">Recruiter Lead</option>
                    <option value="employer_lead">Employer / Corporate Lead</option>
                    <option value="general_contact">General Professional Contact</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Relationship / Source</label>
                  <input
                    type="text"
                    value={manualRelationship}
                    onChange={e => setManualRelationship(e.target.value)}
                    placeholder="e.g. LinkedIn / Direct Outreach"
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">LinkedIn Profile URL</label>
                <input
                  type="url"
                  value={manualLinkedIn}
                  onChange={e => setManualLinkedIn(e.target.value)}
                  placeholder="https://www.linkedin.com/in/sarah-jenkins"
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer"
                >
                  Save & Add to Roster
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}
