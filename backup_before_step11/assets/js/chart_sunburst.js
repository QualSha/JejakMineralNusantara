/**
 * chart_sunburst.js - Bab 4: Pasar Global Komoditas Ekspor Tambang
 * ECharts Sunburst - Scrollytelling Dinamis, Animasi Cepat, Hierarki Khusus & Transisi Faktual
 * Data Faktual: Total USD 49,69 B; Asia USD 48,10 B (96,80%); Non-Asia USD 1,59 B (3,20%)
 */

(function () {
  'use strict';

  let chartInstance = null;
  let rawFlowData = null;
  let currentContinent = 'all';
  let autoCycleTimer = null;
  let currentStoryStep = 'step-sunburst-global';
  let cycleIndex = 0;

  const CONTINENT_COLORS = {
    'Asia':              '#E07A5F', // Warm Coral
    'Eropa':             '#8E82B0', // Soft Lavender
    'Australia/Oseania': '#7A9E7E', // Soft Sage
    'Oseania':           '#7A9E7E', // Soft Sage
    'Amerika':           '#E29578', // Soft Peach
    'Amerika Selatan':   '#E29578', // Soft Peach
    'Amerika Utara':     '#DDA15E', // Dusty Rose
    'Afrika':            '#D4A373'  // Warm Sand
  };

  const COUNTRY_CLEAN_MAP = {
    'China': 'Tiongkok',
    'Japan': 'Jepang',
    'Korea Republic Of': 'Korea Selatan',
    'Korea, Republic of': 'Korea Selatan',
    'Viet Nam': 'Vietnam',
    'Vietnam': 'Vietnam',
    'Philippines': 'Filipina',
    'Singapore': 'Singapura',
    'Malaysia': 'Malaysia',
    'India': 'India',
    'Taiwan': 'Taiwan',
    'Bangladesh': 'Bangladesh',
    'Netherlands': 'Belanda',
    'Italy': 'Italia',
    'Turkey': 'Turki',
    'Belgium': 'Belgia',
    'Romania': 'Rumania',
    'Bulgaria': 'Bulgaria',
    'Marshall Islands': 'Kep. Marshall',
    'Australia': 'Australia',
    'New Zealand': 'Selandia Baru',
    'Papua New Guinea': 'Papua Nugini',
    'Brazil': 'Brasil',
    'Argentina': 'Argentina',
    'Peru': 'Peru',
    'South Africa': 'Afrika Selatan',
    'Morocco': 'Maroko',
    'Mexico': 'Meksiko',
    'United States': 'Amerika Serikat',
    'Canada': 'Kanada'
  };

  function cleanName(str) {
    if (!str) return '';
    let clean = str.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '')
                   .replace(/[\u2600-\u27BF]/g, '')
                   .replace(/^[A-Z]{2}\s+/, '')
                   .trim();
    return COUNTRY_CLEAN_MAP[clean] || clean;
  }

  function formatUSD(val) {
    if (val >= 1e9) {
      return '$' + (val / 1e9).toFixed(2) + ' Miliar USD';
    }
    if (val >= 1e6) {
      return '$' + (val / 1e6).toFixed(1) + ' Juta USD';
    }
    return '$' + Number(val).toLocaleString('en-US');
  }

  function applyColors(node, inheritedColor) {
    let color = inheritedColor;
    if (CONTINENT_COLORS[node.name]) {
      color = CONTINENT_COLORS[node.name];
    }
    
    if (color) {
      node.itemStyle = node.itemStyle || {};
      node.itemStyle.color = color;
      node.itemStyle.borderColor = '#FDFCF8';
      node.itemStyle.borderWidth = 2;
    }

    if (node.children && node.children.length) {
      node.children.forEach(child => {
        child.name = cleanName(child.name);
        applyColors(child, color);
      });
    }
  }

  function cleanTreeNames(node) {
    if (!node) return;
    if (node.name) node.name = cleanName(node.name);
    if (node.children && node.children.length) {
      node.children.forEach(child => cleanTreeNames(child));
    }
  }

  async function init(containerId) {
    const targetId = containerId || 'chart-sunburst';
    const dom = document.getElementById(targetId);
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
      
      if (rawFlowData && rawFlowData.sunburst) {
        cleanTreeNames(rawFlowData.sunburst);
      }

      if (targetId === 'db-chart-sunburst') {
        // Pada DASHBOARD: Jangan bergerak-gerak, tampilkan keseluruhan terlebih dahulu!
        stopAutoCycle();
        const dataFull = getFullSynthesisTreeData();
        renderData(dataFull, 3, 'Sintesis Pasar Global: Peta Lengkap Benua & 84 Negara Mitra');
        updateFooterNote('Navigasi: Gunakan tombol filter benua untuk memperinci pangsa pasar');
      } else {
        setStoryStep('step-sunburst-global');
      }
    } catch (err) {
      console.error('[Sunburst]', err);
      dom.innerHTML = '<div style="padding:2rem;color:#b91c1c;font-family:sans-serif;font-size:13px;">Gagal memuat diagram sunburst: ' + err.message + '</div>';
    }
  }

  function getRawTree() {
    if (!rawFlowData || !rawFlowData.sunburst) return null;
    const tree = JSON.parse(JSON.stringify(rawFlowData.sunburst));
    cleanTreeNames(tree);
    if (tree.children) {
      tree.children.forEach(continentNode => {
        applyColors(continentNode, CONTINENT_COLORS[continentNode.name] || '#78716C');
      });
    }
    return tree;
  }

  // 1. Data Segmen 1 (Global): 3 Tingkat Hierarki (Root > Benua > Negara)
  function getOverview3LevelsData() {
    const fullTree = getRawTree();
    if (!fullTree || !fullTree.children) return null;

    let amerikaCountries = [];
    let amerikaVal = 0;
    const continents = [];

    fullTree.children.forEach(c => {
      const cName = c.name;
      const cColor = CONTINENT_COLORS[cName] || '#78716C';

      if (cName.includes('Amerika')) {
        amerikaVal += (c.value || 0);
        if (c.children) {
          c.children.forEach(sub => {
            amerikaCountries.push({
              name: cleanName(sub.name),
              value: sub.value,
              itemStyle: {
                color: CONTINENT_COLORS['Amerika'] || '#E29578',
                borderColor: '#FDFCF8',
                borderWidth: 1.2
              }
            });
          });
        }
      } else {
        const countryChildren = (c.children || []).map(child => ({
          name: cleanName(child.name),
          value: child.value,
          itemStyle: {
            color: cColor,
            borderColor: '#FDFCF8',
            borderWidth: 1.2
          }
        }));

        continents.push({
          name: cName === 'Australia/Oseania' ? 'Oseania' : cName,
          value: c.value,
          itemStyle: {
            color: cColor,
            borderColor: '#FDFCF8',
            borderWidth: 2
          },
          children: countryChildren
        });
      }
    });

    if (amerikaVal > 0) {
      continents.push({
        name: 'Amerika',
        value: amerikaVal,
        itemStyle: {
          color: CONTINENT_COLORS['Amerika'] || '#E29578',
          borderColor: '#FDFCF8',
          borderWidth: 2
        },
        children: amerikaCountries
      });
    }

    return [{
      name: 'Total Ekspor Tambang',
      value: fullTree.value,
      itemStyle: { color: '#292524', borderColor: '#FDFCF8', borderWidth: 2 },
      children: continents
    }];
  }

  // 1b. Data Segmen 1 (Global fallback): Tampilkan hanya sampai tingkat kedua (Benua)
  function getOverviewContinentsOnlyData() {
    const fullTree = getRawTree();
    if (!fullTree) return null;

    const continents = (fullTree.children || []).map(c => ({
      name: c.name,
      value: c.value,
      itemStyle: {
        color: CONTINENT_COLORS[c.name] || '#78716C',
        borderColor: '#FDFCF8',
        borderWidth: 2
      }
    }));

    return [{
      name: 'Total Ekspor Tambang',
      value: fullTree.value,
      itemStyle: { color: '#292524', borderColor: '#FDFCF8', borderWidth: 2 },
      children: continents
    }];
  }

  // 2. Data Zoom ke Benua tertentu bersama negara-negaranya
  function getContinentWithCountriesData(continentKey) {
    const fullTree = getRawTree();
    if (!fullTree || !fullTree.children) return null;

    if (continentKey === 'Amerika') {
      const amerikaNodes = fullTree.children.filter(c => c.name.includes('Amerika'));
      const totalVal = amerikaNodes.reduce((acc, c) => acc + (c.value || 0), 0);
      const mergedCountries = [];
      amerikaNodes.forEach(c => {
        if (c.children) {
          c.children.forEach(sub => mergedCountries.push(sub));
        }
      });

      return [{
        name: 'Benua Amerika',
        value: totalVal,
        itemStyle: { color: CONTINENT_COLORS['Amerika'], borderColor: '#FDFCF8', borderWidth: 2 },
        children: mergedCountries
      }];
    }

    if (continentKey === 'Afrika') {
      const afrikaNode = fullTree.children.find(c => c.name === 'Afrika');
      if (afrikaNode) return [afrikaNode];
    }

    if (continentKey === 'Australia/Oseania' || continentKey === 'Oseania') {
      const oseaniaNode = fullTree.children.find(c => c.name.includes('Oseania') || c.name.includes('Australia'));
      if (oseaniaNode) return [oseaniaNode];
    }

    const targetNode = fullTree.children.find(c => c.name === continentKey);
    if (targetNode) {
      return [targetNode];
    }
    return [fullTree];
  }

  // 3. Data Segmen 'Tiga Pilar Utama: Tiongkok, India, & Jepang'
  // Tahap/tingkat kedua menjadi 4 SAJA: Tiongkok, India, Jepang, dan 'Lainnya'
  function getPillarsData() {
    const fullTree = getRawTree();
    if (!fullTree || !fullTree.children) return null;

    const asiaNode = fullTree.children.find(c => c.name === 'Asia');
    if (!asiaNode || !asiaNode.children) return [fullTree];

    const pillarsNames = ['Tiongkok', 'India', 'Jepang'];
    const p1 = [];
    let otherVal = 0;

    asiaNode.children.forEach(country => {
      const cName = cleanName(country.name);
      if (pillarsNames.includes(cName)) {
        country.name = cName;
        p1.push(country);
      } else {
        otherVal += (country.value || 0);
      }
    });

    p1.sort((a, b) => b.value - a.value);

    // Tepat 4 irisan: Tiongkok, India, Jepang, dan 'Lainnya'
    p1.push({
      name: 'Lainnya',
      value: Math.round(otherVal * 100) / 100,
      itemStyle: {
        color: '#A8A29E',
        borderColor: '#FDFCF8',
        borderWidth: 2
      }
    });

    return [{
      name: 'Pilar Utama Asia',
      value: asiaNode.value,
      itemStyle: { color: '#E07A5F', borderColor: '#FDFCF8', borderWidth: 2 },
      children: p1
    }];
  }

  // 4. Data Segmen 'Pasar Non-Asia: Eropa, Oseania, & Benua Lain'
  // Tampilkan HINGGA HIERARKI KEDUA SAJA (Benua), TANPA mengikutkan Asia
  function getNonAsiaContinentsOnlyData() {
    const fullTree = getRawTree();
    if (!fullTree || !fullTree.children) return null;

    const nonAsiaContinents = fullTree.children
      .filter(c => c.name !== 'Asia')
      .map(c => ({
        name: c.name,
        value: c.value,
        itemStyle: {
          color: CONTINENT_COLORS[c.name] || '#78716C',
          borderColor: '#FDFCF8',
          borderWidth: 2
        }
      }));

    const totalNonAsiaVal = nonAsiaContinents.reduce((acc, c) => acc + (c.value || 0), 0);

    return [{
      name: 'Pasar Non-Asia',
      value: totalNonAsiaVal,
      itemStyle: { color: '#8E82B0', borderColor: '#FDFCF8', borderWidth: 2 },
      children: nonAsiaContinents
    }];
  }

  function getFullSynthesisTreeData() {
    const fullTree = getRawTree();
    if (!fullTree) return null;
    return [fullTree];
  }

  function computeDataDepth(nodes) {
    let max = 0;
    function traverse(node, depth) {
      if (depth > max) max = depth;
      if (node.children && node.children.length) {
        node.children.forEach(c => traverse(c, depth + 1));
      }
    }
    if (Array.isArray(nodes)) {
      nodes.forEach(n => traverse(n, 1));
    } else if (nodes) {
      traverse(nodes, 1);
    }
    return Math.max(1, max);
  }

  function getDynamicLevels(depth) {
    if (depth <= 2) {
      return [
        {},
        {
          r0: '0%',
          r: '34%',
          itemStyle: { borderWidth: 2, borderColor: '#FDFCF8' },
          label: {
            rotate: 0,
            fontSize: 12,
            fontWeight: 700,
            color: '#FFFFFF'
          }
        },
        {
          r0: '34%',
          r: '88%',
          itemStyle: { borderWidth: 1.5, borderColor: '#FDFCF8' },
          label: {
            minAngle: 7,
            align: 'center',
            fontSize: 11,
            fontWeight: 600,
            color: '#FFFFFF',
            formatter: function (param) {
              const pct = param.percent ? param.percent.toFixed(1) + '%' : '';
              return param.name + (pct ? '\n(' + pct + ')' : '');
            }
          }
        }
      ];
    }

    return [
      {},
      {
        // Level 1: Root (Total)
        r0: '0%',
        r: '20%',
        itemStyle: { borderWidth: 2, borderColor: '#FDFCF8' },
        label: {
          rotate: 0,
          fontSize: 11,
          fontWeight: 700,
          color: '#FFFFFF'
        }
      },
      {
        // Level 2: Benua
        r0: '20%',
        r: '48%',
        itemStyle: { borderWidth: 2, borderColor: '#FDFCF8' },
        label: {
          minAngle: 10,
          align: 'right',
          fontSize: 11,
          fontWeight: 700,
          color: '#FFFFFF'
        }
      },
      {
        // Level 3: Negara
        r0: '48%',
        r: '88%',
        itemStyle: { borderWidth: 1.2, borderColor: '#FDFCF8' },
        label: {
          minAngle: 5,
          align: 'center',
          fontSize: 10,
          color: '#FFFFFF'
        }
      }
    ];
  }

  function renderData(data, maxDepth = null, customTitle = null) {
    if (!chartInstance || !data) return;

    if (customTitle) {
      const titleEl = document.getElementById('sunburst-stage-title');
      if (titleEl) titleEl.textContent = customTitle;
    }

    const effectiveDepth = maxDepth || computeDataDepth(data);

    const option = {
      // Warm palette - meniadakan warna default biru ECharts (#5470c6)
      color: ['#E07A5F', '#8E82B0', '#7A9E7E', '#E29578', '#DDA15E', '#D4A373', '#A8A29E'],
      backgroundColor: 'transparent',
      title: { show: false },
      animationDurationUpdate: 750,
      animationEasingUpdate: 'cubicOut',
      tooltip: {
        trigger: 'item',
        confine: true,
        backgroundColor: 'rgba(253, 252, 248, 0.96)',
        borderColor: 'rgba(120, 113, 108, 0.18)',
        borderWidth: 1,
        padding: [10, 14],
        textStyle: {
          color: '#292524',
          fontSize: 12,
          fontFamily: "'Outfit', sans-serif"
        },
        extraCssText: 'box-shadow: 0 4px 20px -2px rgba(0,0,0,0.08); border-radius: 12px; max-width: 250px;',
        formatter: function (params) {
          const val = params.value;
          const pct = params.percent != null ? params.percent.toFixed(1) + '%' : '';
          return `
            <div style="font-weight:700;font-size:12.5px;color:#292524;margin-bottom:4px;border-bottom:1px solid rgba(120,113,108,0.12);padding-bottom:4px;">
              ${params.name}
            </div>
            <div style="display:flex;justify-content:space-between;gap:14px;font-size:11px;margin-bottom:2px;">
              <span style="color:#78716C;">Nilai Ekspor:</span>
              <span style="font-family:monospace;font-weight:700;color:#B83E28;">${formatUSD(val)}</span>
            </div>
            ${pct ? `<div style="display:flex;justify-content:space-between;gap:14px;font-size:10.5px;color:#78716C;">
              <span>Porsi Lingkaran:</span>
              <span style="font-weight:600;color:#292524;">${pct}</span>
            </div>` : ''}
          `;
        }
      },
      series: [{
        type: 'sunburst',
        data: data,
        radius: ['12%', '90%'],
        center: ['50%', '52%'],
        nodeClick: false, // Mencegah zoom daun tunggal yang memunculkan lingkaran kosong/biru
        sort: 'desc',
        emphasis: {
          focus: 'descendant'
        },
        levels: getDynamicLevels(effectiveDepth)
      }]
    };

    chartInstance.setOption(option, { notMerge: true });
  }

  function stopAutoCycle() {
    if (autoCycleTimer) {
      clearInterval(autoCycleTimer);
      autoCycleTimer = null;
    }
  }

  // Frame animasi rotasi untuk Segmen 1 (Jeda cepat 1.8 detik antar transisi)
  const ROTATION_FRAMES = [
    {
      type: 'overview',
      depth: 3,
      getData: getOverview3LevelsData,
      title: 'Distribusi Global: 3 Tingkat Hierarki hingga 84 Negara Mitra',
      note: 'Struktur: Global > Benua > 84 Negara Mitra'
    },
    {
      type: 'continent',
      continent: 'Asia',
      depth: 2,
      getData: () => getContinentWithCountriesData('Asia'),
      title: 'Kawasan Asia: Poros Utama Penyerapan 96,8% Ekspor Mineral',
      note: 'Pangsa Pasar: USD 48,10 Miliar (96,80%)'
    },
    {
      type: 'continent',
      continent: 'Eropa',
      depth: 2,
      getData: () => getContinentWithCountriesData('Eropa'),
      title: 'Kawasan Eropa: Pangsa Ekspor USD 679,6 Juta (1,37%)',
      note: 'Pangsa Pasar: USD 679,6 Juta (1,37%)'
    },
    {
      type: 'continent',
      continent: 'Oseania',
      depth: 2,
      getData: () => getContinentWithCountriesData('Oseania'),
      title: 'Kawasan Oseania: Pangsa Ekspor USD 610,8 Juta (1,23%)',
      note: 'Pangsa Pasar: USD 610,8 Juta (1,23%)'
    },
    {
      type: 'continent',
      continent: 'Amerika',
      depth: 2,
      getData: () => getContinentWithCountriesData('Amerika'),
      title: 'Kawasan Amerika: Total Ekspor USD 223,7 Juta',
      note: 'Pangsa Pasar: USD 223,7 Juta (0,45%)'
    },
    {
      type: 'continent',
      continent: 'Afrika',
      depth: 2,
      getData: () => getContinentWithCountriesData('Afrika'),
      title: 'Kawasan Afrika: Total Ekspor USD 75,4 Juta',
      note: 'Pangsa Pasar: USD 75,4 Juta (0,15%)'
    }
  ];

  function startStep1AutoCycle() {
    stopAutoCycle();
    cycleIndex = 0;

    const initialFrame = ROTATION_FRAMES[0];
    renderData(initialFrame.getData(), initialFrame.depth, initialFrame.title);
    updateFooterNote(initialFrame.note);

    autoCycleTimer = setInterval(() => {
      cycleIndex = (cycleIndex + 1) % ROTATION_FRAMES.length;
      const frame = ROTATION_FRAMES[cycleIndex];
      renderData(frame.getData(), frame.depth, frame.title);
      updateFooterNote(frame.note);
    }, 1800);
  }

  function updateFooterNote(text) {
    const stageCard = document.getElementById('stage-bab4');
    if (!stageCard) return;
    const noteEl = stageCard.querySelector('.stage-footer-guide') || stageCard.querySelector('.handwritten-footer-note');
    if (noteEl && text) {
      noteEl.textContent = text;
    }
  }

  function filterContinent(continentKey) {
    stopAutoCycle();
    currentContinent = continentKey;

    document.querySelectorAll('.chip-continent, .chip-sunburst-continent').forEach(function (el) {
      if (el.getAttribute('data-continent') === continentKey) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    if (continentKey === 'all') {
      const data = getFullSynthesisTreeData();
      renderData(data, 3, 'Distribusi Lengkap Ekspor: Seluruh Benua & 84 Negara Mitra');
      updateFooterNote('Struktur: Seluruh Benua & 84 Negara Mitra');
    } else {
      const data = getContinentWithCountriesData(continentKey);
      let title = 'Rincian Pasar: ' + continentKey;
      if (continentKey === 'Asia') title = 'Benua Asia: Menyerap 96,80% Ekspor Tambang (USD 48,10 Miliar)';
      if (continentKey === 'Eropa') title = 'Benua Eropa: Pangsa Ekspor USD 680 Juta (1,37%)';
      if (continentKey === 'Australia/Oseania' || continentKey === 'Oseania') title = 'Benua Oseania: Pangsa Ekspor USD 610 Juta (1,23%)';
      if (continentKey === 'Amerika') title = 'Benua Amerika: Total USD 223,7 Juta (Brasil, Meksiko, dll.)';
      if (continentKey === 'Afrika') title = 'Benua Afrika: Total USD 75,4 Juta (Afrika Selatan, Maroko, dll.)';
      
      renderData(data, 2, title);
      updateFooterNote('Pangsa Pasar: Kawasan ' + continentKey + ' & Negara Mitra');
    }
  }

  function setStoryStep(stepId) {
    currentStoryStep = stepId;

    switch (stepId) {
      case 'step-sunburst-global':
        setActiveChip('all');
        startStep1AutoCycle();
        break;

      case 'step-sunburst-asia':
        stopAutoCycle();
        setActiveChip('Asia');
        const dataAsia = getContinentWithCountriesData('Asia');
        renderData(dataAsia, 2, 'Kawasan Asia: Poros Utama Penyerapan 96,8% Ekspor Mineral');
        updateFooterNote('Kawasan Asia: Pangsa USD 48,10 Miliar (96,8%)');
        break;

      case 'step-sunburst-pillars':
      case 'step-sunburst-china':
      case 'step-sunburst-india-japan':
        stopAutoCycle();
        setActiveChip('Asia');
        const dataPillars = getPillarsData();
        renderData(dataPillars, 3, 'Tiga Pilar Utama: Tiongkok, India, Jepang & Lainnya');
        updateFooterNote('4 irisan: tiongkok (31,8%), india (11,6%), jepang (11,5%), lainnya (43,2%) ~');
        break;

      case 'step-sunburst-nonasia':
      case 'step-sunburst-others':
        stopAutoCycle();
        setActiveChip(null);
        const dataNonAsia = getNonAsiaContinentsOnlyData();
        renderData(dataNonAsia, 2, 'Pasar Non-Asia: Eropa, Oseania, & Benua Lain (Hierarki Benua Saja, 3,2%)');
        updateFooterNote('hierarki benua non-asia: eropa, oseania, amerika, afrika ~');
        break;

      case 'step-sunburst-sintesis':
        stopAutoCycle();
        setActiveChip('all');
        const dataFull = getFullSynthesisTreeData();
        renderData(dataFull, 4, 'Sintesis Pasar Global: Peta Lengkap Benua & Seluruh Negara Mitra');
        updateFooterNote('lingkaran penuh: seluruh benua & 84 negara mitra ~');
        break;

      default:
        stopAutoCycle();
        setActiveChip('all');
        const dataDefault = getFullSynthesisTreeData();
        renderData(dataDefault, 3, 'Sintesis Pasar Global: Pintu Masuk Devisa Ekspor Mineral');
        updateFooterNote('diagram bergerak dinamis mengikuti narasi ~');
        break;
    }
  }

  function setActiveChip(key) {
    document.querySelectorAll('.chip-continent, .chip-sunburst-continent').forEach(function (el) {
      if (key && el.getAttribute('data-continent') === key) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });
  }

  function resize() {
    if (chartInstance) chartInstance.resize();
  }

  function resetView() {
    filterContinent('all');
  }

  window.ChartSunburst = {
    init: init,
    resize: resize,
    resetView: resetView,
    filterContinent: filterContinent,
    setStoryStep: setStoryStep
  };
})();
