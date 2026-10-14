/**
 * 26 Fast Company Impact Council Cultural Values Catalog
 * and 5 Manpower Keys to Working with a Recruiter Catalog
 */

export interface CulturalValueItem {
  id: string;
  number: number;
  title: string;
  author: string;
  organization: string;
  summary: string;
  quote: string;
  category: 'leadership' | 'collaboration' | 'innovation' | 'people_first' | 'transparency' | 'work_style';
  reverseInterviewQuestion: string;
  redFlagPhrase: string;
}

export interface RecruiterKeyItem {
  id: string;
  number: number;
  title: string;
  corePrinciple: string;
  candidateActionableTips: string[];
  recruiterActionableTips: string[];
}

export const FAST_COMPANY_26_VALUES: CulturalValueItem[] = [
  {
    id: 'originality',
    number: 1,
    title: 'Originality',
    author: 'Erik Herrström',
    organization: 'STUDIO HERRSTRÖM',
    summary: 'Differentiating category conventions by holding disciplined non-consensus beliefs rather than copying competitors.',
    quote: 'Confusing relevance with resemblance... What non-consensus belief do we hold about this category?',
    category: 'innovation',
    reverseInterviewQuestion: 'What non-consensus belief does this team hold about your product or category that sets you apart from competitors?',
    redFlagPhrase: 'That’s just industry standard / how everyone else does it'
  },
  {
    id: 'excellence_empathy',
    number: 2,
    title: 'Excellence and Empathy',
    author: 'Chris Moore',
    organization: 'FIRST',
    summary: 'Building high performance on gracious professionalism where respect and kindness enable true excellence.',
    quote: 'Gracious professionalism... respect and kindness are not at odds with excellence. They make excellence possible.',
    category: 'people_first',
    reverseInterviewQuestion: 'How does leadership balance high performance expectations with psychological safety and empathy during crunch periods?',
    redFlagPhrase: 'Results matter, feelings don’t'
  },
  {
    id: 'community_engagement',
    number: 3,
    title: 'Community Engagement',
    author: 'Kellie Lauth',
    organization: 'MindSpark',
    summary: 'Creating durable reciprocal partnerships with communities through mentorship and shared decision-making.',
    quote: 'Reciprocity builds partnership that a check alone cannot buy.',
    category: 'collaboration',
    reverseInterviewQuestion: 'How does the organization ensure community engagement is a two-way reciprocal partnership rather than a one-time photo op?',
    redFlagPhrase: 'We just write a check once a year'
  },
  {
    id: 'innovation_behavior',
    number: 4,
    title: 'Innovation as a Behavior',
    author: 'Virtyt Pula',
    organization: 'TOML Collective',
    summary: 'Treating innovation as a daily habit of curiosity and risk-taking across all teams rather than an isolated lab or department.',
    quote: 'Innovation is not just about moving fast... It is about creating a culture where people are allowed to question the old way.',
    category: 'innovation',
    reverseInterviewQuestion: 'Can you share an example of a team member outside of R&D questioning an established process and testing a new idea?',
    redFlagPhrase: 'Leave innovation to the innovation department'
  },
  {
    id: 'uncomfortable_transparency',
    number: 5,
    title: 'Uncomfortable Transparency',
    author: 'Meredith Rosenberg',
    organization: 'NU Advisory Partners',
    summary: 'Practicing honest communication even when the answer is hard, building compounding trust across the organization.',
    quote: 'Real transparency isn’t the well-crafted update... It’s what happens when the honest answer is harder than the polished one.',
    category: 'transparency',
    reverseInterviewQuestion: 'How does leadership communicate uncomfortable truths or setbacks to the company when plans don’t go as expected?',
    redFlagPhrase: 'Need to know basis only'
  },
  {
    id: 'sense_of_belonging',
    number: 6,
    title: 'Sense of Belonging',
    author: 'Mitch Smith',
    organization: 'MG2',
    summary: 'Fostering genuine community and shared experiences through inclusive initiatives and paid community service.',
    quote: 'These shared experiences build a sense of community and belonging, both inside and outside our organization.',
    category: 'people_first',
    reverseInterviewQuestion: 'What structured opportunities do employees have to bond, give back, and build community beyond daily task execution?',
    redFlagPhrase: 'We are too busy for team bonding'
  },
  {
    id: 'stewardship',
    number: 7,
    title: 'Stewardship',
    author: 'R. Ethan Braden',
    organization: 'Texas A&M University',
    summary: 'Recognizing that leadership is temporary and leaving the institution, team, and trust stronger for future generations.',
    quote: 'Stewardship recognizes that leadership is temporary... the real test is whether you improved what was entrusted to you.',
    category: 'leadership',
    reverseInterviewQuestion: 'How does leadership evaluate success beyond short-term quarterly metrics to ensure long-term health of the team?',
    redFlagPhrase: 'Hit quarterly numbers at all costs'
  },
  {
    id: 'culture_add_hiring',
    number: 8,
    title: 'Culture Add vs Culture Fit',
    author: 'Nathan Friedman',
    organization: 'Understood.org',
    summary: 'Hiring culture builders who challenge assumptions and bring missing lived experiences rather than seeking conformity.',
    quote: 'Companies hire for "cultural fit" when they should be hiring culture builders. "Fit" really means conformity.',
    category: 'people_first',
    reverseInterviewQuestion: 'How do you evaluate candidates to ensure you are adding new perspectives and lived experience rather than seeking culture fit conformity?',
    redFlagPhrase: 'Must fit in with our existing vibe'
  },
  {
    id: 'learning_and_clarity',
    number: 9,
    title: 'Learning & Contextual Transparency',
    author: 'Tami Rosen',
    organization: 'Executive Board Advisor',
    summary: 'Giving room for experimentation while sharing focused context that helps people connect dots without overload.',
    quote: 'Share what helps people connect the dots and do their jobs better, not information that distracts them.',
    category: 'transparency',
    reverseInterviewQuestion: 'How does the team support learning agility when someone experiments with a new technique that doesn’t succeed initially?',
    redFlagPhrase: 'Failure is not an option'
  },
  {
    id: 'accountability_without_fault',
    number: 10,
    title: 'Accountability without Fault',
    author: 'Denas Grybauskas',
    organization: 'Oxylabs',
    summary: 'Welcoming early flagging of concerns and small problems rather than penalizing honesty or assigning blame.',
    quote: 'Accountability often slips into finding fault... raising a problem while it’s still small should be welcomed rather than penalized.',
    category: 'leadership',
    reverseInterviewQuestion: 'What happens when an engineer or manager raises a red flag early about a slipping deadline or technical flaw?',
    redFlagPhrase: 'Who messed this up?'
  },
  {
    id: 'people_first_sequence',
    number: 11,
    title: 'True "People First" Sequencing',
    author: 'Glen Tullman',
    organization: 'Transcarent',
    summary: 'Prioritizing users/members first, clients second, employees third, community fourth, and investors fifth.',
    quote: 'If we take care of the first four audiences, the last one (investors) takes care of itself.',
    category: 'people_first',
    reverseInterviewQuestion: 'When tough trade-offs arise between short-term margin goals and user/employee needs, how are decisions resolved?',
    redFlagPhrase: 'Shareholder value is our only priority'
  },
  {
    id: 'purpose_as_filter',
    number: 12,
    title: 'Purpose as a Decision Filter',
    author: 'Michele Walsh',
    organization: 'UNICEF USA',
    summary: 'Using stated mission as a strict filter for capital allocation, hiring, and hard decisions rather than marketing copy.',
    quote: 'Purpose that only shows up in communications isn’t a cultural value—it’s a marketing line.',
    category: 'transparency',
    reverseInterviewQuestion: 'Can you describe a recent strategic decision where the company turned down a lucrative deal because it violated core mission purpose?',
    redFlagPhrase: 'Mission is for our website'
  },
  {
    id: 'disciplined_speed',
    number: 13,
    title: 'Disciplined Speed & Pacing',
    author: 'Minna Song',
    organization: 'EliseAI',
    summary: 'Moving fast with extreme discipline and active feedback listening rather than cutting corners or ignoring consequences.',
    quote: 'Shipping fast only works if we’re just as disciplined about listening to feedback afterward.',
    category: 'work_style',
    reverseInterviewQuestion: 'How does the team ensure that fast deployment is accompanied by disciplined post-launch monitoring and user feedback loops?',
    redFlagPhrase: 'Move fast and break things without looking back'
  },
  {
    id: 'institutionalized_collaboration',
    number: 14,
    title: 'Institutionalized Collaboration',
    author: 'Maril Gagen MacDonald',
    organization: 'Gagen MacDonald',
    summary: 'Building explicit structures, systems, and co-creation processes that hold teams accountable for daily collaboration.',
    quote: 'Collaboration comes to life when organizations build structures, systems, and processes that institutionalize co-creation.',
    category: 'collaboration',
    reverseInterviewQuestion: 'What formal structures or processes exist to facilitate cross-functional co-creation across product, design, and engineering?',
    redFlagPhrase: 'Silos are normal here'
  },
  {
    id: 'positive_orientation',
    number: 15,
    title: 'Positive Orientation over Struggle',
    author: 'Lindsey Witmer Collins',
    organization: 'WLCM App Studio',
    summary: 'Valuing positive energy, flow, and enjoyment in tasks over unnecessary struggle and non-stop grinding.',
    quote: 'Our orientation to the work is more important than our willingness to struggle.',
    category: 'work_style',
    reverseInterviewQuestion: 'How does management support team members in finding work alignment that energizes them rather than grinding through burnout?',
    redFlagPhrase: 'You have to suffer for your craft'
  },
  {
    id: 'democratized_innovation',
    number: 16,
    title: 'Democratized Innovation & Agency',
    author: 'Patrick Frend',
    organization: 'Delve',
    summary: 'Empowering everyone closest to problems with AI tools and agency rather than containing innovation to a single department.',
    quote: 'Agency without tools is just an invitation to be frustrated... Innovation becomes cultural when it’s continuous.',
    category: 'innovation',
    reverseInterviewQuestion: 'What tools and autonomy are provided to individual contributors to prototype solutions for problems they observe directly?',
    redFlagPhrase: 'Submit your idea to the suggestions box'
  },
  {
    id: 'curiosity_over_certainty',
    number: 17,
    title: 'Curiosity over Certainty',
    author: 'Gail Zauder',
    organization: 'AbleFly Inc',
    summary: 'Rewarding open questioning, challenging assumptions, and admitting when obvious answers are incomplete.',
    quote: 'Too many companies say they value expertise when what they really reward is certainty.',
    category: 'transparency',
    reverseInterviewQuestion: 'How does leadership react when someone asks "Why do we do it this way?" or admits they don’t know the answer yet?',
    redFlagPhrase: 'Don’t question leadership'
  },
  {
    id: 'shared_creativity',
    number: 18,
    title: 'Shared Cross-Functional Creativity',
    author: 'Maurice Twomey',
    organization: 'Roto Group, LLC',
    summary: 'Nurturing creative capacity across all roles—analysts, engineers, project managers—rather than siloing "creatives".',
    quote: 'To truly unlock creativity, it cannot be treated as the domain of a select few.',
    category: 'collaboration',
    reverseInterviewQuestion: 'How are non-design roles (engineers, analysts) encouraged to participate in product design or brainstorming sessions?',
    redFlagPhrase: 'That’s not your job'
  },
  {
    id: 'authentic_philanthropy',
    number: 19,
    title: 'Authentic Philanthropy & Purpose',
    author: 'Ed Mitzen',
    organization: 'Business For Good Foundation',
    summary: 'Valuing humanity alongside P&L statements, building giving back into recruiting, retention, and business strategy.',
    quote: 'People want to work with companies that value humanity as much as their profit and loss statements.',
    category: 'people_first',
    reverseInterviewQuestion: 'In what ways does the company empower employees to participate in or direct corporate philanthropic causes?',
    redFlagPhrase: 'We don’t do social causes'
  },
  {
    id: 'ecosystem_vs_family',
    number: 20,
    title: 'Ecosystem vs "Family"',
    author: 'Edgar Villanueva',
    organization: 'Decolonizing Wealth Project',
    summary: 'Viewing teams as an interconnected ecosystem with unique functions built on mutual respect and shared purpose, not forced family bonds.',
    quote: 'Company culture isn’t built on forced familial bonds. It’s built on mutual respect, interdependence, and shared purpose.',
    category: 'people_first',
    reverseInterviewQuestion: 'How does the company maintain clear professional boundaries while fostering strong mutual support and shared purpose?',
    redFlagPhrase: 'We are one big family here'
  },
  {
    id: 'culture_as_brand_driver',
    number: 21,
    title: 'Culture as Brand Core',
    author: 'Chris K Bailey',
    organization: 'Bailey Brand Consulting',
    summary: 'Recognizing that internal employee culture directly forms and drives external brand reputation and customer loyalty.',
    quote: 'Employees shape the brand every day through their interactions, decisions, and behaviors.',
    category: 'leadership',
    reverseInterviewQuestion: 'How does internal team experience reflect and reinforce the promise you make to external customers?',
    redFlagPhrase: 'Internal culture doesn’t affect marketing'
  },
  {
    id: 'cognitive_inclusion',
    number: 22,
    title: 'Cognitive & Lived Inclusion',
    author: 'Susan Watts',
    organization: 'SPACECRAFT',
    summary: 'Ensuring cognitive, neurodivergent, and lived experience differences actively influence product and organizational outcomes.',
    quote: 'Diversity creates value only when those perspectives are heard, tested, and allowed to influence the outcome.',
    category: 'people_first',
    reverseInterviewQuestion: 'Can you share an example where a neurodivergent or non-mainstream perspective directly altered a product feature or policy?',
    redFlagPhrase: 'We want everyone to think the same'
  },
  {
    id: 'mission_governance',
    number: 23,
    title: 'Mission as Governance',
    author: 'Cody Barbo',
    organization: 'Trust & Will',
    summary: 'Governing hidden product, hiring, and partner decisions against stated public benefit purpose.',
    quote: 'If a value isn’t governing decisions no one sees, it’s just decoration.',
    category: 'transparency',
    reverseInterviewQuestion: 'How are internal operational guidelines or partner selections audited to ensure they comply with your public mission?',
    redFlagPhrase: 'Rules don’t apply behind closed doors'
  },
  {
    id: 'kindness_vs_niceness',
    number: 24,
    title: 'Kindness vs Niceness',
    author: 'Hala Hanna',
    organization: 'MIT Solve',
    summary: 'Preferring kind candor, clear expectations, and respectful hard truths over passive-nice conflict avoidance.',
    quote: 'Being nice preserves comfort. Being kind serves people: sharing hard truths respectfully, setting expectations clearly.',
    category: 'transparency',
    reverseInterviewQuestion: 'How is constructive feedback delivered in performance reviews to ensure it is kind and actionable rather than vaguely nice?',
    redFlagPhrase: 'Don’t rock the boat / keep everyone happy'
  },
  {
    id: 'pacing_and_endurance',
    number: 25,
    title: 'Pacing vs Hustle Culture',
    author: 'Eric Simons',
    organization: 'Bolt.new',
    summary: 'Recognizing pacing and rest as vital for sustainable high performance; preventing burnout as default baseline.',
    quote: 'All-in, full-out shouldn’t be the baseline... pacing and rest are crucial lessons in endurance.',
    category: 'work_style',
    reverseInterviewQuestion: 'What steps does the company take to enforce true rest and prevent burnout after intensive sprint deliveries?',
    redFlagPhrase: 'Sleep when you’re dead / 80-hour weeks expected'
  },
  {
    id: 'empowered_social_impact',
    number: 26,
    title: 'Empowered Social Impact',
    author: 'Jaymes Black',
    organization: 'The Trevor Project',
    summary: 'Empowering staff as a collective force for good through matching donations, cause challenges, and dedicated paid volunteer PTO.',
    quote: 'Empowering your employees as a collective force for good can be a massive boon to organizational culture.',
    category: 'people_first',
    reverseInterviewQuestion: 'Does the company offer paid volunteer time off (VTO) or donation matching programs directed by employees?',
    redFlagPhrase: 'Volunteer on your own time'
  }
];

