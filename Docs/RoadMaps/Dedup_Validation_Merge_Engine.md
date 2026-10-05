# Deduplication, Validation, and Merge Engine Roadmap

**Status**: Implemented & Audited (100% Green Suite)  
**Milestone Version**: [0.5.27-dev.06]  
**Governance Framework**: ITIL v4 Service Transition & NASA JPL Power of 10 Safety Rules  
**Date**: 2026-10-04  

---

## 1. Overview & Problem Statement
In multi-actor Applicant Tracking Systems (Job Seekers, Recruiters, Company Owners, Administrators), data collisions and regressions occur when:
1. Email casing creates duplicate accounts across Google OAuth and Email/Password auth providers.
2. Users switch account types via `resetProfileSetup`, inadvertently abandoning or overwriting historic role documents (`/users/{uid}/profiles/{role}`).
3. Candidates re-ingest external job postings with variable query tracking parameters (`utm_*`, `ref`, trailing slashes), causing duplicate database records.
4. Candidates re-upload updated resumes, erasing custom privacy configurations, section ordering, phone/location overrides, or DEI accessibility preferences.
5. Requisition modifications subtly disadvantage candidates (bait-and-switch salary drops, title downgrades, remote-to-onsite shifts) without rigorous version control or auditable risk scores.

---

## 2. Implemented Subsystems & Architectural Pillars

### Pillar 1: Identity & Role Governance (`src/utils/identityGovernance.ts`)
- **Email Normalization**: Standardizes email addresses to trimmed lowercase, preventing casing duplicate collisions while preserving valid plus-addressing (`user+tag@domain.com`).
- **Role Switch Rate Limiting**: Throttles role switching to a maximum of 3 times per 24 hours per user, returning remaining budget or calculated retry cooldown.
- **Superseded Profile Archival**: Atomically clones the active profile sub-document to `users/{uid}/profiles/archived/{role}_{timestamp}` with `archivedAt` timestamps prior to role re-assignment.

### Pillar 2: Ingested Job Deduplication (`src/utils/jobDedup.ts`)
- **URL Canonicalization**: Strips `www.`, tracking parameters (`utm_source`, `ref`, `fbclid`, etc.), preserves recognized job identifiers (`jk`, `jobId`, `id`, `vjk`), and normalizes protocol and trailing slashes.
- **Source-Specific ID Extraction**: Compiles extractors for LinkedIn, Indeed, GovernmentJobs.com, Greenhouse, Lever, Ashby, and Workday.
- **Deterministic 16-Char Hex Hash**: Replaces non-deterministic `Date.now()` fallbacks with an FNV-1a hash of canonical URLs.
- **TTL Stale Evaluation**: Flags ingested jobs older than 90 days.

### Pillar 3: Profile Merge & State Preservation (`src/utils/profileMerge.ts`)
- **Override Preservation**: Retains user overrides on re-upload (privacy cloaking levels, custom phone/location/pronouns, section order, DEI accommodations, and target benefits).
- **Array Union Strategies**:
  - `skills`: Case-insensitive deduplication, metadata preservation, and experience leveling.
  - `work_experience`: Deduplicated and enriched by company and role matching.
  - `education`: Matched and enriched by institution and degree.

### Pillar 4: Requisition Material Shift Engine (`src/utils/materialShiftEngine.ts`)
- **Nefarious Risk Scoring**: Evaluates post-application salary drops (>5% max salary drop = +40 points / high severity, >10% min salary drop = +25 points), scope creep (>20% expansion), seniority title downgrades (+10 points / high severity), and workplace shifts (Remote ➔ On-site = +20 points / high severity).
- **Semantic Version Calculation**: Bumps Major (`v2.0.0`) for high-risk bait-and-switch shifts, Minor (`v1.1.0`) for moderate shifts, and Patch (`v1.0.1`) for low/typo updates.

### Pillar 5: Application Lifecycle & Deduplication (`src/utils/applicationLifecycle.ts` & `firestore.rules`)
- **Deterministic Application ID**: Generates `${jobId}_${seekerId}` to prevent race-condition duplicates.
- **State Machine Safeguards**: Prevents rejected applicants from immediately reapplying without recruiter review.
- **Firestore Security Rules**: Enforces non-existence of duplicate application IDs at database write time.

---

## 3. Verification & Safety Verification
- **Automated Unit Tests**:
  - `tests/unit/jobDedup.test.ts`
  - `tests/unit/profileMerge.test.ts`
  - `tests/unit/materialShiftEngine.test.ts`
  - `tests/unit/identityGovernance.test.ts`
  - `tests/unit/jsonProfileParser.test.ts`
  - Master suite runner: `tests/runAllTests.ts`
- **Audit Verification**:
  - `npm test`: 100% assertions satisfied across all suites.
  - `npm run lint` (`tsc --noEmit`): 0 warnings, 0 errors.
  - `compile_applet`: Clean build.
