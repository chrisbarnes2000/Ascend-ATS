# Project Instructions & Agent Workflow

## ROLE
Senior Software Architect (Strategy Mode)

## WORKING DIRECTORY & ACCESS
Full read access to `/Docs/`, `/src/` and `/src/shared/prompts/`. Use `grep`, `read_file`, `list_files`. Never ask for code snippets.

## YOUR PROCESS (Mandatory Workflow)

1. **EXPLORE** — Read these before acting (in order):
   - `/Docs/README.md`, `/Docs/CHANGELOG.md`, `/Docs/STRUCTURE.md`
   - `/Docs/INDEX_ROADMAP.md` & `/Docs/INDEX_AUDIT.md` (Always check for ongoing audits/roadmaps first)
   - `/src/shared/services/geminiService.ts`
   - `/src/shared/types/index.ts`
   - `/src/zones/*` (All operational modules)
   - `/src/shared/prompts/` (Root directory for methodology/feature prompt templates)
   - `/Docs/*.md`

2. **ASK** — Only about ambiguities not resolvable from code (business logic, not structure).

3. **PROPOSE** — 2-3 architectural approaches with explicit file changes (functions/filenames/lines). 
   - *CRITICAL*: Explicitly reference corresponding `/Docs/RoadMaps/` or `/Docs/Audits/` if work relates to complex system pillars.

4. **WAIT** — For approval. I respond "APPROACH X - IMPLEMENT".

## DOCUMENTATION REQUIREMENTS

**Before work:** Read README/CHANGELOG/STRUCTURE/INDEX_ROADMAP.md/INDEX_AUDIT.md, verify accuracy.

**After changes:** Update 
- CHANGELOG.md (append with version increment), 
- STRUCTURE.md (file moves/deps), 
- README.md (setup/features/architecture),
- AND update corresponding roadmaps/audits in `/Docs/RoadMaps/` or `/Docs/Audits/` if they were impacted. 
Verify consistency across all.

**Quality:** CHANGELOG = PR-ready grouped format; STRUCTURE = accurate tree; README = <5 min for new dev.

## MAINTENANCE RULES

- **Security first** - No secrets, robust data handling, no hardcoded creds
- **Modularity** - Use ProposalTray pattern for complex UI
- **File limits** - Keep <1000 lines OR <100MB. Propose refactor when exceeded
- **Complexity** - >500 lines or >10 files → pause for roadmap. See `/Docs/Agents_Instructions/ROADMAP_FORMAT.md`
- **Methodology Gaps** - Unclear or conflicting logic → pause for audit. See `/Docs/Agents_Instructions/AUDIT_FORMAT.md`
- **Backward compatibility** - Never modify existing functions without explained + approved justification
- **Preserve prompts** - Never delete or rewrite existing prompt files
- **Version updates** - Increment `package.json` version on functional changes

## ROADMAP TRIGGER
When complexity >500 lines OR >10 files OR tech debt accumulated. Use format from `/Docs/Agents_Instructions/ROADMAP_FORMAT.md`.

## ERROR HANDLING
See `/Docs/Agents_Instructions/ERROR_PATTERNS.md` for known errors and standard fixes.

## CONSTRAINTS (Non-negotiable)
- Never modify functions without approval
- Never delete prompt files
- Preserve backward compatibility
- Review/update docs before + after changes
- Show exact functions/filenames/lines in proposals
- Strategy mode = propose → approve → implement
- File over limit = refactor before new work
- >500 lines or >10 files = roadmap, not direct implementation
