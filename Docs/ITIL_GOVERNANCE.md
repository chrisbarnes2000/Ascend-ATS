# ITIL / ITSM Service Management & Safety-Critical Governance Policy

## 1. Executive Summary & Purpose
This document establishes the official **ITIL v4 / ITSM Service Management Framework** for RapportVerse. Operating as a safety-critical modern web application, all engineering, architecture, configuration, and feature deployments must follow structured ITIL service lifecycle practices integrated with NASA JPL "Power of 10" software rules and WCAG 2.1/2.2 AA accessibility standards.

---

## 2. Core ITIL Service Management Practices

### 2.1 Service Transition & Change Enablement (ITIL Practice 4.2.1)
All code modifications, refactorings, and infrastructure updates are treated as managed Service Changes.

- **Change Classifications**:
  1. **Standard Changes**: Low-risk, routine code refactors, sub-module extractions, or bug fixes following approved architectural patterns. Pre-approved provided they pass all pre-flight automated tests.
  2. **Normal Changes**: Major feature releases, data schema alterations, new API integrations (e.g., BlueSky XRPC, Google People API), or new page components. Requires a 2-3 option architectural proposal and explicit user approval before implementation.
  3. **Emergency Changes**: Rapid hotfixes for broken dev server builds, critical linter/typechecker crashes, or security vulnerabilities. Implemented immediately with post-hoc Root Cause Analysis (RCA).

- **Pre-Flight Change Validation Gate**:
  Before any change is marked as complete or merged into active status:
  - `npm run lint` (`tsc --noEmit`) must complete with **zero warnings and zero errors**.
  - `npm test` must execute with **100% green passing tests**.
  - `compile_applet` / `npm run build` must succeed without warnings.

---

### 2.2 Incident & Problem Management (ITIL Practice 4.2.2 & 4.2.3)
When defects, build failures, or regressions occur, the Agent executes structured Problem Management rather than applying unverified trial-and-error patches.

- **Root-Cause Analysis (RCA) Protocol**:
  1. **Identify**: Isolate the exact failing file, line number, or broken constraint (e.g., missing type definition, stale target content match, unhandled promise).
  2. **Diagnose**: Determine why the failure occurred (e.g., missing null-check, stale dependency, unhandled async condition).
  3. **Remediate**: Apply a targeted, minimal fix that addresses the root cause while preserving backward compatibility.
  4. **Document**: Record the incident cause and resolution in `/Docs/CHANGELOG_DEV.md`.

---

### 2.3 Service Configuration & Asset Management (ITIL Practice 4.2.4)
Configuration Items (CIs) represent the key architectural assets of RapportVerse. All CIs must be maintained in a known, audited state.

- **Tracked Configuration Items**:
  - **Manifest & Dependencies**: `package.json` (versioning, package declarations, build scripts).
  - **Environment Variables**: `.env.example` (mandatory declaration of non-secret keys).
  - **Global Type Definitions**: `/src/types.ts` (shared domain interfaces, enums, literal unions).
  - **System Configuration**: `src/config.ts` (`STATIC_CONFIG` constants and bounds).
  - **App Metadata**: `metadata.json` (application name, description, capabilities, frame permissions).
  - **Directory Structure Asset**: `/Docs/STRUCTURE.md` (updated whenever files are created, moved, or deleted).

---

### 2.4 Release & Deployment Management (ITIL Practice 4.2.5)
Releases follow a dual-cadence governance model to ensure full transparency between internal engineering details and public customer milestones.

- **Dual-Cadence Release Tracking**:
  - **Developer Changelog (`/Docs/CHANGELOG_DEV.md`) [High-Frequency]**: Updated on **every single work turn**. Records granular code actions, modified files, lines, refactor details, and test outputs.
  - **Public Changelog (`/Docs/CHANGELOG.md`) [Milestone-Frequency]**: Updated **only** for official customer-facing milestone releases or major feature deployments in plain, non-technical language.
- **Version Promotion Protocol**:
  - When `CHANGELOG_DEV.md` accumulates multiple unreleased engineering iterations ahead of `CHANGELOG.md`, the Agent proactively proposes a public version promotion and `package.json` version bump.
- **Social & LinkedIn Broadcast Recommendations**:
  - Following public milestone cuts, the Agent provides tailored social media copy (LinkedIn, X/Twitter, Discord) aligned with `/Docs/INDEX_MARKETING.md` positioning.

---

### 2.5 Continual Service Improvement (CSI) & Roadmap Lifecycle (ITIL Practice 4.2.6)
Continual Service Improvement ensures that technical debt is systematically retired and system scorecards are continuously updated.

- **Roadmap Archival Lifecycle**:
  - `/Docs/INDEX_ROADMAP.md` is strictly split into an **Active Horizon** (pending work) and a **Completed Milestone Archive** (historical completed phases).
  - As soon as a roadmap phase or milestone is verified complete, its detailed breakdown is archived into the **Completed Milestone Archive** section, maintaining a clean, clutter-free active horizon.
- **Mandatory Post-Refactor Protocol**:
  - Immediately following any refactor or milestone phase, the Agent expands automated unit tests in `/tests/unit/*.test.ts` and updates corresponding audit scorecards in `/Docs/INDEX_AUDIT.md` and `/Docs/NASAAudits/`.

---

## 3. Compliance & Governance Summary
Every agent turn must comply with this ITIL/ITSM policy, NASA JPL Power of 10 rules, and WCAG 2.1/2.2 AA accessibility baselines.
