# Ascend ATS Browser Extension Architecture & Sub-Component Specification

**Document Version:** `v1.2.0`  
**Classification:** Core System Pillar (Ingestion Bridge)  
**Safety Ceilings:** NASA JPL Power of 10 Rules Compliant (Single Responsibility, <60 Lines per Method, Fixed Bounds)

---

## 1. Architectural Overview & Design Constitution

The **Ascend ATS Ingestion Bridge** is a multi-browser extension (Manifest V3) engineered to ingest requisitions and applications directly from external job boards (LinkedIn, Indeed, GovernmentJobs / NEOGOV) into the Ascend ATS platform with zero manual copy-pasting.

### Core Architecture Principles
1. **Single-Responsibility Principle (SRP)**: Every JavaScript function performs exactly one deterministic task, with inputs validated on entry and outputs guaranteed.
2. **Native ES Modules & Zero-Build Loading**: The popup workspace operates via native ECMAScript modules (`<script type="module" src="popup.js">`), enabling instant side-loading directly from `/extension` without requiring a build step or watcher.
3. **Unified Design Token System**: Styles are partitioned into a canonical design tokens sheet (`tokens.css`), a scoped popup workspace stylesheet (`popup.css`), and an isolated in-page injection stylesheet (`content.css`).
4. **NASA JPL Power of 10 Safety Ceilings**:
   - Compact function lengths strictly bounded under 60 executable lines.
   - Fixed loop iteration ceilings (e.g., maximum 30 summary block traverses).
   - Deterministic resource cleanup (mutation observers and heartbeat intervals teardown).
   - Complete parameter checking with zero untyped `any` escape hatches.

---

## 2. System Hierarchy & Component Diagrams

```
┌────────────────────────────────────────────────────────────────────────┐
│                   Ascend ATS Ingestion Bridge (v1.2.0)                 │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
           ┌─────────────────────────┴─────────────────────────┐
           ▼                                                   ▼
┌───────────────────────────────────────┐       ┌───────────────────────────────────────┐
│           Popup Workspace             │       │        Content Ingestion Engine       │
│             (popup.html)              │       │     (LinkedIn, Indeed, GovJobs)       │
├───────────────────────────────────────┤       ├───────────────────────────────────────┤
│ Stylesheets:                          │       │ Stylesheets:                          │
│   • css/tokens.css (Design Tokens)    │       │   • css/tokens.css (Shared Tokens)    │
│   • css/popup.css (Workspace Layout)  │       │   • css/content.css (Scoped Overlay)  │
│                                       │       │                                       │
│ Main Orchestrator:                    │       │ Main Orchestrator:                    │
│   • popup.js (<60 lines)              │       │   • content.js (<60 lines)            │
│                                       │       │                                       │
│ Sub-Components (modules/popup/):      │       │ Sub-Components (modules/content/):    │
│   ├── constants.js (Config & URLs)    │       │   ├── site-detector.js (Host Router)  │
│   ├── auth-manager.js (RBAC & Sync)   │       │   ├── scrapers.js (Platform Parsers)  │
│   ├── prompt-matrix-controller.js     │       │   ├── ingest-transport.js (HTTP POST) │
│   ├── readiness-radar.js (UI Metrics) │       │   ├── overlay-modal.js (Modal Dialog) │
│   ├── fit-evaluator.js (Tab Match)    │       │   └── session-observer.js (Sync Loop) │
│   ├── match-engine.js (Diff & Scoring)│       └───────────────────┬───────────────────┘
│   ├── admin-diagnostics.js (Health)   │                           │
│   ├── ingest-controller.js (Trigger)  │                           │
│   └── popup-ui.js (View Toggles)      │                           │
└───────────────────┬───────────────────┘                           │
                    │                                               │
                    └───────────────────────┬───────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       Ascend ATS Core Platform                         │
│   • POST /api/ingest-job (Multi-Tier Ingestion & Normalization)        │
│   • GET /api/prompt-matrix (Engine Latencies & Model Status)           │
│   • Firestore: `jobs` & `applications` Collections                     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Popup Sub-Components & Method Reference

All popup modules reside in `extension/modules/popup/` and are imported natively into `popup.js`.

### 3.1 `constants.js`
Centralized configuration registry eliminating untyped magic strings.
- `APP_BASE_URL` (`string`): The canonical Ascend ATS endpoint (`https://ascend-ats.ai.studio`).
- `PROMPT_INFO` (`Record<string, { latency: string, tag: string, desc: string }>`): Latency benchmarks, badge tags, and capabilities for `v1` (Fast Heuristic), `v2` (Semantic Taxonomy), and `v3` (Executive STAR Prep).

