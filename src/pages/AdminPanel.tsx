import { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, setDoc, serverTimestamp, collectionGroup } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../hooks/useAuth';
import { ShieldAlert, Database, Plus, Building, Mail, Terminal, Sparkles, Flag } from 'lucide-react';

import { sampleJobSets, companiesDetails } from '../components/admin/adminMockData';
import { AdminHeaderStats } from '../components/admin/AdminHeaderStats';
import { AdminDataSeedingTab } from '../components/admin/AdminDataSeedingTab';
import { AdminInvitationsTab } from '../components/admin/AdminInvitationsTab';
import { AdminPartnerRequestsTab } from '../components/admin/AdminPartnerRequestsTab';
import { AdminRecruiterLeadsTab } from '../components/admin/AdminRecruiterLeadsTab';
import { AdminMassImportTab } from '../components/admin/AdminMassImportTab';
import { AdminSecurityTab } from '../components/admin/AdminSecurityTab';
import { AdminJobModerationTab } from '../components/admin/AdminJobModerationTab';
import { AdminConfirmationModal } from '../components/admin/AdminConfirmationModal';
import { ParsedOutreachContact, MAX_IMPORT_ROWS } from '../utils/massOutreachParser';
import { sanitizeFirestorePayload } from '../utils/firestoreSanitizer';
import { MASTER_CONTACT_ROSTER } from '../data/masterContactRoster';
import { Job, JobReport } from '../types';

