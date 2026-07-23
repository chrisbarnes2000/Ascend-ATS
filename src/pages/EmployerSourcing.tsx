import { useState, useEffect } from 'react';
import { JobSeekerProfile } from '../types';
import { Briefcase, Search, Shield, MapPin, CheckCircle2, ChevronRight, Slash, AlertTriangle, EyeOff, Lock, Globe } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../hooks/useAuth';

export function EmployerSourcing({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const { appUser } = useAuth();
  const [candidates, setCandidates] = useState<(JobSeekerProfile & { id: string, uid?: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState('');
  
  // In a real app, these would come from the recruiting firm's logged in profile.
  // We'll mock them so the exclusion functionality is visibly demonstrated.
  const [myCompany, setMyCompany] = useState('Acme Corp');
  const [myIndustry, setMyIndustry] = useState('SaaS');

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const { collectionGroup, getDocs } = await import('firebase/firestore');
      const { db } = await import('../firebase/config');
      
      const snapshot = await getDocs(collectionGroup(db, 'profiles'));
      const results: any[] = [];
      const safeCompany = myCompany.trim().toLowerCase();
      const safeIndustry = myIndustry.trim().toLowerCase();
      
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const privacy = data.privacy || {};
        if (privacy.searchable === false) return;
        
        const excludedCos = (privacy.excludedCompanies || []).map((c: string) => c.toLowerCase());
        const excludedInds = (privacy.excludedIndustries || []).map((c: string) => c.toLowerCase());
        
        if (safeCompany && excludedCos.includes(safeCompany)) return;
        if (safeIndustry && excludedInds.includes(safeIndustry)) return;
        
        const tr = String(data.targetRole || '').toLowerCase();
        if (roleFilter && !tr.includes(roleFilter.toLowerCase())) return;
        
        // Sliding Privacy Level (1: Unrestricted, 2: Masked Contact, 3: Anonymous Persona, 4: Maximum Cloak)
        const currentLevel = privacy.privacyLevel || (privacy.redactPii ? 3 : 1);
        
        if (data.personalInfo) {
          if (currentLevel >= 2) {
            data.personalInfo.email = '[Contact Masked]';
            data.personalInfo.phone = '[Contact Masked]';
            data.personalInfo.linkedinUrl = '';
            data.personalInfo.portfolioUrl = '';
          }
          if (currentLevel >= 3) {
            data.personalInfo.firstName = data.personalInfo.firstName ? data.personalInfo.firstName.charAt(0) + '.' : '';
            data.personalInfo.lastName = data.personalInfo.lastName ? data.personalInfo.lastName.charAt(0) + '.' : '';
            data.personalInfo.preferredName = '';
            data.personalInfo.pronouns = '';
          }
        }

        if (currentLevel >= 4 && data.workExperience) {
          data.workExperience = data.workExperience.map((exp: any) => ({
            ...exp,
            company: '[Redacted Employer]'
          }));
        }
        
        results.push({
          id: docSnap.id,
          uid: docSnap.ref.parent.parent?.id,
          ...data
        });
      });
      
      setCandidates(results);
    } catch (err) {
      console.error("Failed to fetch candidates", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  return (
    <div className={isEmbedded ? "pb-12" : "min-h-screen pt-24 pb-12 px-4 w-full md:w-[75vw] max-w-none mx-auto"}>
      {!isEmbedded && (
        <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-2">Talent Sourcing Engine</h1>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl text-sm leading-relaxed">
              Explore qualified profiles in our passive candidate pool. Results are screened instantly by Ascend’s automated privacy filter, matching target roles while respecting competitor exclusion rules dynamically.
            </p>
          </div>
          
          {/* Mock auth state selectors for demo purposes */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm w-full md:w-auto">
            <h3 className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" /> Simulation Sandbox
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-4 max-w-xs leading-normal">
              Adjust company & industry properties to test candidate exclusion filters in real-time.
            </p>
            <div className="flex gap-4">
              <div>
                <label className="block text-xs mb-1 font-semibold text-slate-600 dark:text-slate-400">Company Name</label>
                <input 
                  type="text" 
                  value={myCompany} 
                  onChange={e => setMyCompany(e.target.value)}
                  onBlur={fetchCandidates}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm rounded-xl focus:ring-1 focus:ring-blue-500 w-36" 
                />
              </div>
              <div>
                <label className="block text-xs mb-1 font-semibold text-slate-600 dark:text-slate-400">Industry Sector</label>
                <input 
                  type="text" 
                  value={myIndustry} 
                  onChange={e => setMyIndustry(e.target.value)}
                  onBlur={fetchCandidates}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm rounded-xl focus:ring-1 focus:ring-blue-500 w-36" 
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search explicitly by Target Role (e.g. Senior Frontend)"
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchCandidates()}
            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/40 focus:border-blue-500 transition-all shadow-sm"
          />
        </div>
        <button 
          onClick={fetchCandidates}
          className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-lg"
        >
          Search
        </button>
      </div>

      {loading ? (
        <div className="p-24 flex items-center justify-center text-slate-400">Loading candidates...</div>
      ) : candidates.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {candidates.map((candidate, i) => {
            const pLevel = candidate.privacy?.privacyLevel || (candidate.privacy?.redactPii ? 3 : 1);
            const isRedacted = pLevel > 1;
            const fullName = `${candidate.personalInfo?.firstName || ''} ${candidate.personalInfo?.lastName || ''}`.trim();
            const location = candidate.personalInfo?.location || 'Remote';
            
            return (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={candidate.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-xl transition-all"
              >
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100 flex-wrap">
                      {fullName || 'Anonymous Candidate'}
                      {pLevel === 2 && (
                        <span className="bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider flex items-center gap-1 border border-sky-200/40">
                          <EyeOff className="w-3 h-3" /> L2: Masked Contact
                        </span>
                      )}
                      {pLevel === 3 && (
                        <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider flex items-center gap-1 border border-amber-200/40">
                          <Slash className="w-3 h-3" /> L3: Anonymous
                        </span>
                      )}
                      {pLevel === 4 && (
                        <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider flex items-center gap-1 border border-indigo-200/40">
                          <Lock className="w-3 h-3" /> L4: Max Cloak
                        </span>
                      )}
                    </h3>
                    <p className="text-blue-600 dark:text-blue-400 font-medium">{candidate.targetRole || 'No Role Specified'}</p>
                  </div>
                </div>

                {isRedacted && (
                   <div className="mb-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-3.5 rounded-2xl flex items-start gap-2.5">
                     <Shield className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                     <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal">
                       <span className="font-bold text-slate-700 dark:text-slate-300">Privacy Protection (Level {pLevel}):</span>{' '}
                       {pLevel === 2 && "Personal contact details are hidden. Connection required."}
                       {pLevel === 3 && "Name is presented as initials and contact parameters are masked. Connection required."}
                       {pLevel === 4 && "Absolute stealth. Contact channels, exact candidate name, and PAST/CURRENT EMPLOYER names are fully redacted."}
                     </p>
                   </div>
                )}

                <div className="space-y-4 mb-6">
                  {candidate.workExperience?.slice(0, 2).map((exp, j) => (
                    <div key={j} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center mt-1 flex-shrink-0">
                        <Briefcase className="w-4 h-4 text-slate-400" />
                      </div>
                      <div>
                        <div className="font-bold text-sm tracking-tight text-slate-900 dark:text-slate-100">{exp.role}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{exp.company} • {exp.startDate}</div>
                      </div>
                    </div>
                  ))}
                  {(!candidate.workExperience || candidate.workExperience.length === 0) && (
                    <div className="text-sm text-slate-400 italic">No experience listed</div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {candidate.skills?.slice(0, 4).map((skillObj, idx) => {
                    const skill = typeof skillObj === 'string' ? skillObj : skillObj.name;
                    return (
                      <span key={idx} className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs px-2 py-1 rounded-md font-medium">
                        {skill}
                        {typeof skillObj !== 'string' && skillObj.years && (
                          <span className="ml-1 opacity-60 font-normal">({skillObj.years}y)</span>
                        )}
                      </span>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm font-medium">
                    <MapPin className="w-4 h-4" /> {location}
                  </div>
                  <a href={`#profile/${candidate.uid}`} className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    View Complete Profile
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="p-24 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-xl font-bold mb-2">No Matching Candidate Profiles</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm text-sm">
            No active profiles match your filter settings, or searching candidates have configured privacy constraints explicitly excluding "{myCompany}" or the "{myIndustry}" industry sector from discovering their professional profiles.
          </p>
        </div>
      )}
    </div>
  );
}
