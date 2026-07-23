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

  // Basic Resume Parsing Logic (Rule-based)
  app.post('/api/parse-resume', async (req, res) => {
    try {
      const { fileName = '', fileContent = '', useAI = false } = req.body;
      const text = String(fileContent);
      const safeFileName = String(fileName);

      // AI Parsing path
      if (useAI && ai) {
        try {
          const prompt = `Parse the following resume into a strict JSON payload representing the candidate's profile.
JSON Schema required:
{
  "personalInfo": { "firstName": "", "lastName": "", "email": "", "phone": "", "location": "", "linkedinUrl": "", "portfolioUrl": "" },
  "professionalSummary": "",
  "targetRole": "",
  "skills": [ { "name": "Skill 1", "domain": "Technical", "level": "Intermediate", "years": 5 } ],
  "workExperience": [ { "role": "", "company": "", "startDate": "", "endDate": "", "description": "" } ],
  "education": []
}
Resume text:
${text.substring(0, 5000)}`;
          
          const response = await ai.models.generateContent({
             model: 'gemini-3.6-flash',
             contents: prompt,
             config: { responseMimeType: 'application/json' }
          });
          const content = response.text || "{}";
          let parsedData = JSON.parse(content);
          return res.json(parsedData);
        } catch (e: any) {
          console.warn("AI parsing unavailable or quota limit reached, seamlessly falling back to algorithmic extraction:", e?.message || e);
        }
      }

      // Algorithmic parsing (fallback / primary)
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
