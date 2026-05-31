/**
 * IMA Brownfield Website — Animation Engine
 * Based on: UI/UX Pro Max (Motion-Driven style) + 1Code best practices
 *
 * Features:
 * - Scroll-reveal (Intersection Observer API) — GPU-accelerated
 * - Scroll-progress bar
 * - Custom cursor (desktop only)
 * - Page transition fades
 * - KF-bar animated width on reveal
 * - Counter number animation
 * - Parallax hero orbs on mouse move
 * - Schedule/Gantt bar animations
 * - prefers-reduced-motion respected
 */

(function () {
  'use strict';

  /* ── Motion preference guard ── */
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ═══════════════════════════════════════════════════════════════
     1. PAGE FADE-IN ON LOAD
  ═══════════════════════════════════════════════════════════════ */
  function initPageFade() {
    let overlay = document.getElementById('page-fade-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'page-fade-overlay';
      document.body.appendChild(overlay);
    }
    // Already visible = navigating away; fade out
    overlay.classList.remove('fade-out');
  }

  function attachNavFade() {
    document.querySelectorAll('a.g-nav__link, a[href]').forEach(function (link) {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('javascript') || href.startsWith('http')) return;
      link.addEventListener('click', function (e) {
        if (prefersReduced) return;
        const overlay = document.getElementById('page-fade-overlay');
        if (!overlay) return;
        e.preventDefault();
        const target = href;
        overlay.classList.add('fade-out');
        setTimeout(function () { window.location.href = target; }, 320);
      });
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     2. SCROLL PROGRESS BAR
  ═══════════════════════════════════════════════════════════════ */
  function initScrollProgress() {
    if (prefersReduced) return;
    const bar = document.createElement('div');
    bar.id = 'scroll-progress-bar';
    document.body.appendChild(bar);

    let ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(function () {
          const scrollTop = window.scrollY || document.documentElement.scrollTop;
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;
          const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
          bar.style.width = pct.toFixed(1) + '%';
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* ═══════════════════════════════════════════════════════════════
     3. SCROLL REVEAL (Intersection Observer)
     SAFE GUARD: never touch #lv1-gantt or its children
  ═══════════════════════════════════════════════════════════════ */
  function initScrollReveal() {
    if (prefersReduced) return;

    var excludeContainers = [
      document.getElementById('lv1-gantt'),
      document.querySelector('.lv1-gantt-wrapper'),
      document.querySelector('.lv1-gantt-chart'),
    ].filter(Boolean);

    function isExcluded(el) {
      return excludeContainers.some(function(c){ return c && (c === el || c.contains(el)); });
    }

    var targets = [
      { sel: '.section',       cls: 'sr-init',          delay: false },
      { sel: '.kf-card',       cls: 'sr-init sr-scale', delay: true  },
      { sel: '.pinfo-card',    cls: 'sr-init sr-left',  delay: true  },
      { sel: '.info-card',     cls: 'sr-init',          delay: true  },
      { sel: '.summary-card',  cls: 'sr-init sr-left',  delay: false },
      { sel: '.section-label', cls: 'sr-init',          delay: false },
      { sel: '.map-outer',     cls: 'sr-init sr-scale', delay: false },
      { sel: '.flow-bar',      cls: 'sr-init',          delay: false },
      { sel: '[class*="member-card"]', cls: 'sr-init sr-scale', delay: true },
      { sel: '[class*="team-card"]',   cls: 'sr-init sr-scale', delay: true },
      { sel: '[class*="img-card"]',    cls: 'sr-init sr-scale', delay: true },
    ];

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          observer.unobserve(el);
          // Double rAF: ensures sr-init (opacity:0) is painted in frame 1,
          // then sr-visible triggers the CSS transition in frame 2.
          requestAnimationFrame(function() {
            requestAnimationFrame(function() {
              el.classList.add('sr-visible');
            });
          });
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    targets.forEach(function(t) {
      document.querySelectorAll(t.sel).forEach(function(el, i) {
        if (isExcluded(el)) return;
        if (el.classList.contains('sr-init')) return;
        t.cls.split(' ').forEach(function(c){ if (c) el.classList.add(c); });
        if (t.delay) el.setAttribute('data-delay', (i % 8) + 1);
        observer.observe(el);
      });
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     4. KF-BAR WIDTH ANIMATION ON REVEAL
  ═══════════════════════════════════════════════════════════════ */
  function initKfBars() {
    if (prefersReduced) return;

    const obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    document.querySelectorAll('.kf-bar').forEach(function (bar) {
      obs.observe(bar);
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     5. NUMBER COUNTER ANIMATION (kf-value)
  ═══════════════════════════════════════════════════════════════ */
  function animateCounter(el, target, duration, prefix, suffix) {
    if (prefersReduced) return;
    const start = performance.now();
    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out expo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.round(eased * target);
      el.textContent = prefix + current + suffix;
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = prefix + target + suffix;
    }
    requestAnimationFrame(tick);
  }

  function parseNumber(str) {
    // Extract numeric part and prefix/suffix
    const match = str.match(/^([~≈]?\s*)(\d[\d,.]*)(\s*.*)$/);
    if (!match) return null;
    const prefix = match[1] || '';
    const num = parseFloat(match[2].replace(/,/g, ''));
    const suffix = match[3] || '';
    return { prefix, num, suffix };
  }

  function initCounters() {
    if (prefersReduced) return;

    const obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const el = entry.target;
          const raw = el.getAttribute('data-original') || el.textContent;
          if (!el.getAttribute('data-original')) {
            el.setAttribute('data-original', raw);
          }
          const parsed = parseNumber(raw);
          if (parsed && parsed.num > 0 && parsed.num < 100000) {
            animateCounter(el, parsed.num, 1200, parsed.prefix, parsed.suffix);
          }
          obs.unobserve(el);
        }
      });
    }, { threshold: 0.5 });

    document.querySelectorAll('.kf-value').forEach(function (el) {
      obs.observe(el);
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     6. HERO ORB — mouse-parallax (desktop only)
  ═══════════════════════════════════════════════════════════════ */
  function initHeroParallax() {
    if (prefersReduced) return;
    const hero = document.querySelector('.hero');
    if (!hero) return;

    // Inject orbs if not already there
    if (!hero.querySelector('.hero-orb-1')) {
      const o1 = document.createElement('div');
      o1.className = 'hero-orb-1';
      const o2 = document.createElement('div');
      o2.className = 'hero-orb-2';
      hero.appendChild(o1);
      hero.appendChild(o2);
    }

    const orb1 = hero.querySelector('.hero-orb-1');
    const orb2 = hero.querySelector('.hero-orb-2');

    let mouseX = 0, mouseY = 0;
    let ticking = false;

    hero.addEventListener('mousemove', function (e) {
      const rect = hero.getBoundingClientRect();
      mouseX = (e.clientX - rect.left) / rect.width - 0.5;
      mouseY = (e.clientY - rect.top)  / rect.height - 0.5;
      if (!ticking) {
        requestAnimationFrame(function () {
          if (orb1) orb1.style.transform = 'translate(' + (mouseX * 28) + 'px, ' + (mouseY * 18) + 'px)';
          if (orb2) orb2.style.transform = 'translate(' + (-mouseX * 18) + 'px, ' + (-mouseY * 12) + 'px)';
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }


  /* ═══════════════════════════════════════════════════════════════
     8. SCHEDULE / PROGRESS BAR ANIMATIONS (WP table bars only)
     Targets ONLY simple progress bars inside .wp-tbl table,
     NOT the JS-rendered lv1-gantt chart (which manages its own DOM)
  ═══════════════════════════════════════════════════════════════ */
  function initGanttBars() {
    if (prefersReduced) return;

    // Only target static progress bars inside the WP manhours table
    // Explicitly exclude the lv1-gantt-wrapper and its children
    const ganttWrapper = document.getElementById('lv1-gantt');

    const obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.querySelectorAll('div[style*="height:7px"], div[style*="height: 7px"]').forEach(function (bar) {
            // Never touch anything inside the lv1-gantt wrapper
            if (ganttWrapper && ganttWrapper.contains(bar)) return;
            const match = (bar.getAttribute('style') || '').match(/width\s*:\s*([\d.]+%)/);
            if (!match) return;
            const targetW = match[1];
            bar.style.transition = 'width 1.2s cubic-bezier(0.19,1,0.22,1)';
            bar.style.width = '0%';
            requestAnimationFrame(function () {
              requestAnimationFrame(function () {
                bar.style.width = targetW;
              });
            });
          });
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    // Only observe the wp-tbl (manhours table), not the gantt wrapper
    document.querySelectorAll('table.wp-tbl, .wp-table, [class*="manhour"]').forEach(function (tbl) {
      if (ganttWrapper && ganttWrapper.contains(tbl)) return;
      obs.observe(tbl);
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     9. SECTION-LABEL LEFT BORDER ANIMATION
  ═══════════════════════════════════════════════════════════════ */
  function initSectionLabels() {
    if (prefersReduced) return;

    const obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('sr-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    document.querySelectorAll('.section-label').forEach(function (el) {
      obs.observe(el);
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     10. TABLE ROW STAGGER ON SCROLL (only wp-tbl, not gantt)
  ═══════════════════════════════════════════════════════════════ */
  function initTableRows() {
    if (prefersReduced) return;

    var ganttWrapper = document.getElementById('lv1-gantt') || document.querySelector('.lv1-gantt-wrapper');

    var obs = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var rows = entry.target.querySelectorAll('tbody tr');
          rows.forEach(function(row, i) {
            if (ganttWrapper && ganttWrapper.contains(row)) return;
            row.style.transitionDelay = (i * 40) + 'ms';
            row.classList.add('sr-init', 'sr-visible');
          });
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05 });

    document.querySelectorAll('table.wp-tbl, table.gt').forEach(function(tbl) {
      if (ganttWrapper && ganttWrapper.contains(tbl)) return;
      obs.observe(tbl);
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     11. NAVBAR SCROLL-COMPACT
  ═══════════════════════════════════════════════════════════════ */
  function initNavbarScroll() {
    const nav = document.querySelector('.g-nav');
    if (!nav) return;
    let lastScroll = 0;
    window.addEventListener('scroll', function () {
      const y = window.scrollY;
      if (y > 80) {
        nav.style.boxShadow = '0 4px 24px rgba(0,0,0,0.32), 0 1px 0 rgba(202,238,251,0.14)';
      } else {
        nav.style.boxShadow = '';
      }
      lastScroll = y;
    }, { passive: true });
  }

  /* ═══════════════════════════════════════════════════════════════
     12. INJECT CSS LINKS into <head>
     Returns true if CSS was already present (cached), false if freshly injected.
  ═══════════════════════════════════════════════════════════════ */
  function injectCSS() {
    // Only treat as "already loaded" if the CORRECT path link is present.
    // Pages may have a stale <link href="ima-animations.css"> (wrong/relative path that
    // 404s) left from earlier builds — remove those first so the correct ../scripts/ path
    // is injected and CSS actually loads.
    if (document.querySelector('link[href*="scripts/ima-animations.css?v=nav-clean"]')) return true;

    // Remove any stale wrong-path links (e.g. href="ima-animations.css") to prevent 404s.
    document.querySelectorAll('link[href*="ima-animations"]').forEach(function(l) { l.remove(); });

    const link = document.createElement('link');
    link.id   = 'ima-anim-css';
    link.rel  = 'stylesheet';
    link.href = '../scripts/ima-animations.css?v=nav-clean';
    document.head.appendChild(link);
    return false;
  }

  /* ═══════════════════════════════════════════════════════════════
     BOOT — two-phase to fix async CSS vs. scroll-reveal race:
     Phase 1 (immediate): event listeners, overlay, progress bar
     Phase 2 (after CSS ready): all reveal / animation inits
     Without this, section-1 elements get sr-init BEFORE opacity:0
     is applied, so the IntersectionObserver fires & reveals them
     while they are still visible → no transition plays.
  ═══════════════════════════════════════════════════════════════ */
  function boot() {
    var alreadyLoaded = injectCSS();

    // Phase 1 — runs immediately, no CSS dependency
    initPageFade();
    initScrollProgress();
    initNavbarScroll();
    attachNavFade();

    // Phase 2 — MUST run after CSS is fully applied.
    // sr-init sets opacity:0; if CSS isn't applied yet when sr-init is added,
    // elements stay visible → IntersectionObserver fires → sr-visible added →
    // CSS loads later → both classes present → opacity:1, NO transition plays.
    var ran = false;
    function runRevealInits() {
      if (ran) return;
      ran = true;
      // One rAF after CSS load to guarantee browser has painted the new rules
      requestAnimationFrame(function() {
        initScrollReveal();
        initKfBars();
        initCounters();
        initHeroParallax();
        initGanttBars();
        initSectionLabels();
        initTableRows();
      });
    }

    if (alreadyLoaded) {
      runRevealInits();
      return;
    }

    var cssLink = document.getElementById('ima-anim-css') ||
                  document.querySelector('link[href*="ima-animations"]');

    if (!cssLink) { runRevealInits(); return; }

    // Primary: 'load' event fires when browser has parsed & applied the sheet
    cssLink.addEventListener('load', runRevealInits, { once: true });

    // Fallback: poll link.sheet — handles cases where 'load' fires before
    // the sheet is fully applied, or is skipped for opaque cached responses
    var pollCount = 0;
    var poll = setInterval(function() {
      pollCount++;
      if (cssLink.sheet && cssLink.sheet.cssRules && cssLink.sheet.cssRules.length > 0) {
        clearInterval(poll);
        runRevealInits();
      } else if (pollCount > 150) { // give up after ~2.5s
        clearInterval(poll);
        runRevealInits();
      }
    }, 16);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
