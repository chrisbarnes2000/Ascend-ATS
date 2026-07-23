# Methodology Audit Template

## Trigger Conditions

Apply this format when:
- Logic follows "implicit" patterns rather than explicit schemas.
- High-frequency edge cases are reported in a specific service.
- State transitions show signs of race conditions or staleness.
- Security or integrity rules are being bypassed by new features.

## Required Format

```markdown
# AUDIT: [System Component/Logic Pillar]
**Status:** [🟡 Proposal | 🟢 Active | 🔵 Monitoring | 📁 Archived]
**Priority:** [High | Medium | Low]

## 1. Executive Summary
[2-3 sentences on the "Observed vs. Expected" behavior divergence.]

## 2. Structural Observations
- **Issue A:** [Technical description of the bottleneck or risk]
- **Issue B:** [Description of duplicate logic or hardcoding]
- **Issue C:** [Logic isolation/dependency issues]

## 3. The "Red Team" Findings
[Specific scenarios where the current logic fails or consumes excessive resources.]

## 4. Proposed Remediation (Refactor)
- [ ] **Step 1:** [Immediate structural change]
- [ ] **Step 2:** [Implementation of new validation/schema]
- [ ] **Step 3:** [Integration with the wider system]

## 5. Verification & Metrics
- **Success Criteria:** [e.g., "Zero direct mutations to store observed in grep"]
- **Performance Impact:** [e.g., "Reduction in main thread blocking by Xms"]

**Documentation Impact:** [ROADMAPS, INDEX_AUDIT, STRUCTURE updates]
```
