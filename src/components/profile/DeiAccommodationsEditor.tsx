import { JobSeekerProfile } from '../../types';
import { Heart, Sparkles, Smile, ShieldCheck, HelpCircle } from 'lucide-react';

interface Props {
  data?: JobSeekerProfile['deiAndAccommodations'];
  onChange: (data: JobSeekerProfile['deiAndAccommodations']) => void;
}

const defaultDei: NonNullable<JobSeekerProfile['deiAndAccommodations']> = {
  gender: '',
  race: '',
  veteranStatus: '',
  disabilityStatus: '',
  needsAccommodations: false,
  accommodationTypes: [],
  accommodationDetails: '',
  shareDeiWithEmployers: false,
};

export function DeiAccommodationsEditor({ data = defaultDei, onChange }: Props) {
  const update = (field: keyof NonNullable<JobSeekerProfile['deiAndAccommodations']>, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const handleCheckboxChange = (type: string, checked: boolean) => {
    const currentTypes = data.accommodationTypes || [];
    let nextTypes = [...currentTypes];
    if (checked) {
      if (!nextTypes.includes(type)) {
        nextTypes.push(type);
      }
    } else {
      nextTypes = nextTypes.filter(t => t !== type);
    }
    update('accommodationTypes', nextTypes);
  };

  const accommodationsList = [
    { id: 'screen-reader', label: 'Screen reader compatibility & high-contrast assets' },
    { id: 'extra-time', label: 'Extra time allowance for coding challenges & technical assessments' },
    { id: 'transcription', label: 'Captioning or live transcription during video interviews' },
    { id: 'sign-language', label: 'Sign Language Interpretation (ASL / BSL)' },
    { id: 'quiet-environment', label: 'Quiet, low-stimulation interview setting / interview questions in advance' },
    { id: 'physical-access', label: 'Wheelchair / step-free physical building accessibility' },
    { id: 'other', label: 'Other custom neurodivergent or physical accommodations' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Introduction Note */}
      <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-950/30 flex gap-4 min-w-0">
        <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0 h-10 w-10 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">Inclusivity & Equal Opportunity</h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
            We are dedicated to building a fair hiring ecosystem. Demographic options and accommodation details are voluntary. We secure this data under strict privacy keys, and it will only be shared with employers if you opt in.
          </p>
        </div>
      </div>

      {/* DEI Demographic Options */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500" />
            Demographics & DEI Indicators <span className="text-xs font-normal text-slate-400">(Optional)</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Self-identification inputs help employers track their diversity programs and recruit candidate slates with inclusivity.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Gender Identity</label>
            <select
              value={data.gender || ''}
              onChange={(e) => update('gender', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:border-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="">Choose gender...</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Non-binary">Non-binary</option>
              <option value="Self-describe">Self-describe / Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Race / Ethnicity</label>
            <select
              value={data.race || ''}
              onChange={(e) => update('race', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:border-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="">Choose race/ethnicity...</option>
              <option value="White">White / Caucasian</option>
              <option value="Black or African American">Black or African American</option>
              <option value="Hispanic or Latino">Hispanic or Latino</option>
              <option value="Asian">Asian</option>
              <option value="Native American or Alaska Native">Native American or Alaska Native</option>
              <option value="Native Hawaiian or Pacific Islander">Native Hawaiian or Pacific Islander</option>
              <option value="Two or more races">Two or more races</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Veteran Status</label>
            <select
              value={data.veteranStatus || ''}
              onChange={(e) => update('veteranStatus', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:border-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="">Choose veteran status...</option>
              <option value="Not a protected veteran">I am not a protected veteran</option>
              <option value="Protected veteran">I identify as one or more protected veterans</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Disability Status</label>
            <select
              value={data.disabilityStatus || ''}
              onChange={(e) => update('disabilityStatus', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:border-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="">Choose disability status...</option>
              <option value="No disability">No, I do not have a disability / history of disability</option>
              <option value="Has disability">Yes, I have a disability (or have a history of disability)</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>
        </div>

        {/* Share Switch */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
          <div className="min-w-0 flex-1 pr-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Share Demographics with Employers</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Toggle this on to securely let certified DEI partner employers see your voluntary demographic disclosures.</p>
          </div>
          <div className="shrink-0">
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={data.shareDeiWithEmployers}
                onChange={(e) => update('shareDeiWithEmployers', e.target.checked)}
              />
              <div className="relative w-11 h-6 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        </div>
      </div>

      <hr className="border-slate-100 dark:border-slate-800" />

      {/* Accommodations */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Interview & Assessment Accommodations
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Let matching employers know about the accommodations you need to show your full potential during assessment and interviews.</p>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
          <div className="min-w-0 flex-1 pr-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Require Interview Accommodations</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Enabling this flags to interviewing teams that specific support conditions are requested.</p>
          </div>
          <div className="shrink-0">
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={data.needsAccommodations}
                onChange={(e) => update('needsAccommodations', e.target.checked)}
              />
              <div className="relative w-11 h-6 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        </div>

        {data.needsAccommodations && (
          <div className="space-y-4 p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800/80 animate-in slide-in-from-top-4 duration-300">
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Select Accommodations Required</label>
              <div className="grid grid-cols-1 gap-2.5">
                {accommodationsList.map((item) => {
                  const isChecked = (data.accommodationTypes || []).includes(item.id);
                  return (
                    <label key={item.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-white dark:hover:bg-slate-900 border border-transparent hover:border-slate-150 dark:hover:border-slate-800/50 cursor-pointer select-none transition-colors">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => handleCheckboxChange(item.id, e.target.checked)}
                        className="mt-1 rounded text-emerald-600 focus:ring-emerald-500 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 h-4 w-4"
                      />
                      <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-tight">{item.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Additional Accommodation Details</label>
              <textarea
                value={data.accommodationDetails || ''}
                onChange={(e) => update('accommodationDetails', e.target.value)}
                placeholder="Please describe any tools, timing rules, physical access, or support needs to assist our partnering employers with scheduling..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm placeholder:text-slate-400"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
