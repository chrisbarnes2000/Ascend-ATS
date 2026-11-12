import { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { AppUser, JobSeekerProfile, Job } from '../../types';
import { getMatchBreakdown, getProfileSkills } from '../../hooks/useJobMatching';
import { User, Search, Target, Zap, DollarSign, MapPin, CheckCircle2, XCircle, AlertTriangle, Code, ArrowRight, RefreshCw, Briefcase, FileCode } from 'lucide-react';

interface AdminCandidateInspectorTabProps {
  jobs: Job[];
  onRefreshJobs?: () => void;
}

export function AdminCandidateInspectorTab({ jobs }: AdminCandidateInspectorTabProps) {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedUid, setSelectedUid] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedUserProfile, setSelectedUserProfile] = useState<JobSeekerProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);

  // Match Simulator state
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [customJobTitle, setCustomJobTitle] = useState('');
  const [customJobDesc, setCustomJobDesc] = useState('');
  const [customSalaryMin, setCustomSalaryMin] = useState<number>(100000);
  const [customSalaryMax, setCustomSalaryMax] = useState<number>(140000);
  const [customWorkplace, setCustomWorkplace] = useState<string>('Remote');
  const [simulationMode, setSimulationMode] = useState<'existing' | 'custom'>('existing');

  useEffect(() => {
    async function fetchUsers() {
      setLoadingUsers(true);
      try {
        const snap = await getDocs(collection(db, 'users'));
        const list = snap.docs.map(d => ({ uid: d.id, ...d.data() } as AppUser));
        setUsers(list);
        if (list.length > 0) {
          const firstSeeker = list.find(u => u.accountType === 'jobSeeker') || list[0];
          setSelectedUid(firstSeeker.uid);
        }
      } catch (err) {
        console.error("Error fetching users for admin inspector:", err);
      } finally {
        setLoadingUsers(false);
      }
    }
    fetchUsers();
  }, []);

  useEffect(() => {
    async function fetchCandidateProfile() {
      if (!selectedUid) {
        setSelectedUserProfile(null);
        return;
      }
      setLoadingProfile(true);
      try {
        const profRef = doc(db, `users/${selectedUid}/profiles/main`);
        const snap = await getDoc(profRef);
        if (snap.exists()) {
          setSelectedUserProfile(snap.data() as JobSeekerProfile);
        } else {
          setSelectedUserProfile(null);
        }
      } catch (err) {
        console.error("Error fetching profile for inspector:", err);
        setSelectedUserProfile(null);
      } finally {
        setLoadingProfile(false);
      }
    }
    fetchCandidateProfile();
  }, [selectedUid]);

  const filteredUsers = users.filter(u => {
    const term = searchTerm.toLowerCase();
    return (
      (u.email || '').toLowerCase().includes(term) ||
      (u.companyName || '').toLowerCase().includes(term) ||
      (u.uid || '').toLowerCase().includes(term) ||
      (u.accountType || '').toLowerCase().includes(term)
    );
  });

  const selectedUserDoc = users.find(u => u.uid === selectedUid);

  // Construct target simulated Job object
  let simulatedJob: Job | null = null;
  if (simulationMode === 'existing' && selectedJobId) {
    simulatedJob = jobs.find(j => j.id === selectedJobId) || null;
  } else if (simulationMode === 'custom' && customJobTitle) {
    simulatedJob = {
      id: 'simulated_custom_job',
      companyId: 'simulated_comp_id',
      companyName: 'Simulated Target Employer',
      title: customJobTitle,
      description: customJobDesc,
      requirements: customJobDesc,
      workplaceType: customWorkplace,
      status: 'active',
      createdAt: new Date(),
      parsedCriteria: {
        skills: [],
        salaryRange: { min: customSalaryMin, max: customSalaryMax },
        workplaceType: customWorkplace,
        minExperience: 3
      }
    } as any;
  } else if (jobs.length > 0) {
    simulatedJob = jobs[0];
  }

  const breakdown = (selectedUserProfile && simulatedJob)
    ? getMatchBreakdown(selectedUserProfile, simulatedJob)
    : null;

  const candidateSkills = selectedUserProfile ? getProfileSkills(selectedUserProfile) : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-widest mb-2">
            <Search className="w-4 h-4" />
            <span>Admin Support & Match Debugger</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black">Candidate Session & Match Inspector</h2>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Inspect exact candidate profile attributes mirrored to the browser extension, analyze match scoring diffs, and pinpoint why a candidate is receiving low or high fit scores.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Candidate Selector & Extension Session View */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Select Candidate Account</span>
            </h3>

            {/* Candidate Search & Filter */}
            <div className="relative mb-4">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search user by email or UID..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* Candidate List Select */}
            {loadingUsers ? (
              <div className="p-8 text-center text-slate-400 text-sm">Loading user directory...</div>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1 no-scrollbar">
                {filteredUsers.map(u => (
                  <button
                    key={u.uid}
                    onClick={() => setSelectedUid(u.uid)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      selectedUid === u.uid
                        ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700 text-indigo-900 dark:text-indigo-200 font-bold'
                        : 'bg-white dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">{u.email}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="capitalize">{u.accountType || 'Job Seeker'}</span>
                        <span>•</span>
                        <span className="font-mono text-[10px]">{u.uid.slice(0, 10)}...</span>
                      </div>
                    </div>
                    {selectedUid === u.uid && <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Extension Mirrored Payload Card */}
          {selectedUserDoc && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  <span>Extension Session Payload Data</span>
                </h3>
                <button
                  onClick={() => setShowRawJson(!showRawJson)}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  {showRawJson ? 'View Formatted' : 'View Raw JSON'}
                </button>
              </div>

              {loadingProfile ? (
                <div className="p-6 text-center text-slate-400 text-sm">Loading candidate profile...</div>
              ) : !selectedUserProfile ? (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-amber-800 dark:text-amber-300 text-xs">
                  ⚠️ Candidate profile document (`users/{selectedUid}/profiles/main`) not configured yet. User has not completed profile setup.
                </div>
              ) : showRawJson ? (
                <pre className="p-4 rounded-2xl bg-slate-950 text-emerald-400 text-xs font-mono overflow-x-auto max-h-96">
                  {JSON.stringify({
                    uid: selectedUserDoc.uid,
                    email: selectedUserDoc.email,
                    displayName: selectedUserDoc.email?.split('@')[0],
                    accountType: selectedUserDoc.accountType || 'jobSeeker',
                    isAdmin: selectedUserDoc.email === 'Chris.Barnes.2000@me.com',
                    profileCompleted: selectedUserDoc.profileCompleted || false,
                    profile: {
                      targetRole: selectedUserProfile.targetRole || '',
                      skills: candidateSkills.map(s => s.name),
                      targetSalary: selectedUserProfile.targetSalary || 0,
                      preferredWorkplaceType: selectedUserProfile.preferredWorkplaceType || 'Remote',
                      workExperience: selectedUserProfile.workExperience || [],
                      culturalPreferences: selectedUserProfile.culturalPreferences || [],
                      targetBenefits: selectedUserProfile.targetBenefits || []
                    }
                  }, null, 2)}
                </pre>
              ) : (
                <div className="space-y-4 text-sm">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-medium">Target Role:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{selectedUserProfile.targetRole || 'Not set'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-medium">Target Salary:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        ${((selectedUserProfile.targetSalary || 0) / 1000).toFixed(0)}k/yr
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-medium">Preferred Setting:</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">{selectedUserProfile.preferredWorkplaceType || 'Remote'}</span>
                    </div>
                  </div>

                  {/* Skills Grid */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                      Profile Skills ({candidateSkills.length}):
                    </label>
                    {candidateSkills.length === 0 ? (
                      <span className="text-xs text-slate-400">No skills declared in profile.</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {candidateSkills.map((sk, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold text-xs border border-indigo-200 dark:border-indigo-800">
                            {sk.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Match Engine Simulator & Diff Debugger */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Match Engine Debugger & Simulator</span>
              </h3>
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setSimulationMode('existing')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${simulationMode === 'existing' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                >
                  Existing Job
                </button>
                <button
                  onClick={() => setSimulationMode('custom')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${simulationMode === 'custom' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                >
                  Custom Requisition
                </button>
              </div>
            </div>

            {/* Target Job Selector */}
            {simulationMode === 'existing' ? (
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Select Target Job Requisition:
                </label>
                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-sm outline-none"
                >
                  {jobs.map(j => (
                    <option key={j.id} value={j.id}>
                      {j.title} — {j.companyName || (j as any).company || 'Employer'} ({j.workplaceType || 'Remote'})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Simulated Job Title:</label>
                  <input
                    type="text"
                    value={customJobTitle}
                    onChange={(e) => setCustomJobTitle(e.target.value)}
                    placeholder="e.g. Senior Frontend Engineer"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Min Salary Budget:</label>
                    <input
                      type="number"
                      value={customSalaryMin}
                      onChange={(e) => setCustomSalaryMin(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Max Salary Budget:</label>
                    <input
                      type="number"
                      value={customSalaryMax}
                      onChange={(e) => setCustomSalaryMax(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Job Description Text:</label>
                  <textarea
                    value={customJobDesc}
                    onChange={(e) => setCustomJobDesc(e.target.value)}
                    placeholder="Paste job description or requirements text..."
                    rows={3}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium outline-none"
                  />
                </div>
              </div>
            )}

            {/* Match Engine Evaluation Breakdown Output */}
            {!breakdown ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                Select a candidate and target job requisition above to calculate ground-truth match metrics.
              </div>
            ) : (
              <div className="space-y-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                {/* Score Gauge Banner */}
                <div className={`p-6 rounded-3xl border flex items-center justify-between gap-4 ${
                  breakdown.overallScore >= 70
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-900 dark:text-emerald-200'
                    : breakdown.overallScore >= 60
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 text-amber-900 dark:text-amber-200'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 text-rose-900 dark:text-rose-200'
                }`}>
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-wider block opacity-75">
                      Ground-Truth Match Score
                    </span>
                    <div className="text-4xl font-black mt-1">
                      {breakdown.overallScore}%
                    </div>
                    <div className="text-xs font-semibold mt-1">
                      {breakdown.overallScore >= 70 ? '✓ Strong Fit / Recommended' : breakdown.overallScore >= 60 ? '⚡ Moderate Fit' : '⚠️ Low Match Warning (< 60%)'}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-900/80 shadow-sm border inline-block">
                      {breakdown.overallScore >= 60 ? 'Extension Auto Ingest OK' : 'Extension Triggers Warning'}
                    </span>
                  </div>
                </div>

                {/* Detailed Breakdown Matrix */}
                <div className="space-y-4">
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                    4-Pillar Diagnostic Analysis
                  </h4>

                  {/* 1. Skills Matrix */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-indigo-500" />
                        Skills Match (40% Weight)
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {breakdown.skillsMatch.matchedCount} / {breakdown.skillsMatch.totalRequired} matched
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <div>
                        <span className="text-[11px] font-bold text-emerald-600 block mb-1">Matched Skills:</span>
                        {breakdown.skillsMatch.requiredMatched.length === 0 ? (
                          <span className="text-xs text-slate-400">None</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {breakdown.skillsMatch.requiredMatched.map((s, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-xs font-semibold">
                                ✓ {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {breakdown.skillsMatch.requiredMissing.length > 0 && (
                        <div className="pt-2">
                          <span className="text-[11px] font-bold text-rose-600 block mb-1">Missing Required Skills:</span>
                          <div className="flex flex-wrap gap-1">
                            {breakdown.skillsMatch.requiredMissing.map((s, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 text-xs font-semibold">
                                ✕ {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 2. Salary Matrix */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4 text-emerald-500" />
                        Salary Fit (20% Weight)
                      </span>
                      {breakdown.salaryMatch.isMatch ? (
                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Satisfied
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> Gap Detected
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {breakdown.salaryMatch.details}
                    </p>
                  </div>

                  {/* 3. Workplace Setting */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-blue-500" />
                        Workplace Setting (15% Weight)
                      </span>
                      {breakdown.workplaceMatch.isMatch ? (
                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Compatible
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Divergent
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {breakdown.workplaceMatch.details}
                    </p>
                  </div>
                </div>

                {/* Admin Support Takeaways & Troubleshooting Advice */}
                <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-2">
                  <h5 className="text-xs font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-indigo-600" />
                    <span>Admin Resolution Guidance for User Support</span>
                  </h5>
                  <ul className="text-xs text-indigo-900 dark:text-indigo-300 space-y-1 list-disc pl-4">
                    {breakdown.skillsMatch.requiredMissing.length > 0 && (
                      <li>
                        <strong>Missing Skill Keywords:</strong> Advise candidate to add missing skills ({breakdown.skillsMatch.requiredMissing.join(', ')}) in Profile Editor if they possess them.
                      </li>
                    )}
                    {!breakdown.salaryMatch.isMatch && (
                      <li>
                        <strong>Salary Gap:</strong> Candidate target salary (${((breakdown.salaryMatch.targetSalary || 0)/1000).toFixed(0)}k) exceeds employer budget maximum (${((breakdown.salaryMatch.jobMax || 0)/1000).toFixed(0)}k).
                      </li>
                    )}
                    {!breakdown.workplaceMatch.isMatch && (
                      <li>
                        <strong>Setting Preference:</strong> Candidate prefers {breakdown.workplaceMatch.preferredWorkplaceType} while requisition is {breakdown.workplaceMatch.jobWorkplaceType}.
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
