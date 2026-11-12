# Project Structure

```
├── /Docs/                 # Project documentation and architectural guidelines
│   ├── CHANGELOG_DEV.md   # High-frequency developer changelog and ITIL audit trail
│   ├── CHANGELOG.md       # Public milestone releases
│   ├── ITIL_GOVERNANCE.md # ITIL v4 Service Management & Safety-Critical Governance Policy
│   ├── FSD_SPECIFICATION.md # Functional Specification Standard & Actor Authority Matrix
│   ├── DELEGATION_AND_CHECKIN.md # 5-Point Delegation & Check-In Governance Framework
│   ├── SPRINT_CEREMONIES.md # Agile Sprint Ceremonies & Retrospective Engine
│   ├── INDEX_ROADMAP.md   # Strategic Roadmap & Completed Milestone Archive
│   ├── INDEX_AUDIT.md     # Engineering Quality & Compliance Scorecard
│   ├── RoadMaps/          # Architectural roadmap specifications (e.g., Dedup_Validation_Merge_Engine.md)
│   ├── RapportVerse_Bridge_Integration_Guide.md # Technical contract & implementation guide for RapportVerse
│   ├── GovJobs_Bridge_Integration_Guide.md # Technical spec for NEOGOV / GovernmentJobs.com ingestion
│   ├── FastCompany_26_Cultural_Values.md # Fast Company Impact Council 26 Cultural Values tracking doc
│   ├── Manpower_5_Keys_Working_With_Recruiter.md # Manpower 5 Keys to Working with a Recruiter tracking doc
│   ├── EXTENSION_ARCHITECTURE.md # Architecture & sub-components specification for browser extension
│   └── Ascend_ATS_Partner_Kit.md # Partnership badges and markdown integration kit
├── /public/               # Public static assets, machine-readable indexes & device icons
│   ├── templates/         # Downloadable JSON templates
│   │   ├── resume-simplified-template.json # Simplified resume JSON template (v2026.10.04)
│   │   ├── resume-advanced-persona-template.json # Advanced portfolio persona JSON template (v2026.10.04)
│   │   └── recruiter-profile-template.json # Recruiter talent sourcing JSON template (v2026.10.04)
│   ├── schemas/           # Formal JSON Schema specifications
│   │   ├── resume-simplified.schema.json # JSON Schema Draft-07 for simplified resume
│   │   └── recruiter-profile.schema.json # JSON Schema Draft-07 for recruiter profile
│   ├── site.webmanifest   # W3C Web App Manifest for mobile and desktop PWA installation
│   ├── favicon.svg        # Scalable vector favicon
│   ├── favicon.ico        # Fallback binary favicon
│   ├── favicon.png        # Standard 32x32 bitmap favicon
│   ├── apple-touch-icon.png # 180x180 iOS Safari touch bookmark icon
│   ├── pwa-192x192.png    # 192x192 Android / Chromium PWA home screen icon
│   ├── pwa-512x512.png    # 512x512 Android / Chromium splash icon
│   ├── robots.txt         # Search engine crawler index directive & mirror (Robot.txt)
│   ├── PARSING_ENGINE_SUMMARY.md # DeepSeek token optimization & parsing engine architecture summary
│   ├── 400.html           # Standalone accessible 400 Bad Request error page
│   ├── 404.html           # Standalone accessible 404 Not Found error page
│   └── 500.html           # Standalone accessible 500 Internal Server Error page
├── /extension/            # Browser Extension (Manifest V3 Ingestion Bridge)
│   ├── manifest.json      # Manifest V3 configuration and content scripts registry
│   ├── popup.html         # Lean semantic popup workspace template
│   ├── popup.js           # Main popup orchestrator (< 60 lines)
│   ├── content.js         # Main content script orchestrator (< 60 lines)
│   ├── background.js      # Background service worker (contextMenus)
│   ├── css/               # Unified design token stylesheets
│   │   ├── tokens.css     # Canonical shared CSS variables (colors, radii, shadows)
│   │   ├── popup.css      # Scoped popup workspace styles
│   │   └── content.css    # Scoped injected button and modal styles
│   └── modules/           # Decomposed single-responsibility sub-components
│       ├── popup/         # Popup sub-components (auth-manager, prompt-matrix, readiness-radar, fit-evaluator, popup-ui, ingest-controller, admin-diagnostics, constants)
│       └── content/       # Content script sub-components (site-detector, scrapers, ingest-transport, overlay-modal, session-observer)
├── /src/                  # React Application Source Code
│   ├── components/        # Reusable UI components
│   │   ├── admin/         # Decomposed Admin Terminal subcomponents (AdminHeaderStats, AdminCandidateInspectorTab, AdminJobModerationTab, AdminJobValidationModal, AdminPostDetailsModal, AdminDataSeedingTab, AdminInvitationsTab, AdminPartnerRequestsTab, AdminRecruiterLeadsTab, AdminMassImportTab, AdminSecurityTab, AdminConfirmationModal, adminMockData)
│   │   ├── profile/       # Profile management editors (TargetIndicatorsEditor, IndustryEditor, LocationEditor, ExperienceEditor, PersonalInfoEditor, SkillsEditor, PrivacyControls, DeiAccommodationsEditor, SectionOrderEditor)
│   │   ├── tracker/       # Job tracker, ingestion form, and AI resume tailoring workspace
│   │   ├── DashboardSubNav.tsx # Responsive adaptive mobile sub-navigation bar with micro-icons and concise typography
│   │   ├── CompanyLogo.tsx # Multi-provider cascading company logo & monogram component
│   │   └── ReportJobModal.tsx # Multi-role candidate/recruiter modal for reporting misparsed or bad postings
│   ├── data/              # Static catalogs & rosters (culturalValuesCatalog.ts, skillsCatalog.ts, masterContactRoster.ts)
│   ├── firebase/          # Firebase configuration and initialization
│   ├── hooks/             # Custom React hooks (e.g., useAuth)
│   ├── pages/             # Page components (e.g., LandingPage, JobSeekerDashboard, JobSeekerAnalytics, ProfileWizard, CompanyWizard, EmployerDashboard, AffiliatesPage, RapportVersePage, AdminPanel with Staffing Invitation Gateway & Mass Ingestion)
│   ├── types/             # Shared TypeScript definitions
│   └── utils/             # Modular utilities (e.g., identityGovernance, jobDedup, profileMerge, materialShiftEngine, applicationLifecycle, jsonProfileParser, massOutreachParser, textWhitespaceNormalizer, locationAndWorkplaceSanitizer, salarySanitizer, companyLogoResolver)
├── /tests/                # Automated unit and integration test suite
│   ├── runAllTests.ts     # Master test execution harness
│   └── unit/              # High-density invariant and boundary unit tests (e.g., dashboardSubNav.test.ts, companyLogoResolver.test.ts, textWhitespaceNormalizer.test.ts, locationAndWorkplaceSanitizer.test.ts, salarySanitizer.test.ts, jobModerationAndNlpGuards.test.ts, jobDedup.test.ts, profileMerge.test.ts, materialShiftEngine.test.ts)
├── /server.ts             # Express server entry point (API and Vite integration)
└── /package.json          # Dependency management and script definitions
```
