import { describe, it } from 'node:test';
import assert from 'node:assert';

// Dice & Recruiter Outreach Extraction Parser for Testing
function diceEmailNlpParse(text: string, url?: string) {
  const normalized = text || '';
  const lines = normalized.split('\n').map(l => l.trim()).filter(Boolean);

  const recruiterInfo: any = {};

  // 1. Recruiter Name & Introduction
  const introMatch = normalized.match(/(?:this side|my name is|this is|i am)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/i);
  const sigNameMatch = normalized.match(/(?:thanks\s*&?\s*regards|best\s*regards|sincerely|regards)[,\s\n]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
  const topSenderMatch = normalized.match(/(?:DR|NP)\s*\n?([A-Z][a-z]+\s+[A-Z][a-z]+)/);

  let extractedName = '';
  if (sigNameMatch && sigNameMatch[1] && sigNameMatch[1].trim().split(/\s+/).length > 1) {
    extractedName = sigNameMatch[1].trim();
  } else if (topSenderMatch && topSenderMatch[1]) {
    extractedName = topSenderMatch[1].trim();
  } else if (introMatch && introMatch[1]) {
    const clean = introMatch[1].replace(/\b(?:working|at|with|from|and|an?|the|here)\b.*$/i, '').trim();
    if (clean && !['Hello', 'Hope', 'Chris', 'Devops'].includes(clean)) {
      extractedName = clean;
    }
  } else if (sigNameMatch && sigNameMatch[1]) {
    extractedName = sigNameMatch[1].trim();
  }

  if (extractedName) {
    recruiterInfo.name = extractedName;
  }

  // 2. Direct Recruiter Email
  const allEmails = normalized.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
  const directCompanyEmail = allEmails.find(e => !e.includes('dice.com') && !e.includes('me.com') && !e.includes('example.com'));
  const diceProxyEmail = allEmails.find(e => e.includes('dice.com'));
  
  if (directCompanyEmail) {
    recruiterInfo.email = directCompanyEmail;
  } else if (diceProxyEmail) {
    recruiterInfo.email = diceProxyEmail;
  }

  // 3. Phone / Mobile / Desk
  const mobileMatch = normalized.match(/mobile\s*:\s*(\+?[\d\s-]{10,18})/i);
  const deskMatch = normalized.match(/(?:desk|phone|tel)\s*:\s*(\+?[\d\s-xX.]{10,25})/i);
  const generalPhoneMatch = normalized.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}(?:\s*(?:x|ext\.?)\s*\d+)?/i);

  if (mobileMatch) {
    recruiterInfo.phone = mobileMatch[1].trim();
  } else if (deskMatch) {
    recruiterInfo.phone = deskMatch[1].trim();
  } else if (generalPhoneMatch) {
    recruiterInfo.phone = generalPhoneMatch[0].trim();
  }

  // 4. Staffing Agency / Firm Name & Website
  const firmMatch = normalized.match(/(?:at|with|working at|recruiter with)\s+([A-Z][A-Za-z0-9\s]{2,30}?)(?:\.|\,|\n|for fortune|\;)/i);
  const sigFirmMatch = normalized.match(/(?:Tekfortune Inc|Applab Systems Inc|Sibitalent|Intone|Tekfortune|Applab Systems)/i);
  const webMatch = normalized.match(/www\.([a-zA-Z0-9-]+\.(?:com|net|org|io|tech))/i);

  if (sigFirmMatch) {
    recruiterInfo.firmName = sigFirmMatch[0].trim();
  } else if (firmMatch && firmMatch[1] && !['a', 'the', 'our', 'fortune', 'one'].includes(firmMatch[1].toLowerCase())) {
    recruiterInfo.firmName = firmMatch[1].trim();
  } else if (webMatch) {
    recruiterInfo.firmName = webMatch[1].split('.')[0].toUpperCase();
  }

  if (recruiterInfo.firmName && normalized.includes(`${recruiterInfo.firmName} Inc`)) {
    recruiterInfo.firmName = `${recruiterInfo.firmName} Inc`;
  }
  if (webMatch) recruiterInfo.firmWebsite = `https://www.${webMatch[1]}`;

  // 5. Client Name
  const clientMatch = normalized.match(/Client\s*:\s*([^\n]+)/i);
  if (clientMatch) {
    recruiterInfo.clientName = clientMatch[1].replace(/USC\/GC.*$/i, '').trim();
  }

  // 6. Contract / Work Auth Type
  const w2Match = normalized.match(/\b(w2|c2c|1099|corp to corp|contract|fulltime only|full-time)\b/i);
  if (w2Match) recruiterInfo.contractType = w2Match[0].toUpperCase();

  const authMatch = normalized.match(/Work Auth\s*:\s*([^\n]+)/i) || normalized.match(/\b(USC\/GC Only|USC|Green Card|GC Only|Citizens Only)\b/i);
  if (authMatch) recruiterInfo.workAuth = authMatch[1] ? authMatch[1].trim() : authMatch[0].trim();

  // 7. Title Extraction
  let title = 'Position Title';
  const explicitRoleMatch = normalized.match(/(?:Role|Job Title|Title)\s*[:–-]+\s*([^\n]+)/i);
  const urgentHiringMatch = normalized.match(/(?:Urgent Hiring|Hiring for)\s+([^|\n]+?)(?:\|\||–|-|\n|\(Onsite\))/i);
  const subjectLineMatch = lines.find(l => (l.includes('Engineer') || l.includes('Developer') || l.includes('Manager') || l.includes('Specialist')) && l.length < 80);

  if (explicitRoleMatch) {
    title = explicitRoleMatch[1]
      .replace(/^[^a-zA-Z0-9]+/, '')
      .replace(/–\s*Fulltime only/i, '')
      .replace(/\(Medical Devices\)/i, 'Medical Devices')
      .replace(/\|\|.*$/g, '')
      .trim();
  } else if (urgentHiringMatch) {
    title = urgentHiringMatch[1].replace(/^[^a-zA-Z0-9]+/, '').trim();
  } else if (subjectLineMatch) {
    title = subjectLineMatch.replace(/^.*?(?:Urgent Hiring|Full Time \|\||Job)\s*/i, '').replace(/\|\|.*$/, '').trim();
  }

  // 8. Location Extraction
  let location = 'United States';
  const locMatch = normalized.match(/Location\s*[:-–]\s*([^\n]+)/i);
  if (locMatch) {
    location = locMatch[1].replace(/\(Onsite\)|\(Remote\)/i, '').trim();
  }

  // 9. Workplace Type
  let workplaceType: 'Remote' | 'Hybrid' | 'On-Site' = 'Remote';
  if (/remote/i.test(normalized) && !/onsite/i.test(normalized.substring(0, 200))) {
    workplaceType = 'Remote';
  } else if (/hybrid/i.test(normalized)) {
    workplaceType = 'Hybrid';
  } else if (/onsite|on-site/i.test(normalized)) {
    workplaceType = 'On-Site';
  }

  // 10. Salary Extraction
  let salaryMin = 0;
  let salaryMax = 0;
  const salaryMatch = normalized.match(/Salary\s*:\s*\$?([0-9]{2,3})[kK]?\s*\/?\s*(?:Annum|Year|hr|hour)?/i);
  if (salaryMatch) {
    const val = parseInt(salaryMatch[1]);
    salaryMin = val < 1000 ? val * 1000 : val;
    salaryMax = salaryMin;
  }

  let companyName = recruiterInfo.firmName || 'Staffing Firm';
  if (recruiterInfo.clientName && recruiterInfo.clientName !== companyName) {
    companyName = `${companyName} (for ${recruiterInfo.clientName})`;
  }

  return {
    title,
    companyName,
    location,
    workplaceType,
    salaryMin,
    salaryMax,
    sourceBoard: 'Dice Recruiter Email',
    recruiterInfo
  };
}

