import React, { useState } from 'react';
import { X, Plus, ChevronDown, CheckCircle2, Edit2, Sparkles, Loader2, Trash2 } from 'lucide-react';
import { ProfileSkill } from '../../types';
import { SKILLS_CATALOG, autodetectSkillCategory } from '../../data/skillsCatalog';

interface Props {
  skills: ProfileSkill[];
  targetRole?: string;
  onChange: (skills: ProfileSkill[]) => void;
}

const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'] as const;

export function SkillsEditor({ skills, targetRole, onChange }: Props) {
  const [newSkillName, setNewSkillName] = useState('');
  const [newDomain, setNewDomain] = useState<keyof typeof SKILLS_CATALOG>('Technology');
  const [newSubDomain, setNewSubDomain] = useState<string>(Object.keys(SKILLS_CATALOG['Technology'])[0]);
  const [newLevel, setNewLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'>('Intermediate');
  const [newYears, setNewYears] = useState<string>('');
  const [newCredlyUrl, setNewCredlyUrl] = useState<string>('');
  
  const [showAll, setShowAll] = useState(false);
  const [editingSkillName, setEditingSkillName] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'years' | 'level'>('name');

  // Upgrade string legacy skills to ProfileSkill safely
  const normalizedSkills = (skills || []).map(s => (typeof s === 'string' ? { name: s, domain: 'Other' } : s));

  const handleSkillNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewSkillName(val);
    if (val.length >= 2) {
      const match = autodetectSkillCategory(val);
      if (match) {
        setNewDomain(match.domain as keyof typeof SKILLS_CATALOG);
        setNewSubDomain(match.subDomain);
      }
    }
  };

  const handleEnhanceAll = () => {
    if (normalizedSkills.length === 0) return;
    const enhanced = normalizedSkills.map(skill => {
      const match = autodetectSkillCategory(skill.name);
      if (match) {
        return {
          ...skill,
          domain: match.domain,
          subDomain: match.subDomain
        };
      }
      return skill;
    });
    onChange(enhanced);
  };

  const addSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSkillName.trim()) {
      const isDuplicate = normalizedSkills.some(s => s.name.toLowerCase() === newSkillName.trim().toLowerCase() && s.name !== editingSkillName);
      if (!isDuplicate) {
        const updatedSkill: ProfileSkill = {
          name: newSkillName.trim(),
          domain: newDomain,
          subDomain: newSubDomain,
          level: newLevel,
        };
        if (newYears) updatedSkill.years = parseInt(newYears, 10);
        if (newCredlyUrl.trim()) updatedSkill.credlyUrl = newCredlyUrl.trim();

        if (editingSkillName) {
          onChange(normalizedSkills.map(s => s.name === editingSkillName ? updatedSkill : s));
          setEditingSkillName(null);
        } else {
          onChange([...normalizedSkills, updatedSkill]);
        }

        setNewSkillName('');
        setNewYears('');
        setNewCredlyUrl('');
      } else {
        alert("Skill already exists!");
      }
    }
  };

  const removeSkill = (skillName: string) => {
    onChange(normalizedSkills.filter(s => s.name !== skillName));
    if (editingSkillName === skillName) {
      cancelEdit();
    }
  };

  const editSkill = (skill: ProfileSkill) => {
    setEditingSkillName(skill.name);
    setNewSkillName(skill.name);
    
    // Ensure domain exists in catalog, else fallback
    const domain = (skill.domain && skill.domain in SKILLS_CATALOG) 
      ? (skill.domain as keyof typeof SKILLS_CATALOG) 
      : 'Technology';
    setNewDomain(domain);
    
    const subDomain = skill.subDomain || Object.keys(SKILLS_CATALOG[domain])[0];
    setNewSubDomain(subDomain);
    
    setNewLevel(skill.level || 'Intermediate');
    setNewYears(skill.years ? skill.years.toString() : '');
    setNewCredlyUrl(skill.credlyUrl || '');
  };

  const cancelEdit = () => {
    setEditingSkillName(null);
    setNewSkillName('');
    setNewYears('');
    setNewCredlyUrl('');
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all skills?')) {
      onChange([]);
    }
  };

  // Sort skills using common non-AI list properties
  const sortedSkills = [...normalizedSkills].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'years') {
      return (b.years || 0) - (a.years || 0);
    } else if (sortBy === 'level') {
      const rankMap = { 'Expert': 4, 'Advanced': 3, 'Intermediate': 2, 'Beginner': 1 };
      const rankA = rankMap[a.level || 'Intermediate'] || 2;
      const rankB = rankMap[b.level || 'Intermediate'] || 2;
      return rankB - rankA;
    }
    return 0;
  });

  // Group by domain and subDomain
  const visibleSkills = showAll ? sortedSkills : sortedSkills.slice(0, 10);
  
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
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="text-slate-400">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent border-none focus:outline-none font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <option value="name">Alphabetical</option>
                <option value="level">Expertise Level</option>
                <option value="years">Years of Exp</option>
              </select>
            </div>
            <button
              type="button"
              onClick={handleEnhanceAll}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl border border-indigo-200/60 dark:border-indigo-800"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Enhance All
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs font-bold text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors flex items-center gap-1.5 px-3 py-2 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200/50 dark:border-rose-900/50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear All
            </button>
          </div>
        )}
      </div>
      
      <form onSubmit={addSkill} className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
        <h3 className="font-bold text-slate-800 dark:text-slate-200">{editingSkillName ? 'Edit Skill' : 'Add New Skill'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Skill Name</label>
            <input
              type="text"
              value={newSkillName}
              onChange={handleSkillNameChange}
              placeholder="e.g. React, Python..."
              list="skill-suggestions"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
            />
            <datalist id="skill-suggestions">
              {SKILLS_CATALOG[newDomain] && SKILLS_CATALOG[newDomain][newSubDomain] && 
                SKILLS_CATALOG[newDomain][newSubDomain].map(s => <option key={s} value={s} />)}
            </datalist>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Domain</label>
            <select
              value={newDomain}
              onChange={(e) => {
                setNewDomain(e.target.value as keyof typeof SKILLS_CATALOG);
                setNewSubDomain(Object.keys(SKILLS_CATALOG[e.target.value as keyof typeof SKILLS_CATALOG])[0]);
              }}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
            >
              {Object.keys(SKILLS_CATALOG).map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Sub-Domain</label>
            <select
              value={newSubDomain}
              onChange={(e) => setNewSubDomain(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
            >
              {SKILLS_CATALOG[newDomain] ? Object.keys(SKILLS_CATALOG[newDomain]).map(sd => <option key={sd} value={sd}>{sd}</option>) : null}
            </select>
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
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Credly URL (Opt)</label>
            <input
              type="url"
              value={newCredlyUrl}
              onChange={(e) => setNewCredlyUrl(e.target.value)}
              placeholder="https://credly.com/..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          {editingSkillName && (
            <button
              type="button"
              onClick={cancelEdit}
              className="px-6 py-2.5 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 transition-colors"
          >
            {editingSkillName ? <><Edit2 className="w-4 h-4" /> Update Skill</> : <><Plus className="w-4 h-4" /> Add Skill</>}
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
                            className={`group flex items-center justify-between p-3 rounded-xl border transition-colors shadow-sm ${editingSkillName === skill.name ? 'bg-indigo-50 border-indigo-300 dark:bg-indigo-900/20 dark:border-indigo-700' : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 hover:border-indigo-200 dark:hover:border-indigo-500/30'}`}
                          >
                            <div className="min-w-0 flex-1 pr-2">
                              <div className="font-bold text-slate-900 dark:text-slate-100 truncate flex items-center gap-1.5">
                                 <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                                 <span className="truncate">{skill.name}</span>
                              </div>
                              <div className="text-xs text-slate-500 flex items-center gap-2 mt-1 flex-wrap">
                                {skill.level && <span className="font-medium text-slate-600 dark:text-slate-300">{skill.level}</span>}
                                {skill.years ? <span>{skill.years} {skill.years === 1 ? 'year' : 'years'}</span> : null}
                                {skill.credlyUrl && (
                                  <a 
                                    href={skill.credlyUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline inline-flex items-center gap-0.5 font-bold transition-all"
                                  >
                                    Credly Verified
                                  </a>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100 shrink-0">
                              <button
                                type="button"
                                onClick={() => editSkill(skill)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeSkill(skill.name)}
                                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
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
