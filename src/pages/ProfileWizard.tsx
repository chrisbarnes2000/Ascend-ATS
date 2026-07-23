import { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { ResumeUpload } from '../components/ResumeUpload';
import { JsonProfileUpload } from '../components/JsonProfileUpload';
import { JobSeekerProfile, WorkExperience, Education } from '../types';
import { ChevronRight, ChevronLeft, Check, Sparkles, Building, GraduationCap, Target, Loader2, FileText, X } from 'lucide-react';

export const ProfileWizard = ({ onComplete }: { onComplete: () => void }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadMode, setUploadMode] = useState<'resume' | 'json'>('resume');
  const [profile, setProfile] = useState<Partial<JobSeekerProfile>>({
    personalInfo: { firstName: '', lastName: '' },
    workExperience: [],
    education: [],
    skills: [],
    targetRole: '',
    targetSalary: 0,
    professionalSummary: '',
    privacy: {
      isPublic: false,
      searchable: true,
      redactPii: false,
      excludedCompanies: [],
      excludedIndustries: [],
      privacyLevel: 1
    }
  });

  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const handleParsedData = (data: any) => {
    setProfile(prev => ({
      ...prev,
      ...data,
      personalInfo: { ...prev.personalInfo, ...data.personalInfo }
    }));
    setStep(2); // Move to review step
  };

  const saveProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const profileRef = doc(db, `users/${user.uid}/profiles/main`);

      console.log("Saving user profile to:", profileRef.path);
      await setDoc(profileRef, {
        ...profile,
        updatedAt: serverTimestamp()
      });

      console.log("Marking user doc as profileCompleted:", userRef.path);
      await setDoc(userRef, { profileCompleted: true }, { merge: true });
      onComplete();
    } catch (err) {
      console.error('Error saving profile in wizard:', err);
      // If it's a permission error, maybe log some context
      if (err instanceof Error && err.message.includes('permission')) {
        console.error("Permission denied. Auth state:", { 
          uid: user.uid, 
          email: user.email,
          authDomain: window.location.hostname
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full md:w-[75vw] max-w-none mx-auto pt-24 pb-12 px-4">
      {/* Progress Bar */}
      <div className="mb-12 flex flex-wrap gap-2 items-center justify-between">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
              step >= s ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}>
              {step > s ? <Check className="w-5 h-5" /> : s}
            </div>
            {s < 4 && (
              <div className={`w-12 h-1 md:w-32 bg-slate-200 dark:bg-slate-800 ml-2 mr-2 ${step > s ? 'bg-blue-600 dark:bg-blue-600' : ''}`} />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100 dark:border-slate-800">
        {step === 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-bold mb-4 flex items-center gap-3">
                Let's build your master profile
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-lg">
                Upload your resume document or structured JSON profile to get started immediately.
              </p>
            </div>

            {/* Toggle tabs */}
            <div className="flex border-b border-slate-150 dark:border-slate-800 pb-1">
              <button
                type="button"
                onClick={() => setUploadMode('resume')}
                className={`pb-3 px-4 font-bold text-sm transition-all relative ${
                  uploadMode === 'resume'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Upload Resume Document
                {uploadMode === 'resume' && (
                  <motion.div
                    layoutId="uploadTabLine"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 dark:bg-blue-400 rounded-full"
                  />
                )}
              </button>
              <button
                type="button"
                onClick={() => setUploadMode('json')}
                className={`pb-3 px-4 font-bold text-sm transition-all relative ${
                  uploadMode === 'json'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Import Profile JSON
                {uploadMode === 'json' && (
                  <motion.div
                    layoutId="uploadTabLine"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 dark:bg-blue-400 rounded-full"
                  />
                )}
              </button>
            </div>

            {uploadMode === 'resume' ? (
              <ResumeUpload onParsed={handleParsedData} />
            ) : (
              <JsonProfileUpload onParsed={handleParsedData} />
            )}
            
            <button 
              onClick={() => setStep(2)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium flex items-center gap-2 text-sm"
            >
              Skip and enter manually <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <span className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Building className="w-5 h-5" /></span>
                Work Experience
              </h2>
              {profile.resumePreviewUrl && (
                <button 
                  onClick={() => setShowPreviewModal(true)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
                >
                  <FileText className="w-4 h-4" /> Preview Uploaded Resume
                </button>
              )}
            </div>
            
            <div className="space-y-4">
              {profile.workExperience?.map((exp, i) => (
                <div key={i} className="p-6 rounded-2xl border border-slate-200 hover:border-blue-200 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg">{exp.role}</h3>
                    <span className="text-sm text-slate-400">{exp.startDate} - {exp.endDate || 'Present'}</span>
                  </div>
                  <p className="text-blue-600 font-medium mb-2">{exp.company}</p>
                  <p className="text-slate-500 text-sm">{exp.description}</p>
                </div>
              ))}
              <button className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-blue-300 hover:text-blue-500 transition-all font-medium flex items-center justify-center gap-2">
                <Plus className="w-5 h-5" /> Add Experience
              </button>
            </div>

            <div className="flex justify-between pt-8">
              <button onClick={() => setStep(1)} className="px-6 py-3 text-slate-500 font-bold">Back</button>
              <button onClick={() => setStep(3)} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 shadow-xl transition-all flex items-center gap-2">
                Continue <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><Target className="w-5 h-5" /></span>
              Target Preferences
            </h2>

            <div className="grid gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Target Role</label>
                <input 
                  type="text" 
                  value={profile.targetRole}
                  onChange={(e) => setProfile({...profile, targetRole: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
                  placeholder="e.g. Senior Frontend Engineer"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Target Salary (USD/Year)</label>
                <input 
                  type="number" 
                  value={profile.targetSalary}
                  onChange={(e) => setProfile({...profile, targetSalary: parseInt(e.target.value)})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div className="flex justify-between pt-8">
              <button onClick={() => setStep(2)} className="px-6 py-3 text-slate-500 font-bold">Back</button>
              <button onClick={() => setStep(4)} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 shadow-xl transition-all flex items-center gap-2">
                Continue <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-8 py-12">
            <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-4xl font-bold mb-4">You're all set!</h2>
              <p className="text-slate-500 text-lg max-w-md mx-auto">
                Your master profile is ready. We'll start matching you with jobs that fit your preferences immediately.
              </p>
            </div>

            <div className="flex flex-col gap-4 max-w-sm mx-auto pt-8">
              <button 
                onClick={saveProfile}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Launch Dashboard'}
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Resume Preview Modal */}
      {showPreviewModal && profile.resumePreviewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-4 md:p-6 max-w-4xl w-full h-[85vh] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" /> Original Resume Preview
              </h2>
              <button 
                onClick={() => setShowPreviewModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden relative">
               <iframe 
                 src={profile.resumePreviewUrl} 
                 className="absolute inset-0 w-full h-full border-0"
                 title="Resume Preview"
               />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const Plus = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);
