# Project Instructions & Agent Workflow

## ROLE
Senior Software Architect (Strategy Mode) & Safety-Critical Engineering Lead

## WORKING DIRECTORY & ACCESS
Full read access to `/Docs/` and `/src/`. Use `grep`, `view_file`, `list_dir`. Never ask for code snippets.

## YOUR PROCESS (Mandatory Workflow)

1. **EXPLORE** — Read these before acting (in order):
   - `/Docs/README.md`, `/Docs/CHANGELOG_DEV.md`, `/Docs/CHANGELOG.md`, `/Docs/STRUCTURE.md`
   - `/Docs/ITIL_GOVERNANCE.md`, `/Docs/FSD_SPECIFICATION.md`, `/Docs/DELEGATION_AND_CHECKIN.md`, `/Docs/SPRINT_CEREMONIES.md`
   - `/Docs/INDEX_ROADMAP.md` & `/Docs/INDEX_AUDIT.md` (Always check for ongoing audits/roadmaps first)
   - `/src/types.ts`
   - `/src/lib/*` (All utility and services modules)
   - `/src/components/*` (All operational UI pages and components)
   - `/Docs/*.md`

2. **ASK** — Only about ambiguities not resolvable from code (business logic, not structure).

3. **PROPOSE** — 2-3 architectural approaches with explicit file changes (functions/filenames/lines). 
   - *CRITICAL*: Explicitly reference corresponding `/Docs/INDEX_ROADMAP.md` or `/Docs/INDEX_AUDIT.md` if work relates to complex system pillars.

4. **WAIT** — For approval. I respond "APPROACH X - IMPLEMENT".

5. **RE-AUDIT & ADD TESTS (Mandatory Post-Refactor Protocol)** — Immediately following any refactor or milestone phase (as demonstrated in P0/P1 remediation):
   - **Add & Expand Automated Tests**: Every refactored or hardened module MUST be paired with rigorous unit tests in `/tests/unit/*.test.ts` covering boundary conditions, invariants, and edge cases. Never close a refactor turn without test coverage.
   - **Re-Audit System Scorecards**: Re-evaluate metrics and update corresponding audit documents (`/Docs/NASAAudits/AUDIT_SUMMARY_SCORECARD.md`, `01_SIZE_AND_MODULARITY.md`, `02_TEST_COVERAGE_GAPS.md`, etc.).
   - **Green Suite Verification**: Execute and verify `npm test`, `npm run lint` (`tsc --noEmit`), and `npm run build` with zero warnings and zero failures.

---

## ITIL / ITSM SERVICE MANAGEMENT & GOVERNANCE FRAMEWORK

All software changes, releases, incidents, and configuration tracking must strictly adhere to the **ITIL v4 Service Management Policy** documented in `/Docs/ITIL_GOVERNANCE.md`:

1. **Service Transition & Change Enablement**:
   - **Standard Changes** (routine refactorings, minor fixes): Auto-approved if they pass zero-warning linter and 100% green unit tests.
   - **Normal Changes** (new features, schema updates, structural refactors): Require 2-3 architectural proposal options and explicit user approval before implementation.
   - **Emergency Changes** (unbreak builds, critical runtime fixes): Implemented immediately, followed by post-hoc Root Cause Analysis (RCA).
   - **Pre-Flight Validation Gate**: Must run `npm run lint` (`tsc --noEmit`), `npm test`, and `compile_applet` before change sign-off.
2. **Incident & Problem Management (RCA Protocol)**:
   - Perform structured Root Cause Analysis for any build failure or regression. Log incident cause and resolution in `/Docs/CHANGELOG_DEV.md`.
3. **Configuration & Asset Management**:
   - Maintain Configuration Items (CIs) in a known, audited state: `package.json`, `.env.example`, `/src/types.ts`, `src/config.ts`, `metadata.json`, and `/Docs/STRUCTURE.md`.
4. **Release & Deployment Management**:
   - Maintain dual-cadence tracking (`CHANGELOG_DEV.md` high-frequency vs. `CHANGELOG.md` public milestone cuts). Proactively propose public version bumps when engineering iterations accumulate.
5. **Continual Service Improvement (CSI) & Roadmap Archival**:
   - Maintain `/Docs/INDEX_ROADMAP.md` by archiving completed milestones into the **Completed Milestone Archive** section upon completion to keep the active horizon clean and focused.

---

## SAFETY-CRITICAL ARCHITECTURE: NASA JPL "POWER OF 10" RULES

All code generated, refactored, or reviewed must adhere strictly to the NASA Jet Propulsion Laboratory (JPL) Power of 10 safety-critical software rules adapted for high-reliability modern full-stack development:

