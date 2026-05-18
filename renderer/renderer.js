const $query = document.getElementById('query');
const $results = document.getElementById('results');
const $preview = document.getElementById('preview');
const $status = document.getElementById('status');
const $compactBtn = document.getElementById('compactToggle');
const $app = document.querySelector('.app');
const $matchNav = document.getElementById('matchNav');
const $matchPrev = document.getElementById('matchPrev');
const $matchNext = document.getElementById('matchNext');
const $matchCounter = document.getElementById('matchCounter');
const $vaultsToggle = document.getElementById('vaultsToggle');
const $coffeeBtn = document.getElementById('coffeeBtn');
$coffeeBtn.addEventListener('click', () => {
  window.api.openExternal('https://ko-fi.com/franckwalden');
});
const $launchAtStartup = document.getElementById('launchAtStartup');
$launchAtStartup.addEventListener('change', async () => {
  const actual = await window.api.setStartup($launchAtStartup.checked);
  $launchAtStartup.checked = actual;
});
const $vaultsPopover = document.getElementById('vaultsPopover');
const $vaultsList = document.getElementById('vaultsList');
const $vaultsClose = document.getElementById('vaultsClose');
const $previewToolbar = document.getElementById('previewToolbar');
const $previewHeader = document.getElementById('previewHeader');
const $previewHeaderTitle = document.getElementById('previewHeaderTitle');
const $highlightToggle = document.getElementById('highlightToggle');

const HIGHLIGHT_KEY = 'searchidian:highlightsHidden';
if (localStorage.getItem(HIGHLIGHT_KEY) === '1') {
  document.getElementById('preview').classList.add('no-highlights');
  $highlightToggle.setAttribute('aria-pressed', 'true');
  $highlightToggle.title = 'Show highlights';
}
$highlightToggle.addEventListener('click', () => {
  const previewEl = document.getElementById('preview');
  const willHide = !previewEl.classList.contains('no-highlights');
  previewEl.classList.toggle('no-highlights', willHide);
  $highlightToggle.setAttribute('aria-pressed', willHide ? 'true' : 'false');
  $highlightToggle.title = willHide ? 'Show highlights' : 'Hide highlights';
  localStorage.setItem(HIGHLIGHT_KEY, willHide ? '1' : '0');
});
const $fontSlider = document.getElementById('fontSlider');
const $fontValue = document.getElementById('fontValue');
const $previewWrap = document.querySelector('.preview-wrap');
const $splitter = document.getElementById('splitter');
const $appRoot = document.querySelector('.app');

const SPLIT_KEY = 'searchidian:previewWidth';
const savedSplit = Number(localStorage.getItem(SPLIT_KEY));
if (savedSplit >= 200 && savedSplit <= 800) {
  $appRoot.style.setProperty('--preview-width', savedSplit + 'px');
}
$splitter.addEventListener('mousedown', (e) => {
  e.preventDefault();
  $splitter.classList.add('dragging');
  document.body.classList.add('splitter-active');
  const rect = $appRoot.getBoundingClientRect();
  const minW = 200;
  const maxW = Math.max(minW + 1, rect.width - 240);
  const onMove = (ev) => {
    const w = Math.max(minW, Math.min(maxW, ev.clientX - rect.left));
    $appRoot.style.setProperty('--preview-width', w + 'px');
  };
  const onUp = () => {
    $splitter.classList.remove('dragging');
    document.body.classList.remove('splitter-active');
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    const final = parseInt($appRoot.style.getPropertyValue('--preview-width'), 10);
    if (final) localStorage.setItem(SPLIT_KEY, String(final));
  };
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
});

const FONT_KEY = 'searchidian:previewScale';
const savedScale = Number(localStorage.getItem(FONT_KEY)) || 100;
$fontSlider.value = savedScale;
applyFontScale(savedScale);

function applyFontScale(percent) {
  $previewWrap.style.setProperty('--preview-scale', percent / 100);
  $fontValue.textContent = percent + '%';
}

$fontSlider.addEventListener('input', () => {
  const v = Number($fontSlider.value);
  applyFontScale(v);
  localStorage.setItem(FONT_KEY, String(v));
});

let marks = [];
let currentMarkIdx = -1;

let debounceTimer = null;
let activeIndex = -1;
let currentResults = [];
let hoverTimer = null;
let previewCache = new Map();

const COMPACT_KEY = 'searchidian:compact';
if (localStorage.getItem(COMPACT_KEY) === '1') {
  $app.classList.add('compact');
  $compactBtn.classList.add('active');
}

$compactBtn.addEventListener('click', () => {
  $app.classList.toggle('compact');
  const on = $app.classList.contains('compact');
  $compactBtn.classList.toggle('active', on);
  localStorage.setItem(COMPACT_KEY, on ? '1' : '0');
});

$query.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(runSearch, 150);
});

