import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { motion, AnimatePresence } from 'motion/react';
import { Building, Search, Users, MapPin, Briefcase, X, ChevronRight, RefreshCw, Calendar, FileText, Globe, ExternalLink, Linkedin, Twitter } from 'lucide-react';
import { Job } from '../types';

interface CompanyProfile {
  id: string;
  name: string;
  logoUrl?: string;
  description: string;
  industry: string;
  size: string;
  website?: string;
  linkedin?: string;
  twitter?: string;
  github?: string;
  primaryRoles?: string;
  updatedAt?: any;
}

export const CompanyDirectory = () => {
  const [companies, setCompanies] = useState<CompanyProfile[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('All');
  const [selectedSize, setSelectedSize] = useState('All');
  const [selectedCompany, setSelectedCompany] = useState<CompanyProfile | null>(null);

  useEffect(() => {
    // Stream companies
    const unsubscribeCompanies = onSnapshot(collection(db, 'companies'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as CompanyProfile));
      setCompanies(list);
      setLoading(false);
    }, (err) => {
      console.error("Failed to stream companies", err);
      setLoading(false);
    });

    // Stream active jobs to associate count and details
    const jobsQuery = query(collection(db, 'jobs'), where('status', '==', 'active'));
    const unsubscribeJobs = onSnapshot(jobsQuery, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Job));
      setJobs(list);
    }, (err) => {
      console.error("Failed to stream jobs in directory", err);
    });

    return () => {
      unsubscribeCompanies();
      unsubscribeJobs();
    };
  }, []);

  // Filter companies
  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          company.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          company.industry?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesIndustry = selectedIndustry === 'All' || company.industry === selectedIndustry;
    const matchesSize = selectedSize === 'All' || company.size === selectedSize;

    return matchesSearch && matchesIndustry && matchesSize;
  });

  // Extract unique industries for filter dropdown
  const industries = ['All', ...Array.from(new Set(companies.map(c => c.industry).filter(Boolean)))];
  
  // Extract unique sizes
  const sizes = ['All', '1-10', '11-50', '51-200', '201-500', '500+'];

  const getCompanyJobs = (companyId: string) => {
    // Some seeded companyIds might match lowercase/id keys
    return jobs.filter(j => j.companyId === companyId || j.companyName?.toLowerCase() === companyId.toLowerCase());
  };

  const formatJobDate = (createdAt: any) => {
    if (!createdAt) return 'Recently';
    let date: Date;
    if (typeof createdAt.toDate === 'function') {
      date = createdAt.toDate();
    } else if (createdAt instanceof Date) {
      date = createdAt;
    } else if (createdAt.seconds) {
      date = new Date(createdAt.seconds * 1000);
    } else {
      date = new Date(createdAt);
    }
    const diff = Math.abs(new Date().getTime() - date.getTime());
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 w-full md:w-[75vw] max-w-none mx-auto">
      {/* Header section */}
      <div className="mb-12">
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-widest mb-1.5">
          <Building className="w-4 h-4" />
          Partner Organizations
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-3">Company Directory</h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl text-lg">
          Explore employer profiles, industry specializations, workforce sizing, and active job matches across the Ascend automated pipeline.
        </p>
      </div>

      {/* Filter and search bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm mb-10 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by company name, industry, description..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100 placeholder-slate-400 font-medium"
          />
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="flex-1 md:w-48">
            <select
              value={selectedIndustry}
              onChange={e => setSelectedIndustry(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100 font-bold"
            >
              <option disabled>Filter Industry</option>
              {industries.map(ind => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 md:w-44">
            <select
              value={selectedSize}
              onChange={e => setSelectedSize(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100 font-bold"
            >
              <option disabled>Filter Size</option>
              {sizes.map(sz => (
                <option key={sz} value={sz}>{sz === 'All' ? 'All Sizes' : `${sz} employees`}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Directory Grid */}
      {loading ? (
        <div className="p-20 text-center flex flex-col items-center justify-center text-slate-400 gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <span className="font-bold">Retrieving profiles from registry...</span>
        </div>
      ) : filteredCompanies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((company, index) => {
            const companyJobs = getCompanyJobs(company.id);
            return (
              <motion.div
                key={company.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedCompany(company)}
                className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center border border-blue-100/30">
                    <Building className="w-6 h-6" />
                  </div>
                  <span className="bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-bold border border-blue-100 dark:border-blue-900/40">
                    {companyJobs.length} active role{companyJobs.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <h3 className="text-xl font-bold mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {company.name}
                </h3>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-xs font-bold text-slate-400 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                    {company.industry}
                  </span>
                  <span className="text-xs font-bold text-slate-400 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> {company.size} employees
                  </span>
                </div>

                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed mb-6">
                  {company.description || 'No detailed company description provided yet.'}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800 text-xs font-bold text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  <span>Learn more & browse jobs</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="p-16 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center">
          <Building className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No Companies Registered</h3>
          <p className="text-sm text-slate-400 dark:text-slate-500 max-w-md">
            No partner organizations found matching your search. Try adjusting filters or seed company profiles inside the Seeder.
          </p>
        </div>
      )}

      {/* Slide-over Detail Modal */}
      <AnimatePresence>
        {selectedCompany && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCompany(null)}
              className="fixed inset-0 bg-slate-950 z-50"
            />

            {/* Panel */}
            <motion.div 
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-white dark:bg-slate-900 shadow-2xl z-50 overflow-y-auto p-8 border-l border-slate-100 dark:border-slate-800"
            >
              <div className="flex justify-between items-start mb-8">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center border border-blue-100/30">
                  <Building className="w-8 h-8" />
                </div>
                <button 
                  onClick={() => setSelectedCompany(null)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                  <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">{selectedCompany.name}</h2>
                  <a
                    href={`#company/${selectedCompany.id}?name=${encodeURIComponent(selectedCompany.name)}`}
                    onClick={() => setSelectedCompany(null)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 w-fit"
                  >
                    <span>Full Profile & Socials</span>
                    <ChevronRight className="w-4 h-4" />
                  </a>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-3 py-1 rounded-full border border-blue-100/30">
                    {selectedCompany.industry}
                  </span>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full flex items-center gap-1">
                    <Users className="w-4 h-4" /> {selectedCompany.size} employees
                  </span>
                  {selectedCompany.website && (
                    <a
                      href={selectedCompany.website.startsWith('http') ? selectedCompany.website : `https://${selectedCompany.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/50 hover:bg-blue-100 px-3 py-1 rounded-full flex items-center gap-1 transition-all"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Website</span>
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    </a>
                  )}
                </div>
              </div>

              <div className="space-y-6 mb-8">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">About Organization</h4>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm whitespace-pre-wrap bg-slate-50/50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                    {selectedCompany.description || 'No description provided.'}
                  </p>
                </div>

                {selectedCompany.primaryRoles && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Primary Talent Targets</h4>
                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                      {selectedCompany.primaryRoles}
                    </p>
                  </div>
                )}
              </div>

              {/* Active job list inside company */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                  Active Positions at {selectedCompany.name}
                </h3>

                {getCompanyJobs(selectedCompany.id).length > 0 ? (
                  <div className="space-y-4">
                    {getCompanyJobs(selectedCompany.id).map(job => (
                      <div key={job.id} className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-blue-500/30 dark:hover:border-blue-500/30 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/30 dark:bg-slate-950/10">
                        <div>
                          <h4 className="font-bold text-base text-slate-900 dark:text-white mb-1">{job.title}</h4>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 font-semibold">
                            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Remote</span>
                            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Posted {formatJobDate(job.createdAt)}</span>
                          </div>
                        </div>
                        <a 
                          href={`#job/${job.id}`}
                          onClick={() => setSelectedCompany(null)}
                          className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all flex items-center gap-1"
                        >
                          View Job <ChevronRight className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 text-slate-400 text-sm">
                    No active job listings found for this company at the moment.
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
