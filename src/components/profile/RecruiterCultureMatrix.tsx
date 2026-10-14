import React, { useState } from 'react';
import { 
  FAST_COMPANY_26_VALUES, 
  MANPOWER_5_RECRUITER_KEYS, 
  CulturalValueItem, 
  RecruiterKeyItem 
} from '../../data/culturalValuesCatalog';
import { CulturalValuesBlueprint, JobSeekerProfile } from '../../types';
import { 
  ShieldCheck, 
  Sparkles, 
  HelpCircle, 
  Check, 
  MessageSquare, 
  Briefcase, 
  Clock, 
  HeartHandshake,
  Award,
  ChevronDown,
  ChevronUp,
  FileText,
  Building2
} from 'lucide-react';

interface RecruiterCultureMatrixProps {
  role: 'jobSeeker' | 'recruiter' | 'companyOwner' | 'admin';
  profile?: JobSeekerProfile;
  blueprint?: CulturalValuesBlueprint;
  onSavePreferences?: (culturalPreferences: string[], recruiterPrefs: any) => Promise<void>;
  onSaveBlueprint?: (blueprint: CulturalValuesBlueprint) => Promise<void>;
}

export const RecruiterCultureMatrix: React.FC<RecruiterCultureMatrixProps> = ({
  role,
  profile,
  blueprint,
  onSavePreferences,
  onSaveBlueprint
}) => {
  const [activeTab, setActiveTab] = useState<'cultural_values' | 'recruiter_partnership' | 'blueprint'>('cultural_values');
  const [selectedValues, setSelectedValues] = useState<string[]>(profile?.culturalPreferences || blueprint?.topValues || []);
  
  // Recruiter Preferences State for Candidates
  const [recruiterFreq, setRecruiterFreq] = useState<'Daily' | 'Weekly' | 'As Needed' | 'Milestone Only'>(
    profile?.recruiterPreferences?.communicationFrequency || 'As Needed'
  );
  const [expectedSalary, setExpectedSalary] = useState<number>(
    profile?.recruiterPreferences?.expectedSalaryMin || profile?.targetSalary || 120000
  );
  const [requiresVideo, setRequiresVideo] = useState<boolean>(
    profile?.recruiterPreferences?.requiresVideoCall ?? true
  );

  // Blueprint State for Recruiters / Companies
  const [cultureAddNarrative, setCultureAddNarrative] = useState(blueprint?.cultureAddNarrative || '');
  const [kindnessStance, setKindnessStance] = useState(blueprint?.kindnessVsNicenessStance || 'Kind Candor & Clear Expectations');
  const [ecosystemStance, setEcosystemStance] = useState(blueprint?.ecosystemStance || 'Interconnected Ecosystem with Mutual Respect');
  const [transparencyPolicy, setTransparencyPolicy] = useState(blueprint?.uncomfortableTransparencyPolicy || 'Honest, Unfiltered Operational Updates');
  const [pacingPolicy, setPacingPolicy] = useState(blueprint?.pacingRestPolicy || 'Enforced Rest Post-Sprint Deliveries');
  const [recruiterSlaDays, setRecruiterSlaDays] = useState(blueprint?.recruiterSlaDays || 2);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [expandedValueId, setExpandedValueId] = useState<string | null>(null);

  const toggleValueSelection = (id: string) => {
    if (selectedValues.includes(id)) {
      setSelectedValues(selectedValues.filter(item => item !== id));
    } else {
      if (selectedValues.length >= 6) {
        alert('You can select up to 6 core cultural value priorities.');
        return;
      }
      setSelectedValues([...selectedValues, id]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      if (role === 'jobSeeker' && onSavePreferences) {
        await onSavePreferences(selectedValues, {
          communicationFrequency: recruiterFreq,
          expectedSalaryMin: Number(expectedSalary),
          requiresVideoCall: requiresVideo
        });
      } else if (onSaveBlueprint) {
        await onSaveBlueprint({
          topValues: selectedValues,
          cultureAddNarrative,
          kindnessVsNicenessStance: kindnessStance,
          ecosystemStance: ecosystemStance,
          uncomfortableTransparencyPolicy: transparencyPolicy,
          pacingRestPolicy: pacingPolicy,
          recruiterSlaDays: Number(recruiterSlaDays)
        });
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save culture matrix state:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-xs tracking-wider uppercase mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Culture Add & Partnership Intelligence</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {role === 'jobSeeker' ? 'Cultural Values & Recruiter Relationship Hub' : 'Company Culture & Recruiter Partnership Blueprint'}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Grounded in Fast Company Impact Council research and Manpower recruiting insights.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow transition-all focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {saving ? <Clock className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
          <span>{saveSuccess ? 'Saved Successfully!' : 'Save Configuration'}</span>
        </button>
      </div>

      {/* Segmented Sub-Tab Switcher */}
      <div className="flex flex-wrap gap-2 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-lg text-sm font-medium">
        <button
          onClick={() => setActiveTab('cultural_values')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
            activeTab === 'cultural_values'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>26 Cultural Values ({selectedValues.length} Selected)</span>
        </button>

        <button
          onClick={() => setActiveTab('recruiter_partnership')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
            activeTab === 'recruiter_partnership'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <HeartHandshake className="w-4 h-4" />
          <span>5 Keys to Recruiter Partnership</span>
        </button>

        {(role === 'recruiter' || role === 'companyOwner' || role === 'admin') && (
          <button
            onClick={() => setActiveTab('blueprint')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
              activeTab === 'blueprint'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Employer Culture Blueprint</span>
          </button>
        )}
      </div>

      {/* Tab 1: 26 Fast Company Cultural Values */}
      {activeTab === 'cultural_values' && (
        <div className="space-y-4">
          <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-lg text-sm text-indigo-900 dark:text-indigo-200 flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Selecting Core Culture Add Priorities (Max 6)</p>
              <p className="text-xs text-indigo-800 dark:text-indigo-300">
                Select the cultural values that matter most to you. These values power our qualitative matching engine, generate reverse-interviewing questions for your STAR copilot, and display on your verified profile.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {FAST_COMPANY_26_VALUES.map((item: CulturalValueItem) => {
              const isSelected = selectedValues.includes(item.id);
              const isExpanded = expandedValueId === item.id;

              return (
                <div
                  key={item.id}
                  className={`border rounded-lg p-3 transition-all relative ${
                    isSelected
                      ? 'bg-indigo-50/40 dark:bg-indigo-950/30 border-indigo-500 dark:border-indigo-500 shadow-sm'
                      : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => toggleValueSelection(item.id)}
                      className="flex items-center gap-2 text-left focus:outline-none group flex-1"
                    >
                      <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected 
                          ? 'bg-indigo-600 border-indigo-600 text-white' 
                          : 'border-slate-300 dark:border-slate-700 group-hover:border-indigo-400'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <span className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                        {item.number}. {item.title}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setExpandedValueId(isExpanded ? null : item.id)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded"
                      aria-label="Toggle details"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">
                    {item.summary}
                  </p>

                  {/* Expanded Reverse Interview Question */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                      <div className="p-2 bg-slate-50 dark:bg-slate-800/80 rounded border border-slate-200 dark:border-slate-700">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400 block mb-0.5">
                          🗣️ Reverse Interviewing Probe Question:
                        </span>
                        <p className="text-slate-700 dark:text-slate-300 italic">
                          "{item.reverseInterviewQuestion}"
                        </p>
                      </div>

                      <div className="text-slate-500 dark:text-slate-400">
                        <span className="font-medium text-rose-600 dark:text-rose-400">🚩 Cultural Red Flag Phrase: </span>
                        <span>"{item.redFlagPhrase}"</span>
                      </div>

                      <div className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                        Contributor: {item.author} ({item.organization})
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: 5 Keys to Working with a Recruiter */}
      {activeTab === 'recruiter_partnership' && (
        <div className="space-y-6">
          <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-lg text-sm text-emerald-900 dark:text-emerald-200 flex items-start gap-3">
            <HeartHandshake className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Professional Recruiter Partnership Matrix (Manpower Principles)</p>
              <p className="text-xs text-emerald-800 dark:text-emerald-300">
                Working with a recruiter is a two-way strategic alliance. Use these guidelines to establish prompt follow-ups, transparent compensation boundaries, and post-interview debriefs.
              </p>
            </div>
          </div>

          {/* Candidate Recruiter Preferences Configuration Card */}
          {role === 'jobSeeker' && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl space-y-4">
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-500" />
                <span>My Recruiter Partnership Boundaries</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    Preferred Update Cadence
                  </label>
                  <select
                    value={recruiterFreq}
                    onChange={(e) => setRecruiterFreq(e.target.value as any)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
                  >
                    <option value="Daily">Daily Updates</option>
                    <option value="Weekly">Weekly Digest</option>
                    <option value="As Needed">As Needed / Real-time</option>
                    <option value="Milestone Only">Milestones & Offers Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    Minimum Target Compensation ($)
                  </label>
                  <input
                    type="number"
                    step="5000"
                    value={expectedSalary}
                    onChange={(e) => setExpectedSalary(Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <input
                    type="checkbox"
                    id="reqVideo"
                    checked={requiresVideo}
                    onChange={(e) => setRequiresVideo(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 dark:border-slate-700 focus:ring-indigo-500"
                  />
                  <label htmlFor="reqVideo" className="text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                    Prefer Video Call Screening Prior to Submission
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* 5 Recruiter Keys Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MANPOWER_5_RECRUITER_KEYS.map((keyItem: RecruiterKeyItem) => (
              <div
                key={keyItem.id}
                className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 rounded-xl p-4 shadow-sm space-y-3"
              >
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs">
                    {keyItem.number}
                  </span>
                  <span>{keyItem.title}</span>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {keyItem.corePrinciple}
                </p>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                  <span className="font-semibold text-slate-900 dark:text-white block">Actionable Candidate Checklist:</span>
                  <ul className="space-y-1">
                    {keyItem.candidateActionableTips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 text-slate-600 dark:text-slate-400">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Employer Cultural Blueprint */}
      {activeTab === 'blueprint' && (
        <div className="space-y-5 text-xs">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-500" />
              <span>Company Culture & Operational Stance Blueprint</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Culture Add Narrative & Unique Team Belief
                </label>
                <textarea
                  rows={2}
                  value={cultureAddNarrative}
                  onChange={(e) => setCultureAddNarrative(e.target.value)}
                  placeholder="Describe what unique perspectives or lived experiences add value to your team..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Kindness vs Niceness Policy
                  </label>
                  <input
                    type="text"
                    value={kindnessStance}
                    onChange={(e) => setKindnessStance(e.target.value)}
                    placeholder="e.g. Kind Candor & Clear Expectations"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Team Stance (Ecosystem vs Family)
                  </label>
                  <input
                    type="text"
                    value={ecosystemStance}
                    onChange={(e) => setEcosystemStance(e.target.value)}
                    placeholder="e.g. Interconnected Ecosystem with Mutual Respect"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Uncomfortable Transparency Policy
                  </label>
                  <input
                    type="text"
                    value={transparencyPolicy}
                    onChange={(e) => setTransparencyPolicy(e.target.value)}
                    placeholder="e.g. Honest Operational Updates & Early Red Flagging"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Candidate Debrief SLA (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="7"
                    value={recruiterSlaDays}
                    onChange={(e) => setRecruiterSlaDays(Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
