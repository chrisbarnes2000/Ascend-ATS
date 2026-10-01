import { useState, FormEvent } from 'react';
import { motion } from 'motion/react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../hooks/useAuth';
import { 
  Handshake, Gift, Share2, Award, Percent, Users, Rocket, DollarSign, 
  ArrowLeft, CheckCircle2, ShieldCheck, HelpCircle, Loader2, Send,
  Copy, Check, Globe, Sparkles
} from 'lucide-react';

export const AffiliatesPage = () => {
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [platform, setPlatform] = useState('');
  const [strategy, setStrategy] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [copiedBadge, setCopiedBadge] = useState<string | null>(null);

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBadge(id);
    setTimeout(() => setCopiedBadge(null), 2000);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !platform || !strategy) {
      setError('Please fill in all the required application fields.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await addDoc(collection(db, 'affiliateApplications'), {
        fullName,
        email,
        platform,
        strategy,
        userId: user?.uid || 'anonymous',
        createdAt: serverTimestamp(),
        status: 'pending'
      });
      setIsSuccess(true);
    } catch (err: any) {
      console.error('Affiliate submission failed:', err);
      setError('Failed to submit application. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-300">
      <div className="w-full md:w-[75vw] max-w-4xl mx-auto space-y-10">
        
        {/* Back Link */}
        <div className="flex items-center">
          <a
            href="#"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Application</span>
          </a>
        </div>

        {/* Hero banner */}
        <div className="relative overflow-hidden p-8 md:p-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-xl shadow-slate-100/50 dark:shadow-none text-left">
          <div className="absolute right-0 top-0 w-80 h-80 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative z-10">
            <div className="space-y-4 max-w-xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/5 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-500/10">
                <Handshake className="w-3.5 h-3.5" />
                <span>Ascend ATS Partner Network</span>
              </span>
              <h1 className="text-3xl md:text-4xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white">
                Grow With Us. Earn Recurring Commission.
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Recommend Ascend ATS to recruiters, scaling companies, or candidates, and earn a <span className="text-blue-600 dark:text-blue-400 font-bold">25% lifetime recurring commission</span> for every paid enterprise subscriber you refer!
              </p>
            </div>

            <div className="flex shrink-0 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner">
              <Rocket className="w-12 h-12 text-indigo-600 dark:text-indigo-400 animate-bounce" />
            </div>
          </div>
        </div>

        {/* Commission Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Percent,
              title: "25% Lifetime Payout",
              desc: "Get 25% recurring split on every invoice of your referred companies or HR hiring teams—forever.",
              color: "text-blue-500",
              bg: "bg-blue-500/5"
            },
            {
              icon: DollarSign,
              title: "Instant Resume Match Bounty",
              desc: "Earn $5 instantly for every certified candidate resume uploaded through your promotional tracking links.",
              color: "text-emerald-500",
              bg: "bg-emerald-500/5"
            },
            {
              icon: Users,
              title: "Unlimited Referrals",
              desc: "No caps on your promotional outreach. Track conversions instantly through your custom affiliates console.",
              color: "text-indigo-500",
              bg: "bg-indigo-500/5"
            }
          ].map((item, idx) => (
            <div key={idx} className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm text-left space-y-4">
              <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center`}>
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">{item.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* RapportVerse Partnership Showcase */}
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-indigo-500/5 dark:from-amber-500/10 dark:to-slate-900/40 rounded-3xl border border-amber-200/50 dark:border-amber-900/40 p-8 md:p-10 text-left space-y-8 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-amber-200/30 dark:border-slate-800">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                🤝 Proud Strategic Partner
              </span>
              <h2 className="text-2xl font-display font-extrabold text-slate-900 dark:text-white">
                Collaboration with RapportVerse
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                Empowering communities with visual-first human relationship and qualitative trust-mapping engines.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <a 
                href="#rapportverse" 
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl hover:opacity-90 transition-all shadow-sm shrink-0"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Launch Trust Bridge Portal</span>
              </a>
              <a 
                href="https://rapprt.space" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-md shadow-amber-200/40 dark:shadow-none shrink-0"
              >
                <Globe className="w-4 h-4" />
                <span>Visit Rapprt.Space</span>
              </a>
            </div>
          </div>

          {/* Description & Alignment Points */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-semibold">
                We are proud to collaborate with and support <a href="https://rapprt.space" target="_blank" rel="noopener noreferrer" className="text-amber-600 dark:text-amber-400 hover:underline font-bold">RapportVerse</a> — the visual-first human relationship and qualitative trust-mapping engine designed for premium networking, high-fidelity synchronization, and structured neurodivergent connection management.
              </p>
              
              <div className="p-4 bg-white/60 dark:bg-slate-950/40 border border-slate-200/40 dark:border-slate-800/60 rounded-2xl space-y-3.5">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">Why we align with RapportVerse</h4>
                <ul className="space-y-2.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Visual-First Topologies</strong>: Revolutionizing how we visualize, map, and organize relational trust scores.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Privacy & GDPR Sovereign</strong>: Ensuring client-side local caching, zero telemetry trackers, and absolute user data ownership.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Inclusive Design</strong>: Dedicated visual modifiers for neurodivergent individuals and diverse processing types.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Support badges code generator */}
            <div className="space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Support RapportVerse (Add a Badge to your Projects!)
              </h4>

              <div className="space-y-4">
                {/* Badge A */}
                <div className="p-4 bg-white/40 dark:bg-slate-950/20 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl space-y-2 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Option A: Clean Shield Badge</span>
                    <button 
                      onClick={() => handleCopyText(`[![Partner: RapportVerse](https://img.shields.io/badge/Partner-RapportVerse-amber?style=for-the-badge&logo=handshake&logoColor=fff&labelColor=1a1a1a&color=f59e0b)](https://rapprt.space)`, 'badgeA')}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold"
                    >
                      {copiedBadge === 'badgeA' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Markdown</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="py-1">
                    <img 
                      src="https://img.shields.io/badge/Partner-RapportVerse-amber?style=for-the-badge&logo=handshake&logoColor=fff&labelColor=1a1a1a&color=f59e0b" 
                      alt="Partner: RapportVerse" 
                      className="h-7"
                    />
                  </div>
                </div>

                {/* Badge B */}
                <div className="p-4 bg-white/40 dark:bg-slate-950/20 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl space-y-2 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Option B: High-Contrast Flat Badge</span>
                    <button 
                      onClick={() => handleCopyText(`[![Supported By: RapportVerse](https://img.shields.io/badge/Supported%20By-Rapprt.Space-indigo?style=flat-square&logo=google-cloud&logoColor=fff&color=6366f1)](https://rapprt.space)`, 'badgeB')}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold"
                    >
                      {copiedBadge === 'badgeB' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Markdown</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="py-1">
                    <img 
                      src="https://img.shields.io/badge/Supported%20By-Rapprt.Space-indigo?style=flat-square&logo=google-cloud&logoColor=fff&color=6366f1" 
                      alt="Supported By: RapportVerse" 
                      className="h-5"
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Contact and Operator block */}
          <div className="pt-6 border-t border-amber-200/30 dark:border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-400 dark:text-slate-500 font-semibold">
            <div className="space-y-1">
              <p>Creator / Lead Architect: <strong className="text-slate-700 dark:text-slate-300">Chris Barnes</strong></p>
              <p>Email: <a href="mailto:Chris.Barnes.2000@me.com" className="text-amber-600 dark:text-amber-400 hover:underline">Chris.Barnes.2000@me.com</a></p>
            </div>
            <div className="text-[10px] uppercase bg-amber-500/10 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-xl border border-amber-500/20">
              ⚡ Live Platform Integration Enabled
            </div>
          </div>
        </div>

        {/* How it Works Section */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-xl shadow-slate-100/50 dark:shadow-none p-8 md:p-10 text-left space-y-8">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-5">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-500" />
              How the Affiliate Program Works
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-1">Join, promote, track, and cash out with maximum simplicity.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", name: "Apply to the Network", text: "Submit your basic channel profiles, audience targets, or agency credentials using our application form." },
              { step: "02", name: "Distribute tracking links", text: "Integrate custom referral links into your blogs, YouTube reviews, newsletter posts, or business recommendations." },
              { step: "03", name: "Recur Monthly Payouts", text: "Withdraw commissions directly to Stripe or bank networks as conversions clear each month's billing." }
            ].map((st, i) => (
              <div key={i} className="space-y-2 text-left">
                <div className="text-3xl font-extrabold text-blue-600/30 font-display">{st.step}</div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">{st.name}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{st.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Form Registration Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          <div className="lg:col-span-1 space-y-6 text-left">
            <div className="p-6 bg-slate-900 dark:bg-slate-900/40 rounded-3xl text-white border border-slate-800">
              <h3 className="font-bold text-base mb-2 flex items-center gap-2 text-indigo-400">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                Trusted Partner Standards
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium mb-4">
                We manual-review all affiliate partners to maintain high platform trust and avoid spam. Applications are cleared in 24-48 business hours.
              </p>
              <ul className="space-y-3 text-xs text-slate-300 font-semibold">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Monthly Stripe Payouts
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Cookie tracking (60-day)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Access to custom banners
                </li>
              </ul>
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50">
              <h4 className="font-bold text-xs uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-slate-400" />
                Program FAQ
              </h4>
              <div className="space-y-4 mt-3 text-xs">
                <div>
                  <h5 className="font-bold text-slate-800 dark:text-slate-200 mb-1">Is there a cost to join?</h5>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">No. The Ascend ATS Partner Network is 100% free to register.</p>
                </div>
                <div>
                  <h5 className="font-bold text-slate-800 dark:text-slate-200 mb-1">When do I get paid?</h5>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">Earnings clear on the 15th of every month for transactions older than 30 days.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-xl shadow-slate-100/50 dark:shadow-none p-8 text-left">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
              <Gift className="w-5 h-5 text-indigo-500" />
              Apply for Partnership
            </h3>

            {isSuccess ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl text-center space-y-4"
              >
                <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                </div>
                <h4 className="font-bold text-base text-slate-900 dark:text-white">Application Received!</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto font-medium">
                  Thank you for submitting your affiliate application to Ascend ATS. Our partnership team will review your channel information and email you within 24-48 business hours.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 text-xs bg-red-500/5 border border-red-500/10 text-red-500 rounded-xl">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Sarah Jenkins"
                      className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. sarah@partner.com"
                      className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Primary Promotional Platform or Website
                  </label>
                  <input
                    type="text"
                    required
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    placeholder="e.g. recruitingblog.com, YouTube Channel URL, or TikTok Username"
                    className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Your Promotional Strategy & Audience Details
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={strategy}
                    onChange={(e) => setStrategy(e.target.value)}
                    placeholder="Briefly describe how you plan to refer recruiters or candidates to Ascend ATS (e.g. email newsletter, banner ads, SaaS consultation, etc.)."
                    className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-200 leading-relaxed font-sans"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md shadow-blue-200 dark:shadow-none transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting Application...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Application Details</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
