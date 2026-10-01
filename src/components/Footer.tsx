import { TrendingUp, Shield, Handshake, Mail, FileText, Globe, Heart, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const Footer = () => {
  const { user } = useAuth();
  const isAdmin = user?.email === 'Chris.Barnes.2000@me.com' || user?.uid === '393uzPXnOdPW3CE3rdhmDMEldzm1';

  return (
    <footer className="w-full bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800/80 pt-16 pb-8 transition-colors duration-300">
      <div className="w-full md:w-[75vw] max-w-7xl mx-auto px-4 space-y-12">
        
        {/* Core Layout Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Column */}
          <div className="md:col-span-1.5 space-y-4 text-left">
            <a href="#" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-200 dark:shadow-none">
                <TrendingUp className="text-white w-5 h-5" />
              </div>
              <span className="font-display font-bold text-lg tracking-tight text-slate-900 dark:text-white">Ascend ATS</span>
            </a>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Empowering job seekers and HR managers with intelligent auto-matching, master profiling, and highly compliant ATS matching pipelines.
            </p>
            <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
              <span>Made with</span>
              <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
              <span>for professional growth.</span>
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="space-y-4 text-left">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Workspaces
            </h4>
            <ul className="space-y-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <li>
                <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Candidate Dashboard</a>
              </li>
              <li>
                <a href="#edit-profile" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Edit Profile Builder</a>
              </li>
              <li>
                <a href="#companies" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Browse Companies</a>
              </li>
              <li>
                <a href="#sourcing" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Employer Sourcing</a>
              </li>
            </ul>
          </div>

          {/* Partner & Growth Column */}
          <div className="space-y-4 text-left">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Growth & Partnerships
            </h4>
            <ul className="space-y-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <li>
                <a 
                  href="#affiliates" 
                  className="inline-flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-bold text-blue-600 dark:text-blue-400"
                >
                  <Handshake className="w-3.5 h-3.5" />
                  <span>Affiliate Program</span>
                </a>
              </li>
              <li>
                <a 
                  href="#rapportverse" 
                  className="inline-flex items-center gap-1.5 hover:text-amber-500 dark:hover:text-amber-400 transition-colors font-semibold text-slate-700 dark:text-slate-300"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>RapportVerse Bridge</span>
                </a>
              </li>
              <li>
                <a href="#analytics" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Sourcing Analytics</a>
              </li>
            </ul>
          </div>

          {/* Trust & Legal Column */}
          <div className="space-y-4 text-left">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Legal & Compliance
            </h4>
            <ul className="space-y-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <li>
                <a href="#legal" className="inline-flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Platform Legal Center</span>
                </a>
              </li>
              <li>
                <a href="#terms" className="inline-flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Terms of Service</span>
                </a>
              </li>
              <li>
                <a href="#privacy" className="inline-flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Privacy Policy</span>
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Floating Divider & Metadata Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 dark:text-slate-500 border-t border-slate-200 dark:border-slate-800 pt-8 font-semibold">
          <p>© 2026 <a href="https://rapprt.space" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 dark:hover:text-blue-400 underline decoration-slate-300 dark:decoration-slate-700 underline-offset-2 transition-colors">RapportVerse</a>. Certified Secure. All rights reserved.</p>
          <div className="flex items-center gap-4 mt-4 sm:mt-0">
            <a href="mailto:support@ascendats.com" className="inline-flex items-center gap-1 hover:text-blue-500 transition-colors">
              <Mail className="w-3.5 h-3.5" />
              <span>Contact Support</span>
            </a>
            <span>•</span>
            <span className="text-[10px] tracking-widest bg-slate-200/50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-full uppercase">
              v0.5.24
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
};
