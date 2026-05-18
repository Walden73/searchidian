# Searchidian

Menubar search across **all** your Obsidian vaults on macOS.

- Lives in the menubar (🔍 icon, no Dock entry).
- Searches every vault registered in Obsidian's config.
- Ranks results: title matches first, then by number of occurrences in body.
- Hover a result → live full-file preview on the left.
- Click a result → opens directly in Obsidian.
- Compact mode toggle (titles only).
- Vault manager (⚙) to enable/disable individual vaults from the search scope.
- Quoted queries (`"foo"`) match whole words; unquoted multi-word queries are AND across words.
- Preview font-size slider (80%–200%) + match stepper to jump between highlights.
- Global shortcut: **⌘⇧Space** to open.

## Install & run

```bash
cd "/Volumes/SSD Rapidor/BANK DOCUMENTS/Mes-Codes/Searchidian"
npm install
npm start
```

First launch: look at the top of your screen for the 🔍 emoji in the menubar. Click it (or press ⌘⇧Space) to open the search.

## Package as a .app

```bash
npm run dist
```

The DMG lands in `dist/`. Drag `Searchidian.app` to Applications.

## How it finds your vaults

Reads `~/Library/Application Support/obsidian/obsidian.json`, which Obsidian maintains automatically. Any vault you've opened at least once will be searched (unless you disable it from the ⚙ panel).

## How search works

Uses **ripgrep** (bundled via `@vscode/ripgrep`) to scan `.md` files across all enabled vault paths. Smart-case, JSON output, results aggregated per file:
- `titleMatch` (filename contains query) → ranks first.
- Body matches counted → ties broken by count desc, then alphabetical.
- Multi-word query: one ripgrep per word in parallel, intersection of files.
- Quoted query: word-boundary regex (`\b…\b`).

Settings (disabled vaults) persist to `~/Library/Application Support/Searchidian/settings.json`.

## Roadmap (RAG)

Architecture chosen to allow future RAG features:
- Add an embeddings index (e.g. `transformers.js` for local, or call an API).
- Persist vectors in `~/Library/Application Support/Searchidian/`.
- Add a `/ask` mode in the same UI that retrieves top-k notes and queries an LLM.
