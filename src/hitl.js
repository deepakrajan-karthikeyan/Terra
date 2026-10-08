// ==========================================================================
// HITL (HUMAN-IN-THE-LOOP) COMMANDER DECISION MANAGER
// Prominent tactical commander approval screen & evidence drawer
// ==========================================================================

import { audioFx } from './audio.js';

export class HITLController {
  constructor() {
    this.modal = null;
  }

  init() {
    this.modal = document.getElementById('hitl-decision-modal');

    // Close and Backdrop
    const btnClose = document.getElementById('btn-close-hitl');
    const backdrop = document.getElementById('hitl-backdrop');
    if (btnClose) btnClose.addEventListener('click', () => this.close());
    if (backdrop) backdrop.addEventListener('click', () => this.close());

    // Review Banner trigger
    const btnBannerReview = document.getElementById('btn-banner-review');
    if (btnBannerReview) {
      btnBannerReview.addEventListener('click', () => this.open());
    }

    // Home / Sheet triggers
    const btnHomeHitl = document.getElementById('btn-home-call-hitl');
    if (btnHomeHitl) btnHomeHitl.addEventListener('click', () => this.open());

    const btnSheetHitl = document.getElementById('btn-trigger-hitl-modal');
    if (btnSheetHitl) btnSheetHitl.addEventListener('click', () => this.open());

    const btnDeployAlpha = document.getElementById('btn-deploy-team-alpha');
    if (btnDeployAlpha) btnDeployAlpha.addEventListener('click', () => this.open());

    // Toggle Evidence Drawer
    const btnEvidence = document.getElementById('btn-toggle-evidence');
    const evidenceDrawer = document.getElementById('evidence-drawer');
    if (btnEvidence && evidenceDrawer) {
      btnEvidence.addEventListener('click', () => {
        evidenceDrawer.classList.toggle('hidden');
        audioFx.playClick();
      });
    }

    // Approve Button
    const btnApprove = document.getElementById('btn-hitl-approve');
    if (btnApprove) {
      btnApprove.addEventListener('click', () => this.approve());
    }

    // Reject Button
    const btnReject = document.getElementById('btn-hitl-reject');
    if (btnReject) {
      btnReject.addEventListener('click', () => this.reject());
    }
  }

  open() {
    if (!this.modal) return;
    this.modal.classList.remove('hidden');
    audioFx.playAlert();
  }

  close() {
    if (!this.modal) return;
    this.modal.classList.add('hidden');
    audioFx.playClick();
  }

  approve() {
    this.close();
    audioFx.playConfirm();

    // Hide the top banner if open
    const banner = document.getElementById('hitl-alert-banner');
    if (banner) banner.classList.add('hidden');

    if (window.showToast) {
      window.showToast("COMMANDER AUTHORIZED: Rescue Team Alpha Dispatched via Northern Ridge Corridor!", "success");
    }

    // Update bottom sheet status
    const btnDeploy = document.getElementById('btn-deploy-team-alpha');
    if (btnDeploy) {
      btnDeploy.innerHTML = `<span>✅ RESCUE TEAM ALPHA IN TRANSIT (ETA 4.2m)</span>`;
      btnDeploy.classList.remove('btn-primary-start');
      btnDeploy.style.background = 'rgba(16, 185, 129, 0.2)';
      btnDeploy.style.border = '1px solid #10b981';
      btnDeploy.style.color = '#10b981';
    }
  }

  reject() {
    this.close();
    audioFx.playAlert();

    const banner = document.getElementById('hitl-alert-banner');
    if (banner) banner.classList.add('hidden');

    if (window.showToast) {
      window.showToast("ACTION REJECTED: Field Teams Ordered to Stand Down. Awaiting Alternate Route.", "error");
    }
  }
}

export const hitl = new HITLController();
