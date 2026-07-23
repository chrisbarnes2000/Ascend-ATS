import React, { useRef, useEffect, useState } from 'react';
import { APIProvider, useMapsLibrary } from '@vis.gl/react-google-maps';
import { X, MapPin } from 'lucide-react';

interface Props {
  locations: string[];
  onChange: (locations: string[]) => void;
}

const API_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY || (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY || '';

function AutocompleteInput({ onAdd }: { onAdd: (loc: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const places = useMapsLibrary('places');
  const [manualValue, setManualValue] = useState('');
  const [useGooglePlaces, setUseGooglePlaces] = useState(false);

  useEffect(() => {
    if (!places || !containerRef.current || !places.PlaceAutocompleteElement) {
      setUseGooglePlaces(false);
      return;
    }

    try {
      setUseGooglePlaces(true);
      const autocompleteElement = new places.PlaceAutocompleteElement({});
      
      // Styling the web component for high contrast and full width
      autocompleteElement.style.width = '100%';
      autocompleteElement.style.display = 'block';

      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(autocompleteElement as unknown as Node);

      const handleSelect = async (event: any) => {
        try {
          const place = event.place;
          if (place) {
            if (typeof place.fetchFields === 'function') {
              await place.fetchFields({ fields: ['displayName', 'formattedAddress'] });
            }
            const name = place.displayName || place.formattedAddress;
            if (name) {
              onAdd(name);
              // Clear element value after selection to allow adding subsequent locations
              if ('value' in autocompleteElement) {
                (autocompleteElement as any).value = '';
              }
            }
          }
        } catch (err) {
          console.error('Error retrieving PlaceAutocompleteElement selection:', err);
        }
      };

      autocompleteElement.addEventListener('gmp-placeselect', handleSelect);

      return () => {
        autocompleteElement.removeEventListener('gmp-placeselect', handleSelect);
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }
      };
    } catch (e) {
      console.warn('PlaceAutocompleteElement initialization fallback:', e);
      setUseGooglePlaces(false);
    }
  }, [places, onAdd]);

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualValue.trim()) {
      onAdd(manualValue.trim());
      setManualValue('');
    }
  };

  return (
    <div className="space-y-2">
      {/* Unified Single Location Input Bar */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch">
        <div className="flex-1 relative">
          <div 
            ref={containerRef} 
            className={`w-full ${!useGooglePlaces ? 'hidden' : ''}`} 
          />
          {!useGooglePlaces && (
            <input
              type="text"
              value={manualValue}
              onChange={(e) => setManualValue(e.target.value)}
              placeholder="e.g. New York, Remote, London, Hybrid..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm shadow-xs"
            />
          )}
        </div>

        {!useGooglePlaces && (
          <button
            type="button"
            onClick={handleAddCustom}
            className="px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl font-bold text-xs transition-colors shrink-0 flex items-center justify-center gap-1"
          >
            Add Location
          </button>
        )}
      </div>

      <div className="text-[11px] text-slate-400 dark:text-slate-500 px-1">
        {useGooglePlaces 
          ? "Search & select target locations above. Selected places will be added as tags below." 
          : "Type any location or work preference (e.g. Remote, San Francisco, CA) and click Add."}
      </div>
    </div>
  );
}

export function LocationEditor({ locations, onChange }: Props) {
  const removeLocation = (loc: string) => {
    onChange(locations.filter(l => l !== loc));
  };

  const handleAdd = (loc: string) => {
    if (!locations.includes(loc)) {
      onChange([...locations, loc]);
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Target Locations</label>
      
      <APIProvider apiKey={API_KEY} solutionChannel="GMP_devsite_samples_v3_rgmautocomplete">
        <AutocompleteInput onAdd={handleAdd} />
      </APIProvider>

      {locations.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {locations.map((loc) => (
            <span
              key={loc}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-medium border border-blue-200 dark:border-blue-800 shadow-sm"
            >
              <MapPin className="w-3.5 h-3.5" />
              {loc}
              <button
                type="button"
                onClick={() => removeLocation(loc)}
                className="ml-1 text-blue-400 hover:text-rose-500 transition-colors focus:outline-none"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
