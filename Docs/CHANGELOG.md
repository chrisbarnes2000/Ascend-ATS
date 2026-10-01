# Changelog

All notable changes to this project will be documented in this file.

## [0.5.25] - 2026-09-21
### Added & Enhanced
- **RapportVerse Strategic Bridge Page**: Created `RapportVersePage.tsx` with dedicated hash routing (`#rapportverse` & `#trust-network`) offering deep integration between Ascend ATS and the RapportVerse relationship intelligence platform (`https://rapprt.space`).
- **Concentric Trust Radar & Dunbar Layers**: Interactive SVG topology radar mapping professional networks across Dunbar 5 (Inner Core), 15 (Strategic Mentors), 50 (Professional Talent), and 150 (Extended Industry).
- **David Maister Trust Equation Simulator**: Live interactive calculation model evaluating alignment quotient: `TQ = (Credibility + Reliability + Intimacy) / Self-Orientation` with real-time interpretation for candidate/recruiter matching.
- **Neurodiversity & Double Empathy Hub**: Integrated educational guides highlighting Double Empathy, Sensory Calm, Object Permanence, and the Dobby Border Principle.
- **Bidirectional Topology Bridge & Exporter**: Instant JSON export engine (`rapportverse-trust-topology.json`), sync simulator, and quick badge generators for external project READMEs.
- **RapportVerse Partner Implementation Guide**: Created `/Docs/RapportVerse_Bridge_Integration_Guide.md` providing end-to-end data contracts, TypeScript interfaces, webhook request signatures, and deep-link protocols for the RapportVerse engineering team.
- **Footer & Partner Portal Integration**: Added direct navigation triggers from `Footer.tsx` and `AffiliatesPage.tsx`.

## [0.5.24] - 2026-09-21
### Added & Enhanced
- **Public Machine-Readable Files**: Added `llms.txt`, `llm.txt`, and `LLMs.txt` providing structured LLM documentation of the ecosystem, features, and RapportVerse strategic alignment.
- **Search Engine Crawler Directives**: Added `robots.txt` and `Robot.txt` providing search engine index and security directives.
- **Standalone Accessible Error HTML Pages**: Added `400.html`, `404.html`, and `500.html` error templates with dark/light mode responsive CSS, WCAG AA contrast, and RapportVerse attribution.
- **Multi-Device Favicons & PWA Icons**: Generated scalable vector `favicon.svg`, fallback `favicon.ico`, `apple-touch-icon.png` (180x180), `pwa-192x192.png`, `pwa-512x512.png`, and configured `site.webmanifest` linked in `index.html`.
- **RapportVerse Copyright Attribution**: Adjusted the persistent global `Footer.tsx` copyright to link directly to RapportVerse (`https://rapprt.space`).

## [0.5.23] - 2026-09-08
### Added & Enhanced
- **Strategic Partner Display**: Adapted the user's RapportVerse partner portfolio into a premium interactive banner showcase within `AffiliatesPage.tsx`.
- **One-Click Markdown Copiers**: Added state-driven clipboard utilities allowing users to instantly copy customized partner shields and flat-square badges for RapportVerse.
- **Verified Partner Badges**: Dynamically displays SVG-based shield representations of RapportVerse partnership affiliations with live external anchors (`https://rapprt.space`).

## [0.5.22] - 2026-09-08
### Added & Enhanced
- **Global Persistent Layout Footer**: Created a modular, highly polished `Footer.tsx` that links seamlessly to Workspaces, Partner channels, and the Legal compliance dashboard.
- **Affiliate Partner Program Page**: Created `AffiliatesPage.tsx` outlining recurring commission guidelines, tracking cookies, program FAQ, and a live Firestore-linked application submission form.
- **Public Router Integrity**: Configured hash routing for `#affiliates` enabling external partners and search listings to view and apply before logging in.

## [0.5.20] - 2026-09-08
### Added & Enhanced
- **Terms of Service & Privacy Policy Center**: Built a unified, highly polished legal routing page (`LegalPage.tsx`) containing legally consistent rules, data security frameworks, cookie notifications, and CCPA/GDPR compliance highlights.
- **Public Router Support**: Enabled fully public hash routing paths (`#legal`, `#terms`, `#privacy`), making the policies accessible to anyone prior to or during sign-in.
- **In-App Navigation Integration**: Embedded direct legal compliance statements and interactive triggers under the Google Authentication sign-in flow and within the secure profile dropdown navigation card.

## [0.5.18] - 2026-09-04
### Added & Enhanced
- **Scroll Chaining Prevention for Editor Panels**: Applied standard `overscroll-behavior: contain` (`overscroll-contain` class in Tailwind) to both the Role Description and Key Requirements textareas.
- **Improved UX Stability**: Ensures that scrolling through a long description inside the nested editor remains focused and contained within that block, preventing the outer page viewport from scrolling out of view.

## [0.5.16] - 2026-09-04
### Added & Enhanced
- **On-Demand Custom Formatting Re-Run**: Integrated "Auto-Format" action triggers inside the custom editing menu. Users can now apply the Heuristic Styling Engine to the current manually modified description or requirements text block on-the-fly.
- **Dedicated Formatting API Gateway**: Bound an Express endpoint `/api/ingest-job/heuristic-format` on the backend to dynamically process and return formatted Markdown without modifying database state directly.

