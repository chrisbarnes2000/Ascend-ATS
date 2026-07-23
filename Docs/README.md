# Ascend ATS

Ascend ATS is a modern application designed to streamline the recruitment and application process for job seekers, companies, and staffing firms.

## Architecture & Setup
- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend / Database**: Firebase Firestore for persistent storage, Firebase Auth for user management.
- **AI Processing**: Gemini API for rule-based or AI-assisted parsing.

## Features
- **Structured JSON Profile Upload**: Direct drag-and-drop ingestion of candidates' professional profiles using robust schema mapping (competencies, volunteer experience, work-style preferences, accommodations, and values).
- **Rich Skills Taxonomy & Editor**: Deeply structured competency tracking allowing categorization by Domain (Technical, Soft Skills, Leadership, etc.), proficiency levels, and exact years of experience, with dynamic grouping, bulk edit controls (Enhance/Clear All), and backward compatibility.
- **Layout Re-ordering & Custom Section Order**: Interactive custom section arrangement (About, Experience, Skills, Volunteer, DEI & Accommodations) with instant background auto-saving to Firestore.
- **Rich Text Rendering**: Basic Markdown parsing and rendering (bold, italics, bullets, code, and hard newlines) on professional summaries, experience, volunteer descriptions, and accommodations.
- **Public Share Toggles & Sliding Data Privacy Scale**: Interactive, copyable public candidate links with a 4-level sliding data privacy range selector (Level 1: Unrestricted, Level 2: Masked Contact, Level 3: Anonymous Persona, Level 4: Maximum Cloak). Level 4 dynamically redacts all current and past employer names in the candidate's work experience history to prevent pre-emptive company discovery.
- **Company Profiles & Connection Requests**: Seamless deep-linking of employers from job matches directly to a detailed organizational card. Built an onboarding connection pipeline for un-handshaked employers to register partnership interest.
- **Recruiter Company Association & ATS Filtering**: Recruiters can link/claim their user profile to registered company entities (e.g. Acme Corp, CloudScale), enabling company-specific ATS pipeline filtering with a toggle for global candidate pool access.
- **Requisition Manager & HR Edit Audit Trail**: HR personnel can view and edit live job descriptions with mandatory edit justification logging ("Candidate Info Request", "Salary Adjustment", "Scope Clarification") and full revision history tracking (v1.0, v2.0, author, timestamp, diffs) accessible by HR and candidates.
- **Nefarious Change Guardrails & Material Shift Detection**: Automatic audit engine detecting post-application compensation drops or unexpected scope creep, assigning a transparency rating and alerting HR and candidates.
- **Community Job Posting Templates & Benchmarks**: Curated library of high-converting, community-proven job templates (e.g., Senior Full-Stack Engineer, Clinical Research Lead) with verified salary transparency ratings.
- **Categorized Pipeline Messaging & Rationale**: Recruiters can attach structured notes and messages ("Offer Rationale", "Info Requests", "Interview Notes") directly to candidates' application timelines when advancing candidate statuses.
- **Why & How Profile Matched Breakdown Engine**: Qualitative algorithmic match engine evaluating salary range fit, workplace setting alignment (Remote/Hybrid/On-Site), provided vs. requested benefits, core vs. preferred skills, and employer flexibility ("Willing to Consider" options) rendered on job cards and detail views.
- **Enhanced Job Requisition Criteria & Settling Options**: Job description editor with required vs. preferred skill separation, provided benefits checklist, and employer settling criteria (e.g. open to equivalent experience, transferable skills, lower years of experience).
- **Score-Adaptive Job Styling**: Smart match-score adaptive visual layouts, highlighting elite match scores exceeding 90% with custom dark emerald fields and gold-plated borders.
- Candidate Profile CRUD (Create, Read, Update, Delete)
- Job Seeker Dashboard & Employer ATS Dashboard
- Company/Recruiter Onboarding Workflows
- Resume Parsing and Data Extraction
- Job Matching and Browsing
- **System Administrator Panel**: Control console allowing developers to seed simulated positions across healthcare, finance, retail, and education, and clear database records.

## Core Concepts
For transparent deterministic operations like algorithm skill matching calculation, refer to the [Assisted Insights Matching Engine](./RoadMaps/Assisted_Insights_Matching.md) roadmap file.

## Setup
Run the development server using:
```bash
npm run dev
```
