# Agile Sprint Ceremonies & Retrospective Engine

This document establishes the official **Agile Sprint & Retrospective Standard** for RapportVerse based on standard Sprint Planning, Retrospective Agendas, and Kaizen continuous improvement practices.

---

## 1. Core Task Lifecycle Definitions

To ensure strict quality control and eliminate ambiguity across sprint iterations, every task must satisfy explicit lifecycle gates:

- **Ready**:
  - Task acceptance criteria are clearly defined.
  - All prerequisite dependencies are merged or available.
  - The architectural approach has been proposed and approved.
- **Done**:
  - Code is fully implemented adhering to NASA JPL Power of 10 safety rules and WCAG 2.1/2.2 AA accessibility standards.
  - Automated unit tests covering boundary conditions and edge cases pass 100% green in `/tests/unit/*.test.ts`.
  - Typechecks (`tsc --noEmit`) and linter checks pass with **zero errors and zero warnings**.
- **Shipped**:
  - Code is merged into the main line, verified in the build container via `compile_applet`, and published into a public release milestone (`/Docs/CHANGELOG.md`).

---

## 2. Sprint Planning & Poker Point Estimation

### 2.1 Velocity & Story Point Baseline
- **3-Point Reference Story**: Represents ~3 hours of focused engineering work with no unknown research dependencies (e.g., *"Decompose a 300-line sub-component into 3 single-responsibility sub-views"*).
- **Point Scale**: $0, \frac{1}{2}, 1, 2, 3, 5, 8, 13, 20$. Tasks estimated at 8 points or higher **must be decomposed** into smaller sub-tasks to prevent sprint blocking.

### 2.2 Backlog Grooming & Prioritization
- Backlogs are prioritized based on active roadmap phases (`/Docs/INDEX_ROADMAP.md`), system audit findings (`/Docs/INDEX_AUDIT.md`), and community AidBase feature upvotes (`ChangelogModal.tsx`).

---

## 3. Retrospective Review & Kaizen Continuous Improvement

At the conclusion of each engineering iteration or milestone release, the team conducts a structured retrospective covering:

1. **Velocity Assessment**: Compare committed story points against completed story points.
2. **Key Questions**:
   - *What went well?* (Celebrate clean refactors, zero-bug releases, test coverage expansion).
   - *What didn't go well / challenges?* (Identify monolithic file growth, stale targets, or async race conditions).
   - *Kaizen / Planned Improvements*: Concrete operational habits or linter rules introduced to eliminate identified friction points.
3. **Changelog Logging**:
   - Record all retrospective outcomes, Kaizen improvements, and velocity notes in `/Docs/CHANGELOG_DEV.md`.
