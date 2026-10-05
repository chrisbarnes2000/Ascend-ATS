export const sampleJobSets = [
  {
    id: 'healthcare',
    name: 'Healthcare & Medical',
    jobs: [
      {
        title: 'Registered Nurse',
        companyName: 'General Hospital',
        companyId: 'general-hospital',
        description: 'Provide critical care in our intensive care unit. Must be comfortable in a fast-paced environment.',
        requirements: 'Valid RN license, BLS/ACLS certification, Minimum 2 years ICU experience',
        status: 'active',
        parsedCriteria: {
          skills: ['Patient Care', 'ICU', 'BLS', 'ACLS', 'Telemetry'],
          minExperience: 2,
          salaryRange: { min: 80000, max: 110000 }
        }
      },
      {
        title: 'Medical Assistant',
        companyName: 'City Clinic',
        companyId: 'city-clinic',
        description: 'Support doctors with routine check-ups and administrative tasks.',
        requirements: 'CMA certification, strong interpersonal skills',
        status: 'active',
        parsedCriteria: {
          skills: ['Patient Vitals', 'EMR', 'Phlebotomy', 'Administration'],
          minExperience: 1,
          salaryRange: { min: 45000, max: 60000 }
        }
      }
    ]
  },
  {
    id: 'retail',
    name: 'Retail & Sales',
    jobs: [
      {
        title: 'Store Manager',
        companyName: 'Luxe Retail',
        companyId: 'luxe-retail',
        description: 'Lead a team of associates to deliver exceptional customer service and meet sales goals.',
        requirements: 'Retail management experience, P&L responsibility',
        status: 'active',
        parsedCriteria: {
          skills: ['Team Leadership', 'Sales Strategy', 'Inventory Management', 'Customer Service'],
          minExperience: 4,
          salaryRange: { min: 65000, max: 90000 }
        }
      },
      {
        title: 'Sales Representative',
        companyName: 'Global Corp',
        companyId: 'global-corp',
        description: 'B2B sales role focused on acquiring new enterprise clients.',
        requirements: 'Proven track record in B2B sales, CRM proficiency',
        status: 'active',
        parsedCriteria: {
          skills: ['B2B Sales', 'Cold Calling', 'Salesforce', 'Negotiation'],
          minExperience: 2,
          salaryRange: { min: 60000, max: 120000 }
        }
      }
    ]
  },
  {
    id: 'education',
    name: 'Education & Training',
    jobs: [
      {
        title: 'High School Science Teacher',
        companyName: 'County Schools',
        companyId: 'county-schools',
        description: 'Teach biology and chemistry to grades 10-12. Develop engaging curriculum.',
        requirements: 'Teaching credential, Bachelor in Science',
        status: 'active',
        parsedCriteria: {
          skills: ['Lesson Planning', 'Curriculum Development', 'Biology', 'Chemistry'],
          minExperience: 1,
          salaryRange: { min: 55000, max: 75000 }
        }
      },
      {
        title: 'Corporate Trainer',
        companyName: 'Enterprise Solutions',
        companyId: 'enterprise-solutions',
        description: 'Develop and deliver onboarding programs for new employees globally.',
        requirements: 'Instructional design experience, public speaking',
        status: 'active',
        parsedCriteria: {
          skills: ['Instructional Design', 'Public Speaking', 'E-Learning', 'Onboarding'],
          minExperience: 3,
          salaryRange: { min: 70000, max: 95000 }
        }
      }
    ]
  },
  {
    id: 'finance',
    name: 'Finance & Accounting',
    jobs: [
      {
        title: 'Financial Analyst',
        companyName: 'Wall Street Partners',
        companyId: 'ws-partners',
        description: 'Analyze market trends, build financial models, and advise on investment strategies.',
        requirements: 'CFA level 1, advanced Excel, Python nice to have',
        status: 'active',
        parsedCriteria: {
          skills: ['Financial Modeling', 'Excel', 'Data Analysis', 'Valuation'],
          minExperience: 2,
          salaryRange: { min: 90000, max: 130000 }
        }
      },
      {
        title: 'Senior Accountant',
        companyName: 'Audit Pros LLC',
        companyId: 'audit-pros',
        description: 'Manage month-end close procedures and prepare financial statements.',
        requirements: 'CPA required, 5+ years public accounting experience',
        status: 'active',
        parsedCriteria: {
          skills: ['CPA', 'Financial Reporting', 'GAAP', 'Month-End Close'],
          minExperience: 5,
          salaryRange: { min: 85000, max: 120000 }
        }
      }
    ]
  },
  {
    id: 'legal',
    name: 'Legal & Compliance',
    jobs: [
      {
        title: 'Corporate Counsel',
        companyName: 'Apex Legal & Co',
        companyId: 'apex-legal',
        description: 'Review commercial contracts, IP filings, and advise executive leadership on regulatory compliance.',
        requirements: 'JD degree, active bar admission, 3+ years corporate law experience',
        status: 'active',
        parsedCriteria: {
          skills: ['Contract Review', 'Regulatory Compliance', 'IP Law', 'Negotiation'],
          minExperience: 3,
          salaryRange: { min: 140000, max: 200000 }
        }
      },
      {
        title: 'Compliance Analyst',
        companyName: 'TrustGuard Risk',
        companyId: 'trustguard',
        description: 'Monitor internal security and financial workflows to ensure adherence to SEC and GDPR mandates.',
        requirements: 'Certified Compliance Professional (CCPC), detail-oriented analytical skills',
        status: 'active',
        parsedCriteria: {
          skills: ['Risk Assessment', 'GDPR', 'Audit', 'Policy Writing'],
          minExperience: 2,
          salaryRange: { min: 75000, max: 105000 }
        }
      }
    ]
  },
  {
    id: 'logistics',
    name: 'Logistics & Supply Chain',
    jobs: [
      {
        title: 'Supply Chain Analyst',
        companyName: 'SwiftFlow Logistics',
        companyId: 'swiftflow',
        description: 'Optimize global freight routes, inventory holding costs, and supplier SLA metrics.',
        requirements: 'Degree in Supply Chain or Operations, SAP or Oracle ERP proficiency',
        status: 'active',
        parsedCriteria: {
          skills: ['Supply Chain', 'ERP', 'Inventory Optimization', 'SQL'],
          minExperience: 2,
          salaryRange: { min: 70000, max: 95000 }
        }
      },
      {
        title: 'Warehouse Operations Manager',
        companyName: 'PrimeDepot Centers',
        companyId: 'primedepot',
        description: 'Manage 100+ shift staff, safety standards, and high-volume order fulfillment throughput.',
        requirements: '5+ years warehouse leadership, Six Sigma certification preferred',
        status: 'active',
        parsedCriteria: {
          skills: ['Warehouse Management', 'Safety Standards', 'Six Sigma', 'Team Leadership'],
          minExperience: 5,
          salaryRange: { min: 80000, max: 115000 }
        }
      }
    ]
  },
  {
    id: 'creative',
    name: 'Creative & Design',
    jobs: [
      {
        title: 'Senior UX/UI Designer',
        companyName: 'PixelCraft Studio',
        companyId: 'pixelcraft',
        description: 'Design immersive web and mobile applications with a focus on user empathy and modern design systems.',
        requirements: 'Figma mastery, strong portfolio, user research experience',
        status: 'active',
        parsedCriteria: {
          skills: ['Figma', 'UX Research', 'Design Systems', 'Prototyping'],
          minExperience: 4,
          salaryRange: { min: 110000, max: 155000 }
        }
      },
      {
        title: 'Brand Creative Director',
        companyName: 'Aura Media Group',
        companyId: 'aura-media',
        description: 'Direct global visual campaigns, typography direction, and multimedia storytelling.',
        requirements: 'Agency experience, art direction leadership',
        status: 'active',
        parsedCriteria: {
          skills: ['Art Direction', 'Brand Strategy', 'Typography', 'Creative Direction'],
          minExperience: 7,
          salaryRange: { min: 130000, max: 185000 }
        }
      }
    ]
  },
  {
    id: 'engineering',
    name: 'Engineering & DevOps',
    jobs: [
      {
        title: 'Senior Cloud Architect',
        companyName: 'CloudScale Infrastructure',
        companyId: 'cloudscale',
        description: 'Design fault-tolerant, scalable multi-region AWS and Kubernetes clusters.',
        requirements: 'AWS Certified Solutions Architect, Terraform, Kubernetes',
        status: 'active',
        parsedCriteria: {
          skills: ['AWS', 'Kubernetes', 'Terraform', 'System Architecture'],
          minExperience: 6,
          salaryRange: { min: 160000, max: 220000 }
        }
      },
      {
        title: 'Full Stack Engineer',
        companyName: 'NextGen Apps',
        companyId: 'nextgen-apps',
        description: 'Build fast React and Node.js microservices with clean TypeScript codebases.',
        requirements: 'React, Node.js, TypeScript, PostgreSQL',
        status: 'active',
        parsedCriteria: {
          skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
          minExperience: 3,
          salaryRange: { min: 120000, max: 165000 }
        }
      }
    ]
  },
  {
    id: 'biotech',
    name: 'Biotech & Research',
    jobs: [
      {
        title: 'Clinical Research Scientist',
        companyName: 'BioHealth Labs',
        companyId: 'biohealth',
        description: 'Conduct Phase II and III clinical trials, analyzing patient safety metrics and efficacy data.',
        requirements: 'PhD or MS in Life Sciences, GCP certification',
        status: 'active',
        parsedCriteria: {
          skills: ['Clinical Trials', 'Data Analysis', 'GCP', 'Biostatistics'],
          minExperience: 4,
          salaryRange: { min: 105000, max: 150000 }
        }
      }
    ]
  },
  {
    id: 'staffing',
    name: 'Sponsored & Staffing',
    jobs: [
      {
        title: 'Senior DevOps Engineer',
        companyName: 'Fintech Unicorn',
        companyId: 'fintech-unicorn',
        posterFirmName: 'Elite Tech Recruiting',
        posterFirmId: 'elite-tech-rec',
        description: 'Build core infrastructure for a high-growth fintech startup. High emphasis on security and scale.',
        requirements: 'Kubernetes, AWS, Terraform, 5+ years experience',
        status: 'active',
        parsedCriteria: {
          skills: ['Kubernetes', 'AWS', 'Terraform', 'DevOps'],
          minExperience: 5,
          salaryRange: { min: 180000, max: 240000 }
        }
      },
      {
        title: 'Project Manager',
        companyName: 'Confidential Client',
        companyId: 'confidential-pm',
        isClientConfidential: true,
        posterFirmName: 'Strategic Placements Inc',
        posterFirmId: 'strategic-placements',
        description: 'Lead enterprise software deployments for a major retail brand. Details disclosed after initial screening.',
        requirements: 'PMP certification, Agile methodology, Enterprise PM experience',
        status: 'active',
        parsedCriteria: {
          skills: ['Project Management', 'Agile', 'PMP', 'Stakeholder Management'],
          minExperience: 4,
          salaryRange: { min: 110000, max: 150000 }
        }
      }
    ]
  }
];

