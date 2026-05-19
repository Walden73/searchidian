// ===== i18n =====
const LANG_KEY = 'searchidian:lang';
const systemLang = (navigator.language || 'en').startsWith('fr') ? 'fr' : 'en';
let currentLang = localStorage.getItem(LANG_KEY) || systemLang;

const i18n = {
  fr: {
    searchPlaceholder: 'Rechercher dans tous les vaults Obsidian…',
    searching: 'Recherche…',
    results: (n, dt) => `${n} résultat${n !== 1 ? 's' : ''} · ${dt} ms`,
    noMatches: 'Aucun résultat',
    hoverToPreview: 'Survolez un résultat pour prévisualiser',
    lockPreview: 'Figer la prévisualisation',
    unlockPreview: 'Libérer la prévisualisation',
    openFile: 'Ouvrir le fichier',
    showPreview: 'Afficher la prévisualisation',
    settings: 'Réglages',
    close: 'Fermer',
    launchAtStartup: 'Lancer au démarrage',
    indexedVaults: 'Vaults indexés',
    vaultsFooter: 'Décochez un vault pour l\'exclure de la recherche.',
    compactMode: 'Mode compact',
    coffee: 'Soutenir le projet ☕',
    manageVaults: 'Gérer les vaults',
    hideHighlights: 'Masquer les surlignages',
    showHighlights: 'Afficher les surlignages',
    prevMatch: 'Match précédent (Shift+↑)',
    nextMatch: 'Match suivant (Shift+↓)',
    dragResize: 'Glisser pour redimensionner',
    noVaults: 'Aucun vault trouvé dans la configuration Obsidian.',
    ctxShowPreview: 'Afficher la prévisualisation',
    ctxOpenFile: 'Ouvrir le fichier',
    mdApps: 'Applications Markdown',
    addApp: '+ Ajouter',
    noAppsDetected: 'Aucune app détectée',
    remove: 'Supprimer',
    viewLogs: 'Voir les logs',
    reportBug: 'Signaler un bug',
    updateAvailable: (v) => `Mise à jour ${v} disponible`,
    updateDownloaded: (v) => `Mise à jour ${v} prête`,
    installUpdate: 'Installer et redémarrer',
    downloadUpdate: 'Télécharger',
    laterBtn: 'Plus tard',
  },
  en: {
    searchPlaceholder: 'Search markdown across all Obsidian vaults…',
    searching: 'Searching…',
    results: (n, dt) => `${n} result${n !== 1 ? 's' : ''} · ${dt} ms`,
    noMatches: 'No matches',
    hoverToPreview: 'Hover a result to preview',
    lockPreview: 'Lock preview',
    unlockPreview: 'Unlock preview',
    openFile: 'Open file',
    showPreview: 'Show preview',
    settings: 'Settings',
    close: 'Close',
    launchAtStartup: 'Launch at startup',
    indexedVaults: 'Indexed vaults',
    vaultsFooter: 'Untick a vault to exclude it from search.',
    compactMode: 'Compact mode',
    coffee: 'Buy me a coffee ☕',
    manageVaults: 'Manage vaults',
    hideHighlights: 'Hide highlights',
    showHighlights: 'Show highlights',
    prevMatch: 'Previous match (Shift+↑)',
    nextMatch: 'Next match (Shift+↓)',
    dragResize: 'Drag to resize',
    noVaults: 'No vaults found in Obsidian config.',
    ctxShowPreview: 'Show preview',
    ctxOpenFile: 'Open file',
    mdApps: 'Markdown apps',
    addApp: '+ Add app',
    noAppsDetected: 'No apps detected',
    remove: 'Remove',
    viewLogs: 'View logs',
    reportBug: 'Report a bug',
    updateAvailable: (v) => `Update ${v} available`,
    updateDownloaded: (v) => `Update ${v} ready`,
    installUpdate: 'Install & restart',
    downloadUpdate: 'Download',
    laterBtn: 'Later',
  },
};

function t(key) {
  return (i18n[currentLang] || i18n.en)[key] || i18n.en[key] || key;
}

