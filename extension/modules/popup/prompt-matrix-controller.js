/**
 * @fileoverview Prompt Matrix Controller for Ascend ATS Extension.
 * Manages 3-tier prompt version selection (V1 Fast, V2 Taxonomy, V3 Executive),
 * persistence in chrome.storage, and DOM latency indicator updates.
 * NASA JPL Rule 1 & Rule 4: Compact function length and deterministic state transitions.
 */

import { PROMPT_INFO } from './constants.js';

/**
 * Updates the prompt tier state, persists choice in extension storage, and updates DOM elements.
 *
 * @param {'v1'|'v2'|'v3'} version - Selected prompt version key.
 * @param {function(string): void} [onChangeCallback] - Optional callback notified of version change.
 */
export function setPromptVersion(version, onChangeCallback) {
  const selectedVersion = (version === 'v1' || version === 'v3') ? version : 'v2';

  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ ascendPromptVersion: selectedVersion });
  }

  // Update prompt selection buttons
  const buttons = document.querySelectorAll('.prompt-btn');
  buttons.forEach(button => {
    const isTarget = button.getAttribute('data-version') === selectedVersion;
    button.classList.toggle('active', isTarget);
  });

  // Update latency and descriptive text
  const info = PROMPT_INFO[selectedVersion] || PROMPT_INFO.v2;
  const latencyEl = document.getElementById('prompt-latency');
  const descEl = document.getElementById('prompt-desc-text');

  if (latencyEl) {
    latencyEl.innerText = info.latency;
  }
  if (descEl) {
    descEl.innerHTML = info.desc;
  }

  if (typeof onChangeCallback === 'function') {
    onChangeCallback(selectedVersion);
  }
}

/**
 * Initializes prompt matrix button listeners and restores saved version from chrome.storage.
 *
 * @param {function(string): void} onVersionChange - Callback invoked when the user selects a prompt tier.
 */
export function initPromptMatrix(onVersionChange) {
  const buttons = document.querySelectorAll('.prompt-btn');
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      const version = button.getAttribute('data-version') || 'v2';
      setPromptVersion(version, onVersionChange);
    });
  });

  // Restore saved choice from storage
  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['ascendPromptVersion'], (res) => {
      if (res && res.ascendPromptVersion) {
        setPromptVersion(res.ascendPromptVersion, onVersionChange);
      }
    });
  }
}
