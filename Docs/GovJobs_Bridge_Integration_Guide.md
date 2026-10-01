# GovJobs Bridge Integration Guide
> Technical Specification for NEOGOV / GovernmentJobs.com High-Fidelity Ingestion

---

## 1. Executive Summary
The **GovJobs Bridge** is a specialized integration layer designed to ingest and parse public sector job listings from boards powered by **NEOGOV** (primarily `governmentjobs.com`). It leverages a combination of heuristic local NLP and Gemini-powered semantic analysis to convert unstructured government job descriptions into the structured **Ascend ATS** job schema.

---

## 2. Ingestion Pipeline

### A. Raw Text Ingestion
Users can paste the full text of a government job listing into the GovJobs Bridge workspace. The system executes a two-pass parsing strategy:

1. **Pass 1 (Heuristic localNlpParse)**: 
   - Uses RegEx to extract the **Job Number**, **Department**, and **Division**.
   - Identifies **Salary Type** (Hourly vs. Annual) and performs standard 2080h conversion for annual normalization.
   - Extracts **Closing Dates** to set requisition expiration.
2. **Pass 2 (AI-Powered Semantic Enhancement)**:
   - Uses `gemini-3.8-flash` to extract unstated expectations and strategic interview advice.
   - Categorizes skills into the Ascend ATS taxonomy (Technical, Soft Skills, etc.).

---

## 3. Data Schema Mapping

| GovJobs Field | Ascend ATS Job Field | Mapping Logic |
| :--- | :--- | :--- |
| **Job Number** | `jobNumber` | Exact string match |
| **Salary ($ Hourly)** | `salaryMin` / `salaryMax` | `(Hourly Rate) * 2080` |
| **Department / Division** | `department` | Combined string: `Dept (Div)` |
| **Closing Date** | `expiresAt` | Parsed ISO date string |
| **Job Type** | `workplaceType` | Inferred (On-Site/Remote) |
| **Description** | `description` | Markdown-beautified raw text |

---

## 4. UI Workspace
The bridge is accessible via the **Recruitment Workspace** > **GovJobs Bridge** tab.

### Features:
- **Heuristic Preview**: Instant parsing feedback before saving.
- **Mirror to Ascend**: One-click creation of a managed requisition in Ascend ATS.
- **Strategic Insights**: AI-generated advice for recruiters and candidates regarding specific public sector nuances.

---

## 5. Security & Governance
- **Data Isolation**: Ingested jobs are owned by the ingesting user's `companyId`.
- **Compliance**: Adheres to the **NASA JPL Power of 10** safety rules for bounded text processing.
- **Privacy**: No PII is collected from the source URLs; only public-facing job data is mirrored.

---

## 6. Maintenance
To update the parser for new NEOGOV layout shifts, modify the `govJobsNlpParse` function in `server.ts`.