### 3.2 `auth-manager.js`
Handles reading credentials, synchronizing tokens across active browser tabs, and enforcing Role-Based Access Control (RBAC).

| Function | Parameters | Return Type | Single Responsibility |
|---|---|---|---|
| `canAccessRole(session, targetRole)` | `session: Object\|null`, `targetRole: 'seeker'\|'recruiter'\|'admin'` | `boolean` | Checks whether the user holds required role credentials. Architects (`Chris.Barnes.2000@me.com`) bypass all gates. |
| `trySyncSessionFromTabs(openIfNotPresent, onAuth, onUnauth)` | `openIfNotPresent?: boolean`, `onAuth: Function`, `onUnauth: Function` | `Promise<void>` | Inspects tabs running Ascend ATS for `ascend_auth_session` in `localStorage` and stores it into `chrome.storage.local`. |
| `signOutSession(onSignedOut)` | `onSignedOut: Function` | `void` | Purges `ascendSession` from `chrome.storage.local` and executes teardown callback. |

### 3.3 `prompt-matrix-controller.js`
Coordinates the 3-Tier AI Prompt Ingestion Matrix (`v1`, `v2`, `v3`).

| Function | Parameters | Return Type | Single Responsibility |
|---|---|---|---|
| `setPromptVersion(version, onChange)` | `version: 'v1'\|'v2'\|'v3'`, `onChange?: Function` | `void` | Updates active button styles, updates latency indicator, persists to `chrome.storage.local`, and triggers callback. |
| `initPromptMatrix(onVersionChange)` | `onVersionChange: Function` | `void` | Wires click listeners to `.prompt-btn` elements and restores user's saved version from storage. |

### 3.4 `readiness-radar.js`
Computes and updates user profile completeness and the 4-pillar readiness checklist.

| Function | Parameters | Return Type | Single Responsibility |
|---|---|---|---|
| `renderProfileCard(session, currentRole)` | `session: Object`, `currentRole: string` | `void` | Sets user avatar lettermark, display name, verified role badge, and dynamic progress bar percentage. |
| `updateReadinessChecks(status)` | `status: { hasResume?, hasSkills?, hasTarget?, hasPrivacy? }` | `void` | Updates the status pills (`#chk-resume`, `#chk-skills`, `#chk-target`, `#chk-privacy`) with success/warning styling. |

### 3.5 `fit-evaluator.js`
Executes real-time job fit analysis between the user's active profile and the job displayed on the active tab. Renders an interactive score badge, detailed diff comparisons (skills matrix, salary, setting), and low-match (<60%) guidance actions.

| Function | Parameters | Return Type | Single Responsibility |
|---|---|---|---|
| `evaluateActiveTabFit()` | None | `Promise<void>` | Queries active tab, extracts requirements, calculates diff via `match-engine.js`, and renders results with low-match action triggers. |
| `renderDiffUi(breakdown, activeTabId)` | `breakdown: Object`, `activeTabId: number` | `void` | Updates score badge, renders `<60%` advisory with "Close Tab" & "Adjust Profile" triggers, and populates skill diff chips. |

### 3.6 `match-engine.js`
Pure, deterministic candidate-to-job matching engine executing quantitative scoring and profile requirement diff analysis.

| Function | Parameters | Return Type | Single Responsibility |
|---|---|---|---|
| `calculateMatchScore(profile, job)` | `profile: Object\|null`, `job: Object\|null` | `number` | Calculates 4-pillar quantitative match score (0.05–1.0) based on Skills (40%), Experience (25%), Salary (20%), and Role (15%). |
| `compareSkills(profile, job)` | `profile: Object\|null`, `job: Object\|null` | `SkillComparisonResult` | Cross-references profile skills against job requirements with fuzzy word tokenization. |
| `getMatchBreakdown(profile, job)` | `profile: Object\|null`, `job: Object\|null` | `DetailedBreakdown` | Generates elaborate diff matrix (matched vs missing skills, salary budget gap, workplace setting match, `<60%` low match flag). |
| `parseJobCriteriaFromText(title, text)` | `title: string`, `text: string` | `JobCriteria` | Heuristically extracts workplace type (Remote/Hybrid/On-Site), salary range, and experience requirements from page text. |

