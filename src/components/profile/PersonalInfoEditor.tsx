import { JobSeekerProfile } from '../../types';

interface Props {
  info: JobSeekerProfile['personalInfo'];
  onChange: (info: JobSeekerProfile['personalInfo']) => void;
}

export function PersonalInfoEditor({ info, onChange }: Props) {
  const update = (field: keyof JobSeekerProfile['personalInfo'], value: string) => {
    onChange({ ...info, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">First Name</label>
          <input 
            type="text" 
            value={info.firstName}
            onChange={(e) => update('firstName', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:border-slate-800 text-slate-900 dark:text-slate-100"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Last Name</label>
          <input 
            type="text" 
            value={info.lastName}
            onChange={(e) => update('lastName', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:border-slate-800 text-slate-900 dark:text-slate-100"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Preferred Name <span className="text-slate-400 font-normal">(Optional)</span></label>
          <input 
            type="text" 
            value={info.preferredName || ''}
            onChange={(e) => update('preferredName', e.target.value)}
            placeholder="e.g. Chris"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:border-slate-800 text-slate-900 dark:text-slate-100"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pronouns <span className="text-slate-400 font-normal">(Optional)</span></label>
          <input 
            type="text" 
            value={info.pronouns || ''}
            onChange={(e) => update('pronouns', e.target.value)}
            placeholder="e.g. he/him, they/them"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:border-slate-800 text-slate-900 dark:text-slate-100"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone</label>
          <input 
            type="text" 
            value={info.phone || ''}
            onChange={(e) => update('phone', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:border-slate-800 text-slate-900 dark:text-slate-100"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Location</label>
          <input 
            type="text" 
            value={info.location || ''}
            onChange={(e) => update('location', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:border-slate-800 text-slate-900 dark:text-slate-100"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">LinkedIn URL</label>
          <input 
            type="url" 
            value={info.linkedinUrl || ''}
            onChange={(e) => update('linkedinUrl', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:border-slate-800 text-slate-900 dark:text-slate-100"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Portfolio URL</label>
          <input 
            type="url" 
            value={info.portfolioUrl || ''}
            onChange={(e) => update('portfolioUrl', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:border-slate-800 text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>
    </div>
  );
}
