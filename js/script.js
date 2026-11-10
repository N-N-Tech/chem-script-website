(() => {
  'use strict';

  const STORAGE_PREFIX = 'pom-worksheet-v3';
  const PAGE = (location.pathname.split('/').pop() || 'index').replace(/[^a-z0-9_.-]/gi, '_');
  let generatedCounter = 0;

  const EXERCISE_MAP = new Map([
    ['ex-number-1', '1-1'],
    ['ex-car-model', '1-2'],
    ['ex-wegener', '1-3'],
    ['ex-mix-exp', '1-4'],
    ['ex-brownian', '1-5'],
    ['ex-par-mod-fills', '1-6'],
    ['ex-bar-chart', '1-7'],
    ['ex-mp-table', '1-8'],
    ['ex-number-10', '1-9'],
    ['ex-sol-assign', '1-10'],
    ['ex-number-12', '1-11'],
    ['ex-sol-graph', '1-12'],
    ['ex-sol-sat', '1-13'],
    ['ex-dens-table', '1-14'],
    ['ex-dens-cal', '1-15'],
    ['ex-dens-vol', '1-16'],
    ['ex-dens-unit', '1-17'],
    ['ex-temp-def', '1-18'],
    ['ex-diffcond', '1-19'],
    ['ex-dens-exp', '1-20'],
    ['ex-dens-crown', '1-21'],
    ['ex-other-assign', '1-22'],
    ['ex-diff', '1-23'],
    ['ex-mix-types', '1-24'],
    ['ex-mix-pure', '1-25'],
    ['ex-mix-hethomo', '1-26'],
    ['ex-number-27', '1-27'],
    ['ex-mix-assign', '1-28'],
    ['ex-mix-meri', '1-28']
  ]);

  function qs(sel, root = document) { return root.querySelector(sel); }
  function qsa(sel, root = document) { return [...root.querySelectorAll(sel)]; }
  function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (key === 'class') node.className = value;
      else if (key === 'html') node.innerHTML = value;
      else if (key === 'text') node.textContent = value;
      else if (value !== null && value !== undefined) node.setAttribute(key, value);
    }
    for (const child of children.flat()) {
      if (child === null || child === undefined) continue;
      node.append(child.nodeType ? child : document.createTextNode(String(child)));
    }
    return node;
  }
  function makePersistId(prefix = 'item') {
    generatedCounter += 1;
    return `${prefix}-${generatedCounter}`;
  }
  function storageKey(id) { return `${STORAGE_PREFIX}::${PAGE}::${id}`; }
  function setPersistId(node, id) {
    node.dataset.persistId = id;
    if (node.tagName !== 'CANVAS') loadField(node);
    return node;
  }

  function allStorageKeys() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`${STORAGE_PREFIX}::`)) keys.push(key);
    }
    return keys;
  }
  function pageStorageKeys() {
    return allStorageKeys().filter(key => key.startsWith(`${STORAGE_PREFIX}::${PAGE}::`));
  }
  function ensurePersistId(node, prefix = node.tagName.toLowerCase()) {
    if (!node.dataset.persistId) {
      const anchor = node.id || node.name || node.getAttribute('aria-label') || prefix;
      node.dataset.persistId = `${prefix}-${anchor.replace(/[^a-z0-9_-]+/gi, '-').toLowerCase()}-${makePersistId('p')}`;
    }
    return node.dataset.persistId;
  }

  function saveField(node) {
    const id = ensurePersistId(node);
    const value = node.type === 'checkbox' ? node.checked : node.value;
    localStorage.setItem(storageKey(id), JSON.stringify({type: 'field', value}));
  }
  function loadField(node) {
    const id = ensurePersistId(node);
    const raw = localStorage.getItem(storageKey(id));
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (parsed.type !== 'field') return;
      if (node.type === 'checkbox') node.checked = !!parsed.value;
      else if (parsed.value !== undefined) node.value = parsed.value;
    } catch {}
  }
  function persistField(node, prefix) {
    ensurePersistId(node, prefix);
    loadField(node);
    const evt = node.type === 'checkbox' ? 'change' : 'input';
    node.addEventListener(evt, () => saveField(node));
  }

  function saveCanvas(canvas) {
    const id = ensurePersistId(canvas, 'canvas');
    try {
      localStorage.setItem(storageKey(id), JSON.stringify({type: 'canvas', value: canvas.toDataURL('image/png')}));
    } catch {}
  }
  function loadCanvas(canvas) {
    const id = ensurePersistId(canvas, 'canvas');
    const raw = localStorage.getItem(storageKey(id));
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (parsed.type !== 'canvas' || !parsed.value) return;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      img.src = parsed.value;
    } catch {}
  }

  function addToolbar() {
    const topbar = qs('.topbar');
    const main = qs('.main-content');
    if (!topbar || !main || qs('.worksheet-toolbar')) return;

    const toolbar = el('div', {class: 'worksheet-toolbar'});
    const note = el('div', {class: 'toolbar-note', text: 'Answers are saved automatically in this browser.'});
    const controls = el('div', {class: 'toolbar-controls'});

    const exportBtn = el('button', {type: 'button', class: 'toolbar-button', text: 'Export answers'});
    exportBtn.addEventListener('click', () => {
      const payload = {};
      for (const key of allStorageKeys()) payload[key] = localStorage.getItem(key);
      const blob = new Blob([JSON.stringify(payload, null, 2)], {type: 'application/json'});
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'properties_of_matter_answers.json';
      link.click();
      URL.revokeObjectURL(link.href);
    });

    const importBtn = el('button', {type: 'button', class: 'toolbar-button', text: 'Import answers'});
    const fileInput = el('input', {type: 'file', accept: 'application/json', hidden: 'hidden'});
    importBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        for (const [key, value] of Object.entries(data)) {
          if (key.startsWith(`${STORAGE_PREFIX}::`)) localStorage.setItem(key, value);
        }
        location.reload();
      } catch {
        alert('The selected file could not be imported.');
      }
    });

    const resetBtn = el('button', {type: 'button', class: 'toolbar-button danger', text: 'Reset this page'});
    resetBtn.addEventListener('click', () => {
      if (!confirm('Delete all saved answers on this page?')) return;
      for (const key of pageStorageKeys()) localStorage.removeItem(key);
      location.reload();
    });

    controls.append(exportBtn, importBtn, resetBtn, fileInput);
    toolbar.append(note, controls);
    topbar.insertAdjacentElement('afterend', toolbar);
  }

  function initMenu() {
    const menu = qs('#menu-toggle');
    const sidebar = qs('#sidebar');
    if (!menu || !sidebar) return;
    menu.addEventListener('click', () => {
      const isOpen = sidebar.classList.toggle('is-open');
      menu.setAttribute('aria-expanded', String(isOpen));
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        sidebar.classList.remove('is-open');
        menu.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function makeAnswerInput({width = '100%', placeholder = '', multiline = false, rows = 2, cls = ''} = {}) {
    if (multiline) {
      const area = el('textarea', {class: `answer-space compact ${cls}`.trim(), spellcheck: 'false', rows: String(rows)});
      area.placeholder = placeholder;
      area.style.minHeight = `${Math.max(rows * 26, 42)}px`;
      persistField(area, 'textarea');
      return area;
    }
    const input = el('input', {type: 'text', class: `blank-input ${cls}`.trim(), spellcheck: 'false'});
    input.placeholder = placeholder;
    input.style.width = width;
    persistField(input, 'input');
    return input;
  }

  function createDrawingWrap({height = 180, overlay = false, image = null, persistPrefix = 'draw'} = {}) {
    const wrap = el('div', {class: overlay ? 'drawing-wrap annotation-board' : 'drawing-wrap'});
    if (image) {
      const img = image.cloneNode(true);
      img.removeAttribute('width');
      img.removeAttribute('height');
      img.classList.add('annotation-image');
      wrap.append(img);
    }
    const canvas = el('canvas', {
      class: overlay ? 'draw-canvas overlay-canvas' : 'draw-canvas',
      height: String(height),
      'aria-label': 'Drawing area'
    });
    setPersistId(canvas, `${persistPrefix}-${makePersistId('canvas')}`);
    const clear = el('button', {type: 'button', class: 'clear-drawing', text: 'Clear', 'aria-label': 'Clear drawing'});
    wrap.append(canvas, clear);
    return wrap;
  }

  function resizeCanvas(canvas, preserve = true) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    let width = Math.max(220, Math.round(rect.width * dpr));
    let height = 0;
    if (canvas.classList.contains('overlay-canvas')) height = Math.max(140, Math.round(rect.height * dpr));
    else height = Math.round((parseInt(canvas.getAttribute('height'), 10) || 180) * dpr);
    if (!height) height = Math.max(140, Math.round(rect.height * dpr));

    if (canvas.width === width && canvas.height === height) return;
    const tmp = preserve ? document.createElement('canvas') : null;
    if (tmp && canvas.width && canvas.height) {
      tmp.width = canvas.width;
      tmp.height = canvas.height;
      tmp.getContext('2d').drawImage(canvas, 0, 0);
    }
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#253d54';
    ctx.lineWidth = 1.8 * dpr;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (tmp) ctx.drawImage(tmp, 0, 0, tmp.width, tmp.height, 0, 0, width, height);
  }

  function initSingleCanvas(canvas, clearButton) {
    if (canvas.dataset.initialized === 'true') return;
    canvas.dataset.initialized = 'true';
    let drawing = false;
    const ctx = canvas.getContext('2d');

    const drawSettings = () => {
      ctx.strokeStyle = '#253d54';
      ctx.lineWidth = 1.8 * (window.devicePixelRatio || 1);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    };

    const coords = (event) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: (event.clientX - rect.left) * canvas.width / rect.width,
        y: (event.clientY - rect.top) * canvas.height / rect.height
      };
    };

    resizeCanvas(canvas, false);
    drawSettings();
    loadCanvas(canvas);

    const redraw = () => {
      const snap = canvas.toDataURL('image/png');
      resizeCanvas(canvas, false);
      drawSettings();
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      img.src = snap;
    };

    const handleResize = () => {
      try { redraw(); } catch { resizeCanvas(canvas); drawSettings(); }
    };
    window.addEventListener('resize', handleResize, {passive: true});

    canvas.addEventListener('pointerdown', (event) => {
      drawing = true;
      canvas.setPointerCapture(event.pointerId);
      const p = coords(event);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
    });
    canvas.addEventListener('pointermove', (event) => {
      if (!drawing) return;
      const p = coords(event);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    });
    const stop = () => {
      if (!drawing) return;
      drawing = false;
      ctx.beginPath();
      saveCanvas(canvas);
    };
    canvas.addEventListener('pointerup', stop);
    canvas.addEventListener('pointercancel', stop);
    canvas.addEventListener('pointerleave', stop);
    clearButton?.addEventListener('click', () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      saveCanvas(canvas);
    });
  }

  function initExistingCanvases() {
    qsa('.draw-canvas').forEach((canvas) => {
      const clear = canvas.parentElement?.querySelector('.clear-drawing');
      initSingleCanvas(canvas, clear);
    });
  }

  function convertBlankLines() {
    qsa('.blank-line').forEach((span) => {
      const input = makeAnswerInput({width: '8em', cls: 'inline-short-input'});
      span.replaceWith(input);
    });
  }

  function makeObjectivesCheckable() {
    qsa('.objectives li').forEach((li, index) => {
      if (li.querySelector('input[type="checkbox"]')) return;
      const label = el('label', {class: 'objective-check'});
      const box = el('input', {type: 'checkbox'});
      setPersistId(box, `objective-${index + 1}`);
      persistField(box, 'check');
      const content = el('span', {class: 'objective-text'});
      while (li.firstChild) content.append(li.firstChild);
      label.append(box, content);
      li.append(label);
    });
  }

  function addAnswerToEx1() {
    const section = qs('#ex-number-1');
    if (!section) return;
    const next = section.nextElementSibling;
    if (next && (next.matches('.answer-space') || next.matches('.drawing-wrap'))) return;
    const area = makeAnswerInput({multiline: true, rows: 3});
    area.style.minHeight = '84px';
    section.insertAdjacentElement('afterend', area);
  }

  function fillGhsTable() {
    const heading = qs('#h-9-01_introduction');
    if (!heading) return;
    const table = heading.nextElementSibling?.nextElementSibling?.nextElementSibling?.querySelector?.('table') || heading.parentElement.querySelector('table');
    if (!table || table.dataset.enhancedGhs === 'true') return;
    table.dataset.enhancedGhs = 'true';
    qsa('tr', table).slice(1).forEach((tr, idx) => {
      const cells = tr.children;
      if (cells[1] && !cells[1].querySelector('textarea,input')) {
        const area = makeAnswerInput({multiline: true, rows: 2, cls: 'cell-textarea'});
        setPersistId(area, `ghs-description-${idx + 1}`);
        cells[1].innerHTML = '';
        cells[1].append(area);
      }
    });
  }

  function replaceTextareaWithDrawing(textarea, height = 180) {
    if (!textarea || textarea.dataset.replaced === 'true') return;
    const wrap = createDrawingWrap({height});
    textarea.dataset.replaced = 'true';
    textarea.replaceWith(wrap);
  }

  function buildCycleOverlay(container, persistBase = 'cycle') {
    const img = container.querySelector('img');
    if (!img) return;
    const overlay = el('div', {class: 'figure-input-overlay'});
    const image = img.cloneNode(true);
    image.classList.add('cycle-image');
    overlay.append(image);
    const positions = [
      {top: '2%', left: '36%'},
      {top: '21%', left: '71%'},
      {top: '58%', left: '71%'},
      {top: '80%', left: '36%'},
      {top: '58%', left: '2%'},
      {top: '21%', left: '2%'}
    ];
    positions.forEach((pos, index) => {
      const box = el('textarea', {
        class: 'overlay-textarea',
        rows: '2',
        spellcheck: 'false',
        'aria-label': `Scientific cycle box ${index + 1}`
      });
      box.style.top = pos.top;
      box.style.left = pos.left;
      setPersistId(box, `${persistBase}-box-${index + 1}`);
      persistField(box, 'textarea');
      overlay.append(box);
    });
    container.replaceWith(overlay);
  }

  function enhanceScientificCycleFigures() {
    const introCycle = qs('#h-11-01_introduction + p + div.figure-area');
    if (introCycle && !introCycle.dataset.enhanced) {
      introCycle.dataset.enhanced = 'true';
      buildCycleOverlay(introCycle, 'intro-cycle');
    }

    const brownSection = qs('#ex-brownian');
    if (!brownSection) return;
    const cycleFigure = qsa('div.figure-area', brownSection.parentElement).find((div) => div.querySelector('img[src*="ScientificCycleFigure.svg"]'));
    if (cycleFigure && !cycleFigure.dataset.enhanced) {
      cycleFigure.dataset.enhanced = 'true';
      buildCycleOverlay(cycleFigure, 'brown-cycle');
    }
  }

  function enhanceMixingExperiment() {
    const heading = qs('#h-18-02_models');
    if (!heading) return;
    const table = heading.nextElementSibling?.querySelector('table');
    if (!table || table.dataset.enhanced === 'true') return;
    table.dataset.enhanced = 'true';
    qsa('tr:nth-child(2) td', table).forEach((td, idx) => {
      const fig = td.querySelector('figure');
      const stack = el('div', {class: 'stacked-cell'});
      if (fig) stack.append(fig);
      const draw = createDrawingWrap({height: 130, persistPrefix: `mix-model-${idx + 1}`});
      draw.classList.add('mini-draw');
      stack.append(draw);
      td.innerHTML = '';
      td.append(stack);
    });
  }

  function makeStateTableWritable() {
    const heading = qs('#h-27-04_properties');
    const table = heading?.nextElementSibling?.querySelector('table');
    if (!table || table.dataset.enhancedWritable === 'true') return;
    table.dataset.enhancedWritable = 'true';
    qsa('tr', table).slice(1).forEach((tr, rIndex) => {
      qsa('td', tr).forEach((td, cIndex) => {
        if (cIndex === 0) return;
        if (td.textContent.trim() !== '') return;
        const input = makeAnswerInput({width: '100%'});
        setPersistId(input, `states-${rIndex + 1}-${cIndex + 1}`);
        td.append(input);
      });
    });
  }

  function makeAnnotatableFigureAfter(sectionId, imageFragment, persistBase, height = 220) {
    const section = qs(`#${sectionId}`);
    if (!section) return;
    const next = section.nextElementSibling;
    if (!next) return;
    const img = next.querySelector(`img[src*="${imageFragment}"]`);
    if (!img || next.dataset.annotated === 'true') return;
    next.dataset.annotated = 'true';
    const board = createDrawingWrap({height, overlay: true, image: img, persistPrefix: persistBase});
    next.replaceWith(board);
  }

  function makeMatchingWidget(table, persistBase) {
    const rows = qsa('tr', table).map((tr) => qsa('td', tr));
    const leftItems = rows.map((cells) => ({
      label: cells[0]?.textContent.trim(),
      text: cells[1]?.innerHTML.trim()
    }));
    const rightItems = rows.map((cells) => ({
      label: cells[3]?.textContent.trim(),
      html: cells[4]?.innerHTML.trim()
    }));
    const widget = el('div', {class: 'matching-widget'});
    const leftCol = el('div', {class: 'matching-column'});
    const center = el('div', {class: 'matching-center'});
    const rightCol = el('div', {class: 'matching-column'});
    const status = el('div', {class: 'matching-status', text: 'Click one item on the left and then one item on the right to create a connection.'});
    const clearBtn = el('button', {type: 'button', class: 'toolbar-button small', text: 'Clear matches'});
    const connections = el('div', {class: 'matching-connections'});
    const hidden = el('input', {type: 'hidden'});
    setPersistId(hidden, `${persistBase}-matches`);
    persistField(hidden, 'input');

    let activeSide = null;
    let activeValue = null;
    let pairMap = {};
    try { pairMap = hidden.value ? JSON.parse(hidden.value) : {}; } catch { pairMap = {}; }

    function persistMatches() {
      hidden.value = JSON.stringify(pairMap);
      saveField(hidden);
      renderConnections();
    }

    function createItem(side, item) {
      const node = el('button', {type: 'button', class: 'match-item'});
      node.dataset.side = side;
      node.dataset.value = item.label;
      const badge = el('span', {class: 'match-badge', text: item.label});
      const body = el('span', {class: 'match-body'});
      if (side === 'left') body.innerHTML = item.text;
      else body.innerHTML = item.html;
      node.append(badge, body);
      node.addEventListener('click', () => {
        qsa('.match-item.active', widget).forEach(n => n.classList.remove('active'));
        if (side === 'right' && activeSide === 'left') {
          pairMap[activeValue] = item.label;
          activeSide = null;
          activeValue = null;
          status.textContent = 'Connection added.';
          persistMatches();
          return;
        }
        if (side === 'left' && activeSide === 'right') {
          const existingLeft = Object.keys(pairMap).find(key => pairMap[key] === activeValue);
          if (existingLeft) delete pairMap[existingLeft];
          pairMap[item.label] = activeValue;
          activeSide = null;
          activeValue = null;
          status.textContent = 'Connection added.';
          persistMatches();
          return;
        }
        activeSide = side;
        activeValue = item.label;
        node.classList.add('active');
        status.textContent = side === 'left'
          ? `Selected ${item.label}. Now choose a matching item on the right.`
          : `Selected ${item.label}. Now choose a matching item on the left.`;
      });
      return node;
    }

    function renderConnections() {
      connections.innerHTML = '';
      const entries = Object.entries(pairMap);
      if (!entries.length) {
        connections.textContent = 'No matches stored yet.';
      } else {
        entries.forEach(([left, right]) => {
          connections.append(el('div', {class: 'connection-chip', text: `${left} ↔ ${right}`}));
        });
      }
      qsa('.match-item', widget).forEach((node) => node.classList.remove('matched'));
      entries.forEach(([left, right]) => {
        qsa(`.match-item[data-side="left"][data-value="${CSS.escape(left)}"]`, widget).forEach(n => n.classList.add('matched'));
        qsa(`.match-item[data-side="right"][data-value="${CSS.escape(right)}"]`, widget).forEach(n => n.classList.add('matched'));
      });
    }

    leftItems.forEach((item) => leftCol.append(createItem('left', item)));
    rightItems.forEach((item) => rightCol.append(createItem('right', item)));

    clearBtn.addEventListener('click', () => {
      pairMap = {};
      activeSide = null;
      activeValue = null;
      status.textContent = 'All matches cleared.';
      persistMatches();
    });

    center.append(status, clearBtn, connections, hidden);
    widget.append(leftCol, center, rightCol);
    renderConnections();
    return widget;
  }

  function enhanceMatchingExercises() {
    const map = [
      {id: 'ex-sol-assign', key: 'match-solubility'},
      {id: 'ex-other-assign', key: 'match-properties'}
    ];
    map.forEach(({id, key}) => {
      const section = qs(`#${id}`);
      const tableWrap = section?.nextElementSibling;
      const table = tableWrap?.querySelector('table');
      if (!table || tableWrap.dataset.replaced === 'true') return;
      tableWrap.dataset.replaced = 'true';
      tableWrap.replaceWith(makeMatchingWidget(table, key));
    });
  }

  function enlargeSolubilityGraph() {
    const section = qs('#ex-sol-graph');
    if (!section) return;
    const questions = section.nextElementSibling;
    const figureMini = questions?.nextElementSibling;
    if (!questions || !figureMini) return;
    questions.style.setProperty('--mini-width', '41%');
    figureMini.style.setProperty('--mini-width', '56%');
    figureMini.classList.add('solubility-figure-large');
  }

  function makeDensityTableWritable() {
    const section = qs('#ex-dens-table');
    const table = section?.nextElementSibling?.querySelector('table');
    if (!table || table.dataset.writable === 'true') return;
    table.dataset.writable = 'true';
    qsa('tr', table).slice(1).forEach((tr, rIndex) => {
      qsa('td', tr).forEach((td, cIndex) => {
        if (td.textContent.trim() !== '') return;
        const input = makeAnswerInput({width: '100%'});
        setPersistId(input, `density-table-${rIndex + 1}-${cIndex + 1}`);
        td.append(input);
      });
    });
  }

  function makeMixtureTypesWritable() {
    const section = qs('#ex-mix-types');
    const table = section?.nextElementSibling?.querySelector('table');
    if (!table || table.dataset.writable === 'true') return;
    table.dataset.writable = 'true';
    qsa('tr', table).slice(1).forEach((tr, index) => {
      const cells = qsa('td', tr);
      if (cells[0] && !cells[0].querySelector('input')) {
        const input = makeAnswerInput({width: '100%'});
        setPersistId(input, `mix-type-states-${index + 1}`);
        cells[0].append(input);
      }
      if (cells[1] && !cells[1].querySelector('input')) {
        const wrapper = el('div', {class: 'mixture-answer-cell'});
        const input = makeAnswerInput({width: '100%', placeholder: 'name of mixture'});
        setPersistId(input, `mix-type-name-${index + 1}`);
        const draw = createDrawingWrap({height: 96, persistPrefix: `mix-type-draw-${index + 1}`});
        draw.classList.add('table-drawing');
        wrapper.append(input, draw);
        cells[1].innerHTML = '';
        cells[1].append(wrapper);
      }
    });
  }

  function addStructuredAnswersForMixtures() {
    const ex25 = qs('#ex-mix-pure');
    if (ex25) {
      qsa('li', ex25.nextElementSibling || ex25).forEach((li, idx) => {
        if (li.querySelector('input, textarea')) return;
        const input = makeAnswerInput({width: '12em', placeholder: 'pure substance?'});
        setPersistId(input, `mix-pure-${idx + 1}`);
        li.append(input);
      });
    }

    const ex26 = qs('#ex-mix-hethomo');
    if (ex26) {
      qsa('li', ex26.nextElementSibling || ex26).forEach((li, idx) => {
        if (li.querySelector('.inline-form-row')) return;
        const row = el('div', {class: 'inline-form-row'});
        const type = makeAnswerInput({width: '12em', placeholder: 'hom./het.'});
        const states = makeAnswerInput({width: '12em', placeholder: 'state(s)'});
        setPersistId(type, `mix-hethomo-type-${idx + 1}`);
        setPersistId(states, `mix-hethomo-state-${idx + 1}`);
        row.append(type, states);
        li.append(row);
      });
    }

    makeAnnotatableFigureAfter('ex-number-27', 'MixtureDrawingWorksheetFigure.svg', 'mix-drawing-sheet', 360);

    const ex28 = qs('#ex-mix-assign');
    const figure = ex28?.nextElementSibling;
    if (ex28 && figure && !figure.nextElementSibling?.classList?.contains('response-table')) {
      const table = el('div', {class: 'response-table'});
      table.append(el('div', {class: 'response-table-heading', text: 'Answers'}));
      const grid = el('div', {class: 'response-grid'});
      for (let i = 1; i <= 6; i += 1) {
        const row = el('div', {class: 'response-row'});
        row.append(
          el('div', {class: 'response-label', text: String(i)}),
          makeAnswerInput({width: '100%', placeholder: 'state(s) of matter'}),
          makeAnswerInput({width: '100%', placeholder: 'name of mixture'})
        );
        const inputs = qsa('input', row);
        setPersistId(inputs[0], `mix-assign-state-${i}`);
        setPersistId(inputs[1], `mix-assign-name-${i}`);
        inputs.forEach(inp => persistField(inp, 'input'));
        grid.append(row);
      }
      table.append(grid);
      figure.insertAdjacentElement('afterend', table);
    }

    const ex29 = qs('#ex-mix-meri');
    if (ex29) {
      const next = ex29.nextElementSibling;
      if (next && next.matches('textarea.answer-space')) persistField(next, 'textarea');
    }
  }

  function makeDiffusionAndSeparationDrawables() {
    const diffHeading = qs('#h-35-05_particle_model_applications');
    if (diffHeading) {
      let count = 0;
      let node = diffHeading.nextElementSibling;
      while (node && count < 2) {
        if (node.matches && node.matches('div.figure-area') && node.querySelector('img')) {
          const img = node.querySelector('img');
          const board = createDrawingWrap({height: 240, overlay: true, image: img, persistPrefix: `diff-osmosis-${count + 1}`});
          node.replaceWith(board);
          count += 1;
          node = board.nextElementSibling;
          continue;
        }
        node = node.nextElementSibling;
      }
    }

    const extractP = qs('#h-41-05_particle_model_applications + p');
    if (extractP) {
      const next = extractP.nextElementSibling;
      if (next?.matches('textarea.answer-space')) replaceTextareaWithDrawing(next, 220);
    }
    const evapHeading = qs('#h-43-05_particle_model_applications');
    if (evapHeading) {
      const next = evapHeading.nextElementSibling;
      if (next?.matches('textarea.answer-space')) replaceTextareaWithDrawing(next, 180);
    }
  }

  function addBoltzmannWidget() {
    const chart = qs('img[src*="TempChart.svg"]');
    if (!chart || qs('.boltzmann-widget')) return;
    const widget = el('div', {class: 'boltzmann-widget'});
    const title = el('div', {class: 'box-heading', text: 'Interactive Maxwell–Boltzmann sketch'});
    const intro = el('p', {text: 'Move the slider to change the temperature and observe how the distribution shifts and broadens.'});
    const controls = el('div', {class: 'boltzmann-controls'});
    const label = el('label', {class: 'slider-label'});
    const slider = el('input', {type: 'range', min: '200', max: '800', value: '300'});
    const value = el('span', {class: 'slider-value', text: '300 K'});
    label.append('Temperature: ', slider, value);
    const canvas = el('canvas', {class: 'boltzmann-canvas', width: '700', height: '300', 'aria-label': 'Boltzmann distribution graph'});
    controls.append(label);
    widget.append(title, intro, controls, canvas);
    (chart.closest('.figure-area') || chart.closest('figure') || chart).insertAdjacentElement('afterend', widget);

    const ctx = canvas.getContext('2d');
    const draw = () => {
      const T = Number(slider.value);
      value.textContent = `${T} K`;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#51687c';
      ctx.lineWidth = 1;
      const margin = {left: 52, right: 18, top: 20, bottom: 34};
      const w = canvas.width - margin.left - margin.right;
      const h = canvas.height - margin.top - margin.bottom;
      ctx.beginPath();
      ctx.moveTo(margin.left, margin.top);
      ctx.lineTo(margin.left, margin.top + h);
      ctx.lineTo(margin.left + w, margin.top + h);
      ctx.stroke();
      ctx.fillStyle = '#31485c';
      ctx.font = '14px sans-serif';
      ctx.fillText('relative number of particles', 10, margin.top + 10);
      ctx.fillText('particle speed', margin.left + w - 90, margin.top + h + 24);
      const scale = T / 300;
      // Use a common vertical scale and the Maxwell speed distribution.
      // The factor scale^(-3/2) keeps the area under the distribution constant.
      // Reference maximum: the peak at the lowest slider temperature (200 K).
      const referenceMaxY = Math.exp(-1) / Math.sqrt(Number(slider.min) / 300);
      const points = [];
      for (let i = 0; i <= 300; i += 1) {
        const x = i / 300 * 4.5;
        const y = (x * x) * Math.exp(-(x * x) / scale) / Math.pow(scale, 1.5);
        points.push({x, y});
      }
      ctx.strokeStyle = '#1f5d86';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      points.forEach((p, i) => {
        const px = margin.left + (i / 300) * w;
        const py = margin.top + h - (p.y / referenceMaxY) * h * 0.92;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
      const peakIndex = points.reduce((best, p, i) => p.y > points[best].y ? i : best, 0);
      const peakX = margin.left + (peakIndex / 300) * w;
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = '#8aa5bc';
      ctx.beginPath();
      ctx.moveTo(peakX, margin.top + h);
      ctx.lineTo(peakX, margin.top + 14);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#35556f';
      ctx.fillText('most probable speed', Math.max(margin.left + 6, peakX - 50), margin.top + 18);
    };
    slider.addEventListener('input', draw);
    draw();
  }

  function enhanceChemicalReactionSpaces() {
    const areas = qsa('article > textarea.answer-space', document);
    if (PAGE !== '03_chemical_reactions.html') return;
    areas.slice(1).forEach((area, index) => {
      const heights = [240, 240, 150, 150];
      replaceTextareaWithDrawing(area, heights[index] || 180);
    });
  }

  function renumberExercises() {
    // Remove deleted placeholder exercises first.
    const ex7 = qs('#ex-ssdfsd');
    ex7?.remove();
    const ex29 = qs('#ex-irgend');
    ex29?.remove();

    qsa('section.exercise').forEach((section) => {
      const number = EXERCISE_MAP.get(section.id);
      if (!number) return;
      const span = qs('.exercise-number', section);
      if (span) span.textContent = `Ex ${number}`;
    });

    const solutionMap = {
      'solution-car-model': '1-2',
      'solution-wegener': '1-3',
      'solution-mix-exp': '1-4',
      'solution-brownian': '1-5',
      'solution-par-mod-fills': '1-6',
      'solution-bar-chart': '1-7',
      'solution-mp-table': '1-8',
      'solution-sol-assign': '1-10',
      'solution-sol-graph': '1-12',
      'solution-sol-sat': '1-13',
      'solution-dens-cal': '1-15',
      'solution-dens-vol': '1-16',
      'solution-dens-unit': '1-17',
      'solution-temp-def': '1-18',
      'solution-diffcond': '1-19',
      'solution-dens-exp': '1-20',
      'solution-dens-crown': '1-21',
      'solution-other-assign': '1-22',
      'solution-diff': '1-23',
      'solution-mix-pure': '1-25',
      'solution-mix-hethomo': '1-26',
      'solution-mix-assign': '1-27',
      'solution-mix-meri': '1-28'
    };
    Object.entries(solutionMap).forEach(([id, number]) => {
      const sec = qs(`#${id}`);
      if (!sec) return;
      const link = qs('.solution-number a', sec);
      if (link) link.textContent = number;
    });
  }

  function persistExistingFields() {
    qsa('textarea.answer-space, input.blank-input, input[type="text"], input[type="hidden"], textarea.overlay-textarea').forEach((node) => {
      if (node.closest('.matching-widget') && node.type !== 'hidden') return;
      persistField(node, node.tagName.toLowerCase());
    });
  }

  function upgradePageSpecificContent() {
    addAnswerToEx1();
    fillGhsTable();
    enhanceScientificCycleFigures();
    enhanceMixingExperiment();
    makeStateTableWritable();
    enhanceChemicalReactionSpaces();
    makeAnnotatableFigureAfter('ex-number-10', 'StateChangesWorksheetFigure.svg', 'state-changes', 320);
    replaceTextareaWithDrawing(qs('#ex-number-12')?.nextElementSibling, 180);
    enhanceMatchingExercises();
    enlargeSolubilityGraph();
    makeDensityTableWritable();
    makeDiffusionAndSeparationDrawables();
    makeMixtureTypesWritable();
    addStructuredAnswersForMixtures();
    makeAnnotatableFigureAfter('ex-number-27', 'MixtureDrawingWorksheetFigure.svg', 'mixture-drawing', 340);
    addBoltzmannWidget();
  }

  function embedPhetIframes() {
    for (const anchor of qsa('a[href^="https://phet.colorado.edu/sims/html/"]')) {
      if (anchor.closest('.sim-panel')) continue;
      const link = anchor.getAttribute('href');
      const panel = el('details', {class: 'sim-panel'});
      const summary = el('summary', {text: 'Open interactive PhET simulation'});
      const note = el('p', {class: 'sim-note', text: 'Internet connection required. If the simulation does not load, use the original link above.'});
      panel.append(summary, note);
      let mounted = false;
      panel.addEventListener('toggle', () => {
        if (!panel.open || mounted) return;
        const iframe = el('iframe', {
          src: link,
          title: 'PhET interactive simulation',
          loading: 'lazy',
          allowfullscreen: '',
          allow: 'fullscreen'
        });
        panel.append(iframe);
        mounted = true;
      });
      const container = anchor.closest('.mini') || anchor.closest('p') || anchor;
      container.after(panel);
    }
  }

  function run() {
    initMenu();
    renumberExercises();
    addToolbar();
    convertBlankLines();
    makeObjectivesCheckable();
    upgradePageSpecificContent();
    persistExistingFields();
    initExistingCanvases();
    embedPhetIframes();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
