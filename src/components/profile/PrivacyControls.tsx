import { PrivacySettings } from '../../types';
import { Shield, EyeOff, Building, Search, X, Globe, Copy, Check, Trash2, AlertTriangle, Loader2, Lock } from 'lucide-react';
import { useState, FormEvent } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { doc, deleteDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';

interface Props {
  settings: PrivacySettings;
  onChange: (settings: PrivacySettings) => void;
}

export function PrivacyControls({ settings, onChange }: Props) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [newCompany, setNewCompany] = useState('');
  const [newIndustry, setNewIndustry] = useState('');
  const [wipeConfirmText, setWipeConfirmText] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [wiping, setWiping] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const addCompany = (e: FormEvent) => {
    e.preventDefault();
    if (!newCompany.trim()) return;
    onChange({ 
      ...settings, 
      excludedCompanies: [...(settings.excludedCompanies || []), newCompany.trim()]
    });
    setNewCompany('');
  };

  const removeCompany = (index: number) => {
    const list = [...(settings.excludedCompanies || [])];
    list.splice(index, 1);
    onChange({ ...settings, excludedCompanies: list });
  };

  const addIndustry = (e: FormEvent) => {
    e.preventDefault();
    if (!newIndustry.trim()) return;
    onChange({ 
      ...settings, 
      excludedIndustries: [...(settings.excludedIndustries || []), newIndustry.trim()]
    });
    setNewIndustry('');
  };

  const removeIndustry = (index: number) => {
    const list = [...(settings.excludedIndustries || [])];
    list.splice(index, 1);
    onChange({ ...settings, excludedIndustries: list });
  };

  const handleWipeData = async () => {
    if (!user || wipeConfirmText !== 'WIPE') return;
    setWiping(true);
    try {
      // 1. Delete main profile
      const profileRef = doc(db, `users/${user.uid}/profiles/main`);
      await deleteDoc(profileRef);

      // 2. Query and delete all application documents where seekerId == user.uid
      const appsQuery = query(collection(db, 'applications'), where('seekerId', '==', user.uid));
      const appsSnap = await getDocs(appsQuery);
      const deletePromises = appsSnap.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // 3. Clear confirm input
      setWipeConfirmText('');
      alert("All profile details and historical application records have been successfully and permanently purged.");
      window.location.reload(); // Reload to refresh application state cleanly
    } catch (err) {
      console.error("Error wiping professional data:", err);
      alert("An error occurred while purging your professional data. Please try again.");
    } finally {
      setWiping(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || deleteConfirmText !== 'DELETE') return;
    setDeleting(true);
    try {
      // 1. Delete main profile
      const profileRef = doc(db, `users/${user.uid}/profiles/main`);
      await deleteDoc(profileRef);

      // 2. Delete applications
      const appsQuery = query(collection(db, 'applications'), where('seekerId', '==', user.uid));
      const appsSnap = await getDocs(appsQuery);
      const deletePromises = appsSnap.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // 3. Update or delete user doc to reflect termination status
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        accountDeleteRequested: true,
        deletedAt: new Date().toISOString()
      }, { merge: true });

      // 4. Try to delete Auth user
      try {
        await user.delete();
        alert("Your account has been permanently terminated. All data has been securely deleted.");
      } catch (authErr) {
        console.warn("Auth user deletion skipped (requires recent login or custom flows):", authErr);
        alert("Account records scheduled for termination. You will now be logged out as all personal data has been erased.");
        // Sign out user since the auth session can't be hard-deleted right now
        const { auth } = await import('../../firebase/config');
        const { signOut } = await import('firebase/auth');
        await signOut(auth);
      }
      window.location.hash = '';
      window.location.reload();
    } catch (err) {
      console.error("Error deleting user account:", err);
      alert("An error occurred while deleting your account. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8 min-w-0">
      {/* Public Link Sharing */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0 flex-1">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-lg shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">Public Profile Page</h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">Generate a unique public link to share your professional profile with anyone outside Ascend ATS.</p>
            </div>
          </div>
          <div className="shrink-0 pl-14 sm:pl-0">
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={settings.isPublic || false}
                onChange={(e) => onChange({ ...settings, isPublic: e.target.checked })}
              />
              <div className="relative w-11 h-6 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        </div>

        {(settings.isPublic) && user && (
          <div className="mt-4 pl-0 sm:pl-14">
            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 overflow-hidden min-w-0">
              <span className="text-xs font-mono select-all text-slate-600 dark:text-slate-400 break-all sm:truncate min-w-0 flex-1">
                {window.location.origin}/#profile/{user.uid}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/#profile/${user.uid}`);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-1 shrink-0 w-full sm:w-auto"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Searchability */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm min-w-0">
        <div className="flex items-start gap-4 min-w-0 flex-1">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-lg shrink-0">
            <Search className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">Public Searchability</h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">Allow authorized employers and staffing firms to find your profile in search results.</p>
          </div>
        </div>
        <div className="shrink-0 pl-14 sm:pl-0">
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input 
              type="checkbox" 
              className="sr-only peer"
              checked={settings.searchable}
              onChange={(e) => onChange({ ...settings, searchable: e.target.checked })}
            />
            <div className="relative w-11 h-6 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
        </div>
      </div>

      {/* Sliding Data Privacy Levels (1-4) */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0">
            <Shield className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base sm:text-lg">Candidate Data Privacy Level</h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Control your visibility using our sliding data-masking engine. Slide to dynamically redact personal data, contact methods, and past/current employers.
            </p>
          </div>
        </div>

        {/* The Slider Control */}
        <div className="space-y-4">
          <div className="flex justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1">
            <span>Level 1: Unrestricted</span>
            <span>Level 4: Maximum Cloak</span>
          </div>

          <div className="relative">
            <input 
              type="range" 
              min="1" 
              max="4" 
              step="1" 
              value={settings.privacyLevel || (settings.redactPii ? 3 : 1)}
              onChange={(e) => {
                const lvl = parseInt(e.target.value, 10);
                onChange({ 
                  ...settings, 
                  privacyLevel: lvl,
                  redactPii: lvl > 1 // Sync with legacy redactPii property for code compatibility
                });
              }}
              className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
            {/* Tick Marks */}
            <div className="flex justify-between px-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-2">
              <span className={(settings.privacyLevel || (settings.redactPii ? 3 : 1)) === 1 ? "text-indigo-600 dark:text-indigo-400" : ""}>L1: Unrestricted</span>
              <span className={(settings.privacyLevel || (settings.redactPii ? 3 : 1)) === 2 ? "text-indigo-600 dark:text-indigo-400" : ""}>L2: Masked Contact</span>
              <span className={(settings.privacyLevel || (settings.redactPii ? 3 : 1)) === 3 ? "text-indigo-600 dark:text-indigo-400" : ""}>L3: Anonymous Persona</span>
              <span className={(settings.privacyLevel || (settings.redactPii ? 3 : 1)) === 4 ? "text-indigo-600 dark:text-indigo-400" : ""}>L4: Max Cloak</span>
            </div>
          </div>
        </div>

        {/* Visual Level Detail Cards */}
        {(() => {
          const currentLevel = settings.privacyLevel || (settings.redactPii ? 3 : 1);
          return (
            <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  {currentLevel === 1 && <><Globe className="w-4 h-4" /> Active Level: L1 (Standard / Public)</>}
                  {currentLevel === 2 && <><EyeOff className="w-4 h-4" /> Active Level: L2 (Contact Masked)</>}
                  {currentLevel === 3 && <><Shield className="w-4 h-4" /> Active Level: L3 (Anonymous Persona)</>}
                  {currentLevel === 4 && <><Lock className="w-4 h-4" /> Active Level: L4 (Maximum Cloak)</>}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {currentLevel === 1 && "Lowest Privacy"}
                  {currentLevel === 2 && "Balanced Protection"}
                  {currentLevel === 3 && "High Anonymity"}
                  {currentLevel === 4 && "Maximum Shield"}
                </span>
              </div>

              <div className="text-xs sm:text-sm text-slate-750 dark:text-slate-350 leading-relaxed font-medium">
                {currentLevel === 1 && "Your profile is fully searchable. Recruiters can view your full name, work experience, current employers, and direct contact details."}
                {currentLevel === 2 && "Recruiters can see your full name, resume portfolio, and professional experience, but your phone, email, LinkedIn, and personal websites are completely hidden until you authorize a connection."}
                {currentLevel === 3 && "Sourcing employers can only see your initials (e.g. 'J. D.') and work history. All contact parameters are masked. Your full name is only shared once you manually approve their invitation."}
                {currentLevel === 4 && "Absolute stealth. Your contact info is masked, your name is anonymized, and all company and employer names in your work history are dynamically redacted (e.g. 'Acme Corp' is replaced with '[Redacted Employer]') so your current employer can never find you."}
              </div>

              {/* Grid of Visibilities */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200/50 dark:border-slate-800/50 text-xs">
                <div>
                  <h4 className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 text-[10px]">What is Visible</h4>
                  <ul className="space-y-1.5">
                    <li className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      <span className="text-emerald-500 font-bold">✓</span> Target Role & Skills
                    </li>
                    <li className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      <span className="text-emerald-500 font-bold">✓</span> Professional Summary
                    </li>
                    <li className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      {currentLevel <= 2 ? (
                        <><span className="text-emerald-500 font-bold">✓</span> Full Name</>
                      ) : (
                        <><span className="text-slate-300 dark:text-slate-700 font-bold">—</span> Initials Only</>
                      )}
                    </li>
                    <li className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      {currentLevel <= 3 ? (
                        <><span className="text-emerald-500 font-bold">✓</span> Past/Current Employers</>
                      ) : (
                        <><span className="text-slate-300 dark:text-slate-700 font-bold">—</span> Employers Hidden</>
                      )}
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 text-[10px]">What is Masked/Redacted</h4>
                  <ul className="space-y-1.5">
                    <li className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      {currentLevel >= 2 ? (
                        <><span className="text-amber-500 font-bold">🔒</span> Email & Phone Number</>
                      ) : (
                        <><span className="text-slate-300 dark:text-slate-700 font-bold">—</span> Fully Visible</>
                      )}
                    </li>
                    <li className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      {currentLevel >= 2 ? (
                        <><span className="text-amber-500 font-bold">🔒</span> Social & Portfolio URLs</>
                      ) : (
                        <><span className="text-slate-300 dark:text-slate-700 font-bold">—</span> Fully Visible</>
                      )}
                    </li>
                    <li className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      {currentLevel >= 3 ? (
                        <><span className="text-amber-500 font-bold">🔒</span> Legal First & Last Name</>
                      ) : (
                        <><span className="text-slate-300 dark:text-slate-700 font-bold">—</span> Fully Visible</>
                      )}
                    </li>
                    <li className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      {currentLevel >= 4 ? (
                        <><span className="text-amber-500 font-bold">🔒</span> Employer Company Names</>
                      ) : (
                        <><span className="text-slate-300 dark:text-slate-700 font-bold">—</span> Fully Visible</>
                      )}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Exclusions */}
      <div className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm min-w-0">
        <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-lg shrink-0">
          <EyeOff className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">Exclusion Zones</h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">Prevent specific companies or entire industries from seeing your profile. Useful for hiding from your current employer.</p>
          
          <div className="space-y-6 min-w-0">
            <div>
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Block Companies</h4>
              <form onSubmit={addCompany} className="flex gap-2 mb-3">
                <input 
                  type="text" 
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  placeholder="e.g. Acme Corp" 
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                />
                <button type="submit" className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-lg font-medium text-sm transition-colors">Add</button>
              </form>
              <div className="flex flex-wrap gap-2">
                {(settings.excludedCompanies || []).map((comp, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-sm font-medium">
                    {comp}
                    <button type="button" onClick={() => removeCompany(i)} className="hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full p-0.5 transition-colors"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Block Industries</h4>
              <form onSubmit={addIndustry} className="flex gap-2 mb-3">
                <input 
                  type="text" 
                  value={newIndustry}
                  onChange={(e) => setNewIndustry(e.target.value)}
                  placeholder="e.g. Gambling" 
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                />
                <button type="submit" className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-lg font-medium text-sm transition-colors">Add</button>
              </form>
              <div className="flex flex-wrap gap-2">
                {(settings.excludedIndustries || []).map((ind, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-sm font-medium">
                    {ind}
                    <button type="button" onClick={() => removeIndustry(i)} className="hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full p-0.5 transition-colors"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="p-6 rounded-2xl border border-red-200 dark:border-red-950/40 bg-red-50/10 dark:bg-red-950/5 shadow-sm min-w-0 space-y-6">
        <div className="flex items-start gap-4 min-w-0">
          <div className="p-3 bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-lg shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-extrabold text-red-900 dark:text-red-400 text-sm sm:text-base">Danger Zone</h3>
            <p className="text-xs text-red-700/80 dark:text-red-400/70 leading-relaxed">
              These operations permanently purge data or terminate account standing. Actions cannot be reversed. Please proceed with extreme caution.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Action 1: Wipe Profile */}
          <div className="p-4 rounded-xl border border-red-100 dark:border-red-950 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between h-full space-y-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">Purge Professional Profile</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                Completely erase professional summaries, targets, experience timelines, and all current job application logs.
              </p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                  Type <span className="font-mono text-red-500 font-bold">WIPE</span> to confirm
                </label>
                <input
                  type="text"
                  value={wipeConfirmText}
                  onChange={(e) => setWipeConfirmText(e.target.value)}
                  placeholder="WIPE"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 uppercase font-mono"
                />
              </div>
              <button
                type="button"
                disabled={wipeConfirmText !== 'WIPE' || wiping}
                onClick={handleWipeData}
                className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {wiping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Purge All Data
              </button>
            </div>
          </div>

          {/* Action 2: Delete Account */}
          <div className="p-4 rounded-xl border border-red-100 dark:border-red-950 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between h-full space-y-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">Request Account Deletion</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                Terminate your login record and remove your user document from our active registry.
              </p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                  Type <span className="font-mono text-red-500 font-bold">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 uppercase font-mono"
                />
              </div>
              <button
                type="button"
                disabled={deleteConfirmText !== 'DELETE' || deleting}
                onClick={handleDeleteAccount}
                className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                Request Account Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
