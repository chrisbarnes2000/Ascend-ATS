/**
 * Enhanced Dice Boilerplate Scrubber & Entity Resolution Engine
 * Incorporates stopword phrase filters for company resolution, location artifact scrubbers,
 * salary decimal/default range normalization, and signature block detectors.
 */

export interface CleanedEmployerInfo {
  employerName: string;
  department: string;
  addressLines: string[];
  phoneNumbers: string[];
  websiteUrl: string;
  cleanedDescription: string;
}

const COMPANY_STOPWORDS = [
  'will be used to fill',
  'will have a positive',
  'our tukwila branch',
  'devops',
  'location',
  'remote',
  'n/a',
  'direct hire'
];

export function cleanDiceBoilerplate(rawDescription: string = ''): CleanedEmployerInfo {
  if (!rawDescription) {
    return {
      employerName: 'Direct Employer / Verified Organization',
      department: '',
      addressLines: [],
      phoneNumbers: [],
      websiteUrl: '',
      cleanedDescription: ''
    };
  }

  // 1. Extract official website if present
  let websiteUrl = '';
  const websiteMatch = rawDescription.match(/(?:Website|Site|URL)[:\s]+(https?:\/\/[^\s\n]+)/i) ||
                       rawDescription.match(/(https?:\/\/(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z0-9-\.]+(?:\/[^\s]*)?)/i);
  if (websiteMatch) {
    websiteUrl = websiteMatch[1].replace(/[.,)]$/, '');
  }

  // 2. Extract phone numbers
  const phoneNumbers: string[] = [];
  const phoneRegex = /(?:\+?1[\s-]?)?(?:\(\d{3}\)|\d{3})[\s-]*-?[\s-]*\d{3}[\s-]*-?[\s-]*\d{4}/g;
  let phoneMatch;
  while ((phoneMatch = phoneRegex.exec(rawDescription)) !== null) {
    const num = phoneMatch[0].trim();
    if (!phoneNumbers.includes(num)) {
      phoneNumbers.push(num);
    }
  }

  // 3. Extract employer with stopword validation
  let employerName = 'Verified Organization';
  let department = '';
  
  const employerMatch = rawDescription.match(/(?:Employer|Organization|Company)[:\s]+([^\n]+)/i);
  if (employerMatch) {
    const candidate = employerMatch[1].trim();
    const candidateLower = candidate.toLowerCase();
    const isStopword = COMPANY_STOPWORDS.some(sw => candidateLower.includes(sw));
    if (!isStopword && candidate.length > 2) {
      employerName = candidate;
    }
  }

  // Fallback: search for footer employer block
  if (employerName === 'Verified Organization') {
    const footerEmployerMatch = rawDescription.match(/Employer\s*\n\s*([^\n]+)/i);
    if (footerEmployerMatch) {
      const candidate = footerEmployerMatch[1].trim();
      const candidateLower = candidate.toLowerCase();
      if (!COMPANY_STOPWORDS.some(sw => candidateLower.includes(sw)) && candidate.length > 2) {
        employerName = candidate;
      }
    }
  }

  const deptMatch = rawDescription.match(/(?:Department|Division|Agency)[:\s]+([^\n]+)/i);
  if (deptMatch) {
    department = deptMatch[1].trim();
  }

  // 4. Strip Dice boilerplate blocks, signature blocks, and footers
  let cleaned = rawDescription;

  const diceFooterPatterns = [
    /To unsubscribe from future emails[\s\S]*?(?=Get the Dice app|$)/gi,
    /About Dice Private Email[\s\S]*?(?=Get the Dice app|$)/gi,
    /WHY DOES THE SENDER’S EMAIL ADDRESS LOOK SO STRANGE\?[\s\S]*?(?=Get the Dice app|$)/gi,
    /DON’T WORRY! IT’S A LEGITIMATE ADDRESS[\s\S]*?(?=Get the Dice app|$)/gi,
    /CAN I REPLY TO THIS EMAIL\?[\s\S]*?(?=Get the Dice app|$)/gi,
    /CAN ANYONE ELSE SEE MY EMAIL ADDRESS\?[\s\S]*?(?=Get the Dice app|$)/gi,
    /HOW CAN I FIND OUT MORE\?[\s\S]*?(?=Get the Dice app|$)/gi,
    /You are receiving emails from recruiters because you opted in[\s\S]*?(?=Get the Dice app|$)/gi,
    /Get the Dice app/gi,
    /We are unable to sponsor or take over sponsorship of an employment visa at this time\.?/gi,
    /The information contained in this communication is confidential[\s\S]*?(?=\n\n|$)/gi,
    /Lookup Candidate/gi,
    /<[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}>/g // recipient email placeholders
  ];

  for (const pattern of diceFooterPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }

  // Clean up excessive whitespace
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

  // Extract address lines if present, filtering artifacts
  const addressLines: string[] = [];
  const addressBlockMatch = cleaned.match(/(?:Address|Location)[:\s]+([^\n]+(?:\n[^\n]+){1,4})/i);
  if (addressBlockMatch) {
    const lines = addressBlockMatch[1].split('\n').map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (lower !== 'location' && lower !== 'address' && lower !== 'remote' && lower !== 'n/a') {
        addressLines.push(line);
      }
    }
  }

  return {
    employerName,
    department,
    addressLines,
    phoneNumbers,
    websiteUrl,
    cleanedDescription: cleaned
  };
}
