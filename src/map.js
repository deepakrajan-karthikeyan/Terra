// ==========================================================================
// MISSION LEAFLET MAP CONTROLLER
// Manages Tactical Mission Map, Home Mini-Map, Rover Dexter, Victims,
// Hazards, Gas Plume, Live Environmental API (Open-Meteo), and
// Geocoding & Search APIs (OpenStreetMap Nominatim)
// ==========================================================================

import { audioFx } from './audio.js';

export class MissionMapController {
  constructor() {
    this.map = null;
    this.miniMap = null;
    this.roverMarker = null;
    this.miniRoverMarker = null;
    this.userGpsMarker = null;
    this.searchMarker = null;
    this.victimMarkers = [];
    this.miniVictimMarkers = [];
    this.hazardLayers = [];
    this.thermalLayers = [];
    this.gasLayers = [];
    this.routeLayers = [];
    this.resourceMarkers = [];
    this.tileLayer = null;
    this.miniTileLayer = null;
    this.miniTileMode = 'dark'; // 'dark' | 'satellite'

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
    // 1. Initialize Main Mission Leaflet Map if container exists
    const mapEl = document.getElementById('mission-map');
    if (mapEl && !this.map && typeof L !== 'undefined') {
      this.map = L.map('mission-map', {
        center: this.centerCoords,
        zoom: 17,
        zoomControl: true,
        attributionControl: false
      });

      // Dark Matter Tactical Map Tiles (Default)
      this.setTileStyle('dark');

      // Add Incident Epicenter
      this.renderIncidentEpicenter(this.map);

      // Add Risk Zones (Slope Failure Polygon)
      this.renderRiskZones(this.map);

      // Add Thermal Hazards
      this.renderThermalHazards(this.map);

      // Add Gas Hazard Plume (Toxic Corridor)
      this.renderGasPlume(this.map);

      // Add Blocked and Safe Routes
      this.renderRoutes(this.map);

      // Add Rescue Resources (Team Alpha, Medic Drone)
      this.renderResources(this.map);

      // Add Detected Victims
      this.renderVictims(this.map);

      // Add Rover Dexter
      this.renderRover(this.map);

      // Listen to Map HUD Controls
      this.bindControls();
    }

    // 2. Initialize Home Interactive Mini-Map
    this.initMiniMap();

    // 3. Fetch Live Real-Time Environmental Data from Open-Meteo API
    this.fetchLiveEnvironmentalData(this.centerCoords[0], this.centerCoords[1]);

    // 4. Fetch Reverse Geocoded Location Name from OpenStreetMap Nominatim API
    this.fetchLocationName(this.centerCoords[0], this.centerCoords[1]);
  }

  // ------------------------------------------------------------------------
  // HOME INTERACTIVE MINI-MAP
  // ------------------------------------------------------------------------
  initMiniMap() {
    const miniEl = document.getElementById('home-mini-map');
    if (!miniEl || this.miniMap || typeof L === 'undefined') return;

    this.miniMap = L.map('home-mini-map', {
      center: this.centerCoords,
      zoom: 16,
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      scrollWheelZoom: false,
      doubleClickZoom: true,
      touchZoom: true
    });

    // Add Dark Matter Tile Layer to Mini-Map
    this.setMiniTileStyle('dark');

    // Add Mini Epicenter Pin
    this.renderMiniEpicenter();

    // Add Mini Risk Zone Polygon
    const riskCoords = [
      [10.9615, 78.0755],
      [10.9620, 78.0775],
      [10.9605, 78.0785],
      [10.9592, 78.0772],
      [10.9590, 78.0752]
    ];
    L.polygon(riskCoords, {
      color: '#ef4444',
      weight: 1.5,
      dashArray: '4, 4',
      fillColor: '#ef4444',
      fillOpacity: 0.2
    }).addTo(this.miniMap);

    // Add Mini Victims
    this.renderMiniVictims();

    // Add Mini Rover Dexter Marker
    this.renderMiniRover();

    // Bind Home Mini Map Controls
    const btnTile = document.getElementById('btn-home-map-tile');
    if (btnTile) {
      btnTile.addEventListener('click', () => this.toggleMiniMapTile());
    }

    const btnRecenter = document.getElementById('btn-home-map-recenter');
    if (btnRecenter) {
      btnRecenter.addEventListener('click', () => this.recenterMiniMap());
    }
  }

