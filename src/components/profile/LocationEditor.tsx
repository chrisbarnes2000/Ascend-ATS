import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { X, MapPin, Plus, Loader2, Navigation, Clock } from 'lucide-react';
import { TargetLocation } from '../../types';

interface LocationEditorProps {
  locations: TargetLocation[];
  onChange: (locations: TargetLocation[]) => void;
  maxLocations?: number;
}

interface PlacePrediction {
  place_id: string;
  description: string;
  main_text?: string;
  secondary_text?: string;
}

const QUICK_SAMPLE_LOCATIONS = [
  { placeId: 'ChIJVTPokywQkFQRmtVEaUZlJRA', description: 'Seattle, WA, USA' },
  { placeId: 'ChIJyU-ld-_6kFQRe0V4XxLGcw0', description: 'Bonney Lake, WA 98391, USA' },
  { placeId: 'ChIJIQBpAG2ahYAR_6128GcTUEo', description: 'San Francisco, CA, USA' },
  { placeId: 'ChIJ4zGFAZpYwokRGUGPspVuU_0', description: 'Washington, DC, USA' }
];

const DISTANCE_OPTIONS = [5, 10, 15, 25, 50];
const COMMUTE_OPTIONS = [15, 30, 45, 60, 90, 120];

export function LocationEditor({
  locations = [],
  onChange,
  maxLocations = 5
}: LocationEditorProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlacePrediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced autocomplete query
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const { data } = await axios.get<PlacePrediction[]>(
          `/api/autocomplete?q=${encodeURIComponent(trimmed)}`
        );
        if (Array.isArray(data)) {
          setSuggestions(data);
          setIsOpen(data.length > 0);
          setSelectedIndex(-1);
        }
      } catch (err) {
        console.warn('Autocomplete fetch fallback:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close suggestion dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddLocation = (candidate: { placeId: string; description: string }) => {
    const desc = candidate.description.trim();
    if (!desc) return;

    if (locations.length >= maxLocations) {
      setErrorMsg(`Maximum ${maxLocations} locations reached.`);
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    // Check if already added
    const alreadyExists = locations.some(
      l => l.placeId === candidate.placeId || l.description.toLowerCase() === desc.toLowerCase()
    );

    if (alreadyExists) {
      setErrorMsg(`"${desc}" is already added.`);
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    const newLoc: TargetLocation = {
      placeId: candidate.placeId || `loc_${Date.now()}_${desc.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      description: desc,
      distanceConstraintMiles: 25, // Default 25 miles
      commuteConstraintMinutes: 45 // Default 45 mins
    };

    onChange([...locations, newLoc]);
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    setErrorMsg(null);
  };

  const handleAddFromInput = () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    // If an item in the suggestion list is currently selected via keyboard
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      handleAddLocation({
        placeId: suggestions[selectedIndex].place_id,
        description: suggestions[selectedIndex].description
      });
      return;
    }

    // If suggestions are available and match
    if (suggestions.length > 0) {
      handleAddLocation({
        placeId: suggestions[0].place_id,
        description: suggestions[0].description
      });
      return;
    }

    // Fallback: Direct entry of zip code or city
    const isZip = /^\d{5}(-\d{4})?$/.test(trimmed);
    const generatedPlaceId = isZip
      ? `zip_${trimmed}`
      : `custom_${Date.now()}_${trimmed.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    handleAddLocation({
      placeId: generatedPlaceId,
      description: isZip ? `${trimmed}, USA` : trimmed
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen && suggestions.length > 0) {
        setIsOpen(true);
      }
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleAddFromInput();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const removeLocation = (placeId: string) => {
    onChange(locations.filter(l => l.placeId !== placeId));
  };

  const updateConstraint = (
    placeId: string,
    field: 'distanceConstraintMiles' | 'commuteConstraintMinutes',
    value: number
  ) => {
    onChange(
      locations.map(l => (l.placeId === placeId ? { ...l, [field]: value } : l))
    );
  };

  const isFull = locations.length >= maxLocations;

  return (
    <div className="space-y-4" ref={containerRef}>
      <div className="flex items-center justify-between">
        <label 
          htmlFor="location-search-input"
          className="block text-xs font-bold text-slate-500 uppercase"
        >
          Target Locations ({locations.length}/{maxLocations})
        </label>
        <span className="text-xs text-slate-400">
          In-person & hybrid commute radius (1–50 mi / 10m–2h)
        </span>
      </div>

      {/* Autocomplete Input Bar */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              id="location-search-input"
              ref={inputRef}
              type="text"
              value={query}
              disabled={isFull}
              onChange={(e) => {
                setQuery(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (suggestions.length > 0) setIsOpen(true);
              }}
              placeholder={
                isFull
                  ? `Max limit of ${maxLocations} locations reached`
                  : 'Enter zip code (e.g. 98391) or city (e.g. Seattle) and hit Enter...'
              }
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={isOpen}
              aria-controls="location-autocomplete-list"
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
            />
            <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            {loading && (
              <Loader2 className="absolute right-3.5 top-3 w-4 h-4 text-blue-500 animate-spin" />
            )}
          </div>

          <button
            type="button"
            onClick={handleAddFromInput}
            disabled={!query.trim() || isFull}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            aria-label="Add location tag"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>

        {/* Suggestions Dropdown */}
        {isOpen && suggestions.length > 0 && (
          <ul
            id="location-autocomplete-list"
            role="listbox"
            className="absolute z-20 w-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60"
          >
            {suggestions.map((s, idx) => {
              const isHighlighted = idx === selectedIndex;
              return (
                <li
                  key={s.place_id || idx}
                  role="option"
                  aria-selected={isHighlighted}
                  onClick={() => handleAddLocation({ placeId: s.place_id, description: s.description })}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`px-4 py-2.5 text-sm cursor-pointer transition-colors flex items-center justify-between ${
                    isHighlighted
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{s.description}</span>
                  </div>
                  <span className="text-xs text-blue-600 dark:text-blue-400 shrink-0 font-medium">
                    + Add
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {errorMsg && (
        <p className="text-xs text-rose-500 font-medium" role="alert">
          {errorMsg}
        </p>
      )}

      {/* Selected Location Tags with Distance/Commute Constraints */}
      {locations.length > 0 ? (
        <div className="space-y-2.5 pt-1">
          {locations.map((loc) => (
            <div
              key={loc.placeId}
              className="p-3 bg-white dark:bg-slate-900/70 rounded-xl border border-blue-200 dark:border-blue-900/50 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate block">
                    {loc.description}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono truncate block">
                    Place ID: {loc.placeId.length > 25 ? `${loc.placeId.slice(0, 25)}...` : loc.placeId}
                  </span>
                </div>
              </div>

              {/* Commute and Distance Modifiers */}
              <div className="flex items-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                {/* Distance Selector */}
                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <Navigation className="w-3.5 h-3.5 text-slate-400" />
                  <label htmlFor={`dist-${loc.placeId}`} className="sr-only">
                    Max Distance Radius
                  </label>
                  <select
                    id={`dist-${loc.placeId}`}
                    value={loc.distanceConstraintMiles || 25}
                    onChange={(e) =>
                      updateConstraint(loc.placeId, 'distanceConstraintMiles', Number(e.target.value))
                    }
                    className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:ring-1 focus:ring-blue-500"
                  >
                    {DISTANCE_OPTIONS.map((dist) => (
                      <option key={dist} value={dist}>
                        {dist} miles
                      </option>
                    ))}
                  </select>
                </div>

                {/* Commute Time Selector */}
                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <label htmlFor={`commute-${loc.placeId}`} className="sr-only">
                    Max Commute Time
                  </label>
                  <select
                    id={`commute-${loc.placeId}`}
                    value={loc.commuteConstraintMinutes || 45}
                    onChange={(e) =>
                      updateConstraint(loc.placeId, 'commuteConstraintMinutes', Number(e.target.value))
                    }
                    className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:ring-1 focus:ring-blue-500"
                  >
                    {COMMUTE_OPTIONS.map((mins) => (
                      <option key={mins} value={mins}>
                        {mins >= 60 ? `${mins / 60}h` : `${mins}m`} commute
                      </option>
                    ))}
                  </select>
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeLocation(loc.placeId)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors focus-visible:ring-2 focus-visible:ring-rose-500"
                  aria-label={`Remove location ${loc.description}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400 italic">
          No locations added yet. Enter a zip code or city above or use sample locations.
        </p>
      )}

      {/* Quick sample location buttons */}
      {!isFull && (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60">
          <span className="text-xs font-medium text-slate-400 block mb-2">
            Quick Add Locations:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_SAMPLE_LOCATIONS.map((sample) => {
              const isAdded = locations.some(l => l.placeId === sample.placeId);
              return (
                <button
                  key={sample.placeId}
                  type="button"
                  disabled={isAdded}
                  onClick={() => handleAddLocation(sample)}
                  className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-colors ${
                    isAdded
                      ? 'bg-slate-100 dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800 cursor-default opacity-60'
                      : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  {isAdded ? '✓ ' : '+ '}
                  {sample.description.split(',')[0]}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
