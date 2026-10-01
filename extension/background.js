/**
 * Ascend Ingestion Bridge - Background Service Worker
 */

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "ascend-to-ats",
    title: "Ascend to ATS",
    contexts: ["page", "selection", "link"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "ascend-to-ats") {
    // Send message to content script in the active tab to trigger ingestion
    chrome.tabs.sendMessage(tab.id, { action: "TRIGGER_INGEST" }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn("Content script not ready or not matched by manifest");
        // Fallback or alert if needed
      }
    });
  }
});