## [0.5.14] - 2026-09-04
### Added & Enhanced
- **Expanded Section Header Parsing Dictionary**: Upgraded the local Markdown text-formatting engine to recognize a wider range of standard job description sections including:
  - `PURPOSE` / `Role Purpose` / `Job Purpose`
  - `ESSENTIAL DUTIES / RESPONSIBILITIES` / `Essential Duties` / `Essential Responsibilities`
  - `Full job description` / `Description:`
  - `Education and Experience` / `Education & Experience`
- **Typographic Section Formatting**: Ensures beautiful capitalization and spacing, converting matched plain text strings into Level-3 Markdown headings (`### Essential Duties / Responsibilities`).

## [0.5.12] - 2026-09-04
### Added & Enhanced
- **Interactive Formatting Customizer & Editor**: Introduced a **Customize Formatting** control panel directly inside the job details view. If our automated NLP heuristic pass over-condenses or misinterprets any pasted description, users can edit the structural content (Description and Requirements) manually in high-fidelity Markdown textareas.
- **Full Original & Formatted Presentation**: Upgraded the details layout to display both the beautifully-formatted **Role Description** and the **Requirements & Qualifications** side-by-side using the rich-text renderer.
- **Real-Time Cloud Synchronization**: Wired editing states to instantly update Firestore and state context upon clicking **Save Custom Formats**, guaranteeing consistency across app views.

## [0.5.10] - 2026-09-04
### Added & Enhanced
- **Raw Text Markdown Formatting & Styling Engine**: Implemented an advanced, deterministic plain-text markdown styling processor in the backend. When candidates paste a plain-text job description, the engine automatically:
  - Detects common sections (e.g., *About the Role, Qualifications, Key Responsibilities, Benefits*) and transforms them into beautifully capitalized Level 3 headings (`### About The Role`).
  - Identifies list indicators (e.g., bullet items, dashes, squares) and formats them into standard Markdown bullet lists (`- List Item`).
  - Translates common text parameters (e.g., *Requirements:, Experience:, Salary:*) into high-contrast bold labels (`**Requirements:**`).
  - Detects short all-caps category terms and renders them as Level 4 subheadings (`#### COGNITIVE QUALIFICATIONS`).

## [0.5.8] - 2026-09-04
### Added & Enhanced
- **High-Fidelity Deterministic Local NLP Parser (First Pass)**: Created a 100% reliable, lightning-fast heuristic text-processing and regex parsing engine on the backend for all ingested job texts and links. Extracts company names, workplace types, city/state locations, exact salary ranges (e.g. $120k-$160k), matching technical skills, and corresponding health/retirement benefits without hitting AI rate limits.
- **Deep AI Second-Pass Scan Option**: Introduced a highly-styled banner in the core insights drawer prompting candidates to run a deep second pass using Gemini. Clicking **Run Deep AI Scan** requests advanced strategic interview strategies and implicit unstated expectation maps, promoting seamless progression and deep preparation.
- **Dynamic List Indicator Badges**: Styled distinct labels in the pipeline tracker to show whether an item is processed with **Local NLP** or completed with a **Gemini Deep Scan**.

## [0.5.6] - 2026-09-04
### Added & Enhanced
- **Interactive Dual Ingestion Pipeline**: Introduced a highly-scannable two-tab layout separating Job Link/URL Import from Job Description Text Manual Paste. This fully resolves issues with unsubmitted raw text by introducing a dedicated and independent text analyzer submit button.
- **Login-Gated Platform Warning Callout**: Added a warning dialog highlighting LinkedIn and Indeed anti-scraping blocks, helping users understand why automated extraction might fail and seamlessly steering them towards the highly-accurate Manual Paste option.
- **Custom Alert & Confirmation Modal Framework**: Designed and integrated fully custom modal components within the React `<AnimatePresence>` tree. This completely replaces standard native browser prompt/alert dialogs with visually cohesive, high-contrast, beautiful confirmation panels.
- **Robust Endpoint Fallbacks**: Standardized `/api/ingest-job` to safely handle manual job text parsing without demanding a LinkedIn URL parameter.

## [0.5.4] - 2026-09-04
### Added & Enhanced
- **Interactive Job Ingestion & AI Copilot Workspace**: Implemented `/src/components/tracker/JobTracker.tsx` allowing candidates to drop job links or raw description text, parse job info via Gemini-3.6-Flash (with robust regex backup), interact with a customized Job Copilot chatbot, and generate printable tailored resumes matching target roles.
- **Full-Width Dashboard Workspace Integration**: Successfully integrated the `JobTracker` component into `JobSeekerDashboard.tsx` with a dedicated "Job Tracker & AI Copilot" navigation tab.
- **Advanced Skill Visualizer & Accommodations Mapping**: Completely redesigned `SkillVisualizer.tsx` into a tabbed widget featuring:
  - *Core Domains*: A Recharts Donut Pie Chart visualizing skill distributions by specialty areas.
  - *Skills Radar*: A radar chart graphing average competency scores across domains.
  - *Access Support & Accommodations*: A styled interactive checklist mapping custom physical workspace accommodations based on candidate-specified DEI settings.
  - *Credentials Grid*: Active hyperlinks pointing to verified badges and credentials on Credly.
- **Heuristic Skill Sorting & Credly Linking**: Added dynamic, deterministic (non-AI) auto-sorting to `SkillsEditor.tsx` (by alphabetical name, experience years, or competency levels) and linked verified skills out to Credly badges directly in the profile editor.

