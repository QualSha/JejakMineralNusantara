/**
 * map_indonesia.js - Bab 2: Episentrum PDRB Tambang 514 Kab/Kota
 * Leaflet.js dengan Basemap Esri Light Gray & Scrollytelling Berjenjang:
 * Nasional -> Pulau -> Kabupaten/Kota
 */

(function () {
  'use strict';

  let map = null;
  let geojsonLayer = null;
  let geojsonData = null;
  let infoControl = null;
  let districtLayers = {};
  let selectedLayers = [];
  let currentIsland = 'all';

  const ESRI_LIGHT = {
    base: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    ref: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
    attr: 'Tiles &copy; Esri  -  BPS 2025'
  };

  // Koordinat kamera spasial tingkat pulau
  const ISLAND_VIEWS = {
    all: {
      center: [-2.5, 117.5],
      zoom: 4.2,
      bounds: [[-11.5, 94.0], [6.5, 141.5]],
      title: 'Peta Disparitas Rasio Pangsa PDRB Tambang 514 Daerah'
    },
    kalimantan: {
      center: [0.0, 115.5],
      zoom: 6,
      title: 'Pulau Kalimantan: Koridor Batubara (17,6% Pangsa Nasional / Rp 386 T)'
    },
    sulawesi: {
      center: [-2.0, 121.5],
      zoom: 6,
      title: 'Pulau Sulawesi: Sabuk Nikel & Hilirisasi (5,2% Pangsa Nasional)'
    },
    papua: {
      center: [-4.0, 137.0],
      zoom: 6,
      title: 'Pulau Papua: Episentrum Mimika Grasberg (5,23% Rekor Nasional)'
    },
    sumatera: {
      center: [-0.5, 101.5],
      zoom: 6.0,
      title: 'Pulau Sumatera: Minyak Bumi & Batubara (Bengkalis 4,35% & Muara Enim 4,06%)'
    },
    jawa: {
      center: [-7.2, 110.5],
      zoom: 6.8,
      title: 'Pulau Jawa: Poros Energi Migas (Bojonegoro Blok Cepu 2,15%)'
    }
  };

  // Total PDRB Sektor Pertambangan Nasional 2025: Rp 2.190.725 Miliar (~Rp 2.190,7 Triliun)
  const TOTAL_TAMBANG_NASIONAL = 2190725.29;

  function getSharePercent(valMiliar) {
    if (valMiliar == null || valMiliar <= 0) return 0;
    return (valMiliar / TOTAL_TAMBANG_NASIONAL) * 100;
  }

  function getColor(valMiliar) {
    const share = getSharePercent(valMiliar);
    if (share <= 0) return '#FDFCF8';
    return share >= 2.0  ? '#B83E28' :  // > 2.0% (Episentrum Raksasa: Mimika, Kukar, Kutim, Bengkalis, Muara Enim, Bojonegoro)
           share >= 0.8  ? '#D96B55' :  // 0.8% - 2.0% (Sentra Utama: Morowali, Sumbawa Barat, Berau, Muba)
           share >= 0.2  ? '#E89A88' :  // 0.2% - 0.8% (Sentra Menengah)
           share >= 0.05 ? '#F0C4B8' :  // 0.05% - 0.2% (Sentra Penyangga)
                           '#F8E4DF';   // < 0.05% (Aktivitas Minimal / Galian C)
  }

  function style(feature) {
    const val = feature.properties ? feature.properties.pdrb_tambang_milyar : 0;
    return {
      fillColor: getColor(val),
      weight: 0.8,
      opacity: 1,
      color: '#FFFFFF',
      fillOpacity: val > 0 ? 0.88 : 0.4
    };
  }

  function highlightFeature(e) {
    const layer = e.target;
    if (selectedLayers.indexOf(layer) !== -1) return;

    layer.setStyle({
      weight: 2.2,
      color: '#292524',
      fillOpacity: 0.95
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
      layer.bringToFront();
    }

    if (infoControl) {
      infoControl.update(layer.feature.properties);
    }
  }

  function resetHighlight(e) {
    const layer = e.target;
    if (selectedLayers.indexOf(layer) !== -1) return;

    if (geojsonLayer) {
      geojsonLayer.resetStyle(layer);
    }
    if (infoControl) {
      if (selectedLayers.length > 0 && selectedLayers[0].feature) {
        infoControl.update(selectedLayers[0].feature.properties);
      } else {
        infoControl.update();
      }
    }
  }

  function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
  }

  function onEachFeature(feature, layer) {
    if (feature.properties && feature.properties.NAMOBJ) {
      districtLayers[feature.properties.NAMOBJ] = layer;
    }
    layer.on({
      mouseover: highlightFeature,
      mouseout: resetHighlight,
      click: zoomToFeature
    });
  }

  function clearSelection() {
    selectedLayers.forEach(function (layer) {
      if (geojsonLayer) {
        geojsonLayer.resetStyle(layer);
      }
    });
    selectedLayers = [];
  }

  // 1. Filter Pulau Bebas (Klik tombol chip atau narasi pulau)
  function filterIsland(islandKey) {
    const target = ISLAND_VIEWS[islandKey] || ISLAND_VIEWS.all;
    currentIsland = islandKey;
    clearSelection();

    // Update active chip
    document.querySelectorAll('.chip-island').forEach(function (el) {
      el.classList.remove('active');
    });
    const btn = document.querySelector('.chip-island[data-island="' + islandKey + '"]');
    if (btn) btn.classList.add('active');

    // Update title
    const titleEl = document.getElementById('map-stage-title');
    if (titleEl) titleEl.textContent = target.title;

    if (map) {
      if (islandKey === 'all') {
        map.flyToBounds([[-11.5, 94.0], [6.5, 141.5]], {
          padding: [25, 25],
          duration: 1.4,
          easeLinearity: 0.25
        });
      } else {
        map.flyTo(target.center, target.zoom, {
          duration: 1.4,
          easeLinearity: 0.25
        });
      }
    }
    if (infoControl) infoControl.update();
  }

  // 2. Zoom & Seleksi Tingkat Satuan Kabupaten/Kota
  function focusDistricts(districtNames, options) {
    clearSelection();

    if (!districtNames || districtNames === 'all') {
      filterIsland('all');
      return;
    }

    const layersToFocus = [];
    const names = Array.isArray(districtNames) ? districtNames : [districtNames];

    names.forEach(function (name) {
      const layer = districtLayers[name];
      if (layer) {
        layersToFocus.push(layer);
        selectedLayers.push(layer);

        layer.setStyle({
          weight: 3.5,
          color: '#1C1917',
          fillColor: '#B83E28',
          fillOpacity: 0.98
        });
        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
          layer.bringToFront();
        }
      }
    });

    if (layersToFocus.length > 0 && map) {
      const group = L.featureGroup(layersToFocus);
      map.flyToBounds(group.getBounds(), {
        padding: (options && options.padding) || [65, 65],
        maxZoom: (options && options.maxZoom) || 8.2,
        duration: 1.4,
        easeLinearity: 0.25
      });

      const primaryLayer = layersToFocus[0];
      if (infoControl && primaryLayer.feature) {
        infoControl.update(primaryLayer.feature.properties);
      }
    }
  }

  // 3. Handler Scrollytelling Berjenjang:
  // Nasional -> Pulau Kalimantan -> Kab. Kutai Kartanegara -> Kab. Kutai Timur ->
  // Pulau Sulawesi -> Kab. Morowali -> Papua (Kab. Mimika) -> Transisi (Nasional)
  function setStoryStep(stepId) {
    const titleEl = document.getElementById('map-stage-title');

    switch (stepId) {
      case 'step-map-nasional':
        filterIsland('all');
        break;

      case 'step-map-kalimantan':
        filterIsland('kalimantan');
        break;

      case 'step-map-kukar':
        // Tetapkan chip pulau Kalimantan aktif
        document.querySelectorAll('.chip-island').forEach(function (el) { el.classList.remove('active'); });
        const btnKukar = document.querySelector('.chip-island[data-island="kalimantan"]');
        if (btnKukar) btnKukar.classList.add('active');

        if (titleEl) titleEl.textContent = 'Kalimantan Timur: Kutai Kartanegara (Pangsa 5,11% / Rp 111,87 T)';
        focusDistricts(['Kutai Kartanegara'], { maxZoom: 8 });
        break;

      case 'step-map-kutim':
        document.querySelectorAll('.chip-island').forEach(function (el) { el.classList.remove('active'); });
        const btnKutim = document.querySelector('.chip-island[data-island="kalimantan"]');
        if (btnKutim) btnKutim.classList.add('active');

        if (titleEl) titleEl.textContent = 'Kalimantan Timur: Kutai Timur (Pangsa 4,90% / Rp 107,28 T)';
        focusDistricts(['Kutai Timur'], { maxZoom: 8 });
        break;

      case 'step-map-sulawesi':
        filterIsland('sulawesi');
        break;

      case 'step-map-morowali':
        document.querySelectorAll('.chip-island').forEach(function (el) { el.classList.remove('active'); });
        const btnSul = document.querySelector('.chip-island[data-island="sulawesi"]');
        if (btnSul) btnSul.classList.add('active');

        if (titleEl) titleEl.textContent = 'Sulawesi Tengah: Kabupaten Morowali (Pangsa 1,46% / Rp 32,08 T)';
        focusDistricts(['Morowali'], { maxZoom: 8.5 });
        break;

      case 'step-map-mimika':
        document.querySelectorAll('.chip-island').forEach(function (el) { el.classList.remove('active'); });
        const btnPap = document.querySelector('.chip-island[data-island="papua"]');
        if (btnPap) btnPap.classList.add('active');

        if (titleEl) titleEl.textContent = 'Pulau Papua: Rekor Tertinggi Kabupaten Mimika (Pangsa 5,23% / Rp 114,49 T)';
        focusDistricts(['Mimika'], { maxZoom: 8 });
        break;

      case 'step-map-transisi':
        // Sesi Bab 2 selesai: kembalikan kamera ke skala nasional penuh secara mulus
        filterIsland('all');
        if (titleEl) titleEl.textContent = 'Dari Hulu Tambang Menuju 74 Pelabuhan Maritim';
        break;

      default:
        filterIsland('all');
        break;
    }
  }

  async function init(containerId) {
    const targetId = containerId || 'map-indonesia';
    const dom = document.getElementById(targetId);
    if (!dom || typeof L === 'undefined') return;

    if (map) {
      try { map.remove(); } catch (e) {}
      map = null;
    }

    districtLayers = {};
    selectedLayers = [];

    map = L.map(targetId, {
      center: [-2.2, 118.0],
      zoom: 4.2,
      zoomSnap: 0.1,
      minZoom: 4,
      maxZoom: 11,
      zoomControl: true,
      scrollWheelZoom: false
    });

    L.tileLayer(ESRI_LIGHT.base, {
      attribution: ESRI_LIGHT.attr,
      maxZoom: 16
    }).addTo(map);

    L.tileLayer(ESRI_LIGHT.ref, {
      maxZoom: 16,
      opacity: 0.85
    }).addTo(map);

    // Floating Info Panel - Menyajikan Rasio Kontribusi Nasional & Nilai Nominal
    infoControl = L.control({ position: 'topright' });
    infoControl.onAdd = function () {
      this._div = L.DomUtil.create('div', 'map-info-panel');
      this.update();
      return this._div;
    };
    infoControl.update = function (props) {
      if (props) {
        const val = props.pdrb_tambang_milyar != null ? Number(props.pdrb_tambang_milyar) : 0;
        const share = getSharePercent(val);
        const shareFormatted = share.toFixed(2).replace('.', ',') + '%';
        const formatted = val >= 1000 
          ? 'Rp ' + (val / 1000).toFixed(2).replace('.', ',') + ' Triliun' 
          : 'Rp ' + Math.round(val).toLocaleString('id-ID') + ' Miliar';

        let tierLabel = 'Non-Ekstraktif';
        if (share >= 2.0) tierLabel = 'Episentrum Raksasa';
        else if (share >= 0.8) tierLabel = 'Sentra Tambang Utama';
        else if (share >= 0.2) tierLabel = 'Sentra Menengah';
        else if (share >= 0.05) tierLabel = 'Penyangga Lokal';
        else if (share > 0) tierLabel = 'Aktivitas Minimal';
        
        this._div.innerHTML = 
          '<div style="font-weight:700;font-size:13px;color:#292524;margin-bottom:2px;">' + (props.NAMOBJ || props.kabupaten || 'Kabupaten') + '</div>' +
          '<div style="font-size:11px;color:#78716C;margin-bottom:6px;">Provinsi ' + (props.provinsi || '-') + ' &middot; <span style="font-weight:600;color:#B83E28;">' + tierLabel + '</span></div>' +
          '<div style="display:flex;justify-content:space-between;gap:12px;font-size:11px;border-top:1px solid rgba(120,113,108,0.12);padding-top:4px;margin-bottom:2px;">' +
            '<span style="color:#78716C;">Pangsa Tambang RI:</span>' +
            '<span style="font-family:monospace;font-weight:700;color:#B83E28;">' + shareFormatted + '</span>' +
          '</div>' +
          '<div style="display:flex;justify-content:space-between;gap:12px;font-size:10.5px;">' +
            '<span style="color:#A8A29E;">Nilai PDRB:</span>' +
            '<span style="font-family:monospace;font-weight:600;color:#57534E;">' + formatted + '</span>' +
          '</div>';
      } else {
        this._div.innerHTML = 
          '<div style="font-weight:600;font-size:12px;color:#292524;">Peta Disparitas Tambang 514 Daerah</div>' +
          '<div style="font-size:11px;color:#78716C;">Rasio Pangsa Sektor Tambang terhadap Output Nasional (%)</div>';
      }
    };
    infoControl.addTo(map);

    // Custom Legend Control (Rasio Pangsa Nasional % sesuai ketentuan Choropleth)
    const legend = L.control({ position: 'bottomleft' });
    legend.onAdd = function () {
      const div = L.DomUtil.create('div', 'map-legend-panel');
      const items = [
        { color: '#B83E28', label: '&gt; 2,00% (Episentrum Raksasa)' },
        { color: '#D96B55', label: '0,80% - 2,00% (Sentra Utama)' },
        { color: '#E89A88', label: '0,20% - 0,80% (Sentra Menengah)' },
        { color: '#F0C4B8', label: '0,05% - 0,20% (Penyangga Lokal)' },
        { color: '#F8E4DF', label: '&lt; 0,05% (Aktivitas Minimal)' },
        { color: '#FDFCF8', label: '0,00% (Non-Tambang)' }
      ];
      
      let html = '<div style="font-weight:700;font-size:11px;color:#292524;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px;">Pangsa Tambang Nasional (%)</div>';
      for (let i = 0; i < items.length; i++) {
        html += 
          '<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;font-size:11px;color:#44403C;">' +
            '<span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:' + items[i].color + ';border:1px solid rgba(0,0,0,0.08);"></span>' +
            '<span>' + items[i].label + '</span>' +
          '</div>';
      }
      div.innerHTML = html;
      return div;
    };
    legend.addTo(map);

    try {
      const geoUrl = './pdrb_tambang_geo.geojson';
      const res = await fetch(geoUrl);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      geojsonData = await res.json();

      geojsonLayer = L.geoJson(geojsonData, {
        style: style,
        onEachFeature: onEachFeature
      }).addTo(map);

      if (map) {
        map.fitBounds([[-11.5, 94.0], [6.5, 141.5]], { padding: [25, 25] });
      }
      setTimeout(function () {
        if (map) {
          map.invalidateSize();
          map.fitBounds([[-11.5, 94.0], [6.5, 141.5]], { padding: [25, 25] });
        }
      }, 300);

    } catch (err) {
      console.error('[MapIndonesia]', err);
      dom.innerHTML = '<div style="padding:2rem;color:#b91c1c;font-family:sans-serif;font-size:13px;">Gagal memuat peta geospasial: ' + err.message + '</div>';
    }
  }

  function resize() {
    if (map) map.invalidateSize();
  }

  function resetView() {
    filterIsland('all');
  }

  window.MapIndonesia = {
    init: init,
    resize: resize,
    resetView: resetView,
    filterIsland: filterIsland,
    focusDistricts: focusDistricts,
    setStoryStep: setStoryStep
  };
})();
