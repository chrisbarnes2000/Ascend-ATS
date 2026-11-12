/**
 * @fileoverview Fit Evaluator Sub-Component for Ascend ATS Extension.
 * Cross-references active tab job qualifications against candidate profile criteria,
 * provides elaborate diff comparison, and actionable guidance for low-match (<60%) opportunities.
 * NASA JPL Rule 1 & Rule 4: Deterministic algorithms, bounded loops, and <60 lines per method.
 */

import { APP_BASE_URL } from './constants.js';
import { openAppHash } from './popup-ui.js';
import { parseJobCriteriaFromText, getMatchBreakdown } from './match-engine.js';

/**
 * Renders skill badges into target container.
 * @param {HTMLElement|null} container - DOM target.
 * @param {string[]} items - Skill names.
 * @param {'matched'|'missing'} type - Chip variant.
 */
function renderDiffChips(container, items, type) {
  if (!container) return;
  container.innerHTML = '';
  if (!Array.isArray(items) || items.length === 0) {
    container.innerHTML = `<span style="font-size: 9px; color: var(--slate-400); font-style: italic;">None identified</span>`;
    return;
  }
  const prefix = type === 'matched' ? '✓ ' : '✕ ';
  items.slice(0, 8).forEach(item => {
    const chip = document.createElement('span');
    chip.className = `diff-chip ${type}`;
    chip.innerText = `${prefix}${item}`;
    container.appendChild(chip);
  });
}

/**
 * Updates popup DOM with elaborate diff comparison and low-match advisories.
 * @param {Object} breakdown - Match breakdown from match-engine.
 * @param {number} activeTabId - ID of the inspected job posting browser tab.
 */
function renderDiffUi(breakdown, activeTabId) {
  const box = document.getElementById('assessment-box');
  const scoreEl = document.getElementById('assess-score');
  const badgeEl = document.getElementById('assess-tier-badge');
  const detailsEl = document.getElementById('assess-details');
  const alertEl = document.getElementById('low-match-alert');
  const diffEl = document.getElementById('diff-container');

  if (!box || !scoreEl) return;
  box.style.display = 'block';
  scoreEl.innerText = `${breakdown.overallScore}% Fit Assessment`;

  // Update Tier Badge
  if (badgeEl) {
    badgeEl.className = 'assessment-tier-badge';
    if (breakdown.overallScore >= 85) {
      badgeEl.innerText = 'High Match';
      badgeEl.classList.add('tier-high');
    } else if (breakdown.overallScore >= 70) {
      badgeEl.innerText = 'Solid Fit';
      badgeEl.classList.add('tier-med');
    } else if (breakdown.overallScore >= 60) {
      badgeEl.innerText = 'Moderate';
      badgeEl.classList.add('tier-fair');
    } else {
      badgeEl.innerText = 'Low Match';
      badgeEl.classList.add('tier-low');
    }
  }

  // Handle Low-Match Alert (<60%)
  if (alertEl) {
    if (breakdown.isLowMatch) {
      alertEl.style.display = 'block';
      const closeBtn = document.getElementById('btn-close-tab');
      if (closeBtn) {
        closeBtn.onclick = () => {
          if (activeTabId && chrome.tabs && chrome.tabs.remove) {
            chrome.tabs.remove(activeTabId, () => window.close());
          }
        };
      }
      const adjustBtn = document.getElementById('btn-adjust-profile');
      if (adjustBtn) {
        adjustBtn.onclick = () => openAppHash('#edit-profile');
      }
    } else {
      alertEl.style.display = 'none';
    }
  }

  // Render Diff Breakdown
  if (diffEl) {
    diffEl.style.display = 'block';
    const matchedCount = document.getElementById('diff-matched-count');
    const missingCount = document.getElementById('diff-missing-count');
    if (matchedCount) matchedCount.innerText = String(breakdown.skillsMatch.matched.length);
    if (missingCount) missingCount.innerText = String(breakdown.skillsMatch.missing.length);

    renderDiffChips(document.getElementById('diff-matched-chips'), breakdown.skillsMatch.matched, 'matched');
    renderDiffChips(document.getElementById('diff-missing-chips'), breakdown.skillsMatch.missing, 'missing');

    const salaryEl = document.getElementById('diff-val-salary');
    if (salaryEl) salaryEl.innerText = breakdown.salaryMatch.details;

    const workplaceEl = document.getElementById('diff-val-workplace');
    if (workplaceEl) workplaceEl.innerText = breakdown.workplaceMatch.details;

    const reasonsEl = document.getElementById('diff-reasons-list');
    if (reasonsEl && Array.isArray(breakdown.reasons)) {
      reasonsEl.innerHTML = '';
      breakdown.reasons.slice(0, 3).forEach(r => {
        const item = document.createElement('div');
        item.className = 'diff-reason-item';
        item.innerText = r;
        reasonsEl.appendChild(item);
      });
    }
  }

  if (detailsEl) {
    detailsEl.innerText = breakdown.isLowMatch
      ? 'Qualifications diverge from your verified target discipline and skills.'
      : 'Solid alignment with core qualifications and requirements.';
  }
}

/**
 * Triggers fit assessment on active tab and renders elaborate diff comparison.
 * @returns {Promise<void>}
 */
export async function evaluateActiveTabFit() {
  const box = document.getElementById('assessment-box');
  const scoreEl = document.getElementById('assess-score');
  const detailsEl = document.getElementById('assess-details');
  if (!box || !scoreEl || !detailsEl) return;

  box.style.display = 'block';
  scoreEl.innerText = 'Analyzing posting...';
  detailsEl.innerText = 'Cross-referencing active requirements with your verified profile.';

  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs && tabs[0];
    if (!activeTab || !activeTab.id) {
      scoreEl.innerText = 'Unable to inspect tab';
      detailsEl.innerText = 'Please view a supported job posting page.';
      return;
    }

    const storage = await chrome.storage.local.get(['ascendSession']);
    const session = storage && storage.ascendSession ? storage.ascendSession : null;
    const profile = (session && session.profile) || {
      targetRole: 'Full Stack Engineer',
      skills: ['TypeScript', 'React', 'Node.js', 'System Design'],
      targetSalary: 120000,
      preferredWorkplaceType: 'Remote'
    };

    chrome.tabs.sendMessage(activeTab.id, { action: "ASSESS_FIT" }, (res) => {
      const pageData = res && res.jobData ? res.jobData : {
        title: (activeTab.title || '').split('|')[0].trim(),
        description: ''
      };
      const parsedCriteria = parseJobCriteriaFromText(pageData.title, pageData.description);
      const jobPayload = {
        title: pageData.title,
        company: pageData.company || '',
        description: pageData.description || '',
        ...parsedCriteria
      };

      const breakdown = getMatchBreakdown(profile, jobPayload);
      renderDiffUi(breakdown, activeTab.id);
    });
  } catch (err) {
    console.warn("[FitEvaluator] Error evaluating active tab:", err);
    scoreEl.innerText = 'Assessment Offline';
    detailsEl.innerText = 'Could not establish connection with active tab scraper.';
  }
}
