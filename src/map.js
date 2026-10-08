// ==========================================================================
// MISSION LEAFLET MAP CONTROLLER
// Manages Tactical Map, Rover Dexter, Victims, Hazards, Gas Plume & Safe Paths
// ==========================================================================

import { audioFx } from './audio.js';

export class MissionMapController {
  constructor() {
    this.map = null;
    this.roverMarker = null;
    this.victimMarkers = [];
    this.hazardLayers = [];
    this.thermalLayers = [];
    this.gasLayers = [];
    this.routeLayers = [];
    this.resourceMarkers = [];
    this.tileLayer = null;

    // Mission Coordinates (Karur Sector 04, Tamil Nadu)
    this.centerCoords = [10.9601, 78.0766];
    
    // Rover Path Waypoints
    this.roverPath = [
      [10.9595, 78.0752],
      [10.9598, 78.0758],
      [10.9601, 78.0766], // Current
      [10.9604, 78.0770],
      [10.9608, 78.0772], // Near Victim 1
    ];
    this.roverPathIndex = 2;
    this.roverTrail = null;
  }

  init() {
    if (this.map) return;
    const mapEl = document.getElementById('mission-map');
    if (!mapEl) return;

    // Initialize Leaflet Map
    this.map = L.map('mission-map', {
      center: this.centerCoords,
      zoom: 17,
      zoomControl: true,
      attributionControl: false
    });

    // Dark Matter Tactical Map Tiles (Default)
    this.setTileStyle('dark');

    // Add Incident Epicenter
    this.renderIncidentEpicenter();

    // Add Risk Zones (Slope Failure Polygon)
    this.renderRiskZones();

    // Add Thermal Hazards
    this.renderThermalHazards();

    // Add Gas Hazard Plume (Toxic Corridor)
    this.renderGasPlume();

    // Add Blocked and Safe Routes
    this.renderRoutes();

    // Add Rescue Resources (Team Alpha, Medic Drone)
    this.renderResources();

    // Add Detected Victims
    this.renderVictims();

    // Add Rover Dexter
    this.renderRover();

    // Listen to Map HUD Controls
    this.bindControls();
  }

