# Legal, Security & Compliance Integration

This document outlines the architectural strategy for the Terms of Service (TOS), Privacy Policy Center, and Dynamic Document Title synchronization.

## Objective
Establish a trustworthy, secure, and compliant legal core within Ascend ATS to assure job seekers and employers that their sensitive data, professional histories, and organization templates are fully protected.

## Architecture

### 1. Unified Legal Page Component (`LegalPage.tsx`)
- **Integrated Design**: Houses both Terms of Service and Privacy Policy within a clean, tabbed dashboard.
- **Visual Rhythm**: Light and dark mode support using Tailwind's standard neutral colors, spacious negative space, and responsive display grids.
- **No-Sell Declaration**: Explicitly documents the platform's commitment never to sell, rent, or distribute resume details or personal contacts.

### 2. Public Router Availability
- **Authentication Bypass**: Accessible via public hash paths (`#legal`, `#terms`, `#privacy`) before prompting candidate/employer Google Authentication gates.
- **Hash Synchronization**: Dynamic listeners sync active tab states with browser hash modifications.

### 3. Dynamic Page Title Updates
- **Dynamic Hooks**: React `useEffect` in `App.tsx` actively monitors hash routing, authentication states, and onboarding milestones to dynamically alter `document.title` on the tab bar (e.g., `Terms of Service | Ascend ATS`).
- **Cohesive Product Brand**: Enhances bookmarking compatibility and user navigation feedback.
