# Developer Changelog (High-Frequency Engineering Log)

This internal engineering log records granular development actions, architecture refactoring, diagnostic findings, ITIL service management changes, and test execution details on every development turn.

---

## [0.5.27-dev.16] - 2026-10-04
### Refactored & Hardened (ITIL Service Transition - AdminPanel Modular Subcomponent Decomposition)
- **Monolithic Admin Panel Refactoring (`src/pages/AdminPanel.tsx` -> `src/components/admin/`)**:
  - Decomposed 1,904-line monolithic `AdminPanel.tsx` into 8 modular, single-responsibility subcomponents complying with NASA JPL Power of 10 Rule 4 (max ~60 lines logic per component):
    - `src/components/admin/adminMockData.ts`: Extracted mock job sets (`sampleJobSets`) and company metadata (`companiesDetails`).
    - `src/components/admin/AdminHeaderStats.tsx`: Executive telemetry cards & deep company sync control.
    - `src/components/admin/AdminDataSeedingTab.tsx`: Industry sampler & bulk data injection engine.
    - `src/components/admin/AdminInvitationsTab.tsx`: Partner token generator, active tokens table & email dispatch modal.
    - `src/components/admin/AdminPartnerRequestsTab.tsx`: Inbound access request CRM & conversion workflow.
    - `src/components/admin/AdminRecruiterLeadsTab.tsx`: Auto-discovered recruiter leads table & outreach actions.
    - `src/components/admin/AdminSecurityTab.tsx`: Audit logs, database pruning & maintenance actions.
    - `src/components/admin/AdminConfirmationModal.tsx`: Reusable destructive action modal.
  - Refactored `AdminPanel.tsx` into a lightweight orchestrator page container (<300 lines).
- **Documentation & Structure Sync**:
  - Updated `Docs/STRUCTURE.md` documenting the new `src/components/admin/` module directory.
- **Verification Gate**:
  - `npm test`: 100% assertions satisfied across 9 unit test suites.
  - `npm run lint` (`tsc --noEmit`): 0 errors, 0 warnings.
  - `compile_applet`: Clean build.

---

## [0.5.27-dev.15] - 2026-10-04
### Fixed & Enhanced (ITIL Service Transition - Inbound Recruiter Lead Auto-Discovery & Admin Referral Sync)
- **Admin Panel Lead Auto-Discovery Sync (`src/pages/AdminPanel.tsx`)**:
  - *Root Cause Analysis*: Recruiter details parsed in candidate pipeline cards were written to `recruiter_leads`, but `AdminPanel.tsx` only fetched `recruiter_leads` on manual tab navigation to `adminMode === 'leads'`. Furthermore, any jobs ingested without an explicit lead document (or from prior sessions) were missed in the referral UI.
  - *Fix*: Upgraded `fetchLeads()` in `AdminPanel.tsx` with a deep auto-discovery crawler across canonical `jobs` and `collectionGroup(db, 'ingestedJobs')`. Any parsed job containing `recruiterInfo` or `posterFirmName` is automatically converted into a lead payload and backfilled into `recruiter_leads`.
  - Configured `useEffect` in `AdminPanel.tsx` to automatically trigger `fetchLeads()`, `fetchInvitations()`, and `fetchRequests()` on view mount, ensuring live counter updates in the header.
- **Verification Gate**:
  - `npm test`: 100% assertions satisfied across 9 unit test suites.
  - `npm run lint` (`tsc --noEmit`): 0 errors, 0 warnings.
  - `compile_applet`: Clean build.

---

## [0.5.27-dev.14] - 2026-10-04
### Fixed & Unified (ITIL Service Transition - Pipeline Tracker & Top Matches Score Alignment)
- **Pipeline Tracker Match Score Algorithm Alignment (`src/components/tracker/JobTracker.tsx`)**:
  - *Root Cause Analysis*: Pipeline cards in `JobTracker.tsx` previously calculated match badges by displaying only raw required skills ratio (`matchedCount / totalRequired`), while passing an incomplete job object stub. This resulted in cards showing 0% or 20% match even when candidates were high overall fits across compensation, experience, and title.
  - *Fix*: Updated `JobTracker.tsx` to pass complete job object specifications (including title, description, requirements, salary range, workplace type, and skills) into `getMatchBreakdown(profile, job)` and rendered the holistic **`breakdown.overallScore`** (0 – 100%).
  - Added color-coded match badge styling (`>=85%` Emerald, `>=70%` Indigo, `>=50%` Amber) matching the "Top Matches" section in the Job Seeker Dashboard.
- **Verification Gate**:
  - `npm test`: 100% assertions satisfied across 9 unit test suites.
  - `npm run lint` (`tsc --noEmit`): 0 errors, 0 warnings.
  - `compile_applet`: Clean build.

---

## [0.5.27-dev.13] - 2026-10-04
### Fixed & Enhanced (ITIL Emergency Change - Multimodal PDF Text Extraction & Validation Gate)
- **PDF Extraction Pipeline Overhaul (`server.ts`, `package.json`)**:
  - *Root Cause*: When a PDF was ingested without a Gemini key or when Gemini model returned example schema strings, the system outputted placeholder text like `"Position Title"`, `"Job Title"`, or `"undefined"`.
  - *Fix*: Integrated `pdf-parse` for server-side PDF plain-text extraction (`pdfParse(Buffer.from(fileContent, 'base64'))`).
  - Added strict Gemini validation gate: if Gemini PDF output contains placeholder titles (`"Position Title"`, `"Job Title"`, `"undefined"`), the system automatically rejects the placeholder output and routes the extracted plain text into our specialized `diceEmailNlpParse` / `govJobsNlpParse` / `localNlpParse` engines.
  - Upgraded multimodal PDF Gemini extraction model to `gemini-2.5-flash` with explicit instructions against returning example strings.
- **Safety-Critical Unit Test Suite (`tests/unit/pdfParser.test.ts`, `tests/runAllTests.ts`)**:
  - Added `runPdfParserValidationTests` verifying placeholder title detection and validation gate invariants.
- **Verification Gate**:
  - `npm test`: 100% assertions satisfied across 9 unit test suites.
  - `npm run lint` (`tsc --noEmit`): 0 errors, 0 warnings.
  - `compile_applet`: Clean build.

---

## [0.5.27-dev.12] - 2026-10-04
### Enhanced & Fixed (ITIL Service Transition - Client-Side AI Key Management, Canonical Job Mirroring, & Outreach Inspector Parity)
- **Client-Side Gemini API Key Management (`src/components/tracker/JobTracker.tsx`, `server.ts`)**:
  - Implemented persistent browser-based API key state (`localStorage` key `ascend_user_gemini_api_key`) and an interactive modal dialog ("Configure Custom AI Key") in the Candidate Ingestion header.
  - Configured all candidate AI triggers (`/api/ingest-job`, `/api/ingest-job/enhance`, `/api/ingest-job/chat`, `/api/tailor-resume`) to send custom API keys via request header `x-gemini-api-key` and body `apiKey`.
  - Updated server endpoints in `server.ts` to dynamically resolve `getAiClient(clientApiKey)` with fallback to default system key.
- **Canonical Job Post Synchronization & Recruiter Parity (`src/components/tracker/JobTracker.tsx`)**:
  - Automatically mirrors candidate-ingested job postings directly to the global canonical `jobs/{jobDocId}` collection alongside `users/{uid}/ingestedJobs/{jobDocId}`, creating full recruiter-equivalent schema parity with structured `parsedCriteria` (skills, requiredSkills, preferredSkills, minExperience, salaryRange, workplaceType, location, benefits).
  - Automatically extracts and registers discovered recruiter leads into `recruiter_leads` collection for admin outreach CRM when recruiter email is present.
- **Rich Candidate Job & Recruiter Outreach Inspector (`src/components/tracker/JobTracker.tsx`)**:
  - Upgraded candidate job understanding drawer to full parity with employer imports, featuring:
    - **Inbound Recruiter Outreach Card**: Direct recruiter name, agency, direct email, phone, end client, contract model (W2/C2C/1099), work authorization (USC/GC), and 1-click "Copy Email" / "Email Recruiter" actions.
    - **Public Sector / GovJobs Inspector**: Requisition #, department/agency, civil service filing info, and hourly-to-annual pay scale translation.
    - **Strategic Alignment & STAR Interview Copilot**: Match score breakdown, 4 STAR behavioral interview questions with model answers, unstated expectations, and interactive Copilot chat.
