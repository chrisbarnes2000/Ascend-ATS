import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Users, 
  Target, 
  ShieldCheck, 
  Zap, 
  Building, 
  ArrowRight, 
  CheckCircle2,
  Database,
  Globe
} from 'lucide-react';

const FeatureCard = ({ icon: Icon, title, description, image, index }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1, duration: 0.6 }}
    viewport={{ once: true }}
    className="group bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-2xl transition-all"
  >
    <div className="aspect-[4/3] overflow-hidden">
      <img 
        src={image} 
        alt={title} 
        referrerPolicy="no-referrer"
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
      />
    </div>
    <div className="p-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{title}</h3>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
        {description}
      </p>
    </div>
  </motion.div>
);

export const LandingPage = () => {
  return (
    <div className="bg-white dark:bg-slate-950 min-h-screen overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="w-full md:w-[75vw] max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-xs font-black uppercase tracking-widest border border-blue-100 dark:border-blue-800">
                <Zap className="w-3.5 h-3.5" />
                The Next Gen ATS
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tight">
                Recruitment, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Re-Engineered.</span>
              </h1>
              <p className="text-lg text-slate-500 dark:text-slate-400 font-medium max-w-xl leading-relaxed">
                Empower your talent acquisition with intelligent auto-matching, master candidate profiling, and robust compliance auditing. Built for high-growth firms and modern job seekers.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button 
                  onClick={() => window.location.hash = '#signup'}
                  className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                >
                  Join the Platform
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => window.location.hash = '#login'}
                  className="px-8 py-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  Sign In
                </button>
              </div>
              <div className="flex items-center gap-6 pt-8">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-950 bg-slate-200 dark:bg-slate-800" />
                  ))}
                </div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Trusted by 500+ <span className="text-slate-900 dark:text-white">Active Recruiters</span>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-br from-blue-600/20 to-indigo-600/20 blur-3xl rounded-full" />
              <div className="relative aspect-[16/9] rounded-[2.5rem] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl">
                <img 
                  src="/src/assets/images/landing_hero_ats_1790652078855.jpg" 
                  alt="Ascend ATS Platform" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="absolute -bottom-10 -right-10 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl hidden md:block">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Match Accuracy</div>
                    <div className="text-xl font-black text-slate-900 dark:text-white">98.4%</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="py-32 px-4 bg-slate-50 dark:bg-slate-900/20">
        <div className="w-full md:w-[75vw] max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-20">
            <h2 className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.3em]">Core Capabilities</h2>
            <h3 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">Systemized Talent Ingestion</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto">
              We've automated the heavy lifting of candidate screening and organizational matching, so you can focus on building high-trust professional bridges.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              index={0}
              icon={Target}
              title="Intelligent Matching"
              description="Our qualitative engine evaluates salary, workplace settings, and employer flexibility to ensure perfect alignment before the first interview."
              image="/src/assets/images/landing_feature_matching_1790652090232.jpg"
            />
            <FeatureCard 
              index={1}
              icon={Database}
              title="Ops Control Center"
              description="Full developer-grade administrative suite for environment simulation, data seeding, and real-time database telemetry management."
              image="/src/assets/images/landing_feature_admin_1790652102318.jpg"
            />
            <FeatureCard 
              index={2}
              icon={Globe}
              title="Staffing Partnerships"
              description="Strategic bridge for external staffing firms with secure onboarding, multi-role access controls, and automated UTM partner tracking."
              image="/src/assets/images/landing_feature_partners_1790652114990.jpg"
            />
          </div>
        </div>
      </section>

      {/* Trust & Verification Section */}
      <section className="py-32 px-4">
        <div className="w-full md:w-[75vw] max-w-7xl mx-auto">
          <div className="bg-slate-900 dark:bg-slate-900 rounded-[3rem] p-12 md:p-20 text-white overflow-hidden relative shadow-2xl">
            <div className="absolute top-0 right-0 w-1/3 h-full bg-blue-600/10 blur-[100px] rounded-full" />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
              <div className="space-y-8">
                <h3 className="text-4xl md:text-6xl font-black leading-tight tracking-tight">
                  Verified Transparency. <br />
                  <span className="opacity-40">Absolute Privacy.</span>
                </h3>
                <div className="space-y-6">
                  {[
                    "Audit trail for every job description edit",
                    "Smart detection for post-application material shifts",
                    "4-Level sliding privacy scale for candidates",
                    "Bidirectional trust radar mapping Dunbar topologies"
                  ].map((text, i) => (
                    <div key={i} className="flex items-center gap-4 group">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold uppercase tracking-widest text-slate-300">{text}</span>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => window.location.hash = '#signup'}
                  className="px-10 py-5 bg-white text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] transition-all"
                >
                  Get Started Securely
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {[
                  { label: "Applicants", value: "124k+" },
                  { label: "Partner Firms", value: "1.2k" },
                  { label: "Fill Rate", value: "40%" },
                  { label: "Uptime", value: "99.9%" }
                ].map((stat, i) => (
                  <div key={i} className="p-8 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-sm">
                    <div className="text-3xl font-black mb-2">{stat.value}</div>
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Simple CTA */}
      <section className="py-20 px-4">
        <div className="w-full md:w-[75vw] max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-sm flex flex-col justify-between">
              <div className="space-y-6">
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Ready to Ascend?</h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  Join the only platform designed with candidate transparency and recruiter efficiency as first-class citizens.
                </p>
              </div>
              <div className="flex items-center gap-4 mt-8">
                <button 
                  onClick={() => window.location.hash = '#signup'}
                  className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all"
                >
                  Build your Profile
                </button>
                <button 
                  onClick={() => window.location.hash = '#rapportverse'}
                  className="px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Explore Network
                </button>
              </div>
            </div>

            <div className="p-12 bg-slate-900 dark:bg-indigo-950/40 rounded-[2.5rem] text-white shadow-2xl flex flex-col justify-between relative overflow-hidden group border border-slate-800 dark:border-indigo-500/20">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full -mr-20 -mt-20 group-hover:bg-indigo-500/20 transition-all duration-700" />
              
              <div className="space-y-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <Building className="w-6 h-6" />
                  </div>
                  <div className="px-3 py-1 bg-indigo-500/20 rounded-full border border-indigo-500/30 text-[9px] font-black uppercase tracking-widest text-indigo-300">
                    Enterprise Portal
                  </div>
                </div>
                <h3 className="text-3xl font-black uppercase tracking-tight">External Recruiters</h3>
                <p className="text-slate-300 font-medium leading-relaxed">
                  Redirect sourcing requests from Dice, LinkedIn, or Glassdoor here for deep-match analysis and direct pipeline integration.
                </p>
                <ul className="space-y-3">
                   {[
                     "Automated candidate rapport scoring",
                     "Custom invite code generation",
                     "Audit-ready job descriptions"
                   ].map((t) => (
                     <li key={t} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                       <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                       {t}
                     </li>
                   ))}
                </ul>
              </div>
              <div className="mt-10 relative z-10">
                <button 
                  onClick={() => {
                    window.location.hash = '#partner-request';
                  }}
                  className="w-full px-8 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 group/btn"
                >
                  Request Firm Access
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
