// ==========================================================================
// INZORA TERRA — MAIN APPLICATION ENTRYPOINT & ORCHESTRATOR
// Coordinates Navigation Tabs, Draggable Bottom Sheet, State & Event Buses
// ==========================================================================

import { audioFx } from './audio.js';
import { missionMap } from './map.js';
import { telemetry } from './telemetry.js';
import { agents } from './agents.js';
import { dexter } from './dexter.js';
import { hitl } from './hitl.js';
import { reports } from './reports.js';
import { appInstaller } from './install.js';

class InzoraTerraApp {
  constructor() {
    this.currentTab = 'home';
    this.missionActive = true;
    this.isSheetExpanded = false;
  }

  init() {
    // Initialize Subsystems
    missionMap.init();
    telemetry.init();
    agents.init();
    dexter.init();
    hitl.init();
    reports.init();
    appInstaller.init();

    // Bind Core UI Listeners
    this.bindNavigation();
    this.bindBottomSheetDrag();
    this.bindMissionControls();
    this.bindHeaderActions();
    this.bindSettings();

    // Check URL tab query param (e.g. from PWA shortcuts)
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam && ['home', 'mission', 'telemetry', 'agents', 'reports', 'settings'].includes(tabParam)) {
      this.switchTab(tabParam);
    }

    // Global helper exports on window for cross-module dispatch
    window.switchTab = (tabId) => this.switchTab(tabId);
    window.openHITL = () => hitl.open();
    window.openInstallModal = () => appInstaller.openInstallModal();
    window.showToast = (msg, type) => this.showToast(msg, type);
    window.setReportLanguage = (lang) => reports.setLanguage(lang);

