import assert from 'node:assert';
import { sanitizeFirestorePayload } from '../../src/utils/firestoreSanitizer';

export function runRecruiterLeadsTests() {
  console.log('Running Recruiter Leads & Outreach Sync Tests...');

  // 1. Email ID sanitization
  const email = 'Naveen.Reddy@Tekfortune.com';
  const leadId = email.toLowerCase().replace(/[^a-z0-9]/g, '_');
  assert.strictEqual(leadId, 'naveen_reddy_tekfortune_com', 'Lead ID is deterministic and safe');
  console.log('✓ Test 1: Deterministic lead ID derived from email');

  // 2. Lead document payload creation
  const recruiterInfo = {
    name: 'Naveen Reddy',
    email: 'naveen@tekfortune.com',
    phone: '+1-408-555-0199',
    firmName: 'Tekfortune Inc',
    clientName: undefined
  };

  const rawLead = {
    recruiterName: recruiterInfo.name || 'Unknown Recruiter',
    recruiterEmail: recruiterInfo.email,
    recruiterPhone: recruiterInfo.phone || null,
    firmName: recruiterInfo.firmName || 'Staffing Firm',
    clientName: recruiterInfo.clientName || null,
    sourceBoard: 'Dice Recruiter Email',
    jobTitle: 'DevOps Engineer',
    discoveredByUid: 'user-123',
    discoveredByEmail: 'candidate@test.com',
    status: 'discovered',
    optionalUnassigned: undefined
  };

  const cleanLead = sanitizeFirestorePayload(rawLead);
  assert.strictEqual(cleanLead.recruiterName, 'Naveen Reddy', 'recruiterName preserved');
  assert.strictEqual(cleanLead.recruiterEmail, 'naveen@tekfortune.com', 'recruiterEmail preserved');
  assert.strictEqual(cleanLead.recruiterPhone, '+1-408-555-0199', 'recruiterPhone preserved');
  assert.strictEqual(cleanLead.firmName, 'Tekfortune Inc', 'firmName preserved');
  assert.strictEqual(cleanLead.clientName, null, 'clientName is null');
  assert.strictEqual('optionalUnassigned' in cleanLead, false, 'optionalUnassigned stripped');
  console.log('✓ Test 2: Sanitized lead document created without undefined fields');

  console.log('All recruiterLeads unit tests passed successfully!');
}
