/**
 * @fileoverview Review Overlay Modal Sub-Component for Ascend ATS Content Scripts.
 * Enforces mandatory pre-ingestion fit comparison before allowing job ingestion or application.
 * WCAG 2.1 AA compliant: dialog semantics, Escape key dismissal, focus management.
 */

window.AscendBridge = window.AscendBridge || {};

window.AscendBridge.OverlayModal = (function() {
  /**
   * Constructs and mounts the floating review overlay into the host page DOM.
   *
   * @param {{ title: string, company: string, description: string, url: string }} data - Scraped job attributes.
   * @param {'v1'|'v2'|'v3'} [initialPromptVersion='v2'] - Starting prompt matrix tier.
   * @param {'seeker'|'recruiter'|'admin'} [role='seeker'] - Active role space.
   * @param {boolean} [isRequisition=false] - Whether ingestion target is an employer requisition.
   */
  function showReviewOverlay(data, initialPromptVersion = 'v2', role = 'seeker', isRequisition = false) {
    const existing = document.getElementById('ascend-review-overlay');
    if (existing) existing.remove();

    let currentVersion = initialPromptVersion || 'v2';

    const overlay = document.createElement('div');
    overlay.id = 'ascend-review-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'ascend-modal-heading');

    const cleanTitle = (data.title || '').replace(/"/g, '&quot;');
    const cleanCompany = (data.company || '').replace(/"/g, '&quot;');
    const cleanDescPreview = (data.description || '').substring(0, 1000);

    overlay.innerHTML = `
      <div class="ascend-modal" style="max-height: 90vh; overflow-y: auto;">
        <div class="ascend-header">
          <div class="ascend-brand">
             <div class="ascend-logo">A</div>
             <div>
               <h3 id="ascend-modal-heading">Mandatory Fit & Ingestion Review</h3>
               <span>
                 ${isRequisition ? '🏢 Target: Employer Requisition' : '🎯 Target: Candidate Applications'}
               </span>
             </div>
          </div>
          <button type="button" class="ascend-close" aria-label="Close dialog">&times;</button>
        </div>
        <div class="ascend-body">
          <!-- Mandatory Pre-Ingestion Fit Assessment Box -->
          <div id="ascend-overlay-fit-box" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase;">Pre-Ingestion Fit Check</span>
              <span id="ascend-overlay-score-badge" style="font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 9999px; background: #e2e8f0; color: #334155;">Analyzing...</span>
            </div>
            <div id="ascend-overlay-fit-details" style="font-size: 11px; color: #64748b; line-height: 1.4;">
              Cross-referencing active requirements against your verified master profile before ingestion.
            </div>

            <!-- Low Match Warning (<60%) -->
            <div id="ascend-overlay-low-match" style="display: none; background: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px; padding: 10px; margin-top: 8px;">
              <div style="font-size: 11px; font-weight: 800; color: #be123c; margin-bottom: 4px;">
                ⚠️ Low Match Warning (&lt; 60%)
              </div>
              <p style="font-size: 10px; color: #881337; margin: 0 0 8px 0; line-height: 1.35;">
                This position diverges from your target role or requirements. Consider closing this tab or adjusting your profile before ingesting.
              </p>
              <div style="display: flex; gap: 6px; margin-bottom: 8px;">
                <button type="button" id="ascend-ov-close-tab" style="flex: 1; background: #e11d48; color: #fff; border: none; border-radius: 6px; padding: 6px; font-size: 10px; font-weight: 700; cursor: pointer;">
                  Close Tab
                </button>
                <button type="button" id="ascend-ov-adjust" style="flex: 1; background: #fff; color: #be123c; border: 1px solid #fda4af; border-radius: 6px; padding: 6px; font-size: 10px; font-weight: 700; cursor: pointer;">
                  Adjust Profile
                </button>
              </div>
              <label style="display: flex; align-items: center; gap: 6px; font-size: 10px; font-weight: 700; color: #9f1239; cursor: pointer;">
                <input type="checkbox" id="ascend-override-checkbox"> I understand this is a low match and still wish to ingest.
              </label>
            </div>
          </div>

          <!-- Prompt Tier Selector -->
          <div class="ascend-tier-box">
            <div class="ascend-tier-header">
              <span class="ascend-tier-label">Prompt Ingestion Tier:</span>
              <span class="ascend-tier-badge" id="ascend-overlay-tier-badge">
                ${currentVersion === 'v3' ? 'V3 Executive' : (currentVersion === 'v1' ? 'V1 Fast' : 'V2 Semantic')}
              </span>
            </div>
            <div class="ascend-tier-opts">
              <button type="button" class="ascend-tier-opt ${currentVersion === 'v1' ? 'active' : ''}" data-v="v1">V1 Fast</button>
              <button type="button" class="ascend-tier-opt ${currentVersion === 'v2' ? 'active' : ''}" data-v="v2">V2 Semantic</button>
              <button type="button" class="ascend-tier-opt ${currentVersion === 'v3' ? 'active' : ''}" data-v="v3">V3 Executive</button>
            </div>
          </div>

          <div class="ascend-field">
            <label for="ascend-title">Position Title</label>
            <input type="text" id="ascend-title" value="${cleanTitle}">
          </div>
          <div class="ascend-field">
            <label for="ascend-company">Company Name</label>
            <input type="text" id="ascend-company" value="${cleanCompany}">
          </div>
          <div class="ascend-field">
            <label for="ascend-desc">Job Description Preview</label>
            <textarea id="ascend-desc">${cleanDescPreview}...</textarea>
          </div>
        </div>
        <div class="ascend-footer">
          <button type="button" class="ascend-btn-cancel">Cancel</button>
          <button type="button" class="ascend-btn-confirm" id="ascend-confirm-btn" style="opacity: 0.6; cursor: not-allowed;" disabled>Compute Fit to Ingest</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    let evaluatedMatchScore = 85;
    let isLowMatch = false;

    chrome.storage.local.get(['ascendSession'], (res) => {
      const session = res && res.ascendSession ? res.ascendSession : null;
      const profile = (session && session.profile) || {
        targetRole: 'Full Stack Engineer',
        skills: ['TypeScript', 'React', 'Node.js', 'System Design'],
        targetSalary: 120000,
        preferredWorkplaceType: 'Remote'
      };

      const combinedText = `${data.title} ${data.description}`.toLowerCase();
      const candSkills = profile.skills || [];
      const matched = candSkills.filter((s) => {
        const name = typeof s === 'string' ? s : (s && s.name ? s.name : '');
        return combinedText.includes(name.toLowerCase());
      });

      evaluatedMatchScore = Math.min(98, Math.max(25, 45 + (matched.length * 8)));
      isLowMatch = evaluatedMatchScore < 60;

      const badge = overlay.querySelector('#ascend-overlay-score-badge');
      const details = overlay.querySelector('#ascend-overlay-fit-details');
      const lowMatchBox = overlay.querySelector('#ascend-overlay-low-match');
      const confirmBtn = overlay.querySelector('#ascend-confirm-btn');

      if (badge) {
        badge.innerText = `${evaluatedMatchScore}% Match`;
        badge.style.background = isLowMatch ? '#ffe4e6' : '#dcfce7';
        badge.style.color = isLowMatch ? '#be123c' : '#15803d';
      }

      if (details) {
        details.innerText = matched.length > 0
          ? `Matched competencies: ${matched.slice(0, 4).join(', ')}.`
          : `General alignment evaluated for ${data.title || 'Role'}.`;
      }

      if (isLowMatch && lowMatchBox) {
        lowMatchBox.style.display = 'block';
        overlay.querySelector('#ascend-ov-close-tab').onclick = () => window.close();
        overlay.querySelector('#ascend-ov-adjust').onclick = () => {
          window.open('https://ascend-ats.ai.studio/#edit-profile', '_blank');
        };

        const checkbox = overlay.querySelector('#ascend-override-checkbox');
        checkbox.onchange = () => {
          if (checkbox.checked) {
            confirmBtn.disabled = false;
            confirmBtn.style.opacity = '1';
            confirmBtn.style.cursor = 'pointer';
            confirmBtn.innerText = 'Confirm & Ingest (Low Match)';
          } else {
            confirmBtn.disabled = true;
            confirmBtn.style.opacity = '0.6';
            confirmBtn.style.cursor = 'not-allowed';
            confirmBtn.innerText = 'Resolve Low Match to Ingest';
          }
        };
      } else {
        if (confirmBtn) {
          confirmBtn.disabled = false;
          confirmBtn.style.opacity = '1';
          confirmBtn.style.cursor = 'pointer';
          confirmBtn.innerText = 'Confirm & Ingest';
        }
      }
    });

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        overlay.remove();
        document.removeEventListener('keydown', onKeyDown);
      }
    };
    document.addEventListener('keydown', onKeyDown);

    overlay.querySelectorAll('.ascend-tier-opt').forEach(btn => {
      btn.onclick = () => {
        currentVersion = btn.getAttribute('data-v') || 'v2';
        overlay.querySelectorAll('.ascend-tier-opt').forEach(b => {
          b.classList.toggle('active', b.getAttribute('data-v') === currentVersion);
        });
        const badge = overlay.querySelector('#ascend-overlay-tier-badge');
        if (badge) {
          badge.innerText = currentVersion === 'v3' ? 'V3 Executive' : (currentVersion === 'v1' ? 'V1 Fast' : 'V2 Semantic');
        }
      };
    });

    const closeOverlay = () => {
      overlay.remove();
      document.removeEventListener('keydown', onKeyDown);
    };

    overlay.querySelector('.ascend-close').onclick = closeOverlay;
    overlay.querySelector('.ascend-btn-cancel').onclick = closeOverlay;

    const confirmBtn = overlay.querySelector('#ascend-confirm-btn');
    confirmBtn.onclick = () => {
      if (confirmBtn.disabled) return;

      const finalTitle = document.getElementById('ascend-title')?.value || data.title;
      const finalCompany = document.getElementById('ascend-company')?.value || data.company;
      const finalDesc = document.getElementById('ascend-desc')?.value || data.description;

      const payload = {
        url: data.url,
        title: finalTitle,
        company: finalCompany,
        description: finalDesc,
        promptVersion: currentVersion,
        isRequisition: isRequisition,
        matchScore: evaluatedMatchScore / 100
      };

      if (window.AscendBridge && window.AscendBridge.IngestTransport) {
        window.AscendBridge.IngestTransport.submitJob(
          payload,
          () => {
            confirmBtn.innerText = 'Ingesting with Fit Data...';
            confirmBtn.disabled = true;
          },
          () => {
            confirmBtn.innerText = 'Success!';
            confirmBtn.style.backgroundColor = '#059669';
            setTimeout(closeOverlay, 1400);
          },
          () => {
            confirmBtn.innerText = 'Error - Try Again';
            confirmBtn.disabled = false;
          }
        );
      }
    };
  }

  return {
    showReviewOverlay
  };
})();
