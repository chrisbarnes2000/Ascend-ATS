import React, { useState, useRef } from 'react';
import { Upload, FileCode, Check, AlertCircle, Loader2 } from 'lucide-react';
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
          
          // Basic validation to check if it's our structure
          if (!parsed.personal_info && !parsed.professional_identity && !parsed.work_experience) {
            throw new Error('JSON structure does not appear to match a professional profile schema.');
          }

          const mappedProfile = parseJsonProfile(parsed);
          setSuccess(`Successfully parsed profile for ${parsed.personal_info?.name || 'Candidate'}!`);
          
          setTimeout(() => {
            onParsed(mappedProfile);
          }, 1000);
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
    <div className="w-full">
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
              <div className="text-xs text-slate-400 dark:text-slate-500 max-w-xs leading-relaxed">
                Supports technical, community care, and working style preferences.
              </div>
            </>
          )}
        </div>
      </div>
      
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-400 text-sm"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </motion.div>
      )}
    </div>
  );
};