## [0.5.3] - 2026-07-21
### Changed
- **Company Profile Lockdown**: Locked core company identification fields in `CompanyManagement.tsx` post-signup, allowing only description and social link edits.
- **Job Management Migration**: Removed job listing and deletion management from the Company Profile editor, centralizing all job requisition activities into the dedicated "Requisitions & Audits" workspace.

## [0.5.2] - 2026-07-21
### Added & Enhanced
- **Algorithmic Match Reason Breakdown Engine**: Created `getMatchBreakdown` utility in `useJobMatching.ts` that calculates and explains the exact qualitative reasons why a job seeker's profile matches a job posting (evaluating salary range alignment, workplace setting, benefits/perks matched, required vs. preferred skills, and employer settling flexibility).
- **Interactive Match Explanation Panels**: Integrated the "Why & How Profile Matched" callout on job cards in `JobSeekerDashboard.tsx` and as a prominent breakdown card in `JobDescription.tsx` (Assisted Insights section), displaying matched perks, core skills, and employer flexibility notes.
- **Enhanced Job Requisition Editor Criteria**: Updated `JobRequisitionEditor.tsx` with inputs for Workplace Setting (Remote, Hybrid, On-Site), Location, Required Skills vs. Preferred/Nice-to-Have Skills, Provided Benefits & Perks Checklist, and Employer Settling Criteria / "Willing to Consider" options.

## [0.5.1] - 2026-07-21
### Added & Enhanced
- **Interactive HR Thread & Candidate Acknowledgment Modal**: Updated candidate application pipeline cards in `JobSeekerDashboard.tsx` to make the message count badge and card buttons interactive.
- **Message Acknowledgment & Direct Reply Controls**: Added a dedicated HR Communications & Acknowledgments modal where candidates can inspect recruiter notes (including Offer Rationales, Information Requests, and Interview Instructions), click "Acknowledge Message" to confirm receipt, and send direct replies back to the hiring team via Firestore updates.

## [0.5.0] - 2026-07-21
### Added & Enhanced
- **Recruiter Profile Company Linking & Claiming**: Introduced a company association module in `EmployerDashboard.tsx` allowing recruiters to link or claim a registered employer profile (e.g., Acme Corp, CloudScale, General Hospital) saved directly to `users/{uid}/profiles/company`.
- **Company-Aware ATS Pipeline Filtering**: Enhanced `EmployerDashboard.tsx` application filtering logic to match candidates by user ID, claimed company ID, and company name. Added a header mode toggle allowing recruiters to switch seamlessly between "My Company Applications" and "All Candidate Pool".
- **Structured Offer Rationale & Communication Categories**: Added categorized message controls inside the Candidate Review Drawer in `EmployerDashboard.tsx` ("Offer Rationale", "Info Request", "Interview Notes", "General Note") allowing recruiters to send detailed notes regarding offer adjustments or information requests directly to the candidate's Firestore timeline.

## [0.4.9] - 2026-07-21
### Added & Fixed
- **6-Second Candidate Profile Inspection Auto-View**: Implemented a 6-second inspection timer in `EmployerDashboard.tsx` (candidate review drawer) and `PublicProfile.tsx` (full candidate profile view). Applications in `applied` status automatically transition to `viewed` in Firestore after 6s of profile inspection.
- **Employer Company Application Isolation**: Restricted application lists and ATS pipeline metrics in `EmployerDashboard.tsx` to only display candidates who applied to the logged-in user's company (`app.companyId === user.uid`), while maintaining full multi-company visibility for Admin panel accounts (`appUser.role === 'admin'`).
- **Candidate Info Request & Role Clarification Fix**: Fixed missing Firestore security rules for `jobClarificationRequests` collection and added an interactive "Request Info" candidate modal on `JobSeekerDashboard.tsx` and `JobDescription.tsx`. Candidate inquiries write to both `jobClarificationRequests` and the application's `communications` timeline in Firestore, ensuring recruiters receive applicant messages directly in `EmployerDashboard.tsx`.

## [0.4.8] - 2026-07-21
### Fixed & Added
- **Real-Time Candidate Activity ATS Pipeline**: Replaced static placeholder views in `EmployerDashboard.tsx` with a live Firestore subscription (`onSnapshot`) on the `applications` collection. Recruiters and companies now receive immediate, streaming updates for all incoming candidate submissions.
- **Candidate Application Metadata Enrichment**: Updated application submission handlers in `JobDescription.tsx` and `JobSeekerDashboard.tsx` to save candidate full name, headline, email, match alignment percentage, application method, and company metadata to Firestore.
- **Interactive Application Stage Progression**: Added status transition action controls (`Mark Viewed`, `Invite Interview`, `Extend Offer`, `Pass / Reject`) directly on candidate activity rows and within a Candidate Review Drawer. Updating application status writes to Firestore and triggers real-time updates on candidate dashboards (`JobSeekerDashboard.tsx`).
- **Dynamic ATS Pipeline Statistics**: Implemented live pipeline counter cards (`New Applied`, `Under Review`, `Interviewing`, `Offers Extended`) and real-time status filtering with search functionality.

## [0.4.7] - 2026-07-21
### Added & Fixed
- **Company Profile Navigation Fix**: Resolved non-responsive "Go Back" button behavior on company details pages (`CompanyProfileView.tsx`). Implemented a resilient fallback navigation mechanism (`handleGoBack`) that checks history stack depth and guarantees clean redirection back to `#companies` or previous screens.
- **Web Presence & Social Channels Section**: Integrated a dedicated "Web Presence & Official Social Channels" module on company profile views, rendering interactive, styled external link cards for official websites (with domain parsing and clean external navigation), LinkedIn, X/Twitter, GitHub, and Glassdoor.
- **Employer Social Media Management**: Added form fields and Firestore state persistence in `CompanyManagement.tsx` allowing employer accounts to manage official website, LinkedIn, Twitter/X, GitHub, and Glassdoor URLs.
- **Enhanced Company Directory Drawer**: Updated the slide-over detail modal in `CompanyDirectory.tsx` with direct website buttons and a prominent link to view full company profile pages.

