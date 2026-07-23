# Project Structure

```
├── /Docs/                 # Project documentation and architectural guidelines
│   ├── Agents_Instructions/ # Formatting and rules for AI agents
│   └── RoadMaps/          # Feature roadmaps and implementation plans
├── /src/                  # React Application Source Code
│   ├── components/        # Reusable UI components (e.g., JobRequisitionEditor, JsonProfileUpload, ResumeUpload, Profile Section ordering, RichText renderers)
│   ├── firebase/          # Firebase configuration and initialization
│   ├── hooks/             # Custom React hooks (e.g., useAuth)
│   ├── pages/             # Page components (e.g., JobSeekerDashboard, JobSeekerAnalytics, ProfileWizard, CompanyWizard, EmployerDashboard)
│   ├── types/             # Shared TypeScript definitions
│   └── utils/             # Utility helpers (e.g., jsonProfileParser)
├── /server.ts             # Express server entry point (API and Vite integration)
└── /package.json          # Dependency management and script definitions
```
