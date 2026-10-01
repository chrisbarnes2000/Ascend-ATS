import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Network, 
  Shield, 
  Sparkles, 
  Handshake, 
  ExternalLink, 
  Copy, 
  Check, 
  Download, 
  ArrowRight, 
  Zap, 
  Users, 
  Brain, 
  Heart, 
  Compass, 
  Sliders, 
  Activity, 
  RefreshCw, 
  Send, 
  CheckCircle2, 
  Lock, 
  Eye, 
  BarChart3, 
  Radio,
  Share2,
  FileCode
} from 'lucide-react';

interface TrustNode {
  id: string;
  name: string;
  role: string;
  tier: 'Dunbar 5 (Inner Core)' | 'Dunbar 15 (Strategic)' | 'Dunbar 50 (Professional)' | 'Dunbar 150 (Extended)';
  credibility: number;
  reliability: number;
  intimacy: number;
  selfOrientation: number;
  relationship: string;
  ndAffinity: string;
}

const SAMPLE_TRUST_NODES: TrustNode[] = [
  {
    id: 'node-1',
    name: 'Chris Barnes',
    role: 'Lead Architect & Founder (RapportVerse)',
    tier: 'Dunbar 5 (Inner Core)',
    credibility: 9.8,
    reliability: 9.7,
    intimacy: 9.5,
    selfOrientation: 1.2,
    relationship: 'Strategic Partner & Co-Innovator',
    ndAffinity: 'Direct, Asynchronous, Cognitive Ergonomics'
  },
  {
    id: 'node-2',
    name: 'Elena Rostova',
    role: 'VP of Engineering (CloudScale)',
    tier: 'Dunbar 15 (Strategic)',
    credibility: 9.4,
    reliability: 9.2,
    intimacy: 8.5,
    selfOrientation: 2.1,
    relationship: 'Executive Reference & Tech Mentor',
    ndAffinity: 'Structured Agendas & Objective Milestones'
  },
  {
    id: 'node-3',
    name: 'Marcus Vance',
    role: 'Principal Staff Recruiter (BioSynthetix)',
    tier: 'Dunbar 50 (Professional)',
    credibility: 8.8,
    reliability: 8.9,
    intimacy: 7.2,
    selfOrientation: 3.0,
    relationship: 'Talent Scout & Hiring Sponsor',
    ndAffinity: 'Transparent Salary Calibration'
  },
  {
    id: 'node-4',
    name: 'Dr. Sarah Chen',
    role: 'Director of AI Research (DeepMatrix)',
    tier: 'Dunbar 15 (Strategic)',
    credibility: 9.6,
    reliability: 9.5,
    intimacy: 8.8,
    selfOrientation: 1.8,
    relationship: 'Peer Collaborator & Open Source Lead',
    ndAffinity: 'Low Sensory Friction, Written Synthesis'
  },
  {
    id: 'node-5',
    name: 'Jordan Rivera',
    role: 'Senior Product Designer (Nexus Labs)',
    tier: 'Dunbar 50 (Professional)',
    credibility: 8.5,
    reliability: 8.7,
    intimacy: 8.0,
    selfOrientation: 2.4,
    relationship: 'Design Systems Ally',
    ndAffinity: 'Visual Object Permanence & Sensory Calm'
  }
];

