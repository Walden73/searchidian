const { spawn } = require('child_process');
const path = require('path');

let rgPathPromise = null;
function getRgPath() {
  if (!rgPathPromise) {
    rgPathPromise = import('@vscode/ripgrep').then((m) =>
      m.rgPath.replace(/app\.asar(?!\.unpacked)/, 'app.asar.unpacked')
    );
  }
  return rgPathPromise;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function basenameNoExt(p) {
  const b = path.basename(p);
  const i = b.lastIndexOf('.');
  return i > 0 ? b.slice(0, i) : b;
}

// Parse a user query into search tokens.
//  - "quoted"         → wordBoundary mode (matches as whole word/phrase)
//  - foo bar          → substring AND of each word
function parseQuery(raw) {
  const q = raw.trim();
  if (!q) return { mode: 'empty', tokens: [], wordBoundary: false };
  const m = q.match(/^["“](.+)["”]$/);
  if (m) return { mode: 'phrase', tokens: [m[1]], wordBoundary: true };
  const tokens = q.split(/\s+/).filter(Boolean);
  return {
    mode: tokens.length > 1 ? 'all' : 'substring',
    tokens,
    wordBoundary: false,
  };
}

function buildRgPattern(token, wordBoundary) {
  const esc = escapeRegex(token);
  return wordBoundary ? `\\b${esc}\\b` : esc;
}

function titleMatches(title, tokens, wordBoundary) {
  const lower = title.toLowerCase();
  if (wordBoundary) {
    return tokens.every((t) =>
      new RegExp(`\\b${escapeRegex(t)}\\b`, 'i').test(lower)
    );
  }
  return tokens.every((t) => lower.includes(t.toLowerCase()));
}

// Run ripgrep for a single pattern, return Map<path, {count, snippet}>.
function rgPattern(rgPath, pattern, vaultPaths, signal) {
  return new Promise((resolve, reject) => {
    const args = [
      '--json',
      '--type', 'md',
      '-S',
      '--max-filesize', '5M',
      pattern,
      ...vaultPaths,
    ];
    const child = spawn(rgPath, args, { signal });
    const files = new Map();
    let buffer = '';

    child.stdout.on('data', (chunk) => {
      buffer += chunk.toString('utf8');
      let idx;
      while ((idx = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 1);
        if (!line) continue;
        try {
          const evt = JSON.parse(line);
          if (evt.type === 'match') {
            const filePath = evt.data.path.text;
            let entry = files.get(filePath);
            if (!entry) {
              entry = { count: 0, snippet: null };
              files.set(filePath, entry);
            }
            entry.count += (evt.data.submatches || []).length || 1;
            if (!entry.snippet) {
              const text = evt.data.lines.text || '';
              entry.snippet = text.replace(/\s+/g, ' ').trim().slice(0, 240);
            }
          }
        } catch (_) { /* skip malformed */ }
      }
    });

    let stderr = '';
    child.stderr.on('data', (d) => (stderr += d.toString()));
    child.on('error', (err) => {
      if (err.name === 'AbortError') resolve(new Map());
      else reject(err);
    });
    child.on('close', (code) => {
      if (code !== 0 && code !== 1) {
        return reject(new Error(`ripgrep exited ${code}: ${stderr}`));
      }
      resolve(files);
    });
  });
}

// List all .md files under the given vaults.
function rgFiles(rgPath, vaultPaths, signal) {
  return new Promise((resolve, reject) => {
    const child = spawn(rgPath, ['--files', '--type', 'md', ...vaultPaths], { signal });
    const out = [];
    let buffer = '';
    child.stdout.on('data', (chunk) => {
      buffer += chunk.toString('utf8');
      let idx;
      while ((idx = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 1);
        if (line) out.push(line);
      }
    });
    child.on('error', (err) => {
      if (err.name === 'AbortError') resolve([]);
      else reject(err);
    });
    child.on('close', (code) => {
      if (code !== 0 && code !== 1) return resolve([]);
      resolve(out);
    });
  });
}

async function search(raw, vaultPaths, { signal } = {}) {
  const parsed = parseQuery(raw);
  if (parsed.mode === 'empty' || vaultPaths.length === 0) return [];

  const rgPath = await getRgPath();

  // Run one ripgrep per token in parallel. Patterns include \b boundaries when quoted.
  const perToken = await Promise.all(
    parsed.tokens.map((tok) =>
      rgPattern(rgPath, buildRgPattern(tok, parsed.wordBoundary), vaultPaths, signal)
    )
  );

  // Intersect files: keep only paths present in ALL token results (AND semantics).
  let common;
  if (perToken.length === 1) {
    common = new Set(perToken[0].keys());
  } else {
    common = new Set(perToken[0].keys());
    for (let i = 1; i < perToken.length; i++) {
      const next = perToken[i];
      for (const p of common) if (!next.has(p)) common.delete(p);
    }
  }

  // Build merged results: sum counts, snippet = first token's snippet for that file.
  const merged = new Map();
  for (const filePath of common) {
    let totalCount = 0;
    let snippet = null;
    for (const m of perToken) {
      const entry = m.get(filePath);
      if (entry) {
        totalCount += entry.count;
        if (!snippet && entry.snippet) snippet = entry.snippet;
      }
    }
    merged.set(filePath, { count: totalCount, snippet: snippet || '' });
  }

  // Title-only matches: files whose basename matches ALL tokens (AND).
  try {
    const allFiles = await rgFiles(rgPath, vaultPaths, signal);
    for (const filePath of allFiles) {
      if (merged.has(filePath)) continue;
      const name = path.basename(filePath);
      if (titleMatches(name, parsed.tokens, parsed.wordBoundary)) {
        merged.set(filePath, { count: 0, snippet: '' });
      }
    }
  } catch (_) { /* non-fatal */ }

  // Build sortable result array with titleMatch flag.
  const results = [];
  for (const [filePath, info] of merged.entries()) {
    const title = basenameNoExt(filePath);
    const titleMatch = titleMatches(title, parsed.tokens, parsed.wordBoundary);
    results.push({
      path: filePath,
      title,
      titleMatch,
      count: info.count,
      snippet: info.snippet,
    });
  }

  results.sort((a, b) => {
    if (a.titleMatch !== b.titleMatch) return a.titleMatch ? -1 : 1;
    if (b.count !== a.count) return b.count - a.count;
    return a.title.localeCompare(b.title);
  });

  return results.slice(0, 200);
}

module.exports = { search, parseQuery };
