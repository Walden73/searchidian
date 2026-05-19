const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage, shell, screen, globalShortcut, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');
const log = require('electron-log');
const { autoUpdater } = require('electron-updater');

// ---- Logging ----
log.initialize();
log.transports.file.level = 'debug';
log.transports.console.level = 'debug';
log.info('Searchidian starting…');
const { listVaults, vaultForFile, topLevelVaultPaths } = require('./src/vaults');
const { search } = require('./src/search');

let tray = null;
let win = null;
let currentAbort = null;
let settings = { disabledVaults: [], customMdApps: [], hiddenDetectedApps: [], defaultMdApp: null, mdAppsOrder: [] };

// ---- Markdown app detection ----
const KNOWN_MD_APPS = [
  { name: 'Obsidian',          bundle: 'Obsidian.app' },
  { name: 'Typora',            bundle: 'Typora.app' },
  { name: 'iA Writer',         bundle: 'iA Writer.app' },
  { name: 'Bear',              bundle: 'Bear.app' },
  { name: 'Ulysses',           bundle: 'Ulysses.app' },
  { name: 'Marked 2',          bundle: 'Marked 2.app' },
  { name: 'MacDown',           bundle: 'MacDown.app' },
  { name: 'Nota',              bundle: 'Nota.app' },
  { name: 'Zettlr',            bundle: 'Zettlr.app' },
  { name: 'Visual Studio Code',bundle: 'Visual Studio Code.app' },
  { name: 'BBEdit',            bundle: 'BBEdit.app' },
  { name: 'Nova',              bundle: 'Nova.app' },
  { name: 'Logseq',            bundle: 'Logseq.app' },
  { name: 'Craft',             bundle: 'Craft - Docs and Notes Editor.app' },
  { name: 'Sublime Text',      bundle: 'Sublime Text.app' },
  { name: 'Atom',              bundle: 'Atom.app' },
  { name: 'Notable',           bundle: 'Notable.app' },
  { name: 'Boost Note',        bundle: 'Boost Note.app' },
  { name: 'Joplin',            bundle: 'Joplin.app' },
  { name: 'Notion',            bundle: 'Notion.app' },
  { name: 'Inkdrop',           bundle: 'Inkdrop.app' },
  { name: 'MWeb',              bundle: 'MWeb.app' },
  { name: 'Mark Text',         bundle: 'Mark Text.app' },
  { name: 'Ghostwriter',       bundle: 'Ghostwriter.app' },
  { name: 'Anytype',           bundle: 'Anytype.app' },
  { name: 'AppFlowy',          bundle: 'AppFlowy.app' },
  { name: 'Reflect',           bundle: 'Reflect.app' },
  { name: 'Notesnook',         bundle: 'Notesnook.app' },
  { name: 'Standard Notes',    bundle: 'Standard Notes.app' },
  { name: 'Drafts',            bundle: 'Drafts.app' },
  { name: 'Quiver',            bundle: 'Quiver.app' },
];

function detectMdApps() {
  const dirs = ['/Applications', path.join(os.homedir(), 'Applications')];
  const found = [];
  for (const entry of KNOWN_MD_APPS) {
    for (const dir of dirs) {
      const fullPath = path.join(dir, entry.bundle);
      if (fs.existsSync(fullPath)) {
        found.push({ name: entry.name, path: fullPath });
        break;
      }
    }
  }
  return found;
}

