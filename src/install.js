// ==========================================================================
// INZORA TERRA — PWA INSTALLATION & MOBILE INTEGRATION ENGINE
// Handles beforeinstallprompt, iOS Add-to-Home-Screen guide, and standalone detection
// ==========================================================================

import { audioFx } from './audio.js';

class AppInstaller {
  constructor() {
    this.deferredPrompt = null;
    this.isStandalone = false;
    this.isIOS = false;
    this.isAndroid = false;
    this.isMobile = false;
  }

  init() {
    // 1. Detect environment
    this.detectEnvironment();

    // 2. Register Service Worker
    this.registerServiceWorker();

    // 3. Listen for browser install prompt
    this.bindInstallEvents();

    // 4. Bind UI trigger buttons
    this.bindUI();

    // 5. Update initial UI states
    this.updateInstallUI();
  }

  detectEnvironment() {
    const ua = navigator.userAgent || '';
    this.isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    this.isAndroid = /Android/.test(ua);
    this.isMobile = this.isIOS || this.isAndroid || /Mobi|Tablet|iPad|iPhone/.test(ua) || window.innerWidth <= 768;

    // Check if launched as installed PWA or native app
    const isStandaloneMQ = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = window.navigator.standalone === true;
    const isAndroidAsset = window.location.href.startsWith('file:///android_asset');

    this.isStandalone = isStandaloneMQ || isIOSStandalone || isAndroidAsset;
  }

