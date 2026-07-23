import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { collection, getDocs, deleteDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
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
  Building
} from 'lucide-react';

export default function AdminPanel() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, message: '', onConfirm: () => {} });
  const [status, setStatus] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [stats, setStats] = useState({ jobsCount: 0, appsCount: 0, usersCount: 0, companiesCount: 0 });
  const [loadingStats, setLoadingStats] = useState(false);

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
      const deletePromises = querySnapshot.docs.map(docSnap => deleteDoc(docSnap.ref));
      await Promise.all(deletePromises);

      const compSnapshot = await getDocs(collection(db, 'companies'));
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

      {/* Grid Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left/Middle: Seed Categories */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            Simulate Position Injectors
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-4">
            Select specialized mock job segments to automatically inject into the matching index. These bypass constraints and instantly simulate candidates’ matching capabilities.
          </p>

          <div className="mb-6 p-6 bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-3xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest block mb-1">Thorough ATS Pipeline Testing</span>
              <h3 className="text-lg font-bold mb-1">Sample Complete Talent Pool & All Companies</h3>
              <p className="text-slate-300 text-xs max-w-lg">
                Automatically injects sample candidate profiles, recruiters, company directories, and multi-industry positions to test sourcing and ATS workflows.
              </p>
            </div>
            <button
              onClick={handleBulkSeedTalentAndCompanies}
              disabled={isProcessing}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-2xl text-xs font-bold whitespace-nowrap shadow-md transition-all disabled:opacity-50"
            >
              Seed All Talent & Jobs
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sampleJobSets.map((category) => (
              <div 
                key={category.id} 
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-900 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                      Set Group
                    </span>
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                      {category.jobs.length} jobs
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{category.name}</h3>
                  <p className="text-slate-400 text-xs mb-6 line-clamp-2">
                    Includes {category.jobs.map(j => j.title).join(', ')}.
                  </p>
                </div>

                <button
                  onClick={() => handleSeed(category.jobs, category.name)}
                  disabled={isProcessing}
                  className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-50 transition-colors py-3 rounded-2xl text-xs font-bold shadow-md"
                >
                  Seed {category.name} Set
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Sidebar: Dangerous Operations */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <ShieldAlert className="w-5 h-5" />
            Destructive System Flush
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-4">
            Clear mock data segments to clean up your workspace. Highly recommended before testing fresh resume parsing pipelines.
          </p>

          <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 p-6 rounded-3xl space-y-6">
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Purge Positions Collection</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                Deletes all document indexes inside the main <code>jobs</code> collection.
              </p>
              <button
                onClick={handleClearJobs}
                disabled={isProcessing}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50 transition-colors py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-rose-200 dark:shadow-none ring-4 ring-rose-200 dark:ring-rose-900"
              >
                <Trash2 className="w-4 h-4" />
                Clear All Job Listing Entries
              </button>
            </div>

            <hr className="border-rose-200 dark:border-rose-900" />

            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Purge Applications Log</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                Deletes all simulated matches and candidate submissions inside <code>applications</code>.
              </p>
              <button
                onClick={handleClearApps}
                disabled={isProcessing}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50 transition-colors py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-orange-200 dark:shadow-none ring-4 ring-orange-200 dark:ring-orange-900"
              >
                <Trash2 className="w-4 h-4" />
                Purge Candidates Applications
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
