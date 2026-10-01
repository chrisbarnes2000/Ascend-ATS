/**
 * Ascend Ingestion Bridge - Popup Script
 */

document.getElementById('import-btn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (tab) {
    chrome.tabs.sendMessage(tab.id, { action: "TRIGGER_INGEST" }, (response) => {
      if (chrome.runtime.lastError) {
        alert("Please refresh the page to enable ingestion on this tab.");
      } else {
        window.close(); // Close popup after triggering
      }
    });
  }
});
