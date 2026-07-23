import { useState, useEffect, MouseEvent, FormEvent } from 'react';
import { collection, onSnapshot, query, where, limit, orderBy, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../hooks/useAuth';
import { useJobMatching, getMatchBreakdown } from '../hooks/useJobMatching';
import { Application, JobSeekerProfile, ApplicationStatus } from '../types';
import { 
  Send, Clock, CheckCircle2, TrendingUp, Sparkles, 
  ChevronRight, ExternalLink, Briefcase, MapPin, DollarSign,
  Plus, Loader2, Check, HelpCircle, MessageSquare, X
} from 'lucide-react';
import { motion } from 'motion/react';

// Internal Components for Dashboard
const ApplicationPipeline = ({ applications }: { applications: Application[] }) => {
  const { user } = useAuth();
  const [selectedAppForInfo, setSelectedAppForInfo] = useState<Application | null>(null);
  const [selectedAppForMessages, setSelectedAppForMessages] = useState<Application | null>(null);
  const [infoTopic, setInfoTopic] = useState('Compensation & Salary Transparency');
  const [infoMessage, setInfoMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  // Candidate Reply & Acknowledgment State
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [isAcknowledging, setIsAcknowledging] = useState<string | null>(null);
  const [ackSuccess, setAckSuccess] = useState(false);
  const [replySuccess, setReplySuccess] = useState(false);

  const columns: { label: ApplicationStatus; color: string }[] = [
    { label: 'applied', color: 'bg-blue-500' },
    { label: 'viewed', color: 'bg-amber-500' },
    { label: 'interviewing', color: 'bg-indigo-500' },
    { label: 'offered', color: 'bg-emerald-500' }
  ];

  const handleAcknowledgeMessage = async (msgText: string, index: number) => {
    if (!user || !selectedAppForMessages) return;
    setIsAcknowledging(`ack-${index}`);
    try {
      const { updateDoc, doc, arrayUnion } = await import('firebase/firestore');
      const ackPayloadText = `[Candidate Acknowledgment] Acknowledged message: "${msgText.slice(0, 70)}${msgText.length > 70 ? '...' : ''}"`;
      
      await updateDoc(doc(db, 'applications', selectedAppForMessages.id), {
        communications: arrayUnion({
          sender: 'Candidate',
          text: ackPayloadText,
          timestamp: new Date().toISOString()
        })
      });

      setSelectedAppForMessages(prev => prev ? {
        ...prev,
        communications: [...(prev.communications || []), {
          sender: 'Candidate',
          text: ackPayloadText,
          timestamp: new Date().toISOString()
        }]
      } : null);

      setAckSuccess(true);
      setTimeout(() => setAckSuccess(false), 2000);
    } catch (err: any) {
      console.error("Error acknowledging message:", err);
      alert("Failed to acknowledge message: " + (err.message || 'Error updating record.'));
    } finally {
      setIsAcknowledging(null);
    }
  };

  const handleSendReply = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !selectedAppForMessages || !replyText.trim()) return;
    setIsSendingReply(true);
    try {
      const { updateDoc, doc, arrayUnion } = await import('firebase/firestore');
      const formattedText = replyText.trim();
      
      await updateDoc(doc(db, 'applications', selectedAppForMessages.id), {
        communications: arrayUnion({
          sender: 'Candidate',
          text: formattedText,
          timestamp: new Date().toISOString()
        })
      });

      setSelectedAppForMessages(prev => prev ? {
        ...prev,
        communications: [...(prev.communications || []), {
          sender: 'Candidate',
          text: formattedText,
          timestamp: new Date().toISOString()
        }]
      } : null);

      setReplyText('');
      setReplySuccess(true);
      setTimeout(() => setReplySuccess(false), 2000);
    } catch (err: any) {
      console.error("Error sending reply:", err);
      alert("Failed to send response: " + (err.message || 'Error updating record.'));
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleSendInfoRequest = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !selectedAppForInfo) return;
    setIsSending(true);

    try {
      const { updateDoc, doc, arrayUnion } = await import('firebase/firestore');

      // 1. Add record to jobClarificationRequests
      await addDoc(collection(db, 'jobClarificationRequests'), {
        jobId: selectedAppForInfo.jobId,
        jobTitle: selectedAppForInfo.jobTitle || 'Role',
        companyId: selectedAppForInfo.companyId || 'company',
        companyName: selectedAppForInfo.companyName || 'Employer',
        seekerId: user.uid,
        seekerEmail: user.email || 'JobSeeker',
        category: infoTopic,
        message: infoMessage || 'Candidate requested additional role specification details.',
        createdAt: serverTimestamp(),
        status: 'pending'
      });

      // 2. Append message to application communications
      await updateDoc(doc(db, 'applications', selectedAppForInfo.id), {
        communications: arrayUnion({
          sender: 'Candidate',
          text: `[Clarification Request - ${infoTopic}] ${infoMessage || 'Requested role specification details.'}`,
          timestamp: new Date().toISOString()
        })
      });

      setSendSuccess(true);
      setTimeout(() => {
        setSendSuccess(false);
        setSelectedAppForInfo(null);
        setInfoMessage('');
      }, 2000);
    } catch (err: any) {
      console.error("Error sending info request:", err);
      alert("Failed to submit request: " + (err.message || 'Please check connection.'));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {columns.map((col) => {
          const items = applications.filter(a => a.status === col.label);
          return (
            <div key={col.label} className="bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl p-4 min-h-[200px]">
               <div className="flex items-center justify-between mb-4 px-2">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">{col.label}</h3>
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-100 dark:border-slate-700 shadow-sm">
                    {items.length}
                  </span>
               </div>
               <div className="space-y-3">
                  {items.map(app => (
                    <motion.div 
                      layoutId={app.id}
                      key={app.id} 
                      className="p-4 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-shadow group relative"
                    >
                       <div className="font-bold text-sm mb-1 text-slate-900 dark:text-slate-100 flex items-start justify-between gap-1">
                          <span onClick={() => window.location.hash = `#job/${app.jobId}`} className="hover:text-blue-600 cursor-pointer">{app.jobTitle || 'Job'}</span>
                          {app.communications && app.communications.length > 0 && (
                             <button
                               onClick={(e) => {
                                 e.stopPropagation();
                                 setSelectedAppForMessages(app);
                               }}
                               title="Click to view HR messages & acknowledge"
                               className="text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/80 hover:bg-indigo-200 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 transition-all cursor-pointer border border-indigo-200 dark:border-indigo-800 shadow-xs group-hover:scale-105"
                             >
                               <MessageSquare className="w-2.5 h-2.5 text-indigo-500" />
                               <span>{app.communications.length}</span>
                             </button>
                          )}
                       </div>
                       <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">{app.companyName || 'Company'}</div>
                       
                       <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                          <button 
                             onClick={() => window.location.hash = `#job/${app.jobId}`}
                             className="text-slate-400 hover:text-blue-600 font-semibold flex items-center gap-0.5 text-[11px]"
                          >
                             View Job
                          </button>
                          
                          <div className="flex items-center gap-1.5">
                             {app.communications && app.communications.length > 0 && (
                               <button 
                                  onClick={() => setSelectedAppForMessages(app)}
                                  className="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 dark:hover:bg-indigo-900 font-bold px-2 py-1 rounded-lg flex items-center gap-1 text-[11px] transition-colors border border-indigo-200/50 dark:border-indigo-800/50"
                               >
                                  <MessageSquare className="w-3 h-3 text-indigo-500" />
                                  <span>HR Messages ({app.communications.length})</span>
                               </button>
                             )}

                             <button 
                                onClick={() => setSelectedAppForInfo(app)}
                                className="text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 font-bold px-2 py-1 rounded-lg flex items-center gap-1 text-[11px] transition-colors"
                             >
                                <HelpCircle className="w-3 h-3" />
                                <span>Inquire</span>
                             </button>
                          </div>
                       </div>
                    </motion.div>
                  ))}
                  {items.length === 0 && (
                     <div className="py-8 text-center text-[10px] text-slate-300 dark:text-slate-600 italic">Empty</div>
                  )}
               </div>
            </div>
          );
        })}
      </div>

      {/* HR Communications & Message Acknowledgement Thread Modal */}
      {selectedAppForMessages && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl relative max-h-[90vh] flex flex-col"
          >
            <button 
              onClick={() => setSelectedAppForMessages(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl text-indigo-600 dark:text-indigo-400">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                  HR Communications & Thread
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Role: <strong className="text-slate-700 dark:text-slate-200">{selectedAppForMessages.jobTitle}</strong> at {selectedAppForMessages.companyName || 'Employer'}
                </p>
              </div>
            </div>

            {/* Toast Alerts */}
            {ackSuccess && (
              <div className="mb-3 p-2.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                Message acknowledgment logged for hiring team!
              </div>
            )}
            {replySuccess && (
              <div className="mb-3 p-2.5 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-xl text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4 text-indigo-500" />
                Response sent directly to recruiter!
              </div>
            )}

            {/* Message Thread Scroll Area */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-4 my-2">
              {selectedAppForMessages.communications && selectedAppForMessages.communications.length > 0 ? (
                selectedAppForMessages.communications.map((msg, index) => {
                  const isHR = msg.sender !== 'Candidate';
                  const isAck = msg.text?.includes('[Candidate Acknowledgment]');

                  return (
                    <div 
                      key={index} 
                      className={`p-4 rounded-2xl border text-xs transition-all ${
                        isHR 
                          ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/80 ml-0 mr-4 shadow-xs' 
                          : isAck 
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 ml-4 mr-0' 
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 ml-4 mr-0'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className={`font-bold flex items-center gap-1.5 ${isHR ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>
                          {isHR ? (
                            <span className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-md font-extrabold uppercase tracking-wider">
                              {msg.sender || 'HR / Recruiter'}
                            </span>
                          ) : isAck ? (
                            <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-md font-extrabold uppercase tracking-wider">
                              You (Candidate)
                            </span>
                          ) : (
                            <span className="bg-slate-600 text-white text-[10px] px-2 py-0.5 rounded-md font-extrabold uppercase tracking-wider">
                              You (Candidate)
                            </span>
                          )}
                        </span>
                        
                        {msg.timestamp && (
                          <span className="text-[10px] text-slate-400">
                            {new Date(msg.timestamp).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        )}
                      </div>

                      <p className="text-slate-800 dark:text-slate-200 text-xs leading-relaxed whitespace-pre-wrap font-medium">
                        {msg.text}
                      </p>

                      {/* Acknowledge Button for HR Messages */}
                      {isHR && (
                        <div className="mt-3 pt-2 border-t border-indigo-200/50 dark:border-indigo-900/50 flex items-center justify-between gap-2">
                          <span className="text-[10px] text-indigo-500 font-medium">Received from Talent Team</span>
                          
                          <button
                            onClick={() => handleAcknowledgeMessage(msg.text, index)}
                            disabled={isAcknowledging === `ack-${index}`}
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                          >
                            {isAcknowledging === `ack-${index}` ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )}
                            Acknowledge Message
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-slate-400 italic text-xs">
                  No messages recorded in thread yet.
                </div>
              )}
            </div>

            {/* Candidate Response Form */}
            <form onSubmit={handleSendReply} className="pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Send Reply / Message to HR
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Type your response to the talent manager..."
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
                />
                <button
                  type="submit"
                  disabled={isSendingReply || !replyText.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer shrink-0"
                >
                  {isSendingReply ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Reply</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Candidate Request Info & Clarification Modal */}
      {selectedAppForInfo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl relative"
          >
            <button 
              onClick={() => setSelectedAppForInfo(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            {!sendSuccess ? (
              <form onSubmit={handleSendInfoRequest}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl text-indigo-600 dark:text-indigo-400">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100">Request Information from Recruiter</h3>
                    <p className="text-xs text-slate-500">Inquire about <strong>{selectedAppForInfo.jobTitle}</strong> at {selectedAppForInfo.companyName}</p>
                  </div>
                </div>

                <div className="space-y-4 my-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Inquiry Topic</label>
                    <select
                      value={infoTopic}
                      onChange={e => setInfoTopic(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-semibold"
                    >
                      <option value="Compensation & Salary Transparency">Compensation & Salary Transparency</option>
                      <option value="Remote / Hybrid Work Expectations">Remote / Hybrid Work Expectations</option>
                      <option value="Interview Process & Next Steps Timeline">Interview Process & Next Steps Timeline</option>
                      <option value="Tech Stack & Framework Specifics">Tech Stack & Framework Specifics</option>
                      <option value="Team Structure & Reporting Lines">Team Structure & Reporting Lines</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Message for Hiring Manager</label>
                    <textarea
                      rows={4}
                      value={infoMessage}
                      onChange={e => setInfoMessage(e.target.value)}
                      placeholder="e.g. Hi talent team, could you provide details regarding the remote work flexibility or the technical assessment structure for this role?"
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {selectedAppForInfo.communications && selectedAppForInfo.communications.length > 0 && (
                   <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 mb-4 max-h-32 overflow-y-auto space-y-2">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Previous Messages</div>
                      {selectedAppForInfo.communications.map((msg, i) => (
                         <div key={i} className="text-xs">
                            <span className="font-bold text-slate-700 dark:text-slate-300">{msg.sender}:</span> <span className="text-slate-600 dark:text-slate-400">{msg.text}</span>
                         </div>
                      ))}
                   </div>
                )}

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedAppForInfo(null)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSending}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition-colors disabled:opacity-50"
                  >
                    {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Send Message to Recruiter
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-1">Inquiry Sent to Hiring Team</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Your question has been logged and sent to the recruiter at <strong>{selectedAppForInfo.companyName}</strong>.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </>
  );
};

export const JobSeekerDashboard = () => {
  const { user, appUser } = useAuth();
  const [profile, setProfile] = useState<JobSeekerProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const { matches, loading: matchingLoading } = useJobMatching(profile);
  const [view, setView] = useState<'matches' | 'pipeline'>('matches');

  const formatTimeAgo = (createdAt: any) => {
    if (!createdAt) return 'Recently';
    let date: Date;
    if (typeof createdAt.toDate === 'function') {
      date = createdAt.toDate();
    } else if (createdAt instanceof Date) {
      date = createdAt;
    } else if (createdAt.seconds) {
      date = new Date(createdAt.seconds * 1000);
    } else {
      date = new Date(createdAt);
    }

    const now = new Date();
    const diffMs = Math.abs(now.getTime() - date.getTime());
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);

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
        seekerName: profile?.fullName || user.displayName || user.email?.split('@')[0] || 'Candidate',
        seekerEmail: user.email || '',
        seekerHeadline: profile?.title || profile?.currentTitle || 'Job Seeker',
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
        card: "bg-rose-100/90 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 hover:border-rose-400 dark:hover:border-rose-700 shadow-sm",
        scoreColor: "text-rose-700 dark:text-rose-300 font-bold"
      };
    } else if (val < 60) {
      return {
        card: "bg-amber-100/90 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 hover:border-amber-400 dark:hover:border-rose-700 shadow-sm",
        scoreColor: "text-amber-700 dark:text-amber-300 font-bold"
      };
    } else if (val < 90) {
      return {
        card: "bg-emerald-100/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 hover:border-emerald-400 dark:hover:border-emerald-700 shadow-sm",
        scoreColor: "text-emerald-700 dark:text-emerald-300 font-bold"
      };
    } else {
      // 90+ Top match vibrant gold & emerald
      return {
        card: "bg-gradient-to-br from-emerald-100/90 via-amber-50/80 to-emerald-200/90 dark:from-emerald-950/60 dark:via-amber-950/40 dark:to-emerald-900/60 border-2 border-amber-400 dark:border-amber-500 shadow-lg shadow-amber-500/10 ring-2 ring-amber-400/30",
        scoreColor: "text-amber-700 dark:text-amber-300 font-extrabold"
      };
    }
  };

  useEffect(() => {
    if (!user) return;

    // Fetch Profile
    const profileUnsubscribe = onSnapshot(doc(db, `users/${user.uid}/profiles/main`), (doc) => {
      if (doc.exists()) setProfile(doc.data() as JobSeekerProfile);
    });

    // Fetch Applications
    const appsQuery = query(
      collection(db, 'applications'), 
      where('seekerId', '==', user.uid),
      orderBy('appliedAt', 'desc'),
      limit(20)
    );
    const appsUnsubscribe = onSnapshot(appsQuery, (snapshot) => {
      setApplications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application)));
    });

    return () => {
      profileUnsubscribe();
      appsUnsubscribe();
    };
  }, [user]);

  const stats = [
    { label: 'Applied', count: applications.length, icon: Send, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Viewed', count: applications.filter(a => a.status === 'viewed').length, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Interviewing', count: applications.filter(a => a.status === 'interviewing').length, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Offers', count: applications.filter(a => a.status === 'offered').length, icon: TrendingUp, color: 'text-indigo-500', bg: 'bg-indigo-50' }
  ];

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 w-full md:w-[75vw] max-w-none mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Hello, {appUser?.email ? appUser.email.split('@')[0] : 'User'}</h1>
          <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            Found {matches.length} matches for your {profile?.targetRole || 'profile'}
          </p>
        </div>
        <div className="flex gap-4">
          <a href="#edit-profile" className="inline-flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-6 py-3 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all items-center">
            Update Profile
          </a>
          <a href="#analytics" className="inline-flex bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-xl shadow-blue-200 dark:shadow-blue-900/20 transition-all items-center cursor-pointer">
            View Analytics
          </a>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        {stats.map((stat) => (
          <div key={stat.label} className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
            <div className={`p-2 w-fit ${stat.bg} ${stat.color} dark:bg-opacity-10 dark:bg-slate-800 rounded-xl mb-4`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div className="text-3xl font-bold mb-1">{stat.count}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex gap-8">
              <button 
                onClick={() => setView('matches')}
                className={`pb-4 px-2 font-bold text-sm transition-all relative ${
                  view === 'matches' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Top Matches
                {view === 'matches' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />}
              </button>
              <button 
                onClick={() => setView('pipeline')}
                className={`pb-4 px-2 font-bold text-sm transition-all relative ${
                  view === 'pipeline' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Application Pipeline
                {view === 'pipeline' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />}
              </button>
            </div>
          </div>

          <div className="mt-8">
            {view === 'matches' ? (
              <div className="grid gap-6">
                {matchingLoading ? (
                  <div className="p-12 text-center text-slate-400">Loading matches...</div>
                ) : matches.length > 0 ? (
                  matches.map(({ job, score, tier }, i) => {
                    const styles = getScoreStyles(score);
                    const matchBreakdown = getMatchBreakdown(profile, job);
                    const jobMinSalary = job.parsedCriteria?.salaryRange?.min || 80000;
                    const jobMaxSalary = job.parsedCriteria?.salaryRange?.max || 130000;
                    const workplace = job.workplaceType || job.parsedCriteria?.workplaceType || 'Remote';
                    const location = job.location || job.parsedCriteria?.location || 'San Francisco, CA';

                    return (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={job.id} 
                        className={`group relative p-8 rounded-3xl border hover:shadow-xl hover:-translate-y-1 transition-all ${styles.card}`}
                      >
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex gap-4">
                            <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-700 shrink-0">
                              <Briefcase className="w-6 h-6 text-slate-400" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors uppercase tracking-tight">{job.title}</h3>
                              <p className="font-medium text-slate-600 dark:text-slate-400">
                                <a 
                                  href={`#company/${job.companyId || 'unknown'}?name=${encodeURIComponent(job.companyName)}`}
                                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors underline decoration-slate-300 dark:decoration-slate-700 hover:decoration-blue-500 underline-offset-4 cursor-pointer"
                                >
                                  {job.companyName}
                                </a>
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className={`text-2xl font-bold ${styles.scoreColor}`}>
                              {Math.round(score * 100)}%
                            </div>
                            <div className="text-xs font-bold text-slate-400 uppercase">Match Score</div>
                          </div>
                        </div>

                        {/* Workplace, Salary & Benefits Tags */}
                        <div className="flex flex-wrap gap-2.5 mb-5">
                           <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                             <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" /> {workplace} • {location}
                           </div>
                           <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                             <DollarSign className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> ${((jobMinSalary)/1000).toFixed(0)}k - ${((jobMaxSalary)/1000).toFixed(0)}k
                           </div>
                           {matchBreakdown.benefitsMatch.totalMatched > 0 && (
                             <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-3 py-1.5 rounded-xl border border-indigo-200/60 dark:border-indigo-800/60">
                               <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" /> {matchBreakdown.benefitsMatch.totalMatched} Benefits Matched
                             </div>
                           )}
                           {matchBreakdown.skillsMatch.requiredMatched.slice(0, 3).map(skill => (
                              <div key={skill} className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 px-3 py-1.5 rounded-xl font-bold border border-blue-200/40 dark:border-blue-800/40">
                                ✓ {skill}
                              </div>
                           ))}
                        </div>

                        {/* Why & How Profile Matched Breakdown Box */}
                        <div className="p-4 bg-slate-50/90 dark:bg-slate-950/80 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 mb-6 space-y-2 text-xs">
                          <div className="flex items-center justify-between font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-200/50 dark:border-slate-800/50">
                            <span className="flex items-center gap-1.5">
                              <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Why & How Profile Matched
                            </span>
                            <span className="text-blue-600 dark:text-blue-400 font-bold">
                              {matchBreakdown.skillsMatch.matchedCount}/{matchBreakdown.skillsMatch.totalRequired} Core Skills Matched
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 dark:text-slate-300 pt-1">
                            {matchBreakdown.reasons.slice(0, 4).map((reasonText, idx) => (
                              <div key={idx} className="flex items-start gap-1.5 text-[11px] leading-snug">
                                <span className="shrink-0 text-emerald-500 font-extrabold">✓</span>
                                <span>{reasonText}</span>
                              </div>
                            ))}
                          </div>

                          {matchBreakdown.willingToConsider.hasOptions && (
                            <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/50 text-[11px] text-amber-700 dark:text-amber-300 font-medium flex items-start gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                              <div>
                                <strong>Employer Flexibility:</strong> {matchBreakdown.willingToConsider.notes || matchBreakdown.willingToConsider.options.join('; ')}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-6 border-t border-slate-200/50 dark:border-slate-800">
                          <div className="flex items-center gap-2 text-slate-500 text-sm">
                             <Clock className="w-4 h-4" /> Posted {formatTimeAgo(job.createdAt)}
                          </div>
                          <div className="flex items-center gap-3">
                            <a href={`#job/${job.id}`} className="px-4 py-2.5 rounded-xl font-bold text-sm bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-all">
                              Review Details
                            </a>
                            {applications.some(app => app.jobId === job.id) ? (
                              <span className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-emerald-600 text-white cursor-default shadow-sm">
                                <Check className="w-4 h-4" /> Applied
                              </span>
                            ) : tier === 'one-click' || tier === 'auto' ? (
                              <button 
                                onClick={(e) => handleOneClickApply(job, tier, e)}
                                disabled={applyingJobId === job.id}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 cursor-pointer"
                              >
                                {applyingJobId === job.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                {tier === 'auto' ? 'Auto-Apply Now' : 'One-Click Apply'}
                              </button>
                            ) : (
                              <a href={`#job/${job.id}`} className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all">
                                Apply
                                <ChevronRight className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="p-12 bg-slate-50 rounded-3xl flex flex-col items-center text-slate-400 border border-dashed border-slate-200">
                    <Briefcase className="w-12 h-12 mb-4" />
                    <p>No matches yet. Try updating your skills or target role.</p>
                  </div>
                )}
              </div>
            ) : (
              <ApplicationPipeline applications={applications} />
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm text-slate-900 dark:text-white">
             <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
               <TrendingUp className="w-5 h-5 text-blue-500" />
               Market Insights
             </h3>
             <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
               Roles for <strong>{profile?.targetRole || 'your profile'}</strong> are up 12% this month in your area.
             </p>
             <div className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                   <div className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Avg. Salary</div>
                   <div className="text-xl font-bold text-slate-900 dark:text-white">$165,000</div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                   <div className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Top Skill in Demand</div>
                   <div className="text-xl font-bold text-blue-600 dark:text-blue-400">System Design</div>
                </div>
             </div>
          </div>

          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm text-slate-900 dark:text-white">
             <h3 className="font-bold text-lg mb-4">Recent Applications</h3>
             <div className="space-y-4">
               {applications.length > 0 ? (
                 applications.map(app => (
                   <a href={`#job/${app.jobId}`} key={app.id} className="flex items-center justify-between py-2 group hover:bg-slate-50 dark:hover:bg-slate-800 p-2 -mx-2 rounded-xl transition-colors">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors border border-slate-100 dark:border-slate-700">
                            <Send className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                         </div>
                         <div>
                            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{app.jobTitle || 'Job'}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{app.companyName || 'Company'}</div>
                         </div>
                      </div>
                      <span className="text-[10px] font-bold uppercase py-1 px-2 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-full">
                        {app.status}
                      </span>
                   </a>
                 ))
               ) : (
                 <p className="text-sm text-slate-400 text-center py-4">No applications yet.</p>
               )}
             </div>
             <button className="w-full mt-6 py-3 text-sm font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded-xl transition-all">
                View All Activity
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
