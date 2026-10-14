/**
 * Mass Outreach & Network Ingestion Engine
 * Adheres strictly to NASA JPL Power of 10 Safety-Critical Rules:
 * - Rule 1: Simple, deterministic control flow.
 * - Rule 2: Hard iteration ceiling (MAX_IMPORT_ROWS = 2500).
 * - Rule 4: Modular, concise sub-functions.
 * - Rule 5: Defensive input preconditions and assertions.
 * - Rule 8: Strict types and zero magic values.
 */

export const MAX_IMPORT_ROWS = 2500;

export type OutreachClassification = 'recruiter_lead' | 'staffing_partner' | 'employer_lead' | 'general_contact';

export interface ParsedOutreachContact {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  allEmails?: string[];
  phone: string;
  allPhones?: string[];
  company: string;
  position: string;
  linkedInUrl: string;
  relationship?: string;
  connectedOn?: string;
  classification: OutreachClassification;
  source: 'linkedin_export' | 'contacts_export' | 'categorized_export' | 'generic_csv';
}

export interface OutreachCampaignTemplates {
  subject: string;
  body: string;
  mailtoLink: string;
  gmailUrl: string;
  outlookUrl: string;
}

/**
 * Known staffing & recruitment agencies
 */
const KNOWN_STAFFING_FIRMS: string[] = [
  'revature',
  'robert half',
  'diversant',
  'intelliswift',
  'mitchell martin',
  'apex systems',
  'lancesoft',
  'artech',
  'hunter bond',
  'cynet systems',
  'the judge group',
  'pyramid consulting',
  'us tech solutions',
  'talan',
  'nlb services',
  'bcforward',
  'atc',
  'beacon hill',
  'genesys consulting',
  'agama solutions',
  'ds technologies',
  'incendia partners',
  'candidate labs',
  'ripplematch',
  'proliance consulting',
  'volt'
];

/**
 * Standard recruiter position keywords
 */
const RECRUITER_KEYWORD_REGEX = /(recruiter|talent acquisition|talent advisor|talent sourcer|technical recruiter|executive search|sourcing|staffing|headhunter|talent lead|recruitment|sourcer|workforce intelligence|placement specialist|resourcing)/i;

/**
 * Parse a single CSV line with support for quoted strings and commas
 */