## [0.4.6] - 2026-07-21
### Added & Enhanced
- **Re-ordered Assisted Insights Section**: Moved the Matched Requirements & Requirements Gaps / Unmatched comparison boxes to the top of the Assisted Insights module and placed the Candidate Profile Skills grid at the bottom.
- **Interactive Missing Skills Addition**: Added direct skill selection chips and an "Add All Missing to Profile" bulk action on the job description page. Clicking missing skill requirements opens an interactive dialog to configure competency level, domain, and experience years, writing directly to Firestore (`users/{uid}/profiles/main`) and dynamically updating match scores.
- **Recruiter Role Clarification Requests**: Integrated a "Request Role Clarification" action button and modal for candidates to send structured inquiries (e.g. salary range clarity, remote policy, tech stack specifics) to recruiters, helping employers optimize job specifications.
- **Posting Authenticity & Market Signals (Anti-Ghost Job Protection)**: Introduced real-time job legitimacy metrics displaying posted date, target fill date, approved headcount budget status, and anti-ghost posting verification confidence to protect candidates against stale or data-harvesting listings.

## [0.4.5] - 2026-07-21
### Fixed
- **Job Description Profile Skills Loading**: Fixed missing profile state binding on `JobDescription.tsx` by attaching an `onSnapshot` listener to `users/{uid}/profiles/main`. Added fallback parsing in `useJobMatching.ts` for `parsedData.skills` to guarantee all 48 candidate skills (including skills like `React`) are retrieved and accurately compared against job criteria.

## [0.4.4] - 2026-07-21
### Fixed
- **Gemini Model Alignment & Quota Fallback**: Updated server-side AI endpoints (`/api/parse-resume`, `/api/enhance-skills`, `/api/transition-advisory`) to use the official `gemini-3.6-flash` model with `aistudio-build` telemetry headers. Refactored exception handlers so that API quota exhaustion (429) triggers clean, seamless fallbacks to rule-based logic without raising unhandled errors.

## [0.4.3] - 2026-07-21
### Fixed & Unified
- **Merged Location Input Experience**: Consolidated the separate manual input form and Google Maps autocomplete widget into a single, unified location search bar in `LocationEditor.tsx`. Selecting a Google Place automatically adds the formatted location as a tag and resets the autocomplete element to allow adding multiple locations smoothly.

## [0.4.2] - 2026-07-21
### Added & Fixed
- **Recommended Places Autocomplete Element**: Upgraded `LocationEditor.tsx` to mount `google.maps.places.PlaceAutocompleteElement` (web component flow) listening for `gmp-placeselect` events, adhering to modern Google Maps Platform recommendations.
- **AI Skill Enhancement Endpoint**: Added `/api/enhance-skills` endpoint powered by Gemini AI with rule-based fallbacks to auto-categorize domains, level competencies, and infer experience years for candidate skill sets.
- **Real-time Skills Auto-Persistence**: Updated `ProfileEditor.tsx` and `SkillsEditor.tsx` so that `Clear All` and `Enhance All` immediately clear or update skills in Firestore state, eliminating stale skill types.

## [0.4.1] - 2026-07-21
### Added & Enhanced
- **Comprehensive Candidate Skill Display & Comparison**: Enhanced the Job Description Assisted Insights view to render all candidate skills from their profile alongside required job criteria, clearly highlighting direct matches, transferable competencies, and skill gaps.
- **Improved Algorithmic Match Accuracy**: Refactored `useJobMatching.ts` with tokenized, bi-directional fuzzy skill comparison and automated fallback keyword extraction from job text, resolving low match scores caused by strict string checking or missing parsed criteria arrays.

## [0.4.0] - 2026-07-21
### Changed
- **Wide Viewport Layout**: Expanded the main application panel and top navigation boundaries to seamlessly occupy 75% of the viewport width across all primary pages and dashboard surfaces, granting improved responsive density on ultra-wide monitors.

## [0.3.0] - 2026-07-21
### Added
- **Skills Editor Bulk Actions**: Added `Enhance All` and `Clear All` bulk action buttons to the skills editor header for rapid skill set management.
### Changed
- **Skills Grid Styling Refinement**: Applied structural layout enhancements to the skills domain groups, implementing elegant borders, refined domain headers, and interactive hover states for skill pill removal.

## [0.2.9] - 2026-07-21
### Fixed
- **Privacy Level 4 Render Crash**: Fixed an unimported `Lock` icon crashing the Privacy & Security tab when toggled to Maximum Cloak (Level 4).
- **Google Maps API Warnings**: Configured the specific `solutionChannel` for the `APIProvider` to suppress legacy version and usage warnings for the Places Autocomplete integration.
- **AI Profile Rebuilder Enhancements**: Upgraded the AI Resume Parsing engine (used during Rebuild Profile) to automatically map and populate the new enriched `ProfileSkill` taxonomy (Domain, Level, Years of Experience) directly from document extraction.

