import { useState, useEffect } from 'react';
import { HelpCircle, Check, Loader2 } from 'lucide-react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

interface ClarificationRequest {
  id: string;
  jobTitle: string;
  seekerEmail: string;
  category: string;
  message: string;
  status: string;
  createdAt: any;
}

interface EmployerClarificationRequestsProps {
  companyId: string;
}

export function EmployerClarificationRequests({ companyId }: EmployerClarificationRequestsProps) {
  const [requests, setRequests] = useState<ClarificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'jobClarificationRequests'),
      where('companyId', '==', companyId),
      where('status', '==', 'pending')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setRequests(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ClarificationRequest)));
      setLoading(false);
    }, (err) => {
      console.error("Error fetching clarification requests:", err);
      setLoading(false);
    });

    return unsub;
  }, [companyId]);

  const handleResolve = async (reqId: string) => {
    setResolvingId(reqId);
    try {
      await updateDoc(doc(db, 'jobClarificationRequests', reqId), {
        status: 'resolved',
        resolvedAt: new Date().toISOString()
      });
    } catch (err: any) {
      console.error("Error resolving request", err);
    } finally {
      setResolvingId(null);
    }
  };

  if (loading || requests.length === 0) return null;

  return (
    <div className="bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-[2rem] p-6 space-y-4 text-left">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-amber-900 dark:text-amber-200 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-amber-600" />
          Pending Candidate Clarification Requests ({requests.length})
        </h3>
      </div>

      <div className="space-y-2">
        {requests.map(req => (
          <div key={req.id} className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-amber-100 dark:border-amber-900/40 flex items-center justify-between gap-4 text-xs">
            <div>
              <div className="font-extrabold text-slate-900 dark:text-white">{req.jobTitle} • <span className="text-amber-600">{req.category}</span></div>
              <div className="text-slate-500 mt-0.5 font-medium">{req.message}</div>
              <div className="text-[10px] text-slate-400 mt-1">From: {req.seekerEmail}</div>
            </div>

            <button
              onClick={() => handleResolve(req.id)}
              disabled={resolvingId === req.id}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl flex items-center gap-1 cursor-pointer shrink-0"
            >
              {resolvingId === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              <span>Acknowledge</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
