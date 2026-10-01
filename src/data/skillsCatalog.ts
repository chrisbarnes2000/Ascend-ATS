export const SKILLS_CATALOG: Record<string, Record<string, string[]>> = {
  'Technology': {
    'Programming': ['TypeScript', 'JavaScript', 'Python', 'Java', 'C++', 'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'C#'],
    'Frontend': ['React', 'Angular', 'Vue.js', 'HTML', 'CSS', 'Sass', 'Tailwind', 'Next.js', 'Nuxt.js'],
    'Backend': ['Node.js', 'Django', 'Flask', 'Spring Boot', 'Express', 'Ruby on Rails', 'ASP.NET'],
    'Database': ['PostgreSQL', 'MongoDB', 'Redis', 'Firebase', 'MySQL', 'DynamoDB', 'Oracle', 'SQL Server', 'Cassandra'],
    'Monitoring': ['Prometheus', 'Grafana', 'Datadog', 'New Relic', 'CloudWatch', 'Splunk'],
    'DevOps': ['Docker', 'Kubernetes', 'Terraform', 'AWS', 'GCP', 'Azure', 'CI/CD', 'Jenkins', 'GitHub Actions', 'Ansible', 'Chef', 'Puppet'],
    'Cybersecurity': ['Penetration Testing', 'Network Security', 'Cryptography', 'Incident Response', 'Firewalls', 'SIEM', 'Ethical Hacking'],
    'Data Science': ['Machine Learning', 'Data Analysis', 'Pandas', 'NumPy', 'TensorFlow', 'PyTorch', 'SQL', 'Tableau', 'Power BI'],
    'Cloud Computing': ['AWS', 'Microsoft Azure', 'Google Cloud', 'Cloud Architecture', 'Serverless'],
    'AI & Prompt Engineering': ['Large Language Models', 'Prompt Engineering', 'LangChain', 'OpenAI API', 'Hugging Face', 'RAG']
  },
  'Design & Creative': {
    'UI/UX': ['Figma', 'Sketch', 'Adobe XD', 'Prototyping', 'User Research', 'Wireframing', 'Usability Testing'],
    'Graphic Design': ['Adobe Illustrator', 'Adobe Photoshop', 'Branding', 'Typography', 'InDesign', 'CorelDRAW'],
    'Video Production': ['Premiere Pro', 'Final Cut Pro', 'After Effects', 'DaVinci Resolve', 'Video Editing'],
    'Animation': ['Blender', 'Maya', 'Cinema 4D', 'Motion Graphics', '3D Modeling']
  },
  'Business & Management': {
    'Project Management': ['Agile', 'Scrum', 'Kanban', 'Jira', 'Asana', 'Risk Management', 'Stakeholder Management'],
    'Strategy': ['Roadmapping', 'Market Research', 'Operations', 'Business Analysis', 'Strategic Planning'],
    'Sales & Marketing': ['SEO', 'Content Marketing', 'B2B Sales', 'CRM', 'Salesforce', 'HubSpot', 'Google Analytics', 'Social Media Marketing'],
    'Human Resources': ['Talent Acquisition', 'Employee Relations', 'Payroll', 'Performance Management', 'HRIS']
  },
  'Finance & Accounting': {
    'Accounting': ['Bookkeeping', 'QuickBooks', 'Accounts Payable', 'Accounts Receivable', 'Financial Reporting', 'GAAP', 'Tax Preparation'],
    'Financial Analysis': ['Financial Modeling', 'Valuation', 'Excel', 'Budgeting', 'Forecasting', 'DCF', 'Risk Analysis'],
    'Investment': ['Portfolio Management', 'Asset Allocation', 'Equity Research', 'Derivatives', 'Wealth Management']
  },
  'Healthcare & Medicine': {
    'Nursing': ['Patient Care', 'Vital Signs', 'Phlebotomy', 'BLS', 'ACLS', 'Wound Care', 'Triage'],
    'Medical Administration': ['Medical Billing', 'Medical Coding', 'EMR', 'HIPAA', 'Scheduling', 'Epic Systems'],
    'Therapy & Rehab': ['Physical Therapy', 'Occupational Therapy', 'Speech Therapy', 'Rehabilitation', 'Kinesiology']
  },
  'Blue Collar & Trades': {
    'Construction': ['Carpentry', 'Masonry', 'Blueprint Reading', 'Heavy Equipment Operation', 'Concrete', 'Drywall', 'Framing'],
    'Electrical': ['Wiring', 'Circuitry', 'Troubleshooting', 'Electrical Codes', 'Lighting', 'PLC'],
    'Plumbing': ['Pipefitting', 'Drainage', 'Water Systems', 'Soldering', 'HVAC'],
    'Manufacturing': ['CNC Machining', 'Welding', 'Quality Control', 'Assembly', 'Lean Manufacturing', 'Forklift Operation'],
    'Automotive': ['Engine Repair', 'Brake Systems', 'Diagnostics', 'Preventative Maintenance', 'Transmissions']
  },
  'Education & Training': {
    'Teaching': ['Curriculum Development', 'Lesson Planning', 'Classroom Management', 'Special Education', 'ESL', 'Early Childhood'],
    'Instructional Design': ['E-Learning', 'LMS', 'Articulate Storyline', 'Adult Learning Theory', 'Canvas', 'Moodle']
  },
  'Legal': {
    'Corporate Law': ['Contracts', 'Compliance', 'Mergers & Acquisitions', 'Intellectual Property'],
    'Litigation': ['Legal Research', 'Brief Writing', 'Depositions', 'Trial Preparation', 'LexisNexis', 'Westlaw']
  },
  'Hospitality & Culinary': {
    'Culinary Arts': ['Food Preparation', 'Baking', 'Menu Planning', 'Food Safety (ServSafe)', 'Inventory Management'],
    'Guest Services': ['Front Desk', 'Concierge', 'Event Planning', 'Customer Satisfaction', 'Opera PMS']
  }
};

// Create a reverse mapping for O(1) lookup
const skillLookup = new Map<string, { domain: string, subDomain: string }>();

for (const [domain, subDomains] of Object.entries(SKILLS_CATALOG)) {
  for (const [subDomain, skills] of Object.entries(subDomains)) {
    for (const skill of skills) {
      skillLookup.set(skill.toLowerCase(), { domain, subDomain });
    }
  }
}

/**
 * Autodetects domain and subdomain for a given skill.
 * Uses exact match or fuzzy matching.
 */
export function autodetectSkillCategory(skillName: string): { domain: string, subDomain: string } | null {
  const normalizedInput = skillName.trim().toLowerCase();
  
  if (skillLookup.has(normalizedInput)) {
    return skillLookup.get(normalizedInput)!;
  }
  
  // Basic substring matching if exact match not found
  for (const [key, value] of skillLookup.entries()) {
    if (normalizedInput.includes(key) || key.includes(normalizedInput)) {
       return value;
    }
  }
  
  return null;
}