## [0.2.8] - 2026-07-21
### Added
- **Rich Skills Taxonomy & Editor**: Overhauled the Skills Editor to support deeply structured competency tracking. Users can now categorize skills by Domain (Technical, Soft Skills, Leadership, etc.), assign proficiency levels (Beginner to Expert), and optionally input years of experience.
- **Upgraded Data Schema**: Evolved the Profile `skills` array to store full `ProfileSkill` metadata objects while seamlessly supporting legacy string arrays via robust backward-compatibility mappings across matching, sourcing, and display surfaces.

## [0.2.7] - 2026-07-21
### Added
- **Dedicated Skills & Tech Editor**: Added a new top-level tab in the Profile Editor for granular management of technical competencies and skills. Features an expansive grid view showing the top 10 skills by default, paired with a "Load More" toggle to seamlessly handle heavy profiles.
- **Verified Location Configs with Google Maps**: Integrated Google Maps Platform Places Autocomplete into the Profile Editor target locations field. This ensures candidates can easily find and correctly spell valid geographical regions, standardizing location matching data downstream.

## [0.2.6] - 2026-07-21
### Fixed
- **Match Score Algorithm Unification**: Unified the matching engine so the Job Description page evaluates the exact same 4-point weighted criteria (role, experience, salary, skills) as the Dashboard, resolving an issue where the detail page showed a 0% fit due to strict string checking.
- **AI Fallback Error Handling**: Fixed a silent promise rejection in the transition advisory backend route. Unparseable JSON from the AI module now gracefully triggers the structured algorithmic fallback report, ensuring the Risk vs Strength assessment always renders.

## [0.2.5] - 2026-07-21
### Added & Changed
- **Auto-Generated Transition Advisory**: Improved the Assisted Insights algorithm for <50% matches to automatically generate an objective transferable skills analysis on initial view without requiring the candidate to manually type an explanation first.
- **Dynamic Post-Apply UI cleanup**: Hid the transition explanation input text area and generation controls on the job description page after an application has been successfully submitted, leaving only the AI advisory report visible.
- **Expanded Profile Target Configs**: Upgraded the Profile Editor to capture comprehensive target configurations, adding explicit inputs for Target Industry and Target Locations alongside existing role and salary metrics to improve algorithmic matching precision.

## [0.2.4] - 2026-07-21
### Added & Fixed
- **Direct One-Click Apply Action**: Refactored dashboard match cards so clicking "One-Click Apply" or "Auto-Apply Now" immediately submits the application to Firestore without forcing navigation to the job details page. Retained a dedicated "Review Details" button for optional viewing.
- **Vibrant Match Score Background Tints**: Enhanced match score card background coloring across all levels (Rose, Amber, Emerald, and Gold gradient) for high visual clarity and distinct hierarchy.

## [0.2.3] - 2026-07-21
### Fixed
- **Candidate Sourcing Collection Group Permissions**: Updated Firestore security rules for collection group profile queries (`match /{path=**}/profiles/{profileId}`) to enforce `isSignedIn()` checks, resolving any remaining "Missing or insufficient permissions" errors during candidate sourcing.

## [0.2.2] - 2026-07-21
### Fixed
- **Candidate Sourcing Permission Error**: Restored `collectionGroup` queries for candidate profiles in `EmployerSourcing.tsx` to fully align with Firestore security rules (`match /{path=**}/profiles/{profileId}`), eliminating any "Missing or insufficient permissions" errors.

## [0.2.1] - 2026-07-21
### Added
- **Expanded Industry & Position Fuzzing Options**: Added comprehensive mock job and company sets covering Legal & Compliance, Logistics & Supply Chain, Creative & Design, Engineering & DevOps, and Biotech & Research to test a broader range of fields and roles.
- **Bulk Talent Pool & Company ATS Sampling Pipeline**: Implemented a one-click "Seed All Talent & Jobs" action in the Developer Admin Panel to rapidly populate sample candidate profiles, recruiters, company directories, and multi-industry positions for thorough ATS pipeline testing.

- **Company Profile Detailed Page**: Created and integrated `/src/pages/CompanyProfileView.tsx` with robust routing to display company statistics, descriptions, key sourcing targets, and all active roles associated with that organization.
- **Unregistered Company Partnership Pipeline**: Built an automated handshake request workflow for unonboarded employers with custom forms allowing candidates, employees, or recruiters to register their interest. Mapped full form validation and dynamic state changes with Firestore `partnership_requests` collections.
- **Master Directory Navigation**: Added seamless deep linking from job descriptions and dashboard job cards directly to onboarded company pages or connection request screens.
- **Score-Adaptive Styling Logic**: Rebuilt job matching card styles to conditionally adjust their aesthetic properties based on candidate match score ranges:
  - *0 - 30%*: Rose palette card with soft crimson accent borders.
  - *30 - 60%*: Warm Amber card layout for emerging matches.
  - *60 - 90%*: Vibrant green background highlights indicating strong matches.
  - *90%+*: Elite Dark Green card with luxurious high-contrast Gold borders, ring-glow accents, and bold styling.

### Fixed
- **Query Parsing Safety & Sandbox Fix**: Resolved a critical runtime error (`Uncaught TypeError: Illegal constructor`) triggered during routing transitions by refactoring URL query parameters parsing to use custom regex-based string decoding instead of environment-sensitive global constructors.
- **Candidate Sourcing Permissions & Collection Query**: Replaced collection group queries with robust user document iteration (`collection(db, 'users')`) in `EmployerSourcing.tsx` to eliminate `Missing or insufficient permissions` and collection group index errors when loading candidate talent pools.

