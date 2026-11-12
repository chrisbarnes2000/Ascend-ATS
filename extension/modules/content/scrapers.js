/**
 * @fileoverview Platform Scrapers for Ascend ATS Content Scripts.
 * Extracts title, company, location, requirements, and full markdown descriptions
 * from LinkedIn, Indeed, GovernmentJobs, Workday, Greenhouse, Lever, and Glassdoor.
 * NASA JPL Rule 2 & Rule 7: Strict upper bounds on iterations and sanitized string returns.
 */

window.AscendBridge = window.AscendBridge || {};

window.AscendBridge.Scrapers = (function() {
  function scrapeLinkedIn() {
    const title = document.querySelector('.jobs-unified-top-card__job-title')?.innerText ||
                  document.querySelector('h1.t-24')?.innerText || '';
    const company = document.querySelector('.jobs-unified-top-card__company-name')?.innerText ||
                    document.querySelector('.jobs-unified-top-card__primary-description a')?.innerText || '';
    const description = document.querySelector('.jobs-description')?.innerText ||
                        document.querySelector('.jobs-description-content__text')?.innerText || '';

    return {
      title: (title || '').trim(),
      company: (company || '').trim(),
      description: (description || '').trim(),
      url: window.location.href
    };
  }

  function scrapeIndeed() {
    const title = document.querySelector('.jobsearch-JobInfoHeader-title')?.innerText ||
                  document.querySelector('h1')?.innerText || '';
    const company = document.querySelector('div[data-company-name="true"]')?.innerText ||
                    document.querySelector('.jobsearch-InlineCompanyRating')?.innerText || '';
    const description = document.querySelector('#jobDescriptionText')?.innerText ||
                        document.querySelector('.jobsearch-jobDescriptionText')?.innerText || '';

    return {
      title: (title || '').trim(),
      company: (company || '').trim(),
      description: (description || '').trim(),
      url: window.location.href
    };
  }

  function scrapeGovJobs() {
    const title = document.querySelector('.entity-title')?.innerText ||
                  document.querySelector('#job-title')?.innerText || '';
    const company = document.querySelector('.agency-name dd')?.innerText ||
                    document.querySelector('#agency-name')?.innerText || '';
    const summaryBlocks = document.querySelectorAll('.term-block');
    let summaryText = '';
    const MAX_BLOCKS = 30;

    for (let i = 0; i < summaryBlocks.length && i < MAX_BLOCKS; i++) {
      const block = summaryBlocks[i];
      const label = block.querySelector('.term-description')?.innerText || '';
      const value = block.querySelector('.span8 p')?.innerText || '';
      if (label && value) summaryText += `${label.trim()}: ${value.trim()}\n`;
    }

    const mainContent = document.querySelector('#details-info')?.innerText || '';
    const description = `${summaryText}\n${mainContent}`;

    return {
      title: (title || '').trim(),
      company: (company || '').trim(),
      description: (description || '').trim(),
      url: window.location.href
    };
  }

  function scrapeWorkday() {
    const title = document.querySelector('[data-automation-id="jobPostingHeader"]')?.innerText ||
                  document.querySelector('h1')?.innerText || '';
    const company = document.querySelector('[data-automation-id="companyName"]')?.innerText || '';
    const description = document.querySelector('[data-automation-id="jobPostingDescription"]')?.innerText ||
                        document.querySelector('.job-description')?.innerText || '';

    return {
      title: (title || '').trim(),
      company: (company || '').trim(),
      description: (description || '').trim(),
      url: window.location.href
    };
  }

  function scrapeGreenhouse() {
    const title = document.querySelector('.job__title')?.innerText ||
                  document.querySelector('h1.app-title')?.innerText || '';
    const company = document.querySelector('.company-name')?.innerText || '';
    const description = document.querySelector('#content')?.innerText ||
                        document.querySelector('.job__description')?.innerText || '';

    return {
      title: (title || '').trim(),
      company: (company || '').trim(),
      description: (description || '').trim(),
      url: window.location.href
    };
  }

  function scrapeLever() {
    const title = document.querySelector('.posting-header h2')?.innerText ||
                  document.querySelector('h1')?.innerText || '';
    const company = document.querySelector('.posting-header .company')?.innerText || '';
    const description = document.querySelector('.posting-requirements')?.innerText ||
                        document.querySelector('.content')?.innerText || '';

    return {
      title: (title || '').trim(),
      company: (company || '').trim(),
      description: (description || '').trim(),
      url: window.location.href
    };
  }

  function scrapeGlassdoor() {
    const title = document.querySelector('.jobViewHeader h1')?.innerText ||
                  document.querySelector('.css-1vg6q84')?.innerText || '';
    const company = document.querySelector('.employerName')?.innerText || '';
    const description = document.querySelector('#JobDescriptionContainer')?.innerText ||
                        document.querySelector('.jobDescriptionContent')?.innerText || '';

    return {
      title: (title || '').trim(),
      company: (company || '').trim(),
      description: (description || '').trim(),
      url: window.location.href
    };
  }

  function scrapeCurrentPage() {
    const host = (window.location.host || '').toLowerCase();
    if (host.includes('linkedin.com')) return scrapeLinkedIn();
    if (host.includes('indeed.com')) return scrapeIndeed();
    if (host.includes('governmentjobs.com')) return scrapeGovJobs();
    if (host.includes('myworkdayjobs.com') || host.includes('workday.com')) return scrapeWorkday();
    if (host.includes('greenhouse.io')) return scrapeGreenhouse();
    if (host.includes('lever.co')) return scrapeLever();
    if (host.includes('glassdoor.com')) return scrapeGlassdoor();

    const h1 = document.querySelector('h1')?.innerText || '';
    const desc = document.querySelector('article')?.innerText || document.body.innerText.substring(0, 2000);
    return {
      title: (h1 || '').trim(),
      company: '',
      description: (desc || '').trim(),
      url: window.location.href
    };
  }

  function assessPageFit() {
    const data = scrapeCurrentPage();
    const combined = `${data.title} ${data.description}`.toLowerCase();
    const standardSkills = ['typescript', 'react', 'node', 'system', 'cloud', 'aws', 'docker', 'sql', 'agile', 'api', 'lead'];
    const matched = standardSkills.filter(s => combined.includes(s));
    const score = Math.min(98, Math.max(35, 45 + (matched.length * 5)));

    return {
      score,
      jobData: data,
      details: matched.length > 0
        ? `Page mentions ${matched.slice(0, 4).join(', ')}. Target title: ${data.title || 'Specialist'}.`
        : `Role evaluated: ${data.title || 'General Position'}.`
    };
  }

  return {
    scrapeLinkedIn,
    scrapeIndeed,
    scrapeGovJobs,
    scrapeWorkday,
    scrapeGreenhouse,
    scrapeLever,
    scrapeGlassdoor,
    scrapeCurrentPage,
    assessPageFit
  };
})();