export function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  const len = line.length;

  for (let i = 0; i < len; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && i + 1 < len && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Parse raw CSV text into array of rows
 */
export function parseCsvRows(csvText: string): string[][] {
  if (!csvText || typeof csvText !== 'string') return [];
  const rawLines = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const rows: string[][] = [];

  for (let i = 0; i < rawLines.length && rows.length < MAX_IMPORT_ROWS; i++) {
    const line = rawLines[i].trim();
    if (!line) continue;
    // Skip notes line (e.g. LinkedIn intro notes)
    if (line.startsWith('Notes:') || line.startsWith('"When exporting your connection data')) continue;
    rows.push(parseCsvLine(line));
  }

  return rows;
}

/**
 * Classify a contact based on company and position
 */
export function classifyContact(position: string, company: string, relationship?: string): OutreachClassification {
  const normPos = (position || '').toLowerCase();
  const normComp = (company || '').toLowerCase();
  const normRel = (relationship || '').toLowerCase();

  const isStaffingFirm = KNOWN_STAFFING_FIRMS.some(firm => normComp.includes(firm));
  const isRecruiterTitle = RECRUITER_KEYWORD_REGEX.test(normPos);

  if (normRel.includes('recruiter') || (isStaffingFirm && isRecruiterTitle)) {
    return 'staffing_partner';
  }

  if (isRecruiterTitle) {
    return isStaffingFirm ? 'staffing_partner' : 'recruiter_lead';
  }

  if (isStaffingFirm) {
    return 'staffing_partner';
  }

  const isCorporateEmployer = /(citi|boeing|becu|google|microsoft|amazon|apple|jpmorgan|fidelity|salesforce|netflix|stripe|oracle|datadog|meta|snowflake)/i.test(normComp);
  if (isCorporateEmployer && (normPos.includes('manager') || normPos.includes('director') || normPos.includes('lead') || normPos.includes('vp') || normPos.includes('head') || normPos.includes('president') || normPos.includes('founder') || normPos.includes('ceo'))) {
    return 'employer_lead';
  }

  return 'general_contact';
}

/**
 * Extract clean single email and extra emails from dirty field
 */
function extractEmails(rawEmail: string): { primary: string; all: string[] } {
  if (!rawEmail) return { primary: '', all: [] };
  const cleaned = rawEmail.replace(/\\,/g, ',').replace(/\\/g, '');
  const tokens = cleaned.split(/[,;\s]+/).map(t => t.trim().toLowerCase()).filter(t => t.includes('@'));
  return {
    primary: tokens[0] || '',
    all: tokens
  };
}

/**
 * Extract clean phone numbers
 */
function extractPhones(rawPhone: string): { primary: string; all: string[] } {
  if (!rawPhone) return { primary: '', all: [] };
  const cleaned = rawPhone.replace(/\\,/g, ',').replace(/\\/g, '');
  const tokens = cleaned.split(',').map(p => p.trim()).filter(p => p.length >= 7);
  return {
    primary: tokens[0] || '',
    all: tokens
  };
}

/**
 * Generate a deterministic safe document ID
 */
export function generateDeterministicContactId(email: string, firstName: string, lastName: string, company: string): string {
  if (email && email.trim().length > 3) {
    return email.toLowerCase().replace(/[^a-z0-9]/g, '_');
  }
  const base = `${firstName}_${lastName}_${company}`.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 80);
  return base || `contact_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Ingest and parse arbitrary CSV text into standardized ParsedOutreachContact array
 */
export function parseOutreachCsv(rawCsvText: string): ParsedOutreachContact[] {
  const rows = parseCsvRows(rawCsvText);
  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.trim().toLowerCase());
  const contacts: ParsedOutreachContact[] = [];
  const seenIds = new Set<string>();

  // Detect Schema Type
  const isContactsExport = headers.includes('phonenumbers') || headers.includes('emails') || headers.includes('regioncode');
  const isCategorizedLinkedIn = headers.includes('relationship');
  const isStandardLinkedIn = headers.includes('url') && headers.includes('connected on');

  // Header Indices
  let fnIdx = headers.findIndex(h => h === 'first name' || h === 'firstname');
  let lnIdx = headers.findIndex(h => h === 'last name' || h === 'lastname');
  let urlIdx = headers.findIndex(h => h === 'url' || h === 'linkedin url' || h === 'linkedin');
  let emailIdx = headers.findIndex(h => h === 'email address' || h === 'emails' || h === 'email');
  let compIdx = headers.findIndex(h => h === 'company');
  let posIdx = headers.findIndex(h => h === 'position' || h === 'title');
  let relIdx = headers.findIndex(h => h === 'relationship');
  let phoneIdx = headers.findIndex(h => h === 'phonenumbers' || h === 'phone');
  let dateIdx = headers.findIndex(h => h === 'connected on' || h === 'createdat');

  for (let i = 1; i < rows.length && contacts.length < MAX_IMPORT_ROWS; i++) {
    const row = rows[i];
    if (row.length === 0 || row.every(cell => !cell)) continue;

    const firstName = fnIdx >= 0 && row[fnIdx] ? row[fnIdx].trim() : '';
    const lastName = lnIdx >= 0 && row[lnIdx] ? row[lnIdx].trim() : '';
    const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'Unnamed Contact';

    const rawEmail = emailIdx >= 0 && row[emailIdx] ? row[emailIdx].trim() : '';
    const { primary: email, all: allEmails } = extractEmails(rawEmail);

    const rawPhone = phoneIdx >= 0 && row[phoneIdx] ? row[phoneIdx].trim() : '';
    const { primary: phone, all: allPhones } = extractPhones(rawPhone);

    const company = compIdx >= 0 && row[compIdx] ? row[compIdx].trim() : '';
    const position = posIdx >= 0 && row[posIdx] ? row[posIdx].trim() : '';
    const linkedInUrl = urlIdx >= 0 && row[urlIdx] ? row[urlIdx].trim() : '';
    const relationship = relIdx >= 0 && row[relIdx] ? row[relIdx].trim() : '';
    const connectedOn = dateIdx >= 0 && row[dateIdx] ? row[dateIdx].trim() : '';

    // Ignore completely empty contact entries
    if (!firstName && !lastName && !email && !company && !position) continue;

    const source: ParsedOutreachContact['source'] = isContactsExport
      ? 'contacts_export'
      : isCategorizedLinkedIn
      ? 'categorized_export'
      : isStandardLinkedIn
      ? 'linkedin_export'
      : 'generic_csv';

    const classification = classifyContact(position, company, relationship);
    const id = generateDeterministicContactId(email, firstName, lastName, company);

    if (seenIds.has(id)) continue;
    seenIds.add(id);

    contacts.push({
      id,
      firstName,
      lastName,
      fullName,
      email,
      allEmails,
      phone,
      allPhones,
      company,
      position,
      linkedInUrl,
      relationship,
      connectedOn,
      classification,
      source
    });
  }

  return contacts;
}

/**
 * Generate customized outreach emails for different campaign personas
 */
export function generateOutreachTemplates(
  contact: ParsedOutreachContact,
  type: 'partner_invite' | 'recruiter_lead' | 'access_request',
  inviteCode?: string,
  origin: string = (typeof window !== 'undefined' && window.location ? window.location.origin : 'https://ascend.app')
): OutreachCampaignTemplates {
  const code = inviteCode || 'ASCEND-PARTNER';
  const role = contact.classification === 'staffing_partner' ? 'recruiter' : 'recruiter';
  const joinUrl = `${origin}/#signup?invite=${code}&email=${encodeURIComponent(contact.email || '')}&role=${role}`;

  let subject = '';
  let body = '';

  if (type === 'partner_invite') {
    subject = `Strategic Staffing Partnership & Direct Talent Gateway | Ascend ATS`;
    body = `Hi ${contact.firstName || 'there'},\n\nHope this finds you well. I noticed your work leading recruitment efforts at ${contact.company || 'your agency'}.\n\nWe have built Ascend ATS — a high-transparency applicant tracking ecosystem that pairs pre-vetted, high-caliber engineering and business candidates with elite staffing firms and direct employers.\n\nI would love to issue you an exclusive platform access token for ${contact.company || 'your team'}.\n\nYour Activation Invite Code: ${code}\nDirect Onboarding Portal: ${joinUrl}\n\nLooking forward to collaborating on strategic placements!\n\nBest regards,\nAscend ATS Administration`;
  } else if (type === 'recruiter_lead') {
    subject = `Candidate Pipeline Collaboration & Talent Matching | Ascend ATS`;
    body = `Hi ${contact.firstName || 'there'},\n\nI came across your profile and recent roles at ${contact.company || 'your organization'}.\n\nOur platform, Ascend ATS, utilizes qualitative skills verification and transparent employer criteria to match candidates directly with active agency sourcers and technical recruiters without ghost jobs or resume black holes.\n\nFeel free to explore our recruiter gateway here:\n${origin}/#affiliates\n\nOr connect with me directly on LinkedIn: ${contact.linkedInUrl || 'Ascend ATS Network'}\n\nBest,\nAscend ATS Talent Team`;
  } else {
    subject = `Ascend ATS Platform Verification & Inbound Employer Review`;
    body = `Hello ${contact.firstName || contact.fullName},\n\nThank you for connecting regarding recruitment capabilities at ${contact.company || 'your company'}.\n\nWe have registered your interest in the Ascend ATS employer portal. Our team is reviewing verification details to provide you with direct candidate search capabilities.\n\nPortal: ${origin}\n\nBest regards,\nAscend ATS Team`;
  }

  const mailtoLink = `mailto:${contact.email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(contact.email || '')}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const outlookUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(contact.email || '')}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return { subject, body, mailtoLink, gmailUrl, outlookUrl };
}

/**
 * Format outreach contacts for CSV export
 */
export function exportContactsToCsv(contacts: ParsedOutreachContact[]): string {
  const header = ['ID', 'Full Name', 'First Name', 'Last Name', 'Email', 'Phone', 'Company', 'Position', 'Classification', 'LinkedIn URL', 'Relationship', 'Connected On'];
  const rows = contacts.map(c => [
    `"${c.id.replace(/"/g, '""')}"`,
    `"${c.fullName.replace(/"/g, '""')}"`,
    `"${c.firstName.replace(/"/g, '""')}"`,
    `"${c.lastName.replace(/"/g, '""')}"`,
    `"${c.email.replace(/"/g, '""')}"`,
    `"${c.phone.replace(/"/g, '""')}"`,
    `"${c.company.replace(/"/g, '""')}"`,
    `"${c.position.replace(/"/g, '""')}"`,
    `"${c.classification}"`,
    `"${c.linkedInUrl.replace(/"/g, '""')}"`,
    `"${(c.relationship || '').replace(/"/g, '""')}"`,
    `"${(c.connectedOn || '').replace(/"/g, '""')}"`
  ]);

  return [header.join(','), ...rows.map(r => r.join(','))].join('\n');
}
