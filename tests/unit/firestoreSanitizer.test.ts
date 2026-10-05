import assert from 'node:assert';
import { sanitizeFirestorePayload, isFieldValueSentinel } from '../../src/utils/firestoreSanitizer';

export function runFirestoreSanitizerTests() {
  console.log('Running Firestore Sanitizer Tests...');

  // 1. Root level undefined stripping
  const dirty1 = {
    title: 'DevOps Engineer',
    canonicalUrl: undefined,
    salaryMin: 120000,
    salaryMax: undefined,
    sourceBoard: 'Dice'
  };
  const clean1 = sanitizeFirestorePayload(dirty1);
  assert.strictEqual('canonicalUrl' in clean1, false, 'canonicalUrl stripped');
  assert.strictEqual('salaryMax' in clean1, false, 'salaryMax stripped');
  assert.strictEqual(clean1.title, 'DevOps Engineer', 'title preserved');
  assert.strictEqual(clean1.salaryMin, 120000, 'salaryMin preserved');
  console.log('✓ Test 1: Root level undefined keys stripped cleanly');

  // 2. Deep nested object undefined stripping
  const dirty2 = {
    title: 'Software Engineer',
    recruiterInfo: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: undefined,
      firmName: 'Tech Staffing',
      clientName: undefined
    }
  };
  const clean2 = sanitizeFirestorePayload(dirty2);
  assert.strictEqual(clean2.recruiterInfo?.name, 'John Doe', 'name preserved');
  assert.strictEqual(clean2.recruiterInfo?.email, 'john@example.com', 'email preserved');
  assert.strictEqual('phone' in (clean2.recruiterInfo || {}), false, 'phone stripped');
  assert.strictEqual('clientName' in (clean2.recruiterInfo || {}), false, 'clientName stripped');
  console.log('✓ Test 2: Nested recruiterInfo undefined fields stripped');

  // 3. Date and null preservation
  const now = new Date();
  const dirty3 = {
    title: 'Nurse',
    createdAt: now,
    clientName: null,
    emptyField: undefined
  };
  const clean3 = sanitizeFirestorePayload(dirty3);
  assert.strictEqual(clean3.createdAt, now, 'Date object preserved');
  assert.strictEqual(clean3.clientName, null, 'null preserved');
  assert.strictEqual('emptyField' in clean3, false, 'emptyField stripped');
  console.log('✓ Test 3: Date and null values preserved');

  // 4. Sentinel preservation
  const mockSentinel = {
    _methodName: 'serverTimestamp',
    constructor: { name: 'FieldValue' }
  };
  const dirty4 = {
    title: 'Nurse',
    createdAt: mockSentinel,
    expiresAt: undefined
  };
  assert.strictEqual(isFieldValueSentinel(mockSentinel), true, 'Sentinel detected');
  const clean4 = sanitizeFirestorePayload(dirty4);
  assert.strictEqual(clean4.createdAt, mockSentinel, 'Sentinel preserved');
  assert.strictEqual('expiresAt' in clean4, false, 'expiresAt stripped');
  console.log('✓ Test 4: FieldValue sentinels (serverTimestamp) preserved');

  // 5. Array handling
  const dirty5 = {
    skills: ['AWS', 'Docker'],
    interviewQuestions: [
      { question: 'Tell me about Docker', answer: 'Docker is...', notes: undefined },
      { question: 'What is CI/CD?', answer: 'CI/CD stands for...', notes: undefined }
    ]
  };
  const clean5 = sanitizeFirestorePayload(dirty5);
  assert.strictEqual(clean5.interviewQuestions?.length, 2, 'Array items preserved');
  assert.strictEqual('notes' in (clean5.interviewQuestions?.[0] || {}), false, 'Array object undefined stripped');
  console.log('✓ Test 5: Arrays with nested objects sanitized');

  console.log('All firestoreSanitizer unit tests passed successfully!');
}
