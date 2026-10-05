import { parseJsonProfile, normalizeSalary, sanitizePhone, sanitizeString } from '../../src/utils/jsonProfileParser';
import fs from 'fs';
import path from 'path';

export function runJsonProfileParserTests() {
  console.log("Starting jsonProfileParser unit test suite...");

  // Test 1: Simplified Resume Template
  const simplifiedPath = path.resolve(process.cwd(), 'public/templates/resume-simplified-template.json');
  const simplifiedRaw = JSON.parse(fs.readFileSync(simplifiedPath, 'utf8'));
  const simplifiedParsed = parseJsonProfile(simplifiedRaw);

  if (simplifiedParsed.personalInfo?.firstName !== 'Alex') {
    throw new Error(`Test 1 Failed: Expected Alex, got ${simplifiedParsed.personalInfo?.firstName}`);
  }
  if (simplifiedParsed.personalInfo?.lastName !== 'Morgan') {
    throw new Error(`Test 1 Failed: Expected Morgan, got ${simplifiedParsed.personalInfo?.lastName}`);
  }
  if (!simplifiedParsed.skills?.some(s => s.name === 'TypeScript')) {
    throw new Error("Test 1 Failed: Expected TypeScript skill");
  }
  if (simplifiedParsed.workExperience?.length !== 2) {
    throw new Error(`Test 1 Failed: Expected 2 work experiences, got ${simplifiedParsed.workExperience?.length}`);
  }
  if (simplifiedParsed.deiAndAccommodations?.needsAccommodations !== true) {
    throw new Error("Test 1 Failed: Expected needsAccommodations to be true");
  }
  console.log("✓ Test 1: Simplified Resume Template successfully parsed");

  // Test 2: Advanced Persona Template
  const advancedPath = path.resolve(process.cwd(), 'public/templates/resume-advanced-persona-template.json');
  const advancedRaw = JSON.parse(fs.readFileSync(advancedPath, 'utf8'));
  const advancedParsed = parseJsonProfile(advancedRaw);

  if (advancedParsed.personalInfo?.firstName !== 'Christopher') {
    throw new Error(`Test 2 Failed: Expected Christopher, got ${advancedParsed.personalInfo?.firstName}`);
  }
  if (advancedParsed.personalInfo?.lastName !== 'Barnes') {
    throw new Error(`Test 2 Failed: Expected Barnes, got ${advancedParsed.personalInfo?.lastName}`);
  }
  if (!advancedParsed.skills?.some(s => s.name.includes('NASA JPL'))) {
    throw new Error("Test 2 Failed: Expected NASA JPL skill");
  }
  if (advancedParsed.workExperience?.length !== 2) {
    throw new Error(`Test 2 Failed: Expected 2 work experiences, got ${advancedParsed.workExperience?.length}`);
  }
  if (advancedParsed.deiAndAccommodations?.needsAccommodations !== true) {
    throw new Error("Test 2 Failed: Expected needsAccommodations to be true for neurodivergent accommodation");
  }
  console.log("✓ Test 2: Advanced Persona Template successfully parsed");

  // Test 3: Recruiter Profile Template
  const recruiterPath = path.resolve(process.cwd(), 'public/templates/recruiter-profile-template.json');
  const recruiterRaw = JSON.parse(fs.readFileSync(recruiterPath, 'utf8'));
  const recruiterParsed = parseJsonProfile(recruiterRaw);

  if (recruiterParsed.personalInfo?.firstName !== 'Taylor') {
    throw new Error(`Test 3 Failed: Expected Taylor, got ${recruiterParsed.personalInfo?.firstName}`);
  }
  if (recruiterParsed.targetRole !== 'Lead Technical Recruiter & Talent Acquisition Partner') {
    throw new Error(`Test 3 Failed: Expected title, got ${recruiterParsed.targetRole}`);
  }
  if (!recruiterParsed.skills?.some(s => s.name.includes('Distributed Systems Engineering'))) {
    throw new Error("Test 3 Failed: Expected specialty skill");
  }
  console.log("✓ Test 3: Recruiter Profile Template successfully parsed");

  // Test 4: Salary Normalization
  const sRange = normalizeSalary("$120K - $160K");
  if (sRange.min !== 120000 || sRange.max !== 160000) {
    throw new Error(`Test 4 Failed: Expected 120000-160000 range, got ${sRange.min}-${sRange.max}`);
  }
  const sSingle = normalizeSalary("$145,000");
  if (sSingle.min !== 145000 || sSingle.max !== 145000) {
    throw new Error(`Test 4 Failed: Expected 145000, got ${sSingle.min}`);
  }
  const sKPlus = normalizeSalary("150K+");
  if (sKPlus.min !== 150000) {
    throw new Error(`Test 4 Failed: Expected 150000, got ${sKPlus.min}`);
  }
  console.log("✓ Test 4: Salary normalization handles ranges, 'K' suffixes, and currency bounds");

  // Test 5: Sanitization rules
  const sanitizedPhone = sanitizePhone("  (555) 123-4567 ext. 9 ");
  if (sanitizedPhone !== "55512345679") {
    throw new Error(`Test 5 Failed: Expected digits only, got ${sanitizedPhone}`);
  }
  const sanitizedText = sanitizeString("Hello\u0000 World\u001F!  ");
  if (sanitizedText !== "Hello World!") {
    throw new Error(`Test 5 Failed: Control characters not stripped, got ${sanitizedText}`);
  }
  console.log("✓ Test 5: Sanitization rules scrub control characters and format numbers");

  console.log("\nAll profile parser and normalization tests passed with 100% assertions satisfied!");
}

if (process.argv[1]?.endsWith('jsonProfileParser.test.ts')) {
  runJsonProfileParserTests();
}
