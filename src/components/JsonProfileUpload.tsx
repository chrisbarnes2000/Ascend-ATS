import React, { useState, useRef } from 'react';
import { 
  FileCode, 
  Check, 
  AlertCircle, 
  Loader2, 
  Download, 
  Sparkles, 
  UserCircle, 
  Users, 
  FileText,
  ExternalLink
} from 'lucide-react';
import { motion } from 'motion/react';
import { parseJsonProfile } from '../utils/jsonProfileParser';

interface JsonProfileUploadProps {
  onParsed: (data: any) => void;
}

export const JsonProfileUpload = ({ onParsed }: JsonProfileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;

    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      setError('Please upload a valid .json file.');
      setSuccess(null);
      return;
    }

    setIsParsing(true);
    setError(null);
    setSuccess(null);

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const parsed = JSON.parse(content);
          
          // Multi-format validation
          const isAdvanced = Boolean(parsed.persona);
          const isSimplified = Boolean(parsed.contact && (parsed.summary || parsed.work_experience || parsed.skills));
          const isRecruiter = Boolean(parsed.recruiter_info || parsed.organization);
          const isLegacy = Boolean(parsed.personal_info || parsed.professional_identity || parsed.work_experience);

          if (!isAdvanced && !isSimplified && !isRecruiter && !isLegacy) {
            throw new Error('JSON structure does not match a supported Ascend profile schema (Simplified Resume, Advanced Persona, Recruiter Profile, or Legacy Profile).');
          }

          const mappedProfile = parseJsonProfile(parsed);
          
          const profileName = 
            parsed.contact?.name || 
            parsed.persona?.identity?.name || 
            (parsed.recruiter_info ? `${parsed.recruiter_info.first_name} ${parsed.recruiter_info.last_name}` : null) ||
            parsed.personal_info?.name || 
            'Candidate';

          setSuccess(`Successfully parsed profile for ${profileName}!`);
          
          setTimeout(() => {
            onParsed(mappedProfile);
          }, 800);
        } catch (err: any) {
          setError(err.message || 'Failed to parse JSON. Please make sure it is valid JSON syntax.');
          setSuccess(null);
        } finally {
          setIsParsing(false);
        }
      };
      reader.readAsText(file);
    } catch (err) {
      setError('Failed to read file.');
      setSuccess(null);
      setIsParsing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  return (
    <div className="w-full space-y-8">
      {/* Upload Dropzone */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative group border-2 border-dashed rounded-3xl p-10 text-center transition-all cursor-pointer ${
          isDragging 
            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-400' 
            : isParsing
              ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/10'
        }`}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileInputChange}
          accept=".json,application/json"
          className="hidden" 
        />
        
        <div className="flex flex-col items-center">
          {isParsing ? (
            <>
              <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
              <h3 className="text-xl font-bold mb-1">Processing Profile JSON...</h3>
              <p className="text-slate-500 text-sm">Structuring your data, experience, and custom preferences.</p>
            </>
          ) : success ? (
            <>
              <div className="bg-emerald-100 dark:bg-emerald-900/30 p-4 rounded-2xl text-emerald-600 dark:text-emerald-400 mb-4 animate-bounce">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">Import Successful!</h3>
              <p className="text-slate-500 text-sm">{success}</p>
            </>
          ) : (
            <>
              <div className="bg-emerald-100 dark:bg-emerald-900/30 p-4 rounded-2xl text-emerald-600 dark:text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                <FileCode className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-1">Upload Profile JSON</h3>
              <p className="text-slate-500 text-sm mb-4">Drag and drop your .json file, or click to browse</p>
              <div className="text-xs text-slate-400 dark:text-slate-500 max-w-sm leading-relaxed">
                Accepts <span className="font-semibold text-slate-600 dark:text-slate-300">Simplified Resume</span>, <span className="font-semibold text-slate-600 dark:text-slate-300">Advanced Persona</span>, and <span className="font-semibold text-slate-600 dark:text-slate-300">Recruiter Profile</span> JSON schemas.
              </div>
            </>
          )}
        </div>
      </div>
      
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-center gap-3 text-red-700 dark:text-red-400 text-sm"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </motion.div>
      )}

      {/* Downloadable Templates Section */}
      <div className="p-6 bg-slate-50 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Download Official JSON Templates
            </h4>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            Schema Version 2026.10.04
          </span>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
          Download a pre-structured template, populate your personal details, and upload the file above for instant automated profiling.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Template 1: Simplified */}
          <a
            href="/templates/resume-simplified-template.json"
            download="resume-simplified-template.json"
            className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-md transition-all flex flex-col justify-between group focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 px-2 py-0.5 rounded-md">
                  Standard
                </span>
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                Simplified Resume
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                Standard resume structure with work history, education, certifications, and skills.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 group-hover:gap-2 transition-all">
              <Download className="w-3.5 h-3.5" /> Download JSON
            </div>
          </a>

          {/* Template 2: Advanced Persona */}
          <a
            href="/templates/resume-advanced-persona-template.json"
            download="resume-advanced-persona-template.json"
            className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-500 hover:shadow-md transition-all flex flex-col justify-between group focus-visible:ring-2 focus-visible:ring-purple-500"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/80 px-2 py-0.5 rounded-md">
                  Executive
                </span>
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                Advanced Portfolio Persona
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                Deep career topology, founder ventures, cognitive attribution, and ADA accommodations.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px] font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5 group-hover:gap-2 transition-all">
              <Download className="w-3.5 h-3.5" /> Download JSON
            </div>
          </a>

          {/* Template 3: Recruiter Profile */}
          <a
            href="/templates/recruiter-profile-template.json"
            download="recruiter-profile-template.json"
            className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md transition-all flex flex-col justify-between group focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded-md">
                  Recruiter
                </span>
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                Recruiter Profile
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                Sourcing specialties, verified org details, candidate SLAs, and talent philosophy.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 group-hover:gap-2 transition-all">
              <Download className="w-3.5 h-3.5" /> Download JSON
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};