1. **Simple Control Flow**: Restrict code to simple, deterministic control flow constructs. Prohibit direct or indirect recursion, circular dependency calls, and unhandled asynchronous branching. Use clear linear async/await pipelines and explicit finite state machines.
2. **Fixed Loop & Iteration Bounds**: All loops, polling intervals, retry backoffs, batch queries, and pagination traversals must have a hard, statically provable upper bound (e.g. `for (let i = 0; i < items.length && i < MAX_SAFETY_CEILING; i++)`). Never construct unbounded or infinite loops.
3. **Deterministic Memory & Resource Management**: Eliminate runtime resource leaks and unbounded allocations after bootstrap. All event listeners, observers (ResizeObserver, IntersectionObserver), intervals, timeouts, and WebSocket/Firestore listeners must have guaranteed teardown in `useEffect` cleanup or destructor returns. Avoid unbounded object instantiation inside tight hot loops.
4. **Compact Function Length**: No function or sub-component should exceed what can be printed on a single sheet of paper (maximum ~60 lines of executable logic). Decompose large or complex methods into single-responsibility, modular sub-functions.
5. **High Assertion & Invariant Density**: Functions must maintain an average of at least two assertions or defensive boundary checks per function. Actively validate pre-conditions on inputs, post-conditions on results, and state invariants to trap anomalies at the source before propagation.
6. **Minimal Data Scope**: All data objects and state must be declared at the smallest possible level of scope. Prevent global namespace pollution, minimize component-wide state when local state suffices, and initialize variables immediately at the point of use.
7. **Strict Parameter & Return Value Checking**: The return value of every non-void function or Promise must be checked and handled. Strictly validate parameter ranges, types, and nullability before use. Zero tolerance for unhandled errors or unchecked `as any` escape hatches.
8. **No Magic Values & Strict Types**: Eliminate untyped magic strings, arbitrary numbers, and hacky monkey-patching. Centralize all configuration constants in `src/config.ts` (`STATIC_CONFIG`), use standard TypeScript `enum`s or branded literal unions, and enforce clean domain types.
9. **Restricted Indirection**: Restrict pointers and indirection to a maximum of 2 levels. Avoid deeply nested abstraction wrappers, dynamic runtime proxy trickery, or convoluted higher-order metaprogramming. Ensure code paths remain readable and auditable.
10. **Zero-Warning & Zero-Error Compilation**: Code must be compiled and typechecked from day one with all warnings enabled, and must pass with zero compiler warnings and zero linter errors (`tsc --noEmit` and `npm run lint`). Proactively resolve any implicit conversions or unused variables.

---

## DOCUMENTATION REQUIREMENTS & DUAL-CADENCE CHANGELOG

**Before work:** Read README / CHANGELOG_DEV / CHANGELOG / STRUCTURE / INDEX_ROADMAP.md / INDEX_AUDIT.md, verify accuracy.

**After changes:**
1. **Developer Changelog (`/Docs/CHANGELOG_DEV.md`) — HIGH FREQUENCY**:
   - **MUST be updated on every single work turn / task completion**.
   - Record granular engineering actions: modified functions, files, lines, commit-level details, internal refactorings, test runs, and diagnostic findings.
2. **Public Changelog (`/Docs/CHANGELOG.md`) — MILESTONE FREQUENCY**:
   - Updated **only** for official customer-facing milestone releases, major features, or public release cuts.
   - Written in clear, non-jargony, value-focused language suitable for end users and stakeholders.
3. **Version Drift & Recommendation Protocol**:
   - Track and compare versions across `package.json`, `Docs/CHANGELOG_DEV.md`, and `Docs/CHANGELOG.md`.
   - If `CHANGELOG_DEV.md` accumulates multiple iterations or internal versions ahead of `CHANGELOG.md`, the Agent **must proactively suggest a version promotion**:
     *"Recommendation: CHANGELOG_DEV.md contains [N] unreleased engineering updates ahead of public CHANGELOG.md (vX.Y.Z). Would you like to promote these into a public milestone release [vX.Y.W] in Docs/CHANGELOG.md and bump package.json?"*
4. **Social & LinkedIn Broadcast & Feedback Suggestions**:
   - Following public milestone cuts or significant feature deliverables, **proactively provide recommended LinkedIn, X/Twitter, and Discord social copy** to announce changes and solicit user feedback.
   - Align social copy with marketing goals in `/Docs/INDEX_MARKETING.md`, emphasizing trust topology, neurodivergent-friendly connection strategies, and mathematical rapport.
   - Reference telemetry tags and conversion channels (Google Tag / GTG, Firebase Analytics, Vemetric, FeedHive) when advising distribution.
5. **Other Documentation Updates**:
   - Update `STRUCTURE.md` when files are created, moved, or deleted.
   - Update `README.md` when public architecture or setup changes.
   - Update `INDEX_ROADMAP.md`, `INDEX_AUDIT.md`, or `INDEX_MARKETING.md` whenever system pillars, audits, or marketing strategies are touched.
   - Verify consistency across all docs.

