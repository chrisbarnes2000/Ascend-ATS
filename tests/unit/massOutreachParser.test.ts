import assert from 'node:assert';
import { 
  parseCsvLine, 
  parseCsvRows, 
  classifyContact, 
  parseOutreachCsv, 
  generateOutreachTemplates, 
  exportContactsToCsv,
  MAX_IMPORT_ROWS,
  generateDeterministicContactId
} from '../../src/utils/massOutreachParser';

export function runMassOutreachParserTests() {
  console.log('Running Mass Outreach & CSV Parser Tests...');

  // 1. Line parser with escaped quotes and commas inside quotes
  const line = 'Katie,Overbeck,"https://www.linkedin.com/in/katie-overbeck",,"Waste Connections","Corporate Recruiter, Talent Pipeline",03 Aug 2026';
  const tokens = parseCsvLine(line);
  assert.strictEqual(tokens.length, 7, 'Correctly splits into 7 tokens');
  assert.strictEqual(tokens[0], 'Katie');
  assert.strictEqual(tokens[1], 'Overbeck');
  assert.strictEqual(tokens[4], 'Waste Connections');
  assert.strictEqual(tokens[5], 'Corporate Recruiter, Talent Pipeline', 'Preserves comma inside quotes');
  console.log('✓ Test 1: CSV line parser handles quoted fields with embedded commas');

  // 2. Classification Engine Tests
  assert.strictEqual(
    classifyContact('Corporate Recruiter', 'Waste Connections'),
    'recruiter_lead',
    'Classifies internal corporate recruiter'
  );
  assert.strictEqual(
    classifyContact('Lead Technical Recruiter', 'Revature'),
    'staffing_partner',
    'Classifies Revature technical recruiter as staffing partner'
  );
  assert.strictEqual(
    classifyContact('Senior Practice Director', 'Robert Half'),
    'staffing_partner',
    'Classifies Robert Half practice director as staffing partner'
  );
  assert.strictEqual(
    classifyContact('Engineering Manager', 'Boeing'),
    'employer_lead',
    'Classifies Boeing engineering manager as employer lead'
  );
  assert.strictEqual(
    classifyContact('Software Engineer', 'Walmart'),
    'general_contact',
    'Defaults general software engineer to general_contact'
  );
  assert.strictEqual(
    classifyContact('Associate', 'Revature', 'Recruiter'),
    'staffing_partner',
    'Respects relationship column override for Recruiter'
  );
  console.log('✓ Test 2: Classification rules deterministically partition contacts');

  // 3. LinkedIn Connection Export Parsing
  const linkedInSnippet = `Notes:
"When exporting your connection data, you may notice that some of the email addresses are missing."

First Name,Last Name,URL,Email Address,Company,Position,Connected On
Katie,Overbeck,https://www.linkedin.com/in/katie-overbeck,,Waste Connections,Corporate Recruiter,03 Aug 2026
Preston,Johnson,https://www.linkedin.com/in/prestonjohnson,preston.johnson@roberthalf.com,Robert Half,Senior Talent Manager,14 Jul 2026
Senthil,Kumar,https://www.linkedin.com/in/senthil-kumar,senthil.kumar@revature.com,Revature,Delivery Manager,09 Jul 2026
`;
  const parsedLinkedIn = parseOutreachCsv(linkedInSnippet);
  assert.strictEqual(parsedLinkedIn.length, 3, 'Parses 3 contacts, skipping notes');
  assert.strictEqual(parsedLinkedIn[0].fullName, 'Katie Overbeck');
  assert.strictEqual(parsedLinkedIn[0].classification, 'recruiter_lead');
  assert.strictEqual(parsedLinkedIn[1].email, 'preston.johnson@roberthalf.com');
  assert.strictEqual(parsedLinkedIn[1].classification, 'staffing_partner');
  assert.strictEqual(parsedLinkedIn[2].company, 'Revature');
  console.log('✓ Test 3: Standard LinkedIn connections export successfully parsed');

  // 4. Contacts Card Export Parsing (cleaning escaped backslashes in phone and multi-emails)
  const contactsSnippet = `FirstName,MiddleName,LastName,MaidenName,NickName,NamePrefix,NameSuffix,Title,Emails,PhoneNumbers,CreatedAt,UpdatedAt,CountryCode,RegionCode,ThirdPartyVerified,Location
Kamran,,Khan,,,,,,kamran.khan@intelliswift.com,510-370-0793,"5/27/22, 8:16 PM","5/27/22, 8:16 PM",,,,
Meghan,,Damminger,,,,,,meghan.damminger@revature.com,"703.372.0300\\, 703.372.0301","5/2/23, 9:55 PM","5/2/23, 9:55 PM",,,,
Luke,A.,Vaughn,,,,,,luke.vaughn@roberthalf.com,"469.804.0750\\, 940.277.6426","4/27/22, 5:37 PM","4/27/22, 5:37 PM",,,,
`;
  const parsedContacts = parseOutreachCsv(contactsSnippet);
  assert.strictEqual(parsedContacts.length, 3, 'Parses 3 contacts from Contacts export');
  assert.strictEqual(parsedContacts[0].email, 'kamran.khan@intelliswift.com');
  assert.strictEqual(parsedContacts[1].phone, '703.372.0300', 'Sanitizes escaped backslash from phone');
  assert.strictEqual(parsedContacts[2].fullName, 'Luke Vaughn');
  console.log('✓ Test 4: Apple/Google contacts export parsed with sanitized phone/email tokens');

  // 5. Categorized Connections Export with Relationship column
  const categorizedSnippet = `First Name,Last Name,Relationship,Position,Company,URL,Email Address,Connected On
Andres,Hernandez,Ft. Employment,Senior Talent Acquisition Partner - Technology,BECU,https://www.linkedin.com/in/andres-hernandez,,18-Nov-24
Clay,Berry,Recruiter,"Vice President, Recruiting",The Judge Group,https://www.linkedin.com/in/clay-berry,,14-Jan-25
`;
  const parsedCategorized = parseOutreachCsv(categorizedSnippet);
  assert.strictEqual(parsedCategorized.length, 2, 'Parses categorized export');
  assert.strictEqual(parsedCategorized[0].relationship, 'Ft. Employment');
  assert.strictEqual(parsedCategorized[0].classification, 'recruiter_lead', 'Talent acquisition partner is classified as recruiter_lead');
  assert.strictEqual(parsedCategorized[1].classification, 'staffing_partner', 'The Judge Group recruiter classified as staffing_partner');
  console.log('✓ Test 5: Categorized export relationship mapping verified');

  // 6. Deduplication by ID
  const duplicateSnippet = `First Name,Last Name,URL,Email Address,Company,Position,Connected On
Senthil,Kumar,https://www.linkedin.com/in/senthil-kumar,senthil.kumar@revature.com,Revature,Delivery Manager,09 Jul 2026
Senthil,Kumar,https://www.linkedin.com/in/senthil-kumar,senthil.kumar@revature.com,Revature,Delivery Manager,09 Jul 2026
`;
  const deduplicated = parseOutreachCsv(duplicateSnippet);
  assert.strictEqual(deduplicated.length, 1, 'Duplicate email entries properly collapsed to 1 record');
  console.log('✓ Test 6: Ingestion deduplication prevents duplicate database nodes');

  // 7. Outreach Template Generation
  const testContact = parsedLinkedIn[1]; // Preston Johnson
  const templates = generateOutreachTemplates(testContact, 'partner_invite', 'TOKEN-RH-99', 'https://ascend.app');
  assert.ok(templates.subject.includes('Strategic Staffing Partnership'), 'Subject contains partner keywords');
  assert.ok(templates.body.includes('TOKEN-RH-99'), 'Body contains token code');
  assert.ok(templates.mailtoLink.startsWith('mailto:preston.johnson@roberthalf.com'), 'Valid mailto string');
  assert.ok(templates.gmailUrl.includes('mail.google.com'), 'Valid Gmail compose deep-link');
  assert.ok(templates.outlookUrl.includes('outlook.live.com'), 'Valid Outlook compose deep-link');
  console.log('✓ Test 7: Multi-channel outreach email templates validated');

  // 8. CSV Export
  const exported = exportContactsToCsv(parsedLinkedIn);
  assert.ok(exported.startsWith('ID,Full Name,First Name,Last Name,Email'), 'Export header is valid');
  assert.ok(exported.includes('Katie Overbeck'), 'Export rows contain data');
  console.log('✓ Test 8: Campaign CSV generator produces valid RFC CSV');

  // 9. NASA JPL Rule 2: Upper ceiling bound
  assert.strictEqual(MAX_IMPORT_ROWS, 2500, 'Hard safety ceiling constant verified');
  console.log('✓ Test 9: NASA JPL Power of 10 Rule 2 loop ceiling bounded at 2500');

  console.log('All Mass Outreach & Ingestion Tests passed successfully!\n');
}
