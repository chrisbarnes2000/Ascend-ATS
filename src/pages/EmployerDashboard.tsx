import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, getDoc, getDocs, where, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../hooks/useAuth';
import { EmployerSourcing } from './EmployerSourcing';
import { CompanyManagement } from './CompanyManagement';
import { JobRequisitionEditor } from '../components/JobRequisitionEditor';
import { CompanyClaimRequest } from '../types';

import { EmployerHeaderStats } from '../components/employer/EmployerHeaderStats';
import { EmployerApplicantPipeline, ApplicationRecord } from '../components/employer/EmployerApplicantPipeline';
import { EmployerCompanyClaimModal } from '../components/employer/EmployerCompanyClaimModal';
import { EmployerClarificationRequests } from '../components/employer/EmployerClarificationRequests';

export const EmployerDashboard = () => {
  const { user, appUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'pipeline' | 'sourcing' | 'requisitions' | 'company'>('pipeline');
  
  // Real-time Applications State
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Recruiter Company Profile & Association State
  const [recruiterCompany, setRecruiterCompany] = useState<{ companyName: string; companyId: string; claimedCompanyId?: string }>({
    companyName: '',
    companyId: ''
  });
  const [showClaimCompanyModal, setShowClaimCompanyModal] = useState(false);
  const [availableCompaniesList, setAvailableCompaniesList] = useState<Array<{ name: string; id: string; ownerId?: string }>>([]);
  const [isClaiming, setIsClaiming] = useState(false);

  // Load Recruiter Company Profile and System Companies for Claiming
  useEffect(() => {
    if (!user) return;
    const fetchCompanyData = async () => {
      try {
        const profileRef = doc(db, `users/${user.uid}/profiles/company`);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          const pData = profileSnap.data();
          setRecruiterCompany({
            companyName: pData.companyName || '',
            companyId: pData.companyId || user.uid,
            claimedCompanyId: pData.claimedCompanyId || ''
          });
        } else if (appUser?.companyName) {
          setRecruiterCompany({
            companyName: appUser.companyName,
            companyId: user.uid
          });
        }

        const compsSnap = await getDocs(collection(db, 'companies'));
        const compsMap = new Map<string, { id: string; ownerId: string }>();
        compsSnap.forEach(d => {
          const data = d.data();
          if (data.name) {
            compsMap.set(data.name, { id: d.id, ownerId: data.ownerUserId || d.id });
          }
        });

        if (!compsMap.has('Acme Corp')) compsMap.set('Acme Corp', { id: 'acme-corp', ownerId: '393uzPXnOdPW3CE3rdhmDMEldzm1' });
        if (!compsMap.has('CloudScale Infrastructure')) compsMap.set('CloudScale Infrastructure', { id: 'cloudscale', ownerId: 'system' });
        
        setAvailableCompaniesList(Array.from(compsMap.entries()).map(([name, data]) => ({ name, id: data.id, ownerId: data.ownerId })));
      } catch (err) {
        console.error("Error loading recruiter company profile:", err);
      }
    };

    fetchCompanyData();
  }, [user, appUser]);

  // Stream Applications
  const fetchApplications = () => {
    if (!user) return;
    setLoading(true);
    const appsQuery = collection(db, 'applications');
    return onSnapshot(appsQuery, (snapshot) => {
      setApplications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ApplicationRecord)));
      setLoading(false);
    }, (err) => {
      console.error("Error streaming employer applications:", err);
      setLoading(false);
    });
  };

  useEffect(() => {
    const unsub = fetchApplications();
    return () => {
      if (unsub) unsub();
    };
  }, [user]);

  const handleClaimCompany = async (cName: string, cId?: string, cOwnerId?: string) => {
    if (!user || !cName.trim()) return;
    setIsClaiming(true);
    try {
      const compId = cId || cName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      await addDoc(collection(db, 'company_claim_requests'), {
        userId: user.uid,
        userEmail: user.email,
        companyName: cName.trim(),
        companyId: compId,
        targetOwnerUserId: cOwnerId || 'system',
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      setShowClaimCompanyModal(false);
      alert(`Claim request submitted for ${cName.trim()}. Platform administrators will review your credentials.`);
    } catch (err: any) {
      console.error("Error filing company claim request:", err);
      alert("Failed to submit claim request: " + err.message);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-20 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 1. Header Telemetry Bar */}
        <EmployerHeaderStats
          applicationsCount={applications.length}
          viewedCount={applications.filter(a => a.status === 'viewed').length}
          interviewingCount={applications.filter(a => a.status === 'interviewing').length}
          offeredCount={applications.filter(a => a.status === 'offered').length}
          recruiterCompany={recruiterCompany}
          onOpenClaimModal={() => setShowClaimCompanyModal(true)}
        />

        {/* 2. Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4 text-left">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`pb-3 text-xs font-black uppercase tracking-wider transition-all cursor-pointer border-b-2 ${
              activeTab === 'pipeline'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            Applicant Pipeline ({applications.length})
          </button>

          <button
            onClick={() => setActiveTab('sourcing')}
            className={`pb-3 text-xs font-black uppercase tracking-wider transition-all cursor-pointer border-b-2 ${
              activeTab === 'sourcing'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            Talent Sourcing Engine
          </button>

          <button
            onClick={() => setActiveTab('requisitions')}
            className={`pb-3 text-xs font-black uppercase tracking-wider transition-all cursor-pointer border-b-2 ${
              activeTab === 'requisitions'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            Requisition Manager
          </button>

          <button
            onClick={() => setActiveTab('company')}
            className={`pb-3 text-xs font-black uppercase tracking-wider transition-all cursor-pointer border-b-2 ${
              activeTab === 'company'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            Directory Management
          </button>
        </div>

        {/* 3. Pending Candidate Clarification Requests Bar */}
        <EmployerClarificationRequests companyId={recruiterCompany.companyId} />

        {/* 4. Tab Views */}
        {activeTab === 'pipeline' && (
          <EmployerApplicantPipeline
            applications={applications}
            loading={loading}
            onRefresh={fetchApplications}
          />
        )}

        {activeTab === 'sourcing' && <EmployerSourcing />}

        {activeTab === 'requisitions' && <JobRequisitionEditor />}

        {activeTab === 'company' && <CompanyManagement />}

        {/* 5. Company Association Modal */}
        <EmployerCompanyClaimModal
          isOpen={showClaimCompanyModal}
          onClose={() => setShowClaimCompanyModal(false)}
          availableCompanies={availableCompaniesList}
          onClaimCompany={handleClaimCompany}
          isClaiming={isClaiming}
        />
      </div>
    </div>
  );
};