// Use document-level keydown so arrows still work after focus has drifted
// (e.g. when the user clicked the preview pane or its match buttons).
document.addEventListener('keydown', (e) => {
  if (e.shiftKey && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
    e.preventDefault();
    gotoMark(e.key === 'ArrowDown' ? 1 : -1);
    return;
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    move(1);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    move(-1);
  } else if (e.key === 'Enter') {
    if (document.activeElement === $query) {
      e.preventDefault();
      if (activeIndex >= 0 && currentResults[activeIndex]) {
        window.api.openFile(currentResults[activeIndex].path);
      }
    }
  } else if (e.key === 'Escape') {
    window.api.hide();
  }
});

// Wheel over the search bar / status (non-scrollable areas) → redirect to results.
// Wheel over .results or .preview-wrap is handled natively by the browser.
document.addEventListener('wheel', (e) => {
  if (!e.target.closest) return;
  if (e.target.closest('.preview-wrap')) return;
  if (e.target.closest('.results')) return;
  $results.scrollTop += e.deltaY;
}, { passive: true });

window.api.onShown(() => {
  $query.focus();
  $query.select();
  requestResize();
});

window.addEventListener('DOMContentLoaded', () => requestResize());

async function runSearch() {
  const q = $query.value.trim();
  if (!q) {
    currentResults = [];
    $results.innerHTML = '';
    $status.textContent = '';
    clearPreview();
    requestResize();
    return;
  }
  $status.textContent = 'Searching…';
  const t0 = performance.now();
  const results = await window.api.search(q);
  const dt = Math.round(performance.now() - t0);
  currentResults = results;
  render(results);
  $status.textContent = `${results.length} result${results.length === 1 ? '' : 's'} · ${dt} ms`;
}

function render(results) {
  $results.innerHTML = '';
  activeIndex = -1;
  if (results.length === 0) {
    $results.innerHTML = '<li class="empty-state">No matches</li>';
    clearPreview();
    requestResize();
    return;
  }
  const frag = document.createDocumentFragment();
  results.forEach((r, i) => {
    const li = document.createElement('li');
    li.className = 'result';
    li.dataset.index = i;

    const title = document.createElement('div');
    title.className = 'result-title';
    const titleText = document.createElement('span');
    titleText.textContent = r.title;
    titleText.style.overflow = 'hidden';
    titleText.style.textOverflow = 'ellipsis';
    title.appendChild(titleText);

    if (r.count > 0) {
      const count = document.createElement('span');
      count.className = 'result-count';
      count.textContent = r.count;
      title.appendChild(count);
    }
    if (r.vault) {
      const vault = document.createElement('span');
      vault.className = 'result-vault';
      vault.textContent = r.vault;
      title.appendChild(vault);
    }
    li.appendChild(title);

    if (r.snippet) {
      const snip = document.createElement('div');
      snip.className = 'result-snippet';
      snip.textContent = r.snippet;
      li.appendChild(snip);
    }

    li.addEventListener('mouseenter', () => setActive(i, { scroll: false }));
    li.addEventListener('click', () => window.api.openFile(r.path));

    frag.appendChild(li);
  });
  $results.appendChild(frag);
  setActive(0);
  requestResize();
}

let lastSentHeight = 0;
let resizeRaf = null;
function requestResize() {
  if (resizeRaf) cancelAnimationFrame(resizeRaf);
  resizeRaf = requestAnimationFrame(() => {
    resizeRaf = null;
    const searchBar = document.querySelector('.search-bar');
    const status = document.querySelector('.status');
    const headerH = (searchBar?.offsetHeight || 0) + (status?.offsetHeight || 0);
    const listH = $results.scrollHeight;
    const desired = headerH + listH + 4;
    // Dedupe: don't call setSize for sub-pixel jitter
    if (Math.abs(desired - lastSentHeight) < 4) return;
    lastSentHeight = desired;
    window.api.resize(desired);
  });
}

function setActive(i, { scroll = true } = {}) {
  if (i < 0 || i >= currentResults.length) return;
  activeIndex = i;
  [...$results.children].forEach((el, idx) => {
    el.classList.toggle('active', idx === i);
  });
  if (scroll) {
    const el = $results.children[i];
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
  }
  schedulePreview(currentResults[i]);
}

function move(delta) {
  if (currentResults.length === 0) return;
  let next = activeIndex + delta;
  if (next < 0) next = 0;
  if (next >= currentResults.length) next = currentResults.length - 1;
  setActive(next, { scroll: true });
}

function schedulePreview(result) {
  clearTimeout(hoverTimer);
  hoverTimer = setTimeout(() => loadPreview(result), 80);
}

