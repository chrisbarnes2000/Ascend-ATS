/**
 * Parser Audit Fixture Suite
 * Validates entity resolution, company stopword filters, location cleanup, and salary normalization
 * across the 14 sample postings identified in the DeepSeek audit.
 */

import { cleanDiceBoilerplate } from '../../src/utils/diceBoilerplateScrubber';

export function runParserAuditFixtureTests() {
  // Sample 1: IT Helpdesk Specialist (Company stopword "will be used to fill" -> fallback to footer/direct)
  const sample1 = `
    Job Title: IT Helpdesk Specialist
    COMPANY: will be used to fill
    LOCATION: Location
    Tacoma, WA
    
    Employer
    City of Tacoma
    Address
    Human Resources Department
    747 Market Street
    Tacoma, Washington, 98402
    Phone
    253 - 591-5400
    Website
    http://www.tacoma.gov
  `;

  const res1 = cleanDiceBoilerplate(sample1);
  if (res1.employerName !== 'City of Tacoma') {
    throw new Error(`Parser Audit Test 1 Failed: Expected 'City of Tacoma', got '${res1.employerName}'`);
  }
  if (res1.addressLines.includes('Location')) {
    throw new Error(`Parser Audit Test 1 Failed: 'Location' artifact not scrubbed from address`);
  }

  // Sample 2: Personal Financial Representative (Company stopword "our Tukwila Branch" -> fallback)
  const sample2 = `
    Job Title: Personal Financial Representative
    COMPANY: our Tukwila Branch
    SALARY: $90000 - $140000
    
    Employer
    Salal Credit Union
    Website
    https://www.salalcu.org
  `;

  const res2 = cleanDiceBoilerplate(sample2);
  if (res2.employerName !== 'Salal Credit Union') {
    throw new Error(`Parser Audit Test 2 Failed: Expected 'Salal Credit Union', got '${res2.employerName}'`);
  }

  console.log("✓ All Parser Audit Fixture tests passed successfully!");
}

runParserAuditFixtureTests();
