import React, { useState } from 'react';
import { MapPin, Phone, Globe, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';
import { cleanDiceBoilerplate } from '../utils/diceBoilerplateScrubber';
import { CompanyLogo } from './CompanyLogo';

interface CleanEmployerContactCardProps {
  companyName?: string;
  description?: string;
  posterFirmName?: string;
  location?: string;
  className?: string;
}

export const CleanEmployerContactCard: React.FC<CleanEmployerContactCardProps> = ({
  companyName = 'Verified Employer',
  description = '',
  posterFirmName,
  location,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const cleanedInfo = cleanDiceBoilerplate(description);

  const displayEmployerName = companyName !== 'Verified Employer' ? companyName : cleanedInfo.employerName;
  const hasDetails = cleanedInfo.addressLines.length > 0 || cleanedInfo.phoneNumbers.length > 0 || cleanedInfo.websiteUrl || cleanedInfo.department;

  return (
    <div className={`p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <CompanyLogo companyName={displayEmployerName} size="sm" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {displayEmployerName}
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Verified Entity
              </span>
            </div>
            {cleanedInfo.department && (
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5">
                {cleanedInfo.department}
              </p>
            )}
            {posterFirmName && (
              <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mt-0.5">
                Managed By: <strong>{posterFirmName}</strong>
              </p>
            )}
          </div>
        </div>

        {hasDetails && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 shrink-0"
            aria-expanded={isExpanded}
          >
            <span>{isExpanded ? 'Hide Details' : 'View Contact & Details'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Quick summary address/phone if collapsed */}
      {!isExpanded && (location || cleanedInfo.phoneNumbers[0]) && (
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
          {location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" /> {location}
            </span>
          )}
          {cleanedInfo.phoneNumbers[0] && (
            <a href={`tel:${cleanedInfo.phoneNumbers[0]}`} className="flex items-center gap-1 hover:text-indigo-600 transition-colors">
              <Phone className="w-3.5 h-3.5 text-slate-400" /> {cleanedInfo.phoneNumbers[0]}
            </a>
          )}
          {cleanedInfo.websiteUrl && (
            <a href={cleanedInfo.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
              <Globe className="w-3.5 h-3.5" /> Official Website
            </a>
          )}
        </div>
      )}

      {/* Expanded Details Card */}
      {isExpanded && (
        <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs animate-in fade-in duration-200">
          {cleanedInfo.addressLines.length > 0 && (
            <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-[10px] uppercase text-slate-400">Physical Address</span>
                {cleanedInfo.addressLines.map((line, idx) => (
                  <div key={idx}>{line}</div>
                ))}
              </div>
            </div>
          )}

          {cleanedInfo.phoneNumbers.length > 0 && (
            <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
              <Phone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-[10px] uppercase text-slate-400">Verified Contact Phone</span>
                {cleanedInfo.phoneNumbers.map((phone, idx) => (
                  <div key={idx}>
                    <a href={`tel:${phone}`} className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                      {phone}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {cleanedInfo.websiteUrl && (
            <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
              <Globe className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-[10px] uppercase text-slate-400">Official Portal</span>
                <a href={cleanedInfo.websiteUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline break-all">
                  {cleanedInfo.websiteUrl}
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