- **Verification Gate**:
  - `npm test`: 100% assertions satisfied across all 8 test suites with zero failures.
  - `npm run lint` (`tsc --noEmit`): 0 errors, 0 warnings.
  - `compile_applet`: Clean build.

---

## [0.5.27-dev.11] - 2026-10-04
### Enhanced & Styled (ITIL Service Transition - Candidate Ingestion UI/UX & Engine Layout Overhaul)
- **Candidate Job Description Ingestion UI/UX Layout Overhaul (`src/components/tracker/JobTracker.tsx`)**:
  - Removed artificial narrow container width ceiling (`max-w-2xl` -> full responsive `w-full` layout), resolving cramped textareas and broken layouts across high-resolution displays.
  - Replaced legacy text tabs with a high-contrast, responsive 4-column segmented control navigation bar with dedicated brand accents (`Job URL`, `Standard Job Text`, `GovJobs / NEOGOV`, and `Dice Outreach`).
  - Redesigned PDF document upload bars across all ingestion modes with direct file status indicators, truncated paths, and 1-click removal triggers.
  - Upgraded monospace textareas to full-width, clean shadow-inner formatting with increased vertical row capacity (8 rows) and anti-glare focus rings.
  - Added dynamic loader indicators and explicit status messaging across all ingestion triggers.
- **Verification Gate**:
  - `npm test`: 100% assertions satisfied across all 8 test suites with zero failures.
  - `npm run lint` (`tsc --noEmit`): 0 errors, 0 warnings.
  - `compile_applet`: Clean build.

---

## [0.5.27-dev.10] - 2026-10-04
### Fixed & Added (ITIL Emergency Change & Service Transition - Firestore Payload Sanitizer, PDF Ingestion, & Admin Outreach Sync)
- **Root Cause Analysis (RCA) & Firestore Undefined Payload Sanitizer (`src/utils/firestoreSanitizer.ts`, `src/components/tracker/JobTracker.tsx`, `src/components/GovJobsBridge.tsx`)**:
  - *Incident Root Cause*: When ingesting jobs with optional metadata (e.g. `canonicalUrl: undefined` or `recruiterInfo.phone: undefined`), calling Firestore `setDoc()` or `addDoc()` threw `Unsupported field value: undefined`.
  - *Permanent Resolution*: Implemented `sanitizeFirestorePayload()` adhering to NASA JPL Rule #5 (High Assertion Density) and Rule #7 (Strict Return Value Checking) that deeply traverses objects and arrays to strip all `undefined` values while strictly preserving Firestore `FieldValue` sentinels (`serverTimestamp()`), `Timestamp`, `Date`, and clean `null` markers.
- **Multimodal PDF Email & Specification Upload Support (`src/components/tracker/JobTracker.tsx`, `src/components/GovJobsBridge.tsx`, `server.ts`)**:
  - Added PDF file upload support (drag & drop / file picker) across both Candidate Job Tracker and Employer/Recruiter GovJobs Bridge.
  - Candidates and recruiters can now directly upload PDF exports of outreach emails and GovernmentJobs listings instead of having to copy and paste text.
- **Automated Recruiter Leads Ingestion for Admin Outreach Portal (`src/components/tracker/JobTracker.tsx`, `src/components/GovJobsBridge.tsx`, `src/pages/AdminPanel.tsx`)**:
  - Automatically captures parsed recruiter details (name, email, phone, staffing agency, client, sourced role) whenever a candidate or employer ingests an outreach email or GovJob.
  - Writes sanitized records to the `recruiter_leads` collection in Firestore.
  - Integrates seamlessly with the Admin Panel's *Recruiter Leads* CRM tab, allowing administrators to review incoming recruiter leads and issue 1-click partner invitations to the portal.
- **Test Suite Expansion & Green Gate (`tests/unit/firestoreSanitizer.test.ts`, `tests/unit/recruiterLeads.test.ts`, `tests/runAllTests.ts`)**:
  - Added 5 unit tests for Firestore payload sanitization (root stripping, nested object cleanup, sentinel preservation, array objects).
  - Added unit tests for deterministic recruiter lead ID generation and outreach payload sanitization.
  - Master test harness (`npm test`) verified 100% green across 8 test suites.
- **Verification Gate**:
  - `npm test`: 100% assertions satisfied across all 8 test suites.
  - `npm run lint` (`tsc --noEmit`): 0 errors, 0 warnings.
  - `compile_applet`: Clean build.

---

## [0.5.27-dev.09] - 2026-10-04
### Added & Enhanced (ITIL Service Transition - Candidate GovJobs Import & Dual-Sided Dice Outreach Email Parser)
- **Candidate Application Pipeline Ingestion Expansion (`src/components/tracker/JobTracker.tsx`, `src/types/index.ts`)**:
  - Expanded candidate tracker ingestion pipeline with 4 dedicated, high-contrast modal modes:
    1. *Import via Job URL* (LinkedIn, Indeed, Career Sites)
    2. *Standard Job Text* (Direct job descriptions)
    3. *GovJobs / NEOGOV* (GovernmentJobs.com, state boards, department hierarchies, closing dates, hourly-to-annual pay)
    4. *Dice / Recruiter Reach-Out* (Inbound recruiter emails, Dice Private Emails, LinkedIn InMails)
  - Added rich candidate cards and detail drawer views displaying recruiter outreach info, staffing agency names, direct recruiter emails/phones, contract terms (W2/C2C/1099), work authorization requirements, and public sector requisition metadata.
- **Dual-Sided Dice Recruiter Outreach Parser (`server.ts`, `src/components/GovJobsBridge.tsx`)**:
  - Authored `diceEmailNlpParse` in `server.ts` to automatically extract recruiter identity (name, email, mobile, desk extension), staffing agencies (Tekfortune, Applab Systems, Sibitalent, Intone, etc.), end clients (e.g., Wipro/Amazon), compensation, contract models, and technical skills from unstructured recruiter email reach-outs.
  - Upgraded `GovJobsBridge.tsx` on the recruiter/employer workspace to support a dual-mode switch between *GovJobs / NEOGOV* and *Dice & Recruiter Reach-Out Bridge*, enabling staffing agencies and recruiters to ingest cold client emails into active ATS requisitions.
- **Automated Test Suite Expansion (`tests/unit/diceEmailParser.test.ts`, `tests/runAllTests.ts`)**:
  - Authored comprehensive test suite verifying 4 distinct Dice recruiter outreach email formats, validating title cleanup, recruiter identity extraction, staffing agency resolution, and work auth constraints.
  - Wired into master test harness (`runDiceEmailParserTests`).
- **Verification Gate**:
  - `npm test`: 100% assertions satisfied across all 6 test suites (50/50 tests passing).
  - `npm run lint` (`tsc --noEmit`): 0 errors, 0 warnings.
  - `compile_applet`: Clean build.

---

## [0.5.27-dev.08] - 2026-10-04
### Enhanced & Styled (ITIL Service Transition - Static Nav Bar & Tag Refinement)
- **Navigation Bar Layout & Label Polish (`src/pages/EmployerDashboard.tsx`)**:
  - Removed horizontal scrolling (`overflow-x-auto max-w-full`) from the recruitment workspace navigation container, switching to a responsive `flex-wrap` static layout.
  - Removed the `+GovJobs` badge tag from the "Requisitions & Audits" button for clean, consistent label alignment across all workspace nav items.
- **Verification Gate**:
  - `npm test`: 100% assertions satisfied.
  - `npm run lint` (`tsc --noEmit`): 0 errors, 0 warnings.
  - `compile_applet`: Clean build.

---