// ===== DOM refs =====
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
const $launchAtStartup = document.getElementById('launchAtStartup');
const $vaultsPopover = document.getElementById('vaultsPopover');
const $vaultsList = document.getElementById('vaultsList');
const $vaultsClose = document.getElementById('vaultsClose');
const $previewToolbar = document.getElementById('previewToolbar');
const $previewHeader = document.getElementById('previewHeader');
const $previewHeaderTitle = document.getElementById('previewHeaderTitle');
const $highlightToggle = document.getElementById('highlightToggle');
const $previewWrap = document.querySelector('.preview-wrap');
const $splitter = document.getElementById('splitter');
const $appRoot = document.querySelector('.app');
const $previewLock = document.getElementById('previewLock');
const $previewOpenFile = document.getElementById('previewOpenFile');
const $contextMenu = document.getElementById('contextMenu');
const $ctxPreview = document.getElementById('ctxPreview');
const $ctxOpenFile = document.getElementById('ctxOpenFile');
const $langToggle = document.getElementById('langToggle');
const $mdAppsTitle = document.getElementById('mdAppsTitle');
const $addMdAppBtn = document.getElementById('addMdAppBtn');
const $mdAppsList = document.getElementById('mdAppsList');
const $updateBanner = document.getElementById('updateBanner');
const $updateBannerTitle = document.getElementById('updateBannerTitle');
const $updateNotes = document.getElementById('updateNotes');
const $installUpdateBtn = document.getElementById('installUpdateBtn');
const $dismissUpdateBtn = document.getElementById('dismissUpdateBtn');
const $viewLogsBtn = document.getElementById('viewLogsBtn');
const $reportBugBtn = document.getElementById('reportBugBtn');
const $appVersionLabel = document.getElementById('appVersionLabel');
const $settingsTitle = document.getElementById('settingsTitle');
const $launchAtStartupLabel = document.getElementById('launchAtStartupLabel');
const $indexedVaultsTitle = document.getElementById('indexedVaultsTitle');
const $vaultsFooter = document.getElementById('vaultsFooter');
const $fontSlider = document.getElementById('fontSlider');
const $fontValue = document.getElementById('fontValue');

function getPreviewEmpty() { return $preview.querySelector('.preview-empty'); }

// ===== Apply i18n to all static text =====
function applyLang() {
  $query.placeholder = t('searchPlaceholder');
  $compactBtn.title = t('compactMode');
  $coffeeBtn.title = t('coffee');
  $vaultsToggle.title = t('manageVaults');
  $splitter.title = t('dragResize');
  $settingsTitle.textContent = t('settings');
  $vaultsClose.title = t('close');
  $launchAtStartupLabel.textContent = t('launchAtStartup');
  $indexedVaultsTitle.textContent = t('indexedVaults');
  $vaultsFooter.textContent = t('vaultsFooter');
  $matchPrev.title = t('prevMatch');
  $matchNext.title = t('nextMatch');
  $ctxPreview.textContent = t('ctxShowPreview');
  $ctxOpenFile.textContent = t('ctxOpenFile');
  updateLockTitle();
  $previewOpenFile.title = t('openFile');
  const isHidden = $highlightToggle.getAttribute('aria-pressed') === 'true';
  $highlightToggle.title = isHidden ? t('showHighlights') : t('hideHighlights');
  const emptyEl = getPreviewEmpty();
  if (emptyEl) emptyEl.textContent = t('hoverToPreview');
  $mdAppsTitle.textContent = t('mdApps');
  $addMdAppBtn.textContent = t('addApp');
  $viewLogsBtn.textContent = t('viewLogs');
  $reportBugBtn.textContent = t('reportBug');
  refreshUpdateBanner();
}

function updateLockTitle() {
  $previewLock.title = previewLocked ? t('unlockPreview') : t('lockPreview');
}

// ===== Preview lock state =====
const LOCK_KEY = 'searchidian:previewLocked';
let previewLocked = localStorage.getItem(LOCK_KEY) === '1';
let currentPreviewedResult = null;
let contextMenuTarget = null;

function applyLockState() {
  $previewLock.classList.toggle('locked', previewLocked);
  updateLockTitle();
}

applyLockState();

$previewLock.addEventListener('click', () => {
  previewLocked = !previewLocked;
  localStorage.setItem(LOCK_KEY, previewLocked ? '1' : '0');
  applyLockState();
  if (!previewLocked && activeIndex >= 0 && currentResults[activeIndex]) {
    schedulePreview(currentResults[activeIndex]);
  }
});

$previewOpenFile.addEventListener('click', () => {
  if (currentPreviewedResult) window.api.openFile(currentPreviewedResult.path);
});

// ===== Update =====
let updateInfo = null;
let updateDownloaded = false;
let updateDismissed = false;

function refreshUpdateBanner() {
  if (!updateInfo || updateDismissed) { $updateBanner.hidden = true; return; }
  const titleFn = updateDownloaded ? t('updateDownloaded') : t('updateAvailable');
  $updateBannerTitle.textContent = titleFn(updateInfo.version);
  const notes = typeof updateInfo.releaseNotes === 'string'
    ? updateInfo.releaseNotes.replace(/<[^>]+>/g, '').trim()
    : (updateInfo.releaseName || '');
  $updateNotes.textContent = notes ? notes.slice(0, 300) + (notes.length > 300 ? '…' : '') : '';
  $installUpdateBtn.textContent = updateDownloaded ? t('installUpdate') : t('downloadUpdate');
  $dismissUpdateBtn.textContent = t('laterBtn');
  $updateBanner.hidden = false;
  $vaultsToggle.classList.add('has-update');
}