### 3.7 `popup-ui.js`
Controls DOM view switching between login gate and authenticated workspaces, role switching, and deep link navigation.

| Function | Parameters | Return Type | Single Responsibility |
|---|---|---|---|
| `renderLoggedOut()` | None | `void` | Displays `#view-logged-out`, hides authenticated panels, and marks status as "Sign In Required". |
| `renderAuthenticated(session, currentRole)` | `session: Object`, `currentRole: string` | `'seeker'\|'recruiter'\|'admin'` | Displays `#view-authenticated`, updates connection pill to "Verified", enforces role locks, and returns initial role. |
| `showAccessDenied(role)` | `'recruiter'\|'admin'` | `void` | Displays the security alert banner with role-specific upgrade/request action links. |
| `hideAccessDenied()` | None | `void` | Removes the active class from `#access-denied-box`. |
| `setRole(role)` | `'seeker'\|'recruiter'\|'admin'` | `void` | Toggles active class on `.role-tab` buttons and toggles visibility of `#view-seeker`, `#view-recruiter`, and `#view-admin`. |
| `openAppHash(hash)` | `hash: string` | `void` | Launches the Ascend ATS web app at the specified route (e.g., `#dashboard`, `#admin`, `#signup`). |

### 3.7 `admin-diagnostics.js`
Executes system diagnostics for Master Platform Architects.

| Function | Parameters | Return Type | Single Responsibility |
|---|---|---|---|
| `runAdminDiagnostics(session)` | `session: Object` | `Promise<void>` | Pings `/api/prompt-matrix`, measures roundtrip latency, and appends real-time logs to the `#admin-terminal` box. |

### 3.8 `ingest-controller.js`
Dispatches job ingestion triggers to the active browser tab.

| Function | Parameters | Return Type | Single Responsibility |
|---|---|---|---|
| `triggerTabIngest(isRequisition, session, ver, role, onOk, onErr)` | `isRequisition: boolean`, `session: Object`, `ver: string`, `role: string`, `onOk: Function`, `onErr: Function` | `Promise<void>` | Sends `TRIGGER_INGEST` message with payload to active tab, closing popup on success or displaying an alert on error. |

---

## 4. Content Script Sub-Components & Method Reference

All content script modules reside in `extension/modules/content/` and are executed in order via `manifest.json`. They mount methods onto the `window.AscendBridge` namespace.

### 4.1 `site-detector.js` (`AscendBridge.SiteDetector`)
Identifies the active web application or job board host.

| Function | Parameters | Return Type | Single Responsibility |
|---|---|---|---|
| `isAscendApp()` | None | `boolean` | Returns `true` if current hostname belongs to Ascend ATS (`ais-` or `localhost`). |
| `detectJobBoard()` | None | `'linkedin'\|'indeed'\|'govjobs'\|'unknown'` | Identifies the host job platform from `window.location.host`. |
| `getInjectionTarget()` | None | `Element\|null` | Returns the target container element on the page where the "Ascend to ATS" button should be attached. |

### 4.2 `scrapers.js` (`AscendBridge.Scrapers`)
Extracts structured job attributes from host DOM nodes.

| Function | Parameters | Return Type | Single Responsibility |
|---|---|---|---|
| `scrapeLinkedIn()` | None | `JobPayload` | Scrapes job title, company name, location, and full description from LinkedIn job view. |
| `scrapeIndeed()` | None | `JobPayload` | Scrapes job title, company rating container, and description from Indeed job view. |
| `scrapeGovJobs()` | None | `JobPayload` | Scrapes title, agency, and parses up to 30 `.term-block` summary fields (Salary, Department, Benefits). |
| `scrapeCurrentPage()` | None | `JobPayload` | Routes extraction to the matching scraper with generic article fallback. |
| `assessPageFit()` | None | `{ score: number, details: string }` | Matches page keywords against 11 core competencies and returns fit score (68% - 98%). |

### 4.3 `ingest-transport.js` (`AscendBridge.IngestTransport`)
Dispatches sanitized job payloads to the Ascend ATS backend.