## [0.5.27-dev.07] - 2026-10-04
### Enhanced & Unified (ITIL Service Transition - Requisitions & GovJobs Strategic Bridge Consolidation)
- **GovJobs Bridge & Requisition Editor Consolidation (`src/components/JobRequisitionEditor.tsx`, `src/pages/EmployerDashboard.tsx`, `src/components/GovJobsBridge.tsx`)**:
  - In response to UI Focus Selection on Employer Workspace tabs, merged the standalone "GovJobs Bridge" tab into the "Requisitions & Audits" workspace.
  - Upgraded `JobRequisitionEditor` sub-navigation to include a first-class `GovJobs Bridge` (`'govjobs'`) sub-tab with live NEOGOV ingestion, state mirroring, and immediate requisition list syncing upon import.
  - Added quick `+GovJob` action button in the requisition management sidebar to expedite public sector imports without leaving the requisition workflow.
  - Enhanced `GovJobsBridge.tsx` with `companyId`, `companyName`, and `onJobIngested` callback props, establishing tight cohesion between public sector ingestion and active company job boards.
  - Updated `EmployerDashboard.tsx` tab bar with a unified high-contrast styled button (`Requisitions & Audits (+GovJobs)`) featuring dual iconography (`Edit3` and `Globe`) and verified active state indicator rings.
- **Verification Gate**:
  - `npm test`: 100% assertions satisfied across all unit suites.
  - `npm run lint` (`tsc --noEmit`): 0 errors, 0 warnings.
  - `compile_applet`: Clean build.

---

## [0.5.27-dev.06] - 2026-10-04
### Added & Enhanced (ITIL Service Transition - Safety-Critical Deduplication, Validation & Merge Architecture)
- **Identity & Role Governance (`src/utils/identityGovernance.ts`, `src/hooks/useAuth.tsx`, `src/types/index.ts`)**:
  - Implemented `normalizeEmail` (lowercase, whitespace trim, plus-addressing preservation) integrated into `signUpWithEmail`, `signInWithEmail`, and Google OAuth.
  - Implemented role-switch rate limiting via `checkRoleSwitchRateLimit` enforcing a maximum of 3 transitions per 24 hours per user.
  - Implemented atomic profile archival via `generateArchiveProfilePath`: prior role profiles (`users/{uid}/profiles/{role}`) are cloned to `users/{uid}/profiles/archived/{role}_{timestamp}` with `archivedAt` timestamps prior to switching roles, eliminating silent data loss.
- **Ingested Job Deduplication & Canonicalization (`src/utils/jobDedup.ts`, `src/components/tracker/JobTracker.tsx`)**:
  - Implemented `canonicalizeJobUrl`: strips `www.`, strips tracking parameters (`utm_*`, `ref`, `fbclid`, etc.), preserves recognized job parameters (`jk`, `jobId`, `id`, `vjk`), and standardizes HTTPS protocol and trailing slashes.
  - Implemented `JOB_ID_EXTRACTORS` for LinkedIn, Indeed, GovernmentJobs, Greenhouse, Lever, Ashby, and Workday.
  - Replaced non-deterministic `Date.now()` doc IDs with 16-character deterministic FNV-1a hex hashes (`computeDeterministicHash`).
  - Added 90-day retention TTL evaluation (`isJobStale`).
  - Updated `JobTracker.tsx` to commit ingested jobs with `{ merge: true }`, updating `lastSeenAt` without duplicating or wiping candidate notes.
- **Profile Deep Merge & Override Preservation (`src/utils/profileMerge.ts`, `src/pages/ProfileWizard.tsx`)**:
  - Implemented `mergeProfileData` with deep state retention on resume re-upload:
    - Retains 100% of user overrides: privacy levels, PII redaction, excluded employers, custom phone/location/pronouns, drag-and-drop section order, and DEI accommodations.
    - `mergeSkills`: case-insensitive deduplication, metadata preservation, and experience level union.
    - `mergeWorkExperience`: matches by company and role, preserving longer achievements and unioning skill tags.
    - `mergeEducation`: matches by institution and degree without duplicate entries.
- **Requisition Material Shift Engine (`src/utils/materialShiftEngine.ts`, `src/components/JobRequisitionEditor.tsx`, `src/config.ts`)**:
  - Replaced hardcoded heuristics with centralized configuration (`STATIC_CONFIG.MATERIAL_SHIFT_THRESHOLDS`).
  - Added detection for:
    - Max salary drop (>5% drop = +40 points / `high_bait_and_switch`).
    - Min salary drop (>10% drop = +25 points / `moderate`).
    - Scope expansion (>20% requirements length increase = +15 points / `moderate`).
    - Seniority title downgrades (e.g. Senior to Junior = +10 points / `high_bait_and_switch`).
    - Workplace policy shifts (Remote ➔ On-site = +20 points / `high_bait_and_switch`).
  - Implemented semantic versioning (`calculateSemanticVersion`): Patch (`v1.0.1`) for minor/typo edits, Minor (`v1.1.0`) for moderate shifts, Major (`v2.0.0`) for bait-and-switch shifts.
- **JSON Profile Parser Normalization & Sanitization (`src/utils/jsonProfileParser.ts`)**:
  - Implemented `normalizeSalary` supporting salary ranges (`$120K - $160K`), open-ended figures (`150K+`), single values (`$145,000`), and currency detection (USD, EUR, GBP, CAD).
  - Added strict sanitization helpers (`sanitizeString`, `sanitizePhone`, `sanitizeNarrative`) stripping binary control characters.
  - Enforced schema flavor precedence: Advanced Persona > Recruiter Profile > Simplified Resume > Legacy Format.
- **Application Deduplication & Audit Firestore Rules (`firestore.rules`, `src/utils/applicationLifecycle.ts`)**:
  - Created `getDeterministicApplicationId` (`${jobId}_${seekerId}`).
  - Hardened `firestore.rules` for `/applications/{applicationId}` to reject duplicate applications at creation.
  - Added write-once immutable `/audit_logs/{logId}` security rules.
  - Deployed updated rules to Firebase.
- **Comprehensive Automated Test Suite (`tests/unit/`, `tests/runAllTests.ts`, `package.json`)**:
  - Authored unit test suites: `tests/unit/jobDedup.test.ts`, `tests/unit/profileMerge.test.ts`, `tests/unit/materialShiftEngine.test.ts`, `tests/unit/identityGovernance.test.ts`.
  - Expanded `tests/unit/jsonProfileParser.test.ts` with salary normalization and sanitization tests.
  - Created master harness `tests/runAllTests.ts` and wired to `npm test`.
- **Verification Gate**:
  - `npm test`: 100% assertions satisfied across all 5 test suites.
  - `npm run lint` (`tsc --noEmit`): 0 errors, 0 warnings.
  - `compile_applet`: Clean build.

---

## [0.5.27-dev.05] - 2026-10-04
### Fixed & Enhanced (ITIL Service Transition - Launch Dashboard Navigation & Sticky Wizard Breadcrumbs)
- **Launch Dashboard Navigation Resolution (`src/hooks/useAuth.tsx`, `src/App.tsx`, `src/pages/ProfileWizard.tsx`)**:
  - Root Cause Analysis: `recheckProfileConfigured()` in `useAuth.tsx` did not refresh `appUser` in React state after Firestore `setDoc(userRef, { profileCompleted: true })`. This left `appUser.profileCompleted` as `false`, causing the root router in `App.tsx` (`!appUser?.profileCompleted ? <ProfileWizard />`) to indefinitely trap the user inside the wizard. Additionally, `App.tsx` had routed `#onboarding` completions to `#edit-profile` rather than the active dashboard `#seeker`.
  - Resolution:
    - Updated `recheckProfileConfigured()` to synchronize `appUser` state with fresh user document snapshot.
    - Updated `ProfileWizard` completion callback in `App.tsx` to set `window.location.hash = '#seeker'`.
    - Hardened `saveProfile()` in `ProfileWizard.tsx` with guaranteed hash navigation to `#seeker` and resilient try/catch recovery so the button never becomes unresponsive.
    - Added high-contrast feedback states and loading indicators to the "Launch Dashboard" button.
