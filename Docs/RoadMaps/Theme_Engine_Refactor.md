# ROADMAP: Theme Engine & Dark Mode

**Current Issue:** System lacks native dark/light mode integration. Updating hardcoded `slate-X` and `white`/`slate-900` colors across all pages and components is high-touch and error-prone if done manually without a systematic approach.

## Proposed Strategy

We have two viable approaches to implement dark mode reliably across the application:

### APPROACH A - CSS Custom Properties (Theme Tokens)
Refactor `index.css` to define standard theme tokens (`--color-bg-primary`, `--color-surface`, `--color-text`, etc.) using `@theme`. We then update Tailwind `@layer` values. This reduces class bloat and keeps React files clean. 
**Impact:** ~4 files modified (`index.css`, `App.tsx` for toggles, minor touchups). 
**Pros:** Highly scalable, very clean React files.
**Cons:** Requires manual mapping of our existing UI to the new generic variables.

### APPROACH B - Standard Tailwind `dark:` Variants
Surgically inject `dark:bg-slate-900`, `dark:text-white`, `dark:border-slate-800` into all component files. Introduce a `ThemeContext` via `useTheme` hook to detect system preference and provide manual overrides.
**Impact:** ~10-14 files modified (`App.tsx`, `JobSeekerDashboard.tsx`, `EmployerSourcing.tsx`, `ProfileEditor.tsx`, `PublicProfile.tsx`, etc.). 
**Pros:** Standard Tailwind methodology, very explicit at the component level.
**Cons:** Bloats class string length, higher touch volume.

### APPROACH C - Blended (Native Tailwind Dark Mode + `dark:` Utility Classes)
Enable `darkMode: 'class'` (or the `dark` custom-variant in v4) and apply a standardized pass across major section wrappers (navbars, main boundaries, cards), rather than micro-managing every single sub-component. 
**Impact:** ~7 files modified.

## Implementation Plan (if Approach B or C selected)
- [x] Task 1 – Create `/src/hooks/useTheme.tsx`.
- [x] Task 2 – Update `Navbar` and `App.tsx` with Theme Toggle.
- [x] Task 3 – Apply `dark:` mode utility classes iteratively to components and pages.

## Status: COMPLETED.
Implemented via Approach C.
