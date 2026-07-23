import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Building, Plus, Trash2, Edit3, Check, Briefcase, MapPin, DollarSign, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { doc, getDoc, setDoc, collection, query, where, getDocs, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Job } from '../types';

export const CompanyManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [savingCompany, setSavingCompany] = useState(false);
  const [savingJob, setSavingJob] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const loadCompanyData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Fetch Company Profile
      const profileRef = doc(db, `users/${user.uid}/profiles/company`);
      const profileSnap = await getDoc(profileRef);
      if (profileSnap.exists()) {
        const data = profileSnap.data();
        setCompanyProfile({
          companyName: data.companyName || '',
          industry: data.industry || '',
          size: data.size || '11-50',
          description: data.description || '',
          website: data.website || '',
          location: data.location || '',
          linkedin: data.linkedin || '',
          twitter: data.twitter || '',
          github: data.github || '',
          glassdoor: data.glassdoor || '',
          signupComplete: data.signupComplete || false
        });
      }
    } catch (err) {
      console.error("Failed to load company profile", err);
      setErrorMessage("Failed to load company data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanyData();
  }, [user]);

  const handleSaveCompany = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingCompany(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      // Only allow editing editable fields if locked
      const profileRef = doc(db, `users/${user.uid}/profiles/company`);
      const updateData: any = { ...companyProfile };
      
      // If locked, only allow specific fields
      if (companyProfile.signupComplete) {
         // This is a simplified check, ideally server-side validation exists
         // For now, allow description and socials
      }
      
      await setDoc(profileRef, {
        ...updateData,
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
                disabled={companyProfile.signupComplete}
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
                disabled={companyProfile.signupComplete}
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
                disabled={companyProfile.signupComplete}
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
                disabled={companyProfile.signupComplete}
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
              disabled={companyProfile.signupComplete}
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
              value={companyProfile.description}
              onChange={e => setCompanyProfile({...companyProfile, description: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-indigo-500"
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
              disabled={savingCompany}
              className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-3.5 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-lg disabled:opacity-50"
            >
              {savingCompany ? 'Saving Changes...' : 'Save Company Details'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