window.api.onUpdateAvailable((info) => {
  updateInfo = info;
  updateDownloaded = false;
  $vaultsToggle.classList.add('has-update');
});

window.api.onUpdateDownloaded((info) => {
  updateInfo = info;
  updateDownloaded = true;
  $vaultsToggle.classList.add('has-update');
});

$installUpdateBtn.addEventListener('click', () => {
  if (updateDownloaded) {
    window.api.installUpdate();
  } else {
    window.api.checkUpdate();
    $installUpdateBtn.disabled = true;
    $installUpdateBtn.textContent = '…';
  }
});

$dismissUpdateBtn.addEventListener('click', () => {
  updateDismissed = true;
  $updateBanner.hidden = true;
});

$viewLogsBtn.addEventListener('click', () => window.api.openLog());
$reportBugBtn.addEventListener('click', () => window.api.reportBug());

// Load app version
window.api.getVersion().then(v => { $appVersionLabel.textContent = `v${v}`; });

// Restore update state if app was already notified before settings opened
window.api.getUpdateState().then(({ available, downloaded, info }) => {
  if (available && info) {
    updateInfo = info;
    updateDownloaded = downloaded;
    $vaultsToggle.classList.add('has-update');
  }
});

// ===== Language toggle =====
$langToggle.checked = currentLang === 'en';
$langToggle.addEventListener('change', () => {
  currentLang = $langToggle.checked ? 'en' : 'fr';
  localStorage.setItem(LANG_KEY, currentLang);
  applyLang();
});

// ===== Highlights toggle =====
const HIGHLIGHT_KEY = 'searchidian:highlightsHidden';
if (localStorage.getItem(HIGHLIGHT_KEY) === '1') {
  $preview.classList.add('no-highlights');
  $highlightToggle.setAttribute('aria-pressed', 'true');
}
$highlightToggle.addEventListener('click', () => {
  const willHide = !$preview.classList.contains('no-highlights');
  $preview.classList.toggle('no-highlights', willHide);
  $highlightToggle.setAttribute('aria-pressed', willHide ? 'true' : 'false');
  $highlightToggle.title = willHide ? t('showHighlights') : t('hideHighlights');
  localStorage.setItem(HIGHLIGHT_KEY, willHide ? '1' : '0');
});

// ===== Coffee button =====
$coffeeBtn.addEventListener('click', () => {
  window.api.openExternal('https://ko-fi.com/franckwalden');
});

// ===== Startup =====
$launchAtStartup.addEventListener('change', async () => {
  const actual = await window.api.setStartup($launchAtStartup.checked);
  $launchAtStartup.checked = actual;
});

// ===== Preview splitter =====
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

// ===== Font scale =====
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

// ===== Compact mode =====
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

// ===== State =====
let marks = [];
let currentMarkIdx = -1;
let debounceTimer = null;
let activeIndex = -1;
let currentResults = [];
let hoverTimer = null;
let previewCache = new Map();

// ===== Search =====
$query.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(runSearch, 150);
});

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
    if (!$contextMenu.hidden) {
      hideContextMenu();
    } else {
      window.api.hide();
    }
  }
});

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
  $status.textContent = t('searching');
  const t0 = performance.now();
  const results = await window.api.search(q);
  const dt = Math.round(performance.now() - t0);
  currentResults = results;
  render(results);
  $status.textContent = t('results')(results.length, dt);
}

function render(results) {
  $results.innerHTML = '';
  activeIndex = -1;
  if (results.length === 0) {
    $results.innerHTML = `<li class="empty-state">${t('noMatches')}</li>`;
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

    li.addEventListener('mouseenter', () => {
      setActive(i, { scroll: false, loadPreview: !previewLocked });
    });

    li.addEventListener('click', () => {
      setActive(i, { scroll: false, loadPreview: true });
    });

    li.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      showContextMenu(e.clientX, e.clientY, r, i);
    });

    frag.appendChild(li);
  });
  $results.appendChild(frag);
  setActive(0);
  requestResize();
}

// ===== Context menu =====
function showContextMenu(x, y, result, index) {
  contextMenuTarget = { result, index };
  $ctxPreview.textContent = t('ctxShowPreview');
  $ctxOpenFile.textContent = t('ctxOpenFile');
  $contextMenu.hidden = false;

  const menuW = $contextMenu.offsetWidth || 160;
  const menuH = $contextMenu.offsetHeight || 64;
  const winW = window.innerWidth;
  const winH = window.innerHeight;
  $contextMenu.style.left = Math.min(x, winW - menuW - 4) + 'px';
  $contextMenu.style.top = Math.min(y, winH - menuH - 4) + 'px';
}

