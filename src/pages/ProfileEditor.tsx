import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { JobSeekerProfile, PrivacySettings } from '../types';
import { ExperienceEditor } from '../components/profile/ExperienceEditor';
import { PersonalInfoEditor } from '../components/profile/PersonalInfoEditor';
import { PrivacyControls } from '../components/profile/PrivacyControls';
import { DeiAccommodationsEditor } from '../components/profile/DeiAccommodationsEditor';
import { SectionOrderEditor } from '../components/profile/SectionOrderEditor';
import { SkillsEditor } from '../components/profile/SkillsEditor';
import { LocationEditor } from '../components/profile/LocationEditor';
import { IndustryEditor } from '../components/profile/IndustryEditor';
import { TargetIndicatorsEditor } from '../components/profile/TargetIndicatorsEditor';
import { JsonProfileUpload } from '../components/JsonProfileUpload';
import { sanitizeFirestorePayload } from '../utils/firestoreSanitizer';
import { Loader2, Save, ArrowLeft, Shield, FileCode, Heart, Move, X, Zap, CheckCircle2, Target } from 'lucide-react';

const defaultPrivacy: PrivacySettings = {
  isPublic: false,
  searchable: true,
  redactPii: false,
  excludedCompanies: [],
  excludedIndustries: [],
  privacyLevel: 1
};

const standardBenefits = [
  "Health Insurance",
  "Dental & Vision",
  "401(k) Matching",
  "Remote / Hybrid Work",
  "Flexible Working Hours",
  "Unlimited or Generous PTO",
  "Paid Parental Leave",
  "Wellness / Gym Stipend",
  "Tuition Reimbursement",
  "Professional Development Budget"
];

