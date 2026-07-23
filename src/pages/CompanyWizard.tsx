import { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { ChevronRight, Check, Building, Briefcase } from 'lucide-react';

export const CompanyWizard = ({ onComplete }: { onComplete: () => void }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    companyName: '',
    industry: '',
    size: '1-10',
    primaryRoles: '',
    description: ''
  });

  const saveProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const profileRef = doc(db, `users/${user.uid}/profiles/company`);

      await setDoc(profileRef, {
        ...profile,
        updatedAt: serverTimestamp()
      });

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
      {/* Progress Bar */}
      <div className="mb-12 flex flex-wrap gap-2 items-center justify-between">
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
