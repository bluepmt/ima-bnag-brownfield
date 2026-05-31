(function () {
  'use strict';
  if (window.__imaSearchLoaded) return;
  window.__imaSearchLoaded = true;

  var INDEX = [
    { id:'01', title:'Overview', url:'01. Overview.html', items:[
      { s:'Short Project Summary', t:'The IMA Gas Field Development Project aims to develop offshore gas production and integrate it into the existing BNAG' },
      { s:'Key Figures', t:'~380 MMSCFD gas production, ~23 km pipeline length, 8-10 m water depth, 15 years design life' },
      { s:'Project Parties', t:'TotalEnergies EP Nigeria Limited (Client), PTSC Offshore Services (Brownfield Contractor)' },
      { s:'Project Location & Pipeline Route', t:'Bonny Island, Nigeria, OML 112-117, BNAG Plant, Export to NLNG' },
      { s:'Main Scope Highlights', t:'EPSCC scope: Engineering, Procurement, Supply, Construction & Commissioning, Brownfield modification' },
      { s:'Facility Integration Flow', t:'IMA Field → IMA WHP → 23 km Pipeline → BNAG Plant → NLNG Export Terminal' }
    ]},
    { id:'02', title:'Contract Strategies', url:'02. Contract Strategies.html', items:[
      { s:'EPC Execution Strategy', t:'Engineering, Procurement, Fabrication, Transportation, Brownfield Modification & Commissioning phases' },
      { s:'Engineering', t:'Design, engineering service, ICSS integration, systems engineering and project control' },
      { s:'Procurement', t:'Supply, procurement, vendor management, equipment sourcing and quality assurance' },
      { s:'Fabrication', t:'Onshore fabrication, modularization, assembly, FAT and mechanical completion' },
      { s:'Transportation', t:'Load-out, offloading, logistics, transportation to site, installation support' },
      { s:'Commissioning', t:'Brownfield modification, tie-in works, SIMOPS management, FAC, performance testing' }
    ]},
    { id:'03', title:'Scope of Work', url:'03. Scope of Work.html', items:[
      { s:'Brownfield Modification', t:'Modification to existing BNAG infrastructure, new facilities installation, integration with live plant' },
      { s:'Interactive 3D Model — BNAG', t:'BNAG new facilities visualization, FBX viewer, equipment dimensions and weights' },
      { s:'Equipment Dimensions & Weights', t:'Major equipment specifications, TEG unit, slug catcher, separators, pig receiver, metering skids' },
      { s:'Interactive PFD — Process Flow Diagram', t:'Pig Receiver AA-8133, Slug Catcher V-8133, Flow Control Station FCV-332A/B HIPPS, TEG Contactor C-8160, TEG Regeneration A-8160, Mercury Removal Unit A-8170, Gas Metering M-8101, HP Separator V-8151, condensate pumps P-8151, water pumps P-8152' },
      { s:'Flow Control Station — FCS', t:'FCV-332A FCV-332B 2x50% flow control valves, HIPPS high integrity pressure protection, SDV-332 SDV-333 SDV-334, BDV-340, PIT-338A PIT-338B PIT-338C 2-of-3 voting, 16 inch P-81004-H70-F inlet, 16 inch P-81023-F70 outlet, NG-IMA-11-DORS-318003 Rev.03 IFD' },
      { s:'Slug Catcher V-8133', t:'226 barg design pressure, 2500mm ID 6450mm T/T, LCV-333A LCV-333B level control, SDV-335 BDV-338, line 16 inch P-81003-H03-F inlet, 4 inch S-81002-B03 liquid outlet to HP separator' },
      { s:'TEG Contactor & Regeneration', t:'C-8160 TEG Contactor 95 barg 380 MMSCFD, A-8160 TEG Regeneration package, lean TEG T-81002-F01, rich TEG T-81003-F01, TEG injection T-81001-H01 to flow control station' },
      { s:'HP Separator V-8151', t:'3-phase gas condensate water separator, 1.65m DIA 4.95m T/T, 18 barg, condensate pumps P-8151 A/B, water pumps P-8152 A/B, M-8102 condensate metering, M-8103 water metering' },
      { s:'Tie-in & Integration', t:'Connection to existing systems, BNAG plant integration, pipeline interface points, tie-in drawings 316101 316253 316319 316321 316329' }
    ]},
    { id:'04', title:'Project Execution Plan', url:'04. Project Execution Plan.html', items:[
      { s:'Engineering Phase', t:'Design, engineering service, ICSS design, system engineering, regulatory compliance' },
      { s:'Procurement Phase', t:'Equipment procurement, vendor selection, quality control, delivery schedule management' },
      { s:'Fabrication Phase', t:'Module fabrication, assembly, factory acceptance testing, mechanical completion' },
      { s:'Transportation Phase', t:'Logistics planning, load-out, vessel booking, offshore installation preparation' },
      { s:'Construction Phase', t:'Onsite construction, brownfield modification, tie-in activities, SIMOPS management' },
      { s:'Commissioning Phase', t:'FAC, performance testing, handover, training, startup support and documentation' }
    ]},
    { id:'05', title:'Manhours & Schedule', url:'05. Manhours & Schedule.html', items:[
      { s:'Key Manpower Figures', t:'Total manhours, man-days, headcount distribution, Vietnam vs Nigeria content analysis' },
      { s:'Monthly Manpower Histogram', t:'Stacked manpower by work package, monthly headcount July 2026–February 2029' },
      { s:'Manpower Performance Dashboard', t:'Interactive charts, man-hours, man-days, work package distribution, Nigeria content' },
      { s:'Level 1 Project Schedule', t:'Data-driven Gantt chart, project timeline, critical path, resource leveling' },
      { s:'Work Package Distribution', t:'WP1–WP10 breakdown, engineering, construction, commissioning phases' }
    ]},
    { id:'06', title:'Project Team', url:'06. IMA Brownfield Project Team.html', items:[
      { s:'Project Organization Chart', t:'Client, contractor, project manager, engineering manager, procurement manager' },
      { s:'Project Management', t:'Project control, safety, quality assurance, commissioning management roles' },
      { s:'Engineering Team', t:'Engineering, ICSS design, process engineering, mechanical engineering, control systems' },
      { s:'Procurement Team', t:'Vendor management, supply chain, quality assurance, expediting and inspection' },
      { s:'Construction & Commissioning', t:'Site management, commissioning team, mechanical completion, startup services' },
      { s:'Support Functions', t:'Health, safety, environment, quality, planning, documentation, regulatory compliance' }
    ]},
    { id:'07', title:'Images & Documents', url:'07. Images & Documents.html', items:[
      { s:'Site Survey Gallery', t:'Aerial views, facility photographs, site conditions, layout reference images' },
      { s:'Brownfield Layout', t:'BNAG plant layout, new facilities location, tie-in points, equipment placement' },
      { s:'Process Flow Diagrams', t:'P&ID, process flow sheets, system schematics, heat and mass balance diagrams' },
      { s:'Equipment Renderings', t:'3D models, separator design, slug catcher, TEG unit, compression equipment' },
      { s:'Project Documents', t:'Tender documents, contract, specifications, design standards, execution procedure' }
    ]},
    { id:'08', title:'Progress Report', url:'08. Progress Report.html', items:[
      { s:'Progress Report', t:'Progress updates will be published during the project execution phase.' }
    ]}
  ];

  // ── Inject CSS ──────────────────────────────────────────────────────────────
  var styleEl = document.createElement('style');
  styleEl.id = 'ima-search-style';
  styleEl.textContent = [
    '#imaSearchOverlay{display:none;position:fixed;inset:0;background:rgba(15,30,72,0.52);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);z-index:99999;align-items:flex-start;justify-content:center;padding-top:80px;}',
    '#imaSearchOverlay.is-open{display:flex;}',
    '#imaSearchBox{width:620px;max-width:calc(100vw - 32px);background:#fff;border-radius:10px;box-shadow:0 20px 60px rgba(15,30,72,0.28),0 4px 16px rgba(15,30,72,0.14);overflow:hidden;font-family:"Times New Roman",Times,serif;}',
    '#imaSearchInputWrap{display:flex;align-items:center;padding:0 16px;border-bottom:1px solid #e6eaf4;gap:10px;}',
    '#imaSearchInputWrap svg{flex-shrink:0;color:#7a8ab0;}',
    '#imaSearchInput{flex:1;border:none;outline:none;font-family:"Times New Roman",Times,serif;font-size:16px;color:#1a2a5e;padding:16px 0;background:transparent;}',
    '#imaSearchInput::placeholder{color:#a0aac0;}',
    '#imaSearchEscHint{font-size:10px;background:#eef2f8;color:#7a8ab0;border:1px solid #d0d8ec;border-radius:4px;padding:2px 6px;font-family:monospace;cursor:pointer;white-space:nowrap;}',
    '#imaSearchResults{max-height:420px;overflow-y:auto;}',
    '#imaSearchResults:empty::before{content:"Type to search across all project pages…";display:block;padding:24px 20px;color:#a0aac0;font-size:14px;font-style:italic;}',
    '.ima-sr-none{padding:24px 20px;color:#a0aac0;font-size:14px;font-style:italic;}',
    '.ima-sr-item{display:flex;align-items:flex-start;gap:12px;padding:12px 20px;cursor:pointer;border-bottom:1px solid #f0f3f9;text-decoration:none;color:inherit;}',
    '.ima-sr-item:last-child{border-bottom:none;}',
    '.ima-sr-item:hover,.ima-sr-item.is-active{background:#eef2f8;}',
    '.ima-sr-badge{flex-shrink:0;width:28px;height:28px;border-radius:6px;background:#24397A;color:#fff;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;margin-top:1px;}',
    '.ima-sr-body{flex:1;min-width:0;}',
    '.ima-sr-page{font-size:10px;color:#7a8ab0;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:2px;}',
    '.ima-sr-section{font-size:14px;font-weight:700;color:#1a2a5e;margin-bottom:2px;}',
    '.ima-sr-section mark{background:#CAEEFB;color:#1a2a5e;border-radius:2px;padding:0 2px;font-weight:700;}',
    '.ima-sr-text{font-size:12px;color:#5a6888;line-height:1.5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '.ima-sr-text mark{background:#CAEEFB;color:#1a2a5e;border-radius:2px;padding:0 1px;}',
    '#imaSearchFooter{display:flex;gap:16px;padding:8px 20px;background:#f8fafd;border-top:1px solid #e6eaf4;font-size:10px;color:#9aa4bc;flex-wrap:wrap;}',
    '.ima-search-sep{width:1px;height:28px;background:linear-gradient(180deg,transparent,rgba(202,238,251,0.26),transparent);flex-shrink:0;margin:0 10px 0 6px;}',
    '.ima-search-trigger{display:inline-flex;align-items:center;gap:10px;margin-left:auto;flex:0 0 auto;background:rgba(202,238,251,0.07);border:1px solid rgba(202,238,251,0.24);border-radius:8px;color:rgba(221,242,252,0.76);padding:8px 12px 8px 11px;font-size:12px;font-family:"Times New Roman",Times,serif;cursor:pointer;transition:background .2s cubic-bezier(.4,0,.2,1),border-color .2s cubic-bezier(.4,0,.2,1),box-shadow .2s cubic-bezier(.4,0,.2,1),transform .2s cubic-bezier(.16,1,.3,1),color .2s cubic-bezier(.4,0,.2,1);white-space:nowrap;min-width:220px;min-height:36px;letter-spacing:0.01em;box-shadow:inset 0 1px 0 rgba(255,255,255,0.06);}',
    '.ima-search-trigger:hover{background:rgba(202,238,251,0.15);border-color:rgba(202,238,251,0.42);color:#fff;box-shadow:0 8px 18px rgba(6,18,48,0.16),inset 0 1px 0 rgba(255,255,255,0.10);transform:translateY(-1px);}',
    '.ima-search-trigger:hover .ima-search-icon{opacity:1;transform:scale(1.05);}',
    '.ima-search-icon{flex-shrink:0;opacity:0.7;transition:opacity 0.18s,transform 0.18s;}',
    '.ima-search-placeholder{flex:1;font-style:italic;font-size:12px;text-align:left;}',
    '.ima-search-trigger kbd{font-size:9px;background:rgba(202,238,251,0.12);border:1px solid rgba(202,238,251,0.24);border-radius:4px;padding:2px 6px;font-family:monospace;color:rgba(221,242,252,0.62);letter-spacing:0;flex-shrink:0;}',
    '@media(max-width:768px){.ima-search-placeholder{display:none;}.ima-search-trigger{min-width:unset;}}',
    '@media(max-width:600px){.ima-search-trigger kbd{display:none;}#imaSearchOverlay{padding-top:24px;}}'
  ].join('');
  document.head.appendChild(styleEl);

  // ── Build overlay ───────────────────────────────────────────────────────────
  var overlay = document.createElement('div');
  overlay.id = 'imaSearchOverlay';
  overlay.innerHTML =
    '<div id="imaSearchBox">' +
      '<div id="imaSearchInputWrap">' +
        '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="7.5" cy="7.5" r="5" stroke="currentColor" stroke-width="1.7"/><line x1="11.5" y1="11.5" x2="16" y2="16" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>' +
        '<input id="imaSearchInput" type="text" placeholder="Search project documentation…" autocomplete="off" spellcheck="false" aria-label="Search"/>' +
        '<kbd id="imaSearchEscHint" title="Close">ESC</kbd>' +
      '</div>' +
      '<div id="imaSearchResults" role="listbox"></div>' +
      '<div id="imaSearchFooter">' +
        '<span>&#8593;&#8595; navigate</span>' +
        '<span>&#8629; open</span>' +
        '<span>ESC close</span>' +
        '<span style="margin-left:auto;opacity:0.7;">IMA Project Search</span>' +
      '</div>' +
    '</div>';
  document.body.appendChild(overlay);

  var input     = document.getElementById('imaSearchInput');
  var resultsEl = document.getElementById('imaSearchResults');
  var activeIdx = -1;

  function escHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function highlight(text, query) {
    if (!query) return escHtml(text);
    var safe = escHtml(text);
    var re = new RegExp('(' + query.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + ')', 'gi');
    return safe.replace(re, '<mark>$1</mark>');
  }

  function search(q) {
    if (!q.trim()) return [];
    var ql = q.toLowerCase();
    var out = [];
    INDEX.forEach(function (page) {
      page.items.forEach(function (item) {
        var score = 0;
        if (page.title.toLowerCase().indexOf(ql) >= 0) score += 12;
        if (item.s.toLowerCase().indexOf(ql) >= 0)     score += 20;
        if (item.t.toLowerCase().indexOf(ql) >= 0)     score += 10;
        if (score > 0) out.push({ score: score, page: page, item: item });
      });
    });
    out.sort(function (a, b) { return b.score - a.score; });
    return out.slice(0, 10);
  }

  function renderResults(q) {
    activeIdx = -1;
    if (!q.trim()) { resultsEl.innerHTML = ''; return; }
    var hits = search(q);
    if (!hits.length) {
      resultsEl.innerHTML = '<div class="ima-sr-none">No results for &ldquo;' + escHtml(q) + '&rdquo;</div>';
      return;
    }
    resultsEl.innerHTML = hits.map(function (h, i) {
      return '<a class="ima-sr-item" href="' + encodeURI(h.page.url) + '" data-idx="' + i + '" role="option">' +
        '<div class="ima-sr-badge">' + h.page.id + '</div>' +
        '<div class="ima-sr-body">' +
          '<div class="ima-sr-page">' + escHtml(h.page.title) + '</div>' +
          '<div class="ima-sr-section">' + highlight(h.item.s, q) + '</div>' +
          '<div class="ima-sr-text">'    + highlight(h.item.t, q) + '</div>' +
        '</div>' +
      '</a>';
    }).join('');
  }

  function getItems() { return resultsEl.querySelectorAll('.ima-sr-item'); }

  function moveActive(dir) {
    var items = getItems();
    if (!items.length) return;
    if (activeIdx >= 0) items[activeIdx].classList.remove('is-active');
    activeIdx = (activeIdx + dir + items.length) % items.length;
    items[activeIdx].classList.add('is-active');
    items[activeIdx].scrollIntoView({ block: 'nearest' });
  }

  function openSearch() {
    overlay.classList.add('is-open');
    input.value = '';
    resultsEl.innerHTML = '';
    activeIdx = -1;
    setTimeout(function () { input.focus(); }, 30);
  }

  function closeSearch() {
    overlay.classList.remove('is-open');
    input.blur();
  }

  input.addEventListener('input', function () { renderResults(input.value); });

  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown')  { e.preventDefault(); moveActive(1);  return; }
    if (e.key === 'ArrowUp')    { e.preventDefault(); moveActive(-1); return; }
    if (e.key === 'Enter') {
      var items = getItems();
      var target = activeIdx >= 0 ? items[activeIdx] : items[0];
      if (target) target.click();
      return;
    }
    if (e.key === 'Escape') { closeSearch(); }
  });

  document.getElementById('imaSearchEscHint').addEventListener('click', closeSearch);

  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeSearch();
  });

  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      overlay.classList.contains('is-open') ? closeSearch() : openSearch();
    }
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeSearch();
  });

  // ── Inject search button into navbar ────────────────────────────────────────
  function injectTrigger() {
    var nav = document.querySelector('.g-nav__links');
    if (!nav || document.getElementById('imaSearchTrigger')) return;
    var sep = document.createElement('div');
    sep.className = 'ima-search-sep';
    sep.setAttribute('aria-hidden', 'true');
    var btn = document.createElement('button');
    btn.id = 'imaSearchTrigger';
    btn.className = 'ima-search-trigger';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Search project documentation (Ctrl+K)');
    btn.innerHTML =
      '<svg class="ima-search-icon" width="13" height="13" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="7.5" cy="7.5" r="5" stroke="currentColor" stroke-width="1.9"/><line x1="11.5" y1="11.5" x2="16" y2="16" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>' +
      '<span class="ima-search-placeholder">Search documentation…</span>' +
      '<kbd>Ctrl K</kbd>';
    btn.addEventListener('click', openSearch);
    nav.appendChild(sep);
    nav.appendChild(btn);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectTrigger);
  } else {
    injectTrigger();
  }

})();
