/**
 * @fileoverview Ascend ATS Ingestion Bridge - Content Script Orchestrator.
 * Delegates to modular sub-components: SiteDetector, Scrapers, OverlayModal, and SessionObserver.
 * NASA JPL Rule 1 & Rule 4: Compact function length (< 60 lines) and linear control flow.
 */

(function() {
  const Bridge = window.AscendBridge;
  if (!Bridge) return;

  // 1. Session Synchronization on Ascend ATS Web App Pages
  if (Bridge.SiteDetector.isAscendApp()) {
    Bridge.SessionObserver.init();
    return;
  }

  // 2. Injected "Ascend to ATS" Action Button
  function injectButton() {
    if (document.getElementById('ascend-ingest-btn')) return;

    const target = Bridge.SiteDetector.getInjectionTarget();
    if (!target) return;

    const btn = document.createElement('button');
    btn.id = 'ascend-ingest-btn';
    btn.className = 'ascend-action-btn';
    btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2l3.5 6h-7L12 2zM12 22l-3.5-6h7L12 22zM2 12l6-3.5v7L2 12zM22 12l-6 3.5v-7L22 12z"/>
      </svg>
      <span>Ascend to ATS</span>
    `;

    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const jobData = Bridge.Scrapers.scrapeCurrentPage();
      Bridge.OverlayModal.showReviewOverlay(jobData, 'v2', 'seeker', false);
    };

    target.appendChild(btn);
  }

  // 3. Dynamic SPA URL Observation & Periodic Injection Fallback
  let lastUrl = window.location.href;
  const observer = new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      setTimeout(injectButton, 1000);
    }
    injectButton();
  });

  observer.observe(document.body || document.documentElement, { subtree: true, childList: true });
  setInterval(injectButton, 3000);

  // 4. Runtime Message Listener (Popup & Background communication)
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "TRIGGER_INGEST") {
      const data = Bridge.Scrapers.scrapeCurrentPage();
      Bridge.OverlayModal.showReviewOverlay(
        data,
        request.promptVersion || 'v2',
        request.role || 'seeker',
        Boolean(request.isRequisition)
      );
      sendResponse({ status: "Inbound ingestion triggered" });
    } else if (request.action === "ASSESS_FIT") {
      const pageData = Bridge.Scrapers.scrapeCurrentPage();
      const fit = Bridge.Scrapers.assessPageFit();
      sendResponse({
        jobData: pageData,
        ...fit
      });
    }
    return true;
  });

  // Initial injection attempt
  injectButton();
})();
