# Feature Roadmap Template

## Trigger Conditions

Apply this format when:
- Feature modifies >500 lines OR >10 files
- Tech debt exceeds 2 hours estimated cleanup
- Cross-cutting change (touches 3+ modules)
- Breaking change detected
- User request exceeds one prompt cycle scope

## Required Format

```markdown
# ROADMAP: [Feature Name]

**Current Issue:** [1 sentence on why direct implementation is problematic]

## Phase 1: Debt Reduction
- [ ] Task 1.1 – [Description]
- [ ] Task 1.2 – [Description]
**Validation:** [Automated check or command]

## Phase 2: Foundation
- [ ] Task 2.1 – [Description]
- [ ] Task 2.2 – [Description]
**Validation:** [Existing tests pass + types compile]

## Phase 3: Implementation
- [ ] Task 3.1 – [Description]
- [ ] Task 3.2 – [Description]
**Validation:** [Feature flag + integration test]

## Phase 4: Polish
- [ ] Task 4.1 – [Description]
- [ ] Task 4.2 – [Description]
**Validation:** [Performance + no new warnings]

**Expected Total:** ~X lines across ~Y prompts

**Documentation Impact:** [README, CHANGELOG, STRUCTURE updates needed]
```
