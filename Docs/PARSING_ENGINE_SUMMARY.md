# Ascend ATS Parsing & Ingestion Engine Architecture (DeepSeek Refinement Guide)

## Overview
This document summarizes all parsing, ingestion, and normalization engines in Ascend ATS to assist with DeepSeek LLM prompt engineering and dev token optimization.

---

### 1. Dice Email & Alert Parser (`src/utils/diceEmailParser.ts`)
- **Input**: Raw unstructured HTML/text email alerts from Dice.
- **Extraction**: Job title, company name, location, salary range, and description body.
- **Optimization Strategy**: Local regex strips greeting headers and tracking tokens prior to LLM analysis.

### 2. Mass Outreach & CSV Parser (`src/utils/massOutreachParser.ts`)
- **Input**: Bulk CSV exports (LinkedIn, Apple/Google contacts, recruiter leads).
- **Extraction**: Contact names, emails, phones, roles, and company associations.
- **Optimization Strategy**: RFC 4180 CSV parser runs deterministically in TypeScript; LLM is only utilized if semantic role classification is ambiguous.

### 3. JSON Resume & Persona Parser (`src/utils/jsonProfileParser.ts`)
- **Input**: Structured resume JSON and user personas.
- **Extraction**: Skills, experience entries, target locations, and salary bounds.
- **Optimization Strategy**: Pure deterministic TypeScript schema mapping (0 LLM tokens).

### 4. PDF Resume & Document Parser (`src/utils/pdfParser.ts`)
- **Input**: Uploaded PDF resumes and job descriptions.
- **Extraction**: Clean plain text and layout metadata.
- **Optimization Strategy**: Text sanitization and truncation to 2,500 tokens max before semantic extraction.

### 5. Dice Boilerplate Scrubber (`src/utils/diceBoilerplateScrubber.ts`)
- **Input**: Ingested job postings with Dice footer disclaimers.
- **Extraction**: Clean company name, department, address lines, phone numbers, and official website.
- **Optimization Strategy**: Regex heuristic blocklist filters out unsubscribe notices and privacy footers locally, saving ~60% input tokens.