export const MANPOWER_5_RECRUITER_KEYS: RecruiterKeyItem[] = [
  {
    id: 'great_impression',
    number: 1,
    title: 'Make a Great Impression',
    corePrinciple: 'The impression you make on your recruiter is the image they market to hiring managers. Reliability, promptness, and professional attitude build recruiter confidence to advocate for you.',
    candidateActionableTips: [
      'Meet via video or in person when possible with professional presentation.',
      'Articulate past accomplishments and future career goals concisely.',
      'Respond promptly and stay positive throughout the search.'
    ],
    recruiterActionableTips: [
      'Set clear expectations regarding response windows and interview prep.',
      'Treat candidate time with respect and provide timely updates.',
      'Represent candidate strengths authentically to hiring managers.'
    ]
  },
  {
    id: 'trust_and_communication',
    number: 2,
    title: 'Build Relationship on Trust and Clear Communication',
    corePrinciple: 'Openness about salary expectations, commute limits, workplace preferences (Remote/Hybrid), and background gaps prevents wasted effort and ensures true alignment.',
    candidateActionableTips: [
      'Be upfront about salary minimums and non-negotiable workplace settings.',
      'Disclose background gaps or competing interview timelines early.',
      'State specific cultural needs (e.g. gracious professionalism, pacing).'
    ],
    recruiterActionableTips: [
      'Provide accurate compensation ranges and workplace policy details.',
      'Be transparent about hiring manager style and team culture.',
      'Never submit candidate profiles without explicit candidate authorization.'
    ]
  },
  {
    id: 'follow_up_often',
    number: 3,
    title: 'Follow Up Proactively & Debrief',
    corePrinciple: 'Prompt debriefs after interviews and updates on external offers keep candidates top-of-mind and give recruiters maximum leverage to advocate and negotiate.',
    candidateActionableTips: [
      'Contact your recruiter immediately after an interview with debrief notes.',
      'Inform recruiter immediately if you receive external interest or offers.',
      'Ask for hiring manager feedback through your recruiter.'
    ],
    recruiterActionableTips: [
      'Share hiring manager feedback within 24-48 hours post-interview.',
      'Use candidate competing offer signals to expedite employer decision timelines.',
      'Provide constructive interview coaching post-debrief.'
    ]
  },
  {
    id: 'team_cooperation',
    number: 4,
    title: 'Cooperation & Partnership Effort',
    corePrinciple: 'Recruiting is a collaborative partnership. Agree on timelines, refine resumes for specific roles, and leverage recruiter coaching.',
    candidateActionableTips: [
      'Take advantage of recruiter resume positioning feedback.',
      'Participate in interview prep sessions with your recruiter.',
      'Align on application submit deadlines and interview availability.'
    ],
    recruiterActionableTips: [
      'Provide tailored interview coaching based on hiring manager preferences.',
      'Offer actionable resume feedback without altering candidate truth.',
      'Act as a true candidate advocate during salary and offer negotiations.'
    ]
  },
  {
    id: 'stay_in_touch',
    number: 5,
    title: 'Maintain Long-Term Career Continuity',
    corePrinciple: 'A strong recruiter relationship extends beyond single placements into long-term career advisory as you gain certifications, promotions, or new goals.',
    candidateActionableTips: [
      'Send quick updates when earning new certifications or promotions.',
      'Keep your recruiter contact info in your professional network index.',
      'Refer qualified colleagues when you are not looking.'
    ],
    recruiterActionableTips: [
      'Check in with placed candidates at 30, 90, and 180-day milestones.',
      'Act as a long-term career advisor rather than a one-time transaction agent.',
      'Build enduring talent pools based on trust and mutual respect.'
    ]
  }
];
