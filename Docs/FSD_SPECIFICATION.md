# Functional Specification Document (FSD) & System Specification Policy

This document establishes the official **Functional Specification Standard** for RapportVerse based on IEEE 830-1998 Software Requirements Specifications (SRS) and Stanford Administrative Systems FSD guidelines.

---

## 1. System Overview & Purpose
RapportVerse is a safety-critical relationship management and trust visualization platform. This specification governs functional interfaces, system actor roles, input/output validation, non-functional quality attributes, edge cases, and data migration policies.

---

## 2. System Actors & Role Authority Matrix
The platform defines four explicit system actor roles with strict privilege boundaries enforced via Firebase Authentication, Firestore Security Rules, and custom server-side middleware (`/server/routes/`):

1. **Administrator / System Architect**:
   * **Authority**: Full access to global telemetry, Firebase Remote Config template publishing, batch release dispatches (`/api/admin/broadcast/`), and webhook configuration.
   * **Authentication**: Enforced via `verifyAdminAccess` token claims in server routes.
2. **Manager / Organization Owner**:
   * **Authority**: Manages organizational group lists, affiliate partner ledgers, and team contact imports.
3. **Standard User / Individual Contributor**:
   * **Authority**: Manages private contact lists, custom group tags, calendar events, David Maister trust scores, and local export preferences.
   * **Isolation**: All personal data is strictly constrained to per-user Firestore paths (`/users/{uid}/contacts/{contactId}`).
4. **External Service / Integration Contractor**:
   * **Authority**: Stateless integrations (e.g., BlueSky AT Protocol XRPC, FeedHive Workflow API, Google People API). Zero access to user credentials or raw contact notes.

---

## 3. Functional Requirements & Input/Output Specification

### 3.1 Data Ingestion & Import Engine Specifications
- **Inputs**: Multi-format uploads (`.csv` files, `.vcf` vCard 4.0 archives, Google People API OAuth tokens, BlueSky handles).
- **Validation Rules**:
  - Maximum row limit per import batch: `MAX_IMPORT_ROWS = 2500` (JPL Rule 2).
  - Sanitization: All string inputs sanitized against XSS attacks and stripped of binary escape codes.
- **Outputs**:
  - Validated contact records committed to per-user Firestore collections.
  - Interactive Merge Matrix detailing side-by-side profile comparisons, duplicate deduplication counts, and column retention selections.

### 3.2 David Maister Trust Engine Specifications
- **Formula**: $T = \frac{C + R + I}{S}$ where $C, R, I \in [0, 100]$ and $S \in [1, 100]$.
- **Invariants**: Self-orientation $S$ hard-clamped to minimum $1.0$ to prevent division-by-zero runtime exceptions.
- **Outputs**: Computed Trust Score ($[0, 100]$ integer), Trust Tier classification (Skeptic, Cautious, Reliable, Confident), and behavioral anomaly flags (e.g., high Self-Orientation $>50\%$).

---

## 4. Non-Functional Requirements & System Quality Attributes

1. **Accessibility**:
   * 100% compliance with **WCAG 2.1 & 2.2 Level AA** standards across all forms, visualizers, modals, and drawers.
   * Minimum contrast ratio of 4.5:1 for body text and 3:1 for large text/controls.
   * Full keyboard navigation (`Tab`, `Shift+Tab`, `ArrowKeys`, `Escape`) and visible focus rings (`focus-visible:ring-2`).
2. **Performance & SLA**:
   * Client-side Remote Config evaluation: 0ms (via `localStorage` synchronous cache hydration).
   * Graph simulation performance: Sustained 60 FPS for networks up to 2,000 nodes and 10,000 links.
3. **Security & Data Privacy**:
   * TLS 1.3 encryption in transit, AES-256 encryption at rest.
   * Zero raw Google or BlueSky data shared with third-party foundational AI models.
4. **Data Isolation**:
   * Multi-tenant security rules in `firestore.rules` preventing cross-user data leaks.

---

## 5. Edge Case Handling Protocol

1. **Network Disconnection / Offline Mode**:
   * App state remains fully functional using local React state and cached Firestore entries; automatic sync retry on reconnection.
2. **Malformed Import Files**:
   * Parser catches malformed CSV rows or corrupt vCard blocks gracefully, logging line-level diagnostics without crashing the import wizard.
3. **Missing API Keys**:
   * Custom Gemini API key and external service integrations provide clear fallback UI banners with immediate setup triggers.

---

## 6. Data Migration & Conversion Strategy
- **Version Compatibility**: All schema upgrades (e.g., adding Maister 4-factor breakdown or custom lists) maintain strict backward compatibility. Missing fields default to safe domain fallbacks without requiring full database rewrites.