| Function | Parameters | Return Type | Single Responsibility |
|---|---|---|---|
| `submitJob(data, onStart, onOk, onErr)` | `data: Object`, `onStart: Function`, `onOk: Function`, `onErr: Function` | `Promise<void>` | Posts normalized payload to `/api/ingest-job` with retry safety and status reporting. |

### 4.4 `overlay-modal.js` (`AscendBridge.OverlayModal`)
Renders the accessible floating pre-submission modal dialog.

| Function | Parameters | Return Type | Single Responsibility |
|---|---|---|---|
| `showReviewOverlay(data, ver, role, isReq)` | `data: Object`, `ver: string`, `role: string`, `isReq: boolean` | `void` | Renders the `#ascend-review-overlay` modal, wires prompt tier toggles, and handles Escape key dismissal. |

### 4.5 `session-observer.js` (`AscendBridge.SessionObserver`)
Synchronizes authentication credentials when the user is viewing Ascend ATS web app tabs.

| Function | Parameters | Return Type | Single Responsibility |
|---|---|---|---|
| `init()` | None | `void` | Runs initial sync, registers `ascend-auth-change` event listener, and sets 4-second polling heartbeat. |
| `syncSession()` | None | `void` | Reads `ascend_auth_session` from `localStorage` and mirrors into `chrome.storage.local`. |

---

## 5. Unified CSS Design Tokens Reference

The extension design system is defined in `extension/css/tokens.css` and shared across all surfaces:

```css
:root {
  /* Brand Tokens */
  --primary: #2563eb;
  --primary-hover: #1d4ed8;
  --primary-light: #eff6ff;
  --primary-border: #bfdbfe;

  /* Neutral Slate Palette */
  --slate-950: #020617;
  --slate-900: #0f172a;
  --slate-800: #1e293b;
  --slate-700: #334155;
  --slate-600: #475569;
  --slate-500: #64748b;
  --slate-400: #94a3b8;
  --slate-300: #cbd5e1;
  --slate-200: #e2e8f0;
  --slate-100: #f1f5f9;
  --slate-50: #f8fafc;
  --white: #ffffff;

  /* Semantic Feedback Tokens */
  --emerald-600: #059669; /* Success / Online */
  --rose-600: #e11d48;    /* Errors / Access Denied */
  --amber-600: #d97706;   /* Warnings / Incomplete */
  --violet-600: #7c3aed;  /* Recruiter / Sourcing */
  --sky-600: #0284c7;     /* Admin / Diagnostics */

  /* Scale Constants */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 10px;
  --radius-xl: 12px;
  --radius-2xl: 14px;
  --radius-3xl: 16px;
  --radius-full: 9999px;

  /* Elevation Shadows */
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.08);
  --shadow-primary: 0 4px 6px -1px rgba(37, 99, 235, 0.25);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}
```

---

## 6. Security, Permissions & Manifest V3 Configuration

The extension manifest (`extension/manifest.json`) enforces strict least-privilege permissions:

- **Permissions**: `activeTab`, `storage`, `contextMenus`.
- **Host Permissions**:
  - `https://*.linkedin.com/*`
  - `https://*.indeed.com/*`
  - `https://*.governmentjobs.com/*`
  - `https://ascend-ats.ai.studio/*`
  - `http://localhost:3000/*`
  - `https://ais-dev-hxvjrue22mivfrz5oy7q2w-154621295711.us-east5.run.app/*`
  - `https://ais-pre-hxvjrue22mivfrz5oy7q2w-154621295711.us-east5.run.app/*`
- **Content Security Policy**:
  - `script-src 'self'; object-src 'self'; connect-src 'self' https://ascend-ats.ai.studio https://ais-dev-*.run.app https://identitytoolkit.googleapis.com https://firestore.googleapis.com;`

---

## 7. Developer Side-Loading & Testing Instructions

1. Open Chromium browser and navigate to `chrome://extensions`.
2. Enable **Developer mode** toggle in the top-right corner.
3. Click **Load unpacked** and select the `/extension` directory in the project root.
4. Verify the **Ascend ATS Ingestion Bridge v1.2.0** card appears with the Ascend lettermark icon.
5. Open a LinkedIn, Indeed, or GovernmentJobs posting to test the injected **"Ascend to ATS"** button and review overlay.
