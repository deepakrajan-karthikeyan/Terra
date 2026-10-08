// ==========================================================================
// MISSION REPORTS, BILINGUAL TRANSLATION (TAMIL) & REPLAY ENGINE
// Comprehensive audit generation, in-place Tamil translation & synced replay
// ==========================================================================

import { audioFx } from './audio.js';
import { missionMap } from './map.js';

export class ReportsController {
  constructor() {
    this.currentLanguage = 'en'; // 'en' or 'ta'
    this.replayPlaying = false;
    this.replayInterval = null;
    this.replaySpeed = 1;
    this.replayProgress = 25; // percentage (0 to 100)

    this.recentMissions = [
      { id: 'MSN-024', name: 'Landslide Response', location: 'Karur Sector 04', time: 'Today 09:42', duration: '34 min', victims: 3, risk: 'HIGH', status: 'IN PROGRESS' },
      { id: 'MSN-023', name: 'Industrial Chemical Leak', location: 'Manapparai Complex', time: 'Yesterday 14:15', duration: '52 min', victims: 1, risk: 'EXTREME', status: 'COMPLETED' },
      { id: 'MSN-022', name: 'Flash Flood Extraction', location: 'Cauvery River Basin', time: '3 days ago', duration: '1h 14m', victims: 5, risk: 'MODERATE', status: 'COMPLETED' }
    ];

    // Bilingual Data Models
    this.reportData = {
      en: {
        code: "MISSION #024 • INCIDENT REPORT",
        title: "Landslide Emergency Response & Subterranean Victim Extraction",
        locationLabel: "Incident Location",
        locationVal: "Karur Sector 04 Ridge (10.9601° N, 78.0766° E)",
        durationLabel: "Duration",
        durationVal: "34 Minutes Elapsed",
        riskLabel: "Risk Assessment",
        riskVal: "HIGH (Slope Factor 1.82)",
        overviewTitle: "Mission Overview",
        overviewText: "On 07 Oct 2026 at 09:42 local time, an unstable subterranean slope collapse occurred along Karur Ridge. Inzora Terra autonomous rescue protocol was initiated with Dexter MK-IV rover deployment. Multi-agent AI swarm completed risk stratification, acoustic thermal bio-fusion, and extraction corridor mapping.",
        findingsTitle: "Critical Sensor Findings",
        colSensor: "Sensor Array",
        colReading: "Peak Reading",
        colStatus: "Safety Classification",
        findings: [
          { sensor: "FLIR Lepton Radiometric", reading: "36.8°C (Human Contours)", status: "3 Living Signatures Verified" },
          { sensor: "Electrochemical PID Gas", reading: "74 ppm (H2S / Methane)", status: "Toxic Plume Present (Hazmat Active)" },
          { sensor: "GPR (Ground Penetrating Radar)", reading: "2.4m Depth Cavitation", status: "Subterranean Void (Collapse Risk)" },
          { sensor: "3-Axis Inclinometer", reading: "8.2° Pitch / 3.4° Roll", status: "Active Slope Creep" }
        ],
        agentDecisionsTitle: "Autonomous Multi-Agent Decisions",
        agentDecisionsText: "Risk Agent flagged fault line 4B with 91% confidence, restricting heavy machinery deployment. Victim Agent located 3 victims trapped beneath non-bearing rubble. Resource Agent routed Team Alpha along the Northern Ridge trail, avoiding toxic gas plume.",
        actionsTitle: "Actions Taken & Current Operations",
        actionsText: "Commander Vance confirmed HITL authorization. Rescue Team Alpha (4 paramedics, 1 K9) dispatched with pneumatic shoring jacks and respirators. Hermes-02 medic drone providing aerial thermal supervision.",
        recommendationsTitle: "Commander Recommendations",
        recommendationsText: "1. Maintain 85m safety perimeter on southern flank.<br>2. Continuous monitoring of H2S gas levels.<br>3. Stage rapid extraction airlift for Victim #01 upon shoring completion.",
        confidenceScore: "91.4%",
        confidenceDesc: "Overall Multi-Agent Orchestration & Sensor Fusion Confidence"
      },
      ta: {
        code: "பணி எண் #024 • சம்பவ அறிக்கை",
        title: "நிலச்சரிவு அவசர மீட்புப் பணி மற்றும் நிலத்தடி மீட்பு நடவடிக்கை",
        locationLabel: "சம்பவ இடம்",
        locationVal: "கரூர் மண்டலம் 04 மலைப்பகுதி (10.9601° N, 78.0766° E)",
        durationLabel: "கால அளவு",
        durationVal: "34 நிமிடங்கள்",
        riskLabel: "இடர் மதிப்பீடு",
        riskVal: "உயர் ஆபத்து (சரிவு காரணி 1.82)",
        overviewTitle: "மீட்புப் பணி கண்ணோட்டம்",
        overviewText: "07 அக்டோபர் 2026 அன்று காலை 09:42 மணிக்கு, கரூர் மலைப்பகுதியில் திடீர் நிலச்சரிவு மற்றும் நிலத்தடி மண் வெடிப்பு ஏற்பட்டது. இன்சோரா டெர்ரா தன்னாட்சி மீட்பு நெறிமுறையுடன் டெக்ஸ்டர் MK-IV ரோவர் களமிறக்கப்பட்டது. பல-முகவர் செயற்கை நுண்ணறிவு அமைப்பு இடர் மதிப்பீடு, உடல்வெப்ப உணரிகள் மற்றும் மீட்புப் பாதைகளை வெற்றிகரமாக வரைபடமாக்கியுள்ளது.",
        findingsTitle: "முக்கிய உணரி கண்டுபிடிப்புகள்",
        colSensor: "உணரி வரிசை",
        colReading: "அளவீடு",
        colStatus: "பாதுகாப்பு நிலை",
        findings: [
          { sensor: "FLIR லெப்டான் வெப்ப உணரி", reading: "36.8°C (மனித உடல் வெப்பம்)", status: "3 உயிருள்ள நபர்கள் உறுதிசெய்யப்பட்டனர்" },
          { sensor: "PID நச்சு வாயு உணரி", reading: "74 ppm (H2S / மீத்தேன்)", status: "நச்சு வாயு பரவல் (கவச முகமூடி அவசியம்)" },
          { sensor: "GPR நில ஊடுருவல் ரேடார்", reading: "2.4 மீ ஆழத்தில் வெற்றிடம்", status: "நிலத்தடி இடிவு ஆபத்து" },
          { sensor: "3-அச்சு சாய்வுமானி", reading: "8.2° சாய்வு", status: "செயலில் உள்ள மண் நகர்வு" }
        ],
        agentDecisionsTitle: "செயற்கை நுண்ணறிவு முகவர் முடிவுகள்",
        agentDecisionsText: "இடர் முகவர் 91% நம்பகத்தன்மையுடன் அபாயப் பகுதி 4B-ஐ அடையாளம் கண்டது. பாதிக்கப்பட்டோர் முகவர் இடிபாடுகளுக்குள் சிக்கியுள்ள 3 பேரைக் கண்டறிந்தது. வள மேலாண்மை முகவர் நச்சு வாயுவைத் தவிர்த்து வடக்கு மலைப்பாதை வழியாக ஆல்ஃபா மீட்புக்குழுவை வழிநடத்தியது.",
        actionsTitle: "மேற்கொள்ளப்பட்ட நடவடிக்கைகள்",
        actionsText: "களத்தளபதி வான்ஸ் ஒப்புதல் வழங்கியதைத் தொடர்ந்து, ஆல்ஃபா மீட்புக்குழு (4 மருத்துவப் பணியாளர்கள், 1 மோப்பநாய்) காற்று சுவாசக் கருவிகளுடன் விரைந்துள்ளது. ஹெர்மிஸ்-02 ஆம்புலன்ஸ் ட்ரோன் வான்வழி பாதுகாப்பை வழங்குகிறது.",
        recommendationsTitle: "பாதுகாப்புப் பரிந்துரைகள்",
        recommendationsText: "1. தெற்குப் பகுதியில் 85 மீட்டர் பாதுகாப்பு எல்லையை பராமரிக்கவும்.<br>2. H2S நச்சு வாயு செறிவைத் தொடர்ந்து கண்காணிக்கவும்.<br>3. பாதிக்கப்பட்ட நபர் #01-ஐ மீட்டவுடன் அவசர வான்வழி மருத்துவமனைக்கு மாற்றவும்.",
        confidenceScore: "91.4%",
        confidenceDesc: "ஒட்டுமொத்த செயற்கை நுண்ணறிவு மற்றும் உணரி நம்பகத்தன்மை மதிப்பீடு"
      }
    };
  }

