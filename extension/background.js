/**
 * @fileoverview Ascend Ingestion Bridge - Background Service Worker (Manifest V3).
 * Registers context menu triggers ("Ascend to ATS") and dispatches ingestion actions to active tabs.
 * NASA JPL Rule 1: Simple linear control flow and deterministic error handling.
 */

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "ascend-to-ats",
    title: "Ascend to ATS",
    contexts: ["page", "selection", "link"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "ascend-to-ats" && tab && tab.id) {
    // Send message to content script in the active tab to trigger ingestion
    chrome.tabs.sendMessage(tab.id, { action: "TRIGGER_INGEST" }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn("[BackgroundServiceWorker] Content script not ready on active tab:", chrome.runtime.lastError.message);
      }
    });
  }
});
