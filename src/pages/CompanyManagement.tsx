import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building, Plus, Trash2, Edit3, Check, Briefcase, MapPin, DollarSign, Sparkles, 
  AlertCircle, History, ChevronRight, Users, UserPlus, Mail, Copy, UserX, Clock, 
  ShieldCheck, ExternalLink, X, Send
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { 
  doc, getDoc, setDoc, collection, query, where, getDocs, addDoc, deleteDoc, 
  serverTimestamp, orderBy, updateDoc, arrayUnion, arrayRemove 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Job, JobStatus, CompanyClaimRequest, CompanyRecruiterInvite, CulturalValuesBlueprint } from '../types';
import { RecruiterCultureMatrix } from '../components/profile/RecruiterCultureMatrix';

interface RecruiterMember {
  uid: string;
  email: string;
  displayName?: string;
  role?: string;
  addedAt?: any;
}

export const CompanyManagement = () => {
  const { user, appUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [savingCompany, setSavingCompany] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active Tab: 'details' | 'team' | 'jobs' | 'culture'
  const [activeTab, setActiveTab] = useState<'details' | 'team' | 'jobs' | 'culture'>('details');
  const [companyBlueprint, setCompanyBlueprint] = useState<CulturalValuesBlueprint | undefined>(undefined);

  const handleSaveCompanyBlueprint = async (blueprint: CulturalValuesBlueprint) => {
    if (!companyId) return;
    try {
      await updateDoc(doc(db, 'companies', companyId), {
        culturalValuesBlueprint: blueprint,
        updatedAt: serverTimestamp()
      });
      setCompanyBlueprint(blueprint);
      setSuccessMessage('Company Culture & Recruiter Blueprint saved successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to save company blueprint:', err);
    }
  };

  // Company Profile State
  const [companyProfile, setCompanyProfile] = useState({
    companyName: '',
    industry: '',
    size: '11-50',
    description: '',
    website: '',
    location: '',
    linkedin: '',
    twitter: '',
    github: '',
    glassdoor: '',
    signupComplete: false
  });

  const [companyId, setCompanyId] = useState<string>('');
  const [companyJobs, setCompanyJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  // Recruiter Team Management State
  const [recruiters, setRecruiters] = useState<RecruiterMember[]>([]);
  const [pendingClaims, setPendingClaims] = useState<CompanyClaimRequest[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);

  // Recruiter Invite Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [generatedInviteCode, setGeneratedInviteCode] = useState<string | null>(null);
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);

  const loadCompanyData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Get claimedCompanyId or user.uid
      const profileRef = doc(db, `users/${user.uid}/profiles/company`);
      const profileSnap = await getDoc(profileRef);
      const claimedCompanyId = profileSnap.exists() ? profileSnap.data().claimedCompanyId : null;
      
      const cId = claimedCompanyId || appUser?.activeCompanyId || appUser?.companyId || user.uid;
      setCompanyId(cId);
      
      // 2. Fetch Canonical Company Profile
      const compRef = doc(db, 'companies', cId);
      const compSnap = await getDoc(compRef);
      
      const isOwnerCheck = compSnap.exists() && (compSnap.data().ownerUserId === user.uid || compSnap.data().adminEmails?.includes(user.email));
      const isAdmin = user.email === 'Chris.Barnes.2000@me.com' || user.uid === '393uzPXnOdPW3CE3rdhmDMEldzm1' || appUser?.accountType === 'admin';
      setIsOwner(isOwnerCheck || isAdmin);

      if (compSnap.exists()) {
        const data = compSnap.data();
        setCompanyProfile({
          companyName: data.name || '',
          industry: data.industry || '',
          size: data.size || '11-50',
          description: data.description || '',
          website: data.website || '',
          location: data.location || '',
          linkedin: data.linkedin || '',
          twitter: data.twitter || '',
          github: data.github || '',
          glassdoor: data.glassdoor || '',
          signupComplete: true
        });

        // Load recruiters from company recruiterUids
        const rUids: string[] = data.recruiterUids || [];
        loadTeamData(cId, rUids);
      } else {
        loadTeamData(cId, []);
      }

      // 3. Fetch Jobs for this company
      setLoadingJobs(true);
      const jobsQ = query(
        collection(db, 'jobs'), 
        where('companyId', '==', cId),
        orderBy('createdAt', 'desc')
      );
      const jobsSnap = await getDocs(jobsQ);
      const jList: Job[] = [];
      jobsSnap.forEach(d => {
        jList.push({ id: d.id, ...d.data() } as Job);
      });

      setCompanyJobs(jList);
      setLoadingJobs(false);
    } catch (err) {
      console.error("Failed to load company data", err);
      setErrorMessage("Failed to load company data.");
    } finally {
      setLoading(false);
      setLoadingJobs(false);
    }
  };

  const loadTeamData = async (cId: string, recruiterUids: string[]) => {
    setLoadingTeam(true);
    try {
      // 1. Fetch pending claims for this company
      const claimsQ = query(
        collection(db, 'company_claim_requests'),
        where('companyId', '==', cId),
        where('status', '==', 'pending')
      );
      const claimsSnap = await getDocs(claimsQ);
      setPendingClaims(claimsSnap.docs.map(d => ({ id: d.id, ...d.data() } as CompanyClaimRequest)));

      // 2. Fetch active recruiters by UIDs
      const members: RecruiterMember[] = [];
      for (const rUid of recruiterUids) {
        if (!rUid) continue;
        const uSnap = await getDoc(doc(db, 'users', rUid));
        if (uSnap.exists()) {
          const uData = uSnap.data();
          members.push({
            uid: rUid,
            email: uData.email,
            displayName: uData.displayName || uData.email?.split('@')[0],
            role: uData.companyRole || 'Recruiter',
            addedAt: uData.createdAt
          });
        }
      }
      setRecruiters(members);
    } catch (err) {
      console.error("Error loading team data:", err);
    } finally {
      setLoadingTeam(false);
    }
  };

  useEffect(() => {
    loadCompanyData();
  }, [user]);

  const handleSaveCompany = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !isOwner) return;
    setSavingCompany(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      const publicCompanyRef = doc(db, 'companies', companyId);
      
      await setDoc(publicCompanyRef, {
        ...companyProfile,
        name: companyProfile.companyName,
        ownerUserId: user.uid,
        updatedAt: serverTimestamp()
      }, { merge: true });

      setSuccessMessage("Company profile updated successfully!");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error("Error saving company profile", err);
      setErrorMessage(err.message || "Failed to update company profile.");
    } finally {
      setSavingCompany(false);
    }
  };

  // Generate Recruiter Invite Link
  const handleGenerateInvite = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !companyId) return;
    setIsGeneratingInvite(true);
    try {
      const cleanCode = `REC-${companyId.slice(0, 4).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      
      await setDoc(doc(db, 'company_recruiter_invitations', cleanCode), {
        companyId,
        companyName: companyProfile.companyName || 'My Organization',
        invitedByUid: user.uid,
        invitedByEmail: user.email,
        targetEmail: inviteEmail.trim().toLowerCase(),
        inviteCode: cleanCode,
        status: 'pending',
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      });

      const origin = window.location.origin;
      const inviteUrl = `${origin}/#signup?invite=${cleanCode}&role=recruiter&companyId=${encodeURIComponent(companyId)}&email=${encodeURIComponent(inviteEmail.trim())}`;
      
      setGeneratedInviteCode(cleanCode);
      setGeneratedInviteLink(inviteUrl);
      setCopiedLink(false);
    } catch (err: any) {
      console.error("Error generating invite:", err);
      alert(err.message || "Failed to generate recruiter invite.");
    } finally {
      setIsGeneratingInvite(false);
    }
  };

  // Approve a pending claim request
  const handleApproveClaim = async (req: CompanyClaimRequest) => {
    try {
      // 1. Update claim status
      await updateDoc(doc(db, 'company_claim_requests', req.id), {
        status: 'approved',
        updatedAt: serverTimestamp()
      });

      // 2. Link recruiter's profile to this company
      const recruiterProfileRef = doc(db, `users/${req.userId}/profiles/company`);
      await setDoc(recruiterProfileRef, {
        companyName: companyProfile.companyName,
        companyId: companyId,
        claimedCompanyId: companyId,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // 3. Update user metadata
      await updateDoc(doc(db, 'users', req.userId), {
        accountType: 'recruiter',
        companyId,
        companyName: companyProfile.companyName,
        activeCompanyId: companyId,
        activeCompanyName: companyProfile.companyName
      });

      // 4. Add recruiter to company document
      await setDoc(doc(db, 'companies', companyId), {
        recruiterUids: arrayUnion(req.userId)
      }, { merge: true });

      setSuccessMessage(`Approved ${req.userEmail} as a verified recruiter!`);
      setTimeout(() => setSuccessMessage(null), 3000);
      loadCompanyData();
    } catch (err: any) {
      console.error("Error approving claim:", err);
      alert("Failed to approve recruiter.");
    }
  };

  // Reject a claim request
  const handleRejectClaim = async (reqId: string) => {
    try {
      await updateDoc(doc(db, 'company_claim_requests', reqId), {
        status: 'rejected',
        updatedAt: serverTimestamp()
      });
      setSuccessMessage("Join request rejected.");
      setTimeout(() => setSuccessMessage(null), 3000);
      setPendingClaims(prev => prev.filter(c => c.id !== reqId));
    } catch (err) {
      console.error("Error rejecting claim:", err);
    }
  };

  // Remove / Unlink a Recruiter from Company
  const handleRemoveRecruiter = async (recruiterUid: string, recruiterEmail: string) => {
    if (!window.confirm(`Are you sure you want to remove ${recruiterEmail} from your recruiter team? They will immediately lose access to this company's pipeline and requisitions.`)) {
      return;
    }

    try {
      // 1. Remove from company doc
      await updateDoc(doc(db, 'companies', companyId), {
        recruiterUids: arrayRemove(recruiterUid)
      });

      // 2. Clear recruiter's claimed company
      await updateDoc(doc(db, `users/${recruiterUid}/profiles/company`), {
        claimedCompanyId: null,
        companyName: ''
      });

      await updateDoc(doc(db, 'users', recruiterUid), {
        activeCompanyId: null,
        activeCompanyName: null
      });

      setSuccessMessage(`Removed ${recruiterEmail} from organization.`);
      setTimeout(() => setSuccessMessage(null), 3000);
      setRecruiters(prev => prev.filter(r => r.uid !== recruiterUid));
    } catch (err: any) {
      console.error("Error removing recruiter:", err);
      alert("Failed to remove recruiter.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 w-full md:w-[75vw] max-w-none mx-auto flex items-center justify-center text-slate-400">
        Loading company management dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 w-full md:w-[75vw] max-w-none mx-auto">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Building className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            Company Profile Editor
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Manage your organization's public profile details. Core identity fields are locked post-signup.
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-2xl flex items-center gap-3 text-sm">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-2xl flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-8 gap-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('details')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'details'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Building className="w-4 h-4" /> Company Details
        </button>

        <button
          onClick={() => setActiveTab('team')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap relative ${
            activeTab === 'team'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Users className="w-4 h-4" /> Recruiter Team ({recruiters.length})
          {pendingClaims.length > 0 && (
            <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
              {pendingClaims.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('jobs')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'jobs'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Briefcase className="w-4 h-4" /> Job Requisitions ({companyJobs.length})
        </button>

        <button
          onClick={() => setActiveTab('culture')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'culture'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Sparkles className="w-4 h-4 text-indigo-500" /> Culture & Recruiter Blueprint
        </button>
      </div>

      {activeTab === 'culture' && (
        <RecruiterCultureMatrix
          role="companyOwner"
          blueprint={companyBlueprint}
          onSaveBlueprint={handleSaveCompanyBlueprint}
        />
      )}

      {activeTab === 'details' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-indigo-500" /> Company Profile Details
          </h2>

          <form onSubmit={handleSaveCompany} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Company Name</label>
                <input
                  type="text"
                  required
                  disabled={!isOwner}
                  value={companyProfile.companyName}
                  onChange={e => setCompanyProfile({...companyProfile, companyName: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  placeholder="e.g. Acme Corp"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Industry Sector</label>
                <input
                  type="text"
                  required
                  disabled={!isOwner}
                  value={companyProfile.industry}
                  onChange={e => setCompanyProfile({...companyProfile, industry: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  placeholder="e.g. SaaS, Fintech, Healthcare"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Company Size</label>
                <select
                  disabled={!isOwner}
                  value={companyProfile.size}
                  onChange={e => setCompanyProfile({...companyProfile, size: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  <option>1-10</option>
                  <option>11-50</option>
                  <option>51-200</option>
                  <option>201-500</option>
                  <option>500+</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-2">Website URL</label>
                <input
                  type="url"
                  disabled={!isOwner}
                  value={companyProfile.website}
                  onChange={e => setCompanyProfile({...companyProfile, website: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  placeholder="https://example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Headquarters / Location</label>
              <input
                type="text"
                disabled={!isOwner}
                value={companyProfile.location}
                onChange={e => setCompanyProfile({...companyProfile, location: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                placeholder="e.g. San Francisco, CA or Remote"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">About / Company Description</label>
              <textarea
                rows={4}
                disabled={!isOwner}
                value={companyProfile.description}
                onChange={e => setCompanyProfile({...companyProfile, description: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                placeholder="Describe your company mission, culture, and tech stack..."
              />
            </div>

            {/* Social Media & Web Presence Form Group */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                Social Profiles & Direct Web Channels
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-slate-600 dark:text-slate-300">LinkedIn Profile URL</label>
                  <input
                    type="url"
                    value={companyProfile.linkedin}
                    onChange={e => setCompanyProfile({...companyProfile, linkedin: e.target.value})}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-indigo-500"
                    placeholder="https://linkedin.com/company/your-company"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-slate-600 dark:text-slate-300">Twitter / X Handle or URL</label>
                  <input
                    type="text"
                    value={companyProfile.twitter}
                    onChange={e => setCompanyProfile({...companyProfile, twitter: e.target.value})}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-indigo-500"
                    placeholder="https://x.com/your-company or @your-company"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-slate-600 dark:text-slate-300">GitHub Organization</label>
                  <input
                    type="url"
                    value={companyProfile.github}
                    onChange={e => setCompanyProfile({...companyProfile, github: e.target.value})}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-indigo-500"
                    placeholder="https://github.com/your-org"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-slate-600 dark:text-slate-300">Glassdoor Review Page</label>
                  <input
                    type="url"
                    value={companyProfile.glassdoor}
                    onChange={e => setCompanyProfile({...companyProfile, glassdoor: e.target.value})}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-indigo-500"
                    placeholder="https://glassdoor.com/Reviews/..."
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingCompany || !isOwner}
                className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-3.5 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-lg disabled:opacity-50"
              >
                {savingCompany ? 'Saving Changes...' : 'Save Company Details'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Recruiter Team & Access Management Tab */}
      {activeTab === 'team' && (
        <div className="space-y-8">
          {/* Header Action Card */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 md:p-8 rounded-3xl border border-indigo-900/50 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest block mb-1">
                Recruiter Access Governance
              </span>
              <h2 className="text-2xl font-bold">Authorized Recruiting Team</h2>
              <p className="text-xs text-slate-300 max-w-xl mt-1 leading-relaxed">
                Recruiters linked to {companyProfile.companyName || 'your organization'} can source talent, review incoming candidate pipelines, and publish requisitions under your brand.
              </p>
            </div>
            <button
              onClick={() => {
                setGeneratedInviteCode(null);
                setGeneratedInviteLink(null);
                setInviteEmail('');
                setShowInviteModal(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4" /> Invite New Recruiter
            </button>
          </div>

          {/* Pending Recruiter Join Requests */}
          {pendingClaims.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 p-6 rounded-3xl space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h3 className="font-bold text-sm text-amber-900 dark:text-amber-300">
                  Pending Recruiter Verification Requests ({pendingClaims.length})
                </h3>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                These professionals are requesting authorized recruiter credentials to manage postings for {companyProfile.companyName}.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {pendingClaims.map(req => (
                  <div key={req.id} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-800 shadow-sm flex flex-col justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">Candidate Sourcing Request</span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1">{req.userEmail}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">UID: {req.userId.slice(0, 10)}...</p>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => handleApproveClaim(req)}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => handleRejectClaim(req.id)}
                        className="py-2 px-3 border border-slate-200 dark:border-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-500 hover:text-rose-600 rounded-xl text-xs font-bold transition-all"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Recruiter Team Registry */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" /> Active Organization Recruiters ({recruiters.length})
            </h3>

            {loadingTeam ? (
              <div className="py-12 text-center text-slate-400 text-xs italic">Loading recruiting team...</div>
            ) : recruiters.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <Users className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">No external recruiters attached yet</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Invite your recruitment partners or staffing coordinators using the "Invite New Recruiter" button above.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recruiters.map(rec => (
                  <div key={rec.uid} className="p-5 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between gap-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-extrabold flex items-center justify-center text-sm">
                          {(rec.displayName || rec.email || 'R').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">{rec.displayName || rec.email}</h4>
                          <span className="text-[11px] text-slate-400 block">{rec.email}</span>
                        </div>
                      </div>
                      <span className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md">
                        {rec.role || 'Recruiter'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-150 dark:border-slate-800/80">
                      <a
                        href={`#profile/${rec.uid}`}
                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        Public Profile <ExternalLink className="w-3 h-3" />
                      </a>
                      {isOwner && (
                        <button
                          onClick={() => handleRemoveRecruiter(rec.uid, rec.email)}
                          className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 p-1 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors"
                          title="Remove recruiter from company"
                        >
                          <UserX className="w-3.5 h-3.5" /> Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Managed Job Requisitions Section */}
      {activeTab === 'jobs' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-500" /> Attached Job Requisitions
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Active, planned, and archived listings for {companyProfile.companyName || 'your organization'}.
              </p>
            </div>
            <button 
              onClick={() => window.location.hash = '#employer'}
              className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              Manage All in Audit Engine <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loadingJobs ? (
            <div className="py-12 text-center text-slate-400 text-xs italic">Loading associated jobs...</div>
          ) : companyJobs.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
              <Briefcase className="w-10 h-10 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-500">No job requisitions attached yet.</p>
              <p className="text-xs text-slate-400 mt-1">Create your first listing in the Requisition Manager.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {companyJobs.map(job => {
                const statusColor = job.status === 'active' ? 'bg-emerald-500' : job.status === 'draft' ? 'bg-slate-400' : job.status === 'planned' ? 'bg-blue-500' : 'bg-rose-500';
                return (
                  <div key={job.id} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 hover:border-indigo-200 transition-all group">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[9px] font-black uppercase text-white px-1.5 py-0.5 rounded-md ${statusColor}`}>
                        {job.status || 'active'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">{job.jobNumber || 'No Ref'}</span>
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 transition-colors">
                      {job.title}
                    </h3>
                    <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                      <MapPin className="w-3 h-3" /> {job.location || 'Remote'}
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                      <span className="text-[10px] font-semibold text-slate-400">
                        {(job.revisions || []).length} Revisions
                      </span>
                      <button 
                        onClick={() => window.location.hash = '#employer'}
                        className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5"
                      >
                        Edit <Edit3 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Recruiter Invitation Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl relative"
            >
              <button
                onClick={() => setShowInviteModal(false)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Invite Recruiter to Team</h3>
                  <p className="text-xs text-slate-500">Authorize a talent specialist to recruit for {companyProfile.companyName}.</p>
                </div>
              </div>

              {!generatedInviteLink ? (
                <form onSubmit={handleGenerateInvite} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Recruiter Professional Email
                    </label>
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      placeholder="recruiter@agency.com or talent@company.com"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed border border-indigo-200/50 dark:border-indigo-800/50">
                    <span className="font-bold">What happens next:</span> A secure 30-day token will be generated and pre-bound to {companyProfile.companyName}. When the recruiter registers, their account will be tagged as an official recruiter for your organization.
                  </div>

                  <button
                    type="submit"
                    disabled={isGeneratingInvite || !inviteEmail.trim()}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
                  >
                    {isGeneratingInvite ? 'Generating Token...' : 'Create Recruiter Invitation'}
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs">
                    <span className="font-bold block mb-1">Invitation Token Active!</span>
                    Share this unique activation link with <span className="font-bold">{inviteEmail}</span> to complete onboarding.
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Direct Activation Link
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={generatedInviteLink}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-mono text-slate-600 dark:text-slate-300"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generatedInviteLink);
                          setCopiedLink(true);
                          setTimeout(() => setCopiedLink(false), 2500);
                        }}
                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1 shadow-xs"
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedLink ? 'Copied' : 'Copy Link'}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <a
                      href={`mailto:${inviteEmail}?subject=${encodeURIComponent(`Invitation to recruit for ${companyProfile.companyName} on Ascend ATS`)}&body=${encodeURIComponent(`Hi,\n\nYou have been invited to join the talent acquisition team for ${companyProfile.companyName} on Ascend ATS.\n\nPlease activate your recruiter account using this direct link:\n${generatedInviteLink}\n\nInvite Code: ${generatedInviteCode}\n\nBest regards,\n${companyProfile.companyName}`)}`}
                      className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
                    >
                      <Mail className="w-4 h-4" /> Open in Mail App
                    </a>
                    <button
                      onClick={() => setShowInviteModal(false)}
                      className="px-4 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
