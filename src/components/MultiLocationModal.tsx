import React, { useEffect, useRef } from 'react';
import { MapPin, X, CheckCircle2, Building, Sparkles } from 'lucide-react';

interface MultiLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  companyName: string;
  allLocations: string[];
  matchedLocation?: string;
  workplaceType?: 'Remote' | 'Hybrid' | 'On-Site';
}

export const MultiLocationModal: React.FC<MultiLocationModalProps> = ({
  isOpen,
  onClose,
  jobTitle,
  companyName,
  allLocations,
  matchedLocation,
  workplaceType
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Focus close button on mount for keyboard navigation
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="multi-location-modal-title"
        aria-describedby="multi-location-modal-desc"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-7 relative max-h-[90vh] flex flex-col focus:outline-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
              <Building className="w-4 h-4 shrink-0" />
              <span>{companyName}</span>
              {workplaceType && (
                <>
                  <span>•</span>
                  <span>{workplaceType}</span>
                </>
              )}
            </div>
            <h2 id="multi-location-modal-title" className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 truncate">
              {jobTitle}
            </h2>
            <p id="multi-location-modal-desc" className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {allLocations.length} locations actively considered for this requisition
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close location options dialog"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus:outline-hidden cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preference Banner */}
        {matchedLocation && (
          <div className="mt-4 p-3.5 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-emerald-900 dark:text-emerald-200">
                Matches your target location:
              </span>{' '}
              <span className="text-emerald-800 dark:text-emerald-300 font-semibold">
                {matchedLocation}
              </span>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                The employer is considering candidates in your preferred market as well as other listed office sites below.
              </p>
            </div>
          </div>
        )}

        {/* Locations List */}
        <div className="mt-4 overflow-y-auto space-y-2.5 flex-1 pr-1 max-h-[360px]">
          {allLocations.map((loc, idx) => {
            const isMatch = matchedLocation && loc.toLowerCase() === matchedLocation.toLowerCase();

            return (
              <div
                key={`${loc}-${idx}`}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-colors ${
                  isMatch
                    ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-950 dark:text-blue-100 shadow-xs'
                    : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isMatch
                      ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300'
                      : 'bg-slate-200/70 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400'
                  }`}>
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold truncate">{loc}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Site {idx + 1} of {allLocations.length}
                    </div>
                  </div>
                </div>

                {isMatch && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 shrink-0 border border-emerald-200 dark:border-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Your Target</span>
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus:outline-hidden cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