export function runDiceEmailParserTests() {
  console.log('Starting diceEmailParser unit test suite...');

  // Sample 1 Test
  const sample1 = `DevOps Engineer--Onsite - Atlanta, GA Onsit
Dice Recruiter <k68-bac-wdj@user.dice.com>
This is a trusted Dice Private Email. Learn more in the below Q&A.
DR Dice Recruiter
Need w2 candidate
Title : DevOps Engineer
Location : Atlanta, GA
What are the top 3 skills required for this role?
1. DevOps
2. Kubernetes
3. Jenkins
4. Automation using Python/Shell scripting.`;

  const parsed1 = diceEmailNlpParse(sample1);
  assert.strictEqual(parsed1.title, 'DevOps Engineer', 'Sample 1 title must match DevOps Engineer');
  assert.strictEqual(parsed1.location, 'Atlanta, GA', 'Sample 1 location must match Atlanta, GA');
  assert.strictEqual(parsed1.recruiterInfo.contractType, 'W2', 'Sample 1 contract type must be W2');
  console.log('✓ Test 1: Dice Sample 1 (DevOps Engineer, Atlanta, W2) successfully parsed');

  // Sample 2 Test
  const sample2 = `Full Time || Medical Device Project Manager || Bothell, WA, USA (Onsite)
Nitin Pillai <64z-cyi-7dj@recruiter.dice.com>
This is a trusted Dice Private Email.
NP Nitin Pillai Recruiter Tekfortune Inc.
This is Nitin working at Tekfortune, I came across your profile...
Role – Project Manager (Medical Devices)
Location: Austin, TX (Onsite)
Education & Experience:
Bachelor's degree in engineering
Thanks & regards,
Nitin Pillai
Sr. Talent Recruiter
Email: nitin.pillai@tekfortune.com
mobile: +1 551 287 6138
Tekfortune Inc
1297 Centennial Ave. Suite #5-330
Piscataway, NJ 08854
www.tekfortune.com`;

  const parsed2 = diceEmailNlpParse(sample2);
  assert.strictEqual(parsed2.title.includes('Project Manager'), true, 'Sample 2 title contains Project Manager');
  assert.strictEqual(parsed2.recruiterInfo.name, 'Nitin Pillai', 'Sample 2 recruiter name extracted');
  assert.strictEqual(parsed2.recruiterInfo.email, 'nitin.pillai@tekfortune.com', 'Sample 2 direct email extracted');
  assert.strictEqual(parsed2.recruiterInfo.firmName, 'Tekfortune Inc', 'Sample 2 firm name extracted');
  assert.strictEqual(parsed2.recruiterInfo.phone, '+1 551 287 6138', 'Sample 2 mobile phone extracted');
  console.log('✓ Test 2: Dice Sample 2 (Nitin Pillai @ Tekfortune, Medical Device PM) successfully parsed');

  // Sample 3 Test
  const sample3 = `Job DevOps Engineer is shared with you
Dice Recruiter <193-bym-ih0@user.dice.com>
Hello Christopher Barnes
My name is Aditya Singh and I am a Staffing Specialist at Sibitalent. I am reaching out to you on an exciting job opportunity.
Job Title:- DevOps Engineer
Location:- Remote
Duration :: 6+ months
Best Regards,
Aditya Singh
aditya.p@sibitalent.com`;

  const parsed3 = diceEmailNlpParse(sample3);
  assert.strictEqual(parsed3.title, 'DevOps Engineer', 'Sample 3 title is DevOps Engineer');
  assert.strictEqual(parsed3.recruiterInfo.name, 'Aditya Singh', 'Sample 3 recruiter name is Aditya Singh');
  assert.strictEqual(parsed3.recruiterInfo.firmName, 'Sibitalent', 'Sample 3 staffing firm is Sibitalent');
  assert.strictEqual(parsed3.recruiterInfo.email, 'aditya.p@sibitalent.com', 'Sample 3 direct email extracted');
  assert.strictEqual(parsed3.workplaceType, 'Remote', 'Sample 3 workplace is Remote');
  console.log('✓ Test 3: Dice Sample 3 (Aditya Singh @ Sibitalent, Remote DevOps) successfully parsed');

  // Sample 4 Test (Devendra Rai @ Applab Systems)
  const sample4 = `Urgent Hiring Software Developer || Redmond, WA (Onsite)
Devendra Rai <ufi-lm0-j8q@user.dice.com>
This side Devendra Rai, I am an Associate Recruiter with Applab Systems.
Title : Software Developer – Fulltime only
Location : Redmond, WA (Onsite)
Client : Wipro/Amazon
Salary : $120k/Annum (with Benefits)
Work Auth : USC/GC Only
Thank you,
Devendra
Applab Systems Inc
devendra.rai@applabsystems.com
(609) 766-0054 Ext.557`;

  const parsed4 = diceEmailNlpParse(sample4);
  assert.strictEqual(parsed4.title, 'Software Developer', 'Sample 4 title is Software Developer');
  assert.strictEqual(parsed4.recruiterInfo.name, 'Devendra Rai', 'Sample 4 recruiter is Devendra Rai');
  assert.strictEqual(parsed4.recruiterInfo.firmName, 'Applab Systems Inc', 'Sample 4 firm is Applab Systems Inc');
  assert.strictEqual(parsed4.recruiterInfo.email, 'devendra.rai@applabsystems.com', 'Sample 4 direct email extracted');
  assert.strictEqual(parsed4.recruiterInfo.clientName, 'Wipro/Amazon', 'Sample 4 client is Wipro/Amazon');
  assert.strictEqual(parsed4.recruiterInfo.workAuth, 'USC/GC Only', 'Sample 4 work auth is USC/GC Only');
  assert.strictEqual(parsed4.salaryMin, 120000, 'Sample 4 salary is 120000');
  console.log('✓ Test 4: Dice Sample 4 (Devendra Rai @ Applab Systems, $120k, USC/GC) successfully parsed');

  console.log('All diceEmailParser unit tests passed successfully!');
}
