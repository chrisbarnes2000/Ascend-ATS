# ROADMAP: Candidate Profile Marketing & CRUD

**Current Issue:** Candidate profiles currently lack complete CRUD (read/update/delete) interfaces on the job seeker side beyond the initial wizard, and there is no secure, isolated public view for employers to preview or share candidates. Additionally, it lacks a comprehensive privacy engine to support blended vetting, redacted views, and extensive company/industry exclusions.

## Phase 1: Debt Reduction & Foundation
- [x] Task 1.1 – Extract reusable profile form components from `/src/pages/ProfileWizard.tsx` to `/src/components/profile/` to avoid duplication.
- [x] Task 1.2 – Update `/src/types/index.ts` to include sharing metadata (e.g., `isPublic`, `shareToken`, `slug`) and complex privacy/exclusion controls on `JobSeekerProfile`.
**Validation:** `tsc --noEmit` and successful linter execution.

## Phase 2: Complete Candidate Profile CRUD & Privacy Engine
- [x] Task 2.1 – Create `/src/pages/ProfileEditor.tsx` for updating and deleting profile sections (Experience, Education, Skills).
- [x] Task 2.2 – Create `/src/components/profile/PrivacyControls.tsx` to allow job seekers to set granular industry/company exclusions and data redaction preferences.
**Validation:** Edit flows correctly mutate Firestore data and privacy preferences are securely saved.

## Phase 3: Blended Sourcing Engine & Public Preview
- [x] Task 3.1 – Set up Express `/api/search/candidates` in `/server.ts` to securely evaluate candidate exclusion rules, vetting status, and redaction flags before serving profiles to employers/recruiters.
- [x] Task 3.2 – Update `firestore.rules` to strictly deny direct reads to candidate profiles except through authorized Cloud Functions/Express APIs or direct owner access.
- [x] Task 3.3 – Create `/src/pages/PublicProfile.tsx` (using `shareToken` or `uid` based routing) to display a read-only, polished, socially-shareable (LinkedIn/Reddit style) view. Redact PII based on the requester's authentication tier.
**Validation:** Accessing the API/public link securely omits excluded companies/individuals and applies correct redactions.

## Phase 4: Polish & Employer Sourcing UI
- [x] Task 4.1 – Create the Employer/Recruiter sourcing dash (`/src/pages/EmployerSourcing.tsx`) that interacts with the safe API.
- [x] Task 4.2 – Ensure error boundaries and aesthetic placeholders for redacted/hidden data.
**Validation:** Clean UI rendering and robust, leak-proof API limits.

**Expected Total:** ~700 lines across ~7 files.
**Documentation Impact:** `CHANGELOG.md`, `INDEX_ROADMAP.md`, `firestore.rules`.
