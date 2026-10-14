# Developer Changelog (High-Frequency Engineering Log)

This internal engineering log records granular development actions, architecture refactoring, diagnostic findings, ITIL service management changes, and test execution details on every development turn.

---

## [0.5.30-dev.1] - 2026-10-13
### Implemented Approach A: Multi-Provider Cascading Logo Engine & Tokenized Word Matching
- **Context & Diagnostic Finding**:
  - In `JobSeekerDashboard.tsx` and employer detail surfaces, company logos were falling back to a generic gray `<Briefcase>` SVG icon.
  - Root cause: `CompanyLogo.tsx` relied strictly on `logo.clearbit.com`, which deprecated unauthenticated free public access and returns 403/404/CORS blocks in browser sandboxes. Additionally, `domainMap` only supported 11 hardcoded lowercase strings; names like `"Tacoma Public Utilities"`, `"City of Tacoma - Tacoma Public Utilities (TPU)"`, or `"The Boeing Company"` failed the exact lookup and fell back to broken domains.
- **Implementation of Approach A (`src/utils/companyLogoResolver.ts`)**:
  - **Tokenized Word & Alias Matching**:
    - Scrubs corporate noise tokens (`inc`, `llc`, `corp`, `corporation`, `co`, `company`, `ltd`, `holdings`, `services`, `group`, `technologies`, `systems`, etc.) and grammatical stop words (`of`, `the`, `and`, `for`, `at`, `in`).
    - Resolves known municipal, regional, and national employers:
      - `"TPU"`, `"Tacoma Public Utilities"`, `"Tacoma Power"`, `"Tacoma Water"` $\rightarrow$ `mytpu.org`
      - `"City of Tacoma"`, `"Tacoma WA"` $\rightarrow$ `cityoftacoma.org`
      - `"Pierce County"` $\rightarrow$ `piercecountywa.gov`
      - `"Salal Credit Union"`, `"Salal CU"` $\rightarrow$ `salalcu.org`
      - `"Boeing"`, `"The Boeing Company"` $\rightarrow$ `boeing.com`
      - `"Bank of America"`, `"BofA"` $\rightarrow$ `bankofamerica.com`
      - `"Microsoft"` $\rightarrow$ `microsoft.com`, `"Amazon"` / `"AWS"` $\rightarrow$ `amazon.com`, `"Google"` $\rightarrow$ `google.com`, etc.
    - Title-derived employer brand inference: When `companyName` is empty, `"Confidential Client"`, or generic, infers the employer brand from `jobTitle`.
  - **Cascading Multi-Tier Resolution State Machine**:
    - **Tier 1 (Primary)**: Google High-Resolution Favicon CDN (`https://www.google.com/s2/favicons?domain=${domain}&sz=128`), providing instant, authenticated-free icons for `.gov`, `.org`, and `.com` domains.
    - **Tier 2 (Secondary)**: UI-Avatars lettermark fallback (`https://ui-avatars.com/api/?name=${initials}&background=${hex}&color=ffffff&bold=true&size=128`).
    - **Tier 3 (Local Offline Monogram)**: Deterministic, high-contrast SVG Lettermark monogram generated from company initials with WCAG AA compliant color gradients derived from string hash. Eliminates generic gray briefcase icons completely.
- **Component Enhancements**:
  - `src/components/CompanyLogo.tsx`: Refactored with cascading error state machine (`primary` $\rightarrow$ `secondary` $\rightarrow$ `monogram`), confidential client lock state, and lazy loading.
  - `src/pages/JobSeekerDashboard.tsx`: Passed `jobTitle={job.title}` to `<CompanyLogo>` for intelligent title-derived brand inference.
  - `src/components/CleanEmployerContactCard.tsx`: Replaced static building icon with `<CompanyLogo companyName={displayEmployerName} size="sm" />`.
  - `src/services/jobIngestion.service.ts`: Updated `fetchCompanyLogo` to use `resolveCompanyBranding`.
  - Bumped `package.json` and `src/config.ts` version to `0.5.30`.
- **Automated Verification & Scorecard Audit**:
  - Created `tests/unit/companyLogoResolver.test.ts` covering 7 test scenarios (regional/national alias matching, title-derived brand inference, noise token scrubbing, monogram initials generation, deterministic WCAG AA colors, payload generation, and boundary conditions).
  - Registered in `tests/runAllTests.ts`. 19/19 test suites passed with 100% green assertions.
  - Logged Audit Record `AUD-2026-004` in `Docs/INDEX_AUDIT.md`. Updated `Docs/STRUCTURE.md`.

---

## [0.5.29-dev.2] - 2026-10-13
### Implemented Approach A: Cohesive Paragraph Buffering & Pre-Parser Whitespace Normalization
- **Context & Problem Statement**:
  - In `JobDescription.tsx` / `JobContentPreview.tsx`, job descriptions with word-wrapped lines or copy-pasted text were being split line-by-line into separate block spans (`<span className="block my-3">`).
  - This resulted in severe vertical spacing fragmentation (e.g. 8 broken span elements for a single 8-line paragraph), huge gaps, unnatural breaks between sentences, and excess blank lines.