    console.log("⚡ Inzora Terra Mobile Command Center Online.");
  }

  // 1. Bottom Navigation Tabs (5 Primary Tabs)
  bindNavigation() {
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabId = tab.dataset.tab;
        this.switchTab(tabId);
        audioFx.playClick();
      });
    });

    // Home Shortcut Buttons to other screens
    const btnGotoLive = document.getElementById('btn-goto-live-mission');
    if (btnGotoLive) {
      btnGotoLive.addEventListener('click', () => {
        this.switchTab('mission');
        audioFx.playClick();
      });
    }

    const btnViewReports = document.getElementById('btn-view-all-reports');
    if (btnViewReports) {
      btnViewReports.addEventListener('click', () => {
        this.switchTab('reports');
        audioFx.playClick();
      });
    }
  }

  switchTab(tabId) {
    if (this.currentTab === tabId) return;
    this.currentTab = tabId;

    // Update Tab Buttons
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
      if (tab.dataset.tab === tabId) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    // Update Screen Views
    const screens = document.querySelectorAll('.screen-view');
    screens.forEach(screen => {
      screen.classList.remove('active');
    });

    const activeScreen = document.getElementById(`screen-${tabId}`);
    if (activeScreen) {
      activeScreen.classList.add('active');
    }

    // Invalidate Leaflet Map Size if switching to Mission or Home
    if (tabId === 'mission' || tabId === 'home') {
      missionMap.invalidate();
    }
  }

  // 2. Draggable Bottom Mission Sheet on Map
  bindBottomSheetDrag() {
    const sheet = document.getElementById('mission-bottom-sheet');
    const handle = document.getElementById('sheet-handle');
    const toggleBtn = document.getElementById('btn-sheet-expand-toggle');
    if (!sheet || !handle) return;

    let startY = 0;
    let isDragging = false;

    // Click toggle button
    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleSheet();
      });
    }

    handle.addEventListener('click', () => {
      this.toggleSheet();
    });

    // Touch & Mouse Drag
    const onTouchStart = (e) => {
      startY = e.touches ? e.touches[0].clientY : e.clientY;
      isDragging = true;
    };

    const onTouchMove = (e) => {
      if (!isDragging) return;
      const currentY = e.touches ? e.touches[0].clientY : e.clientY;
      const diffY = currentY - startY;

      // If dragged down substantially
      if (diffY > 60 && this.isSheetExpanded) {
        this.setSheetExpanded(false);
        isDragging = false;
      }
      // If dragged up substantially
      else if (diffY < -60 && !this.isSheetExpanded) {
        this.setSheetExpanded(true);
        isDragging = false;
      }
    };

    const onTouchEnd = () => {
      isDragging = false;
    };

    handle.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    handle.addEventListener('mousedown', onTouchStart);
    window.addEventListener('mousemove', onTouchMove);
    window.addEventListener('mouseup', onTouchEnd);
  }

  toggleSheet() {
    this.setSheetExpanded(!this.isSheetExpanded);
  }

  setSheetExpanded(expanded) {
    this.isSheetExpanded = expanded;
    const sheet = document.getElementById('mission-bottom-sheet');
    const toggleBtn = document.getElementById('btn-sheet-expand-toggle');
    if (!sheet) return;

    if (expanded) {
      sheet.classList.remove('peek');
      sheet.classList.add('expanded');
      if (toggleBtn) toggleBtn.textContent = 'Collapse';
      audioFx.playClick();
    } else {
      sheet.classList.remove('expanded');
      sheet.classList.add('peek');
      if (toggleBtn) toggleBtn.textContent = 'View Details';
      audioFx.playClick();
    }
  }

  // 3. Mission Start / Stop Emergency Controls
  bindMissionControls() {
    const btnStart = document.getElementById('btn-start-mission');
    const btnAbort = document.getElementById('btn-abort-mission');
    const badge = document.getElementById('home-mission-status-badge');
    const btnStartLabel = document.getElementById('btn-start-mission-label');

    if (btnStart) {
      btnStart.addEventListener('click', () => {
        audioFx.playConfirm();
        this.missionActive = true;
        if (badge) {
          badge.textContent = '● ACTIVE MISSION';
          badge.className = 'badge badge-emerald';
        }
        if (btnStartLabel) btnStartLabel.textContent = 'MISSION ACTIVE';
        this.showToast("Mission Initiated. Switching to Live Map Command Center.", "success");
        setTimeout(() => this.switchTab('mission'), 800);
      });
    }

    if (btnAbort) {
      btnAbort.addEventListener('click', () => {
        audioFx.playAlert();
        this.missionActive = false;
        if (badge) {
          badge.textContent = '○ HALTED';
          badge.className = 'badge badge-crimson';
        }
        if (btnStartLabel) btnStartLabel.textContent = 'START MISSION';
        this.showToast("EMERGENCY STOP: All Rover & Field Units Halted.", "error");
      });
    }

    const btnResume = document.getElementById('btn-home-resume');
    if (btnResume) {
      btnResume.addEventListener('click', () => {
        audioFx.playConfirm();
        this.switchTab('mission');
      });
    }

    const btnRecalibrate = document.getElementById('btn-home-recalibrate');
    if (btnRecalibrate) {
      btnRecalibrate.addEventListener('click', () => {
        audioFx.playPing();
        this.showToast("Sensor array synchronized with RTK Base Station.", "info");
      });
    }
  }

  // 4. Header Actions (Device Frame Toggle & Sound Toggle)
  bindHeaderActions() {
    const btnDevice = document.getElementById('btn-device-toggle');
    const appRoot = document.getElementById('app-root');
    if (btnDevice && appRoot) {
      btnDevice.addEventListener('click', () => {
        appRoot.classList.toggle('fullscreen-mode');
        audioFx.playClick();
        missionMap.invalidate();
      });
    }

    const btnSound = document.getElementById('btn-quick-sound');
    let soundOn = true;
    if (btnSound) {
      btnSound.addEventListener('click', () => {
        soundOn = !soundOn;
        audioFx.toggle(soundOn);
        btnSound.style.color = soundOn ? 'var(--text-secondary)' : 'var(--color-crimson)';
        this.showToast(soundOn ? "Tactical Audio FX Enabled" : "Tactical Audio FX Muted", "info");
      });
    }

    // Commander Avatar opens Settings Screen
    const btnAvatar = document.getElementById('btn-commander-avatar');
    if (btnAvatar) {
      btnAvatar.addEventListener('click', () => {
        this.switchTab('settings');
        audioFx.playClick();
      });
    }
  }

  // 5. Settings Screen
  bindSettings() {
    const btnClose = document.getElementById('btn-close-settings');
    if (btnClose) {
      btnClose.addEventListener('click', () => {
        this.switchTab('home');
        audioFx.playClick();
      });
    }

    const setAudio = document.getElementById('set-audio');
    if (setAudio) {
      setAudio.addEventListener('change', (e) => {
        audioFx.toggle(e.target.checked);
      });
    }

    const setRefresh = document.getElementById('set-refresh');
    if (setRefresh) {
      setRefresh.addEventListener('change', (e) => {
        telemetry.setRefreshRate(parseInt(e.target.value));
      });
    }

    const setSimStream = document.getElementById('set-sim-stream');
    if (setSimStream) {
      setSimStream.addEventListener('change', (e) => {
        telemetry.setSimStream(e.target.checked);
      });
    }
  }

  // Toast Notification System
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = '⚡';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '⚠️';
    if (type === 'info') icon = 'ℹ️';

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }
}

// Instantiate on Load
window.addEventListener('DOMContentLoaded', () => {
  const app = new InzoraTerraApp();
  app.init();
});
