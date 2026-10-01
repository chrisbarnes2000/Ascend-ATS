import React, { useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';
import { ProfileSkill } from '../../types';
import { Award, ShieldCheck, HeartHandshake, BarChart3, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  skills: ProfileSkill[];
  deiAndAccommodations?: {
    gender?: string;
    race?: string;
    veteranStatus?: string;
    disabilityStatus?: string;
    needsAccommodations: boolean;
    accommodationTypes: string[];
    accommodationDetails?: string;
    shareDeiWithEmployers: boolean;
  };
}

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#6366f1', // indigo
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // violet
  '#14b8a6', // teal
  '#f43f5e'  // rose
];

const LEVEL_COLORS = {
  'Beginner': 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  'Intermediate': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/40',
  'Advanced': 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/40',
  'Expert': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/40'
};

export function SkillVisualizer({ skills, deiAndAccommodations }: Props) {
  const [activeTab, setActiveTab] = useState<'donut' | 'radar' | 'support' | 'credentials'>('donut');

  const normalizedSkills = (skills || []).map(s => 
    typeof s === 'string' ? { name: s, domain: 'Other', level: 'Intermediate' as const } : s
  );

  // 1. Group skills for Donut chart (grouped by Domain)
  const domainCounts = normalizedSkills.reduce((acc, skill) => {
    const dom = skill.domain || 'Other';
    acc[dom] = (acc[dom] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(domainCounts).map(([name, value]) => ({
    name,
    value,
  }));

  // 2. Prepare data for Radar Chart (average levels per domain)
  const radarData = Object.entries(
    normalizedSkills.reduce((acc, skill) => {
      const dom = skill.domain || 'Other';
      if (!acc[dom]) acc[dom] = { domain: dom, count: 0, levelSum: 0 };
      acc[dom].count += 1;
      const levelMap = { 'Beginner': 1, 'Intermediate': 2, 'Advanced': 3, 'Expert': 4 };
      acc[dom].levelSum += levelMap[skill.level || 'Intermediate'] || 2;
      return acc;
    }, {} as Record<string, { domain: string, count: number, levelSum: number }>)
  ).map(([_, val]) => ({
    subject: val.domain,
    level: Math.round((val.levelSum / val.count) * 10) / 10,
    fullMark: 4,
  }));

  // 3. Extract Verified Credentials with Credly URL
  const verifiedCredentials = normalizedSkills.filter(s => s.credlyUrl && s.credlyUrl.trim());

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-all text-slate-900 dark:text-white" id="skill-visualizer-container">
      {/* Tabs Menu */}
      <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 px-6 py-4 flex-wrap gap-2 justify-between items-center" id="visualizer-tabs-menu">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('donut')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 border ${
              activeTab === 'donut' 
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            Core Domains
          </button>
          <button
            onClick={() => setActiveTab('radar')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 border ${
              activeTab === 'radar' 
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Skills Radar
          </button>
          <button
            onClick={() => setActiveTab('support')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 border ${
              activeTab === 'support' 
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            Access Support & Accommodations
          </button>
          {verifiedCredentials.length > 0 && (
            <button
              onClick={() => setActiveTab('credentials')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 border ${
                activeTab === 'credentials' 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Credentials ({verifiedCredentials.length})
            </button>
          )}
        </div>
        <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-blue-500" /> Interactive Engine
        </div>
      </div>

      {/* Tab Panels */}
      <div className="p-6 md:p-8" id="visualizer-content-panel">
        <AnimatePresence mode="wait">
          {activeTab === 'donut' && (
            <motion.div
              key="donut"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
            >
              <div className="h-64 flex justify-center items-center relative">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        formatter={(value) => [`${value} skills`, 'Count']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-slate-400">No skills to visualize yet.</p>
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-extrabold">{normalizedSkills.length}</span>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Skills</span>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-base">Key Skill Alignments</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  A high level view demonstrating where your strongest clusters of capability lie, helping employers understand your core specialties instantly.
                </p>
                <div className="grid grid-cols-2 gap-3 max-h-40 overflow-y-auto pr-2">
                  {pieData.map((data, idx) => (
                    <div key={data.name} className="flex items-center gap-2 border border-slate-100 dark:border-slate-800 p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{data.name}</div>
                        <div className="text-[10px] text-slate-400">{data.value} {data.value === 1 ? 'skill' : 'skills'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'radar' && (
            <motion.div
              key="radar"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
            >
              <div className="h-64 w-full">
                {radarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 4]} tick={{ fill: '#94a3b8', fontSize: 8 }} />
                      <Radar name="Proficiency Level" dataKey="level" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.4} />
                      <Tooltip formatter={(value) => [`${value} / 4.0`, 'Average level']} />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-slate-400">Add more diverse skills to construct the Radar Chart.</div>
                )}
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-base">Average Proficiency Scale</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Average competency level computed for each domain sector. The levels are mapped continuously from <strong>1.0 (Beginner)</strong> to <strong>4.0 (Expert)</strong>.
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-100 dark:border-slate-800">
                    <span>Domain</span>
                    <span>Computed Rating</span>
                  </div>
                  {radarData.map(r => (
                    <div key={r.subject} className="flex justify-between items-center text-xs py-1">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{r.subject}</span>
                      <span className="font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded-md">{r.level} / 4.0</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'support' && (
            <motion.div
              key="support"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h4 className="font-bold text-base">Workspace Access & Accommodation Mapping</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                    Visualizing workspace support, accommodations, and access tools requested by the candidate to help employers optimize their desk layout or physical workspace.
                  </p>
                </div>
                {deiAndAccommodations?.needsAccommodations ? (
                  <span className="shrink-0 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/40 dark:border-emerald-800/80 px-3 py-1.5 rounded-xl flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Support Needs Specified
                  </span>
                ) : (
                  <span className="shrink-0 text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700 px-3 py-1.5 rounded-xl flex items-center gap-1">
                    ✓ Full General Support Setup
                  </span>
                )}
              </div>

              {deiAndAccommodations?.needsAccommodations ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Accommodation Support Types</div>
                    <div className="flex flex-wrap gap-2">
                      {deiAndAccommodations.accommodationTypes && deiAndAccommodations.accommodationTypes.length > 0 ? (
                        deiAndAccommodations.accommodationTypes.map(type => (
                          <span key={type} className="px-3.5 py-2 bg-indigo-50 border border-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800/60 dark:text-indigo-400 rounded-xl text-xs font-bold">
                            ✦ {type}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">No types listed. Check details below.</span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50/80 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Candidate Support Specifications</div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic">
                      "{deiAndAccommodations.accommodationDetails || 'Candidate specified standard support requirements. Standard hardware or scheduling flexibility might apply.'}"
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-8 bg-slate-50/50 dark:bg-slate-950/20 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-3">
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/40 rounded-full flex items-center justify-center mx-auto text-blue-500">
                    <HeartHandshake className="w-6 h-6" />
                  </div>
                  <div className="max-w-md mx-auto space-y-1">
                    <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200">Standard Desk & Hardware Setup</h5>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      This candidate does not require custom hardware adjustments, ergonomic tools, or communication accommodations. Standard, modern tech stack desks fit completely.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'credentials' && (
            <motion.div
              key="credentials"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <h4 className="font-bold text-base">Verified Badges & Credly Certifications</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                  Click out to Credly to review official verifications, skill assessments, and accredited badges for this candidate.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {verifiedCredentials.map(skill => (
                  <a
                    href={skill.credlyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    key={skill.name}
                    className="group p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 hover:border-blue-500 dark:hover:border-blue-500/50 rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{skill.domain || 'Technology'}</div>
                      <h5 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 mt-1 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {skill.name}
                      </h5>
                      <div className="text-[10px] font-bold text-slate-400 mt-1 flex items-center gap-1">
                        <span className={`px-2 py-0.5 rounded-full border ${LEVEL_COLORS[skill.level || 'Intermediate']}`}>
                          {skill.level || 'Intermediate'}
                        </span>
                      </div>
                    </div>
                    <div className="w-10 h-10 bg-blue-50 group-hover:bg-blue-600 group-hover:text-white dark:bg-slate-900 text-blue-600 rounded-xl flex items-center justify-center shrink-0 transition-all border border-slate-100 dark:border-slate-800">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