## [0.1.9] - 2026-07-20
### Added
- **Interactive Sliding Data Privacy Scale (Level 1-4)**: Designed and integrated a beautiful, custom 4-level range slider in `/src/components/profile/PrivacyControls.tsx`. This slider provides precise visual and functional mapping of exactly which elements of a candidate's profile are visible or masked:
  - *Level 1: Unrestricted*: Profile fully searchable. Name, contact details, work experience, and employers are public.
  - *Level 2: Masked Contact*: Direct contact coordinates (email, phone, social & portfolio URLs) are completely locked.
  - *Level 3: Anonymous Persona*: Personal name details are truncated into initial aliases (e.g. 'J. D.'), and contact coordinates are masked.
  - *Level 4: Maximum Cloak*: Full stealth mode. Names are aliased, contact coordinates are masked, and past/current employer company names are dynamically redacted (e.g., 'Google' is replaced with '[Redacted Employer]') so currently active companies can never identify the candidate.
- **Searchable Sourcing Expansion**: Refactored the talent search query in `/src/pages/EmployerSourcing.tsx` to retrieve candidate profiles filtering by `privacy.searchable == true` instead of `privacy.isPublic == true`. This resolves the issue where recruiters were unable to discover candidates who kept their public profile pages locked but actively opted-in to passive talent sourcing.
- **Dynamic Redaction Filters & Badge Indicators**: Upgraded the candidate search results in `/src/pages/EmployerSourcing.tsx` and read-only pages in `/src/pages/PublicProfile.tsx` to dynamically apply level-specific field masking. Added color-coded badges indicating the active privacy tier (L2, L3, L4) with clear structural explanations for recruiters.
- **Legacy Property Backward Compatibility**: Added automatic mapping in `/src/pages/ProfileEditor.tsx` to seamlessly initialize `privacyLevel` from any pre-existing `redactPii` properties upon profile load. Supported default parameter mappings across `/src/pages/ProfileWizard.tsx` and `/src/utils/jsonProfileParser.ts`.

## [0.1.8] - 2026-07-17
### Added
- **Interactive Sourcing & Funnel Analytics Dashboard**: Built a robust candidate-facing analytics page (`/src/pages/JobSeekerAnalytics.tsx`) with highly polished visual metrics. Included real-time live application milestone conversions, privacy shield block tracking, and target benefits feasibility matching.
- **Navbar Dropdown Integration**: Added direct entry links to Sourcing Analytics inside `/src/App.tsx`'s interactive profile menu and mapped the `#analytics` hash route cleanly.
### Fixed
- **Profile Regeneration After Data Wipe**: Patched a blocking issue in `/src/pages/ProfileEditor.tsx` where loading a wiped profile failed with "No profile found". Now dynamically initializes a default clean profile state so users can edit and save changes immediately.

## [0.1.7] - 2026-07-17
### Added
- **Candidate Danger Zone Controls**: Developed a highly secure "Danger Zone" card nested inside the Privacy & Security tab of `/src/components/profile/PrivacyControls.tsx`. Includes dual-safety confirmed actions:
  - *Purge Professional Profile*: Prompts users to type `WIPE` to delete their master profile document and clear related application records instantly.
  - *Request Account Deletion*: Prompts users to type `DELETE` to purge database documents, set a deletion request timestamp on their core user account record, and programmatically attempt Auth record termination before signing out.
- **Interactive Target Benefit Requests Builder**: Integrated custom benefit request builders into `/src/pages/ProfileEditor.tsx`. Provides a high-contrast horizontal selector for 10 standard workplace benefit requests (e.g. Remote/Hybrid Work, 401(k) Matching, Generous PTO) alongside a custom tags form input for specifying bespoke benefits (e.g., Stock Options). Updates state and saves changes reactively to the modified profile structure in Firestore.
- **Data Schemas & Parsing Support**: Updated `/src/types/index.ts`, `/firebase-blueprint.json`, and `/src/utils/jsonProfileParser.ts` to seamlessly parse and persist target benefits from structured profile JSON payloads.

## [0.1.6] - 2026-07-17
### Added
- **Developer & Admin Workspace**: Designed and deployed a complete administrative console `/src/pages/AdminPanel.tsx` with dynamic telemetry counts for job listings, applications, and registered logins. Integrated direct seeding buttons for four core industries (Healthcare, Finance, Retail, Education) and confirmation-guarded actions to completely clear mock listings or application logs.
- **Dynamic Dropdown User Navigation**: Rebuilt the Navbar in `/src/App.tsx` with a highly polished interactive dropdown menu. Streams live candidate and company profile details from Firestore to dynamically compute and display name, role, and progress bar completeness (e.g. 80% Complete). Offers a clear selector layout to transition between viewing public profiles (with compliance-guarded PII redaction) and editing profile builders.
- **Enriched Sourcing & Privacy Copy**: Refactored `/src/pages/EmployerSourcing.tsx` to enrich visual alerts, search headers, and passive candidate cards with compliant and professional terminology. Clearly explains PII redactions, candidate exclusion restrictions, and algorithm-assisted matching without AI buzzwords.

