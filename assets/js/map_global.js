/**
 * map_global.js - Bab 6: Geo Flow Map Pelayaran Maritim & Logistik Global
 * Dibangun menggunakan LEAFLET JS dengan Basemap Esri Light Gray Canvas
 * Fitur:
 * 1. Segmen Pertama: Aliran Kumulatif Indonesia ke 5 Benua (Asia, Eropa, Oseania, Amerika, Afrika)
 * 2. 3 Filter Dinamis: Komoditas (HS 26 vs 27), Benua (5 Benua), dan Pelabuhan Asal (74 Pelabuhan)
 * 3. Scrollytelling interaktif dengan zoom otomatis per kawasan
 * 4. 100% Data Riil Excel: ekspor_tambang.xlsx, koordinat_negara.xlsx, koordinat_pelabuhan.xlsx
 * 5. Bebas dari istilah "Pelabuhan Hub" atau "Pelabuhan Tujuan"
 */

(function () {
  'use strict';

  let map = null;
  let rawFlowData = null;
  let currentStep = 'bab6-step-kumulatif';
  let activeMode = 'kumulatif'; // 'kumulatif' vs 'detail'
  let activeCommodity = 'all';  // 'all', '26', '27'
  let activeContinent = 'all';  // 'all', 'Asia', 'Eropa', 'Oseania', 'Amerika', 'Afrika', 'AmericasAfrica'
  let activePort = 'all';       // 'all' or port name (e.g. 'BANJARMASIN')

  let routeLayerGroup = null;
  let vesselLayerGroup = null;
  let portLayerGroup = null;
  let destLayerGroup = null;
  let continentLayerGroup = null;

  let activeRoutesList = [];
  let vesselAnimations = [];
  let animFrameId = null;

  // Konfigurasi Tile Server Esri World Light Gray
  const ESRI_LIGHT = {
    base: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    ref:  'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
    attr: 'Tiles &copy; Esri  -  BPS 2025'
  };

  // Sudut Pandang Kamera Leaflet (Zoom & Center per Babak Cerita)
  const CAMERA_VIEWS = {
    'bab6-step-kumulatif':      { center: [16, 75],    zoom: 2.4, mode: 'kumulatif', continent: 'all' },
    'bab6-step-pelabuhan':      { center: [-2.5, 119.5], zoom: 4.8, mode: 'detail',   continent: 'all' },
    'bab6-step-asia':           { center: [22, 115],   zoom: 3.3, mode: 'detail',    continent: 'Asia' },
    'bab6-step-eropa':          { center: [45, 20],    zoom: 3.4, mode: 'detail',    continent: 'Eropa' },
    'bab6-step-oseania':        { center: [-15, 148],  zoom: 3.0, mode: 'detail',    continent: 'Oseania' },
    'bab6-step-amerika':        { center: [15, -75],   zoom: 2.8, mode: 'detail',    continent: 'Amerika' },
    'bab6-step-afrika':         { center: [2, 28],     zoom: 3.1, mode: 'detail',    continent: 'Afrika' },
    'bab6-step-sintesis':       { center: [14, 115],   zoom: 2.8, mode: 'detail',    continent: 'all' },
    // Backwards compatibility aliases
    'bab6-step1':               { center: [16, 75],    zoom: 2.4, mode: 'kumulatif', continent: 'all' },
    'bab6-step2':               { center: [14, 115],   zoom: 2.8, mode: 'detail',    continent: 'all' },
    'bab6-step-amerika-afrika': { center: [12, -25],   zoom: 2.6, mode: 'detail',    continent: 'Amerika' }
  };

  // Titik Koordinat Centroid 5 Benua untuk Aliran Kumulatif
  const CONTINENT_CENTROIDS = {
    'Asia':    { name: 'Asia',                 lat: 28.0, lng: 105.0, flag: '🌏', color: '#E07A5F' },
    'Eropa':   { name: 'Eropa',                lat: 50.0, lng: 14.0,  flag: '🌍', color: '#7C3AED' },
    'Oseania': { name: 'Australia & Oseania',  lat: -25.0,lng: 135.0, flag: '🌏', color: '#0D9488' },
    'Amerika': { name: 'Amerika', lat: 35.0, lng: -95.0, flag: '🌎', color: '#2563EB' },
    'Afrika':  { name: 'Afrika',               lat: 4.0,  lng: 22.0,  flag: '🌍', color: '#9A3412' }
  };

  // Palet Warna Mewah Koridor
  const CORRIDOR_COLORS = {
    'EastAsia': '#E07A5F',
    'Malacca':  '#D97706',
    'Pacific':  '#0D9488',
    'Americas': '#2563EB',
    'Europe':   '#7C3AED',
    'Africa':   '#9A3412'
  };

  function formatUSD(val) {
    if (val >= 1000) {
      return '$' + (val / 1000).toFixed(2) + ' Miliar USD';
    }
    return '$' + Number(val).toLocaleString('en-US', { maximumFractionDigits: 1 }) + ' Juta USD';
  }

  function getRouteColor(r) {
    if (activeCommodity === '26') return '#0D9488'; // Emerald Teal
    if (activeCommodity === '27') return '#D97706'; // Saffron Amber

    if (r.continent === 'Asia') return '#E07A5F';
    if (r.continent === 'Oseania' || r.continent === 'Australia/Oseania') return '#0D9488';
    if (r.continent === 'Eropa') return '#7C3AED';
    if (r.continent && r.continent.includes('Amerika')) return '#2563EB';
    if (r.continent === 'Afrika') return '#9A3412';
    return '#64748B';
  }

  /**
   * Menghasilkan titik-titik kurva maritim mulus (Geodesic-like arc)
   */
  function getBezierArcPoints(fromLat, fromLng, toLat, toLng, numPoints = 26) {
    let dLng = toLng - fromLng;
    if (dLng > 180) dLng -= 360;
    if (dLng < -180) dLng += 360;
    const dLat = toLat - fromLat;
    const dist = Math.sqrt(dLat * dLat + dLng * dLng);

    if (dist < 0.4) return [[fromLat, fromLng], [toLat, toLng]];

    const midLat = (fromLat + toLat) / 2;
    const midLng = fromLng + dLng / 2;
    const offset = Math.min(dist * 0.04, 2.5);

    let normLat = -dLng / dist;
    let normLng = dLat / dist;

    if (toLat >= fromLat && normLat < 0) {
      normLat = -normLat;
      normLng = -normLng;
    } else if (toLat < fromLat && normLat > 0) {
      normLat = -normLat;
      normLng = -normLng;
    }

    let cpLat = midLat + normLat * offset;
    let cpLng = midLng + normLng * offset;

    if (toLat >= fromLat && cpLat < fromLat) {
      cpLat = fromLat + Math.abs(toLat - fromLat) * 0.3;
    }

    const pts = [];
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const inv = 1 - t;
      const lat = inv * inv * fromLat + 2 * inv * t * cpLat + t * t * toLat;
      const lng = inv * inv * fromLng + 2 * inv * t * cpLng + t * t * toLng;
      pts.push([lat, lng]);
    }
    return pts;
  }

  async function init(containerId = 'map-global') {
    const container = document.getElementById(containerId);
    if (!container || typeof L === 'undefined') return;

    if (map) {
      try {
        if (animFrameId) cancelAnimationFrame(animFrameId);
        map.remove();
      } catch (e) {}
      map = null;
    }

    container.innerHTML = '';

    map = L.map(containerId, {
      center: [16, 75],
      zoom: 2.4,
      minZoom: 2,
      maxZoom: 7,
      zoomControl: true,
      attributionControl: false,
      worldCopyJump: true
    });

    L.tileLayer(ESRI_LIGHT.base, { maxZoom: 16, subdomains: ['server', 'services'] }).addTo(map);
    L.tileLayer(ESRI_LIGHT.ref, { maxZoom: 16, opacity: 0.75 }).addTo(map);

    routeLayerGroup = L.layerGroup().addTo(map);
    vesselLayerGroup = L.layerGroup().addTo(map);
    portLayerGroup = L.layerGroup().addTo(map);
    destLayerGroup = L.layerGroup().addTo(map);
    continentLayerGroup = L.layerGroup().addTo(map);

    try {
      const res = await fetch('./data/processed/ekspor_flow.json');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      rawFlowData = await res.json();

      populatePortSelect();
      renderAll();
      startVesselAnimations();
      updateStageUI(currentStep);
    } catch (err) {
      console.error('[MapGlobal Leaflet]', err);
      container.innerHTML = '<div style="padding:2rem;color:#b91c1c;font-size:13px;">Gagal memuat data ekspor: ' + err.message + '</div>';
    }
  }

  /**
   * Mengisi dropdown daftar pelabuhan secara otomatis dari data
   */
  function populatePortSelect() {
    if (!rawFlowData || !rawFlowData.flow_map) return;
    const originPorts = rawFlowData.flow_map.origin_ports || {};

    const selects = [
      document.getElementById('port-filter-select'),
      document.getElementById('db-port-filter-select')
    ];

    const sortedPorts = Object.values(originPorts).sort((a, b) => b.total_usd - a.total_usd);

    selects.forEach(selectEl => {
      if (!selectEl) return;
      selectEl.innerHTML = '<option value="all">Semua Pelabuhan Muat (74 Pelabuhan)</option>';
      sortedPorts.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.name;
        opt.textContent = `${p.label} ($${(p.total_million).toFixed(0)}M)`;
        selectEl.appendChild(opt);
      });
      selectEl.value = activePort;
    });
  }

  function renderAll() {
    if (activeMode === 'kumulatif' && activeContinent === 'all' && activePort === 'all') {
      renderCumulativeContinentView();
    } else {
      renderDetailedRouteView();
    }
  }

  /**
   * SEGMEN PERTAMA: Aliran Kumulatif dari Pelabuhan Indonesia ke 5 Benua
   */
  function renderCumulativeContinentView() {
    if (!map || !rawFlowData || !rawFlowData.flow_map) return;

    routeLayerGroup.clearLayers();
    destLayerGroup.clearLayers();
    continentLayerGroup.clearLayers();
    portLayerGroup.clearLayers();
    activeRoutesList = [];

    const summary = rawFlowData.flow_map.continent_summary || {};
    const originPorts = rawFlowData.flow_map.origin_ports || {};

    // 1. Gambar Simpul Pelabuhan Utama Indonesia (Top 25 pelabuhan)
    Object.values(originPorts).slice(0, 30).forEach(p => {
      L.circleMarker([p.lat, p.lng], {
        radius: p.total_million >= 1000 ? 5.0 : 3.5,
        fillColor: '#15803D',
        color: '#FFFFFF',
        weight: 1.5,
        fillOpacity: 0.95
      }).bindTooltip(`
        <div style="font-family:'Outfit',sans-serif;font-size:12px;padding:3px;">
          <div style="font-weight:700;color:#1E293B;">${p.label}</div>
          <div style="font-size:11px;color:#64748B;">Total Ekspor: <strong>${formatUSD(p.total_million)}</strong></div>
        </div>
      `, { sticky: true, className: 'leaflet-soft-tooltip' }).addTo(portLayerGroup);
    });

    // 2. Gambar Aliran Kumulatif Menuju 5 Benua
    // Ambil rute agregat port -> continent
    const routesContinent = rawFlowData.flow_map.routes_continent || [];
    
    // Filter rute kumulatif berdasarkan komoditas aktif jika dipilih
    const filteredContinentRoutes = routesContinent.filter(r => {
      if (activeCommodity !== 'all' && String(r.kode_hs) !== String(activeCommodity)) return false;
      return true;
    });

    filteredContinentRoutes.forEach(r => {
      const fromLng = r.fromCoords[0];
      const fromLat = r.fromCoords[1];
      const toLng = r.toCoords[0];
      const toLat = r.toCoords[1];

      const arcPoints = getBezierArcPoints(fromLat, fromLng, toLat, toLng, 28);
      const cMeta = CONTINENT_CENTROIDS[r.toContinent] || { color: '#E07A5F' };
      const strokeCol = activeCommodity === '26' ? '#0D9488' : (activeCommodity === '27' ? '#D97706' : cMeta.color);

      let weight = 1.8;
      if (r.value_million >= 10000) weight = 5.5;
      else if (r.value_million >= 2000) weight = 4.0;
      else if (r.value_million >= 500) weight = 2.8;

      const polyline = L.polyline(arcPoints, {
        color: strokeCol,
        weight: weight,
        opacity: 0.65,
        smoothFactor: 1.2,
        lineCap: 'round',
        lineJoin: 'round',
        className: 'route-flow-line'
      }).addTo(routeLayerGroup);

      polyline.bindTooltip(`
        <div style="font-family:'Outfit',sans-serif;font-size:12px;padding:3px;min-width:180px;">
          <div style="font-weight:700;color:#1E293B;border-bottom:1px solid rgba(120,113,108,0.15);padding-bottom:3px;margin-bottom:4px;">
            ${r.fromLabel} &rarr; ${r.toLabel}
          </div>
          <div style="display:flex;justify-content:space-between;gap:12px;font-size:11px;margin-bottom:2px;">
            <span style="color:#64748B;">Aliran Devisa:</span>
            <span style="font-family:monospace;font-weight:700;color:#B83E28;">${formatUSD(r.value_million)}</span>
          </div>
          <div style="font-size:10.5px;color:#475569;">${r.commodity}</div>
        </div>
      `, { sticky: true, className: 'leaflet-soft-tooltip' });

      polyline.on('mouseover', function () {
        this.setStyle({ weight: weight + 2.5, opacity: 1.0, color: '#B83E28' });
        this.bringToFront();
      });
      polyline.on('mouseout', function () {
        this.setStyle({ weight: weight, opacity: 0.65, color: strokeCol });
      });

      activeRoutesList.push({ points: arcPoints, color: strokeCol, val: r.value_million, continent: r.toContinent });
    });

    // 3. Simpul Raksasa 5 Benua (Centroid Badges)
    Object.entries(summary).forEach(([cKey, cData]) => {
      const cMeta = CONTINENT_CENTROIDS[cKey];
      if (!cMeta) return;

      const marker = L.circleMarker([cData.lat, cData.lng], {
        radius: cKey === 'Asia' ? 14 : 9,
        fillColor: cMeta.color,
        color: '#FFFFFF',
        weight: 2.5,
        opacity: 1.0,
        fillOpacity: 0.92
      }).addTo(continentLayerGroup);

      marker.bindTooltip(`
        <div style="font-family:'Outfit',sans-serif;font-size:12px;padding:4px;min-width:210px;">
          <div style="font-weight:700;font-size:13.5px;color:#1E293B;margin-bottom:4px;border-bottom:1px solid rgba(120,113,108,0.15);padding-bottom:3px;">
            ${cData.flag} Benua ${cData.name}
          </div>
          <div style="display:flex;justify-content:space-between;gap:12px;font-size:11.5px;margin-bottom:2px;">
            <span style="color:#64748B;">Total Devisa Kumulatif:</span>
            <span style="font-family:monospace;font-weight:700;color:#B83E28;">${formatUSD(cData.total_million)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;gap:12px;font-size:11px;margin-bottom:2px;color:#475569;">
            <span>Pangsa Devisa Nasional:</span>
            <span style="font-weight:700;color:#1E293B;">${cData.share_percent}%</span>
          </div>
          <div style="display:flex;justify-content:space-between;gap:12px;font-size:10.5px;margin-bottom:2px;color:#64748B;">
            <span>HS 26 (Bijih Logam):</span>
            <span style="font-weight:600;">$${cData.hs26_million} M</span>
          </div>
          <div style="display:flex;justify-content:space-between;gap:12px;font-size:10.5px;margin-bottom:5px;color:#64748B;">
            <span>HS 27 (Bahan Bakar):</span>
            <span style="font-weight:600;">$${cData.hs27_million} M</span>
          </div>
          <div style="font-size:10px;font-weight:600;color:#2563EB;background:rgba(37,99,235,0.08);padding:3px 6px;border-radius:4px;">
            Mencakup ${cData.countries_count} Negara Mitra Dagang
          </div>
        </div>
      `, { sticky: true, className: 'leaflet-soft-tooltip' });

      // Klik simpul benua langsung zoom dan filter ke benua tersebut
      marker.on('click', () => {
        filterContinent(cKey);
      });
    });
  }

  /**
   * TAMPILAN DETAIL: Rute Pelayaran ke Negara-Negara Tujuan
   */
  function renderDetailedRouteView() {
    if (!map || !rawFlowData || !rawFlowData.flow_map) return;

    routeLayerGroup.clearLayers();
    destLayerGroup.clearLayers();
    continentLayerGroup.clearLayers();
    portLayerGroup.clearLayers();
    activeRoutesList = [];

    const allRoutes = rawFlowData.flow_map.routes || [];
    const originPorts = rawFlowData.flow_map.origin_ports || {};
    const destinations = rawFlowData.flow_map.destinations || {};

    const HIGHLIGHT_PORT_NAMES = new Set([
      'BANJARMASIN',
      'SAMARINDA',
      'AMAMAPARE',
      'BINTUNI IRIAN JAYA',
      'BALIKPAPAN',
      'BAHUDOPI',
      'TANJUNG PRIOK'
    ]);

    // Filter rute berdasarkan 3 filter (Komoditas, Benua, Pelabuhan Asal)
    const filteredRoutes = allRoutes.filter(r => {
      // Jika berada di step pelabuhan, HANYA tampilkan rute dari 7 pelabuhan yang dihighlight
      if (currentStep === 'bab6-step-pelabuhan') {
        if (!HIGHLIGHT_PORT_NAMES.has(r.fromName)) return false;
      }
      // 1. Filter Komoditas
      if (activeCommodity !== 'all' && String(r.kode_hs) !== String(activeCommodity)) {
        return false;
      }
      // 2. Filter Benua
      if (activeContinent !== 'all') {
        if (activeContinent === 'AmericasAfrica') {
          if (!r.continent.includes('Amerika') && r.continent !== 'Afrika') return false;
        } else if (activeContinent === 'Oseania') {
          if (r.continent !== 'Oseania' && r.continent !== 'Australia/Oseania') return false;
        } else if (activeContinent === 'Amerika') {
          if (!r.continent.includes('Amerika')) return false;
        } else {
          if (r.continent !== activeContinent) return false;
        }
      }
      // 3. Filter Pelabuhan Asal
      if (activePort !== 'all') {
        if (r.fromName !== activePort) return false;
      }
      return true;
    });

    const connectedPorts = new Set();
    const connectedDests = new Set();

    filteredRoutes.forEach(r => {
      connectedPorts.add(r.fromName);
      connectedDests.add(r.toRaw);

      const fromLng = r.fromCoords[0];
      const fromLat = r.fromCoords[1];
      const toLng = r.toCoords[0];
      const toLat = r.toCoords[1];

      if (!fromLat || !fromLng || !toLat || !toLng) return;

      const arcPoints = getBezierArcPoints(fromLat, fromLng, toLat, toLng, 26);
      const strokeCol = getRouteColor(r);

      let baseWeight = 1.4;
      if (r.value_million >= 1000) baseWeight = 4.2;
      else if (r.value_million >= 400) baseWeight = 3.0;
      else if (r.value_million >= 100) baseWeight = 2.0;

      const polyline = L.polyline(arcPoints, {
        color: strokeCol,
        weight: baseWeight,
        opacity: activePort !== 'all' ? 0.85 : 0.65,
        smoothFactor: 1.2,
        lineCap: 'round',
        lineJoin: 'round',
        className: 'route-flow-line'
      }).addTo(routeLayerGroup);

      const monthsCount = Object.keys(r.monthly || {}).length;

      polyline.bindTooltip(`
        <div style="font-family:'Outfit',sans-serif;font-size:12px;padding:3px;min-width:180px;">
          <div style="font-weight:700;font-size:12.5px;color:#1E293B;border-bottom:1px solid rgba(120,113,108,0.15);padding-bottom:3px;margin-bottom:5px;">
            ${r.fromLabel} &rarr; ${r.toLabel}
          </div>
          <div style="display:flex;justify-content:space-between;gap:12px;font-size:11px;margin-bottom:2px;">
            <span style="color:#64748B;">Pelabuhan Asal:</span>
            <span style="font-weight:600;color:#1E293B;">${r.fromLabel}</span>
          </div>
          <div style="display:flex;justify-content:space-between;gap:12px;font-size:11px;margin-bottom:2px;">
            <span style="color:#64748B;">Negara Tujuan:</span>
            <span style="font-weight:600;color:#1E293B;">${r.toName} (${r.continent})</span>
          </div>
          <div style="display:flex;justify-content:space-between;gap:12px;font-size:11px;margin-bottom:2px;">
            <span style="color:#64748B;">Nilai Ekspor:</span>
            <span style="font-family:monospace;font-weight:700;color:#B83E28;">${formatUSD(r.value_million)}</span>
          </div>
          <div style="font-size:10.5px;color:#475569;margin-bottom:4px;">${r.commodity}</div>
          <div style="font-size:9.5px;color:#78716C;background:rgba(0,0,0,0.04);padding:2px 6px;border-radius:4px;display:inline-block;">
            📅 ${monthsCount} Bulan Transaksi Pengapalan
          </div>
        </div>
      `, { sticky: true, className: 'leaflet-soft-tooltip' });

      polyline.on('mouseover', function () {
        this.setStyle({ weight: baseWeight + 2.5, opacity: 1.0, color: '#B83E28' });
        this.bringToFront();
      });
      polyline.on('mouseout', function () {
        this.setStyle({ weight: baseWeight, opacity: activePort !== 'all' ? 0.85 : 0.65, color: strokeCol });
      });

      activeRoutesList.push({ points: arcPoints, color: strokeCol, val: r.value_million, continent: r.continent });
    });

    // Tampilkan simpul pelabuhan yang terhubung
    Object.entries(originPorts).forEach(([name, p]) => {
      // Jika berada di step pelabuhan, HANYA tampilkan 7 pelabuhan yang dihighlight di cerita
      if (currentStep === 'bab6-step-pelabuhan') {
        if (!HIGHLIGHT_PORT_NAMES.has(name)) return;
      } else {
        if (!connectedPorts.has(name) && activePort !== 'all') return;
      }

      const isHighlightStep = currentStep === 'bab6-step-pelabuhan';
      const isSelected = activePort === name;
      
      const marker = L.circleMarker([p.lat, p.lng], {
        radius: isHighlightStep ? (p.total_million >= 3000 ? 7.5 : 5.8) : (isSelected ? 6.5 : (p.total_million >= 1000 ? 4.8 : 3.2)),
        fillColor: isHighlightStep ? '#059669' : (isSelected ? '#B83E28' : '#15803D'),
        color: '#FFFFFF',
        weight: isHighlightStep ? 2.5 : (isSelected ? 2.5 : 1.5),
        fillOpacity: 0.95
      }).addTo(portLayerGroup);

      let roleDesc = '';
      if (name === 'BANJARMASIN') roleDesc = 'Dermaga Batubara #1 Terbesar Nasional ($6,45B)';
      else if (name === 'SAMARINDA') roleDesc = 'Episentrum Batubara Kaltim ($4,17B)';
      else if (name === 'AMAMAPARE') roleDesc = 'Corong Tunggal Tembaga & Emas PTFI ($3,62B)';
      else if (name === 'BINTUNI IRIAN JAYA') roleDesc = 'Terminal Ekspor LNG Tangguh Papua Barat ($3,25B)';
      else if (name === 'BALIKPAPAN') roleDesc = 'Hub Energi Curah Batubara & Minyak ($3,16B)';
      else if (name === 'BAHUDOPI') roleDesc = 'Kawasan Smelter Nikel Terpadu (28 Negara)';
      else if (name === 'TANJUNG PRIOK') roleDesc = 'Hub Logistik Terluas (60 Negara Mitra)';

      marker.bindTooltip(`
        <div style="font-family:'Outfit',sans-serif;font-size:12px;padding:3px;min-width:185px;">
          <div style="font-weight:700;color:#1E293B;margin-bottom:2px;">${p.label}</div>
          ${roleDesc ? `<div style="font-size:10.5px;color:#059669;font-weight:600;margin-bottom:3px;">${roleDesc}</div>` : ''}
          <div style="font-size:11px;color:#64748B;">Nilai Ekspor: <strong>${formatUSD(p.total_million)}</strong></div>
          <div style="font-size:10px;color:#2563EB;margin-top:2px;">Klik untuk memfilter rute pelabuhan ini &rarr;</div>
        </div>
      `, { sticky: true, className: 'leaflet-soft-tooltip' });

      marker.on('click', () => {
        filterPort(name);
      });
    });

    // Tampilkan simpul negara tujuan yang terhubung
    Object.entries(destinations).forEach(([rawName, c]) => {
      if (!connectedDests.has(rawName)) return;

      const marker = L.circleMarker([c.lat, c.lng], {
        radius: c.total_million >= 1000 ? 5.2 : 3.5,
        fillColor: '#1E293B',
        color: '#FFFFFF',
        weight: 1.5,
        fillOpacity: 0.88
      }).addTo(destLayerGroup);

      marker.bindTooltip(`
        <div style="font-family:'Outfit',sans-serif;font-size:12px;padding:3px;min-width:180px;">
          <div style="font-weight:700;color:#1E293B;margin-bottom:3px;">${c.flag || ''} ${c.name_id}</div>
          <div style="font-size:10.5px;color:#64748B;margin-bottom:3px;">Benua: <strong>${c.continent}</strong></div>
          <div style="display:flex;justify-content:space-between;gap:12px;font-size:11px;">
            <span style="color:#64748B;">Serapan Ekspor:</span>
            <span style="font-family:monospace;font-weight:700;color:#B83E28;">${formatUSD(c.total_million)}</span>
          </div>
        </div>
      `, { sticky: true, className: 'leaflet-soft-tooltip' });
    });
  }

  /**
   * Animasi denyut kargo maritim
   */
  function startVesselAnimations() {
    vesselLayerGroup.clearLayers();
    vesselAnimations = [];

    if (!activeRoutesList.length) return;

    let routesForAnimation = [];

    if (activeContinent === 'all') {
      // Kelompokkan per 5 Benua agar SEMUA benua memiliki titik-titik aliran kargo!
      const continents = ['Asia', 'Eropa', 'Oseania', 'Amerika', 'Afrika'];
      const byContinent = { 'Asia': [], 'Eropa': [], 'Oseania': [], 'Amerika': [], 'Afrika': [] };

      activeRoutesList.forEach(r => {
        const c = r.continent || '';
        if (c.includes('Eropa') || c === 'Europe') byContinent['Eropa'].push(r);
        else if (c.includes('Oseania') || c.includes('Australia') || c === 'Pacific') byContinent['Oseania'].push(r);
        else if (c.includes('Amerika') || c === 'Americas') byContinent['Amerika'].push(r);
        else if (c.includes('Afrika') || c === 'Africa') byContinent['Afrika'].push(r);
        else byContinent['Asia'].push(r);
      });

      continents.forEach(c => {
        byContinent[c].sort((a, b) => b.val - a.val);
      });

      // Kuota kapal per benua: Asia 5, Eropa 3, Oseania 3, Amerika 3, Afrika 3 (Total 17 kapal)
      const quotas = { 'Asia': 5, 'Eropa': 3, 'Oseania': 3, 'Amerika': 3, 'Afrika': 3 };
      continents.forEach(c => {
        const picked = byContinent[c].slice(0, quotas[c]);
        routesForAnimation.push(...picked);
      });

      if (routesForAnimation.length < 17) {
        const currentSet = new Set(routesForAnimation);
        const remaining = [...activeRoutesList].filter(r => !currentSet.has(r)).sort((a, b) => b.val - a.val);
        routesForAnimation.push(...remaining.slice(0, 17 - routesForAnimation.length));
      }
    } else {
      routesForAnimation = [...activeRoutesList].sort((a, b) => b.val - a.val).slice(0, 16);
    }

    routesForAnimation.forEach((r, idx) => {
      const vesselMarker = L.circleMarker(r.points[0], {
        radius: 3.2,
        fillColor: '#FFFFFF',
        color: r.color,
        weight: 1.8,
        fillOpacity: 1.0,
        opacity: 0.95
      }).addTo(vesselLayerGroup);

      vesselAnimations.push({
        marker: vesselMarker,
        points: r.points,
        progress: (idx * 0.16) % 1.0,
        speed: 0.0028 + (idx % 3) * 0.0008
      });
    });

    if (animFrameId) cancelAnimationFrame(animFrameId);

    function step() {
      vesselAnimations.forEach(v => {
        v.progress += v.speed;
        if (v.progress >= 1.0) v.progress = 0;

        const totalSteps = v.points.length - 1;
        const exactIndex = v.progress * totalSteps;
        const lowIndex = Math.floor(exactIndex);
        const highIndex = Math.min(lowIndex + 1, totalSteps);
        const frac = exactIndex - lowIndex;

        const p1 = v.points[lowIndex];
        const p2 = v.points[highIndex];

        const curLat = p1[0] + (p2[0] - p1[0]) * frac;
        const curLng = p1[1] + (p2[1] - p1[1]) * frac;

        v.marker.setLatLng([curLat, curLng]);
      });

      animFrameId = requestAnimationFrame(step);
    }

    step();
  }

  function render(stepId = 'bab6-step-kumulatif') {
    currentStep = stepId;
    const viewCfg = CAMERA_VIEWS[stepId] || CAMERA_VIEWS['bab6-step-kumulatif'];

    activeMode = viewCfg.mode;
    activeContinent = viewCfg.continent;

    if (map) {
      map.flyTo(viewCfg.center, viewCfg.zoom, {
        duration: 1.3,
        easeLinearity: 0.25
      });
    }

    renderAll();
    startVesselAnimations();
    updateStageUI(stepId);
  }

  function updateStageUI(stepId) {
    const titleEl = document.getElementById('global-stage-title');
    const noteEl = document.getElementById('global-footer-note');

    let titleText = 'Rute Pelayaran Kapal Kargo';
    let noteText = 'seret dan perbesar proyeksi maritim ~';

    if (activeCommodity === '26') {
      titleText = 'Koridor Ekspor HS 26: Bijih Logam & Abu (75 Rute, USD 4,87 Miliar)';
      noteText = 'menampilkan aliran bijih tembaga, emas & konsentrat mineral ~';
    } else if (activeCommodity === '27') {
      titleText = 'Koridor Ekspor HS 27: Bahan Bakar Mineral & Batubara (460 Rute, USD 44,82 Miliar)';
      noteText = 'menampilkan aliran curah batubara kalimantan & sumatera, lng papua & sulawesi ~';
    } else if (activeMode === 'kumulatif' && activeContinent === 'all') {
      titleText = 'Arus Makro: Aliran Kumulatif Devisa Ekspor ke 5 Benua (USD 49,69 Miliar)';
      noteText = 'Asia $48,10B (96,8%) · Eropa $679,6M · Oseania $610,8M · Amerika $223,7M · Afrika $75,4M ~';
    } else {
      switch (stepId) {
        case 'bab6-step-asia':
          titleText = 'Kawasan Asia: Poros Utama Penyerapan 96,8% Devisa (USD 48,10 Miliar)';
          noteText = 'menyorot pelayaran ke tiongkok ($15,8B), india ($5,8B), jepang ($5,7B), asean ~';
          break;
        case 'bab6-step-eropa':
          titleText = 'Koridor Terusan Suez Menuju Eropa: Devisa USD 679,6 Juta';
          noteText = 'pengapalan tembaga & batubara khusus ke belanda, italia, turki, spanyol ~';
          break;
        case 'bab6-step-pelabuhan':
          titleText = 'Gerbang Laut Nusantara: 74 Pelabuhan Muat & Titik Keberangkatan Teraktif';
          noteText = 'Banjarmasin ($6,45B), Samarinda ($4,17B), Amamapare ($3,62B), Tangguh ($3,25B), Balikpapan ($3,16B) ~';
          break;
        case 'bab6-step-oseania':
          titleText = 'Koridor Pasifik & Oseania: Majuro Atoll, Australia & Selandia Baru (USD 610,8 Juta)';
          noteText = 'menyorot titik bunker armada curah Majuro Atoll & pasar industri Oseania ~';
          break;
        case 'bab6-step-amerika':
          titleText = 'Jangkauan Trans-Pasifik & Atlantik: Benua Amerika (USD 223,7 Juta)';
          noteText = 'pelayaran jarak jauh ke Brasil ($152,8M kokas), Meksiko ($40,2M), Argentina ($26,1M) ~';
          break;
        case 'bab6-step-afrika':
          titleText = 'Koridor Samudra Hindia Barat: Benua Afrika (USD 75,4 Juta)';
          noteText = 'menembus 18 negara mitra: Afrika Selatan ($64,5M batubara), Maroko ($6,1M), Tanzania ~';
          break;
        case 'bab6-step-amerika-afrika':
          titleText = 'Pasar Trans-Atlantik & Afrika: Amerika ($223,7M) & Afrika ($75,4M)';
          noteText = 'jangkauan terjauh pelayaran indonesia ke amerika serikat, brasil, afrika selatan ~';
          break;
        default:
          titleText = 'Arus Perdagangan Global: 535 Rute Pelayaran ke 84 Negara Mitra';
          noteText = 'eksplorasi mandiri menggunakan filter komoditas, benua, dan pelabuhan ~';
          break;
      }
    }

    if (titleEl) titleEl.textContent = titleText;
    if (noteEl) noteEl.textContent = noteText;

    // Sinkronkan tombol chip komoditas
    document.querySelectorAll('.chip-commodity').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-hs') === String(activeCommodity));
    });

    // Sinkronkan tombol chip benua
    document.querySelectorAll('.chip-continent').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-continent') === String(activeContinent));
    });

    // Sinkronkan dropdown pelabuhan
    const selectPort = document.getElementById('port-filter-select');
    if (selectPort) selectPort.value = activePort;
    const selectPortDash = document.getElementById('db-port-filter-select');
    if (selectPortDash) selectPortDash.value = activePort;
  }

  function setStoryStep(stepId) {
    if (stepId === currentStep) return;
    render(stepId);
  }

  function filterCommodity(hsKey) {
    activeCommodity = hsKey;
    renderAll();
    startVesselAnimations();
    updateStageUI(currentStep);
  }

  function filterContinent(continentKey) {
    activeContinent = continentKey;
    if (continentKey === 'all') {
      activeMode = 'kumulatif';
      if (map) map.flyTo([16, 75], 2.4, { duration: 1.2 });
    } else {
      activeMode = 'detail';
      const cMeta = CONTINENT_CENTROIDS[continentKey];
      if (cMeta && map) {
        let zoomLevel = continentKey === 'Asia' ? 3.3 : (continentKey === 'Eropa' ? 3.5 : 3.0);
        map.flyTo([cMeta.lat, cMeta.lng], zoomLevel, { duration: 1.2 });
      }
    }
    renderAll();
    startVesselAnimations();
    updateStageUI(currentStep);
  }

  function filterPort(portName) {
    activePort = portName;
    if (portName !== 'all') {
      activeMode = 'detail';
      if (rawFlowData && rawFlowData.flow_map && rawFlowData.flow_map.origin_ports) {
        const p = rawFlowData.flow_map.origin_ports[portName];
        if (p && map) {
          map.flyTo([p.lat, p.lng], 4.0, { duration: 1.2 });
        }
      }
    }
    renderAll();
    startVesselAnimations();
    updateStageUI(currentStep);
  }

  function resize() {
    if (map) map.invalidateSize();
  }

  window.MapGlobal = {
    init: init,
    render: render,
    resize: resize,
    setStoryStep: setStoryStep,
    filterCommodity: filterCommodity,
    filterContinent: filterContinent,
    filterPort: filterPort
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const el = document.getElementById('map-global');
      if (el) init('map-global');
    });
  } else {
    setTimeout(() => {
      const el = document.getElementById('map-global');
      if (el) init('map-global');
    }, 100);
  }

})();
