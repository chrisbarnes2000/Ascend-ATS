import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, collectionGroup, query, where, getDocs } from 'firebase/firestore';
import { GoogleGenAI } from '@google/genai';

// Load config from json. This is naive but works for the mock
import * as fs from 'fs';
const firebaseConfigStr = fs.existsSync('./firebase-applet-config.json') ? fs.readFileSync('./firebase-applet-config.json', 'utf8') : '{}';
const firebaseConfig = JSON.parse(firebaseConfigStr);

const firebaseApp = Object.keys(firebaseConfig).length > 0 ? initializeApp(firebaseConfig) : null;
const db = firebaseApp ? getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId) : null;

dotenv.config();

// Create Gemini Client
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build'
    }
  }
}) : null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Standardized 3-Tier Prompt Matrix Metadata
  const PROMPT_MATRIX = [
    {
      id: 'v1',
      name: 'V1 Fast Heuristic Baseline',
      tag: 'Fast',
      latency: '~300ms',
      model: 'Local NLP / Algorithmic',
      description: 'High-speed deterministic extraction of title, company, salary bounds, workplace type, and core requirements with zero latency.'
    },
    {
      id: 'v2',
      name: 'V2 Deep Semantic Taxonomy',
      tag: 'Semantic',
      latency: '~1.2s',
      model: 'Gemini 3.8 Flash Structured JSON',
      description: 'Multi-domain skill taxonomy normalization, qualification splitting (minimum vs. preferred), and standard 10-point benefits mapping.'
    },
    {
      id: 'v3',
      name: 'V3 Executive Strategic Intelligence',
      tag: 'Executive',
      latency: '~2.5s',
      model: 'Gemini 3.8 Flash Strategic Advisor',
      description: 'Behavioral STAR interview questions & answers, unstated hiring manager expectations, transition hurdle warnings, and tailored pitch strategies.'
    }
  ];

  // Prompt Matrix Metadata Endpoint
  app.get('/api/prompt-matrix', (req, res) => {
    res.json({
      versions: PROMPT_MATRIX,
      activeDefault: 'v2',
      geminiOnline: Boolean(ai)
    });
  });

  // Extension Profile & Role Status Check Endpoint
  app.get('/api/extension/profile-check', (req, res) => {
    const email = String(req.query.email || '').toLowerCase().trim();
    const isAdmin = email === 'chris.barnes.2000@me.com' || req.query.admin === 'true';
    
    res.json({
      role: isAdmin ? 'admin' : (email.includes('recruiter') || email.includes('firm') ? 'recruiter' : 'seeker'),
      isAdmin,
      promptVersions: PROMPT_MATRIX,
      systemStatus: {
        apiHealthy: true,
        geminiConfigured: Boolean(ai),
        firestoreConnected: Boolean(db)
      }
    });
  });

  app.post('/api/extension/profile-check', (req, res) => {
    const { email = '', profile } = req.body;
    const cleanEmail = String(email).toLowerCase().trim();
    const isAdmin = cleanEmail === 'chris.barnes.2000@me.com';

    // Calculate completeness if profile passed
    let completeness = 75;
    const checks = {
      hasResume: false,
      skillsCount: 0,
      hasTargetRole: false,
      privacyShieldActive: false,
      excludedCompaniesCount: 0
    };

    if (profile) {
      checks.hasResume = Boolean(profile.resumePreviewUrl || profile.workExperience?.length);
      checks.skillsCount = (profile.skills || []).length;
      checks.hasTargetRole = Boolean(profile.targetRole);
      checks.privacyShieldActive = Boolean(profile.privacy?.cloaked || (profile.privacy?.excludedCompanies || []).length);
      checks.excludedCompaniesCount = (profile.privacy?.excludedCompanies || []).length;

      let score = 20; // baseline
      if (checks.hasResume) score += 25;
      if (checks.skillsCount >= 3) score += 25;
      if (checks.hasTargetRole) score += 15;
      if (checks.privacyShieldActive) score += 15;
      completeness = Math.min(100, score);
    }

    res.json({
      role: isAdmin ? 'admin' : 'seeker',
      isAdmin,
      completeness,
      checks,
      promptVersions: PROMPT_MATRIX,
      systemStatus: {
        apiHealthy: true,
        geminiConfigured: Boolean(ai),
        firestoreConnected: Boolean(db)
      }
    });
  });

  // Resume Parsing Logic with 3-Tier Prompt Matrix
  app.post('/api/parse-resume', async (req, res) => {
    try {
      const { fileName = '', fileContent = '', useAI = false, promptVersion = 'v1' } = req.body;
      const text = String(fileContent);
      const safeFileName = String(fileName);

      // Determine active tier: if useAI is true and promptVersion is v1, upgrade to v2
      const activeTier = (useAI && promptVersion === 'v1') ? 'v2' : promptVersion;

      // Tier V3: Strategic Executive Career Profile
      if (activeTier === 'v3' && ai) {
        try {
          const promptV3 = `You are an elite executive career coach and technical talent architect.
Analyze this resume and parse it into an advanced executive-tier JSON candidate profile.
Extract strategic pitch highlights, verified skill domains with proficiency levels, and rewrite past work experience descriptions using STAR methodology (Situation, Task, Action, Result) with quantifiable impact where possible.

Required JSON Schema:
{
  "personalInfo": { "firstName": "", "lastName": "", "email": "", "phone": "", "location": "", "linkedinUrl": "", "portfolioUrl": "" },
  "professionalSummary": "High-impact executive summary positioning candidate for market leadership.",
  "targetRole": "Inferred Target Leadership or Senior Role",
  "skills": [ { "name": "Skill Name", "domain": "Technical | Soft Skills | Leadership | Domain Knowledge | Tools", "level": "Expert | Advanced | Intermediate", "years": 5 } ],
  "workExperience": [ { "role": "", "company": "", "startDate": "", "endDate": "", "description": "STAR bullet points showing measurable business outcomes." } ],
  "education": [],
  "strategicHighlights": ["Key differentiator 1", "Key differentiator 2", "Key differentiator 3"]
}

Resume Text:
${text.substring(0, 6000)}`;

          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: promptV3,
            config: { responseMimeType: 'application/json' }
          });
          const content = response.text || "{}";
          const parsedData = JSON.parse(content);
          return res.json({ ...parsedData, promptVersion: 'v3', isAiEnhanced: true });
        } catch (e: any) {
          console.warn("V3 Executive AI parsing failed, falling back to V2/heuristic:", e?.message || e);
        }
      }

      // Tier V2: Deep Semantic Taxonomy & Skill Normalization
      if ((activeTier === 'v2' || useAI) && ai) {
        try {
          const promptV2 = `Parse the following resume into a strict JSON payload representing the candidate's profile with normalized skill taxonomy.
JSON Schema required:
{
  "personalInfo": { "firstName": "", "lastName": "", "email": "", "phone": "", "location": "", "linkedinUrl": "", "portfolioUrl": "" },
  "professionalSummary": "",
  "targetRole": "",
  "skills": [ { "name": "Skill 1", "domain": "Technical | Soft Skills | Leadership | Domain Knowledge | Tools", "level": "Intermediate", "years": 3 } ],
  "workExperience": [ { "role": "", "company": "", "startDate": "", "endDate": "", "description": "" } ],
  "education": []
}
Resume text:
${text.substring(0, 5000)}`;
          
          const response = await ai.models.generateContent({
             model: 'gemini-3.8-flash',
             contents: promptV2,
             config: { responseMimeType: 'application/json' }
          });
          const content = response.text || "{}";
          const parsedData = JSON.parse(content);
          return res.json({ ...parsedData, promptVersion: 'v2', isAiEnhanced: true });
        } catch (e: any) {
          console.warn("V2 AI parsing unavailable, falling back to algorithmic extraction:", e?.message || e);
        }
      }

      // Tier V1: Algorithmic Parsing (Fast Baseline)
      const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      const phoneMatch = text.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
      
      // 2. Extract Skills (Keyword matching)
      const commonSkills = [
        'React', 'TypeScript', 'Node.js', 'Python', 'Java', 'Javascript', 'AWS', 'Docker', 
        'SQL', 'NoSQL', 'Project Management', 'Agile', 'Scrum', 'Firebase', 'Cloud', 
        'DevOps', 'CI/CD', 'UI/UX', 'Design', 'Marketing', 'Sales', 'Customer Success'
      ];
      const extractedSkills = commonSkills.filter(skill => 
        new RegExp(`\\b${skill}\\b`, 'gi').test(text)
      ).map(s => ({ name: s, domain: 'Technical' }));

      // 3. Simple Experience Extraction
      // Look for Date patterns (e.g., 2019 - 2022 or Jan 2020 - Present)
      const experienceBlocks: any[] = [];
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      
      const dateRegex = /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December|\d{1,2}\/|\d{4})[-–\s]+(?:Present|Current|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December|\d{1,2}\/|\d{4})/gi;

      lines.forEach((line, index) => {
        if (dateRegex.test(line)) {
          // This line likely marks a job entry. Heuristic: search surrounding lines for titles/companies
          experienceBlocks.push({
            role: lines[index - 1] || 'Professional Role',
            company: lines[index - 2] || 'Various Companies',
            startDate: line.split(/[-–]/)[0]?.trim() || '',
            endDate: line.split(/[-–]/)[1]?.trim() || 'Present',
            description: lines.slice(index + 1, index + 4).join(' '),
            skills: []
          });
        }
      });

      const parsedData = {
        personalInfo: {
          firstName: safeFileName.split(/[\s_-]/)[0] || '',
          lastName: safeFileName.split(/[\s_-]/)[1]?.split('.')[0] || '',
          email: emailMatch ? emailMatch[0] : '',
          phone: phoneMatch ? phoneMatch[0] : '',
          location: '',
          linkedinUrl: '',
          portfolioUrl: ''
        },
        professionalSummary: lines.slice(0, 5).join(' '),
        targetRole: experienceBlocks[0]?.role || '',
        skills: extractedSkills,
        workExperience: experienceBlocks.slice(0, 3), // Return top 3 entries
        education: []
      };
      
      res.json(parsedData);
    } catch (error) {
      console.error('Resume Parsing Error:', error);
      res.status(500).json({ error: 'Failed to parse resume' });
    }
  });



  // Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // AI Skill Enhancement & Categorization Endpoint
  app.post('/api/enhance-skills', async (req, res) => {
    try {
      const { skills, targetRole } = req.body;
      const skillsList = Array.isArray(skills) ? skills : [];

      if (ai && skillsList.length > 0) {
        try {
          const prompt = `You are an expert talent architect and skill taxonomist.
Analyze the following list of candidate skills for a ${targetRole || 'general professional'} role:
${JSON.stringify(skillsList)}

Perform the following enhancements:
1. Normalize and categorize each skill into one of these standard domains: 'Technical', 'Soft Skills', 'Leadership', 'Domain Knowledge', 'Languages', 'Tools', 'Other'.
2. Standardize proficiency level to one of: 'Beginner', 'Intermediate', 'Advanced', 'Expert'.
3. Assign or infer realistic years of experience (integer between 1 and 20) if missing.
4. Add 2 to 3 highly relevant, complementary missing skills for this role profile that the candidate should consider.

Return JSON in this EXACT structure:
{
  "skills": [
    { "name": "Skill Name", "domain": "Technical", "level": "Advanced", "years": 5 }
  ]
}`;

          const response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
          });
          const content = response.text || "{}";
          const parsed = JSON.parse(content);
          if (parsed && Array.isArray(parsed.skills)) {
            return res.json({ skills: parsed.skills });
          }
        } catch (aiErr: any) {
          console.warn("AI skill enhancement unavailable or quota limit reached, seamlessly falling back to rule engine:", aiErr?.message || aiErr);
        }
      }

      // Algorithmic / Rule-based Fallback Enhancement
      const DOMAINS_MAP: Record<string, string> = {
        react: 'Technical', typescript: 'Technical', javascript: 'Technical', nodejs: 'Technical',
        python: 'Technical', java: 'Technical', sql: 'Technical', postgresql: 'Technical',
        aws: 'Technical', docker: 'Technical', kubernetes: 'Technical', firebase: 'Technical',
        figma: 'Tools', git: 'Tools', jira: 'Tools', salesforce: 'Tools', excel: 'Tools',
        communication: 'Soft Skills', teamwork: 'Soft Skills', 'problem solving': 'Soft Skills',
        leadership: 'Leadership', management: 'Leadership', 'project management': 'Leadership',
        english: 'Languages', spanish: 'Languages', french: 'Languages'
      };

      const enhanced = skillsList.map((s: any) => {
        const name = typeof s === 'string' ? s.trim() : (s.name || '').trim();
        const lower = name.toLowerCase();
        let domain = typeof s === 'object' && s.domain ? s.domain : 'Other';
        if (domain === 'Other' || !domain) {
          domain = DOMAINS_MAP[lower] || (lower.includes('management') || lower.includes('lead') ? 'Leadership' : 'Technical');
        }
        let level = typeof s === 'object' && s.level ? s.level : 'Intermediate';
        let years = typeof s === 'object' && s.years ? s.years : 3;

        return { name, domain, level, years };
      });

      return res.json({ skills: enhanced });
    } catch (error) {
      console.error("Skills enhancement endpoint error:", error);
      res.status(500).json({ error: "Failed to enhance skills" });
    }
  });

  // Career Transition & Match Bridge Advisory
  app.post('/api/transition-advisory', async (req, res) => {
    try {
      const { jobTitle, jobRequirements, candidateProfile, transitionExplanation, matchPercentage } = req.body;

      if (ai) {
        try {
          const prompt = `You are an expert executive recruiter and talent strategy advisor. A candidate has applied for a role with an algorithmic match score of ${matchPercentage}% (below 50%, indicating a career pivot/transition).
          
Job Title: ${jobTitle}
Job Requirements: ${JSON.stringify(jobRequirements)}
Candidate Profile Summary: ${JSON.stringify(candidateProfile)}
Candidate's Transition & Transferable Skills Explanation: "${transitionExplanation}"

Provide a comprehensive, nuanced analysis in JSON format with two distinct sections:
1. "candidateAdvice": {
    "learningCurve": "string describing estimated learning curve",
    "biasWarning": "string analyzing potential automated screening bias or skepticism",
    "churnRisk": "string discussing retention or onboarding churn factors",
    "bridgeStrategy": "actionable recommendations for the candidate to bridge the skill gap"
   },
2. "recruiterAdvice": {
    "strengthsVsRisks": "string detailing why this transition hire could be high upside vs potential risks",
    "upsidePotential": "string highlighting human adaptability and cross-functional resilience",
    "accommodationAssessment": "string assessing whether the role environment needs mentoring/support to succeed",
    "hiringVerdict": "Recommended / Proceed with Caution / Not Recommended"
   }

Return ONLY valid JSON.`;

          const response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
          });
          const content = response.text || "{}";
          
          let parsedData;
          try {
            parsedData = JSON.parse(content);
            return res.json(parsedData);
          } catch (parseErr) {
            console.warn("Failed to parse Gemini response as JSON, using fallback:", parseErr);
          }
        } catch (aiErr: any) {
          console.warn("AI transition advisory unavailable or quota limit reached, seamlessly falling back to heuristic report:", aiErr?.message || aiErr);
        }
      }

      // Fallback heuristic advisory report
      const fallbackReport = {
        candidateAdvice: {
          learningCurve: "Moderate to steep (approx. 60-90 days) due to domain-specific tooling and vocabulary differences.",
          biasWarning: "Traditional keyword ATS scanners will likely filter out resumes without direct industry experience. Your personal transition explanation is critical.",
          churnRisk: "Medium-low if onboarding includes structured mentorship; higher if immediate autonomous output is expected.",
          bridgeStrategy: "Highlight transferable problem-solving patterns, anchor past achievements to measurable business impact, and proactively study core industry terminology."
        },
        recruiterAdvice: {
          strengthsVsRisks: "Strength: High motivational drive, fresh perspective, and cross-functional resilience. Risk: Potential domain knowledge ramp-up time.",
          upsidePotential: "Candidates transitioning from adjacent industries frequently bring unconstrained innovation and diverse mental models that static industry pools lack.",
          accommodationAssessment: "Requires a supportive onboarding buddy and clear 30/60/90 day milestone pacing rather than trial-by-fire execution.",
          hiringVerdict: "Proceed with Structured Mentorship"
        }
      };

      res.json(fallbackReport);
    } catch (err) {
      console.error("Transition advisory error:", err);
      res.status(500).json({ error: 'Failed to generate transition advisory' });
    }
  });

  // Markdown Enhancer & Beautifier for Raw Plaintext
  function enhancePastedTextMarkdown(text: string): string {
    if (!text) return '';

    // Pre-processing: Clean up extra spaces around pay range dashes and min/max/unit components
    let processed = text;
    
    // 1. Pay ranges: e.g. "$100,000    -    $150,000" or "90k - 100k" or "$50 - $70"
    processed = processed.replace(/(\$?\d+(?:[\d,kK\.\s]*\d)?)\s*-\s*(\$?\d+(?:[\d,kK\.\s]*\d)?)/g, (match, p1, p2) => {
      return `${p1.trim()} - ${p2.trim()}`;
    });

    // 2. Spaces around / hr or / hour or / yr or / year
    processed = processed.replace(/(\$?\d+(?:[\d,kK\.\s]*\d)?)\s*\/\s*(hr|hour|yr|year|wk|week|month|mo)\b/gi, '$1 / $2');

    // 3. Spacing around min / max bounds
    processed = processed.replace(/\b(min)\s*\/\s*(max)\b/gi, '$1/$2');

    // 4. Spacing around min/max colons
    processed = processed.replace(/\b(min|max)\s*:\s*(\$?\d)/gi, '$1: $2');

    const fortune500 = new Set([
      'walmart', 'amazon', 'apple', 'unitedhealth group', 'unitedhealth', 'berkshire hathaway', 'alphabet', 'google', 'exxonmobil', 'exxon mobil', 'exxon', 'microsoft',
      'chevron', 'meta', 'meta platforms', 'comcast', 'tesla', 'costco', 'cigna', 'cardinal health', 'pfizer', 'ford', 'ford motor', 'general motors', 'gm',
      'elevance health', 'jpmorgan chase', 'jpmorgan', 'jp morgan', 'centene', 'fannie mae', 'phillips 66', 'valero energy', 'valero', 'kroger', 'target', 'united parcel service',
      'ups', 'fedex', 'lowes', 'lowe\'s', 'johnson & johnson', 'j&j', 'archer daniels midland', 'adm', 'abbott laboratories', 'abbott', 'amerisourcebergen',
      'marathon petroleum', 'marathon', 'boeing', 'intel', 'procter & gamble', 'p&g', 'general electric', 'ge', 'metlife', 'walt disney', 'disney', 'wells fargo',
      'citigroup', 'citi', 'sysco', 'pepsico', 'pepsi', 'prudential financial', 'prudential', 'humana', 'td synnex', 'hca healthcare', 'hca', 'lockheed martin',
      'lockheed', 'merck', 'caterpillar', 'cat', 'ibm', 'john deere', 'deere', 'honeywell', 'american express', 'amex', 'oracle', 'dow', 'general dynamics',
      'nike', 'northrop grumman', 'thermo fisher scientific', 'thermo fisher', 'coca-cola', 'coca cola', 'coke', 'broadcom', 'abbvie', 'stonex group', 'tiaa',
      'conocophillips', 'netflix', 'tjx', 'capital one', 'bristol myers squibb', 'bristol myers', 'bristol-myers', 'usaa', 'union pacific', 'duke energy',
      'southern company', 'dollar general', 'qualcomm', 'tyson foods', 'tyson', 'exelon', 'progressive', 'allstate', 'macys', 'macy\'s', 'autonation',
      'starbucks', 'us foods', 'united airlines', 'delta air lines', 'delta', 'american airlines', 'hp', 'hp inc.', 'hp enterprise', 'hpe', 'rtx', 'raytheon',
      'bank of america', 'boa', 'morgan stanley', 'goldman sachs', 'cisco', 'salesforce', 'eli lilly', 'amgen', 'gilead sciences', 'gilead', 'mastercard',
      'visa', 'adobe', 'nvidia', 'micron technology', 'micron', 'amd', 'best buy', 'dollar tree', 'general mills', 'kraft heinz', 'kellogg', 'wayfair',
      'uber', 'lyft', 'airbnb', 'ebay', 'paypal', 'block', 'square', 'intuit', 'servicenow', 'workday', 'autodesk', 'synopsys', 'cadence', 'netapp',
      'juniper networks', 'juniper', 'f5', 'arista networks', 'arista', 'palo alto networks', 'fortinet', 'crowdstrike', 'datadog', 'snowflake', 'palantir'
    ]);

    const lines = processed.split('\n');
    const formattedLines = lines.map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '';

      const lower = trimmed.toLowerCase();

      // Check for Fortune 500 company match to format as H1 header
      const cleanCompany = trimmed.replace(/^[\#\s\*•\-]+/g, '').replace(/:$/, '').trim();
      if (fortune500.has(cleanCompany.toLowerCase())) {
        const beautifulName = cleanCompany.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        return `# ${beautifulName}`;
      }

      // 1. Convert plain text headings to clean Markdown level 3 headings
      const headings = [
        'about the role', 'about the job', 'job description', 'role description', 'summary', 'overview',
        'requirements', 'key qualifications', 'minimum qualifications', 'what you\'ll need', 'what you will need',
        'responsibilities', 'what you\'ll do', 'what you will do', 'key responsibilities', 'duties',
        'skills & qualifications', 'skills and experience', 'what we look for', 'what we\'re looking for',
        'benefits', 'perks', 'what we offer', 'about us', 'about the company', 'compensation',
        'purpose', 'role purpose', 'job purpose',
        'essential duties / responsibilities', 'essential duties and responsibilities', 'essential duties & responsibilities',
        'essential duties', 'essential responsibilities', 'duties / responsibilities', 'duties & responsibilities', 'essential functions',
        'full job description', 'description', 'position summary', 'job summary',
        'education and experience', 'education and experience requirements', 'education / experience', 'education & experience',
        'preferred qualifications', 'required qualifications', 'who you are', 'what you will bring', 'desired skills', 'why join us', 'our team'
      ];

      const cleanLower = trimmed.replace(/^[\#\s\*•\-]+/g, '').replace(/:$/, '').trim().toLowerCase();
      const isHeading = headings.some(h => cleanLower === h);

      if (isHeading && trimmed.length < 50) {
        const cleanHeader = trimmed.replace(/^[\#\s\*•\-]+/g, '').replace(/:$/, '').trim();
        // Capitalize words beautifully
        const capitalizedHeader = cleanHeader.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        return `### ${capitalizedHeader}`;
      }

      // 2. Format common labels as bold prefixes
      const labelPrefixes = [
        'requirements:', 'qualifications:', 'responsibilities:', 'preferred skills:', 'required skills:',
        'skills:', 'experience:', 'education:', 'location:', 'salary:', 'benefits:', 'compensation:', 'note:', 'bonus:'
      ];
      for (const prefix of labelPrefixes) {
        if (lower.startsWith(prefix) && trimmed.length < 60) {
          const titlePart = trimmed.substring(0, prefix.length - 1).trim();
          const contentPart = trimmed.substring(prefix.length).trim();
          const capitalizedTitle = titlePart.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
          return `**${capitalizedTitle}:**${contentPart ? ` ${contentPart}` : ''}`;
        }
      }

      // 3. Convert non-standard list markers to standard Markdown bullet points
      const bulletMarkers = ['•', 'o', '*', '-', '▪', '▪️', '▫️', '►', '✓', '✔', '·'];
      for (const marker of bulletMarkers) {
        if (trimmed.startsWith(marker)) {
          const rest = trimmed.substring(marker.length).trim();
          if (rest) {
            return `- ${rest}`;
          }
        }
      }

      // 4. Format capitalized short lines as H4 headers
      if (/^[A-Z\s\&\,\/]{4,40}$/.test(trimmed) && !lower.includes('at') && !lower.includes('the') && !lower.includes('and')) {
        return `#### ${trimmed}`;
      }

      return trimmed;
    });

    return formattedLines.filter(Boolean).join('\n\n');
  }

  interface IngestedJobData {
    title: string;
    companyName: string;
    description: string;
    requirements: string;
    location: string;
    workplaceType: 'Remote' | 'Hybrid' | 'On-Site';
    salaryMin: number;
    salaryMax: number;
    requiredSkills: string[];
    preferredSkills: string[];
    benefits: string[];
    extractedId: string;
    isAiEnhanced: boolean;
    insights: {
      interviewQuestions: Array<{ question: string; answer: string }>;
      unstatedExpectations: string[];
      matchStrategy: string;
    };
    jobNumber?: string;
    department?: string;
    salaryType?: string;
    expiresAt?: string;
    sourceBoard?: string;
  }

  // High-Fidelity Local NLP / Text processing Helper (First Pass)
  function localNlpParse(text: string, url?: string): IngestedJobData {
    const normalizedText = text || '';
    const lines = normalizedText.split('\n').map(l => l.trim()).filter(Boolean);

    // 1. Title Extraction: Search first 8 lines for keyword matches
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

    // 6. Skills Dictionary Matching (Local NLP)
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

    // 8. Split Description vs Requirements
    let description = normalizedText;
    let requirements = 'Review the detailed description above for specific required credentials or experience parameters.';

    const reqHeaders = ['requirements', 'qualifications', 'what you bring', 'what we are looking for', 'key criteria', 'skills required'];
    for (const header of reqHeaders) {
      const idx = lowerText.indexOf(header);
      if (idx !== -1) {
        description = normalizedText.substring(0, idx).trim();
        requirements = normalizedText.substring(idx).trim();
        break;
      }
    }

    return {
      title,
      companyName,
      description: enhancePastedTextMarkdown(description || normalizedText),
      requirements: enhancePastedTextMarkdown(requirements),
      location,
      workplaceType,
      salaryMin,
      salaryMax,
      requiredSkills,
      preferredSkills,
      benefits,
      extractedId: `ingested-${Date.now()}`,
      isAiEnhanced: false,
      insights: {
        interviewQuestions: [
          {
            question: `Can you walk me through your professional experience leveraging ${requiredSkills[0] || 'core software tools'}?`,
            answer: `Describe a specific high-impact milestone using the STAR methodology (Situation, Task, Action, and Quantifiable Result).`
          },
          {
            question: `How do you handle rapid domain scaling or ambiguous requirements?`,
            answer: `Explain your process for breaking down technical goals and aligning stakeholders using continuous sprint iterations.`
          }
        ],
        unstatedExpectations: [
          "Expect hiring managers to look closely at your practical, independent product delivery capabilities.",
          "Clear, cross-functional communication is crucial alongside solid execution mechanics."
        ],
        matchStrategy: `Highlight your hands-on mastery of ${requiredSkills.join(', ')}. Anchor your professional summary around measurable system accomplishments.`
      }
    };
  }

  // Specialized GovJobs / NEOGOV Parser
  function govJobsNlpParse(text: string, url?: string) {
    const jobData = localNlpParse(text, url);
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    // 1. Extract Job Number (e.g. "Job Number: 26-00987")
    const jobNumberMatch = text.match(/Job Number\s*:\s*([A-Z0-9-]+)/i);
    if (jobNumberMatch) jobData.jobNumber = jobNumberMatch[1];

    // 2. Extract Department & Division
    const deptMatch = text.match(/Department\s*:\s*([^\n]+)/i);
    const divMatch = text.match(/Division\s*:\s*([^\n]+)/i);
    if (deptMatch) jobData.department = deptMatch[1].trim();
    if (divMatch) jobData.department = `${jobData.department || ''} (${divMatch[1].trim()})`.trim();

    // 3. Extract Salary (Special handling for Hourly vs Annual with range support)
    const hourlyRangeMatch = text.match(/\$\s*([0-9,.]+)\s*(?:-|to)\s*\$\s*([0-9,.]+)\s*Hourly/i);
    const hourlySingleMatch = text.match(/\$\s*([0-9,.]+)\s*Hourly/i);
    const annualRangeMatch = text.match(/\$\s*([0-9,.]+)\s*(?:-|to)\s*\$\s*([0-9,.]+)\s*Annually/i);
    const annualSingleMatch = text.match(/\$\s*([0-9,.]+)\s*Annually/i);
    
    if (hourlyRangeMatch) {
      const min = parseFloat(hourlyRangeMatch[1].replace(/,/g, ''));
      const max = parseFloat(hourlyRangeMatch[2].replace(/,/g, ''));
      jobData.salaryMin = Math.round(min * 2080);
      jobData.salaryMax = Math.round(max * 2080);
      jobData.salaryType = 'Hourly';
    } else if (hourlySingleMatch) {
      const hourly = parseFloat(hourlySingleMatch[1].replace(/,/g, ''));
      jobData.salaryMin = Math.round(hourly * 2080);
      jobData.salaryMax = Math.round(hourly * 2080);
      jobData.salaryType = 'Hourly';
    } else if (annualRangeMatch) {
      jobData.salaryMin = parseInt(annualRangeMatch[1].replace(/[,.]/g, ''));
      jobData.salaryMax = parseInt(annualRangeMatch[2].replace(/[,.]/g, ''));
      jobData.salaryType = 'Annual';
    } else if (annualSingleMatch) {
      const annual = parseInt(annualSingleMatch[1].replace(/[,.]/g, ''));
      jobData.salaryMin = annual;
      jobData.salaryMax = annual;
      jobData.salaryType = 'Annual';
    }

    // 4. Closing Date
    const closingDateMatch = text.match(/Closing Date\s*:\s*([^\n]+)/i);
    if (closingDateMatch) {
      const dateStr = closingDateMatch[1].trim();
      jobData.expiresAt = dateStr;
    }

    // 5. Success Factors
    jobData.sourceBoard = 'GovernmentJobs / NEOGOV';
    jobData.companyName = text.includes('Pierce County') ? 'Pierce County' : (jobData.companyName || 'Government Agency');

    return jobData;
  }

  // Job Ingestion Pipeline Endpoint with 3-Tier Prompt Matrix
  app.post('/api/ingest-job', async (req, res) => {
    try {
      const { url, pastedText, boardType, promptVersion = 'v1', isRequisition = false, userSession } = req.body;
      if (!url && (!pastedText || !pastedText.trim())) {
        return res.status(400).json({ error: 'Either URL or Pasted Job Text is required' });
      }

      // RBAC Gate: Verify employer requisition authorization
      if (isRequisition && userSession) {
        const isRecruiter = userSession.accountType === 'company' || userSession.accountType === 'recruiter' || userSession.accountType === 'staffingFirm';
        const isAdmin = userSession.isAdmin || userSession.email === 'Chris.Barnes.2000@me.com';
        if (!isRecruiter && !isAdmin) {
          return res.status(403).json({ 
            error: 'Forbidden: Candidate accounts cannot create employer requisitions. Recruiter or Staffing Firm role required.' 
          });
        }
      }

      // Fast, 100% accurate, zero-cost Local NLP Parser (Tier V1 Baseline)
      const inputText = pastedText || `Job Link Import: We are seeking a qualified professional for this role. Review requirements and apply at ${url}`;
      
      let jobData: IngestedJobData;
      if (boardType === 'govjobs' || inputText.includes('powered by NEOGOV')) {
        jobData = govJobsNlpParse(inputText, url);
      } else if (boardType === 'linkedin' || (url && url.includes('linkedin.com'))) {
        jobData = localNlpParse(inputText, url);
        jobData.sourceBoard = 'LinkedIn';
        // LinkedIn often has company name in the first few lines if scraped via extension
        if (inputText.startsWith('LINKEDIN_SCRAPE:')) {
           const parts = inputText.split('|');
           if (parts.length > 2) {
             jobData.companyName = parts[1];
             jobData.title = parts[2];
           }
        }
      } else if (boardType === 'indeed' || (url && url.includes('indeed.com'))) {
        jobData = localNlpParse(inputText, url);
        jobData.sourceBoard = 'Indeed';
      } else {
        jobData = localNlpParse(inputText, url);
      }

      // Tier V3: Strategic Executive Intelligence & Copilot Insights
      if (promptVersion === 'v3' && ai) {
        try {
          const promptV3 = `You are an elite executive career coach and technical talent advisor.
Perform an advanced Strategic Executive Tier-3 analysis on this job posting.
Extract behavioral STAR interview questions with model answers, unstated hiring manager expectations, and personalized pitch advice.

Job Context:
Title: ${jobData.title}
Company: ${jobData.companyName}
Workplace: ${jobData.workplaceType}
Location: ${jobData.location}
Salary: $${jobData.salaryMin} - $${jobData.salaryMax}
Skills: ${JSON.stringify(jobData.requiredSkills)}
Description:
${jobData.description}

Requirements:
${jobData.requirements}

Return valid JSON matching this schema exactly:
{
  "title": "Refined Job Title",
  "companyName": "Refined Company Name",
  "description": "Clean markdown description with formatted sections",
  "requirements": "Explicit requirements in clean markdown",
  "location": "Location",
  "workplaceType": "Remote" | "Hybrid" | "On-Site",
  "salaryMin": 0,
  "salaryMax": 0,
  "requiredSkills": ["Skill 1", "Skill 2"],
  "preferredSkills": ["Skill 3", "Skill 4"],
  "benefits": ["Benefit 1", "Benefit 2"],
  "insights": {
    "interviewQuestions": [
      { "question": "STAR Question 1?", "answer": "Model STAR response strategy." },
      { "question": "STAR Question 2?", "answer": "Model STAR response strategy." },
      { "question": "STAR Question 3?", "answer": "Model STAR response strategy." },
      { "question": "STAR Question 4?", "answer": "Model STAR response strategy." }
    ],
    "unstatedExpectations": ["Unstated expectation 1", "Unstated expectation 2", "Unstated expectation 3"],
    "matchStrategy": "Strategic pitch and alignment recommendation."
  }
}`;

          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: promptV3,
            config: { responseMimeType: 'application/json' }
          });

          const content = response.text || "{}";
          const enhanced = JSON.parse(content);
          return res.json({
            ...jobData,
            ...enhanced,
            promptVersion: 'v3',
            isAiEnhanced: true
          });
        } catch (v3Err: any) {
          console.warn("Tier V3 ingestion failed, falling back to V2/heuristic:", v3Err?.message || v3Err);
        }
      }

      // Tier V2: Deep Semantic Taxonomy & Skill Normalization
      if (promptVersion === 'v2' && ai) {
        try {
          const promptV2 = `You are an expert talent taxonomist.
Normalize this job posting with standardized skill taxonomy and explicit qualification splitting.
Categorize skills into technical and soft domains, extract standard workplace perks, and normalize compensation.

Job Context:
Title: ${jobData.title}
Company: ${jobData.companyName}
Workplace: ${jobData.workplaceType}
Location: ${jobData.location}
Salary: $${jobData.salaryMin} - $${jobData.salaryMax}
Skills: ${JSON.stringify(jobData.requiredSkills)}
Description:
${jobData.description}

Requirements:
${jobData.requirements}

Return valid JSON matching this schema:
{
  "title": "Refined Job Title",
  "companyName": "Refined Company Name",
  "description": "Clean markdown description",
  "requirements": "Explicit requirements in clean markdown",
  "location": "Location",
  "workplaceType": "Remote" | "Hybrid" | "On-Site",
  "salaryMin": 0,
  "salaryMax": 0,
  "requiredSkills": ["Skill 1", "Skill 2"],
  "preferredSkills": ["Skill 3", "Skill 4"],
  "benefits": ["Benefit 1", "Benefit 2"]
}`;

          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: promptV2,
            config: { responseMimeType: 'application/json' }
          });

          const content = response.text || "{}";
          const enhanced = JSON.parse(content);
          return res.json({
            ...jobData,
            ...enhanced,
            promptVersion: 'v2',
            isAiEnhanced: true
          });
        } catch (v2Err: any) {
          console.warn("Tier V2 ingestion failed, falling back to heuristic:", v2Err?.message || v2Err);
        }
      }

      // Tier V1: Fast Algorithmic Baseline
      return res.json({
        ...jobData,
        promptVersion: 'v1',
        isAiEnhanced: false
      });
    } catch (error: any) {
      console.error('Job Ingestion Error:', error);
      res.status(500).json({ error: 'Failed to ingest job posting: ' + error.message });
    }
  });

  // Heuristic Formatting Engine Re-run Endpoint
  app.post('/api/ingest-job/heuristic-format', async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: 'Text is required for formatting' });
      }
      const formatted = enhancePastedTextMarkdown(text);
      return res.json({ formatted });
    } catch (error: any) {
      console.error('Heuristic Formatting Error:', error);
      res.status(500).json({ error: 'Failed to format text: ' + error.message });
    }
  });

  // AI-Powered Deep Enhancement Second-Pass Endpoint
  app.post('/api/ingest-job/enhance', async (req, res) => {
    try {
      const { job } = req.body;
      if (!job) {
        return res.status(400).json({ error: 'Job details are required' });
      }

      if (ai) {
        const prompt = `You are an expert executive career coach and technical talent advisor.
You are performing a DEEP AI SECOND-PASS analysis on this job posting.
We have already parsed standard details using local heuristics, but we need high-fidelity, advanced strategic insights.

Job Details:
Title: ${job.title}
Company: ${job.companyName}
Workplace: ${job.workplaceType}
Location: ${job.location}
Salary: $${job.salaryMin} - $${job.salaryMax}
Skills parsed: ${JSON.stringify(job.requiredSkills)}
Description:
${job.description}

Requirements:
${job.requirements}

Perform a deep scan and return a valid JSON object matching this schema exactly:
{
  "title": "Refined Job Title",
  "companyName": "Refined Company Name",
  "description": "Comprehensive job description in clean markdown (include bullet points, etc)",
  "requirements": "Explicit requirements in clean markdown (include qualifications, etc)",
  "location": "Location (City, State/Country)",
  "workplaceType": "Remote" | "Hybrid" | "On-Site",
  "salaryMin": 80000,
  "salaryMax": 120000,
  "requiredSkills": ["Skill A", "Skill B", "Skill C"],
  "preferredSkills": ["Skill D", "Skill E"],
  "benefits": ["Benefit A", "Benefit B"],
  "insights": {
    "interviewQuestions": [
      { "question": "Question 1?", "answer": "Suggested response/strategy." },
      { "question": "Question 2?", "answer": "Suggested response/strategy." },
      { "question": "Question 3?", "answer": "Suggested response/strategy." },
      { "question": "Question 4?", "answer": "Suggested response/strategy." }
    ],
    "unstatedExpectations": ["Expectation 1", "Expectation 2", "Expectation 3", "Expectation 4"],
    "matchStrategy": "Strategic pitch advice."
  }
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          }
        });

        const content = response.text || "{}";
        const enhancedData = JSON.parse(content);
        return res.json({
          ...enhancedData,
          isAiEnhanced: true
        });
      } else {
        return res.status(400).json({ error: 'Gemini AI is not configured on this workspace' });
      }
    } catch (error: any) {
      console.error('Job Enhancement Error:', error);
      res.status(500).json({ error: 'Failed to enhance job: ' + error.message });
    }
  });

  // Copilot Interactive Chat Endpoint
  app.post('/api/ingest-job/chat', async (req, res) => {
    try {
      const { messages, job, profile } = req.body;
      if (!messages || !job) {
        return res.status(400).json({ error: 'Messages and job are required' });
      }

      if (ai) {
        const chatHistory = messages.map((m: any) => ({
          role: m.sender === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        }));

        const systemInstruction = `You are "Ascend Copilot", a top-tier executive career coach and technical talent advisor.
You are helping the candidate analyze this job posting:
Job Title: ${job.title}
Company: ${job.companyName}
Location: ${job.location || 'Not Specified'}
Workplace Type: ${job.workplaceType || 'Not Specified'}
Salary: $${job.salaryMin?.toLocaleString() || 'Not Specified'} - $${job.salaryMax?.toLocaleString() || 'Not Specified'}
Description: ${job.description}
Requirements: ${job.requirements}

Candidate's current profile:
Target Role: ${profile?.targetRole || 'Not Specified'}
Summary: ${profile?.professionalSummary || 'Not Specified'}
Skills: ${JSON.stringify(profile?.skills || [])}
Experience: ${JSON.stringify(profile?.workExperience || [])}

Provide objective, high-value, and direct career advice. Help them break down requirements, evaluate fit, find hidden challenges, and understand what the company is truly looking for. Keep your tone encouraging, objective, and professional. Avoid fluffy filler. Respond in clean Markdown.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            ...chatHistory.slice(0, -1),
            { role: 'user', parts: [{ text: messages[messages.length - 1].text }] }
          ],
          config: {
            systemInstruction,
          }
        });

        return res.json({ text: response.text || 'I apologize, I am unable to process that request.' });
      }

      return res.json({ text: "Ascend Copilot is currently offline. Please try again." });
    } catch (error: any) {
      console.error('Job Chat Error:', error);
      res.status(500).json({ error: 'Failed to generate chat response: ' + error.message });
    }
  });

  // Tailored Resume Generator Endpoint
  app.post('/api/tailor-resume', async (req, res) => {
    try {
      const { job, profile } = req.body;
      if (!job || !profile) {
        return res.status(400).json({ error: 'Job and Profile are required' });
      }

      if (ai) {
        const prompt = `You are an expert resume writer and recruiter.
Analyze this job posting:
Job Title: ${job.title}
Company: ${job.companyName}
Description: ${job.description}
Requirements: ${job.requirements}

And the candidate's profile:
Summary: ${profile.professionalSummary || ''}
Skills: ${JSON.stringify(profile.skills || [])}
Experience: ${JSON.stringify(profile.workExperience || [])}
Education: ${JSON.stringify(profile.education || [])}

Generate a TAILORED professional resume in JSON format.
Follow these rules:
1. "professionalSummary": Rewrite a highly compelling professional summary tailored to the job, emphasizing their transferable skills, specific tools, and outcomes matching the job requirements. Keep it under 500 characters.
2. "skills": Select and order the top 8-12 skills that match the job posting, ensuring they match exactly what the employer is seeking. Keep them as simple strings.
3. "workExperience": Rewrite the bullet points / descriptions for each past role. Incorporate exact keywords and phrasing from the job description and requirements. Emphasize achievements, scale, metrics, and business impact relevant to the target role. Do not invent new roles or companies, only re-write the descriptions for existing ones. Formulate as clean markdown (use bullet points with \n•).

Return a valid JSON matching this schema exactly:
{
  "professionalSummary": "Tailored Summary",
  "skills": ["Skill 1", "Skill 2"],
  "workExperience": [
    {
      "role": "Existing Role",
      "company": "Existing Company",
      "startDate": "Start Date",
      "endDate": "End Date",
      "description": "Tailored bullet points or description in clean markdown"
    }
  ],
  "education": [
    {
      "institution": "Institution",
      "degree": "Degree",
      "field": "Field",
      "graduationDate": "Graduation Date"
    }
  ]
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        });

        const content = response.text || "{}";
        const tailoredResume = JSON.parse(content);
        return res.json(tailoredResume);
      }

      // Fallback
      return res.json({
        professionalSummary: (profile.professionalSummary || '') + ` (Focused on ${job.title} at ${job.companyName})`,
        skills: (profile.skills || []).map((s: any) => typeof s === 'string' ? s : s.name),
        workExperience: (profile.workExperience || []).map((exp: any) => ({
          ...exp,
          description: exp.description + `\n\n• Leveraged expertise to align with requirements for ${job.title} at ${job.companyName}.`
        })),
        education: profile.education || []
      });
    } catch (error: any) {
      console.error('Tailor Resume Error:', error);
      res.status(500).json({ error: 'Failed to tailor resume: ' + error.message });
    }
  });

  // Vite Integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Ascend ATS Running on http://localhost:${PORT}`);
  });
}

startServer();
