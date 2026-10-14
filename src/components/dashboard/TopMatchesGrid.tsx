import { useState, MouseEvent } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useJobMatching, getMatchBreakdown } from '../../hooks/useJobMatching';
import { JobSeekerProfile } from '../../types';
import { Sparkles, MapPin, DollarSign, Check, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';

interface TopMatchesGridProps {
  profile: JobSeekerProfile | null;
}

export function TopMatchesGrid({ profile }: TopMatchesGridProps) {
  const { user } = useAuth();
  const { matches, loading } = useJobMatching(profile);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);

  // Pagination & Page Size State
  const [pageSize, setPageSize] = useState<number | 'all'>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const handleOneClickApply = async (job: any, tierType: string, e: MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    setApplyingJobId(job.id);
    try {
      await addDoc(collection(db, 'applications'), {
        jobId: job.id,
        seekerId: user.uid,
        companyId: job.companyId || 'company',
        status: 'applied',
        appliedAt: serverTimestamp(),
        method: tierType === 'auto' ? 'auto' : 'one-click',
        jobTitle: job.title,
        companyName: job.companyName,
        seekerName: profile?.personalInfo?.firstName ? `${profile.personalInfo.firstName} ${profile.personalInfo.lastName || ''}`.trim() : (user.displayName || user.email?.split('@')[0] || 'Candidate'),
        seekerEmail: user.email || '',
        seekerHeadline: profile?.targetRole || 'Job Seeker',
        matchPercentage: Math.round((job.matchScore || 0.85) * 100)
      });
    } catch (err) {
      console.error(err);
      alert('Error applying. Please try again.');
    } finally {
      setApplyingJobId(null);
    }
  };

  const getScoreStyles = (scoreVal: number) => {
    const val = Math.round(scoreVal * 100);
    if (val < 30) {
      return {
        card: "bg-rose-100/90 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 hover:border-rose-400 shadow-sm",
        scoreColor: "text-rose-700 dark:text-rose-300 font-bold"
      };
    } else if (val < 60) {
      return {
        card: "bg-amber-100/90 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 hover:border-amber-400 shadow-sm",
        scoreColor: "text-amber-700 dark:text-amber-300 font-bold"
      };
    } else if (val < 90) {
      return {
        card: "bg-emerald-100/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 hover:border-emerald-400 shadow-sm",
        scoreColor: "text-emerald-700 dark:text-emerald-300 font-bold"
      };
    } else {
      return {
        card: "bg-gradient-to-br from-emerald-100/90 via-amber-50/80 to-emerald-200/90 dark:from-emerald-950/60 dark:via-amber-950/40 dark:to-emerald-900/60 border-2 border-amber-400 dark:border-amber-500 shadow-lg shadow-amber-500/10 ring-2 ring-amber-400/30",
        scoreColor: "text-amber-700 dark:text-amber-300 font-extrabold"
      };
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-xs text-slate-400 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
        <span>Evaluating Role Match Scores Across Active Requisitions...</span>
      </div>
    );
  }

  // Calculate Paginated Output
  const totalMatches = matches.length;
  const isAll = pageSize === 'all';
  const numericPageSize = isAll ? totalMatches : pageSize;
  const totalPages = isAll || totalMatches === 0 ? 1 : Math.ceil(totalMatches / numericPageSize);
  const safePage = Math.min(currentPage, totalPages);
  
  const startIndex = isAll ? 0 : (safePage - 1) * numericPageSize;
  const endIndex = isAll ? totalMatches : Math.min(startIndex + numericPageSize, totalMatches);
  const displayedMatches = matches.slice(startIndex, endIndex);

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Top Recommended Role Matches
          </h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">
            Matched against your verified skills, compensation targets, and workplace preferences.
          </p>
        </div>

        {totalMatches > 0 && (
          <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
            {/* Page Size Selector */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 text-[11px] font-extrabold">
              <span className="text-[10px] uppercase text-slate-400 px-2 tracking-wider">Per Page</span>
              {([10, 25, 50, 100, 'all'] as const).map((size) => (
                <button
                  key={String(size)}
                  onClick={() => {
                    setPageSize(size);
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer uppercase ${
                    pageSize === size
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {size === 'all' ? 'All' : size}
                </button>
              ))}
            </div>

            {/* Pagination Prev/Next Controls */}
            {!isAll && totalPages > 1 && (
              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={safePage <= 1}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 text-[11px] text-slate-600 dark:text-slate-300 font-mono">
                  {safePage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={safePage >= totalPages}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Showing counter status */}
      {totalMatches > 0 && (
        <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
          <span>
            {isAll 
              ? `Showing all ${totalMatches} recommended matches`
              : `Showing ${startIndex + 1}–${endIndex} of ${totalMatches} matches`}
          </span>
          {!isAll && totalPages > 1 && (
            <span>Page {safePage} of {totalPages}</span>
          )}
        </div>
      )}

      {matches.length === 0 ? (
        <div className="py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400 text-xs font-bold">
          No active matching roles found. Update your profile targets or ingest position links in the Candidate Tracker!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayedMatches.map(({ job, score, tier }) => {
            const styles = getScoreStyles(score);
            const breakdown = getMatchBreakdown(profile, job);

            return (
              <div
                key={job.id}
                onClick={() => window.location.hash = `#job/${job.id}`}
                className={`p-6 rounded-3xl transition-all cursor-pointer relative group flex flex-col justify-between ${styles.card}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors leading-tight">
                        {job.title}
                      </h3>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1">
                        {job.companyName}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-sm tracking-tight ${styles.scoreColor}`}>
                        {Math.round(score * 100)}% Match
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4 text-[10px] font-bold">
                    <span className="bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg flex items-center gap-1 border border-slate-200/50 dark:border-slate-800/50">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {job.workplaceType || 'Remote'}
                    </span>

                    {(job.salaryMin || job.parsedCriteria?.salaryRange?.min) && (
                      <span className="bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg flex items-center gap-1 border border-slate-200/50 dark:border-slate-800/50 font-mono">
                        <DollarSign className="w-3 h-3 text-emerald-500" />
                        ${((job.salaryMin || job.parsedCriteria?.salaryRange?.min || 80000) / 1000).toFixed(0)}k/yr
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
                    {job.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between">
                  <div className="text-[10px] font-bold text-slate-500">
                    {breakdown.skillsMatch.matchedCount} Core Skills Matched
                  </div>

                  <button
                    onClick={(e) => handleOneClickApply(job, tier, e)}
                    disabled={applyingJobId === job.id}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
                  >
                    {applyingJobId === job.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>{tier === 'auto' ? 'Auto Apply' : '1-Click Apply'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
