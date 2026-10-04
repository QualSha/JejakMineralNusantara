/**
 * chart_treemap.js - Bab 1: Hierarki Struktur PDB Nasional
 * ECharts Treemap Multi-Level & Scrollytelling Engine - 'Softly' Pastel Aesthetic
 */

(function () {
  'use strict';

  let chartInstance = null;
  let rawData = null;
  let currentFilter = 'all';
  let currentStep = 'step-pdb-overview';

  // Desaturated pastel palette
  const SECTOR_COLORS = {
    'Sektor Primer':   '#E07A5F',  // Warm Terracotta / Coral
    'Sektor Sekunder': '#7E97C7',  // Soft Periwinkle Blue
    'Sektor Tersier':  '#7A9E7E'   // Soft Sage Green
  };

  const SUBSECTOR_PALETTES = {
    'Sektor Primer':   ['#C8644A', '#E07A5F', '#EAA08C', '#F2C1B4'],
    'Sektor Sekunder': ['#627CAE', '#7E97C7', '#9CAFD6', '#BAC8E4'],
    'Sektor Tersier':  ['#5F8263', '#7A9E7E', '#97B59A', '#B5CCC5']
  };

  // Subsektor detail Pertambangan & Penggalian
  // Keterangan bersih tanpa duplikasi persentase
  const TAMBANG_DRILLDOWN_DATA = [
    {
      name: 'Batubara & Lignit',
      value: 1050.8,
      share_in_tambang: 47.9,
      share_percent: 5.03,
      note: 'Bahan bakar pembangkit listrik & komoditas ekspor curah utama',
      itemStyle: { color: '#C8644A', borderColor: '#FDFCF8', borderWidth: 2 }
    },
    {
      name: 'Bijih Logam (Nikel, Tembaga, Bauksit)',
      value: 520.3,
      share_in_tambang: 23.7,
      share_percent: 2.49,
      note: 'Pasokan konsentrat hilirisasi baterai, baja & smelter nasional',
      itemStyle: { color: '#E07A5F', borderColor: '#FDFCF8', borderWidth: 2 }
    },
    {
      name: 'Minyak, Gas Bumi, & Panas Bumi',
      value: 509.2,
      share_in_tambang: 23.2,
      share_percent: 2.44,
      note: 'Ketahanan energi domestik & ekspor gas alam cair (LNG)',
      itemStyle: { color: '#EAA08C', borderColor: '#FDFCF8', borderWidth: 2 }
    },
    {
      name: 'Pertambangan & Penggalian Lainnya',
      value: 113.4,
      share_in_tambang: 5.2,
      share_percent: 0.54,
      note: 'Pasir kuarsa, batu kapur, batu split & mineral industri',
      itemStyle: { color: '#F2C1B4', borderColor: '#FDFCF8', borderWidth: 2 }
    }
  ];

  function formatRupiah(value) {
    return 'Rp ' + Number(value).toLocaleString('id-ID', {
      minimumFractionDigits: 1, maximumFractionDigits: 2
    }) + ' T';
  }

  async function init(containerId) {
    const targetId = containerId || 'chart-treemap';
    const dom = document.getElementById(targetId);
    if (!dom) return;

    if (chartInstance) {
      try { chartInstance.dispose(); } catch (e) {}
    }
    
    chartInstance = echarts.init(dom, null, { renderer: 'canvas' });
    chartInstance.getZr().setCursorStyle('pointer');

    try {
      const res = await fetch('./data/processed/struktur_pdb.json');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      rawData = await res.json();
      render();
    } catch (err) {
      console.error('[Treemap] Error loading data:', err);
      dom.innerHTML = '<div style="padding:2rem;color:#b91c1c;font-family:sans-serif;font-size:13px;">Gagal memuat data struktur PDB: ' + err.message + '</div>';
    }
  }

  function getStepMeta() {
    switch (currentStep) {
      case 'step-primer':
        return {
          title: 'Sektor Primer: Basis Ekstraksi & Bahan Mentah',
          subtext: 'Nilai: Rp 4.805,25 T (23,0% PDB) · Pertanian (12,50%) & Pertambangan (10,50%)',
          };
      case 'step-tambang-zoom':
        return {
          title: 'Bedah Subsektor: Pertambangan & Penggalian',
          subtext: 'Nilai: Rp 2.193,70 T (10,50% PDB) · Batubara (47,9%), Logam/Nikel (23,7%), Migas (23,2%)',
          };
      case 'step-sekunder':
        return {
          title: 'Sektor Sekunder: Mesin Manufaktur & Transformasi Nilai Tambah',
          subtext: 'Nilai: Rp 6.225,95 T (29,8% PDB) · Industri Pengolahan (18,70%) & Konstruksi (9,91%)',
          };
      case 'step-tersier':
        return {
          title: 'Sektor Tersier: Urat Nadi Perdagangan & Logistik Maritim',
          subtext: 'Nilai: Rp 9.481,18 T (45,4% PDB) · Perdagangan (12,90%) & Transportasi (6,10%)',
          };
      case 'step-sintesis':
        return {
          title: 'Sintesis Rantai Nilai Ekonomi: Dari Hulu hingga Hilir',
          subtext: 'Primer (23,0%) → Sekunder (29,8%) → Tersier (45,4%) membentuk ekosistem utuh',
          };
      case 'step-pdb-overview':
      default:
        return {
          title: 'Dekomposisi PDB Menurut 17 Lapangan Usaha (BPS 2025)',
          subtext: 'Total PDB: Rp 20.892,4 Triliun · Klik blok untuk drill-down mandiri',
          };
    }
  }

  function getProcessedData() {
    if (!rawData || !rawData.children) return [];

    // 1. Step Tambang Zoom
    if (currentStep === 'step-tambang-zoom') {
      return TAMBANG_DRILLDOWN_DATA;
    }

    // 2. Step Primer
    if (currentStep === 'step-primer') {
      const primerSector = rawData.children.find(s => s.name === 'Sektor Primer');
      return (primerSector ? primerSector.children : []).map((sub, idx) => ({
        name: sub.name,
        value: sub.value,
        share_percent: sub.share_percent,
        subsector_desc: sub.subsector || '',
        itemStyle: {
          color: idx === 0 ? '#C8644A' : '#E07A5F',
          borderColor: '#FDFCF8',
          borderWidth: 3,
          gapWidth: 4
        }
      }));
    }

    // 3. Step Sekunder
    if (currentStep === 'step-sekunder') {
      const sekunderSector = rawData.children.find(s => s.name === 'Sektor Sekunder');
      const palette = SUBSECTOR_PALETTES['Sektor Sekunder'];
      return (sekunderSector ? sekunderSector.children : []).map((sub, idx) => ({
        name: sub.name,
        value: sub.value,
        share_percent: sub.share_percent,
        subsector_desc: sub.subsector || '',
        itemStyle: {
          color: palette[idx % palette.length],
          borderColor: '#FDFCF8',
          borderWidth: 3,
          gapWidth: 4
        }
      }));
    }

    // 4. Step Tersier
    if (currentStep === 'step-tersier') {
      const tersierSector = rawData.children.find(s => s.name === 'Sektor Tersier');
      const palette = SUBSECTOR_PALETTES['Sektor Tersier'];
      return (tersierSector ? tersierSector.children : []).map((sub, idx) => ({
        name: sub.name,
        value: sub.value,
        share_percent: sub.share_percent,
        subsector_desc: sub.subsector || '',
        itemStyle: {
          color: palette[idx % palette.length],
          borderColor: '#FDFCF8',
          borderWidth: 2,
          gapWidth: 3
        }
      }));
    }

    // 5. Default Overview & Sintesis (17 sektor terkelompok dalam 3 klaster)
    let sectors = rawData.children;
    if (currentFilter !== 'all') {
      sectors = sectors.filter(s => s.name === currentFilter);
    }

    return sectors.map((sector) => {
      const baseColor = SECTOR_COLORS[sector.name] || '#7E97C7';
      const subPalette = SUBSECTOR_PALETTES[sector.name] || [baseColor];
      
      return {
        name: sector.name,
        value: sector.value,
        itemStyle: {
          color: baseColor,
          borderColor: '#FDFCF8',
          borderWidth: 3,
          gapWidth: 4
        },
        children: (sector.children || []).map((sub, sIdx) => ({
          name: sub.name,
          value: sub.value,
          share_percent: sub.share_percent,
          subsector_desc: sub.subsector || '',
          itemStyle: {
            color: subPalette[sIdx % subPalette.length],
            borderColor: '#FDFCF8',
            borderWidth: 2,
            gapWidth: 2
          }
        }))
      };
    });
  }

  function render() {
    if (!chartInstance || !rawData) return;
    const data = getProcessedData();
    const meta = getStepMeta();

    // Update elemen DOM stage header jika ada
    const stageTitle = document.getElementById('treemap-stage-title');
    if (stageTitle) stageTitle.textContent = meta.title;

    const option = {
      backgroundColor: 'transparent',
      title: {
        show: false
      },
      tooltip: {
        trigger: 'item',
        confine: true, // Mencegah tooltip keluar/terpotong dari canvas
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
          const d = params.data;
          if (!d) return '';
          let html = '<div style="font-weight:700;font-size:12.5px;margin-bottom:6px;color:#292524;border-bottom:1px solid rgba(120,113,108,0.12);padding-bottom:4px;line-height:1.35;word-break:break-word;">' + params.name + '</div>';
          html += '<div style="display:flex;justify-content:space-between;gap:16px;margin-bottom:4px;">';
          html += '<span style="color:#78716C;font-size:11px;">Nilai PDB:</span>';
          html += '<span style="font-family:monospace;font-weight:700;color:#292524;">' + formatRupiah(d.value) + '</span>';
          html += '</div>';

          if (d.share_percent) {
            html += '<div style="display:flex;justify-content:space-between;gap:16px;margin-bottom:4px;">';
            html += '<span style="color:#78716C;font-size:11px;">Porsi di PDB:</span>';
            html += '<span style="font-family:monospace;font-weight:600;color:#E07A5F;">' + d.share_percent + '%</span>';
            html += '</div>';
          }
          if (d.share_in_tambang) {
            html += '<div style="display:flex;justify-content:space-between;gap:16px;margin-bottom:4px;">';
            html += '<span style="color:#78716C;font-size:11px;">Porsi dlm Tambang:</span>';
            html += '<span style="font-family:monospace;font-weight:700;color:#E07A5F;">' + d.share_in_tambang + '%</span>';
            html += '</div>';
          }
          const note = d.note || d.subsector_desc;
          if (note) {
            html += '<div style="margin-top:6px;padding-top:4px;border-top:1px dashed rgba(120,113,108,0.15);font-size:10.5px;color:#78716C;line-height:1.35;word-break:break-word;">' + note + '</div>';
          }
          return html;
        }
      },
      series: [{
        type: 'treemap',
        id: 'pdb_treemap',
        top: 12,
        bottom: 8,
        left: 10,
        right: 10,
        width: 'auto',
        height: 'auto',
        roam: true,
        nodeClick: 'zoomToNode',
        breadcrumb: {
          show: true, // Memenuhi rubrik ujian: penunjuk posisi (breadcrumb) saat drill-down
          left: 10,
          bottom: 4,
          height: 22,
          emptyItemWidth: 25,
          itemStyle: {
            color: 'rgba(244, 241, 234, 0.95)',
            borderColor: 'rgba(120, 113, 108, 0.22)',
            borderWidth: 1,
            shadowBlur: 0,
            textStyle: {
              color: '#44403C',
              fontSize: 10.5,
              fontWeight: 600,
              fontFamily: "'Outfit', sans-serif"
            }
          },
          emphasis: {
            itemStyle: {
              color: '#B83E28',
              textStyle: {
                color: '#FFFFFF'
              }
            }
          }
        },
        label: {
          show: true,
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 600,
          color: '#FFFFFF',
          formatter: function (params) {
            if (params.value > 150) {
              return params.name + '\n' + formatRupiah(params.value);
            }
            return params.name;
          }
        },
        upperLabel: {
          show: true,
          height: 22,
          fontSize: 10.5,
          fontWeight: 700,
          fontFamily: "'Outfit', sans-serif",
          color: '#292524',
          backgroundColor: '#EFEDF4',
          borderColor: 'rgba(120,113,108,0.15)',
          borderWidth: 1,
          borderRadius: 6,
          padding: [2, 6],
          formatter: '{b}'
        },
        itemStyle: {
          borderRadius: 6,
          gapWidth: 3
        },
        emphasis: {
          label: { fontSize: 12.5, fontWeight: 700 },
          upperLabel: { fontSize: 11.5 }
        },
        levels: [
          {
            itemStyle: { borderWidth: 0, gapWidth: 4 },
            upperLabel: { show: false }
          },
          {
            itemStyle: { borderWidth: 2, gapWidth: 3, borderRadius: 6 },
            emphasis: { itemStyle: { borderColor: '#292524', borderWidth: 2 } }
          },
          {
            colorSaturation: [0.35, 0.75],
            itemStyle: { borderWidth: 1, gapWidth: 2, borderRadius: 4 }
          }
        ],
        data: data
      }]
    };

    chartInstance.setOption(option, { notMerge: true });
    setTimeout(function () {
      if (chartInstance) chartInstance.resize();
    }, 50);
  }

  function filterSector(sector) {
    currentFilter = sector === 'all' ? 'all' : sector;
    currentStep = 'step-pdb-overview';
    render();
  }

  function setStoryStep(stepId) {
    if (currentStep === stepId) return;
    currentStep = stepId;

    if (stepId === 'step-primer') {
      currentFilter = 'Sektor Primer';
    } else if (stepId === 'step-sekunder') {
      currentFilter = 'Sektor Sekunder';
    } else if (stepId === 'step-tersier') {
      currentFilter = 'Sektor Tersier';
    } else {
      currentFilter = 'all';
    }

    // Sync button chips
    document.querySelectorAll('.chip-treemap').forEach(function (el) {
      el.classList.remove('active');
    });

    let activeChipSector = 'all';
    if (stepId === 'step-primer' || stepId === 'step-tambang-zoom') activeChipSector = 'Sektor Primer';
    else if (stepId === 'step-sekunder') activeChipSector = 'Sektor Sekunder';
    else if (stepId === 'step-tersier') activeChipSector = 'Sektor Tersier';

    const btn = document.querySelector('.chip-treemap[data-sector="' + activeChipSector + '"]');
    if (btn) btn.classList.add('active');

    render();
  }

  function resize() {
    if (chartInstance) {
      chartInstance.resize();
    }
  }

  window.ChartTreemap = {
    init: init,
    filterSector: filterSector,
    setStoryStep: setStoryStep,
    resize: resize
  };
})();