## [0.1.5] - 2026-07-17
### Added
- **Multi-line & Rich Text Formatting Engine**: Created and deployed the `RichText` component to cleanly parse and render Basic Markdown (such as bold, italic, list bullet points, code, and hard newlines). Replaced hardcoded paragraphs with `RichText` inside professional summary, work experience descriptions, volunteer details, key contributions, and accommodation request narratives.
- **Dynamic Layout & Section Ordering Editor**: Embedded the custom-built `SectionOrderEditor` inside a new "Layout Ordering" tab in `/src/pages/ProfileEditor.tsx`, allowing candidates to drag, arrange, and reorder core profile sections (About, Experience, Top Skills, Volunteer Leadership, DEI & Accommodations) and auto-save section order configurations to Firestore in the background.
- **Dynamic Public Profile Section Rendering**: Upgraded `/src/pages/PublicProfile.tsx` to read `profile.sectionOrder` from the database (falling back to a smart default sequence if unconfigured) and map section rendering dynamically, giving candidates complete control over their profile layout.

## [0.1.4] - 2026-07-17
### Added
- **DEI & Accommodations Core Engine**: Developed a dedicated `DeiAccommodationsEditor` component managing voluntary disclosures (gender identity, race, veteran, disability status) and customized interview accommodation selections (screen reader optimization, extra assessment time, live transcription, quiet settings, wheelchair access).
- **Preferred Name & Pronouns Fields**: Upgraded the standard `PersonalInfoEditor` to capture voluntary preferred name and pronouns with fully responsive form entries.
- **Privacy-First Public Display**: Upgraded `PublicProfile.tsx` to automatically display candidate pronouns and render customized interview accommodations and DEI cards. Enforced privacy boundaries where demographic data is only visible on public links if explicitly authorized, keeping user information completely secure.

## [0.1.3] - 2026-07-17
### Added
- **Instant Background Auto-Saving**: Programmed direct Firestore background writes inside `ProfileEditor.tsx`'s `PrivacyControls` change callback, guaranteeing settings panels instantly synchronize with the database without requiring manual clicks on the "Save Changes" button.
- **Smart Owner-Bypass and Preview Banners**: Upgraded `PublicProfile.tsx` to detect if the logged-in viewer is the profile's owner. Added dynamic warning and status headers at the top of the profile page to clarify when they are looking at a private preview versus a fully published public link.

### Changed
- **High-Contrast Green Toggles**: Styled all settings panel switches with a highly vibrant `peer-checked:bg-emerald-500` style, making the active states extremely rich and eye-catching.

## [0.1.2] - 2026-07-17
### Fixed
- **Privacy Toggle Layout Refactoring**: Upgraded `PrivacyControls.tsx` to place the toggle switches on the right next to headers/descriptions in a responsive side-by-side flex setup, preventing line overlapping and container overflows inside constrained spaces/iframes.
- **Toggle Button Coordinate Lock**: Added the missing `relative` positioning attribute to the slider wrapper element in `PrivacyControls.tsx` to lock absolute coordinates for pseudo-element button knobs, eliminating misalignment.
- **Responsive Editor Content Pane**: Optimized the main Profile Editor content pane (`ProfileEditor.tsx`) by introducing responsive padding classes (`p-4 sm:p-6 md:p-8`) alongside strict `min-w-0 w-full overflow-hidden` layouts, ensuring perfect display bounds on narrow screens and browser frames.

## [0.1.1] - 2026-07-17
### Added
- **Structured JSON Profile Upload**: Built `JsonProfileUpload.tsx` supporting drag-and-drop or manual file browser uploads of candidate profile `.json` files.
- **Interactive JSON Profile Import**: Integrated the JSON profile import option directly inside the Onboarding Wizard (`ProfileWizard.tsx`) and the Sidebar settings (`ProfileEditor.tsx`), allowing immediate population of fields.
- **Deep Profile Schema Parser**: Formulated `/src/utils/jsonProfileParser.ts` to map elaborate nesting (e.g., core competencies, soft/technical/mission-driven skills, volunteer experience, salary ranges, working styles, personal value insights, and accommodations requests) into standard database fields, while keeping the original object intact under `parsedData`.
- **Inclusive Public Profile Renderers**: Augmented `/src/pages/PublicProfile.tsx` to dynamically construct gorgeous visual sections for volunteer experience, personal core superpowers, inclusive accommodations request phases (recruitment, interviewing, onboarding), and focus/collaboration hours.
- **Public Profile Link Sharing Toggle**: Implemented an explicit `isPublic` (Public Profile Link Sharing) card at the top of the candidate's `PrivacyControls.tsx` settings, exposing the real-time generated URL and incorporating a one-click Copy clipboard utility.
- **Robust Type Extensions**: Extended the `Application` type in `src/types/index.ts` to support optional `jobTitle` and `companyName` values, resolving and silencing layout compilation warnings.
- **Private Profile Visual Template**: Designed and styled an elegant "Confidential Layout Sample" for locked or private public profiles. It displays a secure disclaimer box with a Lock icon alongside an anonymized, blurred layout preview showing the structured categories of an active profile without exposing sensitive candidate details.
- **Privacy Layout & Contrast Fixes**: Resolved layout and description line overflows on the `PrivacyControls.tsx` panel by introducing highly responsive flex rules, wrapping parameters, break-word classes, and applying robust dark mode borders to all configuration cards.

