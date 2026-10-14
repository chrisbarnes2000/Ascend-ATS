# Ascend ATS Parsing & Ingestion Engine Architecture
**Target Audience**: DeepSeek LLM Refinement & Token Optimization  
**System Version**: v0.5.28

---

## Executive Summary
The Ascend ATS ingestion pipeline processes multi-source data (Dice emails, bulk CSV exports, PDF resumes, PDF job descriptions, and raw job postings) into strongly typed, sanitized Firestore records. To optimize token consumption when refining or migrating parsers to DeepSeek, this document catalogs all parser modules, their regex patterns, normalization heuristics, fallback strategies, and token bounds.

---

## 1. Dice Email Parser (`src/utils/diceEmailParser.ts`)
- **Purpose**: Parses incoming unstructured Dice job alert emails and candidate notifications into structured job requisitions.
- **Key Regex & Heuristics**:
  - **Company & Title Extraction**: Identifies headings using line boundaries, "At [Company]", or "Company:" prefixes.
  - **Location Detection**: Matches city/state patterns (`[A-Za-z\s]+,\s+[A-Z]{2}`).
  - **Salary Extractor**: Normalizes `$Xk - $Yk`, hourly rates (`$X/hr`), and annual bounds.
  - **Boilerplate Scrubber**: Removes Dice private email notices ("WHY DOES THE SENDER'S EMAIL ADDRESS LOOK SO STRANGE?"), unsubscribe links, and privacy footers.
- **Token Efficiency Target**: ~450 tokens per email payload.

## 2. Mass Outreach & CSV Parser (`src/utils/massOutreachParser.ts`)
- **Purpose**: Parses bulk CSV exports (LinkedIn connections, Apple/Google contacts, recruiter lists) into candidate and lead records.
- **Key Regex & Heuristics**:
  - **RFC 4180 CSV Line Parser**: Handles quoted fields with embedded commas and newlines without breaking on rogue quotes.
  - **Classification Rules**: Deterministically partitions contacts into Candidates, Hiring Managers, and Recruiting Agencies based on keyword matching (`recruiter`, `talent`, `engineer`, `director`).
  - **Deduplication**: Generates deterministic lead IDs (`email.toLowerCase().replace(/[^a-z0-9]/g, '_')`) to prevent duplicate database nodes.
- **Token Efficiency Target**: Batch processing via deterministic regex before any LLM semantic classification.

## 3. JSON Resume & Persona Parser (`src/utils/jsonProfileParser.ts`)
- **Purpose**: Validates and normalizes structured resume payloads and user persona imports.
- **Key Heuristics**:
  - **Schema Validation**: Enforces strict TypeScript interfaces (`JobSeekerProfile`, `ProfileSkill`).
  - **Salary & Location Bounds**: Normalizes target locations (max 5 ceiling) and salary ranges.
- **Token Efficiency Target**: Direct deterministic schema mapping (0 LLM tokens required).

## 4. PDF Resume & Document Parser (`src/utils/pdfParser.ts`)
- **Purpose**: Extracts text and metadata from uploaded PDF resumes and job descriptions.
- **Key Heuristics**:
  - **Placeholder Detection**: Rejects placeholder titles or empty documents.
  - **Text Sanitization**: Strips control characters and normalizes whitespace.
- **Token Efficiency Target**: Sanitized plain text truncation to 2,500 tokens max.

## 5. Dice Boilerplate Scrubber (`src/utils/diceBoilerplateScrubber.ts`)
- **Purpose**: Cleans ingested job postings containing Dice footer boilerplate and extracts official company entities, department headers, physical address lines, phone numbers, and official websites.
- **Key Regex & Heuristics**:
  - **Website Extractor**: `/(https?:\/\/(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z0-9-\.]+(?:\/[^\s]*)?)/i`
  - **Phone Extractor**: `/(?:\+?1[\s-]?)?(?:\(\d{3}\)|\d{3})[\s-]*-?[\s-]*\d{3}[\s-]*-?[\s-]*\d{4}/g`
  - **Footer Blocklist**: Strips unsubscribe notices, privacy guarantees, and app download prompts.
- **Token Efficiency Target**: ~200 tokens per scrubber invocation.

---

## Token Optimization Recommendations for DeepSeek
1. **Deterministic Pre-Filtering**: Always run `cleanDiceBoilerplate` and CSV regex parsers locally in TypeScript *before* sending payloads to DeepSeek. This eliminates 60% of boilerplate tokens (disclaimers, footers, tracking links).
2. **Chunked Payload Batches**: When batching CSV or email parsing through DeepSeek, chunk records into batches of 10 with a maximum token ceiling of 3,000 tokens per API call.
3. **Strict JSON Schema Prompting**: Provide DeepSeek with compact TypeScript interface definitions instead of natural language instructions to guarantee parseable JSON responses on the first attempt.
