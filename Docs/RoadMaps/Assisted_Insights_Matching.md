# Job Matching & Assisted Insights Algorithm

## Objective
This document outlines how Ascend ATS matches candidates to job positions and determines the "Assisted Insights" fit score. The core algorithm is built around string-based keyword extraction and rule-based thresholds, explicitly decoupling it from black-box LLM/AI decision making.

## Core Mechanisms

### 1. Keyword Extraction & Tokenized Fuzzy Skill Matching
- Jobs store an array of `parsedCriteria.skills` (e.g., `['React', 'TypeScript', 'Motion', 'Tailwind']`). If missing or empty, required skills are extracted directly from the job requirements and description text.
- Candidate profiles store an array of structured `ProfileSkill` objects and experience skills.
- The matching engine performs normalized, tokenized fuzzy matching across candidate skills and required criteria (`checkSkillMatch` & `compareSkills`), accounting for variations like "React" vs "React.js", "Node" vs "Node.js", and word token overlap:
  ```typescript
  export const checkSkillMatch = (skillA: string, skillB: string): boolean => {
    // Normalizes punctuation/case, checks substring inclusion, and compares tokenized words
  };
  ```

### 2. Weighted Fit Score Calculation
- The match score integrates a weighted 4-factor evaluation model:
  1. **Skills Alignment (40%)**: Ratio of candidate skills matching required job criteria or appearing in role details.
  2. **Experience Ratio (25%)**: Candidate work experience depth vs minimum position requirements.
  3. **Salary Intersections (20%)**: Candidate target salary alignment relative to job range bounds.
  4. **Target Role Alignment (15%)**: Title overlap between candidate target role and position title.

### 3. Surface-Level Signals
The "Assisted Insights" panel surfaces why a job is being recommended, citing deterministic factors:
- **Target Role Alignment**: Checks if the candidate's `targetRole` indicates alignment with the job category.
- **Salary Intersections**: Checks if the job's `parsedCriteria.salaryRange` intersects with the candidate's expected compensation.
- **Location Rules**: Considers absolute thresholds (such as minimum distance or standard "Remote" classification).

## Implementation Details
- Handled primarily inside `<JobDescription />` (for detailed breakdowns) and `<JobSeekerDashboard />` (for high-level filtering/matching counts).
- We maintain a strict rule against using LLMs to infer match scores to ensure deterministic, auditable tracking behavior that candidates and employers can trust.
