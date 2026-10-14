import { IngestedJobData } from '../types';

export function localNlpParse(text: string, url?: string): IngestedJobData {
  const normalizedText = text || '';
  const lines = normalizedText.split('\n').map(l => l.trim()).filter(Boolean);

  // 1. Title Extraction
  let title = 'Position Title';
  const commonTitleKeywords = [
    'engineer', 'developer', 'manager', 'designer', 'analyst', 'lead', 'architect', 
    'expert', 'strategist', 'writer', 'consultant', 'accountant', 'director', 
    'specialist', 'recruiter', 'officer', 'representative', 'consultant', 'coordinator'
  ];
  
  for (const line of lines.slice(0, 8)) {
    const lowerLine = line.toLowerCase();
    if (line.length > 5 && line.length < 80 && commonTitleKeywords.some(kw => lowerLine.includes(kw))) {
      title = line.replace(/^[•\-\*\s\d\.\#\/]+/, '').trim();
      break;
    }
  }
  if (title === 'Position Title' && lines.length > 0 && lines[0].length < 75) {
    title = lines[0].replace(/^[•\-\*\s\d\.\#\/]+/, '').trim();
  }

  // 2. Company Name Extraction
  let companyName = 'Inferred Employer';
  if (url) {
    try {
      const parsedUrl = new URL(url);
      const host = parsedUrl.hostname.replace('www.', '');
      const parts = host.split('.');
      if (parts.length > 1) {
        companyName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
      }
    } catch {
      // ignore
    }
  }
  const companyRegex = /(?:about|at|join)\s+([A-Z][A-Za-z0-9\s]{2,25})\b/i;
  const matchCompany = normalizedText.match(companyRegex);
  if (matchCompany && matchCompany[1]) {
    const cleanedCompany = matchCompany[1].trim();
    if (!['the', 'our', 'this', 'we', 'you', 'role', 'team', 'company', 'position'].includes(cleanedCompany.toLowerCase())) {
      companyName = cleanedCompany;
    }
  }

  // 3. Location Extraction
  let location = 'United States (Remote)';
  const locationRegex = /(?:location|office|based in):\s*([^\n,]{2,40}(?:,\s*[A-Z]{2})?)/i;
  const matchLocation = normalizedText.match(locationRegex);
  if (matchLocation && matchLocation[1]) {
    location = matchLocation[1].trim();
  } else {
    const stateZipRegex = /\b([A-Z][a-zA-Z\s]{1,20}),\s*([A-Z]{2})\b/;
    const stateMatch = normalizedText.match(stateZipRegex);
    if (stateMatch) {
      location = `${stateMatch[1]}, ${stateMatch[2]}`;
    }
  }

  // 4. Workplace Type
  let workplaceType: 'Remote' | 'Hybrid' | 'On-Site' = 'Remote';
  const lowerText = normalizedText.toLowerCase();
  if (lowerText.includes('hybrid')) {
    workplaceType = 'Hybrid';
  } else if (lowerText.includes('on-site') || lowerText.includes('onsite') || lowerText.includes('in office') || lowerText.includes('in-office') || lowerText.includes('at our headquarters')) {
    workplaceType = 'On-Site';
  } else if (lowerText.includes('remote') || lowerText.includes('telecommute') || lowerText.includes('work from home') || lowerText.includes('anywhere')) {
    workplaceType = 'Remote';
  }

  // 5. Salary Range Extraction
  let salaryMin = 90000;
  let salaryMax = 140000;
  const salaryRangeRegex = /(?:\$|USD)\s*([0-9]{2,3}),?([0-9]{3})?\s*(?:-|to)\s*(?:\$|USD)?\s*([0-9]{2,3}),?([0-9]{3})?/i;
  const kRangeRegex = /\$?([0-9]{2,3})\s*[kK]\s*(?:-|to)\s*\$?([0-9]{2,3})\s*[kK]/;
  
  const matchRange = normalizedText.match(salaryRangeRegex);
  const matchKRange = normalizedText.match(kRangeRegex);

  if (matchRange) {
    const minVal = parseInt(matchRange[1].replace(/,/g, ''));
    const maxVal = parseInt(matchRange[3].replace(/,/g, ''));
    salaryMin = minVal < 1000 ? minVal * 1000 : minVal;
    salaryMax = maxVal < 1000 ? maxVal * 1000 : maxVal;
  } else if (matchKRange) {
    salaryMin = parseInt(matchKRange[1]) * 1000;
    salaryMax = parseInt(matchKRange[2]) * 1000;
  }

  // 6. Skills Dictionary Matching
  const skillsDict = [
    'React', 'TypeScript', 'JavaScript', 'Python', 'Go', 'Rust', 'Java', 'C++', 'Node.js', 'Express',
    'SQL', 'PostgreSQL', 'MongoDB', 'AWS', 'Docker', 'Kubernetes', 'Figma', 'UI/UX', 'Product Management',
    'Agile', 'Scrum', 'GraphQL', 'Next.js', 'Tailwind', 'Git', 'CI/CD', 'Machine Learning', 'AI', 'TensorFlow',
    'PyTorch', 'Data Analysis', 'Excel', 'Project Management', 'Communication', 'Problem Solving', 'Leadership',
    'Strategic Planning', 'DevOps', 'Cloud Computing', 'Firebase', 'Analytics', 'CSS', 'HTML', 'Vue', 'Angular',
    'Sass', 'Webpack', 'Vite', 'Redux', 'Drizzle', 'Prisma', 'Linux', 'Bash'
  ];

  const matchedSkills: string[] = [];
  for (const skill of skillsDict) {
    const regex = new RegExp(`\\b${skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
    if (regex.test(normalizedText)) {
      matchedSkills.push(skill);
    }
  }

  const requiredSkills = matchedSkills.slice(0, Math.min(5, matchedSkills.length));
  const preferredSkills = matchedSkills.slice(Math.min(5, matchedSkills.length), Math.min(8, matchedSkills.length));

  if (requiredSkills.length === 0) {
    requiredSkills.push('Communication', 'Problem Solving');
    preferredSkills.push('Collaboration');
  }

  // 7. Benefits Dictionary Matching
  const benefitsDict = [
    { kw: '401', name: '401(k) Retirement Match' },
    { kw: 'health', name: 'Comprehensive Health Insurance' },
    { kw: 'medical', name: 'Comprehensive Health Insurance' },
    { kw: 'dental', name: 'Dental & Vision Coverage' },
    { kw: 'vision', name: 'Dental & Vision Coverage' },
    { kw: 'pto', name: 'Flexible Paid Time Off (PTO)' },
    { kw: 'vacation', name: 'Flexible Paid Time Off (PTO)' },
    { kw: 'equity', name: 'Equity & Stock Options' },
    { kw: 'stock', name: 'Equity & Stock Options' },
    { kw: 'bonus', name: 'Performance Bonuses' },
    { kw: 'wellness', name: 'Wellness & Gym Reimbursements' },
    { kw: 'stipend', name: 'Professional Development Stipend' }
  ];

  const matchedBenefits = new Set<string>();
  for (const b of benefitsDict) {
    if (lowerText.includes(b.kw)) {
      matchedBenefits.add(b.name);
    }
  }
  const benefits = Array.from(matchedBenefits);
  if (benefits.length === 0) {
    benefits.push('Health Insurance', 'Paid Time Off (PTO)');
  }

  return {
    title,
    companyName,
    description: normalizedText,
    requirements: normalizedText,
    location,
    workplaceType,
    salaryMin,
    salaryMax,
    requiredSkills,
    preferredSkills,
    benefits,
    extractedId: Math.random().toString(36).substring(7),
    isAiEnhanced: false,
    companyOverview: null,
    eeoStatement: null,
    clearanceOrExportControl: null,
    minimumQualifications: null,
    preferredQualifications: null,
    insights: {
      interviewQuestions: [],
      unstatedExpectations: [],
      matchStrategy: ''
    }
  };
}