## [0.1.0] - 2026-07-17
### Added
- **Company Onboarding Wizard**: Added `CompanyWizard` for new recruiter/employer signups to configure company name, industry, roles, and sizing without going through a standard resume uploader.
- **Employer Dashboard**: Added `EmployerDashboard` out-of-the-box routing for companies/recruiters with pipeline ATS tracker stats and embedded Talent Search functionality.
- **Application Cleaning**: Added a 'Clear All Apps' button to the `JobSeederModal` to remove orphaned application statuses when test jobs are wiped.
- **Job Application Tracking**: Implemented the 'Apply Now' functionality inside `JobDescription`, tracking applied positions via Firestore and syncing correctly directly to the Application Pipeline and Recent Applications sidebars.
- **Recent Applications Routing**: Updated `JobSeekerDashboard` sidebars and pipeline blocks to route through to the application status details via the hash anchor links `#job/:id` so they are accessible in later states.
- **Resume Preview Modals**: Integrated an iframe-based original PDF/Document preview option within the `ProfileWizard` reviewing step using `resumePreviewUrl`.
- **Match Testing**: Added a 'Clear All Jobs' capability to the `JobSeederModal` to completely wipe all mock database listings to ensure a fresh clean state.
- **Matching Documentation**: Created `Docs/RoadMaps/Assisted_Insights_Matching.md` detailing the string-matching logic and fit score mechanism behind job matches.
- **Diverse Job Seeds**: Updated `JobSeederModal.tsx` to inject mock jobs across Healthcare, Retail, Education, and Finance industries to better test keyword overlapping.

### Changed
- **Dashboard Sidebar Styling**: Consolidated right-hand sidebars ('Market Insights' and 'Recent Applications') to use identical responsive background styles (`bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800`), fixing legibility issues in dark mode.
- **Removed AI Branding**: Rephrased text across JobSeekerDashboard, ProfileWizard, ProfileEditor, and ResumeUpload to reframe features as system-assisted or algorithmic rather than AI-driven, aligning with user preferences for explicit opt-in.

### Added
- **Job Description View**: Implemented `JobDescription.tsx` to provide algorithmic fit breakdown via 'Assisted Insights', explicitly avoiding AI branding while surfacing requirement matching via regex comparison.
- **Dual Pipeline Resume Parsing**: Implemented regular algorithmic regex parsing as standard, with an optional AI Opt-in checkbox in `ResumeUpload` using Gemini 2.5 Flash for those who request it.
- **Dark Mode**: Configured `native Tailwind @custom-variant dark` in `index.css` and added native dark mode support. Updated Sourcing, JobSeekerDashboard, ProfileWizard, ProfileEditor, Sourcing, Registration, and PublicProfile UI layouts with `dark:` utility variants.
- **Theme Hook**: Created `useTheme` hook with system preference observation and local storage caching.
- **Theme Toggle**: Introduced Moon/Sun UI in the `Navbar`.
- **Employer Sourcing UI**: Built `/src/pages/EmployerSourcing.tsx` to query candidates based on role.
- **Privacy Search Engine**: Added `/api/search/candidates` in Express to evaluate exclusion rules, redaction states, and securely serve public candidate profiles directly from Firestore.
- **Public Share Links**: Created `PublicProfile.tsx` for read-only, shareable candidate profiles (e.g., `#profile/<uid>`). Redact PII dynamically via backend logic.
- **Security Rules**: Updated `firestore.rules` to correctly handle `isPublic` reads while securing write restrictions to owners.
- **Profile Edit Components**: Added specialized editors for Experience, Personal Details, and Privacy Controls.
- Agent workflow instructions and methodology documents.
- Basic structure for Roadmaps and Audits.

### Fixed
- **Onboarding Styles**: Fixed overlap issues with the top fixed navigation on `CompanyWizard` and `ProfileWizard` by adding a `pt-24` margin on the intake forms to ensure breadcrumbs and progress counters are visible.
- **Account Type Integrity**: Hardened the registration flow preventing users from accidentally selecting conflicting profile types on login. Mismatched account attempts now show an immediate alert, and users can safely login without specifically selecting a type if an account already exists.
- **Permission Errors**: Resolved "Missing or insufficient permissions" errors caused by the Firebase Client SDK making unauthenticated queries in the Node.js backend. Migrated the Candidate Search logic and Public Profile document queries directly to the client (`EmployerSourcing.tsx` and `PublicProfile.tsx`), leveraging the natively authenticated `request.auth` context to evaluate Firestore Rules successfully.
- Fixed email splitting bug causing crash for unauthenticated users.
- Patched API keys error and restored functionality with safe logic.

## [0.5.4] - 2026-07-23
### Changed
- **Skill Editing & Catalog Association**: Refactored the Skills Editor to support direct inline editing of existing skills. Added a robust cascading datalist for skill name autocomplete that automatically associates with the selected Domain and Sub-Domain fields from the Skills Catalog.

## [0.5.5] - 2026-07-23
### Added
- **Expanded Skills Catalog**: Replaced the initial tech-only dictionary with a comprehensive dictionary covering multiple industries (Technology, Finance & Accounting, Healthcare & Medicine, Blue Collar & Trades, Education, Legal, and Hospitality) for broader user support.
- **Skill Auto-Detection**: Implemented `autodetectSkillCategory` utility which locally infers a skill's domain and subdomain in real-time as the user types, and automatically populates the category drop-downs.
- **Enhance All Skills Rule Engine**: Restored the "Enhance All" functionality using a local rule engine instead of an external API, seamlessly re-categorizing legacy and unrecognized skills using the comprehensive catalog.

### Fixed
- **Skill Visualizer & Editor Crashes**: Resolved `Uncaught TypeError` crashes by adding robust fallbacks for legacy skill domains (e.g., "Technical") that were missing from the newly expanded `SKILLS_CATALOG`. Ensuring `SkillVisualizer` defaults to an empty array to prevent `reduce` errors when a user's skills are not yet fully populated.
