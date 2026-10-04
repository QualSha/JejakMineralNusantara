/**
 * map_port.js - Bab 3: Simbol Proporsional 74 Pelabuhan Ekspor Tambang
 * Digabungkan dengan Lapisan Choropleth PDRB Tambang 514 Daerah (Hulu -> Hilir)
 * 100% Data Faktual: 67 Pelabuhan [27] Bahan Bakar Mineral & 7 Pelabuhan [26] Bijih Logam
 */

(function () {
  'use strict';

  let map = null;
  let portsData = null;
  let geojsonData = null;
  let choroplethLayer = null;
  let portMarkers = [];
  let currentFilter = 'all';
  let choroplethVisible = true;
  let infoControl = null;

  const INDONESIA_BOUNDS = [[-11.5, 94.0], [6.5, 141.5]];

  const ESRI_LIGHT = {
    base: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    ref: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
    attr: 'Tiles &copy; Esri  -  BPS 2025'
  };

  function getRadius(valMillion) {
    if (!valMillion || valMillion <= 0) return 4.5;
    const maxVal = 6451; // Banjarmasin
    const minR = 5, maxR = 26;
    return minR + (maxR - minR) * Math.sqrt(valMillion / maxVal);
  }

  function getCommodityColor(commodityStr) {
    if (!commodityStr) return '#78716C';
    if (commodityStr.includes('[27]')) return '#E07A5F'; // Soft Burnt Coral
    if (commodityStr.includes('[26]')) return '#2A9D8F'; // Rich Teal/Emerald
    return '#E07A5F';
  }

  function getCommodityLabel(commodityStr) {
    if (!commodityStr) return 'Komoditas Ekspor';
    if (commodityStr.includes('[27]')) return '[27] Batubara & Bahan Bakar Energi';
    if (commodityStr.includes('[26]')) return '[26] Bijih Logam & Konsentrat';
    return commodityStr;
  }

  function getChoroColor(d) {
    if (d == null || d <= 0) return '#FDFCF8';
    return d > 10000 ? '#B83E28' :
           d > 2000  ? '#D96B55' :
           d > 500   ? '#E89A88' :
           d > 100   ? '#F0C4B8' :
                       '#F8E4DF';
  }

  function choroStyle(feature) {
    const val = feature.properties ? feature.properties.pdrb_tambang_milyar : 0;
    return {
      fillColor: getChoroColor(val),
      weight: 0.6,
      opacity: 0.8,
      color: '#FFFFFF',
      fillOpacity: val > 0 ? 0.48 : 0.22
    };
  }

  function formatUSD(valMillion) {
    if (valMillion >= 1000) {
      return '$' + (valMillion / 1000).toFixed(2) + ' Miliar USD';
    }
    return '$' + Number(valMillion).toLocaleString('en-US', { maximumFractionDigits: 1 }) + ' Juta USD';
  }

  async function init(containerId) {
    const targetId = containerId || 'map-port';
    const dom = document.getElementById(targetId);
    if (!dom || typeof L === 'undefined') return;

    if (map) {
      try { map.remove(); } catch (e) {}
      map = null;
    }

    portMarkers = [];

    try {
      map = L.map(targetId, {
        center: [-2.5, 117.5],
        zoom: 4.3,
        zoomSnap: 0.1,
        minZoom: 3.5,
        maxZoom: 12,
        zoomControl: true,
        scrollWheelZoom: false
      });

      L.tileLayer(ESRI_LIGHT.base, {
        attribution: ESRI_LIGHT.attr,
        maxZoom: 16
      }).addTo(map);

      L.tileLayer(ESRI_LIGHT.ref, {
        maxZoom: 16,
        opacity: 0.75
      }).addTo(map);

      // Floating Info Panel
      infoControl = L.control({ position: 'topright' });
      infoControl.onAdd = function () {
        this._div = L.DomUtil.create('div', 'map-info-panel');
        this.update();
        return this._div;
      };
      infoControl.update = function (props) {
        if (props) {
          this._div.innerHTML = 
            '<div style="font-weight:700;font-size:13px;color:#292524;margin-bottom:2px;">' + props.name + '</div>' +
            '<div style="font-size:11px;color:#78716C;margin-bottom:6px;">Peringkat #' + props.rank + ' Nasional &middot; Pangsa ' + props.share_percent + '%</div>' +
            '<div style="display:flex;justify-content:space-between;gap:12px;font-size:11px;border-top:1px solid rgba(120,113,108,0.12);padding-top:4px;margin-bottom:4px;">' +
              '<span style="color:#78716C;">Nilai Ekspor:</span>' +
              '<span style="font-family:monospace;font-weight:700;color:#B83E28;">' + formatUSD(props.export_value_million_usd) + '</span>' +
            '</div>' +
            '<div style="font-size:10.5px;color:#44403C;">' + getCommodityLabel(props.primary_commodity) + '</div>' +
            '<div style="font-size:10px;color:#78716C;margin-top:2px;">Tujuan: ' + (props.dominant_destination || 'Ekspor Global') + '</div>';
        } else {
          this._div.innerHTML = 
            '<div style="font-weight:600;font-size:12px;color:#292524;">Simpul Pelabuhan Ekspor Tambang</div>' +
            '<div style="font-size:11px;color:#78716C;">Arahkan kursor ke lingkaran pelabuhan</div>';
        }
      };
      infoControl.addTo(map);

      // Custom Legend Bab 3
      const legend = L.control({ position: 'bottomleft' });
      legend.onAdd = function () {
        const div = L.DomUtil.create('div', 'map-legend-panel');
        div.innerHTML = 
          '<div style="font-weight:700;font-size:11px;color:#292524;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px;">74 Pelabuhan Ekspor Tambang</div>' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;font-size:11px;color:#44403C;">' +
            '<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#E07A5F;border:1.5px solid #FFFFFF;box-shadow:0 0 0 1px rgba(0,0,0,0.15);"></span>' +
            '<span>[27] Bahan Bakar &amp; Batubara (67 Pelabuhan)</span>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;font-size:11px;color:#44403C;">' +
            '<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#2A9D8F;border:1.5px solid #FFFFFF;box-shadow:0 0 0 1px rgba(0,0,0,0.15);"></span>' +
            '<span>[26] Bijih Logam &amp; Konsentrat (7 Pelabuhan)</span>' +
          '</div>' +
          '<div style="font-size:10px;color:#78716C;border-top:1px dashed rgba(120,113,108,0.2);padding-top:4px;">' +
            'Latar: PDRB Tambang 514 Daerah (Hulu &rarr; Hilir)' +
          '</div>';
        return div;
      };
      legend.addTo(map);

      // Fit bounds seluruh Indonesia
      map.fitBounds(INDONESIA_BOUNDS, { padding: [25, 25] });

      // 1. Muat data pelabuhan terlebih dahulu (INSTAN < 50ms)
      const resPorts = await fetch('./data/processed/pelabuhan_node.json');
      if (resPorts.ok) {
        const raw = await resPorts.json();
        portsData = raw.ports || raw;
        renderPorts();
      }

      // Pastikan tombol lapisan PDRB memiliki status awal yang benar
      const btnToggle = document.getElementById('btn-toggle-choropleth');
      if (btnToggle) {
        btnToggle.textContent = 'Lapisan PDRB: Nyala';
        btnToggle.classList.add('active');
      }

      // Invalidate size agar kanvas Leaflet langsung terisi sempurna
      setTimeout(function () {
        if (map) {
          map.invalidateSize();
          map.fitBounds(INDONESIA_BOUNDS, { padding: [25, 25] });
        }
      }, 200);

      // 2. Muat Lapisan Choropleth secara asinkron tanpa memblokir lingkaran pelabuhan
      if (window._geojsonData) {
        geojsonData = window._geojsonData;
        if (choroplethVisible && map) {
          choroplethLayer = L.geoJson(geojsonData, { style: choroStyle }).addTo(map);
          choroplethLayer.bringToBack();
        }
      } else {
        fetch('./pdrb_tambang_geo.geojson')
          .then(r => r.json())
          .then(data => {
            window._geojsonData = data;
            geojsonData = data;
            if (choroplethVisible && map) {
              choroplethLayer = L.geoJson(geojsonData, { style: choroStyle }).addTo(map);
              choroplethLayer.bringToBack();
            }
          })
          .catch(err => console.warn('[MapPort] Choropleth background load:', err));
      }

    } catch (err) {
      console.error('[MapPort] Init error:', err);
      dom.innerHTML = '<div style="padding:2rem;color:#b91c1c;font-family:sans-serif;font-size:13px;">Gagal memuat peta pelabuhan: ' + err.message + '</div>';
    }
  }

  function renderPorts() {
    if (!map || !portsData) return;

    portMarkers.forEach(function (m) {
      try { map.removeLayer(m); } catch (e) {}
    });
    portMarkers = [];

    portsData.forEach(function (p) {
      if (p.lat == null || p.lng == null) return;

      const isHs27 = p.primary_commodity && p.primary_commodity.includes('[27]');
      const isHs26 = p.primary_commodity && p.primary_commodity.includes('[26]');

      if (currentFilter === '27' && !isHs27) return;
      if (currentFilter === '26' && !isHs26) return;

      const color = getCommodityColor(p.primary_commodity);
      const radius = getRadius(p.export_value_million_usd);

      const marker = L.circleMarker([p.lat, p.lng], {
        radius: radius,
        fillColor: color,
        color: '#FFFFFF',
        weight: 1.5,
        opacity: 1,
        fillOpacity: 0.88,
        riseOnHover: true
      });

      marker.portData = p;

      marker.on('mouseover', function () {
        this.setStyle({
          weight: 3,
          color: '#292524',
          fillOpacity: 1
        });
        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
          this.bringToFront();
        }
        if (infoControl) infoControl.update(p);
      });

      marker.on('mouseout', function () {
        this.setStyle({
          weight: 1.5,
          color: '#FFFFFF',
          fillOpacity: 0.88
        });
        if (infoControl) infoControl.update();
      });

      marker.bindPopup(
        '<div style="padding:4px;">' +
          '<div style="font-size:10px;text-transform:uppercase;color:#78716C;font-weight:700;">Pelabuhan Ekspor Tambang</div>' +
          '<div style="font-size:13px;font-weight:700;color:#292524;margin-bottom:2px;">' + p.name + '</div>' +
          '<div style="font-size:11px;color:#78716C;margin-bottom:6px;">Peringkat #' + p.rank + ' Nasional &middot; Pangsa ' + p.share_percent + '%</div>' +
          '<div style="display:flex;justify-content:space-between;gap:12px;font-size:11px;border-top:1px solid rgba(0,0,0,0.08);padding-top:4px;margin-bottom:4px;">' +
            '<span style="color:#78716C;">Nilai Ekspor:</span>' +
            '<span style="font-family:monospace;font-weight:700;color:#B83E28;">' + formatUSD(p.export_value_million_usd) + '</span>' +
          '</div>' +
          '<div style="font-size:10.5px;color:#44403C;">' + getCommodityLabel(p.primary_commodity) + '</div>' +
          '<div style="font-size:10px;color:#78716C;margin-top:2px;">Tujuan Utama: ' + (p.dominant_destination || 'Ekspor Global') + '</div>' +
        '</div>'
      );

      marker.addTo(map);
      portMarkers.push(marker);
    });
  }

  // Filter komoditas di atas peta (bisa selalu diklik kapan saja & di segmen mana saja)
  function filterCommodity(code) {
    currentFilter = String(code);

    document.querySelectorAll('.chip-port-filter').forEach(function (el) {
      if (el.getAttribute('data-filter') === String(code)) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    renderPorts();
  }

  // Toggle Lapisan Choropleth PDRB: Nyala / Mati
  function toggleChoroplethUnderlay() {
    choroplethVisible = !choroplethVisible;
    const btn = document.getElementById('btn-toggle-choropleth');

    if (map) {
      if (choroplethVisible) {
        if (choroplethLayer && !map.hasLayer(choroplethLayer)) {
          choroplethLayer.addTo(map);
          choroplethLayer.bringToBack();
        }
      } else {
        if (choroplethLayer && map.hasLayer(choroplethLayer)) {
          map.removeLayer(choroplethLayer);
        }
      }
    }

    if (btn) {
      btn.textContent = 'Lapisan PDRB: ' + (choroplethVisible ? 'Nyala' : 'Mati');
      if (choroplethVisible) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    }
    return choroplethVisible;
  }

  function resetView() {
    filterCommodity('all');
    if (map) {
      map.flyToBounds(INDONESIA_BOUNDS, {
        padding: [25, 25],
        duration: 1.4,
        easeLinearity: 0.25
      });
    }
  }

  function selectPort(primaryName, secondaryName) {
    if (!portMarkers.length) return;
    let primaryMarker = null;

    portMarkers.forEach(m => {
      const p = m.portData;
      if (!p) return;
      const uName = (p.name || '').toUpperCase();
      const isPrimary = primaryName && uName.includes(primaryName.toUpperCase());
      const isSecondary = secondaryName && uName.includes(secondaryName.toUpperCase());

      if (isPrimary) {
        primaryMarker = m;
        m.setStyle({
          weight: 3.5,
          color: '#1C1917',
          fillOpacity: 1
        });
        if (m.bringToFront) m.bringToFront();
      } else if (isSecondary) {
        m.setStyle({
          weight: 2.5,
          color: '#44403C',
          fillOpacity: 0.95
        });
        if (m.bringToFront) m.bringToFront();
      } else {
        m.setStyle({
          weight: 1.5,
          color: '#FFFFFF',
          fillOpacity: 0.82
        });
      }
    });

    if (primaryMarker && map) {
      setTimeout(() => {
        try {
          primaryMarker.openPopup();
          if (infoControl) infoControl.update(primaryMarker.portData);
        } catch (e) {}
      }, 400);
    }
  }

  function deselectAllPorts() {
    if (map) {
      try { map.closePopup(); } catch (e) {}
    }
    portMarkers.forEach(m => {
      m.setStyle({
        weight: 1.5,
        color: '#FFFFFF',
        fillOpacity: 0.88
      });
    });
    if (infoControl) infoControl.update();
  }

  // Scrollytelling Bab 3 (Mengalir bebas dan menjaga interaktivitas tombol pengguna)
  function setStoryStep(stepId) {
    const titleEl = document.getElementById('port-stage-title');

    switch (stepId) {
      case 'step-port-nasional':
        filterCommodity('all');
        deselectAllPorts();
        if (map) {
          map.flyToBounds(INDONESIA_BOUNDS, { padding: [25, 25], duration: 1.4 });
        }
        if (titleEl) titleEl.textContent = '74 Simpul Pelabuhan: Koridor Ekspor USD 49,69 Miliar';
        break;

      case 'step-port-kalimantan':
        if (map) {
          map.flyTo([-2.2, 115.8], 6.6, { duration: 1.4 });
        }
        if (titleEl) titleEl.textContent = 'Hub Batubara Kalimantan: Banjarmasin & Samarinda';
        selectPort('BANJARMASIN', 'SAMARINDA');
        break;

      case 'step-port-tanjungbara':
        if (map) {
          map.flyTo([0.3, 117.5], 7.5, { duration: 1.4 });
        }
        if (titleEl) titleEl.textContent = 'Terminal Khusus Capesize: Tanjung Bara & Satui';
        selectPort('TANJUNG BARA', 'SATUI');
        break;

      case 'step-port-bijihlogam':
        filterCommodity('26');
        if (map) {
          map.flyTo([-4.81, 137.16], 7.0, { duration: 1.4 });
        }
        if (titleEl) titleEl.textContent = 'Eksklusivitas Bijih Logam [HS 26]: Amamapare (Freeport)';
        selectPort('AMAMAPARE', 'BENETE');
        break;

      case 'step-port-transisi':
        filterCommodity('all');
        deselectAllPorts();
        if (map) {
          map.flyToBounds(INDONESIA_BOUNDS, { padding: [25, 25], duration: 1.5 });
        }
        if (titleEl) titleEl.textContent = 'Dari Dermaga Indonesia Menembus 6 Benua';
        break;

      default:
        break;
    }
  }

  function resize() {
    if (map) map.invalidateSize();
  }

  window.MapPort = {
    init: init,
    resize: resize,
    resetView: resetView,
    filterCommodity: filterCommodity,
    toggleChoroplethUnderlay: toggleChoroplethUnderlay,
    toggleChoropleth: toggleChoroplethUnderlay,
    setStoryStep: setStoryStep
  };

  // Ekspos ke window agar pemanggilan inline onclick di HTML selalu berhasil
  window.toggleChoroplethUnderlay = toggleChoroplethUnderlay;
  window.filterPortCommodity = filterCommodity;
})();
