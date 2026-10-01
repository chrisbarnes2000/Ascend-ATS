# 5-Point Delegation & Check-In Governance Framework

This document establishes the official **Delegation & Task Accountability Framework** for RapportVerse based on the 5-Point Delegation Checklist and Badgering/Check-In protocol.

---

## 1. The 5-Point Delegation Framework
When delegating engineering tasks, architectural refactors, or documentation milestones across teams or sub-agents, every assignment must define these five explicit criteria:

1. **Desired Results**:
   * Clear, mutual understanding of *what* needs to be accomplished (focusing on visual/functional outcomes and measurable deliverables, not micromanaging methods).
2. **Guidelines**:
   * Operating parameters, boundary conditions, safety constraints (e.g., NASA JPL Power of 10 rules, WCAG 2.1 AA compliance, file line limits), and known "failure paths" to avoid.
3. **Resources**:
   * Identification of required tools, existing service modules (`/src/lib/*`), UI components (`/src/components/*`), external APIs, and documentation (`/Docs/*`).
4. **Accountability**:
   * Clear performance standards, automated test suite expectations, zero-warning linter criteria (`tsc --noEmit`), and specific delivery dates.
5. **Consequences**:
   * Explicit impact of meeting or missing the target (e.g., downstream task blockers, release milestone delays, technical debt accumulation).

---

## 2. Check-In & "Badgering" Protocol (3–5 Day Cadence)
To prevent silent task stalling or technical blockers without micromanagement, check-ins follow a structured cadence during active development sprints:

### 2.1 Standard Check-In Script
When touching base on active work items:
> *"Hey, it's been [3–5] days since assignment. Reaching out to see if you have any questions, comments, or concerns? Deadline is [Date]."*
> - **"What are your blockers?"**
> - **"How can I help?"**
> - **"Explaining dependencies: Here's who/what is waiting."**
> - **"Explaining consequences: Here's the impact on the active release milestone."**

---

### 2.2 Scenario-Specific Triage Protocols

#### **Scenario A: Environment or Tooling Blockers**
- **Action**: Immediate intervention. If an agent or engineer is blocked on environment configuration, TypeScript compilation, or dependencies, halt feature work to conduct a dedicated setup/troubleshooting session.

#### **Scenario B: Task Inaction / Stalled Progress**
- **Action**: Re-assess task scope. Ask: *"What are your blockers and how can we simplify the scope?"*. If necessary, break monolithic tasks into smaller, granular sub-tasks (<60 lines per helper, <500 lines per component).

#### **Scenario C: ITIL Incident Linkage**
- **Action**: If a blocker stems from a build failure, linter error, or regression, trigger the ITIL Incident Management Root Cause Analysis (RCA) protocol and log findings in `/Docs/CHANGELOG_DEV.md`.

---

## 3. Integration with Agent Workflow
All agents and team leads must apply these 5 delegation points when proposing architectural work options and when executing task breakdowns.
