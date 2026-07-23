import React, { useState } from 'react';
import { X, Plus, ChevronDown, CheckCircle2, Edit2, Sparkles, Loader2, Trash2 } from 'lucide-react';
import { ProfileSkill } from '../../types';

interface Props {
  skills: ProfileSkill[];
  targetRole?: string;
  onChange: (skills: ProfileSkill[]) => void;
}

const DOMAINS = ['Technical', 'Soft Skills', 'Leadership', 'Domain Knowledge', 'Languages', 'Tools', 'Other'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'] as const;

export function SkillsEditor({ skills, targetRole, onChange }: Props) {
  const [newSkillName, setNewSkillName] = useState('');
  const [newDomain, setNewDomain] = useState<string>('Technical');
  const [newSubDomain, setNewSubDomain] = useState<string>('');
  const [newLevel, setNewLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'>('Intermediate');
  const [newYears, setNewYears] = useState<string>('');
  
  const [showAll, setShowAll] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);

  // Upgrade string legacy skills to ProfileSkill safely
  const normalizedSkills = (skills || []).map(s => (typeof s === 'string' ? { name: s, domain: 'Other' } : s));

  const handleEnhanceAll = async () => {
    if (normalizedSkills.length === 0) return;
    setIsEnhancing(true);
    try {
      const response = await fetch('/api/enhance-skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills: normalizedSkills, targetRole })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.skills && Array.isArray(data.skills)) {
          onChange(data.skills);
        }
      } else {
        console.error('Enhance skills API error status:', response.status);
      }
    } catch (err) {
      console.error('Failed to enhance skills:', err);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all skills? This action will remove all current and outdated skill types from your profile.')) {
      onChange([]);
    }
  };

  const addSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSkillName.trim()) {
      const isDuplicate = normalizedSkills.some(s => s.name.toLowerCase() === newSkillName.trim().toLowerCase());
      if (!isDuplicate) {
        onChange([
          ...normalizedSkills,
          {
            name: newSkillName.trim(),
            domain: newDomain,
            subDomain: newSubDomain.trim() || undefined,
            level: newLevel,
            years: newYears ? parseInt(newYears, 10) : undefined
          }
        ]);
        setNewSkillName('');
        setNewSubDomain('');
        setNewYears('');
      }
    }
  };

  const removeSkill = (skillName: string) => {
    onChange(normalizedSkills.filter(s => s.name !== skillName));
  };

  // Group by domain and subDomain
  const visibleSkills = showAll ? normalizedSkills : normalizedSkills.slice(0, 10);
  
  const groupedSkills = visibleSkills.reduce((acc, skill) => {
    const dom = skill.domain || 'Other';
    const sub = skill.subDomain || 'General';
    if (!acc[dom]) acc[dom] = {};
    if (!acc[dom][sub]) acc[dom][sub] = [];
    acc[dom][sub].push(skill);
    return acc;
  }, {} as Record<string, Record<string, ProfileSkill[]>>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Skills & Competencies</h2>
        {normalizedSkills.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={isEnhancing}
              onClick={handleEnhanceAll}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl border border-indigo-200/60 dark:border-indigo-800 disabled:opacity-50"
            >
              {isEnhancing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Enhancing...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Enhance All (AI)
                </>
              )}
            </button>
            <button
              type="button"
              disabled={isEnhancing}
              onClick={handleClearAll}
              className="text-xs font-bold text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors flex items-center gap-1.5 px-3 py-2 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200/50 dark:border-rose-900/50 disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear All
            </button>
          </div>
        )}
      </div>
      
      <form onSubmit={addSkill} className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
        <h3 className="font-bold text-slate-800 dark:text-slate-200">Add New Skill</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Skill Name</label>
            <input
              type="text"
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              placeholder="e.g. React, Python..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Domain</label>
            <select
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
            >
              {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Sub-Domain</label>
            <input
              type="text"
              value={newSubDomain}
              onChange={(e) => setNewSubDomain(e.target.value)}
              placeholder="e.g. Frontend"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Level</label>
            <select
              value={newLevel}
              onChange={(e) => setNewLevel(e.target.value as any)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
            >
              {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Years (Opt)</label>
            <input
              type="number"
              value={newYears}
              onChange={(e) => setNewYears(e.target.value)}
              placeholder="e.g. 5"
              min="0"
              max="50"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Skill
          </button>
        </div>
      </form>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
        {normalizedSkills.length === 0 ? (
          <p className="text-slate-500 text-center py-4">No skills added yet.</p>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedSkills).map(([domain, subDomains]) => (
              <div key={domain} className="bg-slate-50/50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-800 rounded-2xl p-5">
                <h4 className="text-xs font-extrabold text-indigo-500 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-200/50 dark:border-slate-800/50 pb-2">{domain}</h4>
                
                <div className="space-y-4">
                  {Object.entries(subDomains).map(([subDomain, subSkills]) => (
                    <div key={`${domain}-${subDomain}`}>
                      {subDomain !== 'General' && <h5 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{subDomain}</h5>}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {subSkills.map((skill) => (
                          <div
                            key={skill.name}
                            className="group flex items-center justify-between p-3 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/50 hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-colors shadow-sm"
                          >
                            <div className="min-w-0 flex-1 pr-2">
                              <div className="font-bold text-slate-900 dark:text-slate-100 truncate flex items-center gap-1.5">
                                 <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                                 <span className="truncate">{skill.name}</span>
                              </div>
                              <div className="text-xs text-slate-500 flex gap-2 mt-1">
                                {skill.level && <span className="font-medium text-slate-600 dark:text-slate-300">{skill.level}</span>}
                                {skill.years ? <span>{skill.years} {skill.years === 1 ? 'year' : 'years'}</span> : null}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeSkill(skill.name)}
                              className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all opacity-0 group-hover:opacity-100 shrink-0 focus:opacity-100"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            {normalizedSkills.length > 10 && (
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                <button
                  type="button"
                  onClick={() => setShowAll(!showAll)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  {showAll ? 'Show Less' : `Load More (${normalizedSkills.length - 10} hidden)`}
                  <ChevronDown className={`w-4 h-4 transition-transform ${showAll ? 'rotate-180' : ''}`} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
