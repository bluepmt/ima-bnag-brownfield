(function () {
  'use strict';
  if (window.__imaAnchorNavLoaded) return;
  window.__imaAnchorNavLoaded = true;

  function slugify(text) {
    return 'anav-' + text.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
      .trim().slice(0, 48);
  }

  function isSubSection(text) {
    return /^\d+\.\d+/.test(text.trim());
  }

  function buildSections() {
    var labels = document.querySelectorAll('.section-label');
    var seen = {};
    var sections = [];

    labels.forEach(function (label) {
      var text = label.textContent.trim();
      if (!text || text.length < 3) return;

      // Walk up to find a meaningful container (one with id, or .pg-sec/.logi-section/.section)
      var container = label.parentElement;
      for (var i = 0; i < 6; i++) {
        if (!container || container === document.body) break;
        var cls = container.className || '';
        if (container.id || cls.indexOf('pg-sec') >= 0 ||
            cls.indexOf('logi-section') >= 0 || cls.indexOf('logi-wrap') >= 0) break;
        container = container.parentElement;
      }
      if (!container || container === document.body) container = label.parentElement;

      // Ensure unique id on container
      if (!container.id) container.id = slugify(text);
      if (seen[container.id]) return;
      seen[container.id] = true;

      sections.push({
        id:    container.id,
        label: text.length > 38 ? text.slice(0, 36) + '…' : text,
        sub:   isSubSection(text),
        el:    container
      });
    });

    return sections;
  }

  function injectCSS() {
    if (document.getElementById('ima-anchornav-style')) return;
    var s = document.createElement('style');
    s.id = 'ima-anchornav-style';
    s.textContent = [
      '#imaAnchorNav{position:fixed;right:18px;top:50%;transform:translateY(-50%);',
        'z-index:200;display:flex;flex-direction:column;gap:7px;',
        'opacity:0;transition:opacity 0.35s;pointer-events:none;}',
      '#imaAnchorNav.is-visible{opacity:1;pointer-events:auto;}',
      '.ian-item{display:flex;align-items:center;gap:8px;cursor:pointer;',
        'text-decoration:none;justify-content:flex-end;}',
      '.ian-label{font-family:"Times New Roman",Times,serif;font-size:10px;',
        'color:rgba(36,57,122,0.52);white-space:nowrap;max-width:0;overflow:hidden;',
        'transition:max-width 0.22s ease,opacity 0.22s ease;opacity:0;',
        'letter-spacing:0.02em;text-align:right;line-height:1.4;}',
      '.ian-item:hover .ian-label,.ian-item.is-active .ian-label{max-width:210px;opacity:1;}',
      '.ian-item.is-active .ian-label{color:#24397A;font-weight:700;}',
      '.ian-dot{flex-shrink:0;border-radius:50%;',
        'background:rgba(36,57,122,0.18);border:1.5px solid rgba(36,57,122,0.28);',
        'transition:all 0.2s;width:8px;height:8px;}',
      '.ian-item.is-sub .ian-dot{width:5px;height:5px;}',
      '.ian-item:hover .ian-dot{background:rgba(36,57,122,0.48);border-color:#24397A;}',
      '.ian-item.is-active .ian-dot{background:#24397A;border-color:#24397A;',
        'box-shadow:0 0 0 3px rgba(36,57,122,0.14);}',
      '@media(max-width:900px){#imaAnchorNav{display:none;}}',
      '@media print{#imaAnchorNav{display:none;}}'
    ].join('');
    document.head.appendChild(s);
  }

  function init() {
    injectCSS();
    var sections = buildSections();
    if (sections.length < 2) return;

    var nav = document.createElement('nav');
    nav.id = 'imaAnchorNav';
    nav.setAttribute('aria-label', 'Page sections');

    sections.forEach(function (s) {
      var a = document.createElement('a');
      a.className = 'ian-item' + (s.sub ? ' is-sub' : '');
      a.href = '#' + s.id;
      a.dataset.target = s.id;
      a.innerHTML =
        '<span class="ian-label">' + s.label + '</span>' +
        '<span class="ian-dot"></span>';
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var el = document.getElementById(s.id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      nav.appendChild(a);
    });

    document.body.appendChild(nav);

    // Highlight active section
    var items = nav.querySelectorAll('.ian-item');
    var els   = sections.map(function (s) { return s.el; });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var idx = els.indexOf(entry.target);
        if (idx < 0) return;
        items.forEach(function (a) { a.classList.remove('is-active'); });
        items[idx].classList.add('is-active');
      });
    }, { rootMargin: '-10% 0px -60% 0px', threshold: 0 });

    els.forEach(function (el) { if (el) io.observe(el); });

    // Show nav after minimal scroll
    var shown = false;
    function checkShow() {
      if (!shown && window.scrollY > 120) {
        nav.classList.add('is-visible');
        shown = true;
      } else if (shown && window.scrollY <= 60) {
        nav.classList.remove('is-visible');
        shown = false;
      }
    }
    window.addEventListener('scroll', checkShow, { passive: true });
    checkShow();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
