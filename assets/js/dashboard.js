/**
 * dashboard.js - Controller Khusus Dashboard Interaktif
 * Menginisialisasi seluruh 6 chart di canvas dashboard dan menyediakan kontrol interaktif
 */

(function () {
  'use strict';

  async function initDashboard() {
    console.log('[Dashboard] Menginisialisasi 6 visualisasi data interaktif...');

    // Stage 1: Treemap
    if (window.ChartTreemap && typeof window.ChartTreemap.init === 'function') {
      try {
        await window.ChartTreemap.init('chart-treemap');
      } catch (e) {
        console.error('[Dashboard] Error Treemap:', e);
      }
    }

    // Stage 2: Map Indonesia 519 Daerah
    if (window.MapIndonesia && typeof window.MapIndonesia.init === 'function') {
      try {
        await window.MapIndonesia.init('map-indonesia');
      } catch (e) {
        console.error('[Dashboard] Error Map Indonesia:', e);
      }
    }

    // Stage 3: Map Port 74 Pelabuhan
    if (window.MapPort && typeof window.MapPort.init === 'function') {
      try {
        await window.MapPort.init('map-port');
      } catch (e) {
        console.error('[Dashboard] Error Map Port:', e);
      }
    }

    // Stage 4: Sunburst Pasar Global
    if (window.ChartSunburst && typeof window.ChartSunburst.init === 'function') {
      try {
        await window.ChartSunburst.init('chart-sunburst');
      } catch (e) {
        console.error('[Dashboard] Error Sunburst:', e);
      }
    }

    // Stage 5: Sankey Rantai Pasok
    if (window.ChartSankey && typeof window.ChartSankey.init === 'function') {
      try {
        await window.ChartSankey.init('chart-sankey');
      } catch (e) {
        console.error('[Dashboard] Error Sankey:', e);
      }
    }

    // Stage 6: Geo Flow Arus Maritim
    if (window.MapGlobal && typeof window.MapGlobal.init === 'function') {
      try {
        await window.MapGlobal.init('map-global');
      } catch (e) {
        console.error('[Dashboard] Error Map Global:', e);
      }
    }

    triggerAllResize();
  }

  function triggerAllResize() {
    const modules = [
      window.ChartTreemap,
      window.MapIndonesia,
      window.MapPort,
      window.ChartSunburst,
      window.ChartSankey,
      window.MapGlobal
    ];

    modules.forEach(m => {
      if (m && typeof m.resize === 'function') {
        m.resize();
      }
    });
  }

  // Quick Jump Chip Scroll
  function initJumpChips() {
    const chips = document.querySelectorAll('.dash-nav-chip[data-target]');
    chips.forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = chip.getAttribute('data-target');
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          chips.forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          const headerOffset = 90;
          const elementPosition = targetEl.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  }

  // Filter Handlers
  window.filterTreemap = function (sector) {
    document.querySelectorAll('.chip-treemap').forEach(el => el.classList.remove('active'));
    const btn = document.querySelector(`.chip-treemap[data-sector="${sector}"]`);
    if (btn) btn.classList.add('active');
    if (window.ChartTreemap && window.ChartTreemap.filterSector) {
      window.ChartTreemap.filterSector(sector);
    }
  };

  window.filterPortCommodity = function (code) {
    document.querySelectorAll('.chip-port').forEach(el => el.classList.remove('active'));
    const btn = document.querySelector(`.chip-port[data-code="${code}"]`);
    if (btn) btn.classList.add('active');
    if (window.MapPort && window.MapPort.filterCommodity) {
      window.MapPort.filterCommodity(code);
    }
  };

  window.filterGlobalRoute = function (region) {
    document.querySelectorAll('.chip-global').forEach(el => el.classList.remove('active'));
    const btn = document.querySelector(`.chip-global[data-region="${region}"]`);
    if (btn) btn.classList.add('active');
    if (window.MapGlobal && window.MapGlobal.filterRoute) {
      window.MapGlobal.filterRoute(region);
    }
  };

  window.resetMapIndonesiaView = function () {
    if (window.MapIndonesia && window.MapIndonesia.resetView) {
      window.MapIndonesia.resetView();
    }
  };

  window.resetMapPortView = function () {
    if (window.MapPort && window.MapPort.resetView) {
      window.MapPort.resetView();
    }
  };

  window.addEventListener('resize', () => {
    triggerAllResize();
  }, { passive: true });

  document.addEventListener('DOMContentLoaded', () => {
    initJumpChips();
    initDashboard();

    setTimeout(triggerAllResize, 400);
    setTimeout(triggerAllResize, 1000);
  });

})();
