const fs = require('fs');
const os = require('os');
const path = require('path');

const OBSIDIAN_CONFIG = path.join(
  os.homedir(),
  'Library',
  'Application Support',
  'obsidian',
  'obsidian.json'
);

function listVaults() {
  if (!fs.existsSync(OBSIDIAN_CONFIG)) return [];
  try {
    const raw = fs.readFileSync(OBSIDIAN_CONFIG, 'utf8');
    const data = JSON.parse(raw);
    const entries = Object.values(data.vaults || {});
    return entries
      .filter((v) => v && v.path && fs.existsSync(v.path))
      .map((v) => ({
        path: v.path,
        name: path.basename(v.path),
        open: v.open === true,
      }));
  } catch (err) {
    console.error('Failed to read obsidian config:', err);
    return [];
  }
}

// Return only top-level vault paths (drop any vault nested inside another).
// Used to avoid double-scanning the same .md file.
function topLevelVaultPaths(vaults) {
  const paths = vaults.map((v) => v.path);
  return paths.filter((p) => {
    return !paths.some((other) => other !== p && p.startsWith(other + path.sep));
  });
}

function vaultForFile(filePath, vaults) {
  let best = null;
  for (const v of vaults) {
    if (filePath.startsWith(v.path + path.sep) || filePath === v.path) {
      if (!best || v.path.length > best.path.length) best = v;
    }
  }
  return best;
}

module.exports = { listVaults, vaultForFile, topLevelVaultPaths };
