import React, { useState } from 'react';
import { Target, Briefcase, DollarSign, Gift, MapPin, Sparkles, Plus, X } from 'lucide-react';
import { JobSeekerProfile } from '../../types';
import { IndustryEditor } from './IndustryEditor';
import { LocationEditor } from './LocationEditor';

interface TargetIndicatorsEditorProps {
  profile: JobSeekerProfile;
  onChange: (updates: Partial<JobSeekerProfile>) => void;
}

const STANDARD_BENEFITS: readonly string[] = [
  'Health Insurance',
  'Dental & Vision',
  '401(k) Matching',
  'Remote / Hybrid Work',
  'Flexible Working Hours',
  'Unlimited or Generous PTO',
  'Paid Parental Leave',
  'Wellness / Gym Stipend',
  'Equity / Stock Options',
  'Learning & Conference Budget'
];

const SUGGESTED_ROLES: readonly string[] = [
  'Senior Full Stack Engineer',
  'Lead Frontend Engineer',
  'Staff Software Architect',
  'Senior Product Manager',
  'Engineering Director',
  'Data Scientist / AI Engineer'
];

export const TargetIndicatorsEditor: React.FC<TargetIndicatorsEditorProps> = ({
  profile,
  onChange
}) => {
  const [customBenefitInput, setCustomBenefitInput] = useState('');

  // Calculate indicator completion score for visual feedback
  const targetIndustriesList =
    profile.targetIndustries && profile.targetIndustries.length > 0
      ? profile.targetIndustries
      : profile.targetIndustry
      ? profile.targetIndustry.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

  const locationsCount = profile.targetLocations?.length || 0;
  const benefitsList = profile.targetBenefits || [];

  const indicatorsConfigured = [
    Boolean(profile.targetRole?.trim()),
    targetIndustriesList.length > 0,
    locationsCount > 0,
    Boolean(profile.targetSalary && profile.targetSalary > 0),
    benefitsList.length > 0
  ].filter(Boolean).length;

  const handleRoleChange = (role: string) => {
    onChange({ targetRole: role });
  };

  const handleIndustriesChange = (industries: string[]) => {
    onChange({
      targetIndustries: industries,
      targetIndustry: industries.join(', ')
    });
  };

  const handleLocationsChange = (locations: NonNullable<JobSeekerProfile['targetLocations']>) => {
    onChange({ targetLocations: locations });
  };

  const handleSalaryChange = (salary: number) => {
    onChange({ targetSalary: Math.max(0, salary) });
  };

  const toggleBenefit = (benefit: string) => {
    const current = profile.targetBenefits || [];
    const updated = current.includes(benefit)
      ? current.filter((b) => b !== benefit)
      : [...current, benefit];
    onChange({ targetBenefits: updated });
  };

  const addCustomBenefit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customBenefitInput.trim();
    if (!trimmed) return;
    const current = profile.targetBenefits || [];
    if (!current.includes(trimmed)) {
      onChange({ targetBenefits: [...current, trimmed] });
    }
    setCustomBenefitInput('');
  };

  const removeBenefit = (benefit: string) => {
    const current = profile.targetBenefits || [];
    onChange({ targetBenefits: current.filter((b) => b !== benefit) });
  };

  return (
    <section 
      aria-label="Target Career Indicators"
      className="space-y-6 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm"
    >
      {/* Header with KPI Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-2xl border border-blue-200 dark:border-blue-800/60 shadow-inner">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Target Career Indicators
              </h2>
              <span className="px-2 py-0.5 text-xs font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-full">
                Sub-section
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
              Configure your ideal role, industries, target commute/in-person locations, salary threshold, and workplace benefit requirements to guide matching algorithms.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-700/60">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
          <div className="text-right">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
              {indicatorsConfigured} of 5 Configured
            </div>
            <div className="w-24 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-1 overflow-hidden">
              <div 
                className="bg-blue-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${(indicatorsConfigured / 5) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Indicator 1: Target Role */}
      <div className="p-5 bg-slate-50/80 dark:bg-slate-900/40 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-2">
          <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <label htmlFor="target-role-input" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Indicator 1: Target Role
          </label>
        </div>
        <input 
          id="target-role-input"
          type="text" 
          value={profile.targetRole || ''}
          onChange={(e) => handleRoleChange(e.target.value)}
          placeholder="e.g. Senior Software Architect or Lead Designer"
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-medium text-sm transition-all"
        />
        {/* Role Quick Picks */}
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          <span className="text-[11px] font-semibold text-slate-400 self-center mr-1">Quick picks:</span>
          {SUGGESTED_ROLES.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => handleRoleChange(role)}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
            >
              + {role}
            </button>
          ))}
        </div>
      </div>

      {/* Indicator 2: Target Industries */}
      <div className="p-5 bg-slate-50/80 dark:bg-slate-900/40 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <IndustryEditor
          industries={targetIndustriesList}
          onChange={handleIndustriesChange}
        />
      </div>

      {/* Indicator 3: Target In-Person & Hybrid Locations */}
      <div className="p-5 bg-slate-50/80 dark:bg-slate-900/40 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <LocationEditor
          locations={profile.targetLocations || []}
          onChange={handleLocationsChange}
        />
      </div>

      {/* Indicator 4: Target Salary */}
      <div className="p-5 bg-slate-50/80 dark:bg-slate-900/40 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <label htmlFor="target-salary-input" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Indicator 4: Target Annual Salary (USD)
            </label>
          </div>
          {profile.targetSalary && profile.targetSalary > 0 ? (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              ${Number(profile.targetSalary).toLocaleString()} / yr
            </span>
          ) : null}
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold">
            $
          </div>
          <input 
            id="target-salary-input"
            type="number" 
            min="0"
            step="5000"
            value={profile.targetSalary || ''}
            onChange={(e) => handleSalaryChange(parseInt(e.target.value) || 0)}
            placeholder="150000"
            className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-medium text-sm transition-all"
          />
        </div>
        <div className="flex items-center gap-2 mt-2">
          {[120000, 150000, 180000, 220000].map((tier) => (
            <button
              key={tier}
              type="button"
              onClick={() => handleSalaryChange(tier)}
              className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
            >
              ${tier / 1000}k
            </button>
          ))}
        </div>
      </div>

      {/* Indicator 5: Target Benefit Requests */}
      <div className="p-5 bg-slate-50/80 dark:bg-slate-900/40 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Indicator 5: Target Benefit Requests
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {benefitsList.length} Selected
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          Select standard perks and add custom package requests required for candidate matching.
        </p>

        {/* Standard Benefit Pills */}
        <div className="flex flex-wrap gap-2 mb-4">
          {STANDARD_BENEFITS.map((benefit) => {
            const isActive = benefitsList.includes(benefit);
            return (
              <button
                key={benefit}
                type="button"
                onClick={() => toggleBenefit(benefit)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                }`}
              >
                {isActive ? '✓ ' : '+ '}
                {benefit}
              </button>
            );
          })}
        </div>

        {/* Custom Benefits Entry */}
        <div>
          <label htmlFor="custom-benefit-input" className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
            Custom Benefit Request
          </label>
          <form onSubmit={addCustomBenefit} className="flex gap-2 mb-3">
            <input
              id="custom-benefit-input"
              type="text"
              value={customBenefitInput}
              onChange={(e) => setCustomBenefitInput(e.target.value)}
              placeholder="e.g. Sabbatical Policy, Home Office Allowance..."
              className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs"
            />
            <button
              type="submit"
              disabled={!customBenefitInput.trim()}
              className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white rounded-xl font-bold text-xs transition-colors disabled:opacity-50 flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </form>

          {/* Active Custom Tags */}
          {benefitsList.filter((b) => !STANDARD_BENEFITS.includes(b)).length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {benefitsList
                .filter((b) => !STANDARD_BENEFITS.includes(b))
                .map((benefit) => (
                  <span
                    key={benefit}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 rounded-full text-xs font-semibold border border-blue-200 dark:border-blue-800"
                  >
                    <span>{benefit}</span>
                    <button
                      type="button"
                      onClick={() => removeBenefit(benefit)}
                      className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
                      aria-label={`Remove custom benefit ${benefit}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
