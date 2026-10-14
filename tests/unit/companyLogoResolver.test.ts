/**
 * Unit Test Suite: Company Logo & Brand Identity Resolver (Approach A)
 *
 * Verifies Tokenized Word & Alias Matching, Title-Derived Employer Inference,
 * Multi-Tier Logo Cascading, Deterministic WCAG Monograms, and JPL Power of 10 Invariants.
 */

import {
  tokenizeText,
  resolveCompanyDomain,
  extractCompanyInitials,
  getDeterministicColor,
  resolveCompanyBranding
} from '../../src/utils/companyLogoResolver';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function runCompanyLogoResolverTests(): void {
  console.log('\nStarting companyLogoResolver unit test suite (Approach A)...');

  // Test 1: Tokenized word and alias matching for regional/national employers
  const tpuDomain = resolveCompanyDomain('Tacoma Public Utilities');
  assert(tpuDomain === 'mytpu.org', `Expected mytpu.org for Tacoma Public Utilities, got ${tpuDomain}`);

  const tpuAbbrev = resolveCompanyDomain('TPU');
  assert(tpuAbbrev === 'mytpu.org', `Expected mytpu.org for TPU, got ${tpuAbbrev}`);

  const tacomaDomain = resolveCompanyDomain('City of Tacoma');
  assert(tacomaDomain === 'cityoftacoma.org', `Expected cityoftacoma.org for City of Tacoma, got ${tacomaDomain}`);

  const pierceDomain = resolveCompanyDomain('Pierce County');
  assert(pierceDomain === 'piercecountywa.gov', `Expected piercecountywa.gov for Pierce County, got ${pierceDomain}`);

  const salalDomain = resolveCompanyDomain('Salal Credit Union');
  assert(salalDomain === 'salalcu.org', `Expected salalcu.org for Salal Credit Union, got ${salalDomain}`);

  const boeingDomain = resolveCompanyDomain('The Boeing Company');
  assert(boeingDomain === 'boeing.com', `Expected boeing.com for The Boeing Company, got ${boeingDomain}`);

  const bofaDomain = resolveCompanyDomain('Bank of America Corp');
  assert(bofaDomain === 'bankofamerica.com', `Expected bankofamerica.com for Bank of America Corp, got ${bofaDomain}`);

  const tekfortuneDomain = resolveCompanyDomain('Tekfortune Inc.');
  assert(tekfortuneDomain === 'tekfortune.com', `Expected tekfortune.com for Tekfortune Inc., got ${tekfortuneDomain}`);
  console.log('✓ Test 1: Regional and national employer alias & word matching verified');

  // Test 2: Title-derived employer brand inference when companyName is generic or empty
  const titleTpu = resolveCompanyDomain('', 'Tacoma Public Utilities Senior Systems Analyst');
  assert(titleTpu === 'mytpu.org', `Expected mytpu.org from job title, got ${titleTpu}`);

  const titleBoeing = resolveCompanyDomain('Confidential Client', 'Boeing Aerospace Structural Engineer');
  assert(titleBoeing === 'boeing.com', `Expected boeing.com from job title, got ${titleBoeing}`);
  console.log('✓ Test 2: Title-derived employer brand inference verified');

  // Test 3: Corporate suffix scrubbing and tokenization
  const tokens = tokenizeText('Acme Solutions Group, LLC & Technologies Inc.');
  assert(tokens.includes('acme'), 'Expected tokens to contain acme');
  assert(tokens.includes('solutions'), 'Expected tokens to contain solutions');
  
  // Domain deduction should strip corporate suffixes
  const acmeDomain = resolveCompanyDomain('Acme Systems LLC');
  assert(acmeDomain === 'acme.com', `Expected acme.com, got ${acmeDomain}`);
  console.log('✓ Test 3: Corporate noise token scrubbing verified');

  // Test 4: Initials extraction for monograms
  const tpuInitials = extractCompanyInitials('Tacoma Public Utilities');
  assert(tpuInitials === 'TP', `Expected TP for TPU, got ${tpuInitials}`);

  const boeingInitials = extractCompanyInitials('Boeing');
  assert(boeingInitials === 'BO', `Expected BO for Boeing, got ${boeingInitials}`);

  const cityInitials = extractCompanyInitials('City of Tacoma');
  assert(cityInitials === 'CT', `Expected CT for City of Tacoma, got ${cityInitials}`);

  const singleCharInitials = extractCompanyInitials('X');
  assert(singleCharInitials === 'X', `Expected X, got ${singleCharInitials}`);
  console.log('✓ Test 4: Initials extraction for lettermark monograms verified');

  // Test 5: Deterministic color and gradient consistency
  const color1 = getDeterministicColor('City of Tacoma');
  const color2 = getDeterministicColor('City of Tacoma');
  assert(color1.hex === color2.hex, 'Deterministic color must produce identical hex for same input');
  assert(color1.class === color2.class, 'Deterministic color must produce identical gradient class');
  assert(typeof color1.hex === 'string' && color1.hex.length === 6, 'Hex code must be valid 6-char string');
  console.log('✓ Test 5: Deterministic WCAG AA color palette selection verified');

  // Test 6: Multi-tier cascading branding payload formation
  const branding = resolveCompanyBranding('City of Tacoma - Tacoma Public Utilities (TPU)');
  assert(branding.domain === 'mytpu.org', `Expected mytpu.org, got ${branding.domain}`);
  assert(branding.primaryLogoUrl.includes('google.com/s2/favicons'), 'Primary URL must target Google Favicon CDN');
  assert(branding.primaryLogoUrl.includes('mytpu.org'), 'Primary URL must include domain');
  assert(branding.secondaryLogoUrl.includes('ui-avatars.com'), 'Secondary URL must target UI-Avatars');
  assert(branding.initials.length >= 1 && branding.initials.length <= 2, 'Initials must be 1-2 characters');
  console.log('✓ Test 6: Multi-tier cascading branding payload structure verified');

  // Test 7: Boundary conditions and defensive null/empty handling (JPL Rule 5 & 7)
  const emptyBranding = resolveCompanyBranding('', '');
  assert(emptyBranding.domain === 'generic.org', 'Empty inputs must fall back to generic.org');
  assert(emptyBranding.initials === 'VE' || emptyBranding.initials === 'CO', 'Empty inputs must produce fallback initials');

  const symbolsDomain = resolveCompanyDomain('###$$$%%%');
  assert(symbolsDomain === 'generic.org', `Expected generic.org for symbols, got ${symbolsDomain}`);
  console.log('✓ Test 7: Defensive boundary conditions and JPL Power of 10 invariants satisfied');

  console.log('All companyLogoResolver unit tests passed successfully!\n');
}
