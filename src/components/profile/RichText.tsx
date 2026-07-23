import React from 'react';

interface RichTextProps {
  text?: string;
  className?: string;
}

export function RichText({ text = '', className = '' }: RichTextProps) {
  if (!text) return null;

  // Split content by newlines
  const lines = text.split('\n');
  const renderedElements: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];

  const parseInlineStyles = (content: string): React.ReactNode[] => {
    const tokens: React.ReactNode[] = [];
    let i = 0;
    let temp = '';

    while (i < content.length) {
      if (content.startsWith('**', i)) {
        if (temp) { tokens.push(temp); temp = ''; }
        const endIdx = content.indexOf('**', i + 2);
        if (endIdx !== -1) {
          tokens.push(<strong key={i} className="font-bold text-slate-900 dark:text-slate-100">{content.slice(i + 2, endIdx)}</strong>);
          i = endIdx + 2;
        } else {
          temp += '**';
          i += 2;
        }
      } else if (content.startsWith('*', i)) {
        if (temp) { tokens.push(temp); temp = ''; }
        const endIdx = content.indexOf('*', i + 1);
        if (endIdx !== -1) {
          tokens.push(<em key={i} className="italic text-slate-800 dark:text-slate-200">{content.slice(i + 1, endIdx)}</em>);
          i = endIdx + 1;
        } else {
          temp += '*';
          i += 1;
        }
      } else if (content.startsWith('`', i)) {
        if (temp) { tokens.push(temp); temp = ''; }
        const endIdx = content.indexOf('`', i + 1);
        if (endIdx !== -1) {
          tokens.push(<code key={i} className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-rose-500">{content.slice(i + 1, endIdx)}</code>);
          i = endIdx + 1;
        } else {
          temp += '`';
          i += 1;
        }
      } else {
        temp += content[i];
        i++;
      }
    }
    if (temp) {
      tokens.push(temp);
    }
    return tokens;
  };

  const flushList = (key: string | number) => {
    if (currentList.length > 0) {
      renderedElements.push(
        <ul key={`list-${key}`} className="list-disc pl-5 my-2 space-y-1.5 text-slate-600 dark:text-slate-400">
          {currentList}
        </ul>
      );
      currentList = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    const isBullet = trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ');
    
    if (isBullet) {
      const content = trimmed.substring(2);
      currentList.push(
        <li key={index} className="leading-relaxed">
          {parseInlineStyles(content)}
        </li>
      );
    } else {
      flushList(index);
      if (trimmed === '') {
        renderedElements.push(<div key={`br-${index}`} className="h-2.5" />);
      } else {
        renderedElements.push(
          <p key={index} className="leading-relaxed mb-2 text-slate-600 dark:text-slate-400">
            {parseInlineStyles(line)}
          </p>
        );
      }
    }
  });

  // Flush any remaining list
  flushList('final');

  return <div className={`text-sm sm:text-base space-y-1 ${className}`}>{renderedElements}</div>;
}