- **Sticky Progress Bar / Breadcrumbs (`src/pages/ProfileWizard.tsx`, `src/pages/CompanyWizard.tsx`)**:
  - Upgraded wizard breadcrumbs container to `sticky top-16 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md` with refined borders, step badges, and labels.
  - Ensures the progress indicator stays pinned right below the fixed top navigation bar throughout long scrollable sections (such as multi-entry Work Experience or Education steps).
- **Verification Gate**:
  - `npm test`: 100% assertions satisfied.
  - `npm run lint` (`tsc --noEmit`): 0 errors, 0 warnings.
  - `compile_applet`: Clean build.

---

## [0.5.27-dev.04] - 2026-10-04
### Added & Enhanced (ITIL Service Transition - Multi-Format JSON Profile Templates & Parser Architecture)
- **Multi-Format JSON Profile Templates (`/public/templates/`, `/public/schemas/`)**:
  - Implemented 3 standardized, production-ready downloadable JSON templates and schema specifications (v2026.10.04):
    1. `/public/templates/resume-simplified-template.json`: Captures `contact`, `summary`, `work_experience`, `education`, `certifications`, `skills`, `domains`, `key_metrics`, and `optional` sections.
    2. `/public/templates/resume-advanced-persona-template.json`: Deep portfolio persona structure capturing `persona.identity`, `persona.contact`, `persona.brand`, `persona.professional_identity`, `persona.ventures`, `persona.accommodations`, and `persona.skills`.
    3. `/public/templates/recruiter-profile-template.json`: Recruiter profile template capturing `recruiter_info`, `organization`, `professional_bio`, `sourcing_specialties`, `active_focus_areas`, and `candidate_standards`.
    4. Generated formal Draft-07 schemas in `/public/schemas/resume-simplified.schema.json` and `/public/schemas/recruiter-profile.schema.json`.
- **Ingestion Engine Normalization (`src/utils/jsonProfileParser.ts`)**:
  - Re-engineered `parseJsonProfile` to automatically detect schema flavor (`simplified`, `advanced_persona`, `recruiter`, `legacy`):
    - Normalizes multi-tier skill arrays and nested objects into unified `ProfileSkill[]`.
    - Normalizes work experience highlights and bullet points into comprehensive achievement narratives.
    - Accurately parses compensation bounds and neurodivergent/ADA accommodations across all schemas.
- **In-App Download & Upload UI (`src/components/JsonProfileUpload.tsx`, `src/pages/CompanyWizard.tsx`)**:
  - Enhanced `JsonProfileUpload.tsx` with multi-format validation and an accessible 3-card template download panel with 1-click download triggers for Simplified, Advanced Persona, and Recruiter templates.
  - Added an optional "Import from Recruiter Profile JSON" accordion trigger to `CompanyWizard.tsx` (Step 1) so recruiters can immediately populate company data, sourcing specialties, and narrative.
- **Automated Invariant Unit Test Suite (`tests/unit/jsonProfileParser.test.ts`, `package.json`)**:
  - Authored automated unit test suite verifying 100% parser fidelity across all three template files.
  - Added `"test": "tsx tests/unit/jsonProfileParser.test.ts"` to `package.json`.
- **Verification Gate**:
  - `npm test`: 100% assertions satisfied across all 3 templates.
  - `npm run lint` (`tsc --noEmit`): 0 errors, 0 warnings.
  - `compile_applet`: Build succeeded cleanly.

---

## [0.5.27-dev.03] - 2026-10-03
### Added & Enhanced (ITIL Service Transition - Sign-In Profile Verification & Setup Restart Prompt)
- **Profile Integrity Verification Gate (`src/hooks/useAuth.tsx`)**:
  - Implemented `checkProfileConfigured` inside `useAuth.tsx` to verify whether the required Firestore sub-document exists for the user's assigned `accountType` upon sign-in / session restoration:
    - `jobSeeker`: verifies existence of `users/{uid}/profiles/main`.
    - `recruiter`: verifies existence of `users/{uid}/profiles/recruiter`.
    - `companyOwner` / `company`: verifies existence of `users/{uid}/profiles/company`.
    - `admin` (Chris Barnes / admin UID / `admin` role): auto-exempted as platform administrator.
  - Exposed `isProfileConfigured`, `profileCheckLoading`, `resetProfileSetup`, and `recheckProfileConfigured` via `AuthContextType`.
  - Added `resetProfileSetup(newAccountType)` allowing users to cleanly restart setup with a newly chosen profile type (`jobSeeker`, `recruiter`, `companyOwner`), updating `users/{uid}` with `profileCompleted: false` and triggering re-validation.
- **Dedicated Profile Setup & Restart Recovery UI (`src/components/profile/ProfileRestartPrompt.tsx`)**:
  - Built an accessible (WCAG 2.1/2.2 AA compliant) recovery surface displayed when a signed-in user's profile is not yet configured or is in an inconsistent state:
    - Primary Action: **"Configure as [Current Role]"** -> routes to `#onboarding` to complete the tailored wizard.
    - Restart Action: **"Or Choose a Profile Type to Restart Setup"** -> 3 interactive role cards (`Job Seeker`, `Recruiter`, `Company Owner`) that reset the profile and immediately launch onboarding.
    - Exit Action: **"Sign Out"** -> signs out the user cleanly.
- **Router Integration (`src/App.tsx`)**:
  - In `AppContent`, intercepted unconfigured sessions (`!isProfileConfigured && !isAdmin && hash !== '#onboarding'`) to render `<ProfileRestartPrompt />`.
  - Updated completion callbacks for both `CompanyWizard` and `ProfileWizard` to re-check profile configuration and route directly to the active workspace (`#seeker`, `#employer`, or `#company-management`).
- **Verification Gate**:
  - `lint_applet` (`tsc --noEmit`): 0 errors, 0 warnings.
  - `compile_applet`: Build succeeded cleanly.

---

## [0.5.27-dev.02] - 2026-10-03
### Added & Enhanced (ITIL Service Transition - Admin Logo Navigation Routing)
- **Admin Navigation Alignment (`src/App.tsx`, `src/components/Footer.tsx`)**:
  - Fixed the header Navbar and Footer branding logo click behavior for platform administrators:
    - Previously, clicking the logo linked to `href="#"`, which fell back to the root router condition where administrators were routed to `<EmployerDashboard />`.
    - Updated Navbar logo link in `src/App.tsx` (line 128) to dynamically link to `href={isAdmin ? "#admin" : isCompany ? "#employer" : user ? "#seeker" : "#"}`.
    - Updated Footer logo link in `src/components/Footer.tsx` (line 17) to dynamically link to `href={isAdmin ? "#admin" : user ? "#seeker" : "#"}`.
    - Updated router fallback and title logic in `src/App.tsx` (lines 900-905 & 1042-1046) so that when an administrator lands on root or an empty hash, it renders `<AdminPanel />` (the Admin Dashboard) rather than `<EmployerDashboard />`.
- **Verification Gate**:
  - `lint_applet` (`tsc --noEmit`): 0 errors, 0 warnings.
  - `compile_applet`: Build succeeded cleanly.

---

## [0.5.27-dev.01] - 2026-10-03
### Added & Enhanced (ITIL Service Transition - 4 Profile Types Architecture & Cross-Company Isolation Fix)
- **Problem Resolution (Prior Company Data Isolation)**:
  - Diagnosed root cause of prior company candidate pipelines and job requisitions persisting across company changes:
    1. In `src/pages/EmployerDashboard.tsx`, the admin filter condition unconditionally bypassed company filtering, falling back to all applications or prior stale company context.
    2. In `src/components/JobRequisitionEditor.tsx`, requisition queries defaulted to a global query without scoping strictly to `companyId`.
  - Fixed application filtering in `src/pages/EmployerDashboard.tsx` to strictly evaluate `effectiveCompanyId` (resolved from `recruiterCompany.claimedCompanyId`, `appUser?.activeCompanyId`, or selected company switcher item), with an explicit active company switcher dropdown in the dashboard header for admins and multi-company recruiters.
  - Passed `effectiveCompanyId` to `JobRequisitionEditor`, and scoped `fetchRequisitions` strictly to `where('companyId', '==', companyId)`.