export const ProfileEditor = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Partial<JobSeekerProfile> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'basics' | 'targets' | 'experience' | 'skills' | 'dei_accommodations' | 'privacy' | 'layout_ordering' | 'import_json'>('basics');
  const [customBenefit, setCustomBenefit] = useState('');

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const toggleBenefit = (benefit: string) => {
    if (!profile) return;
    const current = profile.targetBenefits || [];
    const updated = current.includes(benefit)
      ? current.filter(b => b !== benefit)
      : [...current, benefit];
    setProfile({ ...profile, targetBenefits: updated });
  };

  const addCustomBenefit = (e: FormEvent) => {
    e.preventDefault();
    if (!profile || !customBenefit.trim()) return;
    const current = profile.targetBenefits || [];
    const trimmed = customBenefit.trim();
    if (!current.includes(trimmed)) {
      setProfile({ ...profile, targetBenefits: [...current, trimmed] });
    }
    setCustomBenefit('');
  };

  const removeCustomBenefit = (benefit: string) => {
    if (!profile) return;
    const current = profile.targetBenefits || [];
    setProfile({ ...profile, targetBenefits: current.filter(b => b !== benefit) });
  };

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;
      try {
        const profileRef = doc(db, `users/${user.uid}/profiles/main`);
        const snapshot = await getDoc(profileRef);
        if (snapshot.exists()) {
          const data = snapshot.data() as JobSeekerProfile;
          if (!data.privacy) {
            data.privacy = { ...defaultPrivacy };
          } else {
            // Map legacy redactPii to appropriate privacyLevel
            if (data.privacy.privacyLevel === undefined) {
              data.privacy.privacyLevel = data.privacy.redactPii ? 3 : 1;
            }
          }
          setProfile(data);
        } else {
          // If no profile exists yet (e.g. wiped or brand new user), initialize a clean slate!
          setProfile({
            personalInfo: {
              fullName: user.displayName || '',
              email: user.email || '',
              phone: '',
              avatarUrl: user.photoURL || '',
              preferredPronouns: '',
              githubUrl: '',
              linkedinUrl: '',
              portfolioUrl: '',
              location: '',
            },
            professionalSummary: '',
            targetRole: '',
            targetSalary: 0,
            workExperience: [],
            education: [],
            skills: [],
            resumes: [],
            privacy: defaultPrivacy,
            sectionOrder: ['personalInfo', 'professionalSummary', 'workExperience', 'education', 'skills', 'dei_accommodations']
          });
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user || !profile) return;
    setSaving(true);
    setNotification(null);
    try {
      const profileRef = doc(db, `users/${user.uid}/profiles/main`);
      const payload = sanitizeFirestorePayload({
        ...profile,
        updatedAt: serverTimestamp()
      });
      await setDoc(profileRef, payload, { merge: true });
      setNotification({ type: 'success', message: 'Profile saved successfully!' });
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      console.error("Error saving profile", err);
      setNotification({ type: 'error', message: err?.message || 'Error saving profile.' });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  if (!profile) return <div className="p-8">No profile found.</div>;

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="w-full md:w-[75vw] max-w-none mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => { window.location.hash = ''; }} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            </button>
            <h1 className="text-3xl font-bold">Edit Profile</h1>
          </div>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-slate-100 shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save Changes
          </button>
        </div>

        {notification && (
          <div
            role="status"
            aria-live="polite"
            className={`mb-6 p-4 rounded-2xl border flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 ${
              notification.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <X className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
              )}
              <span className="text-sm font-semibold">{notification.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="p-1 rounded-lg hover:opacity-75 focus-visible:ring-2 focus-visible:ring-current"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col md:flex-row min-h-[600px]">
          {/* Sidebar */}
          <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-900/50 border-r border-slate-100 dark:border-slate-800 p-6 flex flex-col gap-2">
            <button 
              onClick={() => setActiveTab('basics')}
              className={`text-left px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'basics' ? 'bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              Basic Info
            </button>
            <button 
              onClick={() => setActiveTab('targets')}
              className={`text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-between ${activeTab === 'targets' ? 'bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              Target Indicators <Target className="w-4 h-4 text-blue-500" />
            </button>
            <button 
              onClick={() => setActiveTab('experience')}
              className={`text-left px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'experience' ? 'bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              Experience
            </button>
            <button 
              onClick={() => setActiveTab('skills')}
              className={`text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-between ${activeTab === 'skills' ? 'bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              Skills & Tech <Zap className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setActiveTab('dei_accommodations')}
              className={`text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-between ${activeTab === 'dei_accommodations' ? 'bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              DEI & Accommodations <Heart className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setActiveTab('privacy')}
              className={`text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-between ${activeTab === 'privacy' ? 'bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              Privacy & Sec <Shield className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setActiveTab('layout_ordering')}
              className={`text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-between ${activeTab === 'layout_ordering' ? 'bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              Layout Ordering <Move className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setActiveTab('import_json')}
              className={`text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-between ${activeTab === 'import_json' ? 'bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              Import JSON <FileCode className="w-4 h-4" />
            </button>
            <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
              <a 
                href="#onboarding"
                className="w-full block text-center px-4 py-3 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Rebuild Profile
              </a>
              <p className="text-xs text-slate-400 mt-2 text-center px-2">Run the parsing wizard again to rebuild from scratch.</p>
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 p-4 sm:p-6 md:p-8 min-w-0 w-full overflow-hidden">
            {activeTab === 'basics' && profile.personalInfo && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <PersonalInfoEditor 
                  info={profile.personalInfo} 
                  onChange={(info) => setProfile({ ...profile, personalInfo: info })} 
                />
                
                {/* Target Indicators Sub-Section */}
                <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                  <TargetIndicatorsEditor 
                    profile={profile as JobSeekerProfile} 
                    onChange={(updates) => setProfile((prev) => prev ? { ...prev, ...updates } : updates)} 
                  />
                </div>
              </div>
            )}

            {activeTab === 'targets' && profile && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <TargetIndicatorsEditor 
                  profile={profile as JobSeekerProfile} 
                  onChange={(updates) => setProfile((prev) => prev ? { ...prev, ...updates } : updates)} 
                />
              </div>
            )}

            {activeTab === 'experience' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <ExperienceEditor 
                  experiences={profile.workExperience || []} 
                  onChange={(exp) => setProfile({ ...profile, workExperience: exp })} 
                />
              </div>
            )}

            {activeTab === 'skills' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <SkillsEditor 
                  skills={profile.skills || []} 
                  targetRole={profile.targetRole}
                  onChange={async (newSkills) => {
                    setProfile(prev => prev ? { ...prev, skills: newSkills } : null);
                    if (user) {
                      try {
                        const profileRef = doc(db, `users/${user.uid}/profiles/main`);
                        await setDoc(profileRef, {
                          skills: newSkills,
                          updatedAt: serverTimestamp()
                        }, { merge: true });
                      } catch (err) {
                        console.error("Error auto-saving skills:", err);
                      }
                    }
                  }} 
                />
              </div>
            )}

            {activeTab === 'dei_accommodations' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-bold mb-6">DEI & Interview Accommodations</h2>
                <DeiAccommodationsEditor 
                  data={profile.deiAndAccommodations} 
                  onChange={(deiData) => setProfile({ ...profile, deiAndAccommodations: deiData })} 
                />
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-bold mb-6">Privacy & Security</h2>
                <PrivacyControls 
                  settings={profile.privacy || defaultPrivacy} 
                  onChange={async (privacy) => {
                    setProfile({ ...profile, privacy });
                    if (user) {
                      try {
                        const profileRef = doc(db, `users/${user.uid}/profiles/main`);
                        await setDoc(profileRef, {
                          privacy,
                          updatedAt: serverTimestamp()
                        }, { merge: true });
                      } catch (err) {
                        console.error("Error auto-saving privacy settings:", err);
                      }
                    }
                  }} 
                />
              </div>
            )}

            {activeTab === 'layout_ordering' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-bold mb-6">Layout & Section Ordering</h2>
                <SectionOrderEditor 
                  order={profile.sectionOrder || []}
                  onChange={async (order) => {
                    setProfile({ ...profile, sectionOrder: order });
                    if (user) {
                      try {
                        const profileRef = doc(db, `users/${user.uid}/profiles/main`);
                        await setDoc(profileRef, {
                          sectionOrder: order,
                          updatedAt: serverTimestamp()
                        }, { merge: true });
                      } catch (err) {
                        console.error("Error auto-saving section order:", err);
                      }
                    }
                  }}
                />
              </div>
            )}

            {activeTab === 'import_json' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                <h2 className="text-2xl font-bold">Import Profile JSON</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Upload a structured JSON file containing your technical competencies, accommodations, and working style preferences. This will update your editor profile local state immediately.
                </p>
                <JsonProfileUpload 
                  onParsed={(data) => {
                    setProfile(prev => ({
                      ...prev,
                      ...data,
                      personalInfo: { ...prev?.personalInfo, ...data.personalInfo },
                      privacy: { ...prev?.privacy, ...data.privacy }
                    }));
                    alert("JSON Profile successfully parsed! Please check the fields in other tabs and click the 'Save Changes' button at the top right to commit to the database.");
                    setActiveTab('basics');
                  }} 
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
