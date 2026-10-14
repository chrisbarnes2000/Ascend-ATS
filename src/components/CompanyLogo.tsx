import React, { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';
import { resolveCompanyBranding } from '../utils/companyLogoResolver';

export interface CompanyLogoProps {
  companyName: string;
  jobTitle?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({
  companyName,
  jobTitle,
  className = '',
  size = 'md'
}) => {
  // Cascading error state machine: 'primary' -> 'secondary' -> 'monogram'
  const [loadStage, setLoadStage] = useState<'primary' | 'secondary' | 'monogram'>('primary');

  // Reset stage whenever companyName or jobTitle changes
  useEffect(() => {
    setLoadStage('primary');
  }, [companyName, jobTitle]);

  const branding = resolveCompanyBranding(companyName, jobTitle);
  const isConfidential = !companyName || companyName.toLowerCase().includes('confidential');

  const sizeClasses = size === 'sm' 
    ? 'w-10 h-10 rounded-xl text-xs' 
    : size === 'lg' 
    ? 'w-16 h-16 rounded-2xl text-lg font-black' 
    : 'w-12 h-12 sm:w-14 sm:h-14 rounded-2xl text-sm sm:text-base font-black';

  // Confidential client render
  if (isConfidential) {
    return (
      <div 
        className={`${sizeClasses} bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shrink-0 text-slate-400 ${className}`}
        title="Confidential Employer"
        aria-label="Confidential Employer"
      >
        <Lock className="w-5 h-5" aria-hidden="true" />
      </div>
    );
  }

  // Tier 3 / Monogram fallback: Crisp SVG Lettermark with WCAG AA gradient
  if (loadStage === 'monogram') {
    return (
      <div 
        className={`${sizeClasses} bg-gradient-to-br ${branding.gradientClass} text-white flex items-center justify-center shrink-0 shadow-sm border border-white/20 select-none tracking-wider ${className}`}
        title={`${branding.companyName} logo`}
        role="img"
        aria-label={`${branding.companyName} logo monogram`}
      >
        <span>{branding.initials}</span>
      </div>
    );
  }

  const currentSrc = loadStage === 'primary' 
    ? branding.primaryLogoUrl 
    : branding.secondaryLogoUrl;

  const handleImageError = () => {
    if (loadStage === 'primary') {
      setLoadStage('secondary');
    } else {
      setLoadStage('monogram');
    }
  };

  return (
    <div 
      className={`${sizeClasses} bg-white dark:bg-slate-900 flex items-center justify-center border border-slate-200 dark:border-slate-700 shrink-0 overflow-hidden p-1 shadow-sm ${className}`}
    >
      <img
        src={currentSrc}
        alt={`${branding.companyName} logo`}
        className="w-full h-full object-contain rounded-lg transition-transform hover:scale-105"
        loading="lazy"
        onError={handleImageError}
      />
    </div>
  );
};