function settingsPath() {
  return path.join(app.getPath('userData'), 'settings.json');
}
function loadSettings() {
  try {
    const raw = fs.readFileSync(settingsPath(), 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.disabledVaults)) settings = parsed;
  } catch (_) { /* defaults */ }
}
function saveSettings() {
  try {
    fs.mkdirSync(path.dirname(settingsPath()), { recursive: true });
    fs.writeFileSync(settingsPath(), JSON.stringify(settings, null, 2));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}
function enabledVaults() {
  return listVaults().filter((v) => !settings.disabledVaults.includes(v.path));
}

// ---- Auto-updater ----
autoUpdater.logger = log;
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = false;

let updateState = { available: false, downloaded: false, info: null };

autoUpdater.on('update-available', (info) => {
  log.info('Update available:', info.version);
  updateState = { available: true, downloaded: false, info };
  if (win) win.webContents.send('update:available', info);
});

autoUpdater.on('update-downloaded', (info) => {
  log.info('Update downloaded:', info.version);
  updateState = { available: true, downloaded: true, info };
  if (win) win.webContents.send('update:downloaded', info);
});

autoUpdater.on('update-not-available', () => {
  log.info('App is up to date.');
});

autoUpdater.on('error', (err) => {
  log.error('Updater error:', err.message);
});

// Hide from Dock — menubar app
if (process.platform === 'darwin' && app.dock) app.dock.hide();

function createWindow() {
  win = new BrowserWindow({
    width: 880,
    height: 520,
    show: false,
    frame: false,
    resizable: true,
    movable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    transparent: true,
    hasShadow: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  win.on('blur', () => {
    if (!win.webContents.isDevToolsOpened()) win.hide();
  });
}

function positionWindow() {
  if (!tray || !win) return;
  const trayBounds = tray.getBounds();
  const winBounds = win.getBounds();
  const display = screen.getDisplayNearestPoint({ x: trayBounds.x, y: trayBounds.y });
  let x = Math.round(trayBounds.x + trayBounds.width / 2 - winBounds.width / 2);
  const y = Math.round(trayBounds.y + trayBounds.height + 4);
  // clamp to screen
  const workArea = display.workArea;
  if (x + winBounds.width > workArea.x + workArea.width - 8) {
    x = workArea.x + workArea.width - winBounds.width - 8;
  }
  if (x < workArea.x + 8) x = workArea.x + 8;
  win.setPosition(x, y, false);
}

function toggleWindow() {
  if (!win) return;
  if (win.isVisible()) {
    win.hide();
  } else {
    positionWindow();
    win.show();
    win.focus();
    win.webContents.send('window:shown');
  }
}

function createTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, 'assets/Logo-Obsidian.png'));
  icon.setTemplateImage(true);
  tray = new Tray(icon);
  tray.setToolTip('Searchidian — Obsidian search');
  tray.on('click', toggleWindow);
  tray.on('right-click', () => {
    const menu = Menu.buildFromTemplate([
      { label: 'Open Searchidian', click: toggleWindow },
      { type: 'separator' },
      { label: 'Quit', click: () => app.quit() },
    ]);
    tray.popUpContextMenu(menu);
  });
}

// ---------------- IPC ----------------

ipcMain.handle('vaults:list', () => {
  return listVaults().map((v) => ({
    ...v,
    enabled: !settings.disabledVaults.includes(v.path),
  }));
});

ipcMain.handle('vaults:set-enabled', (_evt, vaultPath, enabled) => {
  const set = new Set(settings.disabledVaults);
  if (enabled) set.delete(vaultPath);
  else set.add(vaultPath);
  settings.disabledVaults = [...set];
  saveSettings();
  return true;
});

ipcMain.handle('search:query', async (_evt, query) => {
  if (currentAbort) currentAbort.abort();
  currentAbort = new AbortController();
  const vaults = enabledVaults();
  const paths = topLevelVaultPaths(vaults);
  try {
    const results = await search(query, paths, { signal: currentAbort.signal });
    // attach vault info
    return results.map((r) => {
      const v = vaultForFile(r.path, vaults);
      return { ...r, vault: v ? v.name : null, vaultPath: v ? v.path : null };
    });
  } catch (err) {
    if (err.name === 'AbortError') return [];
    console.error(err);
    return [];
  }
});

ipcMain.handle('file:read', async (_evt, filePath) => {
  try {
    const stat = fs.statSync(filePath);
    if (stat.size > 2 * 1024 * 1024) {
      return { content: '[File too large to preview]', truncated: true };
    }
    const content = fs.readFileSync(filePath, 'utf8');
    return { content, truncated: false };
  } catch (err) {
    return { content: `[Error reading file: ${err.message}]`, truncated: false };
  }
});

ipcMain.handle('file:open', async (_evt, filePath) => {
  const defaultApp = settings.defaultMdApp;
  const isObsidian = !defaultApp || path.basename(defaultApp, '.app').toLowerCase() === 'obsidian';

  if (defaultApp && !isObsidian) {
    spawn('open', ['-a', defaultApp, filePath], { detached: true, stdio: 'ignore' }).unref();
    if (win) win.hide();
    return;
  }

  // Obsidian URL scheme (default behaviour)
  const vaults = listVaults();
  const v = vaultForFile(filePath, vaults);
  if (!v) {
    shell.openPath(filePath);
    return;
  }
  const rel = path.relative(v.path, filePath);
  const url = `obsidian://open?vault=${encodeURIComponent(v.name)}&file=${encodeURIComponent(rel.replace(/\.md$/i, ''))}`;
  shell.openExternal(url);
  if (win) win.hide();
});

// ---- MD apps IPC ----
ipcMain.handle('mdapps:list', () => {
  const hidden = settings.hiddenDetectedApps || [];
  const detected = detectMdApps().filter(a => !hidden.includes(a.path));
  const customPaths = detected.map(a => a.path);
  const custom = (settings.customMdApps || []).filter(a => !customPaths.includes(a.path));
  let all = [
    ...detected.map(a => ({ ...a, isCustom: false })),
    ...custom.map(a => ({ ...a, isCustom: true })),
  ];
  // Sort by mdAppsOrder
  const order = settings.mdAppsOrder || [];
  all.sort((a, b) => {
    const idxA = order.indexOf(a.path);
    const idxB = order.indexOf(b.path);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return 0;
  });
  return { apps: all, defaultApp: settings.defaultMdApp || null };
});