  registerServiceWorker() {
    if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      navigator.serviceWorker.register('./sw.js')
        .then((reg) => {
          console.log('⚡ Terra PWA ServiceWorker Registered:', reg.scope);
        })
        .catch((err) => {
          console.warn('Terra ServiceWorker registration skipped:', err.message);
        });
    }
  }

  bindInstallEvents() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      console.log('⚡ PWA beforeinstallprompt captured.');
      this.updateInstallUI();

      // Show mobile install banner if on mobile and not dismissed
      if (this.isMobile && !this.isStandalone && !sessionStorage.getItem('terra_install_banner_dismissed')) {
        setTimeout(() => this.showMobileBanner(), 1500);
      }
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.isStandalone = true;
      console.log('⚡ Inzora Terra PWA successfully installed.');
      this.updateInstallUI();
      if (window.showToast) {
        window.showToast("Inzora Terra installed to Home Screen!", "success");
      }
      audioFx.playConfirm();
      this.hideMobileBanner();
      this.closeModal();
    });
  }

  bindUI() {
    // Header Install Button
    const btnHeaderInstall = document.getElementById('btn-header-install');
    if (btnHeaderInstall) {
      btnHeaderInstall.addEventListener('click', () => {
        audioFx.playClick();
        this.openInstallModal();
      });
    }

    // Mobile Install Banner buttons
    const btnBannerInstall = document.getElementById('btn-mobile-banner-install');
    if (btnBannerInstall) {
      btnBannerInstall.addEventListener('click', () => {
        audioFx.playClick();
        this.promptInstall();
      });
    }

    const btnBannerDismiss = document.getElementById('btn-mobile-banner-dismiss');
    if (btnBannerDismiss) {
      btnBannerDismiss.addEventListener('click', () => {
        sessionStorage.setItem('terra_install_banner_dismissed', 'true');
        this.hideMobileBanner();
        audioFx.playClick();
      });
    }

    // Modal Action Buttons
    const btnModalConfirmInstall = document.getElementById('btn-modal-confirm-install');
    if (btnModalConfirmInstall) {
      btnModalConfirmInstall.addEventListener('click', () => {
        this.promptInstall();
      });
    }

    const btnCloseModal = document.getElementById('btn-close-install-modal');
    const modalBackdrop = document.getElementById('install-modal-backdrop');
    if (btnCloseModal) {
      btnCloseModal.addEventListener('click', () => this.closeModal());
    }
    if (modalBackdrop) {
      modalBackdrop.addEventListener('click', () => this.closeModal());
    }

    // Settings screen install button
    const btnSettingsInstall = document.getElementById('btn-settings-install-app');
    if (btnSettingsInstall) {
      btnSettingsInstall.addEventListener('click', () => {
        audioFx.playClick();
        this.openInstallModal();
      });
    }
  }

  updateInstallUI() {
    const btnHeaderInstall = document.getElementById('btn-header-install');
    const settingsStatusBadge = document.getElementById('settings-pwa-status');
    const btnSettingsInstall = document.getElementById('btn-settings-install-app');

    if (this.isStandalone) {
      if (btnHeaderInstall) btnHeaderInstall.classList.add('hidden');
      if (settingsStatusBadge) {
        settingsStatusBadge.textContent = 'INSTALLED (STANDALONE)';
        settingsStatusBadge.className = 'badge badge-emerald';
      }
      if (btnSettingsInstall) {
        btnSettingsInstall.textContent = 'APP ACTIVE (STANDALONE)';
        btnSettingsInstall.disabled = true;
        btnSettingsInstall.style.opacity = '0.7';
      }
      this.hideMobileBanner();
    } else {
      if (btnHeaderInstall) {
        btnHeaderInstall.classList.remove('hidden');
        btnHeaderInstall.classList.add('pulse-ready');
      }
      if (settingsStatusBadge) {
        settingsStatusBadge.textContent = this.deferredPrompt ? 'READY TO INSTALL' : 'WEB CLIENT';
        settingsStatusBadge.className = 'badge badge-cyan';
      }
      if (btnSettingsInstall) {
        btnSettingsInstall.textContent = 'INSTALL MOBILE APP';
        btnSettingsInstall.disabled = false;
        btnSettingsInstall.style.opacity = '1';
      }
    }
  }

  showMobileBanner() {
    if (this.isStandalone) return;
    const banner = document.getElementById('mobile-install-banner');
    if (banner) {
      banner.classList.remove('hidden');
    }
  }

  hideMobileBanner() {
    const banner = document.getElementById('mobile-install-banner');
    if (banner) {
      banner.classList.add('hidden');
    }
  }

  openInstallModal() {
    const modal = document.getElementById('install-app-modal');
    if (!modal) return;

    modal.classList.remove('hidden');

    // Customize modal view depending on platform (iOS, Android, Chrome/Edge, or Installed)
    const iosGuide = document.getElementById('install-guide-ios');
    const standardGuide = document.getElementById('install-guide-standard');
    const installedGuide = document.getElementById('install-guide-installed');
    const btnConfirm = document.getElementById('btn-modal-confirm-install');

    if (this.isStandalone) {
      if (iosGuide) iosGuide.classList.add('hidden');
      if (standardGuide) standardGuide.classList.add('hidden');
      if (installedGuide) installedGuide.classList.remove('hidden');
      if (btnConfirm) btnConfirm.classList.add('hidden');
    } else if (this.isIOS) {
      if (iosGuide) iosGuide.classList.remove('hidden');
      if (standardGuide) standardGuide.classList.add('hidden');
      if (installedGuide) installedGuide.classList.add('hidden');
      if (btnConfirm) btnConfirm.classList.add('hidden');
    } else {
      if (iosGuide) iosGuide.classList.add('hidden');
      if (standardGuide) standardGuide.classList.remove('hidden');
      if (installedGuide) installedGuide.classList.add('hidden');
      if (btnConfirm) btnConfirm.classList.remove('hidden');
    }
  }

  closeModal() {
    const modal = document.getElementById('install-app-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  promptInstall() {
    if (this.isStandalone) {
      if (window.showToast) {
        window.showToast("Inzora Terra is already installed & running in standalone mode.", "info");
      }
      return;
    }

    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      this.deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('⚡ User accepted PWA install prompt');
          audioFx.playConfirm();
        } else {
          console.log('User dismissed PWA install prompt');
        }
        this.deferredPrompt = null;
        this.closeModal();
      });
    } else if (this.isIOS) {
      // Show iOS step-by-step modal guide
      this.openInstallModal();
    } else {
      // Browser didn't trigger prompt yet, explain manual method or open modal
      this.openInstallModal();
    }
  }
}

export const appInstaller = new AppInstaller();
