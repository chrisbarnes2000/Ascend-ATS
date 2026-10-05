import { runJobDedupTests } from './unit/jobDedup.test';
import { runProfileMergeTests } from './unit/profileMerge.test';
import { runMaterialShiftTests } from './unit/materialShiftEngine.test';
import { runIdentityGovernanceTests } from './unit/identityGovernance.test';
import { runJsonProfileParserTests } from './unit/jsonProfileParser.test';
import { runDiceEmailParserTests } from './unit/diceEmailParser.test';
import { runFirestoreSanitizerTests } from './unit/firestoreSanitizer.test';
import { runRecruiterLeadsTests } from './unit/recruiterLeads.test';
import { runPdfParserValidationTests } from './unit/pdfParser.test';

console.log("\n=======================================================");
console.log("Ascend ATS Comprehensive Safety-Critical Test Execution");
console.log("=======================================================\n");

try {
  runJsonProfileParserTests();
  runJobDedupTests();
  runProfileMergeTests();
  runMaterialShiftTests();
  runIdentityGovernanceTests();
  runDiceEmailParserTests();
  runFirestoreSanitizerTests();
  runRecruiterLeadsTests();
  runPdfParserValidationTests();
  console.log("\n=======================================================");
  console.log("🟢 100% OF SUITES & ASSERTIONS SATISFIED ZERO FAILURES");
  console.log("=======================================================\n");
} catch (error) {
  console.error("\n❌ Test Suite Failure:", error);
  process.exit(1);
}
