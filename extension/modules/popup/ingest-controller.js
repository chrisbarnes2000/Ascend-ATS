/**
 * @fileoverview Ingestion Controller for Ascend ATS Extension.
 * Dispatches ingest triggers to the active browser tab's content script.
 * NASA JPL Rule 1 & Rule 7: Linear control flow and defensive parameter handling.
 */

/**
 * Sends a message to the active tab to trigger the Ascend ingestion flow.
 *
 * @param {boolean} isRequisition - If true, imports as an employer requisition; if false, candidate application.
 * @param {Object|null} session - Active user session.
 * @param {string} promptVersion - Selected prompt version (e.g. 'v1', 'v2', 'v3').
 * @param {string} role - Current active role ('seeker', 'recruiter', 'admin').
 * @param {function(): void} [onSuccess] - Callback executed on successful dispatch.
 * @param {function(string): void} [onError] - Callback executed if dispatch fails.
 * @returns {Promise<void>}
 */
export async function triggerTabIngest(
  isRequisition = false,
  session,
  promptVersion = 'v2',
  role = 'seeker',
  onSuccess = () => {},
  onError = () => {}
) {
  if (!session) {
    onError("Authentication required before initiating job ingestion.");
    return;
  }

  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs && tabs[0];

    if (!activeTab || !activeTab.id) {
      onError("No active browser tab found.");
      return;
    }

    chrome.tabs.sendMessage(activeTab.id, {
      action: "TRIGGER_INGEST",
      promptVersion: promptVersion,
      role: role,
      isRequisition: Boolean(isRequisition),
      userSession: session
    }, (response) => {
      if (chrome.runtime.lastError) {
        onError("Please refresh the job page to activate the Ascend Bridge on this tab.");
      } else {
        onSuccess();
      }
    });
  } catch (err) {
    console.warn("[IngestController] Error triggering tab ingest:", err);
    onError("Failed to communicate with active tab.");
  }
}
