import React from 'react';
import { Sparkles, Briefcase, Kanban, Users } from 'lucide-react';
import { motion } from 'motion/react';

export type DashboardView = 'matches' | 'pipeline' | 'tracker' | 'culture_matrix';

export interface NavTabItem {
  id: DashboardView;
  desktopLabel: string;
  mobileLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  accentBg: string;
}

export const DASHBOARD_NAV_TABS: readonly NavTabItem[] = [
  {
    id: 'matches',
    desktopLabel: 'Top Matches',
    mobileLabel: 'Matches',
    icon: Sparkles,
    accentColor: 'text-blue-600 dark:text-blue-400',
    accentBg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
  },
  {
    id: 'pipeline',
    desktopLabel: 'Application Pipeline',
    mobileLabel: 'Pipeline',
    icon: Briefcase,
    accentColor: 'text-blue-600 dark:text-blue-400',
    accentBg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
  },
  {
    id: 'tracker',
    desktopLabel: 'Job Tracker & AI Copilot',
    mobileLabel: 'Tracker',
    icon: Kanban,
    accentColor: 'text-blue-600 dark:text-blue-400',
    accentBg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
  },
  {
    id: 'culture_matrix',
    desktopLabel: 'Culture & Recruiter Matrix',
    mobileLabel: 'Culture',
    icon: Users,
    accentColor: 'text-indigo-600 dark:text-indigo-400',
    accentBg: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
  }
] as const;

export function isValidDashboardView(view: unknown): view is DashboardView {
  return typeof view === 'string' && (
    view === 'matches' || 
    view === 'pipeline' || 
    view === 'tracker' || 
    view === 'culture_matrix'
  );
}

export interface DashboardSubNavProps {
  currentView: DashboardView;
  onViewChange: (view: DashboardView) => void;
  matchesCount?: number;
  pipelineCount?: number;
  className?: string;
}

/**
 * Dashboard Sub-Navigation Component
 *
 * Implements Approach A:
 * - Hybrid Micro-Icons + Responsive Adaptive Typography (Concise mobile labels, full desktop titles)
 * - Single-row horizontal scrollable track preventing awkward line breaks on mobile devices
 * - High-contrast WCAG 2.1 AA accessible focus and active state indicators
 */
export const DashboardSubNav: React.FC<DashboardSubNavProps> = ({
  currentView,
  onViewChange,
  matchesCount,
  pipelineCount,
  className = ''
}) => {
  // Defensive input handling
  const activeView: DashboardView = isValidDashboardView(currentView) ? currentView : 'matches';

  const handleSelect = (tabId: DashboardView) => {
    if (isValidDashboardView(tabId)) {
      onViewChange(tabId);
    }
  };

  return (
    <nav 
      aria-label="Dashboard views"
      className={`w-full border-b border-slate-200/80 dark:border-slate-800 pb-2 sm:pb-3 ${className}`}
    >
      <div 
        role="tablist"
        aria-orientation="horizontal"
        className="flex items-center gap-1.5 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth w-full px-0.5"
      >
        {DASHBOARD_NAV_TABS.map((tab) => {
          const isActive = activeView === tab.id;
          const Icon = tab.icon;
          const count = tab.id === 'matches' ? matchesCount : tab.id === 'pipeline' ? pipelineCount : undefined;

          return (
            <button
              key={tab.id}
              role="tab"
              id={`tab-${tab.id}`}
              aria-controls={`tabpanel-${tab.id}`}
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => handleSelect(tab.id)}
              className={`
                group relative flex items-center gap-1.5 sm:gap-2 
                px-3 sm:px-2.5 py-2 sm:pb-4 rounded-xl sm:rounded-none 
                font-bold text-xs sm:text-sm whitespace-nowrap transition-all shrink-0
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
                min-h-[40px] sm:min-h-[44px]
                ${isActive 
                  ? `${tab.accentBg} sm:bg-transparent ${tab.accentColor} font-extrabold shadow-xs sm:shadow-none` 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/40 sm:hover:bg-transparent'
                }
              `}
            >
              <Icon 
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 transition-transform ${
                  isActive ? 'scale-110' : 'group-hover:scale-105 opacity-70 group-hover:opacity-100'
                }`} 
                aria-hidden="true"
              />

              {/* Mobile text: Concise noun */}
              <span className="inline sm:hidden">
                {tab.mobileLabel}
              </span>

              {/* Desktop text: Full detailed title */}
              <span className="hidden sm:inline">
                {tab.desktopLabel}
              </span>

              {/* Optional count badge */}
              {typeof count === 'number' && count > 0 && (
                <span 
                  className={`
                    ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold border transition-colors
                    ${isActive 
                      ? 'bg-blue-600 text-white border-blue-600 dark:bg-blue-500 dark:border-blue-500' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }
                  `}
                  aria-label={`${count} items`}
                >
                  {count}
                </span>
              )}

              {/* Active Tab Bottom Indicator (Desktop layoutId animation) */}
              {isActive && (
                <motion.div
                  layoutId="dashboard-sub-tab"
                  className={`hidden sm:block absolute bottom-0 left-0 right-0 h-1 rounded-full ${
                    tab.id === 'culture_matrix' ? 'bg-indigo-600 dark:bg-indigo-400' : 'bg-blue-600 dark:bg-blue-500'
                  }`}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
