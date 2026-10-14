import { useState, FormEvent } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Application, ApplicationStatus } from '../../types';
import { 
  MessageSquare, 
  HelpCircle, 
  Send, 
  Loader2, 
  Check, 
  X, 
  Lock 
} from 'lucide-react';
import { motion } from 'motion/react';
import { collection, addDoc, serverTimestamp, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebase/config';

interface ApplicationPipelineTableProps {
  applications: Application[];
}

export function ApplicationPipelineTable({ applications }: ApplicationPipelineTableProps) {
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
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
                             className="text-slate-400 hover:text-blue-600 font-semibold flex items-center gap-0.5 text-[11px] cursor-pointer"
                          >
                             View Job
                          </button>
                          
                          <div className="flex items-center gap-1.5">
                             <button 
                                onClick={() => setSelectedAppForInfo(app)}
                                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors cursor-pointer"
                                title="Request Additional Information / Salary Transparency"
                             >
                                <HelpCircle className="w-3.5 h-3.5" />
                             </button>
                          </div>
                       </div>
                    </motion.div>
                  ))}
               </div>
            </div>
          );
        })}
      </div>

      {/* Recruiter Communication & Acknowledgment Drawer */}
      {selectedAppForMessages && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 text-left">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  Recruiter Communication Log
                </h3>
                <p className="text-xs text-slate-500 font-bold">{selectedAppForMessages.jobTitle} • {selectedAppForMessages.companyName}</p>
              </div>
              <button onClick={() => setSelectedAppForMessages(null)} className="p-2 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-3 p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
              {selectedAppForMessages.communications?.map((msg, i) => (
                <div key={i} className={`p-3 rounded-xl text-xs space-y-1 ${msg.sender === 'Candidate' ? 'bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 ml-6' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 mr-6'}`}>
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
                    <span>{msg.sender}</span>
                    <span>{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{msg.text}</p>
                  
                  {msg.sender !== 'Candidate' && (
                    <button
                      onClick={() => handleAcknowledgeMessage(msg.text, i)}
                      disabled={isAcknowledging === `ack-${i}`}
                      className="mt-1 text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {isAcknowledging === `ack-${i}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      <span>Acknowledge Message</span>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Quick Reply Form */}
            <form onSubmit={handleSendReply} className="space-y-3">
              <textarea
                rows={3}
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="Type your response or confirmation for the hiring manager..."
                className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 font-medium resize-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  disabled={isSendingReply || !replyText.trim()}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
                >
                  {isSendingReply ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Send Response</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Information Clarification Dialog */}
      {selectedAppForInfo && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 text-left">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-indigo-600" />
                  Request Role Specification / Salary Detail
                </h3>
                <p className="text-xs text-slate-500 font-bold">{selectedAppForInfo.jobTitle} • {selectedAppForInfo.companyName}</p>
              </div>
              <button onClick={() => setSelectedAppForInfo(null)} className="p-2 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendInfoRequest} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Inquiry Topic</label>
                <select
                  value={infoTopic}
                  onChange={e => setInfoTopic(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <option value="Compensation & Salary Transparency">Compensation & Salary Transparency</option>
                  <option value="Remote / Workplace Arrangement Details">Remote / Workplace Arrangement Details</option>
                  <option value="Technical Assessment & Interview Structure">Technical Assessment & Interview Structure</option>
                  <option value="Sponsorship / Visa Work Authorization Policy">Sponsorship / Visa Work Authorization Policy</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Message for Hiring Manager</label>
                <textarea
                  rows={4}
                  value={infoMessage}
                  onChange={e => setInfoMessage(e.target.value)}
                  placeholder="e.g. Hi talent team, could you provide details regarding the remote work flexibility or compensation band for this role?"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAppForInfo(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
                >
                  {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Submit Inquiry</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
