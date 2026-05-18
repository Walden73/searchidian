const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage, shell, screen, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');
const { listVaults, vaultForFile, topLevelVaultPaths } = require('./src/vaults');
const { search } = require('./src/search');

let tray = null;
let win = null;
let currentAbort = null;
let settings = { disabledVaults: [] };

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

// ---------------- Lifecycle ----------------

app.whenReady().then(() => {
  loadSettings();
  createTray();
  createWindow();
  // Global shortcut: Cmd+Shift+Space to toggle
  globalShortcut.register('CommandOrControl+Shift+Space', toggleWindow);
});

app.on('window-all-closed', (e) => {
  // Keep app alive in menubar
  e.preventDefault?.();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