function hideContextMenu() {
  $contextMenu.hidden = true;
  contextMenuTarget = null;
}

$ctxPreview.addEventListener('click', () => {
  if (contextMenuTarget) {
    setActive(contextMenuTarget.index, { scroll: true, loadPreview: true });
  }
  hideContextMenu();
});

$ctxOpenFile.addEventListener('click', () => {
  if (contextMenuTarget) {
    window.api.openFile(contextMenuTarget.result.path);
  }
  hideContextMenu();
});

document.addEventListener('click', (e) => {
  if (!$contextMenu.hidden && !$contextMenu.contains(e.target)) {
    hideContextMenu();
  }
});

// ===== Active / preview =====
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
    if (Math.abs(desired - lastSentHeight) < 4) return;
    lastSentHeight = desired;
    window.api.resize(desired);
  });
}

function setActive(i, { scroll = true, loadPreview = true } = {}) {
  if (i < 0 || i >= currentResults.length) return;
  activeIndex = i;
  [...$results.children].forEach((el, idx) => {
    el.classList.toggle('active', idx === i);
  });
  if (scroll) {
    const el = $results.children[i];
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
  }
  if (loadPreview) schedulePreview(currentResults[i]);
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
  currentPreviewedResult = result;
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

function parseQueryRenderer(raw) {
  const q = raw.trim();
  if (!q) return { tokens: [], wordBoundary: false };
  const m = q.match(/^[""](.+)[""]$/);
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

// ===== MD apps =====
async function renderMdApps() {
  const { apps, defaultApp } = await window.api.listMdApps();
  $mdAppsList.innerHTML = '';
  if (apps.length === 0) {
    const msg = document.createElement('div');
    msg.className = 'md-apps-empty';
    msg.textContent = t('noAppsDetected');
    $mdAppsList.appendChild(msg);
    return;
  }
  for (const a of apps) {
    const row = document.createElement('div');
    row.className = 'md-app-row';

    const lbl = document.createElement('label');
    lbl.className = 'md-app-radio-label';

    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'defaultMdApp';
    radio.value = a.path;
    radio.checked = a.path === defaultApp;
    radio.addEventListener('change', async () => {
      if (radio.checked) {
        await window.api.setDefaultMdApp(a.path);
        renderMdApps();
      }
    });

    const name = document.createElement('span');
    name.className = 'md-app-name';
    name.textContent = a.name;

    lbl.appendChild(radio);
    lbl.appendChild(name);

    const removeBtn = document.createElement('button');
    removeBtn.className = 'md-app-remove';
    removeBtn.textContent = '×';
    removeBtn.title = t('remove');
    removeBtn.addEventListener('click', async () => {
      await window.api.removeMdApp(a.path);
      renderMdApps();
    });

    row.appendChild(lbl);
    row.appendChild(removeBtn);
    $mdAppsList.appendChild(row);
  }
}

$addMdAppBtn.addEventListener('click', async () => {
  const result = await window.api.addMdApp();
  if (result && !result.error) renderMdApps();
});

// ===== Vaults popover =====
async function openVaultsPopover() {
  const vaults = await window.api.listVaults();
  $vaultsList.innerHTML = '';
  if (vaults.length === 0) {
    $vaultsList.innerHTML = `<li class="vault-row"><span style="color:#888">${t('noVaults')}</span></li>`;
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
  $langToggle.checked = currentLang === 'en';
  refreshUpdateBanner();
  await renderMdApps();
  $vaultsPopover.hidden = false;
  $vaultsToggle.classList.add('active');
  // Adjust window height for popover content
  requestAnimationFrame(() => {
    const popoverHeight = $vaultsPopover.offsetHeight;
    const searchBar = document.querySelector('.search-bar');
    const status = document.querySelector('.status');
    const headerH = (searchBar?.offsetHeight || 0) + (status?.offsetHeight || 0);
    const listH = $results.scrollHeight;
    const minHeight = headerH + Math.max(listH, popoverHeight + 20) + 4;
    window.api.resize(minHeight);
  });
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
  $preview.innerHTML = '';
  const empty = document.createElement('div');
  empty.className = 'preview-empty';
  empty.textContent = t('hoverToPreview');
  $preview.appendChild(empty);
  marks = [];
  currentMarkIdx = -1;
  $matchNav.hidden = true;
  $previewHeader.hidden = true;
  currentPreviewedResult = null;
}

// ===== Init =====
applyLang();