ipcMain.handle('mdapps:set-default', (_evt, appPath) => {
  settings.defaultMdApp = appPath;
  // Move to top of order
  const order = settings.mdAppsOrder || [];
  const filtered = order.filter(p => p !== appPath);
  settings.mdAppsOrder = [appPath, ...filtered];
  saveSettings();
  return true;
});

ipcMain.handle('mdapps:add', async () => {
  const result = await dialog.showOpenDialog(win, {
    title: 'Select application',
    defaultPath: '/Applications',
    properties: ['openFile'],
    filters: [{ name: 'Applications', extensions: ['app'] }],
  });
  if (result.canceled || !result.filePaths.length) return null;
  const appPath = result.filePaths[0];
  const appName = path.basename(appPath, '.app');
  const detected = detectMdApps().map(a => a.path);
  const custom = (settings.customMdApps || []).map(a => a.path);
  if (detected.includes(appPath) || custom.includes(appPath)) return { error: 'already_exists' };
  if (!settings.customMdApps) settings.customMdApps = [];
  settings.customMdApps.push({ name: appName, path: appPath });
  saveSettings();
  return { name: appName, path: appPath };
});

ipcMain.handle('mdapps:remove', (_evt, appPath) => {
  // Remove from custom list
  settings.customMdApps = (settings.customMdApps || []).filter(a => a.path !== appPath);
  // Hide from detected list
  if (!settings.hiddenDetectedApps) settings.hiddenDetectedApps = [];
  if (!settings.hiddenDetectedApps.includes(appPath)) settings.hiddenDetectedApps.push(appPath);
  // Clear default if removed
  if (settings.defaultMdApp === appPath) settings.defaultMdApp = null;
  saveSettings();
  return true;
});

ipcMain.on('window:hide', () => {
  if (win) win.hide();
});

ipcMain.on('shell:openExternal', (_evt, url) => {
  if (typeof url === 'string' && /^https?:\/\//i.test(url)) {
    shell.openExternal(url);
  }
});

ipcMain.handle('startup:get', () => app.getLoginItemSettings().openAtLogin);
ipcMain.handle('startup:set', (_evt, enabled) => {
  app.setLoginItemSettings({ openAtLogin: !!enabled });
  return app.getLoginItemSettings().openAtLogin;
});

ipcMain.on('window:resize', (_evt, height) => {
  if (!win) return;
  const trayBounds = tray ? tray.getBounds() : { x: 0, y: 0 };
  const display = screen.getDisplayNearestPoint({ x: trayBounds.x, y: trayBounds.y });
  const cap = Math.floor(display.workArea.height * 0.8);
  const h = Math.max(160, Math.min(Math.round(height), cap));
  const [w, currentH] = win.getSize();
  if (Math.abs(currentH - h) < 4) return;
  win.setSize(w, h, false);
});

// ---- Update / log / bug IPC ----
ipcMain.handle('app:version', () => app.getVersion());

ipcMain.handle('update:state', () => updateState);

ipcMain.handle('update:check', () => {
  return autoUpdater.checkForUpdates().catch(err => { log.error(err.message); return null; });
});

ipcMain.handle('update:install', () => {
  autoUpdater.quitAndInstall();
});

ipcMain.handle('app:open-log', () => {
  const logPath = log.transports.file.getFile().path;
  log.info('Opening log file:', logPath);
  shell.openPath(logPath);
});

ipcMain.handle('app:report-bug', () => {
  const version = app.getVersion();
  const osInfo = `${process.platform} ${os.release()}`;
  const body = encodeURIComponent(
    `**Version :** ${version}\n**OS :** ${osInfo}\n\n**Description du bug :**\n\n**Étapes pour reproduire :**\n\n**Logs :**\n\`\`\`\n(coller ici les lignes du log)\n\`\`\`\n`
  );
  shell.openExternal(`https://github.com/Walden73/searchidian/issues/new?title=Bug+report+v${version}&body=${body}`);
});

// ---------------- Lifecycle ----------------

app.whenReady().then(() => {
  loadSettings();
  createTray();
  createWindow();
  globalShortcut.register('CommandOrControl+Shift+Space', toggleWindow);
  // Check for updates 8s after launch (silently)
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(err => log.error('Update check failed:', err.message));
  }, 8000);
});

app.on('window-all-closed', (e) => {
  // Keep app alive in menubar
  e.preventDefault?.();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
