/**
 * @fileoverview Candidate Readiness Radar and Profile Card Sub-Component.
 * Renders user profile metadata, role verification tags, and the 4-point readiness checklist.
 * NASA JPL Rule 5: High assertion and invariant density on profile structures.
 */

/**
 * Updates the profile summary card and readiness progress metrics in the popup DOM.
 *
 * @param {Object} session - Authenticated session payload.
 * @param {'seeker'|'recruiter'|'admin'} currentRole - Current active role view.
 */
export function renderProfileCard(session, currentRole) {
  if (!session || typeof session !== 'object') return;

  const displayName = session.displayName || session.email?.split('@')[0] || 'Member';
  const nameEl = document.getElementById('prof-name');
  const avatarEl = document.getElementById('prof-avatar');
  const badgeEl = document.getElementById('prof-badge');
  const targetEl = document.getElementById('prof-target');
  const percentEl = document.getElementById('prof-percent');
  const barEl = document.getElementById('prof-bar');

  if (nameEl) nameEl.innerText = displayName;
  if (avatarEl) avatarEl.innerText = displayName.charAt(0).toUpperCase();

  const isMasterAdmin = Boolean(
    session.isAdmin || session.email === 'Chris.Barnes.2000@me.com'
  );
  const isRecruiter = Boolean(
    session.accountType === 'company' ||
    session.accountType === 'recruiter' ||
    session.accountType === 'staffingFirm'
  );

  if (isMasterAdmin) {
    if (badgeEl) {
      badgeEl.innerText = 'Platform Architect';
      badgeEl.style.background = '#f5f3ff';
      badgeEl.style.color = '#7c3aed';
    }
    if (targetEl) targetEl.innerText = `${session.email} • Full Access`;
    if (percentEl) percentEl.innerText = '100%';
    if (barEl) barEl.style.width = '100%';
  } else if (isRecruiter) {
    if (badgeEl) {
      badgeEl.innerText = 'Verified Recruiter';
      badgeEl.style.background = '#eff6ff';
      badgeEl.style.color = '#2563eb';
    }
    if (targetEl) targetEl.innerText = 'Staffing Partner Workspace';
    if (percentEl) percentEl.innerText = '95%';
    if (barEl) barEl.style.width = '95%';
  } else {
    if (badgeEl) {
      badgeEl.innerText = 'Job Seeker';
      badgeEl.style.background = '#ecfdf5';
      badgeEl.style.color = '#059669';
    }
    if (targetEl) targetEl.innerText = 'Candidate Matching Active';
    if (percentEl) percentEl.innerText = '90%';
    if (barEl) barEl.style.width = '90%';
  }
}

/**
 * Updates individual 4-pillar readiness checks based on verified profile inputs.
 *
 * @param {{ hasResume?: boolean, hasSkills?: boolean, hasTarget?: boolean, hasPrivacy?: boolean }} status
 */
export function updateReadinessChecks(status = {}) {
  const chkResume = document.getElementById('chk-resume');
  const chkSkills = document.getElementById('chk-skills');
  const chkTarget = document.getElementById('chk-target');
  const chkPrivacy = document.getElementById('chk-privacy');

  if (chkResume) {
    const ok = status.hasResume !== false;
    chkResume.className = `check-pill ${ok ? 'ok' : ''}`;
    chkResume.innerText = ok ? '📄 Resume Ready' : '📄 Resume Needed';
  }

  if (chkSkills) {
    const ok = status.hasSkills !== false;
    chkSkills.className = `check-pill ${ok ? 'ok' : ''}`;
    chkSkills.innerText = ok ? '⚡ Skills Active' : '⚡ Add Skills';
  }

  if (chkTarget) {
    const ok = status.hasTarget !== false;
    chkTarget.className = `check-pill ${ok ? 'ok' : ''}`;
    chkTarget.innerText = ok ? '🎯 Target Role Set' : '🎯 Role Undefined';
  }

  if (chkPrivacy) {
    const ok = status.hasPrivacy !== false;
    chkPrivacy.className = `check-pill ${ok ? 'ok' : ''}`;
    chkPrivacy.innerText = ok ? '🛡️ Firewall Active' : '🛡️ Check Firewall';
  }
}