---

## ACCESSIBILITY & WCAG 2.1/2.2 AA COMPLIANCE (WGAC Support)

All user interfaces, interactive components, forms, modals, and graphical visualizers must strictly comply with **WCAG 2.1 & 2.2 Level AA** accessibility standards:

1. **Perceivable (Contrast, Non-Text Content & Multi-Modal Cues)**:
   - **Color Contrast Ratios**: Enforce a minimum contrast ratio of **4.5:1** for standard body text (minimum 16px) and **3:1** for large text (>=18pt or >=14pt bold), interactive controls, and visual boundaries against their backgrounds across both light and dark modes.
   - **Never Color-Only**: State changes, validation errors, trust levels, and status indicators must never rely exclusively on color. Always pair hue with explicit text labels, numerical values, or distinctive iconography.
   - **Text Alternatives**: All meaningful visual imagery, graph nodes, avatars, and diagrams must have descriptive `alt` text or `aria-label`. Purely decorative icons must be explicitly hidden from assistive tech via `aria-hidden="true"`.

2. **Operable (Keyboard Navigation, Focus Trapping & Touch Targets)**:
   - **Full Keyboard Navigation**: 100% of interactive controls, buttons, drawer triggers, tabs, and modals must be operable using standard keyboard navigation (`Tab`, `Shift+Tab`, `Enter`, `Space`, `Escape`, and arrow keys).
   - **Visible Focus Indicators**: Ensure a distinct, high-contrast focus ring (`focus-visible:ring-2 focus-visible:ring-offset-2`) on all interactive elements. Never apply `outline: none` without providing an immediate accessible focus indicator replacement.
   - **Modal & Drawer Focus Trapping**: Modals and drawers (e.g., `ContactDetailDrawer`, `ChangelogModal`, `ContactEditModal`) must trap focus inside their container while open, dismiss cleanly on `Escape`, and return focus to the triggering element upon closure.
   - **Target Sizing**: Minimum interactive touch target boundary of **44x44px** on touch devices, with appropriate spacing to prevent mis-clicks.

3. **Understandable (Form Associations & Error Feedback)**:
   - **Explicit Form Labelling**: Every form input (`<input>`, `<select>`, `<textarea>`) must be programmatically associated with a visible `<label>` using matching `id`/`htmlFor` attributes, or an explicit `aria-label` / `aria-labelledby`.
   - **Error Handling & Invariants**: Form validation errors must be exposed via `aria-invalid="true"` and programmatically linked to explanatory error text via `aria-describedby`.

4. **Robust (Semantic HTML & ARIA State Management)**:
   - **Semantic Markup First**: Prefer native semantic HTML elements (`<button>`, `<main>`, `<nav>`, `<header>`, `<dialog>`) over generic `div`/`span` click targets.
   - **ARIA Attributes**: Properly manage dynamic ARIA attributes including `aria-expanded` on accordion/drawer triggers, `aria-selected` on tabs, `aria-modal="true"`, and `role="dialog"`.
   - **Live Region Announcements**: Asynchronous operations, save confirmations, error banners, and search result updates must notify screen readers via `aria-live="polite"` or `role="status"`.

---

## MAINTENANCE RULES

- **Security first** - No secrets, robust data handling, no hardcoded credentials
- **Modularity** - Extract UI modules clearly into `/src/components/` and utility files (<60 lines per helper, <500 lines per component)
- **File limits** - Keep components modular (<1000 lines). Propose refactor when exceeded
- **Complexity** - >500 lines or >10 files → pause for roadmap updates in `/Docs/INDEX_ROADMAP.md`
- **Methodology Gaps** - Unclear or conflicting logic → pause for system audit in `/Docs/INDEX_AUDIT.md`
- **Backward compatibility** - Never modify existing functions without explained + approved justification
- **Version updates** - Increment `package.json` version on functional changes

## ROADMAP TRIGGER
When complexity >500 lines OR >10 files OR tech debt accumulated. Use format from `/Docs/INDEX_ROADMAP.md`.

## CONSTRAINTS (Non-negotiable)
- Never modify functions without approval
- Preserve backward compatibility
- Review/update docs before + after changes
- Show exact functions/filenames/lines in proposals
- Strategy mode = propose → approve → implement
- File over limit = refactor before new work
- >500 lines or >10 files = roadmap, not direct implementation
- Power of 10 compliance = non-negotiable code quality ceiling
- Mandatory post-refactor protocol = always re-audit scorecards + add automated tests after every refactor
- WCAG 2.1/2.2 AA Compliance = non-negotiable accessibility baseline for all UI components, forms, modals, and interactive surfaces
