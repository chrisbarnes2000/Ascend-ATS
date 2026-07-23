import { WorkExperience } from '../../types';
import { Plus, Trash2 } from 'lucide-react';

interface Props {
  experiences: WorkExperience[];
  onChange: (experiences: WorkExperience[]) => void;
}

export function ExperienceEditor({ experiences, onChange }: Props) {
  const addExperience = () => {
    onChange([
      ...(experiences || []),
      { company: '', role: '', startDate: '', description: '', skills: [] }
    ]);
  };

  const updateExperience = (index: number, field: keyof WorkExperience, value: any) => {
    const newExp = [...(experiences || [])];
    newExp[index] = { ...newExp[index], [field]: value };
    onChange(newExp);
  };

  const removeExperience = (index: number) => {
    const newExp = [...experiences];
    newExp.splice(index, 1);
    onChange(newExp);
  };

  return (
    <div className="space-y-6">
      {(experiences || []).map((exp, i) => (
        <div key={i} className="p-6 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex justify-between items-start">
            <h3 className="font-bold">Experience {i + 1}</h3>
            <button onClick={() => removeExperience(i)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Company</label>
              <input 
                type="text" 
                value={exp.company}
                onChange={(e) => updateExperience(i, 'company', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Role</label>
              <input 
                type="text" 
                value={exp.role}
                onChange={(e) => updateExperience(i, 'role', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Start Date</label>
              <input 
                type="text" 
                value={exp.startDate}
                onChange={(e) => updateExperience(i, 'startDate', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">End Date</label>
              <input 
                type="text" 
                value={exp.endDate || ''}
                onChange={(e) => updateExperience(i, 'endDate', e.target.value)}
                placeholder="Present"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
            <textarea 
              value={exp.description}
              onChange={(e) => updateExperience(i, 'description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      ))}
      <button 
        onClick={addExperience}
        className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-blue-300 hover:text-blue-500 transition-all font-medium flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" /> Add Experience
      </button>
    </div>
  );
}