export default function AdminPanel() {
  const { user } = useAuth();
  const isAdmin = user?.email === 'Chris.Barnes.2000@me.com' || user?.uid === '393uzPXnOdPW3CE3rdhmDMEldzm1';

  const [adminMode, setAdminMode] = useState<'simulation' | 'invitations' | 'requests' | 'leads' | 'moderation' | 'security' | 'mass-import'>('simulation');
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [stats, setStats] = useState({ jobsCount: 0, appsCount: 0, usersCount: 0, companiesCount: 0 });

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, message: '', onConfirm: () => {} });

  // Partner Invitation State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFirmName, setInviteFirmName] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'recruiter' | 'owner'>('recruiter');
  const [isInviting, setIsInviting] = useState(false);
  const [selectedJobSet, setSelectedJobSet] = useState(sampleJobSets[0].id);

  const [activeInvitations, setActiveInvitations] = useState<any[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);

  const [activeRequests, setActiveRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const [activeLeads, setActiveLeads] = useState<any[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);

  // Job Quality Moderation & Reports State
  const [activeJobReports, setActiveJobReports] = useState<JobReport[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  const [inviteModalData, setInviteModalData] = useState<{
    isOpen: boolean;
    email: string;
    targetFirmName: string;
    role: string;
    inviteCode: string;
  } | null>(null);

  const showStatus = (text: string, type: 'success' | 'error' | 'info') => {
    setStatus({ text, type });
    setTimeout(() => setStatus(null), 5000);
  };

  // Fetch Telemetry Stats
  const fetchStats = async () => {
    try {
      const [jobsSnap, appsSnap, usersSnap, compSnap] = await Promise.all([
        getDocs(collection(db, 'jobs')),
        getDocs(collection(db, 'applications')),
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'companies'))
      ]);
      setStats({
        jobsCount: jobsSnap.size,
        appsCount: appsSnap.size,
        usersCount: usersSnap.size,
        companiesCount: compSnap.size
      });
    } catch (err) {
      console.error("Failed to fetch stats", err);
    }
  };

  const fetchInvitations = async () => {
    setLoadingInvites(true);
    try {
      const snap = await getDocs(collection(db, 'staffing_invitations'));
      setActiveInvitations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Failed to fetch invitations", err);
    } fontally: () => {
      setLoadingInvites(false);
    }
  };

  const fetchRequests = async () => {
    setLoadingRequests(true);
    try {
      const snap = await getDocs(collection(db, 'partner_requests'));
      setActiveRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Failed to fetch requests", err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const fetchLeads = async () => {
    setLoadingLeads(true);
    try {
      const snap = await getDocs(collection(db, 'recruiter_leads'));
      const directLeadsMap = new Map<string, any>();
      snap.docs.forEach(d => {
        directLeadsMap.set(d.id, { id: d.id, ...d.data() });
      });

      try {
        const jobsSnap = await getDocs(collection(db, 'jobs'));
        const ingestedJobsSnap = await getDocs(collectionGroup(db, 'ingestedJobs'));
        const allJobDocs = [...jobsSnap.docs, ...ingestedJobsSnap.docs];

        for (const jDoc of allJobDocs) {
          const jData = jDoc.data();
          const recInfo = jData.recruiterInfo;
          const recEmail = recInfo?.email || jData.posterEmail;

          if (recInfo || recEmail || jData.posterFirmName) {
            const emailClean = (recEmail || '').toLowerCase().trim();
            const leadId = emailClean ? emailClean.replace(/[^a-z0-9]/g, '_') : `lead_${jDoc.id}`;

            if (!directLeadsMap.has(leadId) && (recInfo?.name || recEmail || recInfo?.firmName || jData.posterFirmName)) {
              const newLeadPayload = {
                recruiterName: recInfo?.name || recInfo?.firmName || jData.posterFirmName || 'Discovered Recruiter',
                recruiterEmail: emailClean || 'recruiter@agency.com',
                recruiterPhone: recInfo?.phone || null,
                firmName: recInfo?.firmName || jData.companyName || jData.posterFirmName || 'Staffing Firm',
                clientName: recInfo?.clientName || null,
                sourceBoard: jData.sourceBoard || 'Dice Recruiter Email',
                jobTitle: jData.title || 'Sourced Position',
                discoveredByEmail: jData.candidateIngestedBy || 'System Import',
                status: 'discovered',
                createdAt: serverTimestamp(),
                lastDiscoveredAt: serverTimestamp()
              };

              const cleanPayload = Object.fromEntries(
                Object.entries(newLeadPayload).filter(([_, v]) => v !== undefined && v !== null)
              );

              directLeadsMap.set(leadId, { id: leadId, ...cleanPayload });
              setDoc(doc(db, 'recruiter_leads', leadId), cleanPayload, { merge: true }).catch(() => {});
            }
          }
        }
      } catch (syncErr) {
        console.warn("Recruiter lead auto-discovery warning:", syncErr);
      }

      setActiveLeads(Array.from(directLeadsMap.values()));
    } catch (err) {
      console.error("Failed to fetch recruiter leads", err);
    } finally {
      setLoadingLeads(false);
    }
  };

  const fetchJobReports = async () => {
    setLoadingReports(true);
    try {
      const snap = await getDocs(collection(db, 'job_reports'));
      setActiveJobReports(snap.docs.map(d => ({ id: d.id, ...d.data() } as JobReport)));
    } catch (err) {
      console.warn("Failed to fetch job reports:", err);
    } finally {
      setLoadingReports(false);
    }
  };

  const fetchJobs = async () => {
    try {
      const snap = await getDocs(collection(db, 'jobs'));
      setAllJobs(snap.docs.map(d => ({ id: d.id, ...d.data() } as Job)));
    } catch (err) {
      console.warn("Failed to fetch jobs:", err);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchInvitations();
    fetchRequests();
    fetchLeads();
    fetchJobReports();
    fetchJobs();
  }, [adminMode]);

  const handleSyncCompanies = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    showStatus('Starting deep sync of company profiles across all user nodes...', 'info');
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      let syncedCount = 0;
      
      for (const userDoc of usersSnap.docs) {
        const directSnap = await getDocs(collection(db, `users/${userDoc.id}/profiles`));
        for (const pDoc of directSnap.docs) {
          const data = pDoc.data();
          if (data.companyName) {
            const publicRef = doc(db, 'companies', userDoc.id);
            await setDoc(publicRef, {
              name: data.companyName,
              industry: data.industry || 'Uncategorized',
              size: data.size || 'Unknown',
              description: data.description || '',
              website: data.website || '',
              ownerUserId: userDoc.id,
              updatedAt: serverTimestamp()
            }, { merge: true });
            syncedCount++;
          }
        }
      }
      showStatus(`Sync complete! Successfully mirrored ${syncedCount} company profiles.`, 'success');
      fetchStats();
    } catch (err: any) {
      showStatus(`Sync failed: ${err.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkSeedTalentAndCompanies = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    showStatus('Sampling and injecting diverse candidates, recruiters, and companies...', 'info');
    try {
      const sampleCandidates = [
        {
          uid: 'sample-candidate-1',
          profile: {
            personalInfo: { firstName: 'Elena', lastName: 'Vance', email: 'elena.vance@example.com', phone: '+1-555-0192', location: 'San Francisco, CA' },
            targetRole: 'Senior UX/UI Designer',
            skills: [{ name: 'Figma' }, { name: 'UX Research' }, { name: 'Design Systems' }],
            experienceYears: 5,
            privacy: { searchable: true, privacyLevel: 1 },
            resumeText: "ELENA VANCE - Senior UX/UI Designer. 5 years experience at CreativePulse. Expert in Figma and Design Systems."
          }
        },
        {
          uid: 'sample-candidate-2',
          profile: {
            personalInfo: { firstName: 'Marcus', lastName: 'Chen', email: 'marcus.chen@example.com', phone: '+1-555-0144', location: 'New York, NY' },
            targetRole: 'Financial Analyst',
            skills: [{ name: 'Financial Modeling' }, { name: 'Excel' }, { name: 'Valuation' }],
            experienceYears: 3,
            privacy: { searchable: true, privacyLevel: 1 },
            resumeText: "MARCUS CHEN - Financial Analyst. specialized in DCF models and portfolio management."
          }
        }
      ];

      for (const cand of sampleCandidates) {
        await setDoc(doc(db, `users/${cand.uid}/profiles/main`), {
          ...cand.profile,
          updatedAt: serverTimestamp()
        });
      }

      for (const set of sampleJobSets) {
        for (const job of set.jobs) {
          const id = job.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 7);
          await setDoc(doc(db, 'jobs', id), {
            ...job,
            createdAt: serverTimestamp()
          });

          const compId = job.companyId;
          const compInfo = companiesDetails[compId] || {
            name: job.companyName,
            industry: 'General',
            size: '51-200',
            description: 'A thriving organization partnering with Ascend.'
          };
          await setDoc(doc(db, 'companies', compId), {
            ownerUserId: 'system-seed',
            name: compInfo.name,
            industry: compInfo.industry,
            size: compInfo.size,
            description: compInfo.description,
            updatedAt: serverTimestamp()
          }, { merge: true });
        }
      }

      showStatus(`Successfully injected ${sampleCandidates.length} candidates and ${sampleJobSets.length} job sets!`, 'success');
      fetchStats();
    } catch (err: any) {
      showStatus('Error sampling data: ' + err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSeed = async (jobs: any[], setName: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    showStatus(`Injecting ${jobs.length} roles for ${setName}...`, 'info');
    try {
      for (const job of jobs) {
        const id = job.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 7);
        await setDoc(doc(db, 'jobs', id), {
          ...job,
          createdAt: serverTimestamp()
        });
      }
      showStatus(`Injected ${jobs.length} roles into Firestore!`, 'success');
      fetchStats();
    } catch (err: any) {
      showStatus('Error seeding data: ' + err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendInvite = async () => {
    if (!inviteEmail || !inviteFirmName) return;
    setIsInviting(true);
    try {
      const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      await setDoc(doc(db, 'staffing_invitations', inviteCode), {
        email: inviteEmail,
        targetFirmName: inviteFirmName,
        role: inviteRole,
        inviteCode,
        status: 'active',
        createdAt: serverTimestamp(),
        issuedBy: user?.email
      });

      setInviteModalData({
        isOpen: true,
        email: inviteEmail,
        targetFirmName: inviteFirmName,
        role: inviteRole,
        inviteCode
      });

      showStatus(`Invitation token generated for ${inviteEmail}!`, 'success');
      setInviteEmail('');
      setInviteFirmName('');
      fetchInvitations();
    } catch (err: any) {
      showStatus('Failed to generate invitation token: ' + err.message, 'error');
    } finally {
      setIsInviting(false);
    }
  };

  const getInviteDetails = (inv: any) => {
    const origin = window.location.origin;
    const roleUpper = (inv.role || 'owner').toUpperCase();
    const firmDisplay = inv.targetFirmName || 'Staffing Partner';
    const joinUrl = `${origin}/#signup?invite=${inv.inviteCode}&email=${encodeURIComponent(inv.email)}&role=${encodeURIComponent(inv.role || 'owner')}`;
    const subject = `Invitation to join Ascend ATS as ${roleUpper} for ${firmDisplay}`;
    const body = `Hello,\n\nYou have been invited to join the Ascend ATS platform as an authorized ${roleUpper} representing ${firmDisplay}.\n\nYour Activation Invite Code is: ${inv.inviteCode}\n\nTo accept your invitation and activate your account, open the direct link below:\n${joinUrl}\n\nBest regards,\nAscend ATS Administration`;
    const mailtoLink = `mailto:${encodeURIComponent(inv.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(inv.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const outlookUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(inv.email)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    return { joinUrl, subject, body, mailtoLink, gmailUrl, outlookUrl };
  };

  const handleLaunchMailApp = (mailtoLink: string) => {
    try {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = mailtoLink;
      document.body.appendChild(iframe);
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 2000);
    } catch {
      window.location.href = mailtoLink;
    }
  };

  const handleRevokeInvite = async (inviteCode: string) => {
    try {
      await setDoc(doc(db, 'staffing_invitations', inviteCode), { status: 'expired' }, { merge: true });
      showStatus(`Invitation ${inviteCode} revoked.`, 'info');
      fetchInvitations();
    } catch (err: any) {
      showStatus('Failed to revoke: ' + err.message, 'error');
    }
  };

  const handleDeleteInvite = async (inviteCode: string) => {
    try {
      await deleteDoc(doc(db, 'staffing_invitations', inviteCode));
      showStatus(`Invitation ${inviteCode} deleted.`, 'info');
      fetchInvitations();
    } catch (err: any) {
      showStatus('Failed to delete: ' + err.message, 'error');
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    try {
      await deleteDoc(doc(db, 'partner_requests', requestId));
      showStatus(`Request ${requestId} deleted.`, 'info');
      fetchRequests();
    } catch (err: any) {
      showStatus('Failed to delete request: ' + err.message, 'error');
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    try {
      await deleteDoc(doc(db, 'recruiter_leads', leadId));
      showStatus(`Lead removed from pipeline.`, 'info');
      fetchLeads();
    } catch (err: any) {
      showStatus('Failed to delete lead: ' + err.message, 'error');
    }
  };

  const handleInviteLead = (lead: any) => {
    setInviteEmail(lead.recruiterEmail || '');
    setInviteFirmName(lead.firmName || lead.recruiterName || 'Staffing Firm');
    setInviteRole('recruiter');
    setAdminMode('invitations');
    showStatus(`Pre-populated partner invitation for ${lead.recruiterName} (${lead.recruiterEmail}). Click "Issue Token & Prepare Email" to finalize.`, 'info');
  };

  const handleBatchIssueInvitations = async (contacts: ParsedOutreachContact[]): Promise<number> => {
    setIsProcessing(true);
    let count = 0;
    try {
      for (let i = 0; i < contacts.length && i < MAX_IMPORT_ROWS; i++) {
        const c = contacts[i];
        const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
        await setDoc(doc(db, 'staffing_invitations', inviteCode), {
          email: c.email || '',
          targetFirmName: c.company || c.fullName || 'Strategic Staffing Partner',
          role: c.classification === 'staffing_partner' ? 'recruiter' : 'recruiter',
          inviteCode,
          status: 'active',
          createdAt: serverTimestamp(),
          issuedBy: user?.email,
          contactName: c.fullName,
          contactPhone: c.phone || '',
          linkedInUrl: c.linkedInUrl || ''
        });
        count++;
      }
      fetchInvitations();
      fetchStats();
      return count;
    } catch (err: any) {
      showStatus('Batch token generation error: ' + err.message, 'error');
      return count;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchSyncRecruiterLeads = async (contacts: ParsedOutreachContact[]): Promise<number> => {
    setIsProcessing(true);
    let count = 0;
    try {
      for (let i = 0; i < contacts.length && i < MAX_IMPORT_ROWS; i++) {
        const c = contacts[i];
        const rawPayload = {
          recruiterName: c.fullName || 'Discovered Recruiter',
          recruiterEmail: c.email || null,
          recruiterPhone: c.phone || null,
          firmName: c.company || 'Direct Agency',
          jobTitle: c.position || 'Recruiter / Talent Partner',
          sourceBoard: c.source === 'linkedin_export' ? 'LinkedIn Connections' : 'Network Ingestion',
          discoveredByEmail: user?.email || 'admin',
          status: 'discovered',
          linkedInUrl: c.linkedInUrl || null,
          relationship: c.relationship || null,
          createdAt: serverTimestamp()
        };
        const cleanPayload = sanitizeFirestorePayload(rawPayload);
        await setDoc(doc(db, 'recruiter_leads', c.id), cleanPayload, { merge: true });
        count++;
      }
      fetchLeads();
      fetchStats();
      return count;
    } catch (err: any) {
      showStatus('Batch sync recruiter leads error: ' + err.message, 'error');
      return count;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchConvertRequests = async (contacts: ParsedOutreachContact[]): Promise<number> => {
    setIsProcessing(true);
    let count = 0;
    try {
      for (let i = 0; i < contacts.length && i < MAX_IMPORT_ROWS; i++) {
        const c = contacts[i];
        const reqId = `req_${c.id}`;
        await setDoc(doc(db, 'partner_requests', reqId), {
          email: c.email || 'pending-email@ascend.internal',
          fullName: c.fullName,
          name: c.fullName,
          companyName: c.company || 'Enterprise Partner',
          firmName: c.company || 'Enterprise Partner',
          phone: c.phone || null,
          source: 'Network Ingestion',
          details: `Position: ${c.position || 'N/A'}. LinkedIn: ${c.linkedInUrl || 'N/A'}`,
          status: 'pending',
          createdAt: serverTimestamp()
        }, { merge: true });
        count++;
      }
      fetchRequests();
      fetchStats();
      return count;
    } catch (err: any) {
      showStatus('Batch access requests error: ' + err.message, 'error');
      return count;
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center p-4">
        <div className="p-6 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-3xl border border-rose-200 dark:border-rose-800 flex flex-col items-center gap-4 text-center">
          <ShieldAlert className="w-12 h-12" />
          <div>
            <h2 className="text-xl font-bold">Unauthorized System Access</h2>
            <p className="text-sm mt-2 opacity-80 max-w-xs mx-auto">This terminal is restricted to platform owners. Your access attempt has been logged for security audit.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900/50 pt-20 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {status && (
          <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between ${
            status.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border-emerald-200 dark:border-emerald-800' :
            status.type === 'error' ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 border-rose-200 dark:border-rose-800' :
            'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 border-indigo-200 dark:border-indigo-800'
          }`}>
            <span>{status.text}</span>
            <button onClick={() => setStatus(null)} className="text-xs opacity-60 hover:opacity-100 cursor-pointer">✕</button>
          </div>
        )}

        {/* 1. Executive Telemetry Bar */}
        <AdminHeaderStats
          stats={stats}
          isProcessing={isProcessing}
          onSyncCompanies={handleSyncCompanies}
          onSelectTab={setAdminMode}
        />

        {/* 2. Admin View Mode Selector Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
          <button
            onClick={() => setAdminMode('simulation')}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              adminMode === 'simulation'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Data Seeding Engine</span>
          </button>

          <button
            onClick={() => setAdminMode('invitations')}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              adminMode === 'invitations'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Partner Invitations ({activeInvitations.length})</span>
          </button>

          <button
            onClick={() => setAdminMode('requests')}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              adminMode === 'requests'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Access Requests ({activeRequests.length})</span>
          </button>

          <button
            onClick={() => setAdminMode('leads')}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              adminMode === 'leads'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-500/20'
                : 'bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            <Mail className="w-4 h-4 text-amber-500" />
            <span>Recruiter Leads ({activeLeads.length})</span>
          </button>

          <button
            onClick={() => setAdminMode('moderation')}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              adminMode === 'moderation'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20'
                : 'bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            <Flag className="w-4 h-4 text-rose-500" />
            <span>Job Moderation ({activeJobReports.filter(r => r.status === 'pending').length})</span>
          </button>

          <button
            onClick={() => setAdminMode('mass-import')}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              adminMode === 'mass-import'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20'
                : 'bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Mass Import & Outreach</span>
          </button>

          <button
            onClick={() => setAdminMode('security')}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              adminMode === 'security'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20'
                : 'bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Security & Audit</span>
          </button>
        </div>

        {/* 3. Subcomponent Tab Views */}
        {adminMode === 'simulation' && (
          <AdminDataSeedingTab
            isProcessing={isProcessing}
            selectedJobSet={selectedJobSet}
            onSelectJobSet={setSelectedJobSet}
            onSeedSingleSet={handleSeed}
            onBulkSeed={handleBulkSeedTalentAndCompanies}
          />
        )}

        {adminMode === 'invitations' && (
          <AdminInvitationsTab
            inviteEmail={inviteEmail}
            setInviteEmail={setInviteEmail}
            inviteFirmName={inviteFirmName}
            setInviteFirmName={setInviteFirmName}
            inviteRole={inviteRole}
            setInviteRole={setInviteRole}
            isInviting={isInviting}
            activeInvitations={activeInvitations}
            loadingInvites={loadingInvites}
            onSendInvite={handleSendInvite}
            onRevokeInvite={handleRevokeInvite}
            onDeleteInvite={handleDeleteInvite}
            inviteModalData={inviteModalData}
            onCloseInviteModal={() => setInviteModalData(null)}
            getInviteDetails={getInviteDetails}
            handleLaunchMailApp={handleLaunchMailApp}
          />
        )}

        {adminMode === 'requests' && (
          <AdminPartnerRequestsTab
            activeRequests={activeRequests}
            loadingRequests={loadingRequests}
            onDeleteRequest={handleDeleteRequest}
            onConvertRequestToInvite={(req) => {
              setInviteEmail(req.email || '');
              setInviteFirmName(req.companyName || req.firmName || 'Partner Firm');
              setInviteRole('recruiter');
              setAdminMode('invitations');
            }}
          />
        )}

        {adminMode === 'leads' && (
          <AdminRecruiterLeadsTab
            activeLeads={activeLeads}
            loadingLeads={loadingLeads}
            onSyncLeads={fetchLeads}
            onDeleteLead={handleDeleteLead}
            onInviteLead={handleInviteLead}
            onImportFromRoster={async () => {
              const count = await handleBatchSyncRecruiterLeads(MASTER_CONTACT_ROSTER);
              showStatus(`Imported ${count} verified leads from network roster!`, 'success');
            }}
          />
        )}

        {adminMode === 'mass-import' && (
          <AdminMassImportTab
            onBatchIssueInvitations={handleBatchIssueInvitations}
            onBatchSyncRecruiterLeads={handleBatchSyncRecruiterLeads}
            onBatchConvertRequests={handleBatchConvertRequests}
            isProcessing={isProcessing}
            showStatus={showStatus}
          />
        )}

        {adminMode === 'moderation' && (
          <AdminJobModerationTab
            reports={activeJobReports}
            jobs={allJobs}
            loading={loadingReports}
            onRefresh={() => {
              fetchJobReports();
              fetchJobs();
            }}
            onJobUpdated={(updatedJob) => {
              setAllJobs(prev => prev.map(j => j.id === updatedJob.id ? updatedJob : j));
              showStatus(`Updated and validated "${updatedJob.title}"!`, 'success');
            }}
            onJobDeleted={(deletedId) => {
              setAllJobs(prev => prev.filter(j => j.id !== deletedId));
              showStatus('Permanently purged bad job posting.', 'success');
            }}
            onReportDismissed={(repId) => {
              setActiveJobReports(prev => prev.filter(r => r.id !== repId));
              showStatus('Dismissed report.', 'info');
            }}
          />
        )}

        {adminMode === 'security' && (
          <AdminSecurityTab
            onOpenConfirmModal={(message, action) => {
              setConfirmModal({
                isOpen: true,
                message,
                onConfirm: action
              });
            }}
          />
        )}

        {/* Reusable Confirmation Modal */}
        <AdminConfirmationModal
          isOpen={confirmModal.isOpen}
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal({ isOpen: false, message: '', onConfirm: () => {} })}
        />
      </div>
    </div>
  );
}
