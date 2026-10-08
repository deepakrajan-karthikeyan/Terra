// ==========================================================================
// AI MULTI-AGENT SWARM & ORCHESTRATION TIMELINE
// Visualizes autonomous agent reasoning, decisions & execution lifecycle
// ==========================================================================

import { audioFx } from './audio.js';

export class AgentsController {
  constructor() {
    this.timelineSteps = [
      { time: '09:42:11', event: 'Telemetry Stream Received', desc: 'Dexter MK-IV synced 12/12 sensor packets over LoRa mesh link', status: 'done', icon: '📡' },
      { time: '09:42:12', event: 'Risk Agent Triggered', desc: 'Evaluating slope gradient 38.4°, moisture index 0.88 & gas concentration', status: 'done', icon: '⚡' },
      { time: '09:42:15', event: 'Risk Assessment Completed', desc: 'High risk flag raised (91% confidence). Active slope slip detected', status: 'done', icon: '⚠️' },
      { time: '09:42:16', event: 'Victim Detection Agent Started', desc: 'Cross-referencing FLIR Lepton radiometric thermal data & acoustic sensors', status: 'done', icon: '🔍' },
      { time: '09:42:19', event: 'Victim Signatures Confirmed', desc: '3 living victims mapped with vital probabilities (94%, 88%, 76%)', status: 'done', icon: '🧍' },
      { time: '09:42:20', event: 'Resource Agent Activated', desc: 'Calculating collision-free extraction routes bypassing toxic gas plume', status: 'current', icon: '🚑' },
      { time: '09:42:24', event: 'Commander Decision Required', desc: 'HITL authorization escalated: Team Alpha dispatch pending commander sign-off', status: 'waiting', icon: '🛡️' }
    ];
  }

  init() {
    this.renderTimeline();
    this.bindLogToggles();

    const btnRerun = document.getElementById('btn-retrigger-orchestration');
    if (btnRerun) {
      btnRerun.addEventListener('click', () => this.simulatePipelineRerun());
    }
  }

  renderTimeline() {
    const container = document.getElementById('agent-timeline-container');
    if (!container) return;

    container.innerHTML = this.timelineSteps.map((step, idx) => `
      <div class="timeline-step-row ${step.status}">
        <div class="timeline-bullet">${step.icon}</div>
        <div class="timeline-content">
          <div class="tc-time">${step.time}</div>
          <div class="tc-event">${step.event}</div>
          <div class="tc-desc">${step.desc}</div>
        </div>
      </div>
    `).join('');
  }

  bindLogToggles() {
    const toggles = document.querySelectorAll('.agent-log-toggle');
    toggles.forEach(btn => {
      btn.addEventListener('click', () => {
        const agent = btn.dataset.agent;
        const logContent = document.getElementById(`log-${agent}`);
        if (logContent) {
          logContent.classList.toggle('hidden');
          const isHidden = logContent.classList.contains('hidden');
          btn.querySelector('span').textContent = isHidden ? 'View Raw Inference Payload' : 'Hide Inference Payload';
          audioFx.playClick();
        }
      });
    });
  }

  simulatePipelineRerun() {
    audioFx.playConfirm();
    if (window.showToast) {
      window.showToast("Initiating Multi-Agent Swarm Orchestration...", "info");
    }

    const steps = [
      { id: 'risk', statusEl: 'Risk Agent Started...', quote: 'Re-evaluating geotechnical stability and shear stress...', badge: 'RUNNING' },
      { id: 'victim', statusEl: 'Victim Agent Active', quote: 'Scanning infrared spectrum for new trapped heat signatures...', badge: 'RUNNING' },
      { id: 'resource', statusEl: 'Resource Agent Routing', quote: 'Computing dynamic evacuation corridors with Medic Drone Hermes...', badge: 'CALCULATING' }
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < steps.length) {
        audioFx.playPing();
        stepIndex++;
      } else {
        clearInterval(interval);
        audioFx.playConfirm();
        if (window.showToast) {
          window.showToast("Multi-Agent pipeline re-orchestrated successfully!", "success");
        }
      }
    }, 1200);
  }
}

export const agents = new AgentsController();
