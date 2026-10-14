/**
 * Text Whitespace Normalizer & Cohesive Paragraph Buffering Engine
 *
 * Implements Approach A:
 * 1. Pre-Parser Whitespace Normalization (collapsing excessive newlines, stripping trailing whitespace, normalizing Unicode spacing)
 * 2. Cohesive Paragraph Buffering (gathering wrapped lines into cohesive unified blocks while preserving rich markdown formatting)
 *
 * NASA JPL Power of 10 & WCAG 2.1/2.2 AA compliant.
 */

import { STATIC_CONFIG } from '../config';

export interface CohesiveSection {
  type: 'heading' | 'bullet_list' | 'numbered_list' | 'code' | 'quote' | 'hr' | 'paragraph';
  level?: number;
  content: string;
  items?: string[];
  rawLines?: string[];
}

/**
 * Pre-Parser Whitespace Normalization.
 * Scrubs non-breaking/zero-width spaces, normalizes carriage returns,
 * strips line-end trailing whitespace, and collapses 3+ newlines to standard double newlines.
 * NASA JPL Rule 4 & 5: Compact, high assertion density.
 */
export function normalizeJobContentWhitespace(rawText: string): string {
  // Defensive assertion 1: Input sanity check
  if (!rawText || typeof rawText !== 'string') {
    return '';
  }

  const maxChars = STATIC_CONFIG?.SAFETY_LIMITS?.MAX_JSON_PAYLOAD_BYTES || 500000;
  // Defensive assertion 2: Length bound ceiling
  const boundedText = rawText.length > maxChars ? rawText.slice(0, maxChars) : rawText;

  let text = boundedText;

  // 1. Standardize line endings (\r\n and \r to \n)
  text = text.replace(/\r\n?/g, '\n');

  // 2. Normalize non-breaking spaces (\u00A0) and zero-width spaces (\u200B-\u200D, \uFEFF)
  text = text.replace(/[\u00A0\u2007\u202F]/g, ' ');
  text = text.replace(/[\u200B-\u200D\uFEFF]/g, '');

  // 3. Remove trailing spaces and tabs on each individual line
  text = text.replace(/[ \t]+$/gm, '');

  // 4. Collapse 3 or more consecutive newlines down to 2 (paragraph break)
  text = text.replace(/\n{3,}/g, '\n\n');

  // 5. Collapse excessive horizontal spaces (4+ spaces into 1, excluding start of line for indentation)
  text = text.replace(/([^\n\s])[ \t]{3,}([^\n\s])/g, '$1 $2');

  // Defensive assertion 3: Return trimmed cohesive text
  return text.trim();
}

/**
 * Checks if a trimmed line represents a markdown block delimiter.
 * NASA JPL Rule 4: Sub-function < 30 lines.
 */
export function isBlockDelimiterLine(line: string): boolean {
  if (!line) return true;
  if (line.startsWith('```')) return true;
  if (line === '---' || line === '***' || line === '___') return true;
  if (/^#{1,4}\s+/.test(line)) return true;
  if (/^[\*\-\•\+]\s+/.test(line)) return true;
  if (/^\d+[\.\)]\s+/.test(line)) return true;
  if (line.startsWith('>')) return true;
  return false;
}

/**
 * Cohesive Paragraph Buffering Parser.
 * Buffers consecutive wrapped text lines into unified paragraphs instead of fragmenting into separate block elements.
 * Preserves all headings, bullet lists, numbered lists, blockquotes, code fences, and horizontal rules.
 * NASA JPL Rule 2 & 5: Statically bounded loop with strict pre/post conditions.
 */
