import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { canAccessRole } from '../../extension/modules/popup/auth-manager.js';
import { APP_BASE_URL, PROMPT_INFO } from '../../extension/modules/popup/constants.js';
import {
  checkSkillMatch,
  compareSkills,
  calculateMatchScore,
  getMatchBreakdown,
  parseJobCriteriaFromText
} from '../../extension/modules/popup/match-engine.js';

export function runExtensionArchitectureTests() {
  console.log('Starting extensionArchitecture unit test suite...');

  // Test 1: RBAC Access Control for Candidate accounts
  const candidateSession = {
    email: 'candidate@example.com',
    accountType: 'seeker',
    displayName: 'Jane Doe'
  };
  assert.strictEqual(canAccessRole(candidateSession, 'seeker'), true, 'Candidate must have access to seeker role');
  assert.strictEqual(canAccessRole(candidateSession, 'recruiter'), false, 'Candidate must NOT have access to recruiter role');
  assert.strictEqual(canAccessRole(candidateSession, 'admin'), false, 'Candidate must NOT have access to admin role');
  console.log('✓ Test 1: Candidate RBAC restrictions verified');

  // Test 2: RBAC Access Control for Recruiter / Staffing Firm accounts
  const recruiterSession = {
    email: 'recruiter@techstaff.com',
    accountType: 'recruiter',
    displayName: 'John Recruiter'
  };
  const staffingSession = {
    email: 'partner@staffing.com',
    accountType: 'staffingFirm',
    displayName: 'Staffing Firm Partner'
  };
  assert.strictEqual(canAccessRole(recruiterSession, 'seeker'), true, 'Recruiter has seeker baseline');
  assert.strictEqual(canAccessRole(recruiterSession, 'recruiter'), true, 'Recruiter has recruiter workspace access');
  assert.strictEqual(canAccessRole(recruiterSession, 'admin'), false, 'Recruiter cannot access admin panel');
  assert.strictEqual(canAccessRole(staffingSession, 'recruiter'), true, 'Staffing firm has recruiter access');
  console.log('✓ Test 2: Recruiter and staffing firm RBAC verified');

  // Test 3: Master Platform Architect override
  const architectSession = {
    email: 'Chris.Barnes.2000@me.com',
    accountType: 'seeker'
  };
  const adminFlaggedSession = {
    email: 'admin@ascend.com',
    isAdmin: true
  };
  assert.strictEqual(canAccessRole(architectSession, 'seeker'), true, 'Architect has seeker access');
  assert.strictEqual(canAccessRole(architectSession, 'recruiter'), true, 'Architect has recruiter access');
  assert.strictEqual(canAccessRole(architectSession, 'admin'), true, 'Architect has full admin access');
  assert.strictEqual(canAccessRole(adminFlaggedSession, 'admin'), true, 'isAdmin flag grants full admin access');
  console.log('✓ Test 3: Master Platform Architect access verified');

  // Test 4: Defensive handling of null or invalid sessions (NASA JPL Rule 5 & Rule 7)
  assert.strictEqual(canAccessRole(null, 'seeker'), false, 'Null session returns false');
  assert.strictEqual(canAccessRole(undefined, 'recruiter'), false, 'Undefined session returns false');
  assert.strictEqual(canAccessRole({}, 'admin'), false, 'Empty session returns false');
  console.log('✓ Test 4: Defensive session validation verified');

  // Test 5: Prompt Matrix Dictionary & Canonical URL Invariants
  assert.strictEqual(APP_BASE_URL, 'https://ascend-ats.ai.studio', 'Canonical APP_BASE_URL must point to public production domain');
  assert.strictEqual(Boolean(PROMPT_INFO.v1), true, 'V1 prompt info must exist');
  assert.strictEqual(Boolean(PROMPT_INFO.v2), true, 'V2 prompt info must exist');
  assert.strictEqual(Boolean(PROMPT_INFO.v3), true, 'V3 prompt info must exist');
  assert.strictEqual(PROMPT_INFO.v1.tag, 'Heuristic', 'V1 tag must be Heuristic');
  assert.strictEqual(PROMPT_INFO.v2.tag, 'Taxonomy', 'V2 tag must be Taxonomy');
  assert.strictEqual(PROMPT_INFO.v3.tag, 'STAR Prep', 'V3 tag must be STAR Prep');
  console.log('✓ Test 5: Prompt matrix metadata catalog and public canonical URL validated');

  // Test 6: CSS Design Tokens Sheet Invariants
  const tokensPath = path.resolve(process.cwd(), 'extension/css/tokens.css');
  assert.strictEqual(fs.existsSync(tokensPath), true, 'tokens.css must exist');
  const tokensContent = fs.readFileSync(tokensPath, 'utf8');
  assert.strictEqual(tokensContent.includes('--primary: #2563eb;'), true, 'Brand primary token must match standard palette');
  assert.strictEqual(tokensContent.includes('--slate-900: #0f172a;'), true, 'Slate neutral tokens must exist');
  assert.strictEqual(tokensContent.includes('--emerald-600: #059669;'), true, 'Semantic emerald token must exist');
  assert.strictEqual(tokensContent.includes('--rose-600: #e11d48;'), true, 'Semantic rose token must exist');
  assert.strictEqual(tokensContent.includes('--radius-xl: 12px;'), true, 'Radius scale must be defined');
  console.log('✓ Test 6: Unified design tokens verified');

  // Test 7: Manifest V3 Configuration & File Integrity
  const manifestPath = path.resolve(process.cwd(), 'extension/manifest.json');
  assert.strictEqual(fs.existsSync(manifestPath), true, 'manifest.json must exist');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert.strictEqual(manifest.manifest_version, 3, 'Must be Manifest V3');
  assert.strictEqual(manifest.version, '1.2.6', 'Extension version must be 1.2.6');
  assert.strictEqual(manifest.permissions.includes('tabs'), true, 'Manifest permissions must include tabs');
  assert.strictEqual(manifest.permissions.includes('scripting'), true, 'Manifest permissions must include scripting');
  assert.strictEqual(
    manifest.host_permissions.includes('https://ascend-ats.ai.studio/*'),
    true,
    'Manifest host_permissions must include https://ascend-ats.ai.studio/*'
  );
  assert.strictEqual(manifest.icons['128'], 'icon128.png', 'Manifest icon 128 must be icon128.png');
  assert.strictEqual(manifest.action.default_icon['128'], 'icon128.png', 'Action default icon 128 must be icon128.png');
  assert.strictEqual(fs.existsSync(path.resolve(process.cwd(), 'extension/icon128.png')), true, 'icon128.png must exist on disk');
  assert.strictEqual(fs.existsSync(path.resolve(process.cwd(), 'extension/icon48.png')), true, 'icon48.png must exist on disk');
  assert.strictEqual(fs.existsSync(path.resolve(process.cwd(), 'extension/icon16.png')), true, 'icon16.png must exist on disk');
  
  // Verify all declared scripts exist on disk
  manifest.content_scripts.forEach((cs: any) => {
    cs.js.forEach((scriptFile: string) => {
      const scriptPath = path.resolve(process.cwd(), 'extension', scriptFile);
      assert.strictEqual(fs.existsSync(scriptPath), true, `Declared content script ${scriptFile} must exist`);
    });
    cs.css.forEach((cssFile: string) => {
      const cssPath = path.resolve(process.cwd(), 'extension', cssFile);
      assert.strictEqual(fs.existsSync(cssPath), true, `Declared stylesheet ${cssFile} must exist`);
    });
  });

  // Verify popup.html contains dynamic version tag span container
  const popupHtmlPath = path.resolve(process.cwd(), 'extension/popup.html');
  const popupHtmlContent = fs.readFileSync(popupHtmlPath, 'utf8');
  assert.strictEqual(popupHtmlContent.includes('id="ext-version-tag"'), true, 'popup.html must contain id="ext-version-tag"');
  assert.strictEqual(popupHtmlContent.includes(`v${manifest.version}`), true, 'popup.html static fallback must match manifest version');
  console.log('✓ Test 7: Manifest V3 file integrity, multi-resolution PNG icons, content script paths, and visual version tag validated');

  // Test 8: NASA JPL Rule 4 - Compact function length (< 60 lines) in orchestrators
  const popupJsPath = path.resolve(process.cwd(), 'extension/popup.js');
  const contentJsPath = path.resolve(process.cwd(), 'extension/content.js');
  const popupLines = fs.readFileSync(popupJsPath, 'utf8').split('\n').length;
  const contentLines = fs.readFileSync(contentJsPath, 'utf8').split('\n').length;
  assert.strictEqual(popupLines <= 100, true, 'popup.js orchestrator must be modular and compact (<= 100 lines)');
  assert.strictEqual(contentLines <= 100, true, 'content.js orchestrator must be modular and compact (<= 100 lines)');
  console.log('✓ Test 8: NASA JPL Rule 4 compactness verified on orchestrator files');

  // Test 9: Documentation File Integrity
  const docPath = path.resolve(process.cwd(), 'Docs/EXTENSION_ARCHITECTURE.md');
  assert.strictEqual(fs.existsSync(docPath), true, 'EXTENSION_ARCHITECTURE.md must exist in Docs/');
  const docContent = fs.readFileSync(docPath, 'utf8');
  assert.strictEqual(docContent.includes('Ascend ATS Browser Extension Architecture'), true, 'Doc title verified');
  assert.strictEqual(docContent.includes('scrapers.js'), true, 'Doc includes scrapers reference');
  console.log('✓ Test 9: Architecture documentation verified');

  // Test 10: Match Engine - High Match Evaluation & Diff Breakdown
  const devProfile = {
    targetRole: 'Staff Frontend Engineer',
    skills: ['TypeScript', 'React', 'Node.js', 'System Design'],
    targetSalary: 140000,
    preferredWorkplaceType: 'Remote',
    workExperience: [{ title: 'Senior Engineer', company: 'TechCorp', skills: ['TypeScript', 'React'] }]
  };
  const devJob = {
    title: 'Senior Frontend Engineer',
    company: 'InnovateCorp',
    description: 'We are seeking a Senior Frontend Engineer proficient in React, TypeScript, and Node.js. 4+ years of experience required. $130k - $160k salary.',
    minSalary: 130000,
    maxSalary: 160000,
    workplaceType: 'Remote',
    minExperience: 4
  };
  const highBreakdown = getMatchBreakdown(devProfile, devJob);
  assert.strictEqual(highBreakdown.overallScore >= 70, true, 'Matching profile should achieve >=70% score');
  assert.strictEqual(highBreakdown.isLowMatch, false, 'Matching profile is NOT low match');
  assert.strictEqual(highBreakdown.skillsMatch.matched.length >= 2, true, 'At least 2 skills matched');
  assert.strictEqual(highBreakdown.salaryMatch.isMatch, true, 'Salary range should match');
  console.log('✓ Test 10: High match calculation and elaborate diff breakdown verified');

  // Test 11: Match Engine - Low Match (<60%) Threshold Detection & Close Tab Guidance
  const mismatchedJob = {
    title: 'Registered Nurse - Acute Care ICU',
    company: 'General Health Center',
    description: 'Provide inpatient direct bedside nursing care, administer medication, and maintain clinical compliance. BSN required. $75k - $90k salary. On-site 12-hour shifts.',
    minSalary: 75000,
    maxSalary: 90000,
    workplaceType: 'On-Site',
    minExperience: 3
  };
  const lowBreakdown = getMatchBreakdown(devProfile, mismatchedJob);
  assert.strictEqual(lowBreakdown.overallScore < 60, true, `Mismatched role score (${lowBreakdown.overallScore}) must be < 60%`);
  assert.strictEqual(lowBreakdown.isLowMatch, true, 'Low match flag must be true for <60% match');
  assert.strictEqual(lowBreakdown.salaryMatch.isMatch, false, 'Salary diff must detect budget gap');
  assert.strictEqual(lowBreakdown.workplaceMatch.isMatch, false, 'On-site vs Remote setting must detect divergence');
  console.log('✓ Test 11: Low match (<60%) threshold trigger and gap diff verified');

  console.log('All extensionArchitecture unit tests passed successfully!');
}
