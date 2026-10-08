// ==========================================================================
// DEXTER AI MISSION ASSISTANT
// Global Floating Command Button, Voice Mode, Speech Synthesis & Natural NLP
// ==========================================================================

import { audioFx } from './audio.js';

export class DexterAssistant {
  constructor() {
    this.modal = null;
    this.speechSynthesis = window.speechSynthesis || null;
    this.recognition = null;
    this.isListening = false;

    this.initSpeechRecognition();
  }

  init() {
    this.modal = document.getElementById('dexter-panel-modal');
    
    // Floating FAB trigger
    const btnFab = document.getElementById('btn-floating-dexter');
    if (btnFab) {
      btnFab.addEventListener('click', () => this.openPanel());
    }

    // Modal Close
    const btnClose = document.getElementById('btn-close-dexter');
    const backdrop = document.getElementById('dexter-backdrop');
    if (btnClose) btnClose.addEventListener('click', () => this.closePanel());
    if (backdrop) backdrop.addEventListener('click', () => this.closePanel());

    // Command Chips
    const chips = document.querySelectorAll('.cmd-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const cmd = chip.dataset.cmd;
        this.processCommand(cmd);
      });
    });

    // Mic Toggle
    const btnMic = document.getElementById('btn-dexter-listen');
    if (btnMic) {
      btnMic.addEventListener('click', () => this.toggleListening());
    }

    // Text Input Bar
    const btnSend = document.getElementById('btn-dexter-send');
    const input = document.getElementById('dexter-text-input');
    if (btnSend && input) {
      btnSend.addEventListener('click', () => {
        if (input.value.trim()) {
          this.processCommand(input.value.trim());
          input.value = '';
        }
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && input.value.trim()) {
          this.processCommand(input.value.trim());
          input.value = '';
        }
      });
    }
  }

  initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.setListeningState(true);
      };

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        this.setListeningState(false);
        this.processCommand(transcript);
      };

      this.recognition.onerror = () => {
        this.setListeningState(false);
      };

      this.recognition.onend = () => {
        this.setListeningState(false);
      };
    }
  }

  openPanel() {
    if (!this.modal) return;
    this.modal.classList.remove('hidden');
    audioFx.playPing();
    this.speak("Yes, Commander. Dexter is online and standing by.");
  }

  closePanel() {
    if (!this.modal) return;
    this.modal.classList.add('hidden');
    this.setListeningState(false);
    audioFx.playClick();
  }

  toggleListening() {
    if (!this.recognition) {
      // Browser doesn't support Web Speech API, fallback gracefully
      this.setResponse("Microphone API not supported by browser. Please select a command chip or type your instruction.");
      return;
    }

    if (this.isListening) {
      this.recognition.stop();
      this.setListeningState(false);
    } else {
      try {
        this.recognition.start();
      } catch (e) {
        this.setListeningState(false);
      }
    }
  }

  setListeningState(listening) {
    this.isListening = listening;
    const soundwave = document.getElementById('voice-soundwave');
    const micStatus = document.getElementById('dexter-mic-status');
    const btnMic = document.getElementById('btn-dexter-listen');

    if (listening) {
      if (soundwave) soundwave.classList.add('active');
      if (micStatus) micStatus.textContent = "Listening... Speak your command now";
      if (btnMic) btnMic.classList.add('recording');
      audioFx.playPing();
    } else {
      if (soundwave) soundwave.classList.remove('active');
      if (micStatus) micStatus.textContent = "Tap Microphone or Select Command";
      if (btnMic) btnMic.classList.remove('recording');
    }
  }

  setResponse(text) {
    const speechEl = document.getElementById('dexter-response-text');
    if (speechEl) {
      speechEl.textContent = `"${text}"`;
    }
    this.speak(text);
  }

  speak(text) {
    if (!this.speechSynthesis) return;
    try {
      this.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 0.95; // Crisp command center tone
      this.speechSynthesis.speak(utterance);
    } catch (e) {
      // Graceful fallback if speech audio blocked
    }
  }

  processCommand(rawCmd) {
    const cmd = rawCmd.toLowerCase();
    audioFx.playConfirm();

    if (cmd.includes('start mission')) {
      this.setResponse("Starting mission protocol for Karur Sector 04. All sensors synchronized. Switching to Live Mission Map.");
      setTimeout(() => {
        this.closePanel();
        if (window.switchTab) window.switchTab('mission');
      }, 1500);
    } else if (cmd.includes('show risk') || cmd.includes('why is this zone high risk')) {
      this.setResponse("Zone 04 exhibits 38.4 degree slope failure with 88% soil moisture saturation and 74 ppm toxic gas. Secondary collapse risk is 91%.");
      setTimeout(() => {
        this.closePanel();
        if (window.switchTab) window.switchTab('mission');
      }, 1800);
    } else if (cmd.includes('victim')) {
      this.setResponse("Three victims detected. Victim 1 trapped in Debris Pocket A with 94% alive probability. Victim 2 conscious in Cavity B. Victim 3 located on lower slope.");
      setTimeout(() => {
        this.closePanel();
        if (window.switchTab) window.switchTab('mission');
      }, 1800);
    } else if (cmd.includes('deploy') || cmd.includes('resource')) {
      this.setResponse("Resource Agent recommends deploying Rescue Team Alpha via the Northern Ridge trail to bypass toxic gas. Opening Commander Decision screen.");
      setTimeout(() => {
        this.closePanel();
        if (window.openHITL) window.openHITL();
      }, 1500);
    } else if (cmd.includes('summarize')) {
      this.setResponse("Mission Summary: Karur landslide response active for 34 minutes. 3 victims identified. High risk geotechnical hazard. Opening comprehensive mission audit report.");
      setTimeout(() => {
        this.closePanel();
        if (window.switchTab) window.switchTab('reports');
      }, 1800);
    } else if (cmd.includes('pause')) {
      this.setResponse("Mission paused. Rover Dexter holding current waypoint. Telemetry recording continues in standby mode.");
      if (window.showToast) window.showToast("Mission Paused by Commander", "info");
    } else if (cmd.includes('tamil') || cmd.includes('translate')) {
      this.setResponse("அறிக்கை தமிழுக்கு மாற்றப்படுகிறது. Switching mission report language to Tamil.");
      setTimeout(() => {
        this.closePanel();
        if (window.switchTab) window.switchTab('reports');
        if (window.setReportLanguage) window.setReportLanguage('ta');
      }, 1500);
    } else {
      this.setResponse(`Acknowledged command: "${rawCmd}". Orchestrating multi-agent swarm.`);
    }
  }
}

export const dexter = new DexterAssistant();
