# Roadmap: GovJobs Bridge Integration (NEOGOV/GovernmentJobs.com)

## Strategic Objective
Enable public sector employers and job seekers to seamlessly ingest, match, and audit job listings from local state and government job boards (primarily powered by NEOGOV/GovernmentJobs.com).

---

## 1. Governance & Authority (ITIL Practice 4.2.1)
- **Change Classification**: Normal Change (New Feature & Integration)
- **Standard Baseline**: NASA JPL Power of 10 & WCAG 2.1/2.2 AA Compliance
- **Stakeholder**: Job Seekers (Importing for match validation), Employers (Mirroring gov listings)

---

## 2. Technical Architecture

### A. Data Ingestion Pattern
- **Input Modes**: 
  - **Raw Text Ingestion**: Paste entire job description for heuristic parsing.
  - **URL Metadata Extraction**: (Future Phase) Proxy-based metadata parsing.
- **Parsing Engine**: Heuristic Gemini-powered extractor targeting specific NEOGOV fields:
  - `Salary Range` (Hourly/Annually conversion)
  - `Closing Date` (Application deadline tracking)
  - `Department/Division`
  - `Minimum vs Preferred Qualifications`
  - `Job Number`

### B. Matching Engine Integration
- Map ingested gov listings to the `parsedCriteria` schema in `Job` type.
- Enable the **Assisted Insights Matching Engine** to evaluate candidate profiles against gov-specific requirements (e.g., specific residency or licensure).

---

## 3. Implementation Phases

### Phase 1: GovJobs Parser Utility (Engineering)
- [x] Integrate specialized `govJobsNlpParse` within `server.ts` with multi-tier hourly/annual salary normalization and job number extraction.
- [x] Standardize 3-Tier Prompt Matrix (`V1 Fast`, `V2 Semantic`, `V3 Executive`) across the backend and bridge UI.

### Phase 2: Bridge UI Component (Frontend)
- [x] Create `src/components/GovJobsBridge.tsx`.
- [x] Implement "GovJobs Ingestion Workspace" with 3-tier prompt matrix controls, multi-line text input, and live schema preview.
- [x] Add "Mirror to Ascend ATS" action to save ingested jobs to Firestore.

### Phase 3: Dashboard Integration
- [x] Add "GovJobs Bridge" workspace to `EmployerDashboard` and `EmployerSourcing`.
- [x] Add Chrome extension ingestion support for `governmentjobs.com` with granular `.term-block` scraping.
- [x] Update `Docs/STRUCTURE.md` and `Docs/CHANGELOG_DEV.md`.

---

## 4. Verification Gate (NASA JPL Rule 10)
- [x] 0 Linter Errors (`tsc --noEmit`)
- [x] 100% Green Applet Compilation Gate (`compile_applet`)
- [x] WCAG AA Contrast Verification on Bridge UI and Extension
- [x] Firestore Security Rules Audit for `jobs` collection

---

## 5. Completed Milestone Archive
- **Milestone GJB-001 (Completed 2026-09-30)**: Complete GovJobs / NEOGOV ingestion engine, 3-tier prompt matrix integration, extension bridge scraping, and Firestore mirroring.
