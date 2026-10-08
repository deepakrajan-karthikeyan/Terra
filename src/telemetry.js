// ==========================================================================
// LIVE TELEMETRY CONTROLLER
// Real-time sensor feeds, canvas sparklines, artificial horizon & anomalies
// ==========================================================================

import { audioFx } from './audio.js';

export class TelemetryController {
  constructor() {
    this.intervalId = null;
    this.refreshRate = 1000;
    this.simStreamActive = true;

    // Live Metrics State
    this.data = {
      battery: 82,
      voltage: 24.8,
      signalDbm: -68,
      speed: 1.8,
      temp: 42.0,
      gas: 74,
      humidity: 68,
      pitch: 8.2,
      roll: 3.4
    };

    // Sparkline history buffers
    this.tempHistory = [39, 40, 40.5, 41, 41.5, 41.8, 42.0, 42.1, 42.0, 42.2];
    this.gasHistory = [62, 65, 68, 70, 71, 72, 73, 74, 73, 74];
  }

  init() {
    this.updateDom();
    this.renderSparklines();
    this.startStream();

    // Bind Anomaly Simulation Trigger
    const btnAnomaly = document.getElementById('btn-sim-trigger-anomaly');
    if (btnAnomaly) {
      btnAnomaly.addEventListener('click', () => this.injectAnomaly());
    }
  }

  startStream() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = setInterval(() => {
      if (this.simStreamActive) {
        this.stepSimulation();
      }
    }, this.refreshRate);
  }

  setRefreshRate(ms) {
    this.refreshRate = ms;
    this.startStream();
    const hzLabel = document.getElementById('telemetry-hz');
    if (hzLabel) {
      hzLabel.textContent = `${(1000 / ms).toFixed(1)} Hz STREAM`;
    }
  }

  setSimStream(active) {
    this.simStreamActive = active;
  }

  stepSimulation() {
    // Subtle realistic random walk on sensors
    this.data.temp = +(this.data.temp + (Math.random() * 0.4 - 0.2)).toFixed(1);
    this.data.gas = Math.round(this.data.gas + (Math.random() * 2 - 1));
    this.data.humidity = Math.round(Math.min(95, Math.max(40, this.data.humidity + (Math.random() * 1 - 0.5))));
    this.data.speed = +(Math.max(0, 1.8 + (Math.random() * 0.3 - 0.15))).toFixed(1);
    this.data.pitch = +(this.data.pitch + (Math.random() * 0.4 - 0.2)).toFixed(1);
    this.data.roll = +(this.data.roll + (Math.random() * 0.3 - 0.15)).toFixed(1);

    // Keep buffer capped at 20 points
    this.tempHistory.push(this.data.temp);
    if (this.tempHistory.length > 20) this.tempHistory.shift();

    this.gasHistory.push(this.data.gas);
    if (this.gasHistory.length > 20) this.gasHistory.shift();

    this.updateDom();
    this.renderSparklines();
  }

  injectAnomaly() {
    audioFx.playAlert();
    this.data.temp = 54.2; // Critical temp spike
    this.data.gas = 118;   // Critical toxic gas spike
    this.data.pitch = 16.8;// Critical rover tilt slope instability
    this.tempHistory.push(this.data.temp);
    this.gasHistory.push(this.data.gas);

    this.updateDom();
    this.renderSparklines();

    // Show Global HITL Alert Banner
    const banner = document.getElementById('hitl-alert-banner');
    if (banner) {
      banner.classList.remove('hidden');
    }

    if (window.showToast) {
      window.showToast("⚠️ HAZARD SPIKE: Gas surged to 118 ppm! Slope tilt 16.8°!", "error");
    }
  }

  updateDom() {
    // Battery
    const elBattery = document.getElementById('val-battery');
    const barBattery = document.getElementById('bar-battery');
    const statBattery = document.getElementById('stat-rover-battery');
    if (elBattery) elBattery.textContent = `${this.data.battery}%`;
    if (barBattery) barBattery.style.width = `${this.data.battery}%`;
    if (statBattery) statBattery.textContent = `${this.data.battery}%`;

    // Speed & Signal
    const elSpeed = document.getElementById('val-speed');
    if (elSpeed) elSpeed.textContent = this.data.speed;

    const elSignal = document.getElementById('val-signal-dbm');
    if (elSignal) elSignal.textContent = `${this.data.signalDbm} dBm`;

    // Temperature
    const elTemp = document.getElementById('val-temp');
    if (elTemp) elTemp.textContent = `${this.data.temp}°`;

    // Gas
    const elGas = document.getElementById('val-gas');
    if (elGas) elGas.textContent = this.data.gas;

    // Humidity
    const elHum = document.getElementById('val-humidity');
    if (elHum) elHum.textContent = `${this.data.humidity}%`;

    // Inclinometer Tilt
    const elTilt = document.getElementById('val-tilt');
    const horizonLine = document.getElementById('horizon-indicator');
    if (elTilt) elTilt.textContent = `${this.data.pitch}°`;
    if (horizonLine) horizonLine.style.transform = `rotate(${this.data.pitch}deg)`;
  }

  renderSparklines() {
    this.drawSparkline('spark-temp', this.tempHistory, '#ef4444', 35, 60);
    this.drawSparkline('spark-gas', this.gasHistory, '#f59e0b', 50, 130);
  }

  drawSparkline(canvasId, data, color, minVal, maxVal) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    if (data.length < 2) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    ctx.beginPath();
    const step = width / (data.length - 1);

    data.forEach((val, i) => {
      const normalized = (val - minVal) / (maxVal - minVal);
      const clamped = Math.max(0, Math.min(1, normalized));
      const y = height - (clamped * (height - 6)) - 3;
      const x = i * step;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.stroke();

    // Subtle area gradient underneath
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fillStyle = color.replace(')', ', 0.15)').replace('rgb', 'rgba');
    ctx.fill();
  }
}

export const telemetry = new TelemetryController();