  init() {
    this.renderRecentMissions();
    this.renderFinalReport();
    this.bindLanguageToggle();
    this.bindReplayEngine();
  }

  renderRecentMissions() {
    const container = document.getElementById('recent-missions-container');
    if (!container) return;

    container.innerHTML = this.recentMissions.map(m => `
      <div class="mission-row-card" data-mission-id="${m.id}">
        <div class="mr-info">
          <span class="mr-title">${m.name} (${m.id})</span>
          <span class="mr-meta">📍 ${m.location} • ⏱️ ${m.time} • 🧍 ${m.victims} Victims</span>
        </div>
        <span class="mr-badge ${m.status === 'IN PROGRESS' ? 'badge-emerald' : 'badge-cyan'}">${m.status}</span>
      </div>
    `).join('');

    const cards = container.querySelectorAll('.mission-row-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        audioFx.playClick();
        if (window.switchTab) window.switchTab('reports');
      });
    });
  }

  bindLanguageToggle() {
    const btnEn = document.getElementById('btn-lang-en');
    const btnTa = document.getElementById('btn-lang-ta');

    if (btnEn && btnTa) {
      btnEn.addEventListener('click', () => this.setLanguage('en'));
      btnTa.addEventListener('click', () => this.setLanguage('ta'));
    }
  }

  setLanguage(lang) {
    this.currentLanguage = lang;
    const btnEn = document.getElementById('btn-lang-en');
    const btnTa = document.getElementById('btn-lang-ta');

    if (lang === 'ta') {
      if (btnEn) btnEn.classList.remove('active');
      if (btnTa) btnTa.classList.add('active');
      document.body.classList.add('lang-tamil');
    } else {
      if (btnTa) btnTa.classList.remove('active');
      if (btnEn) btnEn.classList.add('active');
      document.body.classList.remove('lang-tamil');
    }

    this.renderFinalReport();
    audioFx.playClick();
    if (window.showToast) {
      window.showToast(lang === 'ta' ? "அறிக்கை தமிழாக்கம் செய்யப்பட்டது" : "Report language set to English", "info");
    }
  }

  renderFinalReport() {
    const container = document.getElementById('final-report-container');
    if (!container) return;

    const d = this.reportData[this.currentLanguage];

    container.innerHTML = `
      <div class="rep-header">
        <span class="rep-mission-code">${d.code}</span>
        <h3 class="rep-title">${d.title}</h3>
        <div class="rep-meta-grid">
          <div class="rm-cell">
            <span class="rm-label">${d.locationLabel}</span>
            <span class="rm-val">${d.locationVal}</span>
          </div>
          <div class="rm-cell">
            <span class="rm-label">${d.durationLabel}</span>
            <span class="rm-val text-cyan">${d.durationVal}</span>
          </div>
          <div class="rm-cell">
            <span class="rm-label">${d.riskLabel}</span>
            <span class="rm-val text-crimson">${d.riskVal}</span>
          </div>
        </div>
      </div>

      <div class="rep-section">
        <h4 class="rep-sec-title">${d.overviewTitle}</h4>
        <p class="rep-body-text">${d.overviewText}</p>
      </div>

      <div class="rep-section">
        <h4 class="rep-sec-title">${d.findingsTitle}</h4>
        <table class="rep-findings-table">
          <thead>
            <tr>
              <th>${d.colSensor}</th>
              <th>${d.colReading}</th>
              <th>${d.colStatus}</th>
            </tr>
          </thead>
          <tbody>
            ${d.findings.map(f => `
              <tr>
                <td><b>${f.sensor}</b></td>
                <td><span class="text-amber text-mono">${f.reading}</span></td>
                <td><span class="text-emerald">${f.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="rep-section">
        <h4 class="rep-sec-title">${d.agentDecisionsTitle}</h4>
        <p class="rep-body-text">${d.agentDecisionsText}</p>
      </div>

      <div class="rep-section">
        <h4 class="rep-sec-title">${d.actionsTitle}</h4>
        <p class="rep-body-text">${d.actionsText}</p>
      </div>

      <div class="rep-section">
        <h4 class="rep-sec-title">${d.recommendationsTitle}</h4>
        <p class="rep-body-text">${d.recommendationsText}</p>
      </div>

      <div class="confidence-meter">
        <span class="cm-score">${d.confidenceScore}</span>
        <span class="cm-desc">${d.confidenceDesc}</span>
      </div>
    `;
  }

  bindReplayEngine() {
    const scrubber = document.getElementById('replay-scrubber');
    const btnPlay = document.getElementById('btn-replay-play');
    const btnReset = document.getElementById('btn-replay-reset');
    const timeDisplay = document.getElementById('replay-current-timestamp');
    const syncText = document.getElementById('replay-sync-text');

    if (scrubber) {
      scrubber.addEventListener('input', (e) => {
        this.replayProgress = parseInt(e.target.value);
        this.updateReplayState(this.replayProgress);
      });
    }

    if (btnPlay) {
      btnPlay.addEventListener('click', () => {
        this.replayPlaying = !this.replayPlaying;
        if (this.replayPlaying) {
          btnPlay.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`;
          audioFx.playConfirm();
          this.startReplayTimer();
        } else {
          btnPlay.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
          audioFx.playClick();
          clearInterval(this.replayInterval);
        }
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        this.replayProgress = 0;
        if (scrubber) scrubber.value = 0;
        this.updateReplayState(0);
        audioFx.playClick();
      });
    }

    const speedBtns = document.querySelectorAll('.speed-btn');
    speedBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        speedBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.replaySpeed = parseInt(btn.dataset.speed);
        audioFx.playClick();
        if (this.replayPlaying) {
          this.startReplayTimer();
        }
      });
    });
  }

  startReplayTimer() {
    if (this.replayInterval) clearInterval(this.replayInterval);
    const scrubber = document.getElementById('replay-scrubber');

    this.replayInterval = setInterval(() => {
      if (this.replayProgress < 100) {
        this.replayProgress += 1;
        if (scrubber) scrubber.value = this.replayProgress;
        this.updateReplayState(this.replayProgress);
      } else {
        this.replayProgress = 100;
        this.replayPlaying = false;
        clearInterval(this.replayInterval);
        const btnPlay = document.getElementById('btn-replay-play');
        if (btnPlay) {
          btnPlay.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
        }
      }
    }, 400 / this.replaySpeed);
  }

  updateReplayState(progress) {
    // 0% is 09:42:00, 100% is 10:14:00 (32 minutes = 1920 seconds)
    const totalSecs = 1920;
    const elapsedSecs = Math.round((progress / 100) * totalSecs);
    const startMins = 42;
    const curMins = Math.floor(startMins + elapsedSecs / 60);
    const curSecs = elapsedSecs % 60;
    const curHour = curMins >= 60 ? 10 : 9;
    const displayMin = curMins >= 60 ? curMins - 60 : curMins;

    const timeStr = `${String(curHour).padStart(2, '0')}:${String(displayMin).padStart(2, '0')}:${String(curSecs).padStart(2, '0')}`;
    
    const timeDisplay = document.getElementById('replay-current-timestamp');
    const syncText = document.getElementById('replay-sync-text');

    if (timeDisplay) timeDisplay.textContent = timeStr;
    if (syncText) syncText.textContent = `Synchronizing Rover, Sensors, Risk & Victims at ${timeStr}`;

    // Synchronize Rover step on map
    if (progress % 20 === 0) {
      missionMap.stepRover();
    }
  }
}

export const reports = new ReportsController();
