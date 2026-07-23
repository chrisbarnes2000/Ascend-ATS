import { ArrowUp, ArrowDown, Move, Eye, EyeOff } from 'lucide-react';

interface Props {
  order?: string[];
  onChange: (order: string[]) => void;
}

interface SectionMeta {
  id: string;
  label: string;
  description: string;
}

const ALL_SECTIONS: SectionMeta[] = [
  { id: 'summary', label: 'About (Professional Summary)', description: 'The personal narrative or bio detailing your core background.' },
  { id: 'experience', label: 'Work Experience', description: 'Your chronological history of roles, companies, and achievements.' },
  { id: 'skills', label: 'Top Skills', description: 'A highly scannable tag grid of your technical and professional skills.' },
  { id: 'volunteer', label: 'Volunteer Leadership', description: 'Your external community, non-profit, or civic organization contributions.' },
  { id: 'dei_accommodations', label: 'DEI & Accommodations', description: 'Your demographics indicators and desired physical/neurodivergent interview support.' },
];

export function SectionOrderEditor({ order = [], onChange }: Props) {
  // Ensure we have all sections represented. Any missing ones get appended to the end.
  const getFullOrder = () => {
    const list = [...order];
    ALL_SECTIONS.forEach((s) => {
      if (!list.includes(s.id)) {
        list.push(s.id);
      }
    });
    // Filter out any obsolete sections if any
    return list.filter((id) => ALL_SECTIONS.some((s) => s.id === id));
  };

  const currentOrder = getFullOrder();

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const nextOrder = [...currentOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < nextOrder.length) {
      // Swap items
      const temp = nextOrder[index];
      nextOrder[index] = nextOrder[targetIndex];
      nextOrder[targetIndex] = temp;
      onChange(nextOrder);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100/50 dark:border-blue-950/20">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base flex items-center gap-2">
          <Move className="w-5 h-5 text-blue-500" />
          Customize Section Display Order
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
          Adjust the visual hierarchy of your public profile page. Sections placed at the top will be shown first to sourcing recruiters and prospective employers.
        </p>
      </div>

      <div className="space-y-3">
        {currentOrder.map((sectionId, idx) => {
          const meta = ALL_SECTIONS.find((s) => s.id === sectionId);
          if (!meta) return null;

          const isFirst = idx === 0;
          const isLast = idx === currentOrder.length - 1;

          return (
            <div 
              key={sectionId}
              className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700 transition-colors gap-4"
            >
              <div className="min-w-0 flex-1">
                <span className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-150 dark:border-slate-850">
                    {idx + 1}
                  </span>
                  {meta.label}
                </span>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 truncate">
                  {meta.description}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleMove(idx, 'up')}
                  disabled={isFirst}
                  className={`p-2 rounded-xl transition-all border ${
                    isFirst 
                      ? 'border-transparent text-slate-300 dark:text-slate-700 cursor-not-allowed' 
                      : 'border-slate-150 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-400 hover:text-blue-500'
                  }`}
                  title="Move section up"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMove(idx, 'down')}
                  disabled={isLast}
                  className={`p-2 rounded-xl transition-all border ${
                    isLast 
                      ? 'border-transparent text-slate-300 dark:text-slate-700 cursor-not-allowed' 
                      : 'border-slate-150 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-400 hover:text-blue-500'
                  }`}
                  title="Move section down"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
