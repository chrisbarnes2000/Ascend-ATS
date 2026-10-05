import { useState, useEffect } from 'react';
import { JobSeekerProfile, RecruiterProfile, Job } from '../types';
import { 
  Shield, Slash, Briefcase, MapPin, GraduationCap, Award, Heart, Smile, Clock, 
  Sparkles, Users, Lock, EyeOff, Globe, CheckCircle2, ExternalLink, Mail, Phone,
  ChevronRight, Building, Award as BadgeCheck
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { RichText } from '../components/profile/RichText';
import { SkillVisualizer } from '../components/profile/SkillVisualizer';

export function PublicProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<JobSeekerProfile | null>(null);
  const [profileType, setProfileType] = useState<'jobSeeker' | 'recruiter'>('jobSeeker');
  const [recruiterProfile, setRecruiterProfile] = useState<RecruiterProfile | null>(null);
  const [recruiterJobs, setRecruiterJobs] = useState<Job[]>([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Basic hash routing extraction (e.g. #profile/some-uid)
    const uid = window.location.hash.split('/')[1];
    
    if (!uid) {
      setError(true);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('../firebase/config');
        
        // 1. Fetch user doc to check role
        const userDoc = await getDoc(doc(db, 'users', uid));
        const userData = userDoc.exists() ? userDoc.data() : null;
        const isRecruiter = userData?.accountType === 'recruiter' || userData?.staffingRole === 'recruiter';

        if (isRecruiter) {
          setProfileType('recruiter');
          const recSnap = await getDoc(doc(db, `users/${uid}/profiles/recruiter`));
          const compSnap = await getDoc(doc(db, `users/${uid}/profiles/company`));
          const recData = recSnap.exists() ? recSnap.data() : {};
          const compData = compSnap.exists() ? compSnap.data() : {};

          const effectiveCompanyId = recData.companyId || compData.claimedCompanyId || userData?.companyId || userData?.claimedCompanyId || '';
          const effectiveCompanyName = recData.companyName || compData.companyName || userData?.companyName || userData?.staffingFirmName || 'Verified Organization';

          const assembledRecruiter: RecruiterProfile = {
            personalInfo: {
              firstName: recData.personalInfo?.firstName || userData?.displayName || userData?.email?.split('@')[0] || 'Recruiter',
              lastName: recData.personalInfo?.lastName || '',
              title: recData.personalInfo?.title || 'Talent Acquisition Partner',
              phone: recData.personalInfo?.phone || '',
              email: recData.personalInfo?.email || userData?.email || '',
              linkedinUrl: recData.personalInfo?.linkedinUrl || compData.linkedin || '',
              location: recData.personalInfo?.location || compData.location || 'Remote'
            },
            bio: recData.bio || compData.description || 'Specialized talent partner dedicated to matching top candidates with high-impact teams.',
            specialties: recData.specialties || ['Technical Sourcing', 'Leadership', 'Career Strategy'],
            companyId: effectiveCompanyId,
            companyName: effectiveCompanyName,
            companyLogoUrl: recData.companyLogoUrl || '',
            website: recData.website || compData.website || '',
            isPublic: recData.isPublic !== false,
            yearsExperience: recData.yearsExperience || 3
          };

          const isOwner = user && user.uid === uid;
          if (!assembledRecruiter.isPublic && !isOwner) {
            setError(true);
            setLoading(false);
            return;
          }

          setRecruiterProfile(assembledRecruiter);

          // Fetch active open jobs for this recruiter's company
          if (effectiveCompanyId) {
            const { collection, query, where, getDocs } = await import('firebase/firestore');
            const jobsQ = query(
              collection(db, 'jobs'),
              where('companyId', '==', effectiveCompanyId),
              where('status', '==', 'active')
            );
            const jobsSnap = await getDocs(jobsQ);
            setRecruiterJobs(jobsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Job)));
          }
          setLoading(false);
          return;
        }

        // 2. Fallback to JobSeeker profile
        setProfileType('jobSeeker');
        const profileRef = doc(db, `users/${uid}/profiles/main`);
        const snapshot = await getDoc(profileRef);
        
        if (snapshot.exists()) {
          const data = snapshot.data();
          const isOwner = user && user.uid === uid;
          
          if (data.privacy?.isPublic === true || isOwner) {
            
            // Apply Dynamic Sliding Privacy Levels (1: None, 2: Masked Contact, 3: Anonymous Persona, 4: Maximum Cloak)
            const currentLevel = data.privacy?.privacyLevel || (data.privacy?.redactPii ? 3 : 1);
            
            if (currentLevel > 1 && data.personalInfo && !isOwner) {
               if (currentLevel >= 2) {
                 data.personalInfo.email = '[Contact Masked]';
                 data.personalInfo.phone = '[Contact Masked]';
                 data.personalInfo.linkedinUrl = '';
                 data.personalInfo.portfolioUrl = '';
               }
               if (currentLevel >= 3) {
                 data.personalInfo.firstName = data.personalInfo.firstName ? data.personalInfo.firstName.charAt(0) + '.' : '';
                 data.personalInfo.lastName = data.personalInfo.lastName ? data.personalInfo.lastName.charAt(0) + '.' : '';
                 data.personalInfo.preferredName = '';
                 data.personalInfo.pronouns = '';
               }
            }

            if (currentLevel >= 4 && data.workExperience && !isOwner) {
               data.workExperience = data.workExperience.map((exp: any) => ({
                 ...exp,
                 company: '[Redacted Employer]'
               }));
            }
            
            setProfile(data as JobSeekerProfile);
          } else {
            setError(true);
          }
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Failed to fetch profile', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  // Auto-mark candidate applications as 'viewed' after 6 seconds of viewing candidate full profile
  useEffect(() => {
    if (!profile || !user) return;
    const uid = window.location.hash.split('/')[1];
    if (!uid || uid === user.uid) return; // Skip if self

    const timer = setTimeout(async () => {
      try {
        const { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } = await import('firebase/firestore');
        const { db } = await import('../firebase/config');

        const appsQuery = query(
          collection(db, 'applications'),
          where('seekerId', '==', uid),
          where('status', '==', 'applied')
        );

        const appsSnap = await getDocs(appsQuery);
        appsSnap.forEach(async (appDoc) => {
          await updateDoc(doc(db, 'applications', appDoc.id), {
            status: 'viewed',
            lastReviewedAt: serverTimestamp()
          });
        });
      } catch (err) {
        console.error('Error auto-marking application as viewed from PublicProfile:', err);
      }
    }, 6000);

    return () => clearTimeout(timer);
  }, [profile, user]);

  if (loading) return <div className="p-24 text-center dark:text-slate-400 font-medium">Loading Profile...</div>;
  
  if (profileType === 'recruiter' && recruiterProfile) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 w-full md:w-[75vw] max-w-none mx-auto space-y-8">
        {/* Recruiter Header Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 md:p-12 relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-slate-150 dark:border-slate-800">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-3xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                {recruiterProfile.personalInfo.firstName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> Verified Recruiter Profile
                  </span>
                  {recruiterProfile.yearsExperience && (
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs px-2.5 py-0.5 rounded-full font-bold">
                      {recruiterProfile.yearsExperience}+ Years Exp
                    </span>
                  )}
                </div>
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  {recruiterProfile.personalInfo.firstName} {recruiterProfile.personalInfo.lastName}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                  {recruiterProfile.personalInfo.title}
                </p>
                {recruiterProfile.companyName && (
                  <div className="flex items-center gap-2 mt-2">
                    <Building className="w-4 h-4 text-indigo-500" />
                    <a
                      href={recruiterProfile.companyId ? `#company/${recruiterProfile.companyId}` : '#companies'}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      {recruiterProfile.companyName} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {recruiterProfile.personalInfo.email && (
                <a
                  href={`mailto:${recruiterProfile.personalInfo.email}?subject=${encodeURIComponent(`Inquiry from Ascend ATS for ${recruiterProfile.personalInfo.firstName}`)}`}
                  className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
                >
                  <Mail className="w-4 h-4" /> Message Recruiter
                </a>
              )}
              {recruiterProfile.personalInfo.linkedinUrl && (
                <a
                  href={recruiterProfile.personalInfo.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all"
                >
                  <Globe className="w-4 h-4 text-blue-500" /> LinkedIn
                </a>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
            <div className="md:col-span-2 space-y-6">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">About & Talent Philosophy</h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {recruiterProfile.bio}
                </p>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Sourcing Verticals & Core Specialties</h3>
                <div className="flex flex-wrap gap-2">
                  {recruiterProfile.specialties.map(spec => (
                    <span
                      key={spec}
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3 h-3 text-indigo-500" /> {spec}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950/40 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Recruiter Details</h4>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Organization</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{recruiterProfile.companyName || 'Ascend Partner'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Location</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{recruiterProfile.personalInfo.location || 'Remote'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Profile Status</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Publicly Discoverable
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Active Open Requisitions Section */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 md:p-12 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-500" /> Active Open Job Requisitions ({recruiterJobs.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Roles actively being recruited for {recruiterProfile.companyName}.
              </p>
            </div>
          </div>

          {recruiterJobs.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <Briefcase className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">No active public openings right now</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                Check back soon or message the recruiter directly above to share your background for upcoming roles.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recruiterJobs.map(job => (
                <div
                  key={job.id}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 hover:border-indigo-300 transition-all flex flex-col justify-between gap-4 group"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-500 text-white">
                        {job.status || 'Active'}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400">{job.workplaceType || 'Remote'}</span>
                    </div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {job.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {job.location || 'Remote'}
                    </p>
                    {job.parsedCriteria?.salaryRange && (
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-2">
                        ${job.parsedCriteria.salaryRange.min.toLocaleString()} – ${job.parsedCriteria.salaryRange.max.toLocaleString()}
                      </p>
                    )}
                  </div>

                  <a
                    href={`#job/${job.id}`}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-xs transition-all"
                  >
                    View Role & Direct Apply <ChevronRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 w-full md:w-[75vw] max-w-none mx-auto flex flex-col gap-6">
        {/* Banner with Lock and clear explanation */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-500" />
          <div className="mx-auto w-16 h-16 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          
          <div className="space-y-2 max-w-md mx-auto">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">This Professional Profile is Private</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              The owner of this profile has disabled public sharing links. The full technical portfolio, accommodations request, and work experience details are restricted.
            </p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
            <span className="font-bold text-slate-700 dark:text-slate-300">Are you an employer?</span> Login to your Ascend ATS dashboard to search for candidates, request connections, and securely view full candidate details.
          </div>
        </div>

        {/* Blurred structure preview showcasing what the profile includes */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 md:p-12 relative overflow-hidden opacity-50 select-none pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/80 dark:via-slate-900/80 to-white dark:to-slate-900 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-6 text-center">
            <EyeOff className="w-8 h-8 text-slate-400 mb-2" />
            <span className="font-bold text-sm text-slate-600 dark:text-slate-300">Confidential Layout Sample</span>
            <span className="text-xs text-slate-400 max-w-xs mt-1">Structured categories (technical stacks, volunteer experiences, and supportive accommodations) are hidden.</span>
          </div>

          {/* Anonymized Header Layout */}
          <div className="flex flex-col items-start gap-4 border-b border-slate-150 dark:border-slate-800 pb-8 mb-8">
            <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
            <div className="h-6 w-64 bg-slate-150 dark:bg-slate-800/80 rounded-md animate-pulse" />
            <div className="flex gap-2">
              <div className="h-7 w-24 bg-slate-100 dark:bg-slate-800 rounded-full" />
              <div className="h-7 w-20 bg-slate-100 dark:bg-slate-800 rounded-full" />
            </div>
          </div>

          {/* Anonymized Sections Layout */}
          <div className="space-y-8">
            <div className="space-y-3">
              <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded-md" />
              <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded" />
              <div className="h-4 w-5/6 bg-slate-100 dark:bg-slate-800 rounded" />
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="h-5 w-28 bg-slate-200 dark:bg-slate-800 rounded-md" />
              <div className="flex gap-4 items-start pl-4 border-l-2 border-slate-200">
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-36 bg-slate-150 rounded" />
                  <div className="h-3 w-48 bg-slate-100 rounded" />
                  <div className="h-3 w-full bg-slate-100/50 rounded" />
                </div>
              </div>
            </div>

            {/* Custom JSON category samples */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl space-y-2">
                <div className="h-4 w-28 bg-slate-200 rounded" />
                <div className="h-3 w-full bg-slate-100 rounded" />
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl space-y-2">
                <div className="h-4 w-28 bg-slate-200 rounded" />
                <div className="h-3 w-full bg-slate-100 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const pLevel = profile.privacy?.privacyLevel || (profile.privacy?.redactPii ? 3 : 1);
  const isRedacted = pLevel > 1;
  const fullName = `${profile.personalInfo?.firstName || ''} ${profile.personalInfo?.lastName || ''}`.trim();
  const isOwner = user && user.uid === window.location.hash.split('/')[1];
  const displayedName = profile.personalInfo?.preferredName
    ? `${profile.personalInfo.preferredName} ${profile.personalInfo.lastName || ''}`.trim()
    : fullName || 'Anonymous Candidate';

  const getOrderedSections = () => {
    const defaultOrder = ['summary', 'experience', 'skills', 'volunteer', 'dei_accommodations'];
    if (!profile.sectionOrder || profile.sectionOrder.length === 0) {
      return defaultOrder;
    }
    const ordered = [...profile.sectionOrder];
    defaultOrder.forEach(sec => {
      if (!ordered.includes(sec)) {
        ordered.push(sec);
      }
    });
    return ordered;
  };

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case 'summary':
        return profile.professionalSummary ? (
          <div key="summary" className="animate-in fade-in duration-300">
            <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-slate-100">About</h2>
            <RichText text={profile.professionalSummary} />
          </div>
        ) : null;

      case 'experience':
        return profile.workExperience && profile.workExperience.length > 0 ? (
          <div key="experience" className="animate-in fade-in duration-300">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <Briefcase className="w-5 h-5 text-blue-500" /> Experience
            </h2>
            <div className="space-y-8">
              {profile.workExperience.map((exp, i) => (
                <div key={i} className="relative pl-8 before:absolute before:left-3 before:top-2 before:bottom-[-24px] last:before:bottom-0 before:w-px before:bg-slate-200 dark:before:bg-slate-800">
                  <div className="absolute left-0 top-1 w-6 h-6 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-full" />
                  <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">{exp.role}</h3>
                  <div className="text-blue-600 dark:text-blue-400 font-medium mb-2">{exp.company}</div>
                  <div className="text-sm font-bold text-slate-400 mb-3">{exp.startDate} - {exp.endDate || 'Present'}</div>
                  <RichText text={exp.description} />
                </div>
              ))}
            </div>
          </div>
        ) : null;

      case 'skills':
        if (!profile.skills || profile.skills.length === 0) return null;

        const groupedSkills = profile.skills.reduce((acc, skillObj) => {
          const skill = typeof skillObj === 'string' ? { name: skillObj, domain: 'General' } : skillObj;
          const dom = skill.domain || 'General';
          const sub = skill.subDomain || 'General';
          if (!acc[dom]) acc[dom] = {};
          if (!acc[dom][sub]) acc[dom][sub] = [];
          acc[dom][sub].push(skill);
          return acc;
        }, {} as Record<string, Record<string, any[]>>);

        return (
          <div key="skills" className="animate-in fade-in duration-300">
            <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-slate-100">Technical Competencies & Skills</h2>
            
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 mb-8">
              <SkillVisualizer skills={profile.skills} deiAndAccommodations={profile.deiAndAccommodations} />
            </div>

            <div className="space-y-6">
              {Object.entries(groupedSkills).map(([domain, subDomains]) => (
                <div key={domain} className="bg-slate-50/50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-800 rounded-2xl p-5">
                  <h4 className="text-xs font-extrabold text-indigo-500 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-200/50 dark:border-slate-800/50 pb-2">{domain}</h4>
                  <div className="space-y-4">
                    {Object.entries(subDomains).map(([subDomain, subSkills]) => (
                      <div key={`${domain}-${subDomain}`}>
                        {subDomain !== 'General' && <h5 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{subDomain}</h5>}
                        <div className="flex flex-wrap gap-2">
                          {subSkills.map((skill: any, idx: number) => (
                            <div key={idx} className="flex flex-col gap-1.5 bg-white dark:bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-sm">
                              <div className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                                {skill.name}
                                {skill.years && <span className="opacity-60 font-normal ml-1">({skill.years}y)</span>}
                                {skill.credlyUrl && (
                                  <a href={skill.credlyUrl} target="_blank" rel="noopener noreferrer" className="ml-1 text-indigo-500 hover:text-indigo-700">
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'volunteer':
        const volunteerLeadership = profile.parsedData?.volunteer_leadership;
        const personalInsights = profile.parsedData?.personal_insights;
        const hasVol = Array.isArray(volunteerLeadership) && volunteerLeadership.length > 0;
        const hasInsights = !!personalInsights;

        if (!hasVol && !hasInsights) return null;

        return (
          <div key="volunteer" className="space-y-12 animate-in fade-in duration-300">
            {/* Personal Insights / Superpowers */}
            {hasInsights && (
              <div className="p-6 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 rounded-3xl space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2 text-amber-800 dark:text-amber-400">
                  <Sparkles className="w-5 h-5 animate-pulse" /> Professional Insights
                </h3>
                
                {personalInsights.superpowers && (
                  <div>
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">My Core Superpowers</h4>
                    <div className="flex flex-wrap gap-2">
                      {personalInsights.superpowers.map((sp: string, idx: number) => (
                        <span key={idx} className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 px-3 py-1 rounded-lg text-xs font-bold">
                          ⚡ {sp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {personalInsights.value_system && (
                  <div className="pt-2">
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Value System & Motivations</h4>
                    <div className="flex flex-wrap gap-2">
                      {personalInsights.value_system.map((val: string, idx: number) => (
                        <span key={idx} className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 px-3 py-1 rounded-lg text-xs font-bold">
                          🌱 {val}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {personalInsights.career_milestone_target && (
                  <div className="pt-2 text-sm text-slate-600 dark:text-slate-400">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Target Career Milestone:</span> {personalInsights.career_milestone_target}
                  </div>
                )}
              </div>
            )}

            {/* Volunteer Leadership */}
            {hasVol && (
              <div>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <Users className="w-5 h-5 text-emerald-500" /> Volunteer Leadership
                </h2>
                <div className="space-y-8">
                  {volunteerLeadership.map((vol: any, i: number) => (
                    <div key={i} className="relative pl-8 before:absolute before:left-3 before:top-2 before:bottom-[-24px] last:before:bottom-0 before:w-px before:bg-slate-200 dark:before:bg-slate-800">
                      <div className="absolute left-0 top-1 w-6 h-6 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-full" />
                      <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">{vol.role}</h3>
                      <div className="text-emerald-600 dark:text-emerald-400 font-medium mb-1">{vol.organization}</div>
                      <div className="text-sm font-bold text-slate-400 mb-2">{vol.dates}</div>
                      <RichText text={vol.description} className="text-sm mb-3" />
                      {Array.isArray(vol.key_contributions) && (
                        <div className="space-y-1">
                          {vol.key_contributions.map((con: string, idx: number) => (
                            <div key={idx} className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-1.5">
                              <span className="text-emerald-500">•</span>
                              <RichText text={con} className="inline text-xs" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'dei_accommodations':
        const needsAcc = profile.deiAndAccommodations?.needsAccommodations;
        const shareDei = profile.deiAndAccommodations?.shareDeiWithEmployers;
        const hasDeiDemographics = shareDei && (profile.deiAndAccommodations?.gender || profile.deiAndAccommodations?.race || profile.deiAndAccommodations?.veteranStatus || profile.deiAndAccommodations?.disabilityStatus);
        
        const showDeiSection = needsAcc || hasDeiDemographics || isOwner;
        const accommodationsRequest = profile.parsedData?.accommodations_request;
        const workingStyle = profile.parsedData?.working_style_preferences;

        if (!showDeiSection && !accommodationsRequest && !workingStyle) return null;

        return (
          <div key="dei_accommodations" className="space-y-12 animate-in fade-in duration-300">
            {/* Inclusive Hiring Narrative */}
            {accommodationsRequest && (
              <div className="p-6 bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900/30 rounded-3xl space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2 text-indigo-800 dark:text-indigo-400">
                  <Heart className="w-5 h-5" /> Inclusive Hiring & Accommodations Request
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                  {accommodationsRequest.narrative || "To perform at my best, I request the following standard, supportive accommodations."}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  {accommodationsRequest.sourcing_and_recruitment && (
                    <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Recruitment Phase</h4>
                      <RichText text={accommodationsRequest.sourcing_and_recruitment} className="text-xs leading-relaxed" />
                    </div>
                  )}
                  {accommodationsRequest.interview_format && (
                    <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Interviewing Format</h4>
                      <RichText text={accommodationsRequest.interview_format} className="text-xs leading-relaxed" />
                    </div>
                  )}
                  {accommodationsRequest.onboarding_and_integration && (
                    <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Onboarding & Integration</h4>
                      <RichText text={accommodationsRequest.onboarding_and_integration} className="text-xs leading-relaxed" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Working Style Preferences */}
            {workingStyle && (
              <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-3xl border border-slate-150 dark:border-slate-800 space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                  <Clock className="w-5 h-5 text-slate-500" /> Working Style Preferences
                </h3>
                
                <div className="space-y-3 text-sm">
                  {workingStyle.focus_hours && (
                    <div className="flex flex-col sm:flex-row sm:items-start gap-1">
                      <span className="font-bold text-slate-600 dark:text-slate-400 sm:w-40 shrink-0">Focus Hours:</span>
                      <RichText text={workingStyle.focus_hours} className="inline text-sm text-slate-600 dark:text-slate-400" />
                    </div>
                  )}
                  {workingStyle.collaboration_style && (
                    <div className="flex flex-col sm:flex-row sm:items-start gap-1">
                      <span className="font-bold text-slate-600 dark:text-slate-400 sm:w-40 shrink-0">Collaboration Style:</span>
                      <RichText text={workingStyle.collaboration_style} className="inline text-sm text-slate-600 dark:text-slate-400" />
                    </div>
                  )}
                  {workingStyle.communication_style && (
                    <div className="flex flex-col sm:flex-row sm:items-start gap-1">
                      <span className="font-bold text-slate-600 dark:text-slate-400 sm:w-40 shrink-0">Communication Style:</span>
                      <RichText text={workingStyle.communication_style} className="inline text-sm text-slate-600 dark:text-slate-400" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* DEI Demographics & Special Accommodations Selection */}
            {showDeiSection && (
              <div className="pt-8 border-t border-slate-100 dark:border-slate-800 space-y-6">
                <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <Heart className="w-5 h-5 text-rose-500" /> DEI & Interview Accommodations Selection
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Accommodations Card */}
                  {needsAcc ? (
                    <div className="p-6 bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-slate-150 dark:border-slate-800 space-y-4">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500" /> Interview Accommodations
                      </h3>
                      <div className="space-y-2">
                        {profile.deiAndAccommodations?.accommodationTypes?.map((accId, idx) => {
                          const accommodationsList = [
                            { id: 'screen-reader', label: 'Screen reader compatibility & high-contrast assets' },
                            { id: 'extra-time', label: 'Extra time allowance for coding challenges & assessments' },
                            { id: 'transcription', label: 'Captioning or live transcription during video interviews' },
                            { id: 'sign-language', label: 'Sign Language Interpretation (ASL / BSL)' },
                            { id: 'quiet-environment', label: 'Quiet, low-stimulation interview setting / advanced questions' },
                            { id: 'physical-access', label: 'Wheelchair / step-free physical building accessibility' },
                            { id: 'other', label: 'Other custom neurodivergent or physical accommodations' },
                          ];
                          const matchedLabel = accommodationsList.find(a => a.id === accId)?.label || accId;
                          return (
                            <div key={idx} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2 leading-relaxed bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100/40 dark:border-slate-800/40">
                              <span className="text-emerald-500 font-bold shrink-0">✓</span>
                              <span>{matchedLabel}</span>
                            </div>
                          );
                        })}
                        {(!profile.deiAndAccommodations?.accommodationTypes || profile.deiAndAccommodations.accommodationTypes.length === 0) && (
                          <div className="text-xs text-slate-400 italic">No specific accommodation types selected.</div>
                        )}
                      </div>
                      {profile.deiAndAccommodations?.accommodationDetails && (
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60">
                          <span className="text-xs font-bold text-slate-400 uppercase">Additional Requests</span>
                          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-150/40 dark:border-slate-800/40">
                            <RichText text={profile.deiAndAccommodations.accommodationDetails} />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-6 bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-slate-150 dark:border-slate-800 space-y-2">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-slate-400" /> Interview Accommodations
                      </h3>
                      <p className="text-xs text-slate-400 italic leading-relaxed">No special interview or testing accommodations are requested.</p>
                    </div>
                  )}

                  {/* DEI Demographics Card */}
                  {(isOwner || shareDei) ? (
                    <div className="p-6 bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-slate-150 dark:border-slate-800 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                          <Smile className="w-4 h-4 text-indigo-500" /> DEI Demographics
                        </h3>
                        {isOwner && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100/30">
                            {shareDei ? 'Shared with Employers' : 'Private to You'}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-2.5 bg-white dark:bg-slate-950 rounded-xl border border-slate-100/40 dark:border-slate-800/40">
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gender</span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate block">{profile.deiAndAccommodations?.gender || 'Not specified'}</span>
                        </div>
                        <div className="p-2.5 bg-white dark:bg-slate-950 rounded-xl border border-slate-100/40 dark:border-slate-800/40">
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Race / Ethnicity</span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate block">{profile.deiAndAccommodations?.race || 'Not specified'}</span>
                        </div>
                        <div className="p-2.5 bg-white dark:bg-slate-950 rounded-xl border border-slate-100/40 dark:border-slate-800/40">
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Veteran Status</span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate block">{profile.deiAndAccommodations?.veteranStatus || 'Not specified'}</span>
                        </div>
                        <div className="p-2.5 bg-white dark:bg-slate-950 rounded-xl border border-slate-100/40 dark:border-slate-800/40">
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Disability Status</span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate block">{profile.deiAndAccommodations?.disabilityStatus || 'Not specified'}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-slate-150 dark:border-slate-800 flex items-center justify-center text-center">
                      <p className="text-xs text-slate-400 italic max-w-[200px] leading-relaxed">
                        Demographic details are private and hidden on this public page.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 w-full md:w-[75vw] max-w-none mx-auto flex flex-col gap-6">
      {isOwner && (
        <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-in fade-in duration-300 ${
          profile.privacy?.isPublic 
            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300' 
            : 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-800/40 text-amber-800 dark:text-amber-300'
        }`}>
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="shrink-0 mt-0.5">
              {profile.privacy?.isPublic ? (
                <Globe className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-bold text-sm flex items-center gap-1.5">
                {profile.privacy?.isPublic ? '🌐 Public Link Active' : '🔒 Private Preview (Visible only to you)'}
              </span>
              <p className="mt-1 text-xs opacity-90 leading-relaxed">
                {profile.privacy?.isPublic 
                  ? "Your profile is live! Anyone with your custom link can view your portfolio and preference details."
                  : "Other users or external employers cannot see this page. Turn on 'Public Profile Page' in settings to make it public."
                }
              </p>
            </div>
          </div>
          <a 
            href="#edit-profile" 
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold text-center transition-colors shrink-0 ${
              profile.privacy?.isPublic
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-amber-600 hover:bg-amber-700 text-white'
            }`}
          >
            Manage Privacy
          </a>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 md:p-12">
        
        {isRedacted && (
           <div className="mb-8 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/40 p-4 rounded-2xl flex items-start gap-4">
             <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
             <div>
               <h4 className="font-bold text-blue-900 dark:text-blue-300">Protected Identity (Privacy Level {pLevel})</h4>
               <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                 {pLevel === 2 && "This candidate's personal contact coordinates (email, phone, social) are hidden to safeguard their direct contact methods."}
                 {pLevel === 3 && "Candidate identity is presented under a professional pseudonym initials alias, and contact metrics are locked."}
                 {pLevel === 4 && "Maximum stealth is active. Full name, direct contact credentials, and previous/current employer company names are fully redacted."}
               </p>
             </div>
           </div>
        )}

        <div className="flex flex-col items-start gap-3 border-b border-slate-100 dark:border-slate-800 pb-8 mb-8 w-full">
           <div className="flex flex-wrap items-center gap-3 w-full">
             <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 border border-blue-100 dark:border-blue-900">
                <Briefcase className="w-3.5 h-3.5" /> Job Seeker Profile
             </div>
             <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 w-full">
               {displayedName}
             </h1>
             {profile.personalInfo?.pronouns && (
               <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full shrink-0">
                 {profile.personalInfo.pronouns}
               </span>
             )}
             {isRedacted && (
               <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs px-3 py-1 rounded-full uppercase tracking-wider font-extrabold shrink-0">
                 {pLevel === 2 && "L2: Contact Masked"}
                 {pLevel === 3 && "L3: Anonymous"}
                 {pLevel === 4 && "L4: Max Cloak"}
               </span>
             )}
           </div>

           {profile.personalInfo?.preferredName && profile.personalInfo?.firstName && (
             <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
               Official Name: <span className="font-normal normal-case text-slate-500 dark:text-slate-400">{profile.personalInfo.firstName} {profile.personalInfo.lastName}</span>
             </p>
           )}

           <p className="text-2xl text-slate-500 dark:text-slate-400 font-medium mt-1">{profile.targetRole || 'Professional'}</p>
           
           <div className="flex gap-4 text-sm font-bold text-slate-400 mt-1">
              <span className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-full"><MapPin className="w-4 h-4" /> {profile.personalInfo?.location || 'Remote'}</span>
           </div>
        </div>

        <div className="space-y-12">
           {getOrderedSections().map(secId => renderSection(secId))}
         </div>
       </div>
     </div>
   );
}