  setTileStyle(style) {
    if (this.tileLayer) {
      this.map.removeLayer(this.tileLayer);
    }

    if (style === 'satellite') {
      this.tileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19
      });
    } else if (style === 'topo') {
      this.tileLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        maxZoom: 17
      });
    } else {
      // Dark Matter
      this.tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd'
      });
    }
    this.tileLayer.addTo(this.map);
  }

  renderIncidentEpicenter() {
    const icon = L.divIcon({
      className: 'epicenter-pin-wrap',
      html: `
        <div style="display:flex; flex-direction:column; align-items:center;">
          <div style="background:rgba(239,68,68,0.9); border:2px solid #fff; color:#fff; font-family:'Chakra Petch'; font-size:10px; font-weight:700; padding:2px 6px; border-radius:4px; box-shadow:0 0 10px rgba(239,68,68,0.8); white-space:nowrap;">
            📍 INCIDENT ZONE 04
          </div>
          <div style="width:2px; height:8px; background:#ef4444;"></div>
        </div>
      `,
      iconSize: [120, 30],
      iconAnchor: [60, 30]
    });

    L.marker(this.centerCoords, { icon }).addTo(this.map)
      .bindPopup(`
        <div style="font-family:'Inter'; color:#0f172a; font-size:12px;">
          <b style="color:#dc2626;">Landslide Epicenter — Karur</b><br>
          Slope failure gradient: 38.4°<br>
          Estimated soil displacement: 14,000 m³<br>
          Status: ACTIVE HAZARD
        </div>
      `);
  }

  renderRiskZones() {
    // Unstable Slope Failure Polygon
    const riskCoords = [
      [10.9615, 78.0755],
      [10.9620, 78.0775],
      [10.9605, 78.0785],
      [10.9592, 78.0772],
      [10.9590, 78.0752]
    ];

    const poly = L.polygon(riskCoords, {
      color: '#ef4444',
      weight: 2,
      dashArray: '6, 6',
      fillColor: '#ef4444',
      fillOpacity: 0.18
    }).addTo(this.map);

    poly.bindTooltip("⚠️ High Risk Zone: Active Slope Creep", { sticky: true });
    this.hazardLayers.push(poly);
  }

  renderThermalHazards() {
    // High heat subterranean friction anomaly
    const heat1 = L.circle([10.9605, 78.0768], {
      radius: 45,
      color: '#f97316',
      weight: 1.5,
      fillColor: '#ea580c',
      fillOpacity: 0.35
    }).addTo(this.map);
    heat1.bindTooltip("🔥 Thermal Core: 52°C Friction Heat", { sticky: true });
    this.thermalLayers.push(heat1);

    const heat2 = L.circle([10.9599, 78.0761], {
      radius: 30,
      color: '#f97316',
      weight: 1.5,
      fillColor: '#f97316',
      fillOpacity: 0.3
    }).addTo(this.map);
    heat2.bindTooltip("🔥 Thermal Anomaly: 44°C", { sticky: true });
    this.thermalLayers.push(heat2);
  }

  renderGasPlume() {
    // Toxic gas plume corridor (H2S / Methane / CO)
    const gasCoords = [
      [10.9597, 78.0762],
      [10.9602, 78.0778],
      [10.9594, 78.0782],
      [10.9591, 78.0766]
    ];

    const gasPoly = L.polygon(gasCoords, {
      color: '#eab308',
      weight: 1.5,
      dashArray: '4, 4',
      fillColor: '#ca8a04',
      fillOpacity: 0.28
    }).addTo(this.map);

    gasPoly.bindTooltip("☣️ Toxic Plume: H2S/CO (74 ppm) - Respirators Required", { sticky: true });
    this.gasLayers.push(gasPoly);
  }

  renderRoutes() {
    // Blocked Route (Rockfall barrier)
    const blockedRoute = L.polyline([
      [10.9595, 78.0752],
      [10.9597, 78.0765],
      [10.9600, 78.0770]
    ], {
      color: '#dc2626',
      weight: 4,
      dashArray: '8, 8',
      opacity: 0.85
    }).addTo(this.map);
    blockedRoute.bindTooltip("🚧 Blocked Trail: 350t Debris Collapse", { sticky: true });
    this.routeLayers.push(blockedRoute);

    // Recommended Safe Extraction Path (Northern Ridge)
    const safeRoute = L.polyline([
      [10.9590, 78.0745],
      [10.9605, 78.0750],
      [10.9616, 78.0760],
      [10.9610, 78.0770]
    ], {
      color: '#10b981',
      weight: 4,
      opacity: 0.9
    }).addTo(this.map);
    safeRoute.bindTooltip("✅ Safe Evacuation Corridor (Team Alpha Recommended)", { sticky: true });
    this.routeLayers.push(safeRoute);
  }

  renderResources() {
    // Rescue Team Alpha Staging
    const alphaIcon = L.divIcon({
      className: 'resource-icon-wrap',
      html: `
        <div style="background:#0284c7; border:2px solid #38bdf8; color:#fff; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 0 12px rgba(2,132,199,0.7); font-size:16px;">
          🚑
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    const alphaMarker = L.marker([10.9590, 78.0745], { icon: alphaIcon }).addTo(this.map)
      .bindPopup(`
        <div style="font-family:'Inter'; color:#0f172a; font-size:12px;">
          <b>Rescue Team Alpha (Field Unit)</b><br>
          Personnel: 4 Paramedics + 1 K9 Handler<br>
          Status: STAGED & READY FOR DISPATCH<br>
          ETA to Victim 1: 4.8 mins via North Ridge
        </div>
      `);
    this.resourceMarkers.push(alphaMarker);

    // Medical Drone LZ
    const droneIcon = L.divIcon({
      className: 'resource-icon-wrap',
      html: `
        <div style="background:#7c3aed; border:2px solid #c084fc; color:#fff; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 0 12px rgba(124,58,237,0.7); font-size:15px;">
          🛸
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const droneMarker = L.marker([10.9618, 78.0748], { icon: droneIcon }).addTo(this.map)
      .bindPopup(`
        <div style="font-family:'Inter'; color:#0f172a; font-size:12px;">
          <b>Medic Drone Hermes-02</b><br>
          Payload: Oxygen kits, tourniquets, radio beacon<br>
          Battery: 94% • Aerial Coverage Active
        </div>
      `);
    this.resourceMarkers.push(droneMarker);
  }

  renderVictims() {
    const victims = [
      {
        id: "V1",
        name: "Victim #01 (Debris Pocket A)",
        coords: [10.9608, 78.0772],
        priority: "CRITICAL",
        temp: "36.8°C",
        vitals: "94% Alive Probability",
        color: "#ef4444"
      },
      {
        id: "V2",
        name: "Victim #02 (Cavity B)",
        coords: [10.9598, 78.0759],
        priority: "HIGH",
        temp: "36.5°C",
        vitals: "88% Alive Probability",
        color: "#f59e0b"
      },
      {
        id: "V3",
        name: "Victim #03 (Lower Slope)",
        coords: [10.9612, 78.0761],
        priority: "MODERATE",
        temp: "35.9°C",
        vitals: "76% Alive Probability",
        color: "#06b6d4"
      }
    ];

    victims.forEach(v => {
      const vIcon = L.divIcon({
        className: 'victim-pin-wrap',
        html: `
          <div style="position:relative; display:flex; align-items:center; justify-content:center;">
            <div style="position:absolute; width:30px; height:30px; border-radius:50%; background:${v.color}; opacity:0.3; animation:pulse-ring 1.8s infinite;"></div>
            <div style="background:${v.color}; border:2px solid #fff; color:#fff; width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-family:'Chakra Petch'; font-size:11px; font-weight:700; box-shadow:0 0 10px ${v.color};">
              🧍
            </div>
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      const marker = L.marker(v.coords, { icon: vIcon }).addTo(this.map)
        .bindPopup(`
          <div style="font-family:'Inter'; color:#0f172a; font-size:12px;">
            <b style="color:${v.color};">${v.name}</b><br>
            Triage: <b>${v.priority}</b><br>
            Thermal Signature: ${v.temp}<br>
            Acoustic Vital Probability: ${v.vitals}<br>
            <span style="font-size:11px; color:#475569;">Detected by Victim Agent via FLIR Radiometry</span>
          </div>
        `);
      this.victimMarkers.push(marker);
    });
  }

  renderRover() {
    const curPos = this.roverPath[this.roverPathIndex];

    const roverIcon = L.divIcon({
      className: 'rover-marker-wrap',
      html: `
        <div style="position:relative; width:44px; height:44px; display:flex; align-items:center; justify-content:center;">
          <div style="position:absolute; width:44px; height:44px; border-radius:50%; border:2px solid #06b6d4; opacity:0.6; animation:pulse-ring 2s infinite;"></div>
          <div style="background:linear-gradient(135deg, #0f172a, #0284c7); border:2.5px solid #06b6d4; color:#fff; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:16px; box-shadow:0 0 16px rgba(6,182,212,0.8);">
            🤖
          </div>
          <div style="position:absolute; top:0; right:0; width:10px; height:10px; border-radius:50%; background:#10b981; border:1.5px solid #fff;"></div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22]
    });

    this.roverMarker = L.marker(curPos, { icon: roverIcon, zIndexOffset: 1000 }).addTo(this.map)
      .bindPopup(`
        <div style="font-family:'Inter'; color:#0f172a; font-size:12px;">
          <b style="color:#0284c7;">Dexter MK-IV Rover</b><br>
          Status: ACTIVE SCANNING<br>
          Battery: 82% • Speed: 1.8 m/s<br>
          GPS Accuracy: ±1.8 cm RTK Fixed<br>
          Payload: FLIR Lepton, GPR, PID Gas Sensor
        </div>
      `);

    // Rover Historic Trail
    const trailPoints = this.roverPath.slice(0, this.roverPathIndex + 1);
    this.roverTrail = L.polyline(trailPoints, {
      color: '#06b6d4',
      weight: 3,
      dashArray: '3, 6',
      opacity: 0.75
    }).addTo(this.map);
  }

  stepRover() {
    this.roverPathIndex = (this.roverPathIndex + 1) % this.roverPath.length;
    const newPos = this.roverPath[this.roverPathIndex];
    if (this.roverMarker) {
      this.roverMarker.setLatLng(newPos);
      this.map.panTo(newPos, { animate: true, duration: 0.6 });
    }
    if (this.roverTrail) {
      const trail = this.roverPath.slice(0, this.roverPathIndex + 1);
      this.roverTrail.setLatLngs(trail);
    }
    audioFx.playConfirm();
  }

  recenterOnRover() {
    if (this.roverMarker) {
      this.map.setView(this.roverMarker.getLatLng(), 17, { animate: true });
      audioFx.playClick();
    }
  }

  bindControls() {
    // Recenter
    const btnRecenter = document.getElementById('map-btn-recenter');
    if (btnRecenter) {
      btnRecenter.addEventListener('click', () => this.recenterOnRover());
    }

    // Layers dropdown toggle
    const btnLayers = document.getElementById('map-btn-layers');
    const panelLayers = document.getElementById('map-layers-panel');
    if (btnLayers && panelLayers) {
      btnLayers.addEventListener('click', (e) => {
        e.stopPropagation();
        panelLayers.classList.toggle('hidden');
        audioFx.playClick();
      });
      document.addEventListener('click', (e) => {
        if (!panelLayers.contains(e.target) && e.target !== btnLayers) {
          panelLayers.classList.add('hidden');
        }
      });
    }

    // Step Rover simulation button
    const btnStep = document.getElementById('btn-sim-rover-step');
    if (btnStep) {
      btnStep.addEventListener('click', () => this.stepRover());
    }

    // Layer checkboxes
    const chkRover = document.getElementById('layer-chk-rover');
    if (chkRover) {
      chkRover.addEventListener('change', (e) => {
        if (this.roverMarker) {
          if (e.target.checked) this.roverMarker.addTo(this.map);
          else this.map.removeLayer(this.roverMarker);
        }
      });
    }

    const chkVictims = document.getElementById('layer-chk-victims');
    if (chkVictims) {
      chkVictims.addEventListener('change', (e) => {
        this.victimMarkers.forEach(m => {
          if (e.target.checked) m.addTo(this.map);
          else this.map.removeLayer(m);
        });
      });
    }

    const chkHazards = document.getElementById('layer-chk-hazards');
    if (chkHazards) {
      chkHazards.addEventListener('change', (e) => {
        this.hazardLayers.forEach(l => {
          if (e.target.checked) l.addTo(this.map);
          else this.map.removeLayer(l);
        });
      });
    }

    const chkThermal = document.getElementById('layer-chk-thermal');
    if (chkThermal) {
      chkThermal.addEventListener('change', (e) => {
        this.thermalLayers.forEach(l => {
          if (e.target.checked) l.addTo(this.map);
          else this.map.removeLayer(l);
        });
      });
    }

    const chkGas = document.getElementById('layer-chk-gas');
    if (chkGas) {
      chkGas.addEventListener('change', (e) => {
        this.gasLayers.forEach(l => {
          if (e.target.checked) l.addTo(this.map);
          else this.map.removeLayer(l);
        });
      });
    }

    const chkRoutes = document.getElementById('layer-chk-routes');
    if (chkRoutes) {
      chkRoutes.addEventListener('change', (e) => {
        this.routeLayers.forEach(l => {
          if (e.target.checked) l.addTo(this.map);
          else this.map.removeLayer(l);
        });
      });
    }

    const chkResources = document.getElementById('layer-chk-resources');
    if (chkResources) {
      chkResources.addEventListener('change', (e) => {
        this.resourceMarkers.forEach(m => {
          if (e.target.checked) m.addTo(this.map);
          else this.map.removeLayer(m);
        });
      });
    }

    // Tile switcher buttons
    const tileBtns = document.querySelectorAll('.tile-btn');
    tileBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tileBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.setTileStyle(btn.dataset.tile);
        audioFx.playClick();
      });
    });
  }

  invalidate() {
    if (this.map) {
      setTimeout(() => this.map.invalidateSize(), 150);
    }
  }
}

export const missionMap = new MissionMapController();