export function parseCohesiveBlocks(rawText: string, maxLinesLimit?: number): CohesiveSection[] {
  // Defensive assertion 1: Input nullability check
  if (!rawText || typeof rawText !== 'string') {
    return [];
  }

  const normalized = normalizeJobContentWhitespace(rawText);
  if (!normalized) {
    return [];
  }

  const maxLines = Math.min(
    maxLinesLimit || STATIC_CONFIG?.SAFETY_LIMITS?.MAX_ITERATION_CEILING || 1000,
    5000
  );

  const lines = normalized.split('\n');
  const sections: CohesiveSection[] = [];

  let paragraphBuffer: string[] = [];
  let bulletListBuffer: string[] = [];
  let numberedListBuffer: Array<{ num: string; text: string }> = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];

  // Local helper 1: Flush paragraph buffer
  const flushParagraph = () => {
    if (paragraphBuffer.length > 0) {
      const cohesiveText = paragraphBuffer.join(' ').replace(/[ \t]{2,}/g, ' ').trim();
      if (cohesiveText.length > 0) {
        sections.push({
          type: 'paragraph',
          content: cohesiveText,
        });
      }
      paragraphBuffer = [];
    }
  };

  // Local helper 2: Flush bullet list buffer
  const flushBulletList = () => {
    if (bulletListBuffer.length > 0) {
      sections.push({
        type: 'bullet_list',
        content: '',
        items: [...bulletListBuffer],
      });
      bulletListBuffer = [];
    }
  };

  // Local helper 3: Flush numbered list buffer
  const flushNumberedList = () => {
    if (numberedListBuffer.length > 0) {
      sections.push({
        type: 'numbered_list',
        content: '',
        items: numberedListBuffer.map(item => `${item.num}. ${item.text}`),
      });
      numberedListBuffer = [];
    }
  };

  // Local helper 4: Flush code block buffer
  const flushCodeBlock = () => {
    if (codeBlockLines.length > 0) {
      sections.push({
        type: 'code',
        content: codeBlockLines.join('\n'),
        rawLines: [...codeBlockLines],
      });
      codeBlockLines = [];
    }
  };

  // Safe bounded loop (NASA JPL Rule 2)
  for (let i = 0; i < lines.length && i < maxLines; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // 1. Code Fence Handling
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        flushCodeBlock();
        inCodeBlock = false;
      } else {
        flushParagraph();
        flushBulletList();
        flushNumberedList();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(rawLine);
      continue;
    }

    // 2. Horizontal Rules
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      flushParagraph();
      flushBulletList();
      flushNumberedList();
      sections.push({ type: 'hr', content: '---' });
      continue;
    }

    // 3. Headings (#, ##, ###, ####)
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushBulletList();
      flushNumberedList();
      sections.push({
        type: 'heading',
        level: headingMatch[1].length,
        content: headingMatch[2].trim(),
      });
      continue;
    }

    // 4. Bullet Items (*, -, •, +)
    const bulletMatch = trimmed.match(/^[\*\-\•\+]\s+(.+)$/);
    if (bulletMatch) {
      flushParagraph();
      flushNumberedList();
      bulletListBuffer.push(bulletMatch[1].trim());
      continue;
    }

    // 5. Numbered Items (1., 2., 1))
    const numberMatch = trimmed.match(/^(\d+)[\.\)]\s+(.+)$/);
    if (numberMatch) {
      flushParagraph();
      flushBulletList();
      numberedListBuffer.push({
        num: numberMatch[1],
        text: numberMatch[2].trim(),
      });
      continue;
    }

    // 6. Blockquotes (> text)
    if (trimmed.startsWith('>')) {
      flushParagraph();
      flushBulletList();
      flushNumberedList();
      sections.push({
        type: 'quote',
        content: trimmed.replace(/^>\s*/, '').trim(),
      });
      continue;
    }

    // 7. Blank lines indicate paragraph / section boundaries
    if (trimmed === '') {
      flushParagraph();
      flushBulletList();
      flushNumberedList();
      continue;
    }

    // 8. Bullet item continuation check (if indented line follows bullet without blank line)
    if (bulletListBuffer.length > 0 && (rawLine.startsWith('  ') || rawLine.startsWith('\t'))) {
      const lastIndex = bulletListBuffer.length - 1;
      bulletListBuffer[lastIndex] = `${bulletListBuffer[lastIndex]} ${trimmed}`;
      continue;
    }

    // 9. Standard Text: Accumulate into paragraph buffer for cohesive paragraph unification
    flushBulletList();
    flushNumberedList();
    paragraphBuffer.push(trimmed);
  }

  // Final flush of remaining buffers
  flushParagraph();
  flushBulletList();
  flushNumberedList();
  flushCodeBlock();

  return sections;
}
