# Error Patterns & Fixes

## ResizeObserver loop completed with undelivered notifications

**Root cause:** ResizeObserver callback triggered DOM mutations that caused additional layout recalculation before the original observation cycle completed. The loop finished but some resize notifications were never processed because the browser throttled or deferred them.

**Standard fixes:**
- Use `setTimeout` to defer mutations until after the observation cycle
- Check for pending changes before acting (verify stable dimensions)
- Wrap logic in `requestAnimationFrame` to align with render cycle
- Consider ignoring if non-critical (this error is often harmless)

**Prevention:**
- Use `useLayoutEffect` instead of `useEffect` for ResizeObserver setup
- Batch multiple dimension reads before writes
- Specify `box: 'border-box'` option when observing
- Prefer CSS container queries over ResizeObserver when possible

**Severity:** Low. This error rarely impacts functionality. Often safe to ignore.

**Response protocol:** If encountered and non-critical → log warning, proceed. If critical (breaks layout) → apply setTimeout deferral fix.

## ResizeObserver loop limit exceeded

**Root cause:** Synchronous DOM mutations inside resize callback causing infinite loop that exceeds browser limits.

**Standard fixes:**
- Wrap observer logic in `requestAnimationFrame`
- Debounce the callback (100-200ms)
- Ensure proper cleanup with `disconnect()`

**Prevention:**
- Avoid `setState` directly in resize callbacks
- Use dedicated hooks like `useResizeObserver`
- Always disconnect in useEffect cleanup

**Severity:** High. Browser will abort the observer, breaking responsive layouts.

## Duplicate React keys

**Root cause:** Using array index as key with dynamic reordering, or non-unique ID fields.

**Standard fixes:**
- Generate keys with UUIDs or timestamp + index combination
- Create validation helper to check uniqueness before render
- Use stable identifiers from backend when available

**Prevention:**
- Never use array index for sortable/filterable lists
- Add CI check for key uniqueness in development
- Log warnings when duplicates detected

## Invalid prop on React.Fragment

**Error message:** "Invalid prop `%s` supplied to `React.Fragment`. React.Fragment can only have `key` and `children` props."

**Root cause:** Attempting to pass props that are not `key` or `children` to a React Fragment (`<>...</>` or `<React.Fragment>...</React.Fragment>`). Fragments do not render a DOM element.

**Standard fixes:**
- Replace Fragment with a real DOM element like `<div>` or `<span>` when props are needed
- Move the prop to the first child element inside the Fragment
- If `ref` is needed, use a div wrapper or forward the ref through a custom component

**Prevention:**
- Lint rule: `react/jsx-no-useless-fragment`
- TypeScript will catch this if props object is explicitly typed

**Response protocol:** Immediately suggest replacing Fragment with appropriate DOM element or restructure to pass props to children. Never keep invalid props on Fragment.

## Cannot read properties of undefined (reading 'toLowerCase')

**Root cause:** Attempting to call `.toLowerCase()` on a variable that is `undefined` or `null`.

**Standard fixes:**
- Use safe navigation with logical OR fallback: `(obj.field || "").toLowerCase().includes(...)`
- Use optional chaining with multiple guards: `obj.field?.toLowerCase()?.includes(...)`
- For AI-generated arrays (results from `ExtractionEngine`): Always use `(result.array || [])` before calling `.length` or `.map()`.

**Prevention:**
- Always assume structural inputs (imports, props) can have missing fields.
- Apply safe fallbacks (`""` or `[]`) globally for operations on data-driven fields.

**Severity:** High. This is a runtime crash.

**Response protocol:** Immediately apply the `(field || "").toLowerCase()` pattern to all occurrences in the affected module. Scan for sibling files.

## Response Protocol

When error detected:
1. **Identify** – Match error pattern from above
2. **Apply** – Use standard fix immediately without asking
3. **Report** – `[FIXED] Error: [type] → Applied: [fix name]`
4. **If unfamiliar** – Stop and ask for guidance