- **4 Distinct Profile Types Architecture**:
  1. **JobSeekers (`jobSeeker`)**:
     - Retains candidate master profile, structured resume parsing, job application tracking, and dynamic 4-tier privacy controls (Unrestricted, Contact Masked, Anonymous Persona, Maximum Cloak) with public toggle.
  2. **Recruiters (`recruiter`)**:
     - Verified public profile at `#profile/{uid}` displaying recruiter title, company verification badge, bio, sourcing specialties, and active live job postings for their organization.
     - Sourcing workspace and candidate pipeline dashboard with direct requisition assignment.
     - Can join independently or accept invitations from company owners.
  3. **Company Owners / Business Contact Managers (`companyOwner`)**:
     - Full company brand governance, profile builder, and requisition oversight.
     - Recruiter team management in `src/pages/CompanyManagement.tsx`: generate company-scoped recruiter invite codes (`REC-XXXX-XXXXX`), accept or decline inbound claim requests, and attach/detach recruiters.
  4. **System Administrator (`admin` / Chris Barnes)**:
     - Unrestricted developer admin panel, cross-company switcher, database seeders, and platform governance.
- **Type Definitions & Security Rules (`src/types/index.ts`, `firestore.rules`)**:
  - Added `RecruiterProfile` and `CompanyRecruiterInvite` interfaces to `src/types/index.ts`.
  - Added `companyOwner` and updated `companyRole` union to include `'admin'`.
  - Updated `firestore.rules` to secure `company_recruiter_invitations`, allow public reading of active recruiter profiles, and deployed rules via `deploy_firebase`.
- **Registration Flow Upgrades (`src/App.tsx`, `src/hooks/useAuth.tsx`, `src/pages/CompanyWizard.tsx`)**:
  - Upgraded `RegistrationFlow` with a 3-way profile selection grid (`Job Seeker`, `Recruiter`, `Company Owner`) with tailored invite code helpers.
  - Updated `useAuth.tsx` (`signUpWithEmail`, `signInWithGoogle`) to validate recruiter invite codes from `company_recruiter_invitations` and assign company context.
  - Enhanced `CompanyWizard.tsx` to initialize both public recruiter profiles and company ownership records during onboarding.
- **Verification Gate**:
  - `lint_applet` (`tsc --noEmit`) passed with 0 errors.
  - `compile_applet` passed successfully.

---

## [0.5.26-dev.02] - 2026-10-03
### Added & Enhanced (ITIL Service Transition - Formatting Polish & Prompt Hardening)
- **Formatting Polish (`src/components/JobContentPreview.tsx`)**:
  - Upgraded **Rich Text Mode** with dynamic icon mapping (`Briefcase` for descriptions, `CheckCircle2` for requirements, `DollarSign` for compensation, `Target` for responsibilities).
  - Added support for **Code Blocks** (triple backticks) and **Horizontal Rules** (`---`) within the Rich Text preview.
  - Implemented 1-click **Markdown Source Copy** and **Raw Text Copy** directly inside the preview containers with hover-state feedback.
  - Refined visual hierarchy of section headers with high-contrast borders and indigo accents.
- **Backend Prompt Hardening (`server.ts`)**:
  - Re-architected Gemini extraction prompts (Tier V2 & V3) using **XML-tagged structures** (`<role>`, `<task>`, `<constraints>`, `<job_context>`) to enforce strict grounding and reduce hallucinations.
  - Hardened constraints for salary extraction (return `null` instead of found-equivalent) and skill categorization as requested in the GovJobs bridge optimization.
- **Extension Infrastructure Audit (`extension/manifest.json`)**:
  - Set default injection timing to `run_at: document_idle` ensuring DOM readiness for `.term-block` scraping.
  - Added `exclude_globs` for login/signup paths to prevent redundant script execution.
  - Implemented **Content Security Policy (CSP)** allowlist for Firebase, Google Identity, and local backend domains to fix potential service worker connectivity issues.
  - Enabled `match_origin_as_fallback` for robust iframe scraping on NEOGOV-integrated sites.
- **Verification Gate**: Passed `tsc --noEmit` and production build with 0 warnings.

---

