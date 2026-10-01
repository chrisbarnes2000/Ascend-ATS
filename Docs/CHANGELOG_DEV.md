# Developer Changelog (High-Frequency Engineering Log)

This internal engineering log records granular development actions, architecture refactoring, diagnostic findings, ITIL service management changes, and test execution details on every development turn.

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
