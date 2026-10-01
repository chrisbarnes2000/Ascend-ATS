/**
 * Ascend ATS Ingestion Bridge - Content Script
 */

(function() {
  console.log("Ascend Ingestion Bridge Active");

  // Keep track of the current URL to re-inject when it changes
  let lastUrl = location.href;
  
  // Use a more aggressive observer and a fallback interval
  const observer = new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      onUrlChange();
    }
    injectButton(); // Attempt injection on every DOM change
  });
  
  observer.observe(document.body || document.documentElement, { 
    subtree: true, 
    childList: true 
  });

  // Fallback polling for injection
  setInterval(injectButton, 3000);

  function onUrlChange() {
    console.log("URL Changed, re-injecting...");
    setTimeout(injectButton, 1000);
  }

  function injectButton() {
    if (document.getElementById('ascend-ingest-btn')) return;

    let target;
    const host = location.host;

    if (host.includes('linkedin.com')) {
      // Check if we are on a job page
      if (!location.pathname.includes('/jobs/')) return;
      
      target = document.querySelector('.jobs-unified-top-card__content--actions') || 
               document.querySelector('.jobs-apply-button--top-card') ||
               document.querySelector('.jobs-save-button') ||
               document.querySelector('.p5'); // Fallback container
    } else if (host.includes('indeed.com')) {
      // Indeed can have jobs on /viewjob or /jobs or /rc/clk
      target = document.querySelector('.jobsearch-JobInfoHeader-actions') || 
               document.querySelector('#applyButtonLinkContainer') ||
               document.querySelector('.icl-u-xs-mt--md'); // Fallback container
    } else if (host.includes('governmentjobs.com')) {
      target = document.querySelector('.job-details-header-actions') || 
               document.querySelector('.apply-button') ||
               document.querySelector('#job-details-header');
    }

    if (target) {
      console.log("Found injection target:", target);
      const btn = document.createElement('button');
      btn.id = 'ascend-ingest-btn';
      btn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2l3.5 6h-7L12 2zM12 22l-3.5-6h7L12 22zM2 12l6-3.5v7L2 12zM22 12l-6 3.5v-7L22 12z"/>
        </svg>
        <span>Ascend to ATS</span>
      `;
      btn.className = 'ascend-action-btn';
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleIngest();
      };
      
      // Attempt to append to the end of the action bar
      target.appendChild(btn);
    }
  }

  function scrapeData() {
    let title = '';
    let company = '';
    let description = '';
    let url = location.href;

    if (location.host.includes('linkedin.com')) {
      title = document.querySelector('.jobs-unified-top-card__job-title')?.innerText || 
              document.querySelector('h1.t-24')?.innerText || '';
      company = document.querySelector('.jobs-unified-top-card__company-name')?.innerText || 
                document.querySelector('.jobs-unified-top-card__primary-description a')?.innerText || '';
      description = document.querySelector('.jobs-description')?.innerText || 
                    document.querySelector('.jobs-description-content__text')?.innerText || '';
    } else if (location.host.includes('indeed.com')) {
      title = document.querySelector('.jobsearch-JobInfoHeader-title')?.innerText || 
              document.querySelector('h1')?.innerText || '';
      company = document.querySelector('div[data-company-name="true"]')?.innerText || 
                document.querySelector('.jobsearch-InlineCompanyRating')?.innerText || 
                document.querySelector('.jobsearch-CompanyReview--withborder')?.innerText || '';
      description = document.querySelector('#jobDescriptionText')?.innerText || 
                    document.querySelector('.jobsearch-jobDescriptionText')?.innerText || '';
    } else if (location.host.includes('governmentjobs.com')) {
      title = document.querySelector('.entity-title')?.innerText || 
              document.querySelector('#job-title')?.innerText || 
              document.querySelector('h1.title')?.innerText || '';
              
      company = document.querySelector('.agency-name dd')?.innerText || 
                document.querySelector('#agency-name')?.innerText || 
                document.querySelector('.brand-name .page-title')?.innerText || '';

      // Extract granular summary details (Salary, Job Number, Dept, etc.)
      const summaryBlocks = document.querySelectorAll('.term-block');
      let summaryText = '';
      summaryBlocks.forEach(block => {
        const label = block.querySelector('.term-description')?.innerText || 
                      block.querySelector('.span4 div')?.innerText;
        const value = block.querySelector('.span8 p')?.innerText;
        if (label && value) {
          summaryText += `${label.trim()}: ${value.trim()}\n`;
        }
      });

      const mainContent = document.querySelector('#details-info')?.innerText || 
                        document.querySelector('.job-details-content')?.innerText || '';
      
      const benefitsContent = document.querySelector('#details-benefits')?.innerText || '';
      
      description = `${summaryText}\nDESCRIPTION:\n${mainContent}\n\nBENEFITS:\n${benefitsContent}`;
    }

    return { title: title.trim(), company: company.trim(), description: description.trim(), url };
  }

  // Listen for messages from popup or background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "TRIGGER_INGEST") {
      handleIngest();
      sendResponse({ status: "Inbound ingestion triggered" });
    }
    return true;
  });

  function handleIngest() {
    const data = scrapeData();
    showReviewOverlay(data);
  }

  function showReviewOverlay(data) {
    const overlay = document.createElement('div');
    overlay.id = 'ascend-review-overlay';
    overlay.innerHTML = `
      <div class="ascend-modal">
        <div class="ascend-header">
          <div class="ascend-brand">
             <div class="ascend-logo">A</div>
             <h3>Review Job Ingestion</h3>
          </div>
          <button class="ascend-close">&times;</button>
        </div>
        <div class="ascend-body">
          <div class="ascend-field">
            <label>Position Title</label>
            <input type="text" id="ascend-title" value="${data.title.replace(/"/g, '&quot;')}">
          </div>
          <div class="ascend-field">
            <label>Company Name</label>
            <input type="text" id="ascend-company" value="${data.company.replace(/"/g, '&quot;')}">
          </div>
          <div class="ascend-field">
            <label>Job Description Preview</label>
            <textarea id="ascend-desc">${data.description.substring(0, 1000)}...</textarea>
          </div>
          <p class="ascend-hint">This data will be processed by Ascend AI for matching and pipeline analysis.</p>
        </div>
        <div class="ascend-footer">
          <button class="ascend-btn-cancel">Cancel</button>
          <button class="ascend-btn-confirm">Confirm & Ingest</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('.ascend-close').onclick = () => overlay.remove();
    overlay.querySelector('.ascend-btn-cancel').onclick = () => overlay.remove();
    overlay.querySelector('.ascend-btn-confirm').onclick = () => {
      const finalData = {
        ...data,
        title: document.getElementById('ascend-title').value,
        company: document.getElementById('ascend-company').value,
        description: document.getElementById('ascend-desc').value
      };
      submitToAscend(finalData, overlay);
    };
  }

  async function submitToAscend(data, overlay) {
    const confirmBtn = overlay.querySelector('.ascend-btn-confirm');
    confirmBtn.innerText = 'Ingesting...';
    confirmBtn.disabled = true;

    try {
      const isGovJobs = location.host.includes('governmentjobs.com');
      const boardType = isGovJobs ? 'govjobs' : (location.host.includes('linkedin') ? 'linkedin' : 'indeed');

      const payload = {
        url: data.url,
        pastedText: isGovJobs ? data.description : `LINKEDIN_SCRAPE:|${data.company}|${data.title}|\n\n${data.description}`,
        boardType: boardType
      };

      // We try to hit the dev server URL or the production URL
      const targetUrl = 'https://ais-dev-hxvjrue22mivfrz5oy7q2w-154621295711.us-east5.run.app/api/ingest-job';
      
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        confirmBtn.innerText = 'Success!';
        confirmBtn.style.backgroundColor = '#10b981';
        setTimeout(() => overlay.remove(), 1500);
      } else {
        throw new Error("Server rejected ingestion");
      }
    } catch (err) {
      console.error("Ascend Ingestion Failed", err);
      confirmBtn.innerText = 'Error - Try Again';
      confirmBtn.disabled = false;
    }
  }

  // Initial injection
  onUrlChange();
})();
