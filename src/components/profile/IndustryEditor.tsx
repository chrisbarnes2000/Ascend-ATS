import React, { useState } from 'react';
import { Plus, X, Briefcase } from 'lucide-react';

interface IndustryEditorProps {
  industries: string[];
  onChange: (industries: string[]) => void;
  maxIndustries?: number;
}

const POPULAR_INDUSTRIES = [
  'GovTech & Public Sector',
  'Defense & Aerospace',
  'HealthTech & Healthcare',
  'FinTech & Banking',
  'Cybersecurity',
  'Enterprise SaaS',
  'AI & Machine Learning',
  'CleanTech & Energy',
  'BioTech & Life Sciences',
  'EdTech'
];

export function IndustryEditor({
  industries = [],
  onChange,
  maxIndustries = 10
}: IndustryEditorProps) {
  const [inputValue, setInputValue] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const addIndustry = (industryName: string) => {
    const trimmed = industryName.trim();
    if (!trimmed) return;

    if (industries.some(i => i.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMsg(`"${trimmed}" is already added.`);
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    if (industries.length >= maxIndustries) {
      setErrorMsg(`Maximum of ${maxIndustries} industries allowed.`);
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    onChange([...industries, trimmed]);
    setInputValue('');
    setErrorMsg(null);
  };

  const removeIndustry = (industryToRemove: string) => {
    onChange(industries.filter(i => i.toLowerCase() !== industryToRemove.toLowerCase()));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addIndustry(inputValue);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label 
          htmlFor="industry-input"
          className="block text-xs font-bold text-slate-500 uppercase"
        >
          Target Industries ({industries.length}/{maxIndustries})
        </label>
        {industries.length > 0 && (
          <span className="text-xs text-slate-400">
            Select multiple industries for algorithm matching
          </span>
        )}
      </div>

      {/* Input row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            id="industry-input"
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              if (errorMsg) setErrorMsg(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type an industry (e.g. GovTech, FinTech) and hit Enter..."
            disabled={industries.length >= maxIndustries}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
            aria-label="Add target industry"
          />
        </div>
        <button
          type="button"
          onClick={() => addIndustry(inputValue)}
          disabled={!inputValue.trim() || industries.length >= maxIndustries}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          aria-label="Add industry"
        >
          <Plus className="w-4 h-4" />
          <span>Add</span>
        </button>
      </div>

      {errorMsg && (
        <p className="text-xs text-rose-500 font-medium" role="alert">
          {errorMsg}
        </p>
      )}

      {/* Selected tags */}
      {industries.length > 0 ? (
        <div className="flex flex-wrap gap-2 pt-1">
          {industries.map((ind) => (
            <span
              key={ind}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium border border-blue-200 dark:border-blue-800/60 shadow-xs"
            >
              <Briefcase className="w-3.5 h-3.5 opacity-70" />
              <span>{ind}</span>
              <button
                type="button"
                onClick={() => removeIndustry(ind)}
                className="ml-1 p-0.5 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-500 hover:text-rose-600 transition-colors focus-visible:ring-2 focus-visible:ring-blue-400"
                aria-label={`Remove industry ${ind}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400 italic">
          No industries selected yet. Pick from popular suggestions below or type your own.
        </p>
      )}

      {/* Popular Industry Quick-Select Chips */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60">
        <span className="text-xs font-medium text-slate-400 block mb-2">
          Popular Industries (click to toggle):
        </span>
        <div className="flex flex-wrap gap-1.5">
          {POPULAR_INDUSTRIES.map((pop) => {
            const isSelected = industries.some(i => i.toLowerCase() === pop.toLowerCase());
            return (
              <button
                key={pop}
                type="button"
                onClick={() => isSelected ? removeIndustry(pop) : addIndustry(pop)}
                className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-colors ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600'
                }`}
                aria-pressed={isSelected}
              >
                {isSelected ? '✓ ' : '+ '}
                {pop}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
