/**
 * main.js - Pengontrol Utama Jurnalistik Data Visual
 * Mengorkestrasi navigasi bab, navbar docking, scrollytelling Bab 01, dan visualisasi
 */

(function () {
  'use strict';

  // Inisialisasi seluruh modul visualisasi
  async function initAllVisualizations() {
    console.log('[VisDat] Menginisialisasi visualisasi data...');

    // Bab 1 - Treemap PDB
    if (window.ChartTreemap && typeof window.ChartTreemap.init === 'function') {
      try {
        await window.ChartTreemap.init('chart-treemap');
        console.log('[VisDat] Treemap siap.');
      } catch (e) {
        console.error('[VisDat] Error Treemap:', e);
      }
    }

    // Bab 2 - Leaflet Choropleth PDRB
    if (window.MapIndonesia && typeof window.MapIndonesia.init === 'function') {
      try {
        await window.MapIndonesia.init('map-indonesia');
        console.log('[VisDat] Map Indonesia siap.');
      } catch (e) {
        console.error('[VisDat] Error Map Indonesia:', e);
      }
    }

    // Bab 3 - Leaflet Simbol Proporsional Pelabuhan
    if (window.MapPort && typeof window.MapPort.init === 'function') {
      try {
        await window.MapPort.init('map-port');
        console.log('[VisDat] Map Pelabuhan siap.');
      } catch (e) {
        console.error('[VisDat] Error Map Pelabuhan:', e);
      }
    }

    // Bab 4 - Sunburst Pasar Global
    if (window.ChartSunburst && typeof window.ChartSunburst.init === 'function') {
      try {
        await window.ChartSunburst.init('chart-sunburst');
        console.log('[VisDat] Sunburst siap.');
      } catch (e) {
        console.error('[VisDat] Error Sunburst:', e);
      }
    }

    // Bab 5 - Sankey Rantai Pasok
    if (window.ChartSankey && typeof window.ChartSankey.init === 'function') {
      try {
        await window.ChartSankey.init('chart-sankey');
        console.log('[VisDat] Sankey siap.');
      } catch (e) {
        console.error('[VisDat] Error Sankey:', e);
      }
    }

    // Bab 6 - Global Flow Map
    if (window.MapGlobal && typeof window.MapGlobal.init === 'function') {
      try {
        await window.MapGlobal.init('map-global');
        console.log('[VisDat] Map Global siap.');
      } catch (e) {
        console.error('[VisDat] Error Map Global:', e);
      }
    }

    triggerAllResize();
  }

  function triggerAllResize() {
    const charts = [
      window.ChartTreemap,
      window.MapIndonesia,
      window.MapPort,
      window.ChartSunburst,
      window.ChartSankey,
      window.MapGlobal
    ];

    charts.forEach(function (c) {
      if (c && typeof c.resize === 'function') {
        c.resize();
      }
    });
  }

  // Navbar Docking (Starts at bottom in Hero, transitions to top on scroll)
  
  // Editorial Smart Navbar (index_2.html: Hidden initially, reveals on scroll UP)
  function initEditorialNavbar() {
    const edNav = document.querySelector('.ed-navbar-wrapper');
    if (!edNav) return;

    let lastScrollY = window.scrollY || document.documentElement.scrollTop;
    let ticking = false;

    function handleScroll() {
      const currentScrollY = window.scrollY || document.documentElement.scrollTop;

      // When at the top / hero area (<= 120px), hide navbar
      if (currentScrollY <= 120) {
        edNav.classList.remove('is-visible');
      } else if (currentScrollY < lastScrollY - 6) {
        // User scrolling UP by > 6px -> show navbar
        edNav.classList.add('is-visible');
      } else if (currentScrollY > lastScrollY + 6) {
        // User scrolling DOWN by > 6px -> hide navbar
        edNav.classList.remove('is-visible');
      }

      lastScrollY = currentScrollY;
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(handleScroll);
        ticking = true;
      }
    }, { passive: true });
  }

  function initNavbarDocking() {
    const navWrapper = document.querySelector('.nav-wrapper');
    if (!navWrapper) return;

    function checkPosition() {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      // Jika scrollY masih kecil (berada di hero), navbar di bawah
      // Jika sudah scroll melewati hero (> 80px), navbar naik ke atas
      if (scrollY > 80) {
        if (!navWrapper.classList.contains('at-top')) {
          navWrapper.classList.remove('at-bottom');
          navWrapper.classList.add('at-top');
        }
      } else {
        if (!navWrapper.classList.contains('at-bottom')) {
          navWrapper.classList.remove('at-top');
          navWrapper.classList.add('at-bottom');
        }
      }
    }

    checkPosition();
    window.addEventListener('scroll', checkPosition, { passive: true });
  }

  // Scrollytelling Bab 01 (Treemap Dynamic State)
  function initScrollytellingBab1() {
    const steps = document.querySelectorAll('#bab1 .story-step[data-step]');
    if (!steps.length) return;

    function applyStep(stepId) {
      steps.forEach(function (s) {
        if (s.getAttribute('data-step') === stepId) {
          s.classList.add('is-active');
        } else {
          s.classList.remove('is-active');
        }
      });

      if (window.ChartTreemap && typeof window.ChartTreemap.setStoryStep === 'function') {
        window.ChartTreemap.setStoryStep(stepId);
      }
    }

    // Step pertama aktif saat awal
    applyStep('step-pdb-overview');

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            const stepId = entry.target.getAttribute('data-step');
            applyStep(stepId);
          }
        });
      }, {
        rootMargin: '-20% 0px -35% 0px',
        threshold: 0.15
      });

      steps.forEach(function (step) {
        observer.observe(step);
      });
    }

    // Scroll fallback untuk akurasi instan
    window.addEventListener('scroll', function () {
      const vhMid = window.innerHeight * 0.45;
      let closestStep = null;
      let closestDist = Infinity;

      steps.forEach(function (step) {
        const rect = step.getBoundingClientRect();
        const dist = Math.abs(rect.top + rect.height * 0.3 - vhMid);
        if (rect.bottom > 100 && rect.top < window.innerHeight - 100) {
          if (dist < closestDist) {
            closestDist = dist;
            closestStep = step;
          }
        }
      });

      if (closestStep) {
        const stepId = closestStep.getAttribute('data-step');
        if (!closestStep.classList.contains('is-active')) {
          applyStep(stepId);
        }
      }
    }, { passive: true });
  }


  // Scrollytelling Bab 02 (Map Indonesia Dynamic Camera & Island Highlight)
  function initScrollytellingBab2() {
    const steps = document.querySelectorAll('#bab2 .story-step[data-step]');
    if (!steps.length) return;

    function applyMapStep(stepId) {
      steps.forEach(function (s) {
        if (s.getAttribute('data-step') === stepId) {
          s.classList.add('is-active');
        } else {
          s.classList.remove('is-active');
        }
      });

      if (window.MapIndonesia && typeof window.MapIndonesia.setStoryStep === 'function') {
        window.MapIndonesia.setStoryStep(stepId);
      }
    }

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            const stepId = entry.target.getAttribute('data-step');
            applyMapStep(stepId);
          }
        });
      }, {
        rootMargin: '-20% 0px -35% 0px',
        threshold: 0.15
      });

      steps.forEach(function (step) {
        observer.observe(step);
      });
    }

    window.addEventListener('scroll', function () {
      const vhMid = window.innerHeight * 0.45;
      let closestStep = null;
      let closestDist = Infinity;

      steps.forEach(function (step) {
        const rect = step.getBoundingClientRect();
        const dist = Math.abs(rect.top + rect.height * 0.3 - vhMid);
        if (rect.bottom > 100 && rect.top < window.innerHeight - 100) {
          if (dist < closestDist) {
            closestDist = dist;
            closestStep = step;
          }
        }
      });

      if (closestStep) {
        const stepId = closestStep.getAttribute('data-step');
        if (!closestStep.classList.contains('is-active')) {
          applyMapStep(stepId);
        }
      }
    }, { passive: true });
  }


  // Scrollytelling Bab 03 (74 Pelabuhan Ekspor & Combined Choropleth)
  function initScrollytellingBab3() {
    const steps = document.querySelectorAll('#bab3 .story-step[data-step]');
    if (!steps.length) return;

    function applyPortStep(stepId) {
      steps.forEach(function (s) {
        if (s.getAttribute('data-step') === stepId) {
          s.classList.add('is-active');
        } else {
          s.classList.remove('is-active');
        }
      });

      if (window.MapPort) {
        if (typeof window.MapPort.resize === 'function') {
          window.MapPort.resize();
        }
        if (typeof window.MapPort.setStoryStep === 'function') {
          window.MapPort.setStoryStep(stepId);
        }
      }
    }

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            const stepId = entry.target.getAttribute('data-step');
            applyPortStep(stepId);
          }
        });
      }, {
        rootMargin: '-20% 0px -35% 0px',
        threshold: 0.15
      });

      steps.forEach(function (step) {
        observer.observe(step);
      });
    }

    window.addEventListener('scroll', function () {
      const vhMid = window.innerHeight * 0.45;
      let closestStep = null;
      let closestDist = Infinity;

      steps.forEach(function (step) {
        const rect = step.getBoundingClientRect();
        const dist = Math.abs(rect.top + rect.height * 0.3 - vhMid);
        if (rect.bottom > 100 && rect.top < window.innerHeight - 100) {
          if (dist < closestDist) {
            closestDist = dist;
            closestStep = step;
          }
        }
      });

      if (closestStep) {
        const stepId = closestStep.getAttribute('data-step');
        if (!closestStep.classList.contains('is-active')) {
          applyPortStep(stepId);
        }
      }
    }, { passive: true });
  }


  // Scrollytelling Bab 04 (Sunburst Pasar Global Drill-down)
  function initScrollytellingBab4() {
    const steps = document.querySelectorAll('#bab4 .story-step[data-step]');
    if (!steps.length) return;

    function applySunburstStep(stepId) {
      steps.forEach(function (s) {
        if (s.getAttribute('data-step') === stepId) {
          s.classList.add('is-active');
        } else {
          s.classList.remove('is-active');
        }
      });

      if (window.ChartSunburst && typeof window.ChartSunburst.setStoryStep === 'function') {
        window.ChartSunburst.setStoryStep(stepId);
      }
    }

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            const stepId = entry.target.getAttribute('data-step');
            applySunburstStep(stepId);
          }
        });
      }, {
        rootMargin: '-20% 0px -35% 0px',
        threshold: 0.15
      });

      steps.forEach(function (step) {
        observer.observe(step);
      });
    }

    window.addEventListener('scroll', function () {
      const vhMid = window.innerHeight * 0.45;
      let closestStep = null;
      let closestDist = Infinity;

      steps.forEach(function (step) {
        const rect = step.getBoundingClientRect();
        const dist = Math.abs(rect.top + rect.height * 0.3 - vhMid);
        if (rect.bottom > 100 && rect.top < window.innerHeight - 100) {
          if (dist < closestDist) {
            closestDist = dist;
            closestStep = step;
          }
        }
      });

      if (closestStep) {
        const stepId = closestStep.getAttribute('data-step');
        if (!closestStep.classList.contains('is-active')) {
          applySunburstStep(stepId);
        }
      }
    }, { passive: true });
  }

  // Scrollytelling Bab 05 (Sankey Rantai Pasok Hulu-Hilir)
  function initScrollytellingBab5() {
    const steps = document.querySelectorAll('#bab5 .story-step[data-step]');
    if (!steps.length) return;

    function applySankeyStep(stepId) {
      steps.forEach(function (s) {
        if (s.getAttribute('data-step') === stepId) {
          s.classList.add('is-active');
        } else {
          s.classList.remove('is-active');
        }
      });

      if (window.ChartSankey && typeof window.ChartSankey.setStoryStep === 'function') {
        window.ChartSankey.setStoryStep(stepId);
      }
    }

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            const stepId = entry.target.getAttribute('data-step');
            applySankeyStep(stepId);
          }
        });
      }, {
        rootMargin: '-20% 0px -35% 0px',
        threshold: 0.15
      });

      steps.forEach(function (step) {
        observer.observe(step);
      });
    }

    window.addEventListener('scroll', function () {
      const vhMid = window.innerHeight * 0.45;
      let closestStep = null;
      let closestDist = Infinity;

      steps.forEach(function (step) {
        const rect = step.getBoundingClientRect();
        const dist = Math.abs(rect.top + rect.height * 0.3 - vhMid);
        if (rect.bottom > 100 && rect.top < window.innerHeight - 100) {
          if (dist < closestDist) {
            closestDist = dist;
            closestStep = step;
          }
        }
      });

      if (closestStep) {
        const stepId = closestStep.getAttribute('data-step');
        if (!closestStep.classList.contains('is-active')) {
          applySankeyStep(stepId);
        }
      }
    }, { passive: true });
  }

  // Scrollytelling Bab 06 (Geo Flow Map Pelayaran Maritim Global)
  function initScrollytellingBab6() {
    const steps = document.querySelectorAll('#bab6 .story-step[data-step]');
    if (!steps.length) return;

    function applyGlobalStep(stepId) {
      steps.forEach(function (s) {
        if (s.getAttribute('data-step') === stepId) {
          s.classList.add('is-active');
        } else {
          s.classList.remove('is-active');
        }
      });

      if (window.MapGlobal && typeof window.MapGlobal.setStoryStep === 'function') {
        window.MapGlobal.setStoryStep(stepId);
      }
    }

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            const stepId = entry.target.getAttribute('data-step');
            applyGlobalStep(stepId);
          }
        });
      }, {
        rootMargin: '-20% 0px -35% 0px',
        threshold: 0.15
      });

      steps.forEach(function (step) {
        observer.observe(step);
      });
    }

    window.addEventListener('scroll', function () {
      const vhMid = window.innerHeight * 0.45;
      let closestStep = null;
      let closestDist = Infinity;

      steps.forEach(function (step) {
        const rect = step.getBoundingClientRect();
        const dist = Math.abs(rect.top + rect.height * 0.3 - vhMid);
        if (rect.bottom > 100 && rect.top < window.innerHeight - 100) {
          if (dist < closestDist) {
            closestDist = dist;
            closestStep = step;
          }
        }
      });

      if (closestStep) {
        const stepId = closestStep.getAttribute('data-step');
        if (!closestStep.classList.contains('is-active')) {
          applyGlobalStep(stepId);
        }
      }
    }, { passive: true });
  }

  // Observer Navigasi Bab (01, 02, 03, dll)
  function initChapterNavigation() {
    const chapters = document.querySelectorAll('section[data-chapter]');
    const navPills = document.querySelectorAll('.nav-pill[data-chapter], .ed-nav-links a[data-chapter]');
    const heroSection = document.getElementById('hero');

    if (!chapters.length || !navPills.length) return;

    function updateActiveChapter() {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      
      // Jika masih di hero, jangan aktifkan pill bab apapun
      if (heroSection) {
        const heroRect = heroSection.getBoundingClientRect();
        if (heroRect.bottom > 200 && scrollY < 250) {
          navPills.forEach(function (pill) { pill.classList.remove('active'); });
          return;
        }
      }

      let currentChapterNum = null;
      chapters.forEach(function (sec) {
        const rect = sec.getBoundingClientRect();
        // Bila section mencakup area tengah viewport
        if (rect.top <= window.innerHeight * 0.45 && rect.bottom >= window.innerHeight * 0.25) {
          currentChapterNum = sec.getAttribute('data-chapter');
        }
      });

      if (currentChapterNum) {
        navPills.forEach(function (pill) {
          if (pill.getAttribute('data-chapter') === currentChapterNum) {
            pill.classList.add('active');
          } else {
            pill.classList.remove('active');
          }
        });
      }
    }

    updateActiveChapter();
    window.addEventListener('scroll', updateActiveChapter, { passive: true });
  }

  // Reading Progress Bar
  function initProgressBar() {
    const fill = document.getElementById('progress-fill');
    if (!fill) return;

    window.addEventListener('scroll', function () {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        const pct = Math.min(100, Math.max(0, (scrollTop / docHeight) * 100));
        fill.style.width = pct + '%';
      }
    }, { passive: true });
  }

  // Resize handler
  function initResizeListener() {
    let timer = null;
    window.addEventListener('resize', function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        triggerAllResize();
      }, 150);
    }, { passive: true });
  }

  // Global button filter handlers
  window.filterTreemap = function (sector) {
    document.querySelectorAll('.chip-treemap').forEach(function (el) {
      el.classList.remove('active');
    });
    const btn = document.querySelector('.chip-treemap[data-sector="' + sector + '"]');
    if (btn) btn.classList.add('active');
    if (window.ChartTreemap && window.ChartTreemap.filterSector) {
      window.ChartTreemap.filterSector(sector);
    }
  };

    window.toggleChoroplethUnderlay = function () {
    if (window.MapPort && typeof window.MapPort.toggleChoroplethUnderlay === 'function') {
      window.MapPort.toggleChoroplethUnderlay();
    }
  };

  window.filterPortCommodity = function (code) {
    document.querySelectorAll('.chip-port-filter, .chip-port').forEach(function (el) {
      el.classList.remove('active');
    });
    const btn = document.querySelector('.chip-port-filter[data-filter="' + code + '"], .chip-port[data-code="' + code + '"]');
    if (btn) btn.classList.add('active');
    if (window.MapPort && window.MapPort.filterCommodity) {
      window.MapPort.filterCommodity(code);
    }
  };

  window.filterCommodity = function (hsKey) {
    document.querySelectorAll('.chip-commodity').forEach(function (el) {
      el.classList.remove('active');
    });
    const btn = document.querySelector('.chip-commodity[data-hs="' + hsKey + '"]');
    if (btn) btn.classList.add('active');
    if (window.MapGlobal && window.MapGlobal.filterCommodity) {
      window.MapGlobal.filterCommodity(hsKey);
    }
  };

  window.filterGlobalRoute = function (region) {
    document.querySelectorAll('.chip-global').forEach(function (el) {
      el.classList.remove('active');
    });
    const btn = document.querySelector('.chip-global[data-region="' + region + '"]');
    if (btn) btn.classList.add('active');
    if (window.MapGlobal && window.MapGlobal.filterRoute) {
      window.MapGlobal.filterRoute(region);
    }
  };


  window.filterIsland = function (island) {
    if (window.MapIndonesia && window.MapIndonesia.filterIsland) {
      window.MapIndonesia.filterIsland(island);
    }
  };

  window.selectDistrictFocus = function (key) {
    if (window.MapIndonesia && window.MapIndonesia.selectDistrictFocus) {
      window.MapIndonesia.selectDistrictFocus(key);
    }
  };

  window.resetMapIndonesiaView = function () {
    if (window.MapIndonesia && window.MapIndonesia.resetView) {
      window.MapIndonesia.resetView();
    }
  };


  window.filterContinent = function (continentKey) {
    document.querySelectorAll('.chip-continent').forEach(function (el) {
      el.classList.remove('active');
    });
    document.querySelectorAll('.chip-continent[data-continent="' + continentKey + '"]').forEach(function (btn) {
      btn.classList.add('active');
    });
    if (window.MapGlobal && window.MapGlobal.filterContinent) {
      window.MapGlobal.filterContinent(continentKey);
    }
    if (window.ChartSunburst && window.ChartSunburst.filterContinent) {
      window.ChartSunburst.filterContinent(continentKey);
    }
  };

  window.filterSunburstContinent = function (continentKey) {
    document.querySelectorAll('#stage-bab4 .chip-sunburst-continent').forEach(function (el) {
      el.classList.remove('active');
    });
    const btn = document.querySelector('#stage-bab4 .chip-sunburst-continent[data-continent="' + continentKey + '"]');
    if (btn) btn.classList.add('active');
    if (window.ChartSunburst && window.ChartSunburst.filterContinent) {
      window.ChartSunburst.filterContinent(continentKey);
    }
  };

  window.filterPort = function (portName) {
    document.querySelectorAll('#port-filter-select, #db-port-filter-select').forEach(function (sel) {
      sel.value = portName;
    });
    if (window.MapGlobal && window.MapGlobal.filterPort) {
      window.MapGlobal.filterPort(portName);
    }
  };

  window.filterSankey = function (flowKey) {
    if (window.ChartSankey && typeof window.ChartSankey.filterSankey === 'function') {
      window.ChartSankey.filterSankey(flowKey);
    }
  };

  window.resetSunburstView = function () {
    if (window.ChartSunburst && window.ChartSunburst.resetView) {
      window.ChartSunburst.resetView();
    }
  };

  window.resetMapPortView = function () {
    if (window.MapPort && window.MapPort.resetView) {
      window.MapPort.resetView();
    }
  };


  // Auto-dismiss helper toast Bab 01
  window.dismissHintToast = function () {
    const toast = document.getElementById('treemap-hint-toast');
    if (toast) {
      toast.classList.add('fade-out');
      setTimeout(function () {
        toast.style.display = 'none';
      }, 500);
    }
  };

  // Lifecycle Boot
  document.addEventListener('DOMContentLoaded', function () {
    initNavbarDocking();
    initEditorialNavbar();
    initProgressBar();
    initChapterNavigation();
    initScrollytellingBab1();
    initScrollytellingBab2();
    initScrollytellingBab3();
    initScrollytellingBab4();
    initScrollytellingBab5();
    initScrollytellingBab6();
    setTimeout(window.dismissHintToast, 5000);
    initResizeListener();

    // Jalankan inisialisasi modul
    initAllVisualizations();

    // Re-trigger resize untuk stabilitas layout
    setTimeout(triggerAllResize, 400);
    setTimeout(triggerAllResize, 1000);
  });

})();
