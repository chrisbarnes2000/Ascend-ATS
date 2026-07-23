# Dual Pipeline Resume Parsing

## Objective
Implement an algorithmic resume parsing engine as the primary core, with an Opt-In AI pipeline for users who explicitly enable it. This guarantees accessibility and robust tracking without forcing AI down the user's throat.

## Changes
- **`src/components/ResumeUpload.tsx`**: Add an opt-in toggle (Opt-In AI Assist) bound to a `useAI` state.
- **`server.ts`**: Expand `/api/parse-resume` to read the `useAI` flag.
  - Core pipeline uses RegEx and algorithmic extraction. 
  - AI pipeline uses `@google/genai` to extract structured JSON (only if requested and available).

## Status: COMPLETED.
Implemented via Approach A (Dual Pipeline) as requested by user.
