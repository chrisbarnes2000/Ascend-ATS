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
│   ├── RapportVerse_Bridge_Integration_Guide.md # Technical contract & implementation guide for RapportVerse
│   ├── GovJobs_Bridge_Integration_Guide.md # Technical spec for NEOGOV / GovernmentJobs.com ingestion
│   └── Ascend_ATS_Partner_Kit.md # Partnership badges and markdown integration kit
├── /public/               # Public static assets, machine-readable indexes & device icons
│   ├── site.webmanifest   # W3C Web App Manifest for mobile and desktop PWA installation
│   ├── favicon.svg        # Scalable vector favicon
│   ├── favicon.ico        # Fallback binary favicon
│   ├── favicon.png        # Standard 32x32 bitmap favicon
│   ├── apple-touch-icon.png # 180x180 iOS Safari touch bookmark icon
│   ├── pwa-192x192.png    # 192x192 Android / Chromium PWA home screen icon
│   ├── pwa-512x512.png    # 512x512 Android / Chromium splash icon
│   ├── robots.txt         # Search engine crawler index directive & mirror (Robot.txt)
│   ├── llms.txt           # Structured machine-readable LLM ecosystem index & mirrors (llm.txt, LLMs.txt)
│   ├── 400.html           # Standalone accessible 400 Bad Request error page
│   ├── 404.html           # Standalone accessible 404 Not Found error page
│   └── 500.html           # Standalone accessible 500 Internal Server Error page
├── /src/                  # React Application Source Code
│   ├── components/        # Reusable UI components (e.g., JobRequisitionEditor, JsonProfileUpload, ResumeUpload, Profile Section ordering, RichText renderers)
│   │   └── tracker/       # Job tracker, ingestion form, and AI resume tailoring workspace
│   ├── firebase/          # Firebase configuration and initialization
│   ├── hooks/             # Custom React hooks (e.g., useAuth)
│   ├── pages/             # Page components (e.g., LandingPage, JobSeekerDashboard, JobSeekerAnalytics, ProfileWizard, CompanyWizard, EmployerDashboard, AffiliatesPage, RapportVersePage, AdminPanel with Staffing Invitation Gateway)
│   ├── types/             # Shared TypeScript definitions
│   └── utils/             # Utility helpers (e.g., jsonProfileParser)
├── /server.ts             # Express server entry point (API and Vite integration)
└── /package.json          # Dependency management and script definitions
```