  setMiniTileStyle(style) {
    if (this.miniTileLayer) {
      this.miniMap.removeLayer(this.miniTileLayer);
    }
    if (style === 'satellite') {
      this.miniTileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19
      });
    } else {
      this.miniTileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd'
      });
    }
    this.miniTileLayer.addTo(this.miniMap);
  }

  toggleMiniMapTile() {
    this.miniTileMode = this.miniTileMode === 'dark' ? 'satellite' : 'dark';
    this.setMiniTileStyle(this.miniTileMode);
    const btn = document.getElementById('btn-home-map-tile');
    if (btn) {
      btn.innerHTML = this.miniTileMode === 'dark' ? '<span>🛰️ SATELLITE</span>' : '<span>🗺️ TACTICAL</span>';
    }
    audioFx.playClick();
  }

  recenterMiniMap() {
    if (this.miniRoverMarker && this.miniMap) {
      this.miniMap.setView(this.miniRoverMarker.getLatLng(), 16, { animate: true });
      audioFx.playClick();
    }
  }

  renderMiniEpicenter() {
    const icon = L.divIcon({
      className: 'mini-epicenter-pin',
      html: `
        <div style="background:rgba(239,68,68,0.95); border:1.5px solid #fff; color:#fff; font-family:'Chakra Petch'; font-size:9px; font-weight:700; padding:1px 5px; border-radius:4px; box-shadow:0 0 8px rgba(239,68,68,0.8); white-space:nowrap;">
          ZONE 04
        </div>
      `,
      iconSize: [60, 20],
      iconAnchor: [30, 20]
    });
    L.marker(this.centerCoords, { icon }).addTo(this.miniMap);
  }

  renderMiniVictims() {
    const victims = [
      { coords: [10.9608, 78.0772], color: '#ef4444' },
      { coords: [10.9598, 78.0759], color: '#f59e0b' },
      { coords: [10.9612, 78.0761], color: '#06b6d4' }
    ];
    victims.forEach(v => {
      const vIcon = L.divIcon({
        className: 'mini-v-pin',
        html: `<div style="background:${v.color}; border:1.5px solid #fff; width:14px; height:14px; border-radius:50%; box-shadow:0 0 8px ${v.color};"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });
      const m = L.marker(v.coords, { icon: vIcon }).addTo(this.miniMap);
      this.miniVictimMarkers.push(m);
    });
  }

  renderMiniRover() {
    const curPos = this.roverPath[this.roverPathIndex];
    const roverIcon = L.divIcon({
      className: 'mini-rover-pin',
      html: `
        <div style="position:relative; width:26px; height:26px; display:flex; align-items:center; justify-content:center;">
          <div style="position:absolute; width:26px; height:26px; border-radius:50%; background:rgba(6,182,212,0.4); animation:pulse-ring 1.8s infinite;"></div>
          <div style="background:#0284c7; border:2px solid #38bdf8; color:#fff; width:20px; height:20px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:10px; box-shadow:0 0 10px #06b6d4;">
            🤖
          </div>
        </div>
      `,
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });
    this.miniRoverMarker = L.marker(curPos, { icon: roverIcon, zIndexOffset: 800 }).addTo(this.miniMap);
  }

  // ------------------------------------------------------------------------
  // OPEN-METEO ENVIRONMENTAL HAZARD WEATHER API
  // ------------------------------------------------------------------------
  async fetchLiveEnvironmentalData(lat, lon) {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,surface_pressure`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Weather API Error: ${res.status}`);
      const data = await res.json();

      if (data && data.current) {
        const temp = data.current.temperature_2m;
        const humidity = data.current.relative_humidity_2m;
        const wind = data.current.wind_speed_10m;
        const precip = data.current.precipitation || 0;

        // Update UI Elements
        const elTemp = document.getElementById('api-weather-temp');
        if (elTemp) elTemp.textContent = `${Math.round(temp)}°C`;

        const elHum = document.getElementById('api-weather-humidity');
        if (elHum) elHum.textContent = `${Math.round(humidity)}%`;

        const elWind = document.getElementById('api-weather-wind');
        if (elWind) elWind.textContent = `${wind.toFixed(1)} km/h`;

        // Calculate dynamic terrain risk score
        const elRisk = document.getElementById('api-weather-risk');
        if (elRisk) {
          if (precip > 2.0 || wind > 28) {
            elRisk.textContent = 'CRITICAL';
            elRisk.className = 'ew-val text-crimson';
          } else if (precip > 0.1 || wind > 18) {
            elRisk.textContent = 'HIGH';
            elRisk.className = 'ew-val text-amber';
          } else if (wind > 10) {
            elRisk.textContent = 'ELEVATED';
            elRisk.className = 'ew-val text-amber';
          } else {
            elRisk.textContent = 'MODERATE';
            elRisk.className = 'ew-val text-cyan';
          }
        }
      }
    } catch (err) {
      console.warn("⚠️ Live Weather API request failed, keeping fallback:", err);
      const elTemp = document.getElementById('api-weather-temp');
      if (elTemp && elTemp.textContent === '--°C') elTemp.textContent = '29°C';
      const elHum = document.getElementById('api-weather-humidity');
      if (elHum && elHum.textContent === '--%') elHum.textContent = '68%';
      const elWind = document.getElementById('api-weather-wind');
      if (elWind && elWind.textContent === '-- km/h') elWind.textContent = '14.2 km/h';
    }
  }

  // ------------------------------------------------------------------------
  // OPENSTREETMAP NOMINATIM REVERSE GEOCODING API
  // ------------------------------------------------------------------------
  async fetchLocationName(lat, lon) {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'InzoraTerraTactical/2.4' }
      });
      if (!res.ok) throw new Error(`Reverse Geocode Error: ${res.status}`);
      const data = await res.json();

      if (data && data.address) {
        const addr = data.address;
        const placeName = addr.suburb || addr.town || addr.city || addr.county || addr.state_district || 'Karur Sector';
        const stateName = addr.state || 'Tamil Nadu';
        
        const elGeo = document.getElementById('home-geo-location');
        if (elGeo) {
          elGeo.textContent = `${placeName}, ${stateName} (${lat.toFixed(4)}° N, ${lon.toFixed(4)}° E)`;
        }
      }
    } catch (err) {
      console.warn("⚠️ Reverse Geocode API request failed, keeping default coordinates:", err);
    }
  }

  // ------------------------------------------------------------------------
  // OPENSTREETMAP NOMINATIM SEARCH API
  // ------------------------------------------------------------------------
  async searchLocation(query) {
    if (!query || query.trim().length < 2) return;
    const cleanQ = query.trim();

    const resultsContainer = document.getElementById('map-search-results');
    if (resultsContainer) {
      resultsContainer.innerHTML = '<div class="search-result-item"><span class="s-item-sub">Scanning Global Geodetic Satellites...</span></div>';
      resultsContainer.classList.remove('hidden');
    }

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(cleanQ)}`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'InzoraTerraTactical/2.4' }
      });
      if (!res.ok) throw new Error(`Search API Error: ${res.status}`);
      const list = await res.json();

      if (!resultsContainer) return;
      resultsContainer.innerHTML = '';

      if (!list || list.length === 0) {
        resultsContainer.innerHTML = '<div class="search-result-item"><span class="s-item-sub">No matching tactical sectors found.</span></div>';
        return;
      }

      list.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = 'search-result-item';
        
        const titleSpan = document.createElement('span');
        titleSpan.className = 's-item-title';
        titleSpan.textContent = item.display_name.split(',')[0];

        const subSpan = document.createElement('span');
        subSpan.className = 's-item-sub';
        subSpan.textContent = item.display_name;

        itemEl.appendChild(titleSpan);
        itemEl.appendChild(subSpan);

        itemEl.addEventListener('click', () => {
          const targetLat = parseFloat(item.lat);
          const targetLon = parseFloat(item.lon);
          this.flyToLocation(targetLat, targetLon, item.display_name);
          resultsContainer.classList.add('hidden');
        });

        resultsContainer.appendChild(itemEl);
      });
    } catch (err) {
      console.warn("⚠️ Nominatim search error:", err);
      if (resultsContainer) {
        resultsContainer.innerHTML = '<div class="search-result-item"><span class="s-item-sub">Search connection timed out.</span></div>';
      }
    }
  }

  flyToLocation(lat, lon, label) {
    if (!this.map) return;
    this.map.flyTo([lat, lon], 16, { duration: 1.2 });

    // Place or Move Tactical Search Marker
    if (this.searchMarker) {
      this.searchMarker.setLatLng([lat, lon]);
    } else {
      const sIcon = L.divIcon({
        className: 'search-target-pin',
        html: `
          <div style="background:rgba(6,182,212,0.9); border:2px solid #fff; color:#fff; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 0 16px #06b6d4; font-size:14px;">
            🎯
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });
      this.searchMarker = L.marker([lat, lon], { icon: sIcon }).addTo(this.map);
    }

    this.searchMarker.bindPopup(`
      <div style="font-family:'Inter'; color:#0f172a; font-size:12px;">
        <b style="color:#0284c7;">Tactical Search Pin</b><br>
        ${label}<br>
        Coords: ${lat.toFixed(4)}° N, ${lon.toFixed(4)}° E
      </div>
    `).openPopup();

    // Fetch Weather for this searched location!
    this.fetchLiveEnvironmentalData(lat, lon);
    audioFx.playConfirm();

    if (window.showToast) {
      window.showToast(`🎯 Position Locked: ${label.split(',')[0]}`, 'info');
    }
  }

  // ------------------------------------------------------------------------
  // USER DEVICE GPS GEOLOCATION API
  // ------------------------------------------------------------------------
  locateUser() {
    if (!navigator.geolocation) {
      if (window.showToast) window.showToast('GPS Hardware not supported on this client', 'error');
      return;
    }

    if (window.showToast) window.showToast('Acquiring live GPS satellite lock...', 'info');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const uLat = pos.coords.latitude;
        const uLon = pos.coords.longitude;
        const acc = pos.coords.accuracy;

        if (this.map) {
          this.map.flyTo([uLat, uLon], 17, { duration: 1.2 });

          if (this.userGpsMarker) {
            this.userGpsMarker.setLatLng([uLat, uLon]);
          } else {
            const gpsIcon = L.divIcon({
              className: 'gps-user-pin',
              html: `
                <div style="position:relative; width:36px; height:36px; display:flex; align-items:center; justify-content:center;">
                  <div style="position:absolute; width:36px; height:36px; border-radius:50%; background:rgba(16,185,129,0.4); animation:pulse-ring 1.8s infinite;"></div>
                  <div style="background:#10b981; border:2.5px solid #fff; color:#fff; width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:13px; box-shadow:0 0 14px rgba(16,185,129,0.8);">
                    📡
                  </div>
                </div>
              `,
              iconSize: [36, 36],
              iconAnchor: [18, 18]
            });
            this.userGpsMarker = L.marker([uLat, uLon], { icon: gpsIcon, zIndexOffset: 950 }).addTo(this.map);
          }

          this.userGpsMarker.bindPopup(`
            <div style="font-family:'Inter'; color:#0f172a; font-size:12px;">
              <b style="color:#059669;">Device GPS Mobile Command</b><br>
              Accuracy: ±${Math.round(acc)} meters<br>
              Lat/Lon: ${uLat.toFixed(5)}, ${uLon.toFixed(5)}<br>
              Status: SECURE TELEMETRY LINK
            </div>
          `).openPopup();
        }

        // Live Environmental and Location Name sync for User GPS
        this.fetchLiveEnvironmentalData(uLat, uLon);
        this.fetchLocationName(uLat, uLon);

        audioFx.playConfirm();
        if (window.showToast) {
          window.showToast(`📍 Live GPS Locked (±${Math.round(acc)}m accuracy)`, 'success');
        }
      },
      (err) => {
        console.warn("GPS Geolocation error:", err.message);
        if (window.showToast) {
          window.showToast(`GPS Position Unavailable: ${err.message}`, 'error');
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }

  // ------------------------------------------------------------------------
  // MAIN MISSION MAP TILE SYSTEM
  // ------------------------------------------------------------------------
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

  renderIncidentEpicenter(targetMap) {
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

    L.marker(this.centerCoords, { icon }).addTo(targetMap)
      .bindPopup(`
        <div style="font-family:'Inter'; color:#0f172a; font-size:12px;">
          <b style="color:#dc2626;">Landslide Epicenter — Karur</b><br>
          Slope failure gradient: 38.4°<br>
          Estimated soil displacement: 14,000 m³<br>
          Status: ACTIVE HAZARD
        </div>
      `);
  }

  renderRiskZones(targetMap) {
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
    }).addTo(targetMap);

    poly.bindTooltip("⚠️ High Risk Zone: Active Slope Creep", { sticky: true });
    this.hazardLayers.push(poly);
  }

  renderThermalHazards(targetMap) {
    const heat1 = L.circle([10.9605, 78.0768], {
      radius: 45,
      color: '#f97316',
      weight: 1.5,
      fillColor: '#ea580c',
      fillOpacity: 0.35
    }).addTo(targetMap);
    heat1.bindTooltip("🔥 Thermal Core: 52°C Friction Heat", { sticky: true });
    this.thermalLayers.push(heat1);

    const heat2 = L.circle([10.9599, 78.0761], {
      radius: 30,
      color: '#f97316',
      weight: 1.5,
      fillColor: '#f97316',
      fillOpacity: 0.3
    }).addTo(targetMap);
    heat2.bindTooltip("🔥 Thermal Anomaly: 44°C", { sticky: true });
    this.thermalLayers.push(heat2);
  }

  renderGasPlume(targetMap) {
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
    }).addTo(targetMap);

    gasPoly.bindTooltip("☣️ Toxic Plume: H2S/CO (74 ppm) - Respirators Required", { sticky: true });
    this.gasLayers.push(gasPoly);
  }

  renderRoutes(targetMap) {
    const blockedRoute = L.polyline([
      [10.9595, 78.0752],
      [10.9597, 78.0765],
      [10.9600, 78.0770]
    ], {
      color: '#dc2626',
      weight: 4,
      dashArray: '8, 8',
      opacity: 0.85
    }).addTo(targetMap);
    blockedRoute.bindTooltip("🚧 Blocked Trail: 350t Debris Collapse", { sticky: true });
    this.routeLayers.push(blockedRoute);

    const safeRoute = L.polyline([
      [10.9590, 78.0745],
      [10.9605, 78.0750],
      [10.9616, 78.0760],
      [10.9610, 78.0770]
    ], {
      color: '#10b981',
      weight: 4,
      opacity: 0.9
    }).addTo(targetMap);
    safeRoute.bindTooltip("✅ Safe Evacuation Corridor (Team Alpha Recommended)", { sticky: true });
    this.routeLayers.push(safeRoute);
  }

  renderResources(targetMap) {
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

    const alphaMarker = L.marker([10.9590, 78.0745], { icon: alphaIcon }).addTo(targetMap)
      .bindPopup(`
        <div style="font-family:'Inter'; color:#0f172a; font-size:12px;">
          <b>Rescue Team Alpha (Field Unit)</b><br>
          Personnel: 4 Paramedics + 1 K9 Handler<br>
          Status: STAGED & READY FOR DISPATCH<br>
          ETA to Victim 1: 4.8 mins via North Ridge
        </div>
      `);
    this.resourceMarkers.push(alphaMarker);

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

    const droneMarker = L.marker([10.9618, 78.0748], { icon: droneIcon }).addTo(targetMap)
      .bindPopup(`
        <div style="font-family:'Inter'; color:#0f172a; font-size:12px;">
          <b>Medic Drone Hermes-02</b><br>
          Payload: Oxygen kits, tourniquets, radio beacon<br>
          Battery: 94% • Aerial Coverage Active
        </div>
      `);
    this.resourceMarkers.push(droneMarker);
  }

  renderVictims(targetMap) {
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

      const marker = L.marker(v.coords, { icon: vIcon }).addTo(targetMap)
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

  renderRover(targetMap) {
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

    this.roverMarker = L.marker(curPos, { icon: roverIcon, zIndexOffset: 1000 }).addTo(targetMap)
      .bindPopup(`
        <div style="font-family:'Inter'; color:#0f172a; font-size:12px;">
          <b style="color:#0284c7;">Dexter MK-IV Rover</b><br>
          Status: ACTIVE SCANNING<br>
          Battery: 82% • Speed: 1.8 m/s<br>
          GPS Accuracy: ±1.8 cm RTK Fixed<br>
          Payload: FLIR Lepton, GPR, PID Gas Sensor
        </div>
      `);

    const trailPoints = this.roverPath.slice(0, this.roverPathIndex + 1);
    this.roverTrail = L.polyline(trailPoints, {
      color: '#06b6d4',
      weight: 3,
      dashArray: '3, 6',
      opacity: 0.75
    }).addTo(targetMap);
  }

  stepRover() {
    this.roverPathIndex = (this.roverPathIndex + 1) % this.roverPath.length;
    const newPos = this.roverPath[this.roverPathIndex];
    
    // Update Main Map Rover
    if (this.roverMarker) {
      this.roverMarker.setLatLng(newPos);
      if (this.map) this.map.panTo(newPos, { animate: true, duration: 0.6 });
    }
    if (this.roverTrail) {
      const trail = this.roverPath.slice(0, this.roverPathIndex + 1);
      this.roverTrail.setLatLngs(trail);
    }

    // Update Mini Map Rover
    if (this.miniRoverMarker) {
      this.miniRoverMarker.setLatLng(newPos);
      if (this.miniMap) this.miniMap.panTo(newPos, { animate: true, duration: 0.6 });
    }

    audioFx.playConfirm();
  }

  recenterOnRover() {
    if (this.roverMarker && this.map) {
      this.map.setView(this.roverMarker.getLatLng(), 17, { animate: true });
      audioFx.playClick();
    }
  }

  bindControls() {
    // Recenter Main Mission Map
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

    // Device GPS Button
    const btnGps = document.getElementById('map-btn-gps');
    if (btnGps) {
      btnGps.addEventListener('click', () => {
        this.locateUser();
      });
    }

    // Search Bar Controls
    const searchInput = document.getElementById('map-search-input');
    const btnSearchGo = document.getElementById('map-btn-search-go');
    const btnSearchClear = document.getElementById('map-btn-search-clear');
    const searchResults = document.getElementById('map-search-results');

    if (btnSearchGo && searchInput) {
      btnSearchGo.addEventListener('click', () => {
        this.searchLocation(searchInput.value);
      });
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.searchLocation(searchInput.value);
        }
      });
      searchInput.addEventListener('input', () => {
        if (btnSearchClear) {
          if (searchInput.value.length > 0) btnSearchClear.classList.remove('hidden');
          else btnSearchClear.classList.add('hidden');
        }
      });
    }

    if (btnSearchClear && searchInput) {
      btnSearchClear.addEventListener('click', () => {
        searchInput.value = '';
        btnSearchClear.classList.add('hidden');
        if (searchResults) searchResults.classList.add('hidden');
      });
    }

    // Close search dropdown on click outside
    document.addEventListener('click', (e) => {
      if (searchResults && !searchResults.contains(e.target) && e.target !== searchInput && e.target !== btnSearchGo) {
        searchResults.classList.add('hidden');
      }
    });

    // Step Rover simulation button
    const btnStep = document.getElementById('btn-sim-rover-step');
    if (btnStep) {
      btnStep.addEventListener('click', () => this.stepRover());
    }

    // Layer checkboxes
    const chkRover = document.getElementById('layer-chk-rover');
    if (chkRover) {
      chkRover.addEventListener('change', (e) => {
        if (this.roverMarker && this.map) {
          if (e.target.checked) this.roverMarker.addTo(this.map);
          else this.map.removeLayer(this.roverMarker);
        }
      });
    }

    const chkVictims = document.getElementById('layer-chk-victims');
    if (chkVictims) {
      chkVictims.addEventListener('change', (e) => {
        this.victimMarkers.forEach(m => {
          if (this.map) {
            if (e.target.checked) m.addTo(this.map);
            else this.map.removeLayer(m);
          }
        });
      });
    }

    const chkHazards = document.getElementById('layer-chk-hazards');
    if (chkHazards) {
      chkHazards.addEventListener('change', (e) => {
        this.hazardLayers.forEach(l => {
          if (this.map) {
            if (e.target.checked) l.addTo(this.map);
            else this.map.removeLayer(l);
          }
        });
      });
    }

    const chkThermal = document.getElementById('layer-chk-thermal');
    if (chkThermal) {
      chkThermal.addEventListener('change', (e) => {
        this.thermalLayers.forEach(l => {
          if (this.map) {
            if (e.target.checked) l.addTo(this.map);
            else this.map.removeLayer(l);
          }
        });
      });
    }

    const chkGas = document.getElementById('layer-chk-gas');
    if (chkGas) {
      chkGas.addEventListener('change', (e) => {
        this.gasLayers.forEach(l => {
          if (this.map) {
            if (e.target.checked) l.addTo(this.map);
            else this.map.removeLayer(l);
          }
        });
      });
    }

    const chkRoutes = document.getElementById('layer-chk-routes');
    if (chkRoutes) {
      chkRoutes.addEventListener('change', (e) => {
        this.routeLayers.forEach(l => {
          if (this.map) {
            if (e.target.checked) l.addTo(this.map);
            else this.map.removeLayer(l);
          }
        });
      });
    }

    const chkResources = document.getElementById('layer-chk-resources');
    if (chkResources) {
      chkResources.addEventListener('change', (e) => {
        this.resourceMarkers.forEach(m => {
          if (this.map) {
            if (e.target.checked) m.addTo(this.map);
            else this.map.removeLayer(m);
          }
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
    if (this.miniMap) {
      setTimeout(() => this.miniMap.invalidateSize(), 150);
    }
  }
}

export const missionMap = new MissionMapController();
