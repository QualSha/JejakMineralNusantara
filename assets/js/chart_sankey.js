/**
 * chart_sankey.js - Bab 5: Rantai Pasok Ekspor Tambang (Pelabuhan -> Negara Tujuan)
 * ECharts Sankey - Scrollytelling Interaktif, Penyorotan Koridor Dinamis & Estetika 'Softly'
 * Faktual dari BPS (ekspor_tambang.xlsx): 30 Pelabuhan Muat (termasuk Tanjung Priok & Soetta) -> Top 20 Negara Mitra (Total USD 46,24 Miliar)
 */

(function () {
  'use strict';

  let chartInstance = null;
  let rawFlowData = null;
  let currentStep = 'bab5-step-overview';

  function formatUSD(val) {
    if (val >= 1000) {
      return '$' + (val / 1000).toFixed(2) + ' Miliar USD';
    }
    return '$' + Number(val).toLocaleString('en-US', { maximumFractionDigits: 1 }) + ' Juta USD';
  }

  const CATEGORY_COLORS = {
    'Pelabuhan Indonesia':       '#2D6A4F', // Forest Emerald
    'Mitra (Asia)':              '#E07A5F', // Warm Coral
    'Mitra (Eropa)':             '#8E82B0', // Soft Lavender
    'Mitra (Australia/Oseania)': '#2A9D8F', // Ocean Teal
    'Mitra (Amerika)':           '#E29578', // Soft Terracotta
    'Mitra (Afrika)':            '#D4A373'  // Warm Sand
  };

  const PORT_DISPLAY_NAMES = {
    'TANJUNG PRIOK': 'Tanjung Priok (IPC)',
    'SOEKARNO-HATTA (U)': 'Soekarno-Hatta (U)',
    'AMAMAPARE': 'Amamapare (Mimika)',
    'AMAMAPARE IJ': 'Amamapare IJ',
    'BINTUNI IRIAN JAYA': 'Bintuni (LNG)',
    'SATUI': 'Satui (Kalsel)',
    'BANJARMASIN': 'Banjarmasin',
    'SAMARINDA': 'Samarinda',
    'BALIKPAPAN': 'Balikpapan',
    'TEREMPA': 'Tarempa (Kep. Riau)',
    'TANJUNG BARA KL': 'Tanjung Bara (KPC)',
    'MUSI RIVER/BOOM BARU': 'Boom Baru (Palembang)',
    'LUWUK': 'Luwuk (DSLNG)',
    'BELAKANG PADANG': 'Belakang Padang',
    'TANJUNG REDEP': 'Tanjung Redep (Berau)',
    'BONTHAN BAY SULAWESI': 'Bonthan Bay (Bantaeng)',
    'TANJUNG BALAI KARIMUN': 'Karimun (TBK)',
    'KALIORANG': 'Kaliorang (Kaltim)',
    'KOTABARU': 'Kotabaru',
    'ADANG BAY': 'Adang Bay (Paser)',
    'LINGKAS TARAKAN': 'Tarakan',
    'MEULABOH': 'Meulaboh (Aceh)',
    'BAHUDOPI': 'Bahodopi (Morowali)',
    'SUNGAI PAKNING': 'Sungai Pakning',
    'SANGKULIRANG': 'Sangkulirang',
    'TARAHAN': 'Tarahan (Lampung)',
    'NORTH PULAU LAUT': 'Pulau Laut (Kalsel)',
    'BENETE': 'Benete (Amman)',
    'GRESIK': 'Gresik (Manyar Smelter)',
    'TUBAN': 'Tuban Terminal',
    'CILACAP': 'Cilacap (RU IV)',
    'TANJUNG PERAK': 'Tanjung Perak'
  };

  const COUNTRY_FLAGS = {
    'Tiongkok': '🇨🇳 Tiongkok',
    'India': '🇮🇳 India',
    'Jepang': '🇯🇵 Jepang',
    'Singapura': '🇸🇬 Singapura',
    'Malaysia': '🇲🇾 Malaysia',
    'Korea Selatan': '🇰🇷 Korea Selatan',
    'Filipina': '🇵🇭 Filipina',
    'Thailand': '🇹🇭 Thailand',
    'Vietnam': '🇻🇳 Vietnam',
    'Taiwan': '🇹🇼 Taiwan',
    'Bangladesh': '🇧🇩 Bangladesh',
    'Kamboja': '🇰🇭 Kamboja',
    'Kep. Marshall': '🇲🇭 Kep. Marshall',
    'Hong Kong': '🇭🇰 Hong Kong',
    'Australia': '🇦🇺 Australia',
    'Brasil': '🇧🇷 Brasil',
    'Belanda': '🇳🇱 Belanda',
    'Italia': '🇮🇹 Italia',
    'Selandia Baru': '🇳🇿 Selandia Baru',
    'Turki': '🇹🇷 Turki'
  };

  function formatNodeLabel(name) {
    if (PORT_DISPLAY_NAMES[name]) return PORT_DISPLAY_NAMES[name];
    if (COUNTRY_FLAGS[name]) return COUNTRY_FLAGS[name];
    if (typeof name === 'string' && name === name.toUpperCase() && name.length > 2) {
      return name.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    }
    return name;
  }

  const KALIMANTAN_PORTS = [
    'BANJARMASIN', 'SAMARINDA', 'TANJUNG REDEP', 'TANJUNG BARA KL',
    'SATUI', 'BALIKPAPAN', 'KOTABARU', 'NORTH PULAU LAUT',
    'ADANG BAY', 'KALIORANG', 'SANGKULIRANG'
  ];

  const PAPUA_PORTS = [
    'BINTUNI IRIAN JAYA', 'AMAMAPARE', 'AMAMAPARE IJ'
  ];

  const SMELTER_PORTS = [
    'BONTHAN BAY SULAWESI', 'BAHUDOPI', 'LUWUK', 'BENETE',
    'MUSI RIVER/BOOM BARU', 'TARAHAN', 'TANJUNG PRIOK', 'GRESIK'
  ];

  async function init(containerId = 'chart-sankey') {
    const dom = document.getElementById(containerId);
    if (!dom || typeof echarts === 'undefined') return;

    if (chartInstance) {
      try { chartInstance.dispose(); } catch (e) {}
      chartInstance = null;
    }

    chartInstance = echarts.init(dom, null, { renderer: 'canvas' });

    try {
      const res = await fetch('./data/processed/ekspor_flow.json');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      rawFlowData = await res.json();
      render('bab5-step-overview');
    } catch (err) {
      console.error('[Sankey]', err);
      dom.innerHTML = '<div style="padding:2rem;color:#b91c1c;font-family:sans-serif;font-size:13px;">Gagal memuat diagram sankey: ' + err.message + '</div>';
    }
  }

  function render(stepId = 'bab5-step-overview') {
    if (!chartInstance || !rawFlowData || !rawFlowData.sankey) return;

    currentStep = stepId;
    const baseData = rawFlowData.sankey;
    let nodes = JSON.parse(JSON.stringify(baseData.nodes || []));
    let links = JSON.parse(JSON.stringify(baseData.links || []));

    // Siapkan styling untuk nodes
    nodes = nodes.map(node => {
      let color = '#78716C';
      for (const [cat, c] of Object.entries(CATEGORY_COLORS)) {
        if (node.category && node.category.includes(cat)) {
          color = c;
          break;
        }
      }

      // Cek apakah node aktif dalam step tertentu
      let isNodeHighlighted = true;
      if (stepId === 'bab5-step-coal') {
        isNodeHighlighted = KALIMANTAN_PORTS.includes(node.name) ||
          links.some(l => KALIMANTAN_PORTS.includes(l.source) && l.target === node.name);
      } else if (stepId === 'bab5-step-papua') {
        isNodeHighlighted = PAPUA_PORTS.includes(node.name) ||
          links.some(l => PAPUA_PORTS.includes(l.source) && l.target === node.name);
      } else if (stepId === 'bab5-step-smelter') {
        isNodeHighlighted = node.name === 'Tiongkok' || SMELTER_PORTS.includes(node.name) ||
          links.some(l => l.target === 'Tiongkok' && l.source === node.name);
      }

      return {
        ...node,
        itemStyle: {
          color: color,
          opacity: isNodeHighlighted ? 1 : 0.25,
          borderColor: '#FDFCF8',
          borderWidth: 1.5,
          borderRadius: 3
        },
        label: {
          color: isNodeHighlighted ? '#292524' : '#A8A29E',
          fontSize: 10.5,
          fontFamily: "'Outfit', sans-serif",
          fontWeight: isNodeHighlighted ? 600 : 400,
          formatter: function (params) {
            return formatNodeLabel(params.name);
          }
        }
      };
    });

    // Terapkan penyorotan links dinamis berdasarkan step
    links = links.map(link => {
      let isHighlight = false;
      let highlightColor = '#E07A5F';

      if (stepId === 'bab5-step-coal') {
        if (KALIMANTAN_PORTS.includes(link.source)) {
          isHighlight = true;
          highlightColor = '#D4A373'; // Batubara Warm Gold/Amber
        }
      } else if (stepId === 'bab5-step-papua') {
        if (PAPUA_PORTS.includes(link.source)) {
          isHighlight = true;
          highlightColor = '#2A9D8F'; // LNG & Tembaga Emerald
        }
      } else if (stepId === 'bab5-step-smelter') {
        if (link.target === 'Tiongkok' || SMELTER_PORTS.includes(link.source)) {
          isHighlight = true;
          highlightColor = '#E07A5F'; // Tiongkok Coral
        }
      } else {
        // Overview / Sintesis: Semua link aktif
        isHighlight = true;
      }

      if (stepId === 'bab5-step-overview' || stepId === 'bab5-step-sintesis') {
        return {
          ...link,
          lineStyle: {
            color: 'gradient',
            curveness: 0.5,
            opacity: stepId === 'bab5-step-sintesis' ? 0.42 : 0.32
          }
        };
      }

      return {
        ...link,
        lineStyle: {
          color: isHighlight ? highlightColor : '#E7E5E4',
          curveness: 0.5,
          opacity: isHighlight ? 0.78 : 0.04
        }
      };
    });

    // Update Text Topbar & Footer
    updateStageUI(stepId);

    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove',
        backgroundColor: 'rgba(253, 252, 248, 0.96)',
        borderColor: 'rgba(120, 113, 108, 0.18)',
        borderWidth: 1,
        padding: [10, 14],
        textStyle: {
          color: '#292524',
          fontSize: 12,
          fontFamily: "'Outfit', sans-serif"
        },
        extraCssText: 'box-shadow: 0 4px 20px -2px rgba(0,0,0,0.08); border-radius: 14px;',
        formatter: function (params) {
          if (params.dataType === 'edge') {
            const srcName = formatNodeLabel(params.data.source);
            const tgtName = formatNodeLabel(params.data.target);
            return `
              <div style="font-weight:700;font-size:12.5px;margin-bottom:4px;color:#292524;border-bottom:1px solid rgba(120,113,108,0.12);padding-bottom:4px;">
                ${srcName} &rarr; ${tgtName}
              </div>
              <div style="display:flex;justify-content:space-between;gap:16px;font-size:11px;margin-bottom:2px;">
                <span style="color:#78716C;">Nilai Aliran:</span>
                <span style="font-family:monospace;font-weight:700;color:#B83E28;">${formatUSD(params.data.value)}</span>
              </div>
              ${params.data.commodity ? `
              <div style="display:flex;justify-content:space-between;gap:16px;font-size:10.5px;color:#78716C;">
                <span>Kelompok:</span>
                <span style="font-weight:600;color:#292524;">${params.data.commodity}</span>
              </div>` : ''}
            `;
          } else {
            const displayName = formatNodeLabel(params.name);
            return `
              <div style="font-weight:700;font-size:13px;color:#292524;margin-bottom:3px;border-bottom:1px solid rgba(120,113,108,0.12);padding-bottom:4px;">
                ${displayName}
              </div>
              <div style="font-size:11px;color:#78716C;margin-bottom:4px;">
                ${params.data.category || 'Node Logistik'}
              </div>
              <div style="display:flex;justify-content:space-between;gap:16px;font-size:11px;">
                <span style="color:#78716C;">Total Transaksi:</span>
                <span style="font-family:monospace;font-weight:700;color:#292524;">${formatUSD(params.value)}</span>
              </div>
            `;
          }
        }
      },
      series: [{
        type: 'sankey',
        layout: 'none',
        top: 16,
        bottom: 16,
        left: 16,
        right: 150,
        nodeWidth: 14,
        nodeGap: 6,
        layoutIterations: 32,
        emphasis: {
          focus: 'adjacency'
        },
        data: nodes,
        links: links,
        lineStyle: {
          curveness: 0.5
        }
      }]
    };

    chartInstance.setOption(option, { notMerge: true });
  }

  function updateStageUI(stepId) {
    const titleEl = document.getElementById('sankey-stage-title');
    const noteEl = document.getElementById('sankey-footer-note');

    let titleText = 'Aliran Pelabuhan ke Negara Mitra';
    let noteText = 'sorot pita untuk melihat arus ~';
    let activeFilter = 'all';

    switch (stepId) {
      case 'bab5-step-overview':
        titleText = 'Arsitektur Rantai Pasok: 30 Pelabuhan Muat ke Top 20 Negara Mitra (USD 46,24 Miliar)';
        noteText = 'menampilkan 223 jalur aliran ekspor riil BPS (termasuk Tanjung Priok & Soetta) ~';
        activeFilter = 'all';
        break;

      case 'bab5-step-coal':
        titleText = 'Koridor Batubara Kalimantan: Pemasok 49,3% Devisa Energi ke PLTU Asia (USD 17,58 Miliar)';
        noteText = 'fokus pelabuhan kalsel & kaltim: banjarmasin, samarinda, satui, tj. bara ~';
        activeFilter = 'coal';
        break;

      case 'bab5-step-papua':
        titleText = 'Kutub Nilai Tambah Ekstrem: Koridor LNG Tangguh Bintuni & Tembaga Freeport Amamapare (USD 6,27 Miliar)';
        noteText = 'fokus papua: bintuni ($3,14 B) & amamapare ($3,13 B) ~';
        activeFilter = 'papua';
        break;

      case 'bab5-step-smelter':
        titleText = 'Hilirisasi Nikel, Manufaktur & Monopsoni Penyerapan Pasar Tiongkok (USD 15,80 Miliar)';
        noteText = 'fokus serapan tiongkok (34,2%) & smelter bonthan bay, bahodopi, tj. priok ~';
        activeFilter = 'smelter';
        break;

      case 'bab5-step-sintesis':
        titleText = 'Sintesis Rantai Pasok Terpadu: 223 Koridor Pengapalan Menuju Samudra Global';
        noteText = 'persiapan pelayaran maritim fisik di bab 6 ~';
        activeFilter = 'all';
        break;
    }

    if (titleEl) titleEl.textContent = titleText;
    if (noteEl) noteEl.textContent = noteText;

    // Update Chip Filter Aktif
    document.querySelectorAll('.chip-sankey').forEach(function (btn) {
      if (btn.getAttribute('data-flow') === activeFilter) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  function setStoryStep(stepId) {
    if (stepId === currentStep) return;
    render(stepId);
  }

  let selectedPortFilter = 'all';
  let selectedCountryFilter = 'all';

  function filterSankeyBySelect(portKey = 'all', countryKey = 'all') {
    selectedPortFilter = portKey;
    selectedCountryFilter = countryKey;

    if (!chartInstance || !rawFlowData || !rawFlowData.sankey) return;

    const baseData = rawFlowData.sankey;
    let allLinks = baseData.links || [];

    // Filter links
    let filteredLinks = allLinks.filter(l => {
      const matchPort = (portKey === 'all') || (l.source === portKey);
      const matchCountry = (countryKey === 'all') || (l.target === countryKey);
      return matchPort && matchCountry;
    });

    const titleEl = document.getElementById('sankey-stage-title') || document.querySelector('#panel-4 .db-panel-title');
    const portLabel = PORT_DISPLAY_NAMES[portKey] || portKey;

    // Jika tidak ada link untuk kombinasi terpilih (misal pelabuhan dan negara yang tidak memiliki rute langsung)
    if (filteredLinks.length === 0) {
      if (titleEl) {
        titleEl.textContent = 'Tidak Ada Arus Langsung: ' + portLabel + ' -> ' + countryKey;
      }
      chartInstance.setOption({
        graphic: [{
          type: 'text',
          left: 'center',
          top: 'center',
          style: {
            text: 'Tidak ada arus langsung antara ' + portLabel + ' dan ' + countryKey + '\ndalam catatan transaksi ekspor resmi BPS 2025.',
            fill: '#78716C',
            fontSize: 12,
            fontFamily: "'Outfit', sans-serif",
            textAlign: 'center'
          }
        }],
        series: []
      }, { notMerge: true });
      return;
    }

    // Kumpulkan node yang aktif
    const activeNodesSet = new Set();
    let totalVal = 0;
    filteredLinks.forEach(l => {
      activeNodesSet.add(l.source);
      activeNodesSet.add(l.target);
      totalVal += (l.value || 0);
    });

    let filteredNodes = (baseData.nodes || []).filter(n => activeNodesSet.has(n.name)).map(node => {
      let color = '#78716C';
      for (const [cat, c] of Object.entries(CATEGORY_COLORS)) {
        if (node.category && node.category.includes(cat)) {
          color = c;
          break;
        }
      }
      return {
        ...node,
        itemStyle: {
          color: color,
          opacity: 1,
          borderColor: '#FDFCF8',
          borderWidth: 1.5,
          borderRadius: 3
        },
        label: {
          color: '#292524',
          fontSize: 11,
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 600,
          formatter: function (params) {
            return formatNodeLabel(params.name);
          }
        }
      };
    });

    const linksFormatted = filteredLinks.map(l => ({
      ...l,
      lineStyle: {
        color: 'gradient',
        curveness: 0.5,
        opacity: 0.38
      }
    }));

    if (titleEl) {
      if (portKey !== 'all' && countryKey !== 'all') {
        titleEl.textContent = 'Arus Spesifik: ' + portLabel + ' -> ' + countryKey + ' (' + formatUSD(totalVal) + ')';
      } else if (portKey !== 'all') {
        titleEl.textContent = 'Arus Ekspor: ' + portLabel + ' ke ' + filteredLinks.length + ' Negara Tujuan (' + formatUSD(totalVal) + ')';
      } else if (countryKey !== 'all') {
        titleEl.textContent = 'Arus Pasok: ' + filteredLinks.length + ' Pelabuhan Muat ke ' + countryKey + ' (' + formatUSD(totalVal) + ')';
      } else {
        titleEl.textContent = 'Arsitektur Rantai Pasok: 30 Pelabuhan Muat ke Top 20 Negara Mitra (' + formatUSD(totalVal) + ')';
      }
    }

    const option = {
      graphic: [],
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove',
        backgroundColor: 'rgba(253, 252, 248, 0.96)',
        borderColor: 'rgba(120, 113, 108, 0.18)',
        borderWidth: 1,
        padding: [10, 14],
        textStyle: {
          color: '#292524',
          fontSize: 12,
          fontFamily: "'Outfit', sans-serif"
        },
        extraCssText: 'box-shadow: 0 4px 20px -2px rgba(0,0,0,0.08); border-radius: 14px;',
        formatter: function (params) {
          if (params.dataType === 'edge') {
            const srcName = formatNodeLabel(params.data.source);
            const tgtName = formatNodeLabel(params.data.target);
            return `
              <div style="font-weight:700;font-size:12.5px;margin-bottom:4px;color:#292524;border-bottom:1px solid rgba(120,113,108,0.12);padding-bottom:4px;">
                ${srcName} &rarr; ${tgtName}
              </div>
              <div style="display:flex;justify-content:space-between;gap:16px;font-size:11px;margin-bottom:2px;">
                <span style="color:#78716C;">Nilai Aliran:</span>
                <span style="font-family:monospace;font-weight:700;color:#B83E28;">${formatUSD(params.data.value)}</span>
              </div>
              ${params.data.commodity ? `
              <div style="display:flex;justify-content:space-between;gap:16px;font-size:10.5px;color:#78716C;">
                <span>Kelompok:</span>
                <span style="font-weight:600;color:#292524;">${params.data.commodity}</span>
              </div>` : ''}
            `;
          } else {
            const displayName = formatNodeLabel(params.name);
            return `
              <div style="font-weight:700;font-size:13px;color:#292524;margin-bottom:3px;border-bottom:1px solid rgba(120,113,108,0.12);padding-bottom:4px;">
                ${displayName}
              </div>
              <div style="font-size:11px;color:#78716C;margin-bottom:4px;">
                ${params.data.category || 'Node Logistik'}
              </div>
              <div style="display:flex;justify-content:space-between;gap:16px;font-size:11px;">
                <span style="color:#78716C;">Total Transaksi:</span>
                <span style="font-family:monospace;font-weight:700;color:#292524;">${formatUSD(params.value)}</span>
              </div>
            `;
          }
        }
      },
      series: [{
        type: 'sankey',
        layout: 'none',
        top: 16,
        bottom: 16,
        left: 16,
        right: 150,
        nodeWidth: 14,
        nodeGap: 6,
        layoutIterations: 32,
        emphasis: {
          focus: 'adjacency'
        },
        data: filteredNodes,
        links: linksFormatted,
        lineStyle: {
          curveness: 0.5
        }
      }]
    };

    chartInstance.setOption(option, { notMerge: true });
  }


  function filterSankeyMulti(selectedPorts, selectedCountries) {
    if (!chartInstance || !rawFlowData || !rawFlowData.sankey) return;

    const baseData = rawFlowData.sankey;
    const allLinks = baseData.all_links || baseData.links || [];
    const allNodes = baseData.all_nodes || baseData.nodes || [];

    const portSet = (selectedPorts instanceof Set) ? selectedPorts : new Set(selectedPorts || []);
    const countrySet = (selectedCountries instanceof Set) ? selectedCountries : new Set(selectedCountries || []);

    // Filter links
    const filteredLinks = allLinks.filter(l => {
      const matchPort = (portSet.size === 0) || portSet.has(l.source);
      const matchCountry = (countrySet.size === 0) || countrySet.has(l.target);
      return matchPort && matchCountry;
    });

    const titleEl = document.getElementById('sankey-stage-title') || document.querySelector('#panel-4 .db-panel-title');

    if (filteredLinks.length === 0 || portSet.size === 0 || countrySet.size === 0) {
      if (titleEl) {
        titleEl.textContent = 'Tidak Ada Arus Langsung untuk Kombinasi Terpilih';
      }
      chartInstance.setOption({
        graphic: [{
          type: 'text',
          left: 'center',
          top: 'center',
          style: {
            text: 'Tidak ada arus langsung antara pelabuhan dan negara terpilih\ndalam catatan transaksi ekspor resmi BPS 2025.',
            fill: '#78716C',
            fontSize: 12,
            fontFamily: "'Outfit', sans-serif",
            textAlign: 'center'
          }
        }],
        series: []
      }, { notMerge: true });
      return;
    }

    // Active nodes
    const activeNodesSet = new Set();
    let totalVal = 0;
    filteredLinks.forEach(l => {
      activeNodesSet.add(l.source);
      activeNodesSet.add(l.target);
      totalVal += (l.value || 0);
    });

    const filteredNodes = allNodes.filter(n => activeNodesSet.has(n.name)).map(node => {
      let color = '#78716C';
      for (const [cat, c] of Object.entries(CATEGORY_COLORS)) {
        if (node.category && node.category.includes(cat)) {
          color = c;
          break;
        }
      }
      return {
        ...node,
        itemStyle: {
          color: color,
          opacity: 1,
          borderColor: '#FDFCF8',
          borderWidth: 1.5,
          borderRadius: 3
        },
        label: {
          color: '#292524',
          fontSize: 11,
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 600,
          formatter: function (params) {
            return formatNodeLabel(params.name);
          }
        }
      };
    });

    const linksFormatted = filteredLinks.map(l => ({
      ...l,
      lineStyle: {
        color: 'gradient',
        curveness: 0.5,
        opacity: 0.38
      }
    }));

    if (titleEl) {
      titleEl.textContent = 'Arsitektur Rantai Pasok: ' + portSet.size + ' Pelabuhan Muat ke ' + countrySet.size + ' Negara Mitra (' + formatUSD(totalVal) + ')';
    }

    const option = {
      graphic: [],
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove',
        backgroundColor: 'rgba(253, 252, 248, 0.96)',
        borderColor: 'rgba(120, 113, 108, 0.18)',
        borderWidth: 1,
        padding: [10, 14],
        textStyle: {
          color: '#292524',
          fontSize: 12,
          fontFamily: "'Outfit', sans-serif"
        },
        extraCssText: 'box-shadow: 0 4px 20px -2px rgba(0,0,0,0.08); border-radius: 14px;',
        formatter: function (params) {
          if (params.dataType === 'edge') {
            const srcName = formatNodeLabel(params.data.source);
            const tgtName = formatNodeLabel(params.data.target);
            return `
              <div style="font-weight:700;font-size:12.5px;margin-bottom:4px;color:#292524;border-bottom:1px solid rgba(120,113,108,0.12);padding-bottom:4px;">
                ${srcName} &rarr; ${tgtName}
              </div>
              <div style="display:flex;justify-content:space-between;gap:16px;font-size:11px;margin-bottom:2px;">
                <span style="color:#78716C;">Nilai Aliran:</span>
                <span style="font-family:monospace;font-weight:700;color:#B83E28;">${formatUSD(params.data.value)}</span>
              </div>
              ${params.data.commodity ? `
              <div style="display:flex;justify-content:space-between;gap:16px;font-size:10.5px;color:#78716C;">
                <span>Kelompok:</span>
                <span style="font-weight:600;color:#292524;">${params.data.commodity}</span>
              </div>` : ''}
            `;
          } else {
            const displayName = formatNodeLabel(params.name);
            return `
              <div style="font-weight:700;font-size:13px;color:#292524;margin-bottom:3px;border-bottom:1px solid rgba(120,113,108,0.12);padding-bottom:4px;">
                ${displayName}
              </div>
              <div style="font-size:11px;color:#78716C;margin-bottom:4px;">
                ${params.data.category || 'Node Logistik'}
              </div>
              <div style="display:flex;justify-content:space-between;gap:16px;font-size:11px;">
                <span style="color:#78716C;">Total Transaksi:</span>
                <span style="font-family:monospace;font-weight:700;color:#292524;">${formatUSD(params.value)}</span>
              </div>
            `;
          }
        }
      },
      series: [{
        type: 'sankey',
        layout: 'none',
        top: 16,
        bottom: 16,
        left: 16,
        right: 150,
        nodeWidth: 14,
        nodeGap: 6,
        layoutIterations: 32,
        emphasis: {
          focus: 'adjacency'
        },
        data: filteredNodes,
        links: linksFormatted,
        lineStyle: {
          curveness: 0.5
        }
      }]
    };

    chartInstance.setOption(option, { notMerge: true });
  }

  function onSelectChange(portSelectId, countrySelectId) {
    const portEl = document.getElementById(portSelectId);
    const countryEl = document.getElementById(countrySelectId);
    const portVal = portEl ? portEl.value : 'all';
    const countryVal = countryEl ? countryEl.value : 'all';

    // Synchronize the other dropdown if it exists on the page
    const otherPortId = portSelectId.startsWith('db-') ? 'story-sankey-port' : 'db-sankey-port';
    const otherCountryId = countrySelectId.startsWith('db-') ? 'story-sankey-country' : 'db-sankey-country';
    const otherPort = document.getElementById(otherPortId);
    const otherCountry = document.getElementById(otherCountryId);
    if (otherPort) otherPort.value = portVal;
    if (otherCountry) otherCountry.value = countryVal;

    filterSankeyBySelect(portVal, countryVal);
  }

  function filterSankey(key) {
    let targetStep = 'bab5-step-overview';
    if (key === 'coal') targetStep = 'bab5-step-coal';
    if (key === 'papua') targetStep = 'bab5-step-papua';
    if (key === 'smelter' || key === 'tiongkok') targetStep = 'bab5-step-smelter';
    render(targetStep);
  }

  function resize() {
    if (chartInstance) chartInstance.resize();
  }

  window.filterSankeyBySelect = filterSankeyBySelect;
  window.filterSankeyMulti = filterSankeyMulti;
  window.ChartSankey = {
    init: init,
    render: render,
    resize: resize,
    setStoryStep: setStoryStep,
    filterSankey: filterSankey,
    filterSankeyBySelect: filterSankeyBySelect,
    filterSankeyMulti: filterSankeyMulti,
    onSelectChange: onSelectChange
  };

})();
