import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { collection, getDocs, deleteDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../hooks/useAuth';
import { 
  Database, 
  Trash2, 
  CheckCircle, 
  AlertTriangle, 
  Sparkles, 
  Briefcase, 
  Users, 
  FileText, 
  Clock, 
  RefreshCw,
  Terminal,
  ShieldAlert,
  Building,
  Plus,
  Link,
  ExternalLink,
  MessageSquare,
  Mail,
  Copy,
  Check,
  X,
  Info,
  Send
} from 'lucide-react';

const sampleJobSets = [
  {
    id: 'healthcare',
    name: 'Healthcare & Medical',
    jobs: [
      {
        title: 'Registered Nurse',
        companyName: 'General Hospital',
        companyId: 'general-hospital',
        description: 'Provide critical care in our intensive care unit. Must be comfortable in a fast-paced environment.',
        requirements: 'Valid RN license, BLS/ACLS certification, Minimum 2 years ICU experience',
        status: 'active',
        parsedCriteria: {
          skills: ['Patient Care', 'ICU', 'BLS', 'ACLS', 'Telemetry'],
          minExperience: 2,
          salaryRange: { min: 80000, max: 110000 }
        }
      },
      {
        title: 'Medical Assistant',
        companyName: 'City Clinic',
        companyId: 'city-clinic',
        description: 'Support doctors with routine check-ups and administrative tasks.',
        requirements: 'CMA certification, strong interpersonal skills',
        status: 'active',
        parsedCriteria: {
          skills: ['Patient Vitals', 'EMR', 'Phlebotomy', 'Administration'],
          minExperience: 1,
          salaryRange: { min: 45000, max: 60000 }
        }
      }
    ]
  },
  {
    id: 'retail',
    name: 'Retail & Sales',
    jobs: [
      {
        title: 'Store Manager',
        companyName: 'Luxe Retail',
        companyId: 'luxe-retail',
        description: 'Lead a team of associates to deliver exceptional customer service and meet sales goals.',
        requirements: 'Retail management experience, P&L responsibility',
        status: 'active',
        parsedCriteria: {
          skills: ['Team Leadership', 'Sales Strategy', 'Inventory Management', 'Customer Service'],
          minExperience: 4,
          salaryRange: { min: 65000, max: 90000 }
        }
      },
      {
        title: 'Sales Representative',
        companyName: 'Global Corp',
        companyId: 'global-corp',
        description: 'B2B sales role focused on acquiring new enterprise clients.',
        requirements: 'Proven track record in B2B sales, CRM proficiency',
        status: 'active',
        parsedCriteria: {
          skills: ['B2B Sales', 'Cold Calling', 'Salesforce', 'Negotiation'],
          minExperience: 2,
          salaryRange: { min: 60000, max: 120000 }
        }
      }
    ]
  },
  {
    id: 'education',
    name: 'Education & Training',
    jobs: [
      {
        title: 'High School Science Teacher',
        companyName: 'County Schools',
        companyId: 'county-schools',
        description: 'Teach biology and chemistry to grades 10-12. Develop engaging curriculum.',
        requirements: 'Teaching credential, Bachelor in Science',
        status: 'active',
        parsedCriteria: {
          skills: ['Lesson Planning', 'Curriculum Development', 'Biology', 'Chemistry'],
          minExperience: 1,
          salaryRange: { min: 55000, max: 75000 }
        }
      },
      {
        title: 'Corporate Trainer',
        companyName: 'Enterprise Solutions',
        companyId: 'enterprise-solutions',
        description: 'Develop and deliver onboarding programs for new employees globally.',
        requirements: 'Instructional design experience, public speaking',
        status: 'active',
        parsedCriteria: {
          skills: ['Instructional Design', 'Public Speaking', 'E-Learning', 'Onboarding'],
          minExperience: 3,
          salaryRange: { min: 70000, max: 95000 }
        }
      }
    ]
  },
  {
    id: 'finance',
    name: 'Finance & Accounting',
    jobs: [
      {
        title: 'Financial Analyst',
        companyName: 'Wall Street Partners',
        companyId: 'ws-partners',
        description: 'Analyze market trends, build financial models, and advise on investment strategies.',
        requirements: 'CFA level 1, advanced Excel, Python nice to have',
        status: 'active',
        parsedCriteria: {
          skills: ['Financial Modeling', 'Excel', 'Data Analysis', 'Valuation'],
          minExperience: 2,
          salaryRange: { min: 90000, max: 130000 }
        }
      },
      {
        title: 'Senior Accountant',
        companyName: 'Audit Pros LLC',
        companyId: 'audit-pros',
        description: 'Manage month-end close procedures and prepare financial statements.',
        requirements: 'CPA required, 5+ years public accounting experience',
        status: 'active',
        parsedCriteria: {
          skills: ['CPA', 'Financial Reporting', 'GAAP', 'Month-End Close'],
          minExperience: 5,
          salaryRange: { min: 85000, max: 120000 }
        }
      }
    ]
  },
  {
    id: 'legal',
    name: 'Legal & Compliance',
    jobs: [
      {
        title: 'Corporate Counsel',
        companyName: 'Apex Legal & Co',
        companyId: 'apex-legal',
        description: 'Review commercial contracts, IP filings, and advise executive leadership on regulatory compliance.',
        requirements: 'JD degree, active bar admission, 3+ years corporate law experience',
        status: 'active',
        parsedCriteria: {
          skills: ['Contract Review', 'Regulatory Compliance', 'IP Law', 'Negotiation'],
          minExperience: 3,
          salaryRange: { min: 140000, max: 200000 }
        }
      },
      {
        title: 'Compliance Analyst',
        companyName: 'TrustGuard Risk',
        companyId: 'trustguard',
        description: 'Monitor internal security and financial workflows to ensure adherence to SEC and GDPR mandates.',
        requirements: 'Certified Compliance Professional (CCPC), detail-oriented analytical skills',
        status: 'active',
        parsedCriteria: {
          skills: ['Risk Assessment', 'GDPR', 'Audit', 'Policy Writing'],
          minExperience: 2,
          salaryRange: { min: 75000, max: 105000 }
        }
      }
    ]
  },
  {
    id: 'logistics',
    name: 'Logistics & Supply Chain',
    jobs: [
      {
        title: 'Supply Chain Analyst',
        companyName: 'SwiftFlow Logistics',
        companyId: 'swiftflow',
        description: 'Optimize global freight routes, inventory holding costs, and supplier SLA metrics.',
        requirements: 'Degree in Supply Chain or Operations, SAP or Oracle ERP proficiency',
        status: 'active',
        parsedCriteria: {
          skills: ['Supply Chain', 'ERP', 'Inventory Optimization', 'SQL'],
          minExperience: 2,
          salaryRange: { min: 70000, max: 95000 }
        }
      },
      {
        title: 'Warehouse Operations Manager',
        companyName: 'PrimeDepot Centers',
        companyId: 'primedepot',
        description: 'Manage 100+ shift staff, safety standards, and high-volume order fulfillment throughput.',
        requirements: '5+ years warehouse leadership, Six Sigma certification preferred',
        status: 'active',
        parsedCriteria: {
          skills: ['Warehouse Management', 'Safety Standards', 'Six Sigma', 'Team Leadership'],
          minExperience: 5,
          salaryRange: { min: 80000, max: 115000 }
        }
      }
    ]
  },
  {
    id: 'creative',
    name: 'Creative & Design',
    jobs: [
      {
        title: 'Senior UX/UI Designer',
        companyName: 'PixelCraft Studio',
        companyId: 'pixelcraft',
        description: 'Design immersive web and mobile applications with a focus on user empathy and modern design systems.',
        requirements: 'Figma mastery, strong portfolio, user research experience',
        status: 'active',
        parsedCriteria: {
          skills: ['Figma', 'UX Research', 'Design Systems', 'Prototyping'],
          minExperience: 4,
          salaryRange: { min: 110000, max: 155000 }
        }
      },
      {
        title: 'Brand Creative Director',
        companyName: 'Aura Media Group',
        companyId: 'aura-media',
        description: 'Direct global visual campaigns, typography direction, and multimedia storytelling.',
        requirements: 'Agency experience, art direction leadership',
        status: 'active',
        parsedCriteria: {
          skills: ['Art Direction', 'Brand Strategy', 'Typography', 'Creative Direction'],
          minExperience: 7,
          salaryRange: { min: 130000, max: 185000 }
        }
      }
    ]
  },
  {
    id: 'engineering',
    name: 'Engineering & DevOps',
    jobs: [
      {
        title: 'Senior Cloud Architect',
        companyName: 'CloudScale Infrastructure',
        companyId: 'cloudscale',
        description: 'Design fault-tolerant, scalable multi-region AWS and Kubernetes clusters.',
        requirements: 'AWS Certified Solutions Architect, Terraform, Kubernetes',
        status: 'active',
        parsedCriteria: {
          skills: ['AWS', 'Kubernetes', 'Terraform', 'System Architecture'],
          minExperience: 6,
          salaryRange: { min: 160000, max: 220000 }
        }
      },
      {
        title: 'Full Stack Engineer',
        companyName: 'NextGen Apps',
        companyId: 'nextgen-apps',
        description: 'Build fast React and Node.js microservices with clean TypeScript codebases.',
        requirements: 'React, Node.js, TypeScript, PostgreSQL',
        status: 'active',
        parsedCriteria: {
          skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
          minExperience: 3,
          salaryRange: { min: 120000, max: 165000 }
        }
      }
    ]
  },
  {
    id: 'biotech',
    name: 'Biotech & Research',
    jobs: [
      {
        title: 'Clinical Research Scientist',
        companyName: 'BioHealth Labs',
        companyId: 'biohealth',
        description: 'Conduct Phase II and III clinical trials, analyzing patient safety metrics and efficacy data.',
        requirements: 'PhD or MS in Life Sciences, GCP certification',
        status: 'active',
        parsedCriteria: {
          skills: ['Clinical Trials', 'Data Analysis', 'GCP', 'Biostatistics'],
          minExperience: 4,
          salaryRange: { min: 105000, max: 150000 }
        }
      }
    ]
  }
];

export default function AdminPanel() {
  const { user } = useAuth();
  const isAdmin = user?.email === 'Chris.Barnes.2000@me.com' || user?.uid === '393uzPXnOdPW3CE3rdhmDMEldzm1';

  const [isProcessing, setIsProcessing] = useState(false);
  // ... rest of the state
  
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

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, message: '', onConfirm: () => {} });
  const [status, setStatus] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [stats, setStats] = useState({ jobsCount: 0, appsCount: 0, usersCount: 0, companiesCount: 0 });
  const [loadingStats, setLoadingStats] = useState(false);
  
  // Invitation Dispatch Dialog State
  const [inviteModalData, setInviteModalData] = useState<{
    isOpen: boolean;
    email: string;
    targetFirmName: string;
    role: string;
    inviteCode: string;
  } | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmailDraft, setCopiedEmailDraft] = useState(false);

  const getInviteDetails = (inv: { email: string; targetFirmName?: string; role?: string; inviteCode: string }) => {
    const origin = window.location.origin;
    const roleUpper = (inv.role || 'owner').toUpperCase();
    const firmDisplay = inv.targetFirmName || 'Staffing Partner';
    const joinUrl = `${origin}/#signup?invite=${inv.inviteCode}&email=${encodeURIComponent(inv.email)}&role=${encodeURIComponent(inv.role || 'owner')}&utm_source=admin_portal&utm_medium=invitation_system&utm_campaign=staffing_firm_onboarding`;
    const subject = `Invitation to join Ascend ATS as ${roleUpper} for ${firmDisplay}`;
    const body = `Hello,\n\nYou have been invited to join the Ascend ATS platform as an authorized ${roleUpper} representing ${firmDisplay}.\n\nYour Activation Invite Code is: ${inv.inviteCode}\n\nTo accept your invitation and activate your account with pre-filled credentials, open the direct link below:\n${joinUrl}\n\nThis invitation token remains active for 7 days.\n\nBest regards,\nAscend ATS Administration`;
    const mailtoLink = `mailto:${encodeURIComponent(inv.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(inv.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const outlookUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(inv.email)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    return { joinUrl, subject, body, mailtoLink, gmailUrl, outlookUrl };
  };

  const handleLaunchMailApp = (mailtoLink: string) => {
    try {
      // Use hidden iframe dispatch to avoid opening unwanted browser tabs on macOS/Chrome
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
  
  // Unified Admin View State
  const [adminMode, setAdminMode] = useState<'simulation' | 'invitations' | 'requests' | 'security'>('simulation');
  
  // Staffing Firm Invitation State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFirmName, setInviteFirmName] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'recruiter' | 'owner'>('recruiter');
  const [isInviting, setIsInviting] = useState(false);
  const [selectedJobSet, setSelectedJobSet] = useState(sampleJobSets[0].id);

  const [activeInvitations, setActiveInvitations] = useState<any[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);

  const [activeRequests, setActiveRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const fetchInvitations = async () => {
    setLoadingInvites(true);
    try {
      const snap = await getDocs(collection(db, 'staffing_invitations'));
      setActiveInvitations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Failed to fetch invites", err);
    } finally {
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

  useEffect(() => {
    if (adminMode === 'invitations') {
      fetchInvitations();
    } else if (adminMode === 'requests') {
      fetchRequests();
    }
  }, [adminMode]);

  const handleDeleteRequest = async (requestId: string) => {
    try {
      await deleteDoc(doc(db, 'partner_requests', requestId));
      setStatus({ text: `Request ${requestId} deleted.`, type: 'info' });
      fetchRequests();
    } catch (err: any) {
      setStatus({ text: 'Failed to delete request: ' + err.message, type: 'error' });
    }
  };

  const handleSendInvite = async () => {
    if (!inviteEmail || !inviteFirmName) return;
    setIsInviting(true);
    try {
      const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      const inviteData = {
        email: inviteEmail,
        targetFirmName: inviteFirmName,
        role: inviteRole,
        status: 'pending',
        invitedByUid: user?.uid,
        invitedByEmail: user?.email,
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 3600 * 1000), // 7 days
        inviteCode,
        utmSource: 'admin_portal',
        utmMedium: 'invitation_system',
        utmCampaign: 'staffing_firm_onboarding'
      };
      
      await setDoc(doc(db, 'staffing_invitations', inviteCode), inviteData);
      setStatus({ text: `Access token generated for ${inviteEmail} (Code: ${inviteCode}). Dispatch the email below to complete invitation.`, type: 'success' });
      setInviteModalData({
        isOpen: true,
        email: inviteEmail,
        targetFirmName: inviteFirmName,
        role: inviteRole,
        inviteCode
      });
      setInviteEmail('');
      setInviteFirmName('');
      fetchInvitations();
    } catch (err: any) {
      setStatus({ text: 'Failed to issue invite: ' + err.message, type: 'error' });
    } finally {
      setIsInviting(false);
    }
  };

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const jobsSnap = await getDocs(collection(db, 'jobs'));
      const appsSnap = await getDocs(collection(db, 'applications'));
      const usersSnap = await getDocs(collection(db, 'users'));
      const companiesSnap = await getDocs(collection(db, 'companies'));
      
      setStats({
        jobsCount: jobsSnap.size,
        appsCount: appsSnap.size,
        usersCount: usersSnap.size,
        companiesCount: companiesSnap.size
      });
    } catch (err) {
      console.error("Failed to fetch admin stats", err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const showStatus = (text: string, type: 'success' | 'error' | 'info') => {
    setStatus({ text, type });
    setTimeout(() => setStatus(null), 4000);
  };

  const handleClearJobs = async () => {
    if (isProcessing) return;
    setConfirmModal({
      isOpen: true,
      message: "Are you sure you want to clear ALL test positions and seeded company profiles? This cannot be undone.",
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, message: '', onConfirm: () => {} });
        performClearJobs();
      }
    });
  };

  const performClearJobs = async () => {
    setIsProcessing(true);
    showStatus('Clearing all job listings and company profiles...', 'info');
    try {
      const querySnapshot = await getDocs(collection(db, 'jobs'));
      console.log("Jobs found to delete:", querySnapshot.size);
      const deletePromises = querySnapshot.docs.map(docSnap => deleteDoc(docSnap.ref));
      await Promise.all(deletePromises);

      const compSnapshot = await getDocs(collection(db, 'companies'));
      console.log("Companies found to delete:", compSnapshot.size);
      const deleteCompPromises = compSnapshot.docs.map(docSnap => deleteDoc(docSnap.ref));
      await Promise.all(deleteCompPromises);

      showStatus('Successfully cleared all test positions and company profiles.', 'success');
      fetchStats();
    } catch (err: any) {
      console.error(err);
      showStatus('Error clearing: ' + err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearApps = async () => {
    if (isProcessing) return;
    setConfirmModal({
      isOpen: true,
      message: "Are you sure you want to clear ALL candidate application logs? This cannot be undone.",
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, message: '', onConfirm: () => {} });
        performClearApps();
      }
    });
  };

  const performClearApps = async () => {
    setIsProcessing(true);
    showStatus('Purging all candidate applications...', 'info');
    try {
      const querySnapshot = await getDocs(collection(db, 'applications'));
      const deletePromises = querySnapshot.docs
        .map(docSnap => deleteDoc(docSnap.ref));
      await Promise.all(deletePromises);
      showStatus('Successfully cleared all applications.', 'success');
      fetchStats();
    } catch (err: any) {
      console.error(err);
      showStatus('Error clearing applications: ' + err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const companiesDetails: { [key: string]: any } = {
    'general-hospital': {
      name: 'General Hospital',
      industry: 'Healthcare & Medicine',
      size: '500+',
      description: 'Providing comprehensive inpatient and outpatient medical care, emergency services, and wellness outreach to our regional community.'
    },
    'city-clinic': {
      name: 'City Clinic',
      industry: 'Healthcare & Medicine',
      size: '51-200',
      description: 'A community-focused healthcare center providing direct primary care, mental health services, and proactive vaccination/preventative support.'
    },
    'luxe-retail': {
      name: 'Luxe Retail',
      industry: 'Retail & Fashion',
      size: '201-500',
      description: 'A premier lifestyle brand delivering refined customer journeys, luxury boutique operations, and sustainable retail supply chains.'
    },
    'global-corp': {
      name: 'Global Corp',
      industry: 'Retail & Sales',
      size: '500+',
      description: 'A global distribution network and physical commerce conglomerate focused on high-volume logistics and accessible goods.'
    },
    'county-schools': {
      name: 'County Schools',
      industry: 'Education & Training',
      size: '500+',
      description: 'Empowering children and young adults with creative curricula, physical activities, and advanced STEM enrichment programs.'
    },
    'enterprise-solutions': {
      name: 'Enterprise Solutions',
      industry: 'Technology & Corporate Training',
      size: '201-500',
      description: 'Providing modern software tools, e-learning management platforms, and upskilling certifications for global organizations.'
    },
    'ws-partners': {
      name: 'Wall Street Partners',
      industry: 'Finance & Banking',
      size: '51-200',
      description: 'Advising private family offices and venture funds on optimal asset allocation, market hedges, and global macro-economic shifts.'
    },
    'audit-pros': {
      name: 'Audit Pros LLC',
      industry: 'Accounting & Advisory',
      size: '11-50',
      description: 'A highly selective boutique CPA firm managing rigorous corporate audit, risk assessment, and cross-border tax filing compliance.'
    },
    'apex-legal': {
      name: 'Apex Legal & Co',
      industry: 'Legal Services',
      size: '51-200',
      description: 'Premier corporate counsel and litigation defense experts for high-growth enterprises.'
    },
    'trustguard': {
      name: 'TrustGuard Risk',
      industry: 'Risk & Compliance',
      size: '11-50',
      description: 'Ensuring global corporate security and regulatory alignment.'
    },
    'swiftflow': {
      name: 'SwiftFlow Logistics',
      industry: 'Supply Chain',
      size: '201-500',
      description: 'Next-generation freight forwarding and supply chain optimization network.'
    },
    'primedepot': {
      name: 'PrimeDepot Centers',
      industry: 'Fulfillment & Logistics',
      size: '500+',
      description: 'High-throughput fulfillment centers powering same-day e-commerce delivery.'
    },
    'pixelcraft': {
      name: 'PixelCraft Studio',
      industry: 'Design & UX',
      size: '11-50',
      description: 'Boutique product design studio crafting world-class digital experiences.'
    },
    'aura-media': {
      name: 'Aura Media Group',
      industry: 'Marketing & Design',
      size: '51-200',
      description: 'Global creative agency defining iconic brand stories.'
    },
    'cloudscale': {
      name: 'CloudScale Infrastructure',
      industry: 'Cloud Computing',
      size: '201-500',
      description: 'Enterprise cloud infrastructure and distributed systems architecture.'
    },
    'nextgen-apps': {
      name: 'NextGen Apps',
      industry: 'Software Engineering',
      size: '51-200',
      description: 'Agile software development and cloud-native application engineering.'
    },
    'biohealth': {
      name: 'BioHealth Labs',
      industry: 'Biotechnology',
      size: '51-200',
      description: 'Pioneering clinical research and pharmaceutical discovery.'
    }
  };

  const handleRevokeInvite = async (inviteCode: string) => {
    try {
      await setDoc(doc(db, 'staffing_invitations', inviteCode), { status: 'expired' }, { merge: true });
      setStatus({ text: `Invitation ${inviteCode} revoked.`, type: 'info' });
      fetchInvitations();
    } catch (err: any) {
      setStatus({ text: 'Failed to revoke: ' + err.message, type: 'error' });
    }
  };

  const handleDeleteInvite = async (inviteCode: string) => {
    try {
      await deleteDoc(doc(db, 'staffing_invitations', inviteCode));
      setStatus({ text: `Invitation ${inviteCode} deleted.`, type: 'info' });
      fetchInvitations();
    } catch (err: any) {
      setStatus({ text: 'Failed to delete: ' + err.message, type: 'error' });
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
            skills: ['Figma', 'UX Research', 'Design Systems', 'Prototyping'],
            experienceYears: 5,
            privacy: { searchable: true, privacyLevel: 1 },
            workExperience: [{ company: 'CreativePulse', role: 'UX Designer', period: '2021-Present', highlights: ['Redesigned mobile app increasing engagement by 34%'] }]
          }
        },
        {
          uid: 'sample-candidate-2',
          profile: {
            personalInfo: { firstName: 'Marcus', lastName: 'Chen', email: 'marcus.chen@example.com', phone: '+1-555-0144', location: 'New York, NY' },
            targetRole: 'Financial Analyst',
            skills: ['Financial Modeling', 'Excel', 'Data Analysis', 'Valuation'],
            experienceYears: 3,
            privacy: { searchable: true, privacyLevel: 1 },
            workExperience: [{ company: 'Capital Trust', role: 'Junior Analyst', period: '2022-Present', highlights: ['Built DCF models for $50M portfolio'] }]
          }
        },
        {
          uid: 'sample-candidate-3',
          profile: {
            personalInfo: { firstName: 'Sarah', lastName: 'Jenkins', email: 'sarah.jenkins@example.com', phone: '+1-555-0178', location: 'Austin, TX' },
            targetRole: 'Registered Nurse',
            skills: ['Patient Care', 'ICU', 'BLS', 'ACLS', 'Telemetry'],
            experienceYears: 4,
            privacy: { searchable: true, privacyLevel: 1 },
            workExperience: [{ company: 'Metro Health', role: 'Staff Nurse', period: '2020-Present', highlights: ['Managed 12-bed ICU wing'] }]
          }
        },
        {
          uid: 'sample-candidate-4',
          profile: {
            personalInfo: { firstName: 'David', lastName: 'O\'Connor', email: 'david.oconnor@example.com', phone: '+1-555-0133', location: 'Chicago, IL' },
            targetRole: 'Supply Chain Analyst',
            skills: ['Supply Chain', 'ERP', 'Inventory Optimization', 'SQL'],
            experienceYears: 2,
            privacy: { searchable: true, privacyLevel: 1 },
            workExperience: [{ company: 'Midwest Freight', role: 'Operations Assistant', period: '2023-Present', highlights: ['Reduced freight transit delays by 15%'] }]
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
            logoUrl: '',
            updatedAt: serverTimestamp()
          }, { merge: true });
        }
      }

      showStatus(`Successfully injected ${sampleCandidates.length} candidate profiles and ${sampleJobSets.length} industry job sets!`, 'success');
      fetchStats();
    } catch (err: any) {
      console.error(err);
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

        // Auto-seed matching company profile
        const compId = job.companyId || 'unknown';
        const compInfo = companiesDetails[compId] || {
          name: job.companyName || 'Unknown Corp',
          industry: 'Other',
          size: '11-50',
          description: 'A professional organization partnering with Ascend to source premier talent.'
        };
        await setDoc(doc(db, 'companies', compId), {
          ownerUserId: 'system-seed',
          name: compInfo.name,
          industry: compInfo.industry,
          size: compInfo.size,
          description: compInfo.description,
          logoUrl: '',
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
      showStatus(`Successfully seeded ${jobs.length} ${setName} positions and company profiles.`, 'success');
      fetchStats();
    } catch (err: any) {
      console.error(err);
      showStatus('Error seeding: ' + err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 w-full md:w-[75vw] max-w-none mx-auto">
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl"
          >
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-4">Are you sure?</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">{confirmModal.message}</p>
            <div className="flex gap-4">
              <button 
                onClick={() => setConfirmModal({ isOpen: false, message: '', onConfirm: () => {} })}
                className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmModal.onConfirm}
                className="flex-1 px-6 py-3 bg-rose-600 text-white rounded-2xl text-sm font-bold hover:bg-rose-700 transition-colors"
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Invitation Dispatch Modal */}
      {inviteModalData && inviteModalData.isOpen && (() => {
        const details = getInviteDetails(inviteModalData);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="invite-modal-title">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 sm:p-8 max-w-xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 id="invite-modal-title" className="text-lg font-black text-slate-900 dark:text-white">Dispatch Partner Invitation</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ready-to-Send Email & Token</p>
                  </div>
                </div>
                <button 
                  onClick={() => setInviteModalData(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-5 space-y-4 text-left">
                <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 flex items-start gap-3">
                  <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-indigo-950 dark:text-indigo-200 leading-relaxed font-medium">
                    Because outbound transactional email runs decoupled from cloud functions, use the triggers below to launch your default mail app (<code className="font-mono font-bold">mailto:</code>) or copy the formatted invite text to send directly to <strong>{inviteModalData.email}</strong>.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Recipient</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 break-all">{inviteModalData.email}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Firm / Role</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{inviteModalData.targetFirmName} ({inviteModalData.role.toUpperCase()})</span>
                  </div>
                  <div className="sm:col-span-2 flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Invitation Code</span>
                      <span className="text-sm font-mono font-black text-indigo-600 dark:text-indigo-400 tracking-wider">{inviteModalData.inviteCode}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(inviteModalData.inviteCode);
                        setCopiedCodeId(inviteModalData.inviteCode);
                        setTimeout(() => setCopiedCodeId(null), 2000);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      {copiedCodeId === inviteModalData.inviteCode ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Code</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Direct Activation Link</label>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(details.joinUrl);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      }}
                      className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                    >
                      {copiedLink ? <Check className="w-3 h-3 text-emerald-500" /> : <Link className="w-3 h-3" />}
                      {copiedLink ? 'Link Copied' : 'Copy Link'}
                    </button>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-400 break-all select-all">
                    {details.joinUrl}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Pre-composed Email Message Draft</label>
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap max-h-32 overflow-y-auto leading-relaxed">
                    <strong className="block text-slate-900 dark:text-white mb-2 pb-1 border-b border-slate-200 dark:border-slate-800">
                      Subject: {details.subject}
                    </strong>
                    {details.body}
                  </div>
                </div>

                <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                  <div className="font-bold flex items-center gap-1.5 mb-1 text-amber-950 dark:text-amber-100">
                    <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>macOS Mail App Note</span>
                  </div>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300">
                    If clicking <em>Launch Native Mail App</em> opens Google Chrome on macOS, your system's default email reader is assigned to Chrome. You can switch to Apple Mail in <strong>Mail.app &gt; Settings &gt; General &gt; Default email reader</strong>, or use the direct <strong>Open in Gmail (Web)</strong> button below.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href={details.mailtoLink}
                  onClick={(e) => {
                    e.preventDefault();
                    handleLaunchMailApp(details.mailtoLink);
                  }}
                  className="py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 dark:shadow-none text-center cursor-pointer"
                >
                  <Mail className="w-4 h-4" />
                  Launch Native Mail App
                </a>
                <a
                  href={details.gmailUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 px-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-100 dark:shadow-none text-center cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in Gmail (Web)
                </a>
                <a
                  href={details.outlookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm text-center cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open in Outlook (Web)
                </a>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`Subject: ${details.subject}\n\n${details.body}`);
                    setCopiedEmailDraft(true);
                    setTimeout(() => setCopiedEmailDraft(false), 2000);
                  }}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                >
                  {copiedEmailDraft ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  {copiedEmailDraft ? 'Draft Copied!' : 'Copy Full Draft'}
                </button>
              </div>
            </motion.div>
          </div>
        );
      })()}
      {/* Header */}
      <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-widest mb-1.5">
            <Terminal className="w-4 h-4" />
            System Control Space
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">Developer Admin Workspace</h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl">
            Simulate positions, monitor collection telemetry, and flush environment test logs cleanly.
          </p>
        </div>
        
        <button 
          onClick={fetchStats}
          disabled={loadingStats || isProcessing}
          className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loadingStats ? 'animate-spin' : ''}`} />
          Refresh Stats
        </button>
      </div>

      {/* Database Telemetry */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Active Job Postings</span>
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {loadingStats ? '...' : stats.jobsCount}
            </span>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Candidate Apps</span>
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {loadingStats ? '...' : stats.appsCount}
            </span>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Company Profiles</span>
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {loadingStats ? '...' : stats.companiesCount}
            </span>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-2xl">
            <Building className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Registered Logins</span>
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {loadingStats ? '...' : stats.usersCount}
            </span>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {status && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-8 p-4 rounded-2xl border flex items-center gap-3 font-medium text-sm ${
            status.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' :
            status.type === 'error' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800' :
            'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
          }`}
        >
          {status.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
          {status.text}
        </motion.div>
      )}

      {/* Unified Control Center */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-xl overflow-hidden mb-12">
        <div className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-200 dark:shadow-none">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">System Operations Console</h2>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">Control Environment State & Partners</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
            <button 
              onClick={() => setAdminMode('simulation')}
              className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${adminMode === 'simulation' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
              Simulation
            </button>
            <button 
              onClick={() => setAdminMode('invitations')}
              className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${adminMode === 'invitations' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
              Invitations
            </button>
            <button 
              onClick={() => setAdminMode('requests')}
              className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${adminMode === 'requests' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
              Partner Requests
            </button>
            <button 
              onClick={() => setAdminMode('security')}
              className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${adminMode === 'security' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
              Security
            </button>
          </div>
        </div>

        <div className="p-8 sm:p-12">
          {adminMode === 'simulation' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="bg-slate-50 dark:bg-slate-950/40 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                      <Database className="w-6 h-6 text-indigo-500" />
                      Dynamic Data Simulator
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium max-w-md leading-relaxed">
                      Inject targeted dataset sets into the matching index to test specific domain parsing, requisition hierarchies, and candidate matching pipelines.
                    </p>
                  </div>
                  
                  <div className="w-full md:w-auto flex flex-col sm:flex-row gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Target Dataset</label>
                      <select
                        value={selectedJobSet}
                        onChange={(e) => setSelectedJobSet(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all appearance-none cursor-pointer min-w-[280px]"
                      >
                        <option value="bulk">Complete Talent Pool & Ecosystem (Bulk)</option>
                        {sampleJobSets.map(set => (
                          <option key={set.id} value={set.id}>{set.name} ({set.jobs.length} roles)</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Action</label>
                      <button
                        onClick={() => {
                          if (selectedJobSet === 'bulk') {
                            handleBulkSeedTalentAndCompanies();
                          } else {
                            const set = sampleJobSets.find(s => s.id === selectedJobSet);
                            if (set) handleSeed(set.jobs, set.name);
                          }
                        }}
                        disabled={isProcessing}
                        className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100 dark:shadow-none hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                        Run Simulation
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {adminMode === 'invitations' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden">
                <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-6 sm:p-8 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-6">
                  <div className="space-y-1 text-left">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Plus className="w-5 h-5 text-indigo-600" />
                      Partner Onboarding Control
                    </h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                      Issue secure access tokens for staffing firms and recruiters.
                    </p>
                  </div>
                  
                  <div className="w-full lg:w-auto flex flex-col sm:flex-row items-center gap-3">
                    <input 
                      type="email" 
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="Recipient Email"
                      className="w-full sm:w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                    <input 
                      type="text" 
                      value={inviteFirmName}
                      onChange={(e) => setInviteFirmName(e.target.value)}
                      placeholder="Staffing Firm Name"
                      className="w-full sm:w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                    <select 
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as any)}
                      className="w-full sm:w-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                    >
                      <option value="recruiter">Recruiter</option>
                      <option value="admin">Admin</option>
                      <option value="owner">Owner</option>
                    </select>
                    <button 
                      onClick={handleSendInvite}
                      disabled={isInviting || !inviteEmail || !inviteFirmName}
                      className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-black px-6 py-2.5 rounded-xl text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 dark:shadow-none disabled:opacity-50 transition-all flex items-center justify-center gap-2 shrink-0"
                    >
                      {isInviting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                      Issue Token
                    </button>
                  </div>
                </div>

                <div className="p-0">
                  <div className="flex items-center justify-between px-8 py-4 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Active Access Tokens & Logs</h4>
                    <button onClick={fetchInvitations} className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-500 transition-colors">Sync Registry</button>
                  </div>
                  
                  <div className="max-h-[400px] overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 bg-white dark:bg-slate-900 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800 z-10">
                        <tr>
                          <th className="px-8 py-4">Recipient</th>
                          <th className="px-4 py-4">Firm / Role</th>
                          <th className="px-4 py-4">Status</th>
                          <th className="px-4 py-4">Expires</th>
                          <th className="px-8 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                        {loadingInvites ? (
                          <tr>
                            <td colSpan={5} className="px-8 py-12 text-center text-xs text-slate-400 font-bold uppercase tracking-widest italic">Syncing live registry...</td>
                          </tr>
                        ) : activeInvitations.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-8 py-12 text-center text-xs text-slate-400 font-bold uppercase tracking-widest italic">No partner tokens registered</td>
                          </tr>
                        ) : (
                          activeInvitations.map((inv) => (
                            <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group text-xs">
                              <td className="px-8 py-4 text-left">
                                <div className="font-bold text-slate-900 dark:text-white">{inv.email}</div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-mono text-[11px] font-bold border border-indigo-200/60 dark:border-indigo-800/60 shadow-xs">
                                    <span>Code:</span>
                                    <span className="tracking-wider">{inv.inviteCode}</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigator.clipboard.writeText(inv.inviteCode);
                                      setCopiedCodeId(inv.id || inv.inviteCode);
                                      setTimeout(() => setCopiedCodeId(null), 2000);
                                      setStatus({ text: `Invite code ${inv.inviteCode} copied to clipboard!`, type: 'info' });
                                    }}
                                    className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded transition-colors"
                                    title="Copy Invite Code"
                                    aria-label={`Copy invite code ${inv.inviteCode}`}
                                  >
                                    {copiedCodeId === (inv.id || inv.inviteCode) ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-left">
                                <div className="font-bold text-slate-700 dark:text-slate-300">{inv.targetFirmName}</div>
                                <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-0.5">{inv.role}</div>
                              </td>
                              <td className="px-4 py-4 text-left">
                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                                  inv.status === 'pending' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40' :
                                  inv.status === 'accepted' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40' :
                                  'bg-rose-50 text-rose-600 dark:bg-rose-950/40'
                                }`}>
                                  {inv.status}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-left text-[10px] font-bold text-slate-500">
                                {inv.expiresAt?.toDate ? inv.expiresAt.toDate().toLocaleDateString() : '7 days'}
                              </td>
                              <td className="px-8 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button 
                                    onClick={() => {
                                      setInviteModalData({
                                        isOpen: true,
                                        email: inv.email,
                                        targetFirmName: inv.targetFirmName,
                                        role: inv.role,
                                        inviteCode: inv.inviteCode
                                      });
                                    }}
                                    className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all"
                                    title="Dispatch Email / View Invite Details"
                                    aria-label={`Dispatch invite email for ${inv.email}`}
                                  >
                                    <Mail className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => {
                                      const details = getInviteDetails(inv);
                                      navigator.clipboard.writeText(details.joinUrl);
                                      setStatus({ text: 'Direct activation link copied to clipboard!', type: 'success' });
                                    }}
                                    className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all"
                                    title="Copy Direct Link"
                                    aria-label="Copy direct invite link"
                                  >
                                    <Link className="w-4 h-4" />
                                  </button>
                                  {inv.status === 'pending' && (
                                    <button 
                                      onClick={() => handleRevokeInvite(inv.inviteCode)}
                                      className="p-2 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all"
                                      title="Revoke Token"
                                    >
                                      <Clock className="w-4 h-4" />
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => handleDeleteInvite(inv.inviteCode)}
                                    className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all"
                                    title="Delete Record"
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
              </div>
            </motion.div>
          )}

          {adminMode === 'requests' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden">
                <div className="bg-amber-50/50 dark:bg-amber-950/20 p-6 sm:p-8 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-6">
                  <div className="space-y-1 text-left">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-amber-600" />
                      Incoming Partner Requests
                    </h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                      Review recruiters and firms requesting access from external sources.
                    </p>
                  </div>
                  <button onClick={fetchRequests} className="px-6 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                    Sync Requests
                  </button>
                </div>

                <div className="max-h-[500px] overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-white dark:bg-slate-900 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800 z-10">
                      <tr>
                        <th className="px-8 py-4">Applicant</th>
                        <th className="px-4 py-4">Source</th>
                        <th className="px-4 py-4">Submission Details</th>
                        <th className="px-4 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                      {loadingRequests ? (
                        <tr>
                          <td colSpan={4} className="px-8 py-12 text-center text-xs text-slate-400 font-bold uppercase tracking-widest italic">Fetching requests...</td>
                        </tr>
                      ) : activeRequests.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-8 py-12 text-center text-xs text-slate-400 font-bold uppercase tracking-widest italic">No pending requests found</td>
                        </tr>
                      ) : (
                        activeRequests.map((req) => (
                          <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group text-xs">
                            <td className="px-8 py-4 text-left">
                              <div className="font-bold text-slate-900 dark:text-white">{req.email}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">{req.createdAt?.toDate ? req.createdAt.toDate().toLocaleString() : 'N/A'}</div>
                            </td>
                            <td className="px-4 py-4 text-left">
                              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
                                {req.source}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-left max-w-xs">
                              <p className="line-clamp-2 text-slate-500 font-medium leading-relaxed" title={req.details}>
                                {req.details}
                              </p>
                            </td>
                            <td className="px-8 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => {
                                    setAdminMode('invitations');
                                    setInviteEmail(req.email);
                                  }}
                                  className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all"
                                  title="Issue Invite to this User"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteRequest(req.id)}
                                  className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all"
                                  title="Clear Request"
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
          )}

          {adminMode === 'security' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-12"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-8 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-3xl space-y-4">
                  <h3 className="font-black text-rose-700 dark:text-rose-400 text-lg uppercase tracking-tight flex items-center gap-2">
                    <Trash2 className="w-5 h-5" />
                    Purge Positions
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                    Deletes every document in the <code>jobs</code> and <code>companies</code> collections. This action is irreversible.
                  </p>
                  <button
                    onClick={handleClearJobs}
                    disabled={isProcessing}
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50 transition-all py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-rose-200 dark:shadow-none"
                  >
                    Clear Database Entries
                  </button>
                </div>

                <div className="p-8 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900 rounded-3xl space-y-4">
                  <h3 className="font-black text-orange-700 dark:text-orange-400 text-lg uppercase tracking-tight flex items-center gap-2">
                    <Trash2 className="w-5 h-5" />
                    Purge Applications
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                    Deletes every application and matching log in the <code>applications</code> collection. This cleans up seeker dashboards.
                  </p>
                  <button
                    onClick={handleClearApps}
                    disabled={isProcessing}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50 transition-all py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-orange-200 dark:shadow-none"
                  >
                    Clear Match Logs
                  </button>
                </div>
              </div>

              <div className="p-6 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-4">
                <ShieldAlert className="w-10 h-10 text-rose-500 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">Emergency System Lock</h4>
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed">Admin functions perform atomic deletes. Ensure zero active client sessions before flushing environment variables or purging production-adjacent datasets.</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