- **Implementation of Approach A (`src/utils/textWhitespaceNormalizer.ts`)**:
  - **Pre-Parser Whitespace Normalization (`normalizeJobContentWhitespace`)**:
    - Converts Windows CRLF (`\r\n`) and legacy CR (`\r`) to standard Unix newlines (`\n`).
    - Strips non-breaking spaces (`\u00A0`, `\u2007`, `\u202F`) and zero-width non-printing characters (`\u200B-\u200D`, `\uFEFF`).
    - Scrubs trailing horizontal spaces and tabs from every individual line (`line.trimEnd()`).
    - Collapses excessive blank lines (`\n{3,}`) down to standard double newline paragraph delimiters (`\n\n`), preventing giant blank spaces while preserving intentional paragraph breaks.
    - Collapses excessive repeated horizontal whitespace inside lines while respecting code block indentation.
  - **Cohesive Paragraph Buffering (`parseCohesiveBlocks`)**:
    - Buffers consecutive wrapped text lines into unified paragraphs instead of fragmenting into separate block elements.
    - Replaces DOM fragmentation (8 separate `<span className="block my-3">`) with a single cohesive `<span className="block my-2.5 sm:my-3">` element containing the complete paragraph.
    - Preserves 100% of markdown and rich text formatting: headings (`#`, `##`, `###`, `####`), bullet lists (`*`, `-`, `•`, `+`), indented bullet continuation lines, numbered lists (`1.`, `2.`), blockquotes (`>`), code blocks (```` ``` ````), and horizontal rules (`---`).
- **Component Integration (`src/components/JobContentPreview.tsx`)**:
  - Refactored `renderRichSections()` to map over `parseCohesiveBlocks(content, maxLines)`, simplifying component logic, eliminating redundant state variables, and reducing file length to 436 lines.
  - Enhanced `stripMarkdownFormatting` and `renderMarkdownMode` with pre-parser normalization so raw text and markdown views are clean and free of rogue control characters.
  - Updated `STATIC_CONFIG.APP.VERSION` to `'0.5.29'` in `src/config.ts`.
- **Roadmap Integration (Approach C)**:
  - Documented **Global Ingestion Normalization Pipeline (Approach C)** in `Docs/INDEX_ROADMAP.md` as a planned pipeline phase scheduled for rollout upon the upcoming test postings database wipe.
- **Automated Verification**:
  - Created `tests/unit/textWhitespaceNormalizer.test.ts` covering 6 test scenarios (Unicode normalization, 8-line paragraph unification, multi-paragraph separation, full markdown preservation, raw text extraction, and boundary conditions).
  - Wired into `tests/runAllTests.ts`. Full test suite passes with 100% green assertions.

---

## [0.5.29-dev.1] - 2026-10-13
### Milestone Release Promotion & Location Requirements Sanitizer (TPU / City of Tacoma Hybrid Flagging)
- **Milestone Release Cut [v0.5.29]**:
  - Promoted unreleased engineering iterations `0.5.28-dev.1` through `0.5.28-dev.20` into public milestone `[0.5.29]` in `Docs/CHANGELOG.md`.
  - Bumped `package.json` version from `0.5.28` to `0.5.29`.
- **Location Requirements Sanitizer & Municipal Normalization (`src/utils/locationAndWorkplaceSanitizer.ts`)**:
  - Hardened location normalization for municipal and utility entities (City of Tacoma, Tacoma Public Utilities / TPU, Tacoma Power, Tacoma Water, Pierce County) mapping them deterministically to `Tacoma, WA`.
  - Expanded regex patterns for customer travel (`travel to customer`, `client site visits`, `field operations`) and partial in-office schedules (`partial in-office`, `telework agreement`, `office presence required`).
  - Added deterministic override ensuring TPU / City of Tacoma roles with customer travel or partial in-office requirements are accurately categorized as **Hybrid** rather than deceptive "Remote" defaults.
- **Visual Workplace & Requirement Badges (`JobSeekerDashboard.tsx` & `JobDescription.tsx`)**:
  - Implemented high-contrast, accessible badges (`[HYBRID]` in purple, `[ON-SITE]` in amber, `[REMOTE]` in emerald) with specific requirement notices (e.g., `Partial In-Office`, `Travel Required`).
  - Rendered dedicated travel requirement alert banners (`🚗 Travel to customer sites required`) whenever customer site visits are detected.
  - Replaced hardcoded "Remote" tag in `JobDescription.tsx` with dynamic `locInfo` computed from `parseAndSanitizeLocationAndWorkplace(job)`.
- **Automated Verification**:
  - Added Test 5 to `tests/unit/locationAndWorkplaceSanitizer.test.ts` asserting TPU City of Tacoma role with customer travel/partial in-office overrides raw Remote tag to Hybrid (Tacoma, WA).
  - Executed full test suite (`npm test`), linter (`tsc --noEmit`), and applet compilation (`compile_applet`) with 100% green status.

---

## [0.5.28-dev.20] - 2026-10-13
### Added & Enhanced (Defensive Salary Sanitizer & Market Insights Top 5 In-Demand Skills Expansion)
- **Problem Statement**: 
  - Market Insights Average Matched Salary was severely skewed ($1,839,398) due to unnormalized cent-stored integers (e.g., $105,643.20 stored as 10564320 or $98,280 stored as 9828000) and unannualized hourly rates.
  - Market Insights only displayed a single in-demand skill instead of a multi-ranked view.
- **Architectural Solution & Remediation**:
  - **`src/utils/salarySanitizer.ts`**:
    - Created `normalizeJobSalaryValue` to detect and divide cent-stored salaries (>500,000 by 100), annualize hourly wages (<150 by 2080), clamp extreme database outliers [30k, 250k], and provide safe fallbacks.
  - **`JobSeekerDashboard.tsx` & `JobDescription.tsx`**:
    - Normalized salaries in Top Match cards and Job Details pages.
    - Updated Market Insights Average Salary calculation to compute the true normalized mean across matching positions.
    - Expanded Market Insights from 1 skill to **Top 5 Skills in Demand**, rendering numerical rank badges (1–5), skill titles, and role counts.
  - **`tests/unit/salarySanitizer.test.ts` & `tests/runAllTests.ts`**:
    - Added dedicated unit tests covering cent-stored conversion, hourly wage annualization, normal values, fallbacks, and boundary clamping.
  - **Automated Verification**:
    - 100% test suite pass across all suites, zero linter issues (`tsc --noEmit`), and clean applet compilation.

## [0.5.28-dev.19] - 2026-10-13
### Added & Enhanced (Sidebar Removal on Application Pipeline View & Dynamic Market Insights Aggregation)
- **Problem Statement**: The Application Pipeline view required a clean, full-width canvas without the right-hand sidebar. Furthermore, Market Insights needed robust dynamic data aggregation rather than static placeholders.
- **Architectural Solution & Remediation**:
  - **`JobSeekerDashboard.tsx`**:
    - Conditionally omitted the sidebar when `view === 'pipeline'`, allowing the application Kanban/table pipeline to occupy full width (`lg:col-span-3`).
    - Implemented dynamic data aggregation for Market Insights: computing real rolling average salary ranges and top in-demand skills from active matching job postings.
  - **Automated Verification**:
    - Ran full test suite (`npm test`), linter (`tsc --noEmit`), and build compilation (`compile_applet`) with 100% green status and zero errors.

## [0.5.28-dev.18] - 2026-10-13
### Added & Enhanced (Candidate Job Ignore Option & Automatic Company Exclusion List Integration)
- **Problem Statement**: Candidates needed exclusion lists for companies and industries so that when they indicate they are not interested in a role, the platform automatically adds the company to their privacy firewall exclusion list (`privacy.excludedCompanies`), preventing future postings from appearing without requiring repeated manual reporting.
- **Architectural Solution & Remediation**:
  - **`src/components/IgnoreJobModal.tsx`**:
    - Integrated automated inclusion of the ignored job's company name into the user's Firestore profile privacy exclusion list (`privacy.excludedCompanies` via `arrayUnion`) when ignoring a role.
    - Provided an explicit toggle option (`[x] Add "{companyName}" to Excluded Companies`) so candidates can choose to block future postings from that employer permanently.
  - **Automated Verification**:
    - Ran full test suite (`npm test`), linter (`tsc --noEmit`), and build compilation (`compile_applet`) with 100% green status and zero errors.

## [0.5.28-dev.17] - 2026-10-13
### Added & Enhanced (Company Logo Component with Clearbit Integration & Placeholder Fallback)
- **Problem Statement**: Company logos (such as Bank of America and other enterprise employers) were either missing or failing to load correctly due to missing image sources or dead URLs, lacking a robust fallback to the standard placeholder icon.
- **Architectural Solution & Remediation**:
  - **`src/components/CompanyLogo.tsx`**:
    - Created a dedicated `CompanyLogo` component featuring automated domain mapping (e.g. Bank of America → `bankofamerica.com`) and Clearbit logo fetching (`https://logo.clearbit.com/...`).
    - Implemented a robust `onError` handler that gracefully falls back to the clean Briefcase placeholder icon whenever a company logo fails to load or cannot be found.
  - **`JobSeekerDashboard.tsx`**:
    - Integrated `CompanyLogo` into all top match cards.
  - **Automated Verification**:
    - Ran full unit test suite (`npm test`), linter (`tsc --noEmit`), and build compilation (`compile_applet`) with 100% green status and zero errors.

## [0.5.28-dev.16] - 2026-10-13
### Added & Enhanced (Mobile Top Match Card Compaction & Overhang Fix)
- **Problem Statement**: Top match cards on mobile viewports suffered from right-side overhang (`w-full max-w-full overflow-hidden`), insufficient side padding, and oversized titles that caused text truncation or horizontal scrolling issues on small screens.
- **Architectural Solution & Remediation**:
  - **`JobSeekerDashboard.tsx` (Top Match Cards)**:
    - Added explicit box-sizing and containment rules (`w-full max-w-full overflow-hidden box-border`) so cards stick strictly to their parent containers without right-side overhang.
    - Responsive card padding (`p-4 sm:px-6 md:p-8`).
    - Scaled down title font sizes (`text-base sm:text-lg md:text-xl`) and added `truncate` utility to fit smaller screens gracefully.
  - **Automated Verification**:
    - Ran full unit test suite (`npm test`), linter (`tsc --noEmit`), and build compilation (`compile_applet`) with 100% green status and zero errors.

## [0.5.28-dev.15] - 2026-10-13
### Added & Enhanced (Mobile-First Responsive Padding & Viewport Overhaul)
- **Problem Statement**: Mobile viewports experienced cramped horizontal padding and fixed desktop container sizing (`w-[75vw]`), making content difficult to inspect and touch targets uncomfortably close to screen edges.
- **Architectural Solution & Remediation**:
  - **`JobDescription.tsx` & `JobSeekerDashboard.tsx`**:
    - Replaced rigid desktop container widths and narrow padding (`px-4`) with robust responsive mobile-first padding classes (`px-4 sm:px-6 md:px-8 max-w-7xl mx-auto`).
    - Ensured fluid spacing and clear touch target boundaries on mobile screens.
  - **Automated Verification**:
    - Ran full unit test suite (`npm test`), linter (`tsc --noEmit`), and build compilation (`compile_applet`) with 100% green status and zero errors.

## [0.5.28-dev.14] - 2026-10-12
### Fixed & Enhanced (DeepSeek Parser Audit Fixes & Test Fixture Suite)
- **Problem Statement & Audit Findings**:
  - Company name extraction occasionally captured stopword phrases like `will be used to fill` or `our Tukwila Branch` instead of the actual entity (`City of Tacoma` / `Salal Credit Union`).
  - Location parsing captured standalone label artifacts like `Location`.
  - Recruiter footer disclaimers and placeholder recipient emails (`<chris.barnes.2000@me.com>`) required robust scrubbing.
- **Architectural Solution & Remediation**:
  - **`src/utils/diceBoilerplateScrubber.ts`**:
    - Added comprehensive stopword phrase filters (`COMPANY_STOPWORDS`) to reject invalid company extractions and fall back to footer `Employer:` blocks or official web domains.
    - Added location artifact scrubbers to filter out standalone `Location`, `Remote`, `Address`, and `N/A` text lines.
    - Added recipient email placeholder and confidentiality notice strippers.
  - **`tests/unit/parserAuditFixtures.test.ts`**:
    - Created a dedicated test fixture suite validating company resolution and location artifact cleanup across sample postings.
    - Integrated into `tests/runAllTests.ts`. All test suites passed successfully with zero failures.

## [0.5.28-dev.13] - 2026-10-12
### Added & Documented (Parsing Engine Summary for DeepSeek Token Optimization)
- **Problem Statement**: Needed a comprehensive architectural summary of all ingestion and parsing engines (Dice, CSV bulk exports, JSON resumes, PDF documents, Dice boilerplate scrubbers) to facilitate prompt engineering and dev token optimization with DeepSeek.
- **Architectural Deliverable**:
  - Created `/Docs/PARSING_ENGINE_SUMMARY.md` and artifact `.aistudio/artifacts/brain/6e60562a-a817-4e58-a637-e0a28adad44f/parsing_engine_summary.md` detailing regex patterns, normalizers, token efficiency targets, and deterministic pre-filtering strategies.
  - Updated `/Docs/STRUCTURE.md`.

## [0.5.28-dev.12] - 2026-10-12
### Added & Enhanced (Dice Boilerplate Scrubber & Clean Employer Contact Card UI)
- **Problem Statement**: Ingested job postings from job boards (such as Dice) frequently include email privacy disclaimers ("WHY DOES THE SENDER'S EMAIL ADDRESS LOOK SO STRANGE?", "To unsubscribe from future emails", "Dice will never share your email", "Get the Dice app"), footer footers, and unstructured address/phone strings that cluttered the job description view.
- **Architectural Solution & Implementation**:
  - **`src/utils/diceBoilerplateScrubber.ts`**: Created a comprehensive regex heuristic and blocklist parser that strips out Dice email disclaimers and footers while extracting clean entity names, department headers, physical address lines, official phone numbers, and website URLs.
  - **`src/components/CleanEmployerContactCard.tsx`**: Created a production-grade, WCAG 2.1 AA compliant collapsible employer card rendering verified entity names, physical addresses, direct telephone links, and official portals.
  - **Integration**: Integrated `CleanEmployerContactCard` into `JobDescription.tsx` (candidate view) and `AdminPostDetailsModal.tsx` (admin inspection view).
  - **Automated Testing & Verification**: Created `tests/unit/diceBoilerplateScrubber.test.ts` and integrated it into `runAllTests.ts`. All test suites passed successfully with zero errors.

## [0.5.28-dev.11] - 2026-10-12
### Fixed & Remediated (Firestore Undefined Payload Suppression, Optional vs Required UI/UX, & Candidate Version Audit Trail)
- **Problem Statement & RCA**:
  - `updateDoc` crashed with `FirebaseError: Unsupported field value: undefined (found in field posterFirmName in document jobs/text-c6a98cb7d3ad812b)` when an admin validated a job where optional fields (e.g. `posterFirmName`, `salaryMin`, `salaryMax`) were empty strings or cleared, which evaluated to `undefined` in the update payload.
  - The validation diff window lacked clear visual distinctions between required fields (legal company, job title, workplace mode) and optional fields (staffing agency, headquarters location, salary bounds).
  - Admin validation corrections were not writing to `revisions` or triggering semantic version increments (`JobRevision`), leaving candidates unable to see verified company updates in their Version History & Audit Trail.
- **Architectural Solution & Remediation**:
  - **`AdminJobValidationModal.tsx`**:
    - Integrated `sanitizeFirestorePayload` to strip all `undefined` values recursively before dispatching `updateDoc`.
    - Applied `deleteField()` for empty `posterFirmName`, `salaryMin`, or `salaryMax` so invalid values (e.g. `"our Tukwila Branch"`) are cleanly pruned from Firestore rather than causing runtime crashes.
    - Added `JobRevision` tracking in `handleSave` with `detectMaterialShifts`, semantic version bumping, and `revisions: arrayUnion(newRevision)`.
    - Overhauled Right Column UI/UX:
      - Displayed explicit **[Required]** badges on Validated Company Name, Job Title, and Workplace Mode.
      - Displayed explicit **[Optional]** badges on Posted / Managed By Firm, Location, and Salary Bounds.
      - Added field helper explanations and a **Clear Agency** action.
      - Added Candidate Audit Version preview (`<History /> Next Candidate Audit Version: vX.Y.Z`) in the modal footer.
  - **`src/pages/JobDescription.tsx`**:
    - Updated Candidate Version History modal timeline to render hiring entity corrections (`previousValues.companyName ➔ newValues.companyName`) and recruiting agency updates with defensive timestamp formatting.
  - **`src/utils/materialShiftEngine.ts`**:
    - Added company and recruiter agency verification detection to `detectMaterialShifts` with 0 risk points and semantic patch bump.
  - **Automated Testing & Verification**:
    - Added Invariant 6 to `tests/unit/jobModerationAndNlpGuards.test.ts` asserting undefined field suppression and candidate `JobRevision` structure.

## [0.5.28-dev.10] - 2026-10-12
### Added & Enhanced (Post Details Action Bar & Uncut Context Expansion - Approach 1)
- **Problem Statement**: In `AdminJobValidationModal.tsx`, the posting context window artificially sliced job descriptions at 450 characters (`job.description?.slice(0, 450)`), cutting off critical company names, recruiter signatures, and contract terms before admins could inspect them. Furthermore, there was no direct action bar option to inspect the complete post details.
- **Architectural Solution (Approach 1 - Integrated Dual-Surface Post Details & Auto-Expandable Context)**:
  - **`AdminPostDetailsModal.tsx`**: Created modular dedicated full requisition inspection modal featuring:
    - Complete uncut job description viewer (no character cap).
    - Requirements, qualifications, and skills catalog inspector.
    - Status, requisition ID, workplace mode, report counts, and transparency badges.
    - External tab launch link to live public job page (`#job/${job.id}`).
    - Full WCAG 2.1/2.2 AA compliance: Escape key dismiss, accessible contrast, ARIA dialog attributes.
  - **`AdminJobValidationModal.tsx`**:
    - Removed `slice(0, 450)` artificial text truncation in the left column posting context snippet.
    - Implemented interactive Expand/Compact toggle with dynamic max-height (`max-h-96` expanded / `max-h-44` compact) and character count indicator.
    - Added **"View Post Details"** action button to the modal footer action bar and a quick "Full Requisition" launcher in the context header.
  - **`AdminJobModerationTab.tsx`**:
    - Added **"View Post"** action link directly within each queue card to allow admins to inspect public job postings in a new tab without opening diffs first.
  - **Automated Test Expansion**:
    - Added Invariant 5 to `tests/unit/jobModerationAndNlpGuards.test.ts` verifying description length preservation (>1500 chars), non-truncation past 450 chars, and deep link route integrity.
  - **Documentation**:
    - Updated `STRUCTURE.md` registering `AdminPostDetailsModal.tsx`.

## [0.5.28-dev.09] - 2026-10-12
### Fixed & Remediated (ITIL Incident Management & RCA - Job Reports Security Rule Provisioning)
- **Incident Summary**: When candidates or recruiters attempted to submit a job report via `ReportJobModal.tsx`, Firestore threw `FirebaseError: Missing or insufficient permissions`.
- **Root Cause Analysis (RCA)**:
  - While the client-side reporting modal and Firestore write logic (`setDoc(doc(db, 'job_reports', reportId), cleanPayload)`) were implemented in `0.5.28-dev.08`, the Firestore security rules in `firestore.rules` and intermediate representation in `firebase-blueprint.json` lacked explicit rules for the newly introduced `/job_reports/{reportId}` collection path.
  - Due to the global safety net (`match /{document=**} { allow read, write: if false; }`), writes to non-declared collections were rejected by Firestore as unpermitted operations.
- **Remediation & Hardening**:
  - **`firebase-blueprint.json`**: Added `JobReport` entity definition with validation schema and mapped `job_reports/{reportId}` to Firestore config.
  - **`firestore.rules`**: Added rule block for `match /job_reports/{reportId}`:
    - `allow create: if true;` (enabling candidate and recruiter reports across authenticated and guest sessions).
    - `allow read: if isAdmin() || (isSignedIn() && resource.data.reporterUid == request.auth.uid);`.
    - `allow update, delete: if isAdmin();` (allowing administrators to review, resolve, and dismiss reports).
    - Updated `match /jobs/{jobId}` to allow public read and permit flagging updates (`flaggedForReview`, `reportCount`) from job report submissions.
  - **Deployment**: Successfully deployed updated rules via `deploy_firebase` and `fax.DeployRules` RPC action.
- **Verification Gate**:
  - `lint_applet` (`tsc --noEmit`) passed with 0 errors.
  - `npm test` passed 100% across all 13 suites.
  - `compile_applet` production build succeeded.

---

## [0.5.28-dev.08] - 2026-10-12
### Added & Hardened (ITIL Service Transition - Job Validation Diff Window, Multi-Role Reporting & NLP Guardrails)
- **Candidate & Recruiter Reporting System (`src/components/ReportJobModal.tsx`)**:
  - Implemented accessible reporting modal with WCAG 2.1/2.2 AA compliant focus trapping and escape dismissal.
  - Multi-role support for candidates and recruiters to report incorrect company names, misparsed recruiter/managed-by entities, broken descriptions, and suspicious postings.
  - Optional inputs for submitting proposed corrections (actual company name, actual staffing firm name, and explanatory notes).
  - Persists structured reports to Firestore `job_reports` collection and atomically flags the corresponding job document (`flaggedForReview: true`, `reportCount: increment(1)`).
- **Subtle Report Actions in UI Surfaces (`src/pages/JobSeekerDashboard.tsx` & `src/pages/JobDescription.tsx`)**:
  - Added subtle `<Flag className="w-3 h-3" />` Report button on every job card in `JobSeekerDashboard.tsx` alongside company and managed-by tags.
  - Added prominent "Report Posting" button in the action header bar of `JobDescription.tsx` next to role clarification request.
- **Admin Side-by-Side Validation Diff Window (`src/components/admin/AdminJobValidationModal.tsx`)**:
  - Left Column (Ingested Snapshot): Read-only view of original ingested company name, poster firm, job title, workplace, salary, raw posting snippet, and reporter's submitted notes and suggestions.
  - Right Column (Live Editable Corrections): Form inputs for company name, poster firm name, title, workplace, location, and salary with instant color-coded visual diff badges.
  - One-click "Apply Reporter Suggestion" button pre-populating suggested corrections into the editable fields.
  - Actions: "Save & Approve Updates" (commits to Firestore `jobs/{id}`, resolves report), "Remove Bad Posting" (atomic deletion from `jobs`), and "Dismiss Report".
- **Admin Moderation Queue Tab (`src/components/admin/AdminJobModerationTab.tsx` & `src/pages/AdminPanel.tsx`)**:
  - Added dedicated "Job Moderation" tab with active report counter badge in the admin navigation bar.
  - Filterable moderation list by issue category with direct launch of the validation diff modal.
- **NLP Ingestion Guardrails (`server.ts`)**:
  - Added deterministic negative regex blocklists (`INVALID_ENTITY_PATTERNS`) and `isValidEntityName` validator in `localNlpParse` and `indeedNlpParse`.
  - Prevents erroneous extraction of phrases like "our Tukwila Branch", "our Seattle branch", "our office", "will have a positive", "Equal Opportunity Employer", and "Apply Now" from ever entering the database.
- **Automated Unit Testing (`tests/unit/jobModerationAndNlpGuards.test.ts`)**:
  - Verified NLP false-positive blocklists, legitimate entity acceptance, report schema validation, diff calculation, and resolution state transitions.
- **Verification Gate**:
  - `lint_applet` (`tsc --noEmit`) passed with 0 errors.
  - `npm test` executed with 100% assertions satisfied across all 13 suites.
  - `compile_applet` production build succeeded.

---

## [0.5.28-dev.07] - 2026-10-12
### Added & Modularized (ITIL Service Transition - Target Indicators Sub-Section Architecture)
- **Target Indicators Sub-Section Component (`src/components/profile/TargetIndicatorsEditor.tsx`)**:
  - Encapsulated all 5 matching target indicators into a dedicated, reusable, accessible sub-section component:
    1. **Target Role**: Text input with focus indicators, semantic labels, and quick-pick chips (Senior Full Stack Engineer, Staff Software Architect, Senior Product Manager, etc.).
    2. **Target Industries**: Multi-industry tag management (`IndustryEditor`) with tag search, badge counters, and popular industry suggestion chips.
    3. **Target In-Person & Hybrid Locations**: 5-location tag manager (`LocationEditor`) powered by Google Places API (New) with commute minutes (10–120m) and distance radius (1–50mi) constraint controls per tag.
    4. **Target Salary**: Formatted currency display, input with numeric validation, and rapid salary tier buttons ($120k, $150k, $180k, $220k).
    5. **Target Benefit Requests**: Standard benefit chips with active visual toggles, custom benefit entry form with accessible tag removal.
  - Added KPI status badge and real-time progress indicator ("X of 5 Configured") providing clear visual feedback on matching completeness.
- **Sidebar Navigation & Multi-View Integration (`src/pages/ProfileEditor.tsx`)**:
  - Added dedicated `Target Indicators` item to the sidebar navigation menu with `<Target className="w-4 h-4" />` icon, granting direct 1-click access to the target indicators editor.
  - Retained embedded sub-section view directly inside `Basic Info` below personal info for inline discovery and editing.
  - Decomposed over 110 lines of inline target code out of `ProfileEditor.tsx`, complying with NASA JPL Rule 4 and modularity guidelines.
- **Automated Tests Expansion (`tests/unit/locationAndIndustryPreferences.test.ts`)**:
  - Added Invariant 6 validating the 5-pillar completeness calculation and state evaluation.
- **Verification Gate**:
  - `lint_applet` (`tsc --noEmit`) passed with 0 errors.
  - `npm test` executed with 100% assertions satisfied across all test suites.
  - `compile_applet` production build succeeded.

---

## [0.5.28-dev.06] - 2026-10-12
### Added & Fixed (ITIL Service Transition - Multi-Industry & 5-Location Tag Management)
- **Google Maps Places API (New) Migration (`server.ts`)**:
  - Diagnosed root cause of autocomplete returning empty arrays: Google Maps rejected calls to the legacy endpoint (`LegacyApiNotActivatedMapError`).
  - Migrated `/api/autocomplete` from legacy Place Autocomplete to modern Google Places API (New) (`https://places.googleapis.com/v1/places:autocomplete`) with `X-Goog-Api-Key` authorization.
  - Deployed updated Firestore security rules via `deploy_firebase` for the `autocomplete_cache` collection.
  - Implemented non-empty caching constraint to prevent transient/empty responses from poisoning the Firestore cache.
  - Added deterministic fallback for US zip codes and city names to guarantee zero-latency offline resilience.
- **5-Location Selector & Tag Management (`src/components/profile/LocationEditor.tsx`)**:
  - Re-architected `LocationEditor` with real-time suggestion dropdown, keyboard navigation (Arrow Up/Down, Enter, Escape), loading spinners, and an explicit accessible `+ Add` button.
  - Added deterministic tag creation on Enter or click even if autocomplete is in-flight or offline.
  - Added in-person/hybrid commute constraint controls on every location tag: distance radius (5, 10, 15, 25, 50 miles) and commute duration (15m, 30m, 45m, 60m, 90m, 120m).
  - Enforced a hard limit of 5 target locations with accessible counter and duplicate prevention.
  - Added quick 1-click sample location chips (Seattle, WA; Bonney Lake, WA 98391; San Francisco, CA; Washington, DC).
- **Multi-Industry Selection Component (`src/components/profile/IndustryEditor.tsx`)**:
  - Replaced the single-string target industry text field in `ProfileEditor.tsx` with a multi-industry tag selector.
  - Added popular industry quick-chips (GovTech, Defense & Aerospace, HealthTech, FinTech, Cybersecurity, Enterprise SaaS, AI & Machine Learning, CleanTech, BioTech, EdTech).
  - Maintained backward compatibility by updating both `targetIndustries: string[]` and comma-separated `targetIndustry: string`.
- **Profile Editor UX & In-Page Toast (`src/pages/ProfileEditor.tsx`)**:
  - Replaced native `alert()` calls with an accessible, auto-dismissing notification banner.
- **Automated Safety-Critical Unit Tests (`tests/unit/locationAndIndustryPreferences.test.ts`)**:
  - Added 5 invariant tests covering the 5-location ceiling, deduplication, commute/distance boundary rules (1–50 mi, 10–120 mins), fallback place ID generation, and multi-industry backward-compatible serialization.
- **Verification Gate**:
  - `lint_applet` (`tsc --noEmit`) completed with 0 errors.
  - `npm test` executed with 100% assertions satisfied across all suites.
  - `compile_applet` build succeeded.

---

## [0.5.28-dev.05] - 2026-10-11
### Refactored & Hardened (ITIL Service Transition - Removing Hard Splitting Boundaries)
- **Unified Description & Requirements Flow (`server.ts`)**:
  - Removed hard mechanical splitting boundaries between description and requirements in `localNlpParse`, ensuring the full posting text is preserved in both fields while maintaining rich extracted metadata (minimum vs preferred qualifications, company overview, EEO statement, and export control/clearance).
- **Verification Gate**:
  - Compiled successfully (`compile_applet`).
  - Executed 100% green unit test suite with zero failures (`npx tsx tests/runAllTests.ts`).

---

## [0.5.28-dev.04] - 2026-10-11
### Added & Hardened (ITIL Service Transition - Enhanced Job Parsing & Elaborate Views)
- **Advanced Job Description & Qualification Parsing (`server.ts`)**:
  - Upgraded `localNlpParse` and AI prompt schemas (`v2`, `v3`, `pdf_gemini`) to parse and segment job postings into granular structured categories:
    - **Role Description & Responsibilities**
    - **Minimum vs. Preferred Qualifications** (separate extraction for Must-Haves vs. Nice-to-Haves)
    - **Company Overview & Background** (identifying mission and "About Us" sections)
    - **EEO & Affirmative Action Statements**
    - **Security Clearance, Export Control & U.S. Person Compliance**
- **Elaborate & Enhanced Job Detail Views (`src/components/tracker/JobTracker.tsx`)**:
  - Re-architected the job detail view drawer with dedicated, beautifully styled cards and panels for Minimum vs. Preferred Qualifications, Company Overview, EEO Statement, Export Control / Clearance, and Full Description.
- **Verification Gate**:
  - Compiled successfully with zero errors (`compile_applet`).
  - Executed 100% green unit test suite with zero failures (`npx tsx tests/runAllTests.ts`).

---

## [0.5.28-dev.03] - 2026-10-11
### Added & Hardened (ITIL Service Transition - Indeed Parser, Auto-Detection & Revision Modal)
- **Indeed Job Board Parser & Auto-Detection Engine (`server.ts`)**:
  - Implemented specialized `indeedNlpParse` supporting Indeed layout formats (such as Impinj and Attain Finance postings), extracting company names with rating dots (`· 3.3`, `· 3.6`), annual/hourly salary ranges (`$131,200 - $196,800 a year`), location, workplace type, and structured requirements.
  - Implemented automatic board/format detection (`autoDetectedFormat`) distinguishing Indeed postings, GovernmentJobs / NEOGOV, Dice emails, LinkedIn, and Generic descriptions.
- **Auto-Detection & Revision / Specific Import Modal (`src/components/tracker/JobTracker.tsx`)**:
  - Added an interactive review and revision modal upon job ingestion displaying the auto-detected format badge.
  - Allows candidates to inspect and edit extracted job title, company name, location, workplace type, salary min/max, and source board before confirming and saving to their active application tracker.
- **Interactive Admin Executive Telemetry Cards (`src/components/admin/AdminHeaderStats.tsx` & `src/pages/AdminPanel.tsx`)**:
  - Made all 4 executive metric cards on the Admin Dashboard clickable and interactive with visual hover states and external link indicators:
    - *Active Jobs* -> switches admin view to Data Seeding Engine / Requisitions (`simulation`).
    - *Applications* -> switches admin view to Access Requests (`requests`).
    - *Total Users* -> navigates directly to Talent Pool / Employer Sourcing (`#sourcing`).
    - *Companies* -> navigates directly to the Company Directory page (`#companies`).
- **Mass Ingestion & Outreach Parser Engine (`src/utils/massOutreachParser.ts`)**:
  - Implemented RFC 4180-compliant CSV parser (`parseCsvLine`, `parseCsvRows`) supporting multiline quoted strings and escaped quotes.
  - Implemented multi-format schema normalizer supporting LinkedIn Connections exports, Google/Apple Contacts exports, and Categorized Relationship exports.
  - Built intelligent classification rules (`classifyContact`) partitioning contacts into `staffing_partner`, `recruiter_lead`, `employer_lead`, and `general_contact` based on keywords and agency signatures.
  - Enforced NASA JPL Rule 2 static iteration ceiling (`MAX_IMPORT_ROWS = 2500`).
  - Implemented multi-channel outreach generator (`generateOutreachTemplates`) creating personalized message bodies, Gmail deep-links, Outlook deep-links, and native mailto URLs.
  - Built campaign exporter (`exportContactsToCsv`) generating RFC CSV downloads.
- **Pre-Compiled Master Professional & Recruiter Roster (`src/data/masterContactRoster.ts`)**:
  - Ingested and deduplicated 60+ verified staffing agency recruiters, executive talent leads, and direct technical recruiters (Revature, Robert Half, Intelliswift, Diversant, Citi, Google, Boeing, BECU, Hunter Bond, Talan, Spencer & James).
- **Admin Mass Import Workspace (`src/components/admin/AdminMassImportTab.tsx`)**:
  - Engineered high-density, accessible subcomponent (<450 lines) with drag-and-drop CSV upload, raw paste zone, live classification filtering, full-text search, and batch selection.
  - Features 1-Click "Load Chris's Master Roster" pre-populating verified agency recruiters without friction.
  - Integrated batch execution buttons:
    - *Batch Issue Partner Tokens* -> writes active tokens to `staffing_invitations`.
    - *Batch Sync to Recruiter Leads* -> ingests to `recruiter_leads`.
    - *Batch Queue Access Requests* -> ingests to `partner_requests`.
    - *Export Campaign CSV* -> instant download.
  - Integrated single-contact outreach modal with direct Gmail, Outlook, and Mail client triggers.
- **Admin Panel Terminal Orchestration (`src/pages/AdminPanel.tsx`)**:
  - Registered `mass-import` tab mode in navigation bar with `<Sparkles className="w-4 h-4 text-amber-400" />`.
  - Added batch writing handlers `handleBatchIssueInvitations`, `handleBatchSyncRecruiterLeads`, and `handleBatchConvertRequests` with telemetry refresh.
- **Security Rules & Schema Hardening (`firestore.rules` & `firebase-blueprint.json`)**:
  - Added explicit hardened rule block for `/recruiter_leads/{leadId}` with admin read/write and authenticated create.
  - Registered `RecruiterLead` entity and collection path in `firebase-blueprint.json`.
  - Added `RecruiterLead` interface to `src/types/index.ts`.
- **Automated Test Suite Expansion (`tests/unit/massOutreachParser.test.ts`)**:
  - Created 9 comprehensive unit tests covering CSV line tokenization, classification partitioning, LinkedIn export ingestion, contact card phone/email sanitization, categorized relationships, deduplication, outreach templates, CSV exports, and NASA JPL iteration ceiling.
  - Registered in `tests/runAllTests.ts`.
- **Security Rules Deployment & Collection Group Gate (`firestore.rules` & `deploy_firebase`)**:
  - Deployed `firestore.rules` via `deploy_firebase` to activate live cloud authorization for `/recruiter_leads/{leadId}`.
  - Added collectionGroup rule `match /{path=**}/ingestedJobs/{jobId} { allow read: if isAdmin(); }`, enabling `fetchLeads()` to query all candidate-ingested job subcollections across all users without `PERMISSION_DENIED` halts.
- **Universal Recruiter Ingestion & Relaxed Invariants (`server.ts` & `src/components/tracker/JobTracker.tsx`)**:
  - Upgraded `localNlpParse` in `server.ts` to search for recruiter signatures, emails, phones, and staffing firm names across general pasted text and job uploads (previously only Dice and GovJobs tabs ran recruiter extraction).
  - Relaxed recruiter lead generation in `JobTracker.tsx`: now creates `recruiter_leads` documents whenever a recruiter name or staffing firm is detected, removing the hard requirement for an email address and falling back to deterministic name/firm IDs.
- **1-Click Sync Accessibility & Workflow Polish (`AdminMassImportTab.tsx` & `AdminRecruiterLeadsTab.tsx`)**:
  - Added 1-Click **"⚡ Sync All Leads"** and **"⚡ Issue All Tokens"** buttons in `AdminMassImportTab.tsx`, eliminating the need to manually click checkboxes.
  - Added row-level **"Sync Lead"** actions for instant single-contact sync.
  - Added **"Import from Network Roster"** directly in `AdminRecruiterLeadsTab.tsx` header for instant lead backfill.
  - Wrapped `handleBatchSyncRecruiterLeads` with `sanitizeFirestorePayload` to prevent undefined field Firestore write errors.
- **Verification Gate**:
  - `npx tsx tests/runAllTests.ts`: 11 test suites / 70+ assertions passing with 100% green status.
  - `lint_applet` (`tsc --noEmit`): Zero errors and zero warnings.
  - `compile_applet`: Clean production build.

---

## [0.5.28-dev.02] - 2026-10-10
### Fixed & Updated (Incident Management - AI Model Migration & Deprecation Fix)
- **Model Deprecation Remediation (`server.ts`)**:
  - Replaced retired models (`gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-3.6-flash`) across all server endpoints (`/api/enhance-job`, `/api/ingest-job/chat`, `/api/tailor-resume`, `/api/parse-resume`, `/api/enhance-skills`, `/api/transition-advisory`, and PDF ingestion) with the official, supported **`gemini-3.8-flash`**.
  - Resolved `HTTP 404 NOT_FOUND ("models/gemini-2.5-flash is no longer available to new users")` preventing job enhancements and tailored resume generation.
- **Verification Gate**:
  - `npx tsx tests/runAllTests.ts`: 100% test assertions satisfied.
  - `compile_applet` & `lint_applet`: Zero warnings and zero errors.

---

## [0.5.28-dev.01] - 2026-10-04
### Enhanced & Fixed (ITIL Service Transition - GovJobs Outreach & Process Flow Manager Parsing)
- **Outreach & Process Flow Ingestion (`server.ts`)**:
  - Upgraded the specialized `govJobsNlpParse` government requisition scraper to search for contact managers and recruitment administrators actively routing the application lifecycle (e.g. *"This recruitment is being managed by [Name]"*).
  - Automatically extracts identified contact names into `recruiterInfo.name` and gathers associated LinkedIn profile URLs into `recruiterInfo.linkedInUrl` directly from the raw posting text.
- **Bridge UI Preview Expansion (`src/components/GovJobsBridge.tsx`)**:
  - Added `linkedInUrl` support to `GovJobData` interface and updated the preview card to display the Outreach & Process Flow Manager along with a direct `"Connect on LinkedIn"` action link.
- **Verification Gate**:
  - `tests/unit/culturalValuesAndRecruiter.test.ts`: Added Test 6 verifying GovJobs outreach contact and LinkedIn URL parsing regex capabilities.
  - `npx tsx tests/runAllTests.ts`: All suites passing with 100% green compliance.
  - Compiled applet successfully.

---

## [0.5.28] - 2026-10-04
### Promoted & Released (ITIL Release & Deployment Management - Culture-Add Matching & Recruiter Partnership)
- **Public Milestone Cut**: Successfully promoted iterations `0.5.27-dev.17` and `0.5.27-dev.18` into public milestone release **v0.5.28**.
- **Configuration Item (CI) Synchronizations**:
  - `package.json` & `src/config.ts`: Version bumped to `0.5.28`.
- **Integrated Cultural Values & Recruiter Partnership Hub**:
  - Integrated Fast Company 26 Cultural Values and Manpower 5 Keys into a unified, interactive `RecruiterCultureMatrix.tsx` component.
  - Formulated comprehensive `/src/data/culturalValuesCatalog.ts` covering reverse-interview probes, candidate-recruiter actionable checklists, and cultural red-flags.
  - Implemented cultural matching bonus scoring (+5%) in `useJobMatching.ts` and linter warnings in `materialShiftEngine.ts`.
- **Validation Gate Sign-Off**:
  - 10 test suites / 60+ assertions fully satisfied with zero failures.
  - Compiled applet with zero errors and warnings.

---

## [0.5.27-dev.18] - 2026-10-04
### Added & Documented (ITIL Service Transition - Manpower 5 Keys Working with a Recruiter Tracking & Architecture Strategy)
- **Manpower Insights Reference Tracking (`/Docs/Manpower_5_Keys_Working_With_Recruiter.md`)**:
  - Ingested full Manpower Insights guide (*What Are the 5 Keys to Working with a Recruiter?*) covering Recruiter Value Proposition, First Impressions, Trust & Clear Communication, Proactive Follow-Up (Debriefs & Competing Offers), Team Cooperation, and Post-Placement Career Continuity.
  - Linked reference document to Ascend ATS recruiter relationship health tracker, post-interview feedback portal, and candidate recruiter-readiness card strategy.
- **Documentation & Structure Sync**:
  - Updated `Docs/STRUCTURE.md` registering `Manpower_5_Keys_Working_With_Recruiter.md`.

---

## [0.5.27-dev.17] - 2026-10-04
### Added & Documented (ITIL Service Transition - Fast Company 26 Cultural Values Reference & Architectural Strategy)
- **Fast Company Impact Council Reference Tracking (`/Docs/FastCompany_26_Cultural_Values.md`)**:
  - Ingested full Fast Company article (*26 Cultural Values Companies Get Wrong*) covering Originality, Gracious Professionalism, Reciprocity, Innovation as Behavior, Uncomfortable Transparency, Culture-Add Hiring, Accountability without Fault, Pacing vs Hustle, Ecosystem vs Family, and Kindness vs Niceness.
  - Linked reference document to Ascend ATS & RapportVerse dual-sided interview copilot, values alignment matching, and requisition auditing strategy.
- **Documentation & Structure Sync**:
  - Updated `Docs/STRUCTURE.md` registering `FastCompany_26_Cultural_Values.md`.

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

### 2026-10-12
- Fixed syntax error in `server.ts` caused by orphaned code and brace imbalance.
- Removed redundant code from refactored `localNlpParse` function and fixed `}` brace imbalance in `enhancePastedTextMarkdown` function to allow dev server startup.

### 2026-10-12
- Implemented `/api/autocomplete` server-side proxy in `server.ts` with Firestore-based caching (24h TTL) for Google Places Autocomplete to optimize API costs.
- Replaced client-side `PlaceAutocompleteElement` in `LocationEditor.tsx` with a custom, proxy-fetching autocomplete component to support server-side caching and improve compliance.

### 2026-10-12 (Fix)
- Resolved permission error in `/api/autocomplete` by updating `firestore.rules` to allow public read/write access to `autocomplete_cache` collection for server-side proxy operations.

### 2026-10-12 (Bug Fix)
- Fixed issue where Enter key did not select location in `LocationEditor.tsx`.
- Improved focus visibility for `LocationEditor` input.

### 2026-10-12 (Feature)
- Implemented 5-location selector for candidates with tag-based input and Google Maps integration in `src/components/profile/LocationEditor.tsx`.
- Updated `JobSeekerProfile` type to support `TargetLocation` structure.
- Enforced 5-location limit in `LocationEditor`.
