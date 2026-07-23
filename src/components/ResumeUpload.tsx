import React, { useState } from 'react';
import { Upload, FileText, Check, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface ResumeParserProps {
  onParsed: (data: any) => void;
}

export const ResumeUpload = ({ onParsed }: ResumeParserProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useAI, setUseAI] = useState(false);

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
      // For simplicity in this demo, we read text directly or convert file to text
      // In a production app, we'd send the file to a cloud bucket and use Document AI
      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target?.result as string;
        
        const response = await fetch('/api/parse-resume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileContent: text.substring(0, 5000), // Send a snippet for parsing
            useAI
          })
        });

        if (!response.ok) throw new Error('Parsing failed');
        const data = await response.json();
        const fileUrl = URL.createObjectURL(file);
        onParsed({ ...data, resumePreviewUrl: fileUrl });
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
              <p className="text-slate-500">Extracting your skills and experience.</p>
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
        <div className="mt-4 flex flex-col gap-3">
          <label htmlFor="optInAi" className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <input 
              type="checkbox" 
              id="optInAi" 
              checked={useAI} 
              onChange={(e) => setUseAI(e.target.checked)} 
              className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
            />
            <div className="text-sm font-medium text-slate-700 dark:text-slate-300 text-left">
              Use experimental AI parsing
              <div className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                Enhances extraction but involves generative analysis
              </div>
            </div>
          </label>
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