export const companiesDetails: Record<string, any> = {
  'general-hospital': {
    name: 'General Hospital',
    industry: 'Healthcare',
    size: '1000+',
    description: 'Leading regional medical center specializing in acute care and trauma services.'
  },
  'city-clinic': {
    name: 'City Clinic',
    industry: 'Healthcare',
    size: '51-200',
    description: 'Community health practice delivering primary care and preventative medicine.'
  },
  'luxe-retail': {
    name: 'Luxe Retail',
    industry: 'Retail',
    size: '201-500',
    description: 'Premium fashion and lifestyle brand with global boutique locations.'
  },
  'global-corp': {
    name: 'Global Corp',
    industry: 'Business Services',
    size: '1000+',
    description: 'Enterprise consulting and software solutions provider.'
  },
  'county-schools': {
    name: 'County Schools',
    industry: 'Education',
    size: '501-1000',
    description: 'Public K-12 education district serving thousands of students.'
  },
  'enterprise-solutions': {
    name: 'Enterprise Solutions',
    industry: 'Professional Training',
    size: '51-200',
    description: 'Corporate workforce development and digital learning solutions.'
  },
  'ws-partners': {
    name: 'Wall Street Partners',
    industry: 'Financial Services',
    size: '201-500',
    description: 'Boutique investment bank and wealth management firm.'
  },
  'audit-pros': {
    name: 'Audit Pros LLC',
    industry: 'Accounting',
    size: '51-200',
    description: 'Certified public accounting and corporate tax advisory services.'
  },
  'apex-legal': {
    name: 'Apex Legal & Co',
    industry: 'Legal Services',
    size: '51-200',
    description: 'Full-service corporate law firm specializing in M&A, tech IP, and governance.'
  },
  'trustguard': {
    name: 'TrustGuard Risk',
    industry: 'Risk & Compliance',
    size: '11-50',
    description: 'Specialized regulatory advisory firm focused on GDPR, SEC, and SOX frameworks.'
  },
  'swiftflow': {
    name: 'SwiftFlow Logistics',
    industry: 'Logistics',
    size: '201-500',
    description: 'Global freight forwarding and automated supply chain intelligence provider.'
  },
  'primedepot': {
    name: 'PrimeDepot Centers',
    industry: 'Warehousing',
    size: '501-1000',
    description: 'High-volume regional fulfillment hubs servicing e-commerce leaders.'
  },
  'pixelcraft': {
    name: 'PixelCraft Studio',
    industry: 'Design',
    size: '11-50',
    description: 'Award-winning digital product design agency building human-centered software.'
  },
  'aura-media': {
    name: 'Aura Media Group',
    industry: 'Media & Marketing',
    size: '51-200',
    description: 'Full-funnel creative branding agency for high-growth tech startups.'
  },
  'cloudscale': {
    name: 'CloudScale Infrastructure',
    industry: 'Cloud Infrastructure',
    size: '201-500',
    description: 'Enterprise cloud orchestration, Terraform automation, and DevOps consulting.'
  },
  'nextgen-apps': {
    name: 'NextGen Apps',
    industry: 'Software Engineering',
    size: '51-200',
    description: 'Agile software development and cloud-native application engineering.'
  },
  'biohealth': {
    name: 'BioHealth Labs',
    industry: 'Biotechnology',
    size: '51-200',
    description: 'Pioneering clinical research and pharmaceutical discovery.'
  }
};
