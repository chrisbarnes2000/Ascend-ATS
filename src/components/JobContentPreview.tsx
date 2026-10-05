import React, { useState } from 'react';
import { 
  Sparkles, FileText, AlignLeft, Copy, Check, Layers, Code, Hash, Minus,
  Briefcase, CheckCircle2, DollarSign, Target, List, Info, Quote
} from 'lucide-react';
import { STATIC_CONFIG } from '../config';

export type JobPreviewMode = 'rich' | 'markdown' | 'raw';

interface JobContentPreviewProps {
  content: string;
  title?: string;
  mode?: JobPreviewMode;
  onModeChange?: (mode: JobPreviewMode) => void;
  showToolbar?: boolean;
  className?: string;
  defaultMode?: JobPreviewMode;
  asParagraph?: boolean;
}

/**
 * Strips all markdown syntax to produce 100% clean, unformatted raw text.
 * NASA JPL Rule 2 & 4: Bound iteration and compact logic.
 */
export function stripMarkdownFormatting(rawText: string): string {
  if (!rawText || typeof rawText !== 'string') return '';

  let text = rawText;

  // 1. Remove markdown headers (#, ##, ###, ####)
  text = text.replace(/^#{1,6}\s+/gm, '');

  // 2. Remove bold and italic markers (**word**, *word*, __word__, _word_)
  text = text.replace(/(\*\*|__)(.*?)\1/g, '$2');
  text = text.replace(/(\*|_)(.*?)\1/g, '$2');

  // 3. Remove inline code backticks and code blocks
  text = text.replace(/```[\s\S]*?```/g, (match) => {
    return match.replace(/```[a-zA-Z]*\n?/g, '').replace(/```/g, '');
  });
  text = text.replace(/`([^`]+)`/g, '$1');

  // 4. Convert markdown links [text](url) to text (url)
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');

  // 5. Clean blockquotes
  text = text.replace(/^>\s+/gm, '');

  // 6. Clean bullet prefixes (* , - , + ) to clean uniform bullet marker
  text = text.replace(/^[\*\-\+]\s+/gm, '• ');

  // 7. Normalize excessive line breaks
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
}

/**
 * Parses inline formatting (bold, code chips) defensively into valid phrasing React nodes.
 */
export function renderInlinePhrasing(inlineStr: string): React.ReactNode {
  if (!inlineStr) return null;

  // Split on bold (**text**) and code (`text`)
  const parts = inlineStr.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldText = part.slice(2, -2);
      return (
        <strong key={index} className="font-bold text-slate-900 dark:text-slate-100">
          {boldText}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      const codeText = part.slice(1, -1);
      return (
        <code 
          key={index} 
          className="px-1.5 py-0.5 text-xs font-mono rounded bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200/80 dark:border-slate-700 mx-0.5"
        >
          {codeText}
        </code>
      );
    }
    return part;
  });
}

/**
 * Maps section titles to Lucide icons for Rich Text enhancement.
 */
function getSectionIcon(title: string): React.ReactNode {
  const t = title.toLowerCase();
  if (t.includes('requirement') || t.includes('qualification')) return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
  if (t.includes('about') || t.includes('description') || t.includes('purpose')) return <Briefcase className="w-4 h-4 text-indigo-500" />;
  if (t.includes('salary') || t.includes('compensation') || t.includes('pay') || t.includes('benefit')) return <DollarSign className="w-4 h-4 text-emerald-600" />;
  if (t.includes('responsibility') || t.includes('duty') || t.includes('role')) return <Target className="w-4 h-4 text-purple-500" />;
  if (t.includes('skill')) return <Sparkles className="w-4 h-4 text-amber-500" />;
  return <Layers className="w-4 h-4 text-indigo-500" />;
}

/**
 * Rich Text & Enhanced Markdown Preview Component
 * Compliant with WCAG 2.1/2.2 AA and NASA JPL Power of 10 rules.
 */
export const JobContentPreview: React.FC<JobContentPreviewProps> = ({
  content,
  title,
  mode: controlledMode,
  onModeChange,
  showToolbar = false,
  className = '',
  defaultMode = 'rich',
  asParagraph = true,
}) => {
  const [internalMode, setInternalMode] = useState<JobPreviewMode>(defaultMode);
  const [copied, setCopied] = useState(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);

  const activeMode = controlledMode !== undefined ? controlledMode : internalMode;

  const handleModeSelect = (newMode: JobPreviewMode) => {
    if (onModeChange) {
      onModeChange(newMode);
    } else {
      setInternalMode(newMode);
    }
  };

  const handleCopyRaw = async () => {
    try {
      const cleanText = stripMarkdownFormatting(content);
      await navigator.clipboard.writeText(cleanText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMarkdown(true);
      setTimeout(() => setCopiedMarkdown(false), 2000);
    } catch (err) {
      console.error('Failed to copy markdown:', err);
    }
  };

  // Safe line-by-line parsing bounded to STATIC_CONFIG.SAFETY_LIMITS.MAX_ITERATION_CEILING
  const maxLines = STATIC_CONFIG?.SAFETY_LIMITS?.MAX_ITERATION_CEILING || 1000;
  const rawLines = (content || '').split('\n').slice(0, maxLines);

  // Group lines into structured sections for Rich Text mode
  const renderRichSections = () => {
    if (!content || !content.trim()) {
      return (
        <span className="block py-16 text-center text-slate-400 italic text-sm bg-slate-50/30 dark:bg-slate-900/10 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
          No description content provided.
        </span>
      );
    }

    const elements: React.ReactNode[] = [];
    let currentBulletList: string[] = [];
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];

    const flushCodeBlock = (keyPrefix: string) => {
      if (codeBlockContent.length > 0) {
        elements.push(
          <span key={`${keyPrefix}-code`} className="block my-6 rounded-2xl bg-slate-950 p-6 border border-slate-800 font-mono text-[13px] text-indigo-200/90 overflow-x-auto shadow-xl relative group/code">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800/50">
              <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                <Code className="w-3.5 h-3.5" /> Syntax Preview
              </span>
              <button 
                onClick={() => navigator.clipboard.writeText(codeBlockContent.join('\n'))}
                className="opacity-0 group-hover/code:opacity-100 p-1.5 hover:bg-slate-800 rounded-md transition-all text-slate-500 hover:text-white"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
            {codeBlockContent.join('\n')}
          </span>
        );
        codeBlockContent = [];
      }
    };

    const flushBulletList = (keyPrefix: string) => {
      if (currentBulletList.length > 0) {
        elements.push(
          <span key={`${keyPrefix}-list`} className="block my-5 space-y-3.5 pl-1">
            {currentBulletList.map((item, idx) => (
              <span key={`${keyPrefix}-item-${idx}`} className="flex items-start gap-3.5 text-slate-700 dark:text-slate-300 text-[14px] leading-relaxed group">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 shrink-0 group-hover:scale-125 transition-transform shadow-[0_0_8px_rgba(99,102,241,0.4)]" aria-hidden="true" />
                <span className="flex-1">{renderInlinePhrasing(item)}</span>
              </span>
            ))}
          </span>
        );
        currentBulletList = [];
      }
    };

    for (let i = 0; i < rawLines.length && i < maxLines; i++) {
      const line = rawLines[i].trim();

      // Handle Code Blocks
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          flushCodeBlock(`cb-${i}`);
          inCodeBlock = false;
        } else {
          flushBulletList(`pre-cb-${i}`);
          inCodeBlock = true;
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockContent.push(rawLines[i]);
        continue;
      }

      // Handle Horizontal Rules
      if (line === '---' || line === '***' || line === '___') {
        flushBulletList(`hr-${i}`);
        elements.push(
          <div key={`hr-${i}`} className="flex items-center gap-4 my-8">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent" />
            <div className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent" />
          </div>
        );
        continue;
      }

      // Check for markdown headings (#, ##, ###, ####)
      const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
      if (headingMatch) {
        flushBulletList(`heading-${i}`);
        const level = headingMatch[1].length;
        const headingText = headingMatch[2].trim();

        if (level === 1 || level === 2) {
          elements.push(
            <span key={`h-${i}`} className="block mt-10 mb-5 pb-3 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
                <span className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                  {getSectionIcon(headingText)}
                </span>
                <span>{headingText}</span>
              </span>
            </span>
          );
        } else {
          elements.push(
            <span key={`h-${i}`} className="block mt-8 mb-3.5 text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 flex items-center gap-3">
              <span className="w-8 h-px bg-indigo-100 dark:bg-indigo-900/50" />
              <span>{headingText}</span>
            </span>
          );
        }
        continue;
      }

      // Check for bullet items (*, -, •, +)
      const bulletMatch = line.match(/^[\*\-\•\+]\s+(.+)$/);
      if (bulletMatch) {
        currentBulletList.push(bulletMatch[1]);
        continue;
      }

      // Check for numbered items (1. , 2. )
      const numberMatch = line.match(/^(\d+)\.\s+(.+)$/);
      if (numberMatch) {
        flushBulletList(`num-${i}`);
        const num = numberMatch[1];
        const numText = numberMatch[2];
        elements.push(
          <span key={`num-${i}`} className="flex items-start gap-4 my-3 text-slate-700 dark:text-slate-300 text-sm leading-relaxed group">
            <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-black text-[10px] shrink-0 mt-0.5 border border-indigo-200/50 dark:border-indigo-900/50 shadow-sm group-hover:scale-110 transition-transform">
              {num}
            </span>
            <span className="flex-1">{renderInlinePhrasing(numText)}</span>
          </span>
        );
        continue;
      }

      // Check for blockquotes (> text)
      if (line.startsWith('>')) {
        flushBulletList(`quote-${i}`);
        const quoteText = line.replace(/^>\s*/, '');
        elements.push(
          <span 
            key={`quote-${i}`} 
            className="block my-4 pl-4 py-3 border-l-4 border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 text-slate-600 dark:text-slate-300 text-sm italic rounded-r-2xl shadow-sm"
          >
            <Quote className="w-4 h-4 text-indigo-400 mb-1 opacity-50" />
            {renderInlinePhrasing(quoteText)}
          </span>
        );
        continue;
      }

      // Blank line flush
      if (!line) {
        flushBulletList(`blank-${i}`);
        continue;
      }

      // Standard paragraph line
      flushBulletList(`p-${i}`);
      elements.push(
        <span key={`p-${i}`} className="block my-3 text-slate-700 dark:text-slate-300 text-sm leading-relaxed first:mt-0">
          {renderInlinePhrasing(line)}
        </span>
      );
    }

    // Final flush
    flushBulletList('end');
    flushCodeBlock('end');
    return elements;
  };

  // Enhanced Markdown mode: Document-like feel with code editor styling
  const renderMarkdownMode = () => {
    return (
      <span className="block relative group">
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
            MD Source
          </span>
          <button
            onClick={handleCopyMarkdown}
            className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-indigo-600 hover:border-indigo-500/50 transition-all opacity-0 group-hover:opacity-100 shadow-sm z-10"
            title="Copy Markdown Source"
          >
            {copiedMarkdown ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <span className="block p-8 rounded-3xl bg-slate-950 border border-slate-800 font-mono text-[13px] leading-relaxed text-indigo-100/90 whitespace-pre-wrap select-all shadow-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
          {content}
        </span>
      </span>
    );
  };

  // Raw Text mode: 100% unformatted pure plain text with zero markdown syntax
  const renderRawMode = () => {
    const rawClean = stripMarkdownFormatting(content);
    return (
      <span className="block group relative">
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
            Plain Text
          </span>
          <button
            onClick={handleCopyRaw}
            className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-indigo-600 hover:border-indigo-500/50 transition-all opacity-0 group-hover:opacity-100 shadow-sm z-10"
            title="Copy Clean Text"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <span className="block font-mono text-slate-800 dark:text-slate-200 text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap select-text p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 shadow-inner">
          <span className="flex items-center gap-2 mb-6 pb-2 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <AlignLeft className="w-3.5 h-3.5" /> Pure Ground Truth (Unformatted)
          </span>
          {rawClean || content}
        </span>
      </span>
    );
  };

  const contentNode = (
    <span className="block transition-all duration-300 ease-in-out">
      {activeMode === 'rich' && renderRichSections()}
      {activeMode === 'markdown' && renderMarkdownMode()}
      {activeMode === 'raw' && renderRawMode()}
    </span>
  );

  if (asParagraph) {
    return (
      <p 
        className={`text-slate-700 dark:text-slate-300 leading-relaxed ${className}`}
        role="region"
        aria-label={`${title || 'Job content'} ${activeMode} preview`}
      >
        {contentNode}
      </p>
    );
  }

  return (
    <div className={`job-content-preview-container ${className}`}>
      {showToolbar && (
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200/80 dark:border-slate-800">
          {title && (
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
              <Layers className="w-5 h-5 text-indigo-500" />
              {title}
            </h3>
          )}

          <div 
            role="tablist" 
            aria-label="Job description view formatting options" 
            className="inline-flex items-center p-1.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-[11px]"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeMode === 'rich'}
              onClick={() => handleModeSelect('rich')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                activeMode === 'rich'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md transform scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              <span>RICH VIEW</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeMode === 'markdown'}
              onClick={() => handleModeSelect('markdown')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                activeMode === 'markdown'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md transform scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" aria-hidden="true" />
              <span>MARKDOWN</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeMode === 'raw'}
              onClick={() => handleModeSelect('raw')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                activeMode === 'raw'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md transform scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <AlignLeft className="w-4 h-4" aria-hidden="true" />
              <span>RAW TEXT</span>
            </button>
          </div>
        </div>
      )}

      <div 
        className="preview-viewport"
        role="region"
        aria-label={`${title || 'Job content'} ${activeMode} view`}
      >
        {contentNode}
      </div>
    </div>
  );
};
