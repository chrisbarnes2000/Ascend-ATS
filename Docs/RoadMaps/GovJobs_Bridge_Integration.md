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
- [ ] Create `src/utils/govJobsParser.ts`.
- [ ] Define `GovJobSchema` for intermediate representation.
- [ ] Implement Gemini prompt template for NEOGOV-specific extraction.

### Phase 2: Bridge UI Component (Frontend)
- [ ] Create `src/components/GovJobsBridge.tsx`.
- [ ] Implement "GovJobs Ingestion Workspace" with multi-line text input and live preview.
- [ ] Add "Mirror to Ascend ATS" action to save ingested jobs to Firestore.

### Phase 3: Dashboard Integration
- [ ] Add "GovJobs Bridge" tab to `EmployerDashboard`.
- [ ] Add "Import Gov Job" trigger to `JobSeekerDashboard` (for personal matching).
- [ ] Update `Docs/STRUCTURE.md` and `Docs/CHANGELOG_DEV.md`.

---

## 4. Verification Gate (NASA JPL Rule 10)
- [ ] 0 Linter Errors (`tsc --noEmit`)
- [ ] 100% Green Unit Tests
- [ ] WCAG AA Contrast Verification on Bridge UI
- [ ] Firestore Security Rules Audit for `jobs` collection

---

## 5. Completed Milestone Archive
- (No milestones completed yet)
