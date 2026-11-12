/**
 * @fileoverview Ingestion Transport Service for Ascend ATS Content Scripts.
 * Formats, normalizes, and posts scraped job postings to the Ascend ingestion endpoint.
 * NASA JPL Rule 1 & Rule 7: Linear async control flow and strict error reporting.
 */

window.AscendBridge = window.AscendBridge || {};

window.AscendBridge.IngestTransport = (function() {
  const INGEST_ENDPOINT = 'https://ascend-ats.ai.studio/api/ingest-job';

  /**
   * Submits a structured job payload to the Ascend ATS backend.
   *
   * @param {{
   *   url: string,
   *   title: string,
   *   company: string,
   *   description: string,
   *   promptVersion?: string,
   *   isRequisition?: boolean
   * }} data - Job attributes extracted and reviewed from the page.
   * @param {function(): void} [onStart] - Callback when network request begins.
   * @param {function(): void} [onSuccess] - Callback when server accepts ingestion.
   * @param {function(string): void} [onError] - Callback with failure reason.
   * @returns {Promise<void>}
   */
  async function submitJob(data, onStart, onSuccess, onError) {
    if (typeof onStart === 'function') onStart();

    try {
      const isGovJobs = window.location.host.includes('governmentjobs.com');
      const isLinkedIn = window.location.host.includes('linkedin.com');
      const boardType = isGovJobs ? 'govjobs' : (isLinkedIn ? 'linkedin' : 'indeed');

      const payload = {
        url: data.url || window.location.href,
        pastedText: isGovJobs
          ? data.description
          : `LINKEDIN_SCRAPE:|${data.company}|${data.title}|\n\n${data.description}`,
        boardType: boardType,
        promptVersion: data.promptVersion || 'v2',
        isRequisition: Boolean(data.isRequisition)
      };

      const response = await fetch(INGEST_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        if (typeof onSuccess === 'function') onSuccess();
      } else {
        throw new Error(`Server returned HTTP ${response.status}`);
      }
    } catch (err) {
      console.error("[IngestTransport] Ingestion failed:", err);
      if (typeof onError === 'function') onError(err.message || 'Network error');
    }
  }

  return {
    submitJob,
    INGEST_ENDPOINT
  };
})();