async function loadPreview(result) {
  if (!result) return;
  let content = previewCache.get(result.path);
  if (content === undefined) {
    const res = await window.api.readFile(result.path);
    content = res.content;
    previewCache.set(result.path, content);
    if (previewCache.size > 50) {
      const firstKey = previewCache.keys().next().value;
      previewCache.delete(firstKey);
    }
  }
  renderPreview(result.title, content);
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Mirror the search parser: "quoted" → word-boundary mode.
function parseQueryRenderer(raw) {
  const q = raw.trim();
  if (!q) return { tokens: [], wordBoundary: false };
  const m = q.match(/^["“](.+)["”]$/);
  if (m) return { tokens: [m[1]], wordBoundary: true };
  return { tokens: q.split(/\s+/).filter(Boolean), wordBoundary: false };
}

function highlight(text, query) {
  const escaped = escapeHtml(text);
  const { tokens, wordBoundary } = parseQueryRenderer(query);
  if (tokens.length === 0) return escaped;
  const alt = '(' + tokens.map(escapeRegex).join('|') + ')';
  const pattern = wordBoundary ? `\\b${alt}\\b` : alt;
  const re = new RegExp(pattern, 'gi');
  return escaped.replace(re, (m) => `<mark>${m}</mark>`);
}

function renderPreview(title, content) {
  const q = $query.value.trim();
  $preview.innerHTML = '';
  $previewHeaderTitle.innerHTML = highlight(title, q);
  $previewHeaderTitle.title = title;
  $previewHeader.hidden = false;
  const body = document.createElement('div');
  body.innerHTML = highlight(content, q);
  $preview.appendChild(body);
  marks = [...$preview.querySelectorAll('mark')];
  if (marks.length > 0) {
    currentMarkIdx = 0;
    marks[0].classList.add('current');
    scrollPreviewTo(marks[0]);
    $matchNav.hidden = false;
    updateMatchUI();
  } else {
    currentMarkIdx = -1;
    $matchNav.hidden = true;
    $preview.scrollTop = 0;
  }
}

function scrollPreviewTo(el) {
  const elRect = el.getBoundingClientRect();
  const wrapRect = $preview.getBoundingClientRect();
  const relativeTop = elRect.top - wrapRect.top + $preview.scrollTop;
  const target = relativeTop - $preview.clientHeight / 2 + elRect.height / 2;
  $preview.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
}

function updateMatchUI() {
  $matchCounter.textContent = `${currentMarkIdx + 1} / ${marks.length}`;
  $matchPrev.disabled = marks.length === 0;
  $matchNext.disabled = marks.length === 0;
}

function gotoMark(delta) {
  if (marks.length === 0) return;
  marks[currentMarkIdx]?.classList.remove('current');
  currentMarkIdx = (currentMarkIdx + delta + marks.length) % marks.length;
  const m = marks[currentMarkIdx];
  m.classList.add('current');
  scrollPreviewTo(m);
  updateMatchUI();
}

$matchPrev.addEventListener('click', () => gotoMark(-1));
$matchNext.addEventListener('click', () => gotoMark(1));

// ----- Vaults management -----
async function openVaultsPopover() {
  const vaults = await window.api.listVaults();
  $vaultsList.innerHTML = '';
  if (vaults.length === 0) {
    $vaultsList.innerHTML = '<li class="vault-row"><span style="color:#888">No vaults found in Obsidian config.</span></li>';
  } else {
    for (const v of vaults) {
      const li = document.createElement('li');
      li.className = 'vault-row';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = v.enabled;
      cb.addEventListener('change', async () => {
        await window.api.setVaultEnabled(v.path, cb.checked);
        if ($query.value.trim()) runSearch();
      });
      const text = document.createElement('div');
      text.className = 'vault-row-text';
      const name = document.createElement('div');
      name.className = 'vault-name';
      name.textContent = v.name;
      const p = document.createElement('div');
      p.className = 'vault-path';
      p.textContent = v.path;
      text.appendChild(name);
      text.appendChild(p);
      li.appendChild(cb);
      li.appendChild(text);
      li.addEventListener('click', (e) => {
        if (e.target !== cb) { cb.checked = !cb.checked; cb.dispatchEvent(new Event('change')); }
      });
      $vaultsList.appendChild(li);
    }
  }
  $launchAtStartup.checked = await window.api.getStartup();
  $vaultsPopover.hidden = false;
  $vaultsToggle.classList.add('active');
}
function closeVaultsPopover() {
  $vaultsPopover.hidden = true;
  $vaultsToggle.classList.remove('active');
}
$vaultsToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  if ($vaultsPopover.hidden) openVaultsPopover();
  else closeVaultsPopover();
});
$vaultsClose.addEventListener('click', closeVaultsPopover);
document.addEventListener('click', (e) => {
  if ($vaultsPopover.hidden) return;
  if ($vaultsPopover.contains(e.target) || e.target === $vaultsToggle) return;
  closeVaultsPopover();
});

function clearPreview() {
  $preview.innerHTML = '<div class="preview-empty">Hover a result to preview</div>';
  marks = [];
  currentMarkIdx = -1;
  $matchNav.hidden = true;
  $previewHeader.hidden = true;
}