export const RapportVersePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'radar' | 'calculator' | 'nd-styles' | 'bridge'>('radar');
  const [selectedNode, setSelectedNode] = useState<TrustNode>(SAMPLE_TRUST_NODES[0]);
  const [copiedBadge, setCopiedBadge] = useState<string | null>(null);

  // Trust Equation Live Interactive State
  const [credibility, setCredibility] = useState<number>(9.5);
  const [reliability, setReliability] = useState<number>(9.2);
  const [intimacy, setIntimacy] = useState<number>(8.8);
  const [selfOrientation, setSelfOrientation] = useState<number>(1.8);

  // Sync Simulation State
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncSuccess, setSyncSuccess] = useState<boolean>(false);

  // Maister Trust Quotient Calculation: TQ = (C + R + I) / S
  const trustQuotient = useMemo(() => {
    const s = Math.max(selfOrientation, 0.1);
    const quotient = (credibility + reliability + intimacy) / s;
    return Number(quotient.toFixed(2));
  }, [credibility, reliability, intimacy, selfOrientation]);

  const trustRating = useMemo(() => {
    if (trustQuotient >= 12) return { label: 'Exceptional (Inner Sanctuary)', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800' };
    if (trustQuotient >= 8) return { label: 'High Alignment (Strategic Ally)', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800' };
    if (trustQuotient >= 5) return { label: 'Moderate (Transactional / Developing)', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800' };
    return { label: 'High Self-Orientation Risk', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800' };
  }, [trustQuotient]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBadge(id);
    setTimeout(() => setCopiedBadge(null), 2500);
  };

  const handleSimulateSync = () => {
    setIsSyncing(true);
    setSyncSuccess(false);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncSuccess(true);
    }, 1400);
  };

  const handleExportTopologyJSON = () => {
    const exportData = {
      platform: "Ascend ATS",
      partnerBridge: "RapportVerse",
      partnerUri: "https://rapprt.space",
      exportedAt: new Date().toISOString(),
      trustTopologySchemaVersion: "1.2.0",
      dunbarNetwork: SAMPLE_TRUST_NODES,
      activeTrustVector: {
        credibility,
        reliability,
        intimacy,
        selfOrientation,
        trustQuotient,
        alignmentBand: trustRating.label
      },
      neurodiversityPreferences: {
        primaryMode: "Direct & Structured Asynchronous",
        sensoryCalmMode: true,
        transparentCompensationRequired: true
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapportverse-ascend-topology-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full min-h-screen bg-slate-50/50 dark:bg-slate-950 py-10 px-4 md:px-8">
      <div className="w-full md:w-[75vw] max-w-7xl mx-auto space-y-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Workspace</a>
            <span>/</span>
            <a href="#affiliates" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Partners</a>
            <span>/</span>
            <span className="text-slate-900 dark:text-slate-200">RapportVerse Strategic Portal</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Sparkles className="w-3 h-3" />
              <span>Verified Strategic Bridge</span>
            </span>
            <a
              href="https://rapprt.space"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg shadow-sm hover:border-blue-500 transition-colors"
            >
              <span>Visit Rapprt.Space</span>
              <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
            </a>
          </div>
        </div>

        {/* Hero Banner Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-8 md:p-12 rounded-3xl border border-slate-800 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Handshake className="w-3.5 h-3.5" />
              <span>Strategic Partnership & Topology Bridge</span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-display font-extrabold tracking-tight leading-tight">
              Ascend ATS <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-amber-300">× RapportVerse</span>
            </h1>
            
            <p className="text-slate-300 text-sm md:text-base leading-relaxed font-normal">
              Connecting deterministic Applicant Tracking with qualitative human trust mapping. Bridge your candidate references, mentor graphs, and neurodiversity-affirming communication preferences directly into the RapportVerse ecosystem.
            </p>

            {/* Quick Metrics Bar */}
            <div className="pt-4 flex flex-wrap items-center gap-6 border-t border-white/10 text-xs font-semibold text-slate-300">
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4 text-blue-400" />
                <span>Dunbar 5 / 15 / 50 Radar Topology</span>
              </div>
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-indigo-400" />
                <span>Maister Trust Equation Model</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-400" />
                <span>Neurodiversity & Double Empathy</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('radar')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'radar'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Concentric Trust Radar</span>
          </button>

          <button
            onClick={() => setActiveTab('calculator')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'calculator'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Trust Equation Simulator</span>
          </button>

          <button
            onClick={() => setActiveTab('nd-styles')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'nd-styles'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
            }`}
          >
            <Brain className="w-4 h-4" />
            <span>Neurodiversity & Double Empathy</span>
          </button>

          <button
            onClick={() => setActiveTab('bridge')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'bridge'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>Data Bridge & Badges</span>
          </button>
        </div>

        {/* Tab 1: Concentric Trust Radar */}
        {activeTab === 'radar' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start"
          >
            {/* Visual Radar Screen */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                    <Compass className="w-5 h-5 text-blue-600" />
                    <span>Concentric Trust Radar (Dunbar Layers)</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Visual topology mapping candidate professional ties, executive champions, and reference networks.
                  </p>
                </div>
                <span className="text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full">
                  {SAMPLE_TRUST_NODES.length} Active Nodes
                </span>
              </div>

              {/* Interactive Radar SVG Stage */}
              <div className="relative w-full aspect-square max-h-[420px] mx-auto bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center p-4">
                {/* Concentric Circles */}
                <svg className="w-full h-full" viewBox="0 0 400 400">
                  {/* Grid Lines */}
                  <line x1="200" y1="20" x2="200" y2="380" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="20" y1="200" x2="380" y2="200" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />

                  {/* Dunbar Layer 150 */}
                  <circle cx="200" cy="200" r="170" fill="none" stroke="#334155" strokeWidth="1.5" />
                  <text x="205" y="45" fill="#64748b" fontSize="10" fontWeight="bold">DUNBAR 150 (Extended)</text>

                  {/* Dunbar Layer 50 */}
                  <circle cx="200" cy="200" r="120" fill="none" stroke="#475569" strokeWidth="1.5" />
                  <text x="205" y="95" fill="#94a3b8" fontSize="10" fontWeight="bold">DUNBAR 50 (Professional)</text>

                  {/* Dunbar Layer 15 */}
                  <circle cx="200" cy="200" r="70" fill="none" stroke="#3b82f6" strokeWidth="1.5" />
                  <text x="205" y="145" fill="#60a5fa" fontSize="10" fontWeight="bold">DUNBAR 15 (Strategic)</text>

                  {/* Core Sanctuary: Dunbar 5 */}
                  <circle cx="200" cy="200" r="28" fill="rgba(37, 99, 235, 0.2)" stroke="#f59e0b" strokeWidth="2" />
                  <text x="185" y="204" fill="#fbbf24" fontSize="11" fontWeight="bold">5</text>

                  {/* Node 1: Chris Barnes (Dunbar 5) */}
                  <g 
                    className="cursor-pointer transition-transform hover:scale-125"
                    onClick={() => setSelectedNode(SAMPLE_TRUST_NODES[0])}
                  >
                    <circle cx="215" cy="185" r="12" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" className="animate-pulse" />
                    <text x="232" y="190" fill="#f8fafc" fontSize="10" fontWeight="bold">Chris B.</text>
                  </g>

                  {/* Node 2: Elena Rostova (Dunbar 15) */}
                  <g 
                    className="cursor-pointer transition-transform hover:scale-125"
                    onClick={() => setSelectedNode(SAMPLE_TRUST_NODES[1])}
                  >
                    <circle cx="160" cy="160" r="9" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" />
                    <text x="100" y="155" fill="#cbd5e1" fontSize="9">Elena R.</text>
                  </g>

                  {/* Node 4: Dr. Sarah Chen (Dunbar 15) */}
                  <g 
                    className="cursor-pointer transition-transform hover:scale-125"
                    onClick={() => setSelectedNode(SAMPLE_TRUST_NODES[3])}
                  >
                    <circle cx="245" cy="235" r="9" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" />
                    <text x="260" y="240" fill="#cbd5e1" fontSize="9">Sarah C.</text>
                  </g>

                  {/* Node 3: Marcus Vance (Dunbar 50) */}
                  <g 
                    className="cursor-pointer transition-transform hover:scale-125"
                    onClick={() => setSelectedNode(SAMPLE_TRUST_NODES[2])}
                  >
                    <circle cx="120" cy="260" r="8" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
                    <text x="50" y="275" fill="#94a3b8" fontSize="9">Marcus V.</text>
                  </g>

                  {/* Node 5: Jordan Rivera (Dunbar 50) */}
                  <g 
                    className="cursor-pointer transition-transform hover:scale-125"
                    onClick={() => setSelectedNode(SAMPLE_TRUST_NODES[4])}
                  >
                    <circle cx="290" cy="140" r="8" fill="#8b5cf6" stroke="#ffffff" strokeWidth="1.5" />
                    <text x="305" y="145" fill="#94a3b8" fontSize="9">Jordan R.</text>
                  </g>
                </svg>
              </div>

              {/* Node Selector Pills */}
              <div className="flex flex-wrap gap-2">
                {SAMPLE_TRUST_NODES.map((node) => (
                  <button
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      selectedNode.id === node.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {node.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Node Details Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
                  {selectedNode.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-display font-bold text-slate-900 dark:text-white text-base">
                    {selectedNode.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedNode.role}
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Dunbar Layer:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{selectedNode.tier}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Relationship:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{selectedNode.relationship}</span>
                </div>
                <div className="space-y-1 py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Communication & ND Affinity:</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg text-[11px] leading-relaxed">
                    {selectedNode.ndAffinity}
                  </p>
                </div>
              </div>

              {/* Trust Sub-Scores */}
              <div className="space-y-2.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  Trust Matrix Attributes
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Credibility</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{selectedNode.credibility} / 10</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Reliability</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">{selectedNode.reliability} / 10</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Intimacy (Safety)</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">{selectedNode.intimacy} / 10</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Self-Orientation</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">{selectedNode.selfOrientation} / 10 (Low is Elite)</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    setCredibility(selectedNode.credibility);
                    setReliability(selectedNode.reliability);
                    setIntimacy(selectedNode.intimacy);
                    setSelfOrientation(selectedNode.selfOrientation);
                    setActiveTab('calculator');
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs py-3 rounded-xl hover:opacity-90 transition-opacity"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Simulate in Trust Equation</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 2: Trust Equation Simulator */}
        {activeTab === 'calculator' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
          >
            {/* Controls */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div>
                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-amber-500" />
                  <span>David Maister's Trust Equation Simulator</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Evaluate alignment scores between job candidates, reference sponsors, and employer culture.
                </p>
              </div>

              {/* Equation Display Box */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white font-mono text-center text-sm border border-slate-800 space-y-1">
                <div className="text-amber-400 font-bold">Trust Quotient (TQ) = (Credibility + Reliability + Intimacy) / Self-Orientation</div>
                <div className="text-xs text-slate-400">TQ = ({credibility} + {reliability} + {intimacy}) / {selfOrientation} = <span className="text-emerald-400 font-bold text-sm">{trustQuotient}</span></div>
              </div>

              {/* Sliders */}
              <div className="space-y-5">
                {/* Credibility */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700 dark:text-slate-200">Credibility (Words & Expertise)</span>
                    <span className="text-blue-600 dark:text-blue-400">{credibility.toFixed(1)} / 10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.1"
                    value={credibility}
                    onChange={(e) => setCredibility(parseFloat(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                  <p className="text-[11px] text-slate-400">Verifiable competence, accurate skills taxonomy, objective track record.</p>
                </div>

                {/* Reliability */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700 dark:text-slate-200">Reliability (Actions & Follow-Through)</span>
                    <span className="text-emerald-600 dark:text-emerald-400">{reliability.toFixed(1)} / 10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.1"
                    value={reliability}
                    onChange={(e) => setReliability(parseFloat(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                  <p className="text-[11px] text-slate-400">Consistency, predictable delivery, dependable meeting cadences.</p>
                </div>

                {/* Intimacy / Psychological Safety */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700 dark:text-slate-200">Intimacy (Emotional Safety & Vulnerability)</span>
                    <span className="text-indigo-600 dark:text-indigo-400">{intimacy.toFixed(1)} / 10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.1"
                    value={intimacy}
                    onChange={(e) => setIntimacy(parseFloat(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                  <p className="text-[11px] text-slate-400">Psychological safety, direct communication, candid feedback without retaliation.</p>
                </div>

                {/* Self-Orientation */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700 dark:text-slate-200">Self-Orientation (Ego & Transactional Focus — Denominator)</span>
                    <span className="text-amber-600 dark:text-amber-400">{selfOrientation.toFixed(1)} / 10 (Lower = Higher Trust)</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="10"
                    step="0.1"
                    value={selfOrientation}
                    onChange={(e) => setSelfOrientation(parseFloat(e.target.value))}
                    className="w-full accent-amber-600"
                  />
                  <p className="text-[11px] text-slate-400">High self-orientation reduces trust exponentially. Low self-orientation indicates genuine stewardship.</p>
                </div>
              </div>
            </div>

            {/* Score interpretation card */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div>
                <h4 className="font-display font-bold text-base text-slate-900 dark:text-white">
                  Trust Quotient Interpretation
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Algorithmic alignment calibrated for hiring teams and candidates.
                </p>
              </div>

              <div className={`p-5 rounded-2xl border ${trustRating.bg} text-center space-y-2`}>
                <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Calculated Quotient</span>
                <div className={`text-4xl font-black font-display ${trustRating.color}`}>
                  {trustQuotient}
                </div>
                <div className={`text-xs font-bold ${trustRating.color}`}>
                  {trustRating.label}
                </div>
              </div>

              <div className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                <p>
                  <strong>Why it matters for Ascend ATS:</strong> When recruiters and candidates maintain high intimacy (transparency on expectations) and low self-orientation (fair compensation and no hidden clauses), job offer acceptance rates increase by over 68%.
                </p>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
                  <div className="font-bold text-slate-900 dark:text-white text-[11px]">RapportVerse Guidance:</div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Keep self-orientation below 2.5 by clarifying career progression, providing transparent salary ranges, and honoring interview accommodations.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 3: Neurodiversity & Double Empathy */}
        {activeTab === 'nd-styles' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <Brain className="w-5 h-5" />
              </div>
              <h4 className="font-display font-bold text-slate-900 dark:text-white text-base">
                Double Empathy Problem
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Misunderstandings between neurodivergent and neurotypical professionals occur from bidirectional differences in communication style, not deficits. Ascend ATS integrates structured interview rubrics to remove neurotypical bias.
              </p>
              <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                • Objective Rubrics • Explicit Questions
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Eye className="w-5 h-5" />
              </div>
              <h4 className="font-display font-bold text-slate-900 dark:text-white text-base">
                Sensory Calm & Object Permanence
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Many ADHD and autistic professionals struggle with "out of sight, out of mind" relationship permanence. The visual radar keeps core mentors visible without moral guilt or cognitive overload.
              </p>
              <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                • Visual Orbit • Zero-Guilt Cadences
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="font-display font-bold text-slate-900 dark:text-white text-base">
                The Dobby Border Principle
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Quiet architectural and psychological boundary systems that prevent burnout and predatory corporate surveillance. Candidate data remains client-side sovereign and strictly consent-gated.
              </p>
              <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                • Privacy Cloak • GDPR Sovereign
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 4: Data Bridge & Badges */}
        {activeTab === 'bridge' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Exporter & Webhook Simulator */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div>
                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-blue-600" />
                  <span>RapportVerse Synchronizer & Topology Exporter</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Export your verified Ascend ATS trust topology to RapportVerse JSON format or run a sync simulation.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Target Platform Endpoint:</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">https://rapprt.space/api/bridge</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Active Architecture:</span>
                  <span className="text-slate-500 dark:text-slate-400">E2E Consent Encryption (GDPR Sovereign)</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleExportTopologyJSON}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 text-white font-bold text-xs py-3 px-4 rounded-xl hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Topology JSON</span>
                </button>

                <button
                  onClick={handleSimulateSync}
                  disabled={isSyncing}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs py-3 px-4 rounded-xl hover:opacity-90 transition-opacity"
                >
                  {isSyncing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
                      <span>Syncing with Rapprt.Space...</span>
                    </>
                  ) : syncSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Sync Verified (200 OK)</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Simulate Bridge Sync</span>
                    </>
                  )}
                </button>
              </div>

              {syncSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>Successfully validated bidirectional trust handshake with RapportVerse (5 active nodes verified).</span>
                </div>
              )}
            </div>

            {/* Markdown Badge Code Snippets */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div>
                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-amber-500" />
                  <span>Partner Badges for Projects</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Embed these verified partnership badges on any GitHub README or candidate portfolio.
                </p>
              </div>

              {/* Shield Badge */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Option A: Amber Shield Badge</span>
                  <button
                    onClick={() => copyToClipboard('[![Partner: RapportVerse](https://img.shields.io/badge/Partner-RapportVerse-amber?style=for-the-badge&logo=handshake&logoColor=fff&labelColor=1a1a1a&color=f59e0b)](https://rapprt.space)', 'badge-a')}
                    className="inline-flex items-center gap-1 text-[11px] font-bold bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:text-blue-600 transition-colors shadow-sm"
                  >
                    {copiedBadge === 'badge-a' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedBadge === 'badge-a' ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>
                <div className="pt-1">
                  <a href="https://rapprt.space" target="_blank" rel="noopener noreferrer">
                    <img 
                      src="https://img.shields.io/badge/Partner-RapportVerse-amber?style=for-the-badge&logo=handshake&logoColor=fff&labelColor=1a1a1a&color=f59e0b" 
                      alt="Partner: RapportVerse" 
                      className="rounded"
                    />
                  </a>
                </div>
              </div>

              {/* Flat Badge */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Option B: High-Contrast Flat Badge</span>
                  <button
                    onClick={() => copyToClipboard('[![Supported By: RapportVerse](https://img.shields.io/badge/Supported%20By-Rapprt.Space-indigo?style=flat-square&logo=google-cloud&logoColor=fff&color=6366f1)](https://rapprt.space)', 'badge-b')}
                    className="inline-flex items-center gap-1 text-[11px] font-bold bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:text-blue-600 transition-colors shadow-sm"
                  >
                    {copiedBadge === 'badge-b' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedBadge === 'badge-b' ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>
                <div className="pt-1">
                  <a href="https://rapprt.space" target="_blank" rel="noopener noreferrer">
                    <img 
                      src="https://img.shields.io/badge/Supported%20By-Rapprt.Space-indigo?style=flat-square&logo=google-cloud&logoColor=fff&color=6366f1" 
                      alt="Supported By: RapportVerse" 
                      className="rounded"
                    />
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
};
export default RapportVersePage;
