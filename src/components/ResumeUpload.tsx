import React, { useState } from 'react';
import { Upload, FileText, AlertCircle, Loader2, Sparkles, Zap, Cpu } from 'lucide-react';
import { motion } from 'motion/react';

interface ResumeParserProps {
  onParsed: (data: any) => void;
}

export const ResumeUpload = ({ onParsed }: ResumeParserProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promptVersion, setPromptVersion] = useState<'v1' | 'v2' | 'v3'>('v2');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.type.startsWith('text/')) {
        setError('Please upload a PDF or text file for best results.');
        return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target?.result as string;
        
        const response = await fetch('/api/parse-resume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileContent: text.substring(0, 6000),
            useAI: promptVersion !== 'v1',
            promptVersion
          })
        });

        if (!response.ok) throw new Error('Parsing failed');
        const data = await response.json();
        const fileUrl = URL.createObjectURL(file);
        onParsed({ ...data, resumePreviewUrl: fileUrl, promptVersion });
      };
      reader.readAsText(file);
    } catch (err) {
      setError('Parsing failed. You can still enter your details manually.');
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full">
      <div className={`relative group border-2 border-dashed rounded-3xl p-12 transition-all ${
        isUploading ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200 hover:border-blue-400 hover:bg-blue-50/30'
      }`}>
        <input 
          type="file" 
          onChange={handleFileUpload}
          disabled={isUploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
        />
        
        <div className="flex flex-col items-center text-center">
          {isUploading ? (
            <>
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
              <h3 className="text-xl font-bold mb-2">Analyzing your resume...</h3>
              <p className="text-slate-500">
                Running {promptVersion === 'v3' ? 'V3 Executive Analysis' : (promptVersion === 'v1' ? 'V1 Algorithmic Parser' : 'V2 Semantic Taxonomy Engine')}...
              </p>
            </>
          ) : (
            <>
              <div className="bg-blue-100 p-4 rounded-2xl text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Upload your resume</h3>
              <p className="text-slate-500 mb-6">Drag and drop your PDF/Doc, or click to browse</p>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400 uppercase tracking-widest">
                <FileText className="w-4 h-4" />
                Trusted by 50,000+ job seekers
              </div>
            </>
          )}
        </div>
      </div>
      
      {!isUploading && (
        <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-blue-500" />
              AI Prompt Ingestion Engine
            </span>
            <span className="text-[10px] font-mono font-bold text-slate-400">
              {promptVersion === 'v1' ? '~300ms (Local)' : (promptVersion === 'v2' ? '~1.2s (Gemini)' : '~2.5s (Gemini)')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPromptVersion('v1')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                promptVersion === 'v1'
                  ? 'border-blue-500 bg-white dark:bg-slate-800 shadow-xs ring-1 ring-blue-500'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-100/60 dark:bg-slate-800/40 text-slate-600 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-500" /> V1 Fast
                </span>
                <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">RegEx</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">
                Deterministic algorithmic extraction with zero AI latency.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setPromptVersion('v2')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                promptVersion === 'v2'
                  ? 'border-blue-500 bg-white dark:bg-slate-800 shadow-xs ring-1 ring-blue-500'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-100/60 dark:bg-slate-800/40 text-slate-600 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-blue-500" /> V2 Semantic
                </span>
                <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">Taxonomy</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">
                Multi-domain skill classification and experience parsing.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setPromptVersion('v3')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                promptVersion === 'v3'
                  ? 'border-violet-500 bg-white dark:bg-slate-800 shadow-xs ring-1 ring-violet-500'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-100/60 dark:bg-slate-800/40 text-slate-600 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-violet-500" /> V3 Executive
                </span>
                <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300">STAR Prep</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">
                STAR achievement formatting with strategic leadership highlights.
              </p>
            </button>
          </div>
        </div>
      )}
      
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-amber-50 rounded-xl flex items-center gap-3 text-amber-700 text-sm"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </motion.div>
      )}
    </div>
  );
};