## [0.5.26-dev.01] - 2026-10-03
### Added & Enhanced (ITIL Service Transition - Rich Text, Enhanced Markdown & Raw Text Preview)
- **Job Content Preview Engine (`src/components/JobContentPreview.tsx`)**:
  - Implemented a modular, accessible preview renderer supporting 3 distinct modes:
    - **Enhanced Rich Text (`rich`)**: Semantic structured sections with layer headers, custom indigo bullet points, circular step badges for ordered lists, styled blockquotes, code tags, and bold text.
    - **Clean Markdown Preview (`markdown`)**: Crisp document typography with preserved spacing and line heights.
    - **Raw Text View (`raw`)**: Pure unformatted plain text with all markdown syntax (`###`, `**`, `*`, `_`, `` ` ``, `>`) stripped via deterministic `stripMarkdownFormatting` regex cleaner.
  - Built-in 1-click clipboard copy with live toast confirmation feedback (`Copied!`).
  - Phrasing content architecture (`asParagraph` mode) guaranteeing 100% compliant HTML within `<p>` tags while preserving direct DOM selector access (`div:nth-of-type(5) > p:nth-of-type(1)` and `div:nth-of-type(6) > p:nth-of-type(1)`).
- **Targeted Element Upgrades (`src/pages/JobDescription.tsx`)**:
  - **Selector 1 (`div:nth-of-type(5) > p:nth-of-type(1)`)**: Replaced unstyled `<p className="... whitespace-pre-wrap">{job.description}</p>` with dynamic `JobContentPreview` wired to the global preview mode.
  - **Selector 2 (`div:nth-of-type(6) > p:nth-of-type(1)`)**: Replaced unstyled `<p className="... whitespace-pre-wrap">{job.requirements}</p>` with dynamic `JobContentPreview` for requirements.
  - **Selector 3 (`div:nth-of-type(4) > button:nth-of-type(1)`)**: Maintained the direct Version History button and enhanced the header with a dedicated preview mode switcher (`Rich Text`, `Markdown`, `Raw Text`) and a 1-click "Copy All Raw Text" action.
- **Accessibility & Safety Compliance**:
  - WCAG 2.1/2.2 AA compliant contrast (>= 4.5:1), visible focus rings (`focus-visible:ring-2`), and ARIA tab semantics (`role="tablist"`, `role="tab"`, `aria-selected`).
  - NASA JPL Rule 2 & Rule 4 compliant bounded loops with safe upper limits (`MAX_ITERATION_CEILING`).
  - Verification: 0 compiler warnings, 0 linter errors (`tsc --noEmit`), and full green production compilation.

---

## [0.5.26] - 2026-09-30
### Release Cut & Milestone Promotion (ITIL Release & Deployment Management)
- **Public Milestone Cut**: Successfully promoted iterations `0.5.25-dev.01` through `0.5.25-dev.25` into public milestone release **v0.5.26**.
- **Configuration Item (CI) Synchronizations**:
  - `package.json`: Version bumped to `0.5.26`.
  - `src/config.ts`: `STATIC_CONFIG.APP.VERSION` synchronized to `0.5.26`.
  - `Docs/INDEX_AUDIT.md`: Audited configuration items and updated `package.json` entry to `v0.5.26`.
  - `Docs/CHANGELOG.md`: Appended official customer-facing release notes for `v0.5.26`.
- **Validation Gate Sign-Off**: Verification suites executed with 0 compiler warnings, 0 linter errors (`tsc --noEmit`), and full production build readiness.

---

## [0.5.25-dev.25] - 2026-09-30
### Added & Enhanced (ITIL Service Transition - RBAC Authentication Bridge & Role Lockdown)
- **Extension Authentication Gateway (`extension/popup.html`, `extension/popup.js`)**:
  - Implemented an enforced **Logged-Out Gateway Screen** that automatically prompts users to sign in to Ascend ATS before granting access to any ingestion or extraction tools.
  - Added 1-click **"Sign In / Connect Tab"** trigger linking directly to active Ascend session or launching `/#login`.
  - Added dedicated **"Sign Out"** trigger in popup header that purges cached credentials and locks down extension surfaces.
- **Strict Role-Based Access Control (RBAC) & Tab Lockout**:
  - **Job Seeker Role**: Locked Recruiter and Admin tabs with visual lock icons (`🔒`). Attempting to access unauthorized tool suites triggers a high-contrast security warning banner:
    - *“Recruiter Access Restricted: Your account is verified as a Job Seeker. Requisition import and sourcing engines require an authorized Recruiter or Staffing Firm account.”* Includes a direct action button linking to `#partner-request`.
  - **Recruiter Role**: Unlocked Recruiter and Seeker tools; locked Platform Administration with master architect requirement.
  - **Platform Architect (`Chris.Barnes.2000@me.com`)**: Full access across all 3 roles with a distinct `Platform Architect` badge.
- **Cross-Origin Session Synchronization (`src/hooks/useAuth.tsx`, `extension/content.js`)**:
  - `useAuth.tsx`: Synchronizes authenticated user metadata (`uid`, `email`, `displayName`, `accountType`, `isAdmin`, `profileCompleted`) into `localStorage['ascend_auth_session']` and dispatches `ascend-auth-change` events on login and logout.
  - `extension/content.js`: Observes Ascend ATS web app tabs and mirrors active auth tokens into `chrome.storage.local`.
- **Backend Ingestion Authorization Gate (`server.ts`)**:
  - In `/api/ingest-job`: Added an RBAC check on `isRequisition`. Requests attempting to ingest employer requisitions from candidate accounts without recruiter or admin credentials are automatically rejected with `HTTP 403 Forbidden`.

---

## [0.5.25-dev.24] - 2026-09-30
### Added & Enhanced (ITIL Service Transition - 3-Tier Prompt Matrix & Role-Aware Extension)
- **Role-Aware Multi-Tier Chrome Extension (`extension/popup.html`, `extension/popup.js`, `extension/content.js`)**:
  - **Dynamic Role Switcher**: Built a modern 360px popup with interactive tabs for **Job Seeker**, **Recruiter / Firm**, and **Platform Admin** (`Chris.Barnes.2000@me.com`) with session auto-detection and persistence in `chrome.storage.local`.
  - **Profile Display & Readiness Radar**: Displays candidate avatar, full name, target role, a dynamic 4-point Profile Completeness percentage bar (Resume, Skills, Target Role, Privacy Shield), and active Competitor Firewall status.
  - **Actor-Specific Quick Actions**:
    - **Job Seekers**: Added 1-click **"Import Current Job"** and **"Assess Fit on This Page"** (runs live heuristic match on active tab and displays match % badge and qualifications summary directly in popup). Added quick shortcuts to `My Jobs`, `Analytics`, and `Edit Profile`.
    - **Recruiters / Firms**: Added **"Import as Requisition"** (tags job directly into firm pipeline) and **"Source Candidates for Role"** (launches `#sourcing` with pre-filled filters).
    - **Platform Admins**: Added **"Open Admin Control Panel"** (`#admin`), **"Run Pipeline Diagnostics"** (pings `/api/health` and prompt matrix with real-time latency report in mini-terminal), and shortcuts to Company Management and Firm Invites.
- **Unified 3-Tier Prompt Matrix Engine Across All 3 Import Engines (`server.ts`)**:
  - Standardized all ingestion surfaces (`extension/content.js`, `src/components/ResumeUpload.tsx`, `src/components/GovJobsBridge.tsx`) to dynamically execute across the 3 prompt tiers:
    - **Tier V1 (Fast Heuristic Baseline)**: High-speed deterministic extraction of compensation (hourly/annual), workplace type, explicit keywords, and clean markdown with ~300ms latency.
    - **Tier V2 (Deep Semantic Taxonomy & Skill Normalization)**: Gemini 3.8 Flash structured JSON classifying skills into standard domains (`Technical`, `Soft Skills`, `Leadership`, `Domain Knowledge`, `Tools`), minimum vs. preferred qualification splitting, and 10-point benefits mapping with ~1.2s latency.
    - **Tier V3 (Strategic Executive Intelligence & Copilot Insights)**: Gemini 3.8 Flash strategic advisor generating 4 behavioral STAR interview questions with model answers, unstated hiring expectations, transition warnings, and tailored pitch strategies with ~2.5s latency.
  - Added backend endpoints `/api/prompt-matrix` (metadata and latency stats) and `/api/extension/profile-check` (role and completeness audit).
- **Frontend Import Engine Synchronization**:
  - `src/components/ResumeUpload.tsx`: Upgraded single checkbox into a 3-tier segmented matrix selector (`V1 Fast RegEx`, `V2 Semantic Taxonomy`, `V3 Executive STAR Prep`).
  - `src/components/GovJobsBridge.tsx`: Added 3-tier prompt matrix selection controls with latency badges prior to text analysis.
- **Roadmap Archival**:
  - Archived `GovJobs Bridge Integration` milestone into **Completed Roadmaps** in `Docs/INDEX_ROADMAP.md` and `Docs/RoadMaps/GovJobs_Bridge_Integration.md`.

---

## [0.5.25-dev.23] - 2026-09-30
### Added & Enhanced (ITIL Service Transition - Ingestion Engine Connectivity)
- **Live Ingestion Bridge for Passive Placement Analytics (`src/pages/JobSeekerAnalytics.tsx`)**:
  - Connected the passive placement analytics workspace directly to the live Firestore `jobs` collection (which aggregates real postings from the Chrome extension, LinkedIn, Indeed, GovJobs/NEOGOV, and employer requisitions).
  - Implemented guaranteed subscription teardown in `useEffect` in accordance with NASA JPL Rule 3 (Deterministic Resource Teardown).
- **Dynamic Metric Computation (Selectors 1, 2, 3, & 4)**:
  - **Selector 1 (Discovery Index)**: Replaced static hash simulation with dynamic matching against active ingested postings that match candidate's `targetRole`, skill taxonomy, and workplace preferences. Added a live pulse indicator badge displaying exact live match counts.
  - **Selector 2 (Privacy Guard Blocks)**: Dynamically cross-references the candidate's `profile.privacy.excludedCompanies` and `excludedIndustries` against company entities in the live job index, displaying active firewall intercept metrics.
  - **Selector 3 (Recruiter Connections)**: Computes distinct hiring organizations in the candidate's domain actively recruiting for their verified competencies.
  - **Selector 4 (Target Benefits Alignment)**: Replaced hardcoded lookup tables with live frequency aggregation across all ingested roles (`calculateLiveBenefitCoverage`). Shows exact counts of verified matching postings alongside gradient progress indicators.
- **Header Ingestion Indicator**:
  - Added an active telemetry pill in the analytics navigation bar indicating real-time connection to the ingestion pipeline (`{liveJobs.length} Ingested Roles Linked`).

---

## [0.5.25-dev.22] - 2026-09-30
### Fixed & Hardened (ITIL Service Transition - Incident Resolution)
- **Root Cause Analysis (RCA - macOS Chrome Default Handler for `mailto:`)**:
  - *Incident Description*: Clicking the "Launch Mail App" link on macOS opened a Google Chrome window rather than the user's desktop email application (e.g. Apple Mail).
  - *Direct Cause*: macOS delegates `mailto:` URL protocol schemes to whichever application is registered as the system's "Default email reader". When Chrome is registered as the default handler (or Chrome registers its internal web handler), macOS launches Chrome. Furthermore, direct `<a href="mailto:">` anchor tags in an iframe context can trigger top-level window interception.
- **Multi-Channel Dispatcher & Hidden Iframe Protocol Dispatch (`src/pages/AdminPanel.tsx`)**:
  - Implemented `handleLaunchMailApp` using a dynamically managed detached `<iframe>` to trigger the system protocol handler safely without spawning an orphaned browser window or disrupting the application frame.
  - Added direct webmail integration links for **"Open in Gmail (Web)"** and **"Open in Outlook (Web)"** pre-filling recipient, subject, invite code, and body directly in webmail tabs.
  - Preserved Selector 1 (`div:nth-of-type(3) > a:nth-of-type(1)`) as the primary "Launch Native Mail App" trigger.
  - Added an accessible macOS informational callout explaining how to reassign Apple Mail via **Mail.app > Settings > General > Default email reader**.

---

## [0.5.25-dev.21] - 2026-09-30
### Fixed & Hardened (ITIL Service Transition - Incident Resolution)
- **Root Cause Analysis (RCA - Staffing Invitation Delivery)**:
  - *Incident Description*: Administrators invited organization owners/recruiters through the Admin Panel, but invited recipients never received an email with the activation code.
  - *Direct Cause*: The application operates on client/Express architecture without direct outbound SMTP/transactional email integrations (SendGrid/Resend). The `handleSendInvite` routine generated the invite code and persisted it to Firestore (`staffing_invitations`), but displayed a misleading status *"Invitation sent to {email}"*, creating an expectation of automated email dispatch.
  - *Secondary Defect*: When admins copied the direct URL (`/#signup?invite=...`), hash routing strictly checked `hash === '#signup'`. The presence of URL query parameters caused exact string equality to fail, routing recipients to the generic `LandingPage` rather than `RegistrationFlow`.
- **Invitation Dispatch Dialog (`src/pages/AdminPanel.tsx`)**:
  - Implemented an accessible `Invitation Dispatch Dialog` modal that immediately displays upon token generation (and on-demand from any table row).
  - Provides a pre-composed professional executive invitation message with Subject, Token, Expiration, and Direct Activation URL.
  - Added a 1-click `Launch Mail App (mailto:)` button that opens the admin's default email client (Apple Mail, Outlook, Gmail) pre-filled with recipient, subject, and body.
  - Added 1-click `Copy Full Draft` and `Copy Link` clipboard utilities.
- **Table Row Enhancement & Interactive Code Badge (`src/pages/AdminPanel.tsx`)**:
  - Enhanced Selector 2 (`td:nth-of-type(1) > div:nth-of-type(2)`) to render an accessible high-contrast monospace code badge (`Code: {inv.inviteCode}`) with an inline click-to-copy action.
  - Added a `Mail` action trigger to the table row toolbar allowing instant re-dispatch of any existing token.
- **Deep Link & Parameter Auto-Fill (`src/App.tsx`)**:
  - Upgraded hash matching in `AppContent` from strict equality to prefix matching (`hash.startsWith('#signup')`, `hash.startsWith('#login')`).
  - Added query string extraction (`URLSearchParams`) in `RegistrationFlow` for `invite`, `email`, and `role`. Automatically selects the `Company / Firm` account type, activates `signup` mode, and pre-fills `inviteCode` and `email`.
- **Type Safety (`src/hooks/useAuth.tsx`)**:
  - Updated `AuthContextType` interface to explicitly declare optional `inviteCode` parameter on `signInWithGoogle`.

---

## [0.5.25-dev.20] - 2026-09-30
### Fixed & Hardened
- **Security Rules Hardening**: Resolved a "Missing or insufficient permissions" error when external recruitment firms attempted to request platform access.
  - Explicitly defined public `create` permissions for the `partner_requests` collection in `firestore.rules`.
- **Enterprise Gateway UI**: Redesigned the "External Recruiters" landing page card with a premium, high-contrast style.
  - Added "Enterprise Portal" badging and value-focused feature highlights.
  - Improved the "Request Firm Access" call-to-action with interactive micro-interactions.
- **Diagnostics**: Integrated detailed console logging into the registration and request pipelines to accelerate root cause analysis for authentication edge cases.

---

## [0.5.25-dev.19] - 2026-09-30
### Enhanced
- **Deep CSS Scraping (GovJobs)**: Significantly improved extraction accuracy for `governmentjobs.com`.
  - **Granular Summary Extraction**: Now explicitly scrapes the `.term-block` summary table to extract Salary, Job Number, Department, and Division using precise CSS selectors.
  - **Multi-Tab Content**: Updated `content.js` to capture both `#details-info` and `#details-benefits` to ensure a complete job profile is sent to the AI engine.
- **Robust Salary Parsing**: Enhanced `server.ts` to support complex salary ranges (Hourly and Annual) and non-standard number formatting common in public sector postings.

---

## [0.5.25-dev.18] - 2026-09-30
### Added & Enhanced
- **GovernmentJobs.com Support**: Integrated specialized support for `governmentjobs.com` into the ingestion bridge.
  - **Custom Selectors**: Added DOM selectors for `#job-title`, `#agency-name`, and `#job-details-info`.
  - **Manifest Permissions**: Expanded `host_permissions` and `matches` to include the `governmentjobs.com` domain.
  - **Backend Pipeline**: Wired the extension to use the `govjobs` board type on submission, leveraging the existing high-fidelity government sector NLP parser.

---

## [0.5.25-dev.17] - 2026-09-30
### Added & Enhanced
- **Manual Extension Triggers**: Added two new ways to trigger job ingestion beyond the injected button.
  - **Context Menu Integration**: Users can now right-click anywhere on a job page and select "Ascend to ATS" to trigger ingestion.
  - **Popup Ingestion Action**: Added an "Import Current Page" button to the extension toolbar popup for explicit manual control.
  - **Background Service Worker**: Implemented `background.js` to manage context menu registration and cross-script messaging.
  - **Messaging Protocol**: Enhanced `content.js` to listen for remote triggers from the background worker and popup script.

---

## [0.5.25-dev.16] - 2026-09-30
### Fixed & Hardened
- **Extension Injection Hardening**: Resolved issues where the "Ascend to ATS" button was not appearing on certain LinkedIn/Indeed dynamic layouts.
  - **Aggressive MutationObserver**: Updated `content.js` to observe all DOM changes and attempt re-injection.
  - **Polling Fallback**: Added a 3s polling interval as a fail-safe for SPA-style page transitions.
  - **Expanded Selectors**: Integrated more robust DOM selectors and fallback containers for both LinkedIn and Indeed.
  - **URL Broadening**: Updated `manifest.json` to match a wider range of subdomains and paths.

---

## [0.5.25-dev.15] - 2026-09-30
### Fixed
- **Extension Asset Fix**: Generated the missing `icon128.jpg` asset and synchronized `manifest.json` to resolve the "Could not load manifest" error during side-loading.

---

## [0.5.25-dev.14] - 2026-09-30
### Added & Enhanced
- **Browser Extension (Ingestion Bridge)**: Developed a cross-browser extension (Chrome/Opera/Safari) for seamless job ingestion.
  - **Approach 1 Implementation**: Content script injection adds an "Ascend to ATS" button directly to LinkedIn and Indeed top cards.
  - **In-Page Review Overlay**: Users can verify and edit extracted titles and company names before committing to the server.
  - **Source-Specific Scrapers**: Implemented DOM-specific selectors for `.jobs-description` (LinkedIn) and `#jobDescriptionText` (Indeed).
- **Server-Side Ingestion Logic**: Updated `/api/ingest-job` to support `linkedin` and `indeed` board types with specialized NLP preprocessing.
- **Documentation**: Published `Docs/Extension_Installation.md` with side-loading instructions for developers.

---

## [0.5.25-dev.13] - 2026-09-28
### Added & Enhanced
- **Recruiter Redirection Engine**: Enhanced the landing page with a high-fidelity "External Recruiters" call-to-action to redirect sourcing requests from Dice, LinkedIn, and Glassdoor into a managed partner request pipeline.
- **Routing & State Management**:
  - Added `#partner-request` deep-link support to `App.tsx` for direct access to the recruiter validation form.
  - Implemented component-level remounting logic in `RegistrationFlow` using React keys to ensure clean state transitions between registration modes.
- **Security Hardening (8 Pillars)**: Re-architected `firestore.rules` using the "Eight Pillars" methodology, implementing a global safety net, deterministic `isAdmin` checks, and granular per-collection write invariants.
- **Database Schema Audit**: Synchronized `firebase-blueprint.json` with the production collection registry, adding formal definitions for `PartnerRequest` and `StaffingInvitation` entities.

---

## [0.5.25-dev.12] - 2026-09-28
### Added & Enhanced
- **External Partner Request System**: Implemented a specialized capture funnel for external recruiters (Dice, LinkedIn, Glassdoor) to request platform access.
  - **Recruiter Request UI**: Integrated a "No code?" toggle in the company registration flow, allowing recruiters without an invite token to submit their credentials, referral source, and job details.
  - **Admin Request Workspace**: Added a "Partner Requests" management tab in the Admin Panel to review incoming recruiter submissions, with one-click transition to the invitation workflow.
  - **Asynchronous Persistence**: Requests are stored in a new `partner_requests` Firestore collection with full audit metadata (source, status, timestamp).

---

## [0.5.25-dev.11] - 2026-09-28
### Added & Enhanced
- **High-Fidelity Landing Page**: Developed a comprehensive marketing gateway at the root route for unauthenticated users.
  - **Dynamic Visuals**: Integrated custom AI-generated 16:9 and 4:3 assets for Hero, Matching, Admin, and Partnership sections.
  - **Conversion Funnel**: Sequence-based visual storytelling (Proposition -> Capabilities -> Proof -> Action) following elite design references.
  - **SEO & Routing**: Adjusted hash-based routing in `App.tsx` to serve `LandingPage` as the default state while preserving `#login` and `#signup` access.
- **Project Documentation Audit**:
  - **README.md Refactor**: Completely re-written to emphasize "Key Value Pillars" (Hybrid Auth, Matching Engine, Deep Profile Engineering) and safety-critical architecture.
  - **STRUCTURE.md Sync**: Updated the source tree manifest to include the new `LandingPage` component.

---

## [0.5.25-dev.10] - 2026-09-28
### Added & Enhanced
- **Password Recovery Pipeline**: Implemented a "Forgot Password" feature within the login portal. Users can now trigger standard Firebase password reset emails directly from the authentication UI.
- **Robust Branding Assets**: Replaced external Google logo references with high-fidelity inline SVGs to eliminate "broken image" failures caused by network filtering in restricted environments.
- **Auth UI Feedback**: Added dynamic success banners to provide clear confirmation when password reset emails are successfully dispatched.

---

## [0.5.25-dev.9] - 2026-09-28
### Added & Enhanced
- **Hybrid Authentication Engine**: Re-engineered the registration and login flows to support both Google OAuth and traditional Email/Password credentials.
  - **Secure Email Auth**: Implemented `signInWithEmail` and `signUpWithEmail` in `useAuth.tsx` with robust error handling and Firebase persistence.
  - **Company Validation Protocol**: Integrated the **Staffing Invite System** into the onboarding flow. New "Company / Firm" accounts are now programmatically required to provide a valid invite code from the Admin Portal before registration is finalized.
  - **Unified Brand Experience**: Updated the login UI with official Google branding and a sleek, high-contrast design matching the platform's distinctive aesthetic.
  - **Type Safety**: Expanded the `AppUser` interface to support dynamic staffing metadata (`staffingFirmName`).

---

## [0.5.25-dev.8] - 2026-09-28
### Added & Enhanced
- **Admin Portal UI Consolidation**: Re-architected the `AdminPanel.tsx` layouts to maximize screen real estate and improve operational efficiency.
  - **Simulation Engine Integration**: Merged bulk seeding and industry-specific injection into a single "Dynamic Data Simulator" card with a contextual dataset dropdown.
  - **Invitation Workspace Hardening**: Consolidated the partner invitation form and the managed access registry into a unified "Partner Onboarding Control" view.
  - **Link Generation**: Implemented a "Copy Invite Link" feature for administrators, replacing manual code sharing with automated UTM-tracked onboarding URLs.
- **Footer De-Cluttering**: Removed the "Developer Seeder" link from `Footer.tsx` across all account types to streamline the public interface while maintaining secure navbar access for administrators.

---

## [0.5.25-dev.7] - 2026-09-28
### Added & Enhanced
- **Staffing Firm Invitation System**: Implemented a secure gateway for onboarding strategic staffing partners.
  - Added `StaffingFirm` and `StaffingInvitation` interfaces to core types.
  - Developed **Invitation Gateway** in `AdminPanel.tsx` with unique invite codes and automated UTM tracking (`utm_source=admin_portal`).
  - Implemented **One-Click Acceptance** logic in both `JobSeekerDashboard` and `EmployerDashboard` via URL search parameters.
  - Added **Temporary Access Overrides**: Users with `staffingRole` of `owner` or `admin` can now bypass standard profile locks in `CompanyManagement.tsx` to edit mission-critical organization data.

---

## [0.5.25-dev.6] - 2026-09-28
### Added & Enhanced
- **Strict Admin Authorization (JPL Rule 7)**: Implemented hardcoded authorization checks for platform administrative functions.
  - Restricted `AdminPanel` (Seeder) and associated routes to `Chris.Barnes.2000@me.com` and UID `393uzPXnOdPW3CE3rdhmDMEldzm1`.
  - Removed `Admin Panel` and `Developer Seeder` links from Navigation and Footer for all non-admin account types.
  - Added multi-layered defense-in-depth: conditional UI rendering, route-level protection in `AppContent`, and internal component-level auth guards in `AdminPanel.tsx`.

---

## [0.5.25-dev.5] - 2026-09-28
### Added & Enhanced
- **GovJobs Bridge Integration**: Launched a specialized integration for public sector job boards (NEOGOV/GovernmentJobs.com).
  - Created `GovJobsBridge.tsx` component for high-fidelity job ingestion and mirroring.
  - Implemented `govJobsNlpParse` in `server.ts` with specific RegEx for Job Numbers, Departments, and Hourly-to-Annual salary normalization.
  - Updated `Job` and `JobTemplateBenchmark` types to support `jobNumber` and `department` fields.
  - Published `Docs/GovJobs_Bridge_Integration_Guide.md` and initialized the corresponding roadmap.
- **Root-Cause Analysis & Verification**:
  - Verified parsing logic against the Pierce County example listing.
  - Ensured WCAG AA compliance on the new Bridge UI workspace.

---

## [0.5.25-dev.4] - 2026-09-21
### Added & Enhanced
- **Favicon Set Adaptation**: Generated and adapted the new high-fidelity trust emblem into a full PWA-compatible asset suite (`favicon.png`, `apple-touch-icon.png`, `pwa-192x192.png`, `pwa-512x512.png`). Updated `index.html` to reference the full icon set for improved mobile/desktop device compatibility.
- **Root-Cause Analysis & Verification**: Conducted linter and build verification of asset updates.

---

## [0.5.25-dev.3] - 2026-09-21

## [0.5.25-dev.2] - 2026-09-21
### Engineering Governance & Architecture
- **Added Safety Governance Documents**:
  - `/Docs/DELEGATION_AND_CHECKIN.md`: 5-Point Delegation Checklist & Check-In Protocol.
  - `/Docs/FSD_SPECIFICATION.md`: Functional Specification Standard (IEEE 830 & Stanford FSD).
  - `/Docs/ITIL_GOVERNANCE.md`: ITIL v4 Service Management & Change Enablement Policy.
  - `/Docs/SPRINT_CEREMONIES.md`: Agile Sprint Ceremonies, Story Points & Kaizen Retrospective Engine.
  - `/Docs/CHANGELOG_DEV.md`: High-frequency engineering log and version promotion tracker.
- **Root-Cause Analysis & Verification**:
  - Conducted full audit against updated instructions: NASA JPL Power of 10 safety constraints, WCAG 2.1/2.2 AA accessibility, file limits (<500/1000 lines), and 0-error TypeScript compilation.

---

## [0.5.25-dev.1] - 2026-09-21
### Added & Enhanced
- **RapportVerse Strategic Bridge**: Created `/src/pages/RapportVersePage.tsx` with dedicated `#rapportverse` and `#trust-network` routes.
- **Dunbar Trust Radar**: Concentric SVG radar mapping Dunbar 5, 15, 50, and 150 topologies.
- **Trust Equation Simulator**: Real-time slider engine evaluating David Maister's $(C+R+I)/S$ quotient.
- **Ecosystem Exporter**: JSON schema exporter (`rapportverse-trust-topology.json`) and webhook sync validator.
- **Integration Guide**: Published `/Docs/RapportVerse_Bridge_Integration_Guide.md` for external partner integration.
