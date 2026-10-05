import { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { ChevronRight, Check, Building, Briefcase, FileCode, X } from 'lucide-react';
import { JsonProfileUpload } from '../components/JsonProfileUpload';

export const CompanyWizard = ({ onComplete }: { onComplete: () => void }) => {
  const { user, appUser } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showJsonUpload, setShowJsonUpload] = useState(false);
  const [profile, setProfile] = useState({
    companyName: appUser?.companyName || '',
    industry: '',
    size: '1-10',
    primaryRoles: '',
    description: ''
  });

  const handleParsedRecruiter = (data: any) => {
    const raw = data.parsedData || {};
    const org = raw.organization || {};
    const bio = raw.professional_bio || {};
    
    setProfile(prev => ({
      ...prev,
      companyName: org.company_name || data.workExperience?.[0]?.company || prev.companyName,
      industry: org.industry || prev.industry,
      size: org.size || prev.size,
      primaryRoles: Array.isArray(raw.sourcing_specialties) 
        ? raw.sourcing_specialties.join(', ') 
        : (data.skills ? data.skills.map((s: any) => s.name).join(', ') : prev.primaryRoles),
      description: bio.summary || data.professionalSummary || prev.description
    }));
    setShowJsonUpload(false);
  };

  const saveProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const profileRef = doc(db, `users/${user.uid}/profiles/company`);

      await setDoc(profileRef, {
        ...profile,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // If recruiter, establish verified public recruiter profile
      if (appUser?.accountType === 'recruiter' || appUser?.staffingRole === 'recruiter') {
        const recruiterRef = doc(db, `users/${user.uid}/profiles/recruiter`);
        await setDoc(recruiterRef, {
          personalInfo: {
            firstName: user.displayName?.split(' ')[0] || user.email?.split('@')[0] || 'Recruiter',
            lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
            title: 'Talent Acquisition Partner',
            email: user.email || '',
            location: 'Remote'
          },
          bio: profile.description || 'Specialized talent partner dedicated to matching top candidates with high-impact teams.',
          specialties: profile.primaryRoles ? profile.primaryRoles.split(',').map((s: string) => s.trim()) : ['Technical Sourcing', 'Engineering'],
          companyId: appUser?.activeCompanyId || appUser?.companyId || '',
          companyName: profile.companyName || appUser?.companyName || '',
          isPublic: true,
          yearsExperience: 3,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }

      // If company owner, register company record with ownership
      if (appUser?.accountType === 'companyOwner' || appUser?.accountType === 'company') {
        const effectiveCompanyId = appUser?.activeCompanyId || appUser?.companyId || user.uid;
        const mainCompanyRef = doc(db, 'companies', effectiveCompanyId);
        await setDoc(mainCompanyRef, {
          companyName: profile.companyName,
          industry: profile.industry,
          size: profile.size,
          description: profile.description,
          ownerUserId: user.uid,
          updatedAt: serverTimestamp()
        }, { merge: true });

        await setDoc(userRef, {
          companyId: effectiveCompanyId,
          activeCompanyId: effectiveCompanyId,
          companyName: profile.companyName,
          activeCompanyName: profile.companyName
        }, { merge: true });
      }

      await setDoc(userRef, { profileCompleted: true }, { merge: true });
      onComplete();
    } catch (err) {
      console.error('Error saving company profile:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full md:w-[75vw] max-w-none mx-auto pt-24 pb-12 px-4">
      {/* Sticky Progress Bar */}
      <div className="sticky top-16 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md py-4 mb-8 -mx-4 px-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-wrap gap-2 items-center justify-between transition-all">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
              step >= s ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
            }`}>
              {step > s ? <Check className="w-5 h-5" /> : s}
            </div>
            {s < 2 && (
              <div className={`w-12 h-1 md:w-32 bg-slate-200 dark:bg-slate-800 ml-2 mr-2 ${step > s ? 'bg-indigo-600' : ''}`} />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100 dark:border-slate-800">
        {step === 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-bold mb-4 flex items-center gap-3">
                <span className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><Building className="w-6 h-6" /></span>
                Tell us about your organization
              </h1>
              <p className="text-slate-500 text-lg">
                Setting up your recruiter profile helps us tailor candidate matches to your exact industry and needs.
              </p>
            </div>

            {/* Recruiter JSON Import Trigger */}
            <div className="flex items-center justify-between p-4 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/40">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                  <FileCode className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Have an existing Recruiter Profile JSON?
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Import your company, sourcing specialties, and narrative automatically.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowJsonUpload(!showJsonUpload)}
                className="px-3.5 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-50 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold border border-indigo-200 dark:border-indigo-800 transition-colors"
              >
                {showJsonUpload ? 'Close Importer' : 'Import JSON'}
              </button>
            </div>

            {showJsonUpload && (
              <div className="p-6 bg-slate-50 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 animate-in fade-in duration-300">
                <JsonProfileUpload onParsed={handleParsedRecruiter} />
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">Company Name</label>
                <input 
                  type="text" 
                  value={profile.companyName}
                  onChange={e => setProfile({...profile, companyName: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-indigo-500" 
                  placeholder="e.g. Acme Corp" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2">Industry</label>
                  <input 
                    type="text" 
                    value={profile.industry}
                    onChange={e => setProfile({...profile, industry: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-indigo-500" 
                    placeholder="e.g. SaaS, Healthcare" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Company Size</label>
                  <select 
                    value={profile.size}
                    onChange={e => setProfile({...profile, size: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option>1-10</option>
                    <option>11-50</option>
                    <option>51-200</option>
                    <option>201-500</option>
                    <option>500+</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-8">
              <button 
                disabled={!profile.companyName || !profile.industry}
                onClick={() => setStep(2)} 
                className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-xl transition-all flex items-center gap-2 disabled:opacity-50"
              >
                Continue <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><Briefcase className="w-5 h-5" /></span>
              Sourcing Goals
            </h2>
            <p className="text-slate-500 text-lg">
              What kind of talent are you looking for right now?
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">Typical Roles</label>
                <input 
                  type="text" 
                  value={profile.primaryRoles}
                  onChange={e => setProfile({...profile, primaryRoles: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-indigo-500" 
                  placeholder="e.g. Frontend Engineer, Product Manager" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">Brief Company Description</label>
                <textarea 
                  value={profile.description}
                  onChange={e => setProfile({...profile, description: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-indigo-500 h-32" 
                  placeholder="What makes your company a great place to work?" 
                />
              </div>
            </div>

            <div className="flex justify-between pt-8">
              <button onClick={() => setStep(1)} className="px-6 py-3 text-slate-500 font-bold">Back</button>
              <button 
                onClick={saveProfile} 
                disabled={loading}
                className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-xl transition-all flex items-center gap-2"
              >
                {loading ? 'Saving...' : 'Complete Setup'} <Check className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
