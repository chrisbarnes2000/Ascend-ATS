import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Shield, FileText, ArrowLeft, Calendar, Mail, CheckCircle2, AlertCircle, Scale, Eye } from 'lucide-react';

interface LegalPageProps {
  initialTab?: 'tos' | 'privacy';
}

export const LegalPage = ({ initialTab = 'tos' }: LegalPageProps) => {
  const [activeTab, setActiveTab] = useState<'tos' | 'privacy'>(initialTab);

  // Sync hash routing if user directly clicks or accesses with direct hashes
  useEffect(() => {
    const handleHash = () => {
      const currentHash = window.location.hash;
      if (currentHash === '#privacy') {
        setActiveTab('privacy');
      } else if (currentHash === '#terms' || currentHash === '#legal') {
        setActiveTab('tos');
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleTabChange = (tab: 'tos' | 'privacy') => {
    setActiveTab(tab);
    window.location.hash = tab === 'tos' ? 'terms' : 'privacy';
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-300">
      <div className="w-full md:w-[75vw] max-w-4xl mx-auto space-y-8">
        
        {/* Back Link */}
        <div className="flex items-center justify-between">
          <a
            href="#"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Application</span>
          </a>

          <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
            <Calendar className="w-3.5 h-3.5" />
            <span>Last Updated: September 8, 2026</span>
          </div>
        </div>

        {/* Header section with graphic card */}
        <div className="relative overflow-hidden p-8 md:p-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-xl shadow-slate-100/50 dark:shadow-none text-left">
          <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
            <div className="space-y-3 max-w-xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/5 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-500/10">
                <Scale className="w-3.5 h-3.5" />
                <span>Legal & Compliance Center</span>
              </span>
              <h1 className="text-3xl md:text-4xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white">
                Platform Rules & Trust
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                We believe in total transparency. Our terms, conditions, and privacy frameworks exist to protect your professional data, verify accurate candidate profiling, and build a secure talent ecosystem.
              </p>
            </div>

            <div className="flex shrink-0 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner">
              <Shield className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Custom Navigation Tab Bars */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border">
          <button
            onClick={() => handleTabChange('tos')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
              activeTab === 'tos'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Terms of Service</span>
          </button>
          <button
            onClick={() => handleTabChange('privacy')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Privacy Policy</span>
          </button>
        </div>

        {/* Core Content Layout */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-xl shadow-slate-100/50 dark:shadow-none p-6 md:p-10 text-left">
          {activeTab === 'tos' ? (
            <div className="space-y-8 animate-fadeIn">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-5">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  Terms of Service Agreement
                </h2>
                <p className="text-xs text-slate-400 font-semibold mt-1">Please read these rules carefully before using the Ascend ATS platform.</p>
              </div>

              {/* Terms Content Sections */}
              <div className="space-y-6 text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                <section className="space-y-2">
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">1. Acceptance of Agreement</h3>
                  <p>
                    By creating an account, posting roles, submitting resumes, or utilizing the automatic parsing utilities offered on Ascend ATS ("Platform"), you acknowledge that you have read, understood, and agreed to be bound by these Terms of Service. If you do not agree, please do not access or use the Platform.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">2. Account Registration & Role Integrity</h3>
                  <p>
                    To use certain premium features of the platform, you must register for an account (Candidate Profile or Employer Profile). You agree to provide accurate, current, and complete information and maintain the security of your login credentials. Employers are responsible for ensuring the absolute integrity of any job descriptions and requirements posted or parsed on the platform.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">3. Local NLP, Custom Formatting & AI Deep Scan Use</h3>
                  <p>
                    Ascend ATS provides advanced local heuristic parsing, manual formatting customizations, and voluntary AI deep scans (via Gemini model gateways). By uploading descriptions, links, or professional histories, you grant the platform a non-exclusive license to host, format, and synthesize this content solely to perform match assessments and compile strategic candidate feedback.
                  </p>
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-start gap-3 mt-2 text-xs">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">Heuristic Engine Authorization:</span> Manual formatting custom overrides are synchronized directly to your account's secure cloud database, allowing you to edit descriptions safely without altering employer listings.
                    </div>
                  </div>
                </section>

                <section className="space-y-2">
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">4. Code of Conduct & Acceptable Use</h3>
                  <p>
                    Candidates and employers alike agree not to:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs">
                    <li>Submit false, misleading, or deceptive resume credentials.</li>
                    <li>Ingest, post, or index fraudulent or unlawful employment opportunities.</li>
                    <li>Attempt to disrupt, scrape, or perform denial-of-service strikes against the local NLP or Gemini endpoints.</li>
                    <li>Reverse-engineer or bypass platform authentication and security rulesets.</li>
                  </ul>
                </section>

                <section className="space-y-2">
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">5. Limitation of Liability</h3>
                  <p>
                    Ascend ATS provides analytics, scoring indexes, and automated strategic match analyses "as is" without warranties of any kind. We do not guarantee that using the platform will result in a job offer or a finalized employment contract. We shall not be liable for any indirect, incidental, or consequential damages resulting from your use of the platform.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">6. Platform Modifications</h3>
                  <p>
                    We reserve the right to temporarily or permanently modify, suspend, or update any section of the platform or these terms at any time to guarantee performance, support cloud migration, or adjust system capabilities.
                  </p>
                </section>
              </div>

              {/* TOS Consent Banner */}
              <div className="p-5 bg-blue-500/5 dark:bg-blue-500/10 rounded-2xl border border-blue-500/10 flex items-start gap-4">
                <Scale className="w-6 h-6 text-blue-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Need clarifying legal help?</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                    For any questions regarding account compliance, rules of engagement, or user obligations, please contact us directly at compliance@ascendats.com.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-fadeIn">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-5">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-500" />
                  Privacy Policy Center
                </h2>
                <p className="text-xs text-slate-400 font-semibold mt-1">Discover how your professional documents and credentials are kept safe.</p>
              </div>

              {/* Privacy Content Sections */}
              <div className="space-y-6 text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                <section className="space-y-2">
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">1. Information We Collect</h3>
                  <p>
                    When you access Ascend ATS, we collect information necessary to deliver advanced sourcing services:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs">
                    <li><strong className="text-slate-800 dark:text-slate-200">Account Credentials:</strong> Google sign-in identifiers, email addresses, and basic auth metadata.</li>
                    <li><strong className="text-slate-800 dark:text-slate-200">Professional Profiles:</strong> Resume content, skill domains, education history, target parameters, and company details.</li>
                    <li><strong className="text-slate-800 dark:text-slate-200">Job Ingestion Documents:</strong> Manually pasted description texts, scanned requirements, and customized formatting edits.</li>
                  </ul>
                </section>

                <section className="space-y-2">
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">2. How We Secure and Use Your Data</h3>
                  <p>
                    We process and analyze your data strictly to facilitate recruiter and candidate match flows:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs">
                    <li>To run high-fidelity local text-processing and compile matched skillset lists.</li>
                    <li>To trigger optional, high-value AI deep scans using our secure server-side Gemini pipelines.</li>
                    <li>To persist your custom formatting preferences in Firestore, linked strictly to your private User UID rules.</li>
                  </ul>
                </section>

                <section className="space-y-2 border-l-4 border-amber-500/80 dark:border-amber-500/60 pl-4 py-1 bg-amber-500/5 dark:bg-amber-500/5 rounded-r-xl">
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    No Selling or Unauthorized Sharing of Personal Data
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    We strictly respect your privacy. Ascend ATS does not rent, trade, sell, or disclose your resume data, contact lists, or job search criteria to third-party advertisers or unapproved data broker agencies under any circumstances.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">3. Firestore Data Persistence & Rules</h3>
                  <p>
                    All personal data records are hosted inside Google Cloud Firestore, secured by granular Firestore Security Rules. These configurations ensure that only authenticated owners are allowed read, write, or update access to their profile documents, customized formatting files, or parsed job analytics summaries.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">4. Your Compliance Rights</h3>
                  <p>
                    Depending on your geographic location (such as CCPA or GDPR), you hold several active data management rights:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs">
                    <li>The right to view all stored profiles or request a portable export.</li>
                    <li>The right to perform immediate manual adjustments through our profile wizard and editor panels.</li>
                    <li>The right to completely purge your account and delete all associated parsed jobs or resume documents from Firestore instantly.</li>
                  </ul>
                </section>
              </div>

              {/* Privacy Footer Card */}
              <div className="p-5 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-2xl border border-indigo-500/10 flex items-start gap-4">
                <Mail className="w-6 h-6 text-indigo-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">GDPR & Data Protection Queries</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                    If you would like to initiate a formal "Right to be Forgotten" account erasure, or if you need an official data export file, please contact us at privacy@ascendats.com.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Floating Quick Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 dark:text-slate-500 border-t border-slate-200/50 dark:border-slate-800/50 pt-6 font-semibold">
          <p>© 2026 Ascend ATS Inc. All rights reserved.</p>
          <div className="flex gap-4 mt-3 sm:mt-0">
            <a href="#terms" className="hover:text-blue-500 transition-colors">Terms</a>
            <span>•</span>
            <a href="#privacy" className="hover:text-blue-500 transition-colors">Privacy</a>
            <span>•</span>
            <a href="#" className="hover:text-blue-500 transition-colors">Platform</a>
          </div>
        </div>

      </div>
    </div>
  );
};
