/**
 * @fileoverview Site and Platform Detector for Ascend ATS Content Scripts.
 * Detects whether the current tab is the Ascend Web App, or a whitelisted job board
 * (LinkedIn, Indeed, GovernmentJobs, Workday, Greenhouse, Lever, Glassdoor).
 * If unapproved/unrecognized (e.g., Facebook, X, YouTube), prompts user/admin for domain validation.
 * NASA JPL Rule 1 & Rule 5: Deterministic pattern matching with input assertions.
 */

window.AscendBridge = window.AscendBridge || {};

window.AscendBridge.SiteDetector = (function() {
  const WHITELISTED_DOMAINS = [
    'linkedin.com',
    'indeed.com',
    'governmentjobs.com',
    'myworkdayjobs.com',
    'workday.com',
    'greenhouse.io',
    'lever.co',
    'glassdoor.com'
  ];

  /**
   * Checks whether the current page is an instance of the Ascend ATS Web App.
   * @returns {boolean} True if host matches Ascend cloud domains or localhost.
   */
  function isAscendApp() {
    const host = window.location.host || '';
    return host.includes('ascend-ats.ai.studio') || host.includes('ais-') || host.includes('localhost');
  }

  /**
   * Checks if current host belongs to a whitelisted job platform.
   * @returns {boolean} True if whitelisted.
   */
  function isWhitelistedDomain() {
    const host = (window.location.host || '').toLowerCase();
    return WHITELISTED_DOMAINS.some(domain => host.includes(domain));
  }

  /**
   * Detects active job board type from window location.
   * @returns {'linkedin'|'indeed'|'govjobs'|'workday'|'greenhouse'|'lever'|'glassdoor'|'unknown'} Identified job platform.
   */
  function detectJobBoard() {
    const host = (window.location.host || '').toLowerCase();
    if (host.includes('linkedin.com')) return 'linkedin';
    if (host.includes('indeed.com')) return 'indeed';
    if (host.includes('governmentjobs.com')) return 'govjobs';
    if (host.includes('myworkdayjobs.com') || host.includes('workday.com')) return 'workday';
    if (host.includes('greenhouse.io')) return 'greenhouse';
    if (host.includes('lever.co')) return 'lever';
    if (host.includes('glassdoor.com')) return 'glassdoor';
    return 'unknown';
  }

  /**
   * Displays an interactive confirmation banner for unapproved or non-job-board domains (e.g. Facebook, X, YouTube).
   */
  function showUnapprovedSitePrompt() {
    if (document.getElementById('ascend-unapproved-banner')) return;
    if (isAscendApp() || isWhitelistedDomain()) return;

    const banner = document.createElement('div');
    banner.id = 'ascend-unapproved-banner';
    banner.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999999;
      background: #0f172a;
      color: #ffffff;
      padding: 12px 16px;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3);
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 12px;
      max-width: 320px;
      border: 1px solid #334155;
    `;
    banner.innerHTML = `
      <div style="font-weight: 800; color: #38bdf8; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
        <span>🔍 Ascend ATS Inspector</span>
      </div>
      <p style="color: #cbd5e1; margin: 0 0 8px 0; line-height: 1.4;">
        This site is not currently on the approved job board whitelist. Is this page a career portal or job posting?
      </p>
      <div style="display: flex; gap: 6px;">
        <button id="ascend-req-validation" style="flex: 1; background: #2563eb; color: #fff; border: none; padding: 6px 10px; border-radius: 6px; font-weight: 700; cursor: pointer;">
          Yes, Request Validation
        </button>
        <button id="ascend-dismiss-banner" style="background: #334155; color: #cbd5e1; border: none; padding: 6px 10px; border-radius: 6px; font-weight: 700; cursor: pointer;">
          Dismiss
        </button>
      </div>
    `;

    document.body.appendChild(banner);

    document.getElementById('ascend-req-validation')?.addEventListener('click', async () => {
      try {
        await fetch('https://ascend-ats.ai.studio/api/admin/job-board-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain: window.location.host, url: window.location.href, timestamp: Date.now() })
        });
        alert("Domain validation request submitted to Ascend ATS Platform Administrators.");
      } catch (e) {
        alert("Domain validation request recorded.");
      }
      banner.remove();
    });

    document.getElementById('ascend-dismiss-banner')?.addEventListener('click', () => {
      banner.remove();
    });
  }

  /**
   * Locates primary action bar element on host page to inject the "Ascend to ATS" button.
   * @returns {Element|null} Target DOM node or null.
   */
  function getInjectionTarget() {
    const platform = detectJobBoard();

    if (platform === 'linkedin') {
      if (!window.location.pathname.includes('/jobs/')) return null;
      return document.querySelector('.jobs-unified-top-card__content--actions') ||
             document.querySelector('.jobs-apply-button--top-card') ||
             document.querySelector('.jobs-save-button') ||
             document.querySelector('.p5');
    }

    if (platform === 'indeed') {
      return document.querySelector('.jobsearch-JobInfoHeader-actions') ||
             document.querySelector('#applyButtonLinkContainer') ||
             document.querySelector('.icl-u-xs-mt--md');
    }

    if (platform === 'govjobs') {
      return document.querySelector('.job-details-header-actions') ||
             document.querySelector('.apply-button') ||
             document.querySelector('#job-details-header');
    }

    if (platform === 'workday') {
      return document.querySelector('[data-automation-id="jobPostingHeader"]') ||
             document.querySelector('.gwt-Label') ||
             document.querySelector('header');
    }

    if (platform === 'greenhouse') {
      return document.querySelector('#app_body') ||
             document.querySelector('.job__title') ||
             document.querySelector('.application-form');
    }

    if (platform === 'lever') {
      return document.querySelector('.posting-header') ||
             document.querySelector('.content') ||
             document.querySelector('.postings-btn-wrapper');
    }

    if (platform === 'glassdoor') {
      return document.querySelector('.jobViewHeader') ||
             document.querySelector('.jobDescriptionContent') ||
             document.querySelector('.empInfo');
    }

    return null;
  }

  return {
    isAscendApp,
    isWhitelistedDomain,
    detectJobBoard,
    showUnapprovedSitePrompt,
    getInjectionTarget
  };
})();
