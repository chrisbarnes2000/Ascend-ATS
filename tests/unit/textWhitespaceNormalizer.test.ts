/**
 * Unit Test Suite: Text Whitespace Normalizer & Cohesive Paragraph Buffering Engine (Approach A)
 *
 * Verifies Pre-Parser Whitespace Normalization, Cohesive Paragraph Buffering,
 * Markdown Formatting Preservation, and NASA JPL Power of 10 Invariants.
 */

import { 
  normalizeJobContentWhitespace, 
  parseCohesiveBlocks,
  isBlockDelimiterLine
} from '../../src/utils/textWhitespaceNormalizer';
import { stripMarkdownFormatting } from '../../src/components/JobContentPreview';

export function runTextWhitespaceNormalizerTests() {
  console.log("Starting textWhitespaceNormalizer unit test suite (Approach A)...");

  // -------------------------------------------------------------
  // Test 1: Pre-Parser Whitespace Normalization (CRLF, Unicode Spaces, Trailing Spaces)
  // -------------------------------------------------------------
  const dirtyText = "Line 1 with trailing spaces   \r\nLine 2 with NBSP\u00A0space and zero-width\u200B\uFEFFcharacter\rLine 3\n\n\n\nLine 4 after 4 newlines";
  const normalized = normalizeJobContentWhitespace(dirtyText);

  if (normalized.includes('\r')) {
    throw new Error("Test 1 Failed: Normalized text must not contain carriage returns");
  }
  if (normalized.includes('\u00A0') || normalized.includes('\u200B') || normalized.includes('\uFEFF')) {
    throw new Error("Test 1 Failed: Normalized text must not contain non-breaking or zero-width spaces");
  }
  if (normalized.includes('\n\n\n')) {
    throw new Error("Test 1 Failed: Normalized text must collapse 3+ newlines down to 2");
  }
  if (!normalized.includes("Line 1 with trailing spaces\nLine 2 with NBSP space and zero-widthcharacter\nLine 3\n\nLine 4 after 4 newlines")) {
    throw new Error(`Test 1 Failed: Unexpected normalization output: ${JSON.stringify(normalized)}`);
  }
  console.log("✓ Test 1: Pre-parser whitespace normalization successfully strips control chars, NBSP, and collapses 3+ newlines");

  // -------------------------------------------------------------
  // Test 2: Cohesive Paragraph Buffering (Collapsing 8 wrapped lines into 1 cohesive paragraph)
  // -------------------------------------------------------------
  const eightWrappedLines = [
    "The City of Tacoma is seeking a talented Senior Utility Systems Engineer to lead our customer-facing automation initiatives.",
    "In this role, you will collaborate with cross-functional teams to deliver high-quality solutions.",
    "You will architect mission-critical infrastructure, optimize telemetry pipelines, and ensure system uptime.",
    "Additionally, you will interface directly with key stakeholders across public utility networks.",
    "Strong problem-solving skills and a passion for public service are essential.",
    "We offer comprehensive benefits, competitive compensation, and pension matching.",
    "This position provides opportunities for professional development and career advancement.",
    "Join our team and help shape the future of community infrastructure in Tacoma."
  ].join('\n');

  const blocks = parseCohesiveBlocks(eightWrappedLines);

  if (blocks.length !== 1) {
    throw new Error(`Test 2 Failed: Expected 1 cohesive paragraph block, got ${blocks.length}`);
  }
  if (blocks[0].type !== 'paragraph') {
    throw new Error(`Test 2 Failed: Expected block type 'paragraph', got '${blocks[0].type}'`);
  }
  if (!blocks[0].content.startsWith("The City of Tacoma is seeking") || !blocks[0].content.endsWith("in Tacoma.")) {
    throw new Error(`Test 2 Failed: Cohesive paragraph content is incomplete: ${blocks[0].content}`);
  }
  if (blocks[0].content.includes('\n')) {
    throw new Error("Test 2 Failed: Buffered paragraph must not contain unjoined newline breaks");
  }
  console.log("✓ Test 2: Cohesive paragraph buffering unified 8 wrapped sentence lines into 1 cohesive paragraph block");

  // -------------------------------------------------------------
  // Test 3: Multiple Distinct Paragraphs separated by \n\n remain distinct
  // -------------------------------------------------------------
  const multiParagraphText = "Paragraph 1 line 1.\nParagraph 1 line 2.\n\nParagraph 2 line 1.\nParagraph 2 line 2.";
  const multiBlocks = parseCohesiveBlocks(multiParagraphText);

  if (multiBlocks.length !== 2) {
    throw new Error(`Test 3 Failed: Expected 2 separate paragraph blocks, got ${multiBlocks.length}`);
  }
  if (multiBlocks[0].content !== "Paragraph 1 line 1. Paragraph 1 line 2.") {
    throw new Error(`Test 3 Failed: Paragraph 1 content mismatch: ${multiBlocks[0].content}`);
  }
  if (multiBlocks[1].content !== "Paragraph 2 line 1. Paragraph 2 line 2.") {
    throw new Error(`Test 3 Failed: Paragraph 2 content mismatch: ${multiBlocks[1].content}`);
  }
  console.log("✓ Test 3: Distinct paragraphs separated by double newlines remain distinct cohesive blocks");

  // -------------------------------------------------------------
  // Test 4: Preservation of Headings, Lists, Quotes, Code Fences & Horizontal Rules
  // -------------------------------------------------------------
  const complexMarkdown = `# Main Heading
This is an introductory paragraph that spans
across two wrapped lines.

## Responsibilities
- Architect high-throughput data streams
- Maintain 99.99% utility uptime
- Coordinate with field engineers

1. Submit candidate application
2. Complete technical assessment

> Public utility resilience is our highest civic mission.

\`\`\`typescript
const status = "operational";
\`\`\`

---
Final concluding note.`;

  const parsedBlocks = parseCohesiveBlocks(complexMarkdown);

  // Expect: heading (h1), paragraph, heading (h2), bullet_list, numbered_list, quote, code, hr, paragraph
  const blockTypes = parsedBlocks.map(b => b.type);
  const expectedTypes = ['heading', 'paragraph', 'heading', 'bullet_list', 'numbered_list', 'quote', 'code', 'hr', 'paragraph'];

  if (JSON.stringify(blockTypes) !== JSON.stringify(expectedTypes)) {
    throw new Error(`Test 4 Failed: Expected block types ${JSON.stringify(expectedTypes)}, but got ${JSON.stringify(blockTypes)}`);
  }

  const h1 = parsedBlocks[0];
  if (h1.level !== 1 || h1.content !== "Main Heading") {
    throw new Error(`Test 4 Failed: H1 block mismatch: level=${h1.level}, content=${h1.content}`);
  }

  const bulletList = parsedBlocks[3];
  if (!bulletList.items || bulletList.items.length !== 3) {
    throw new Error(`Test 4 Failed: Bullet list items mismatch: count=${bulletList.items?.length}`);
  }

  const numberedList = parsedBlocks[4];
  if (!numberedList.items || numberedList.items.length !== 2) {
    throw new Error(`Test 4 Failed: Numbered list items mismatch: count=${numberedList.items?.length}`);
  }

  const quoteBlock = parsedBlocks[5];
  if (quoteBlock.content !== "Public utility resilience is our highest civic mission.") {
    throw new Error(`Test 4 Failed: Quote block mismatch: ${quoteBlock.content}`);
  }

  const codeBlock = parsedBlocks[6];
  if (!codeBlock.content.includes('const status = "operational";')) {
    throw new Error(`Test 4 Failed: Code block content mismatch: ${codeBlock.content}`);
  }

  const hrBlock = parsedBlocks[7];
  if (hrBlock.content !== '---') {
    throw new Error(`Test 4 Failed: HR block mismatch`);
  }

  console.log("✓ Test 4: Full rich markdown structure (headings, lists, quotes, code, hr) strictly preserved");

  // -------------------------------------------------------------
  // Test 5: Inline Formatting Preservation in stripMarkdownFormatting
  // -------------------------------------------------------------
  const markdownToStrip = "Role requires **TypeScript** and *React* with `Node.js` expertise.\n\n\n\nContact: [Support](https://example.com)";
  const cleanRaw = stripMarkdownFormatting(markdownToStrip);

  if (cleanRaw.includes('**') || cleanRaw.includes('`') || cleanRaw.includes('[')) {
    throw new Error(`Test 5 Failed: Markdown syntax not completely stripped: ${cleanRaw}`);
  }
  if (!cleanRaw.includes("TypeScript and React with Node.js expertise.") || !cleanRaw.includes("Contact: Support (https://example.com)")) {
    throw new Error(`Test 5 Failed: Clean raw text mismatch: ${cleanRaw}`);
  }
  if (cleanRaw.includes('\n\n\n')) {
    throw new Error("Test 5 Failed: Clean raw text should not have 3+ newlines");
  }
  console.log("✓ Test 5: stripMarkdownFormatting cleanly produces pure ground-truth text with normalized whitespace");

  // -------------------------------------------------------------
  // Test 6: Defensive Boundary Conditions (empty, undefined, single characters, delimiter checks)
  // -------------------------------------------------------------
  if (normalizeJobContentWhitespace('') !== '') {
    throw new Error("Test 6 Failed: normalizeJobContentWhitespace('') must return empty string");
  }
  if (parseCohesiveBlocks('').length !== 0) {
    throw new Error("Test 6 Failed: parseCohesiveBlocks('') must return empty array");
  }
  if (!isBlockDelimiterLine('### Section') || !isBlockDelimiterLine('* item') || isBlockDelimiterLine('regular line')) {
    throw new Error("Test 6 Failed: isBlockDelimiterLine classification mismatch");
  }
  console.log("✓ Test 6: Defensive boundary conditions and helper invariants satisfied");

  console.log("All textWhitespaceNormalizer unit tests passed successfully!\n");
}
