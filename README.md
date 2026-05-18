# Searchidian

Menubar search across **all** your Obsidian vaults on macOS.

![Searchidian screenshot](assets/Searchidian%20Screenshot.png)

## Features

- Lives in the menubar (Obsidian logo, no Dock entry).
- Searches every vault registered in Obsidian's config.
- Ranks results: title matches first, then by number of occurrences in body.
- Hover a result → live full-file preview on the left.
- Click a result → opens directly in Obsidian.
- **Resizable split** — drag the divider between results and preview to your taste; the width is remembered between launches.
- **Fixed preview header** — note title stays pinned at the top of the preview pane while you scroll.
- **Match stepper** — jump between highlighted matches with ▲ / ▼ (or Shift+↑ / Shift+↓).
- **Eye toggle** — hide or show match highlights in the preview while keeping navigation working.
- **Font-size slider** (80%–200%) for the preview, persisted across launches.
- **Compact mode** toggle (titles only) for dense result lists.
- **Settings panel (⚙)** — enable/disable individual vaults from the search scope, and toggle **Launch at startup**.
- Quoted queries (`"foo"`) match whole words; unquoted multi-word queries are AND across words.
- Global shortcut: **⌘⇧Space** to open.
- Dark mode aware.

## Download (macOS)

Grab the latest DMG from the [Releases page](https://github.com/Walden73/searchidian/releases/latest).

The DMG is a **universal build** (works on Apple Silicon and Intel Macs).

### First launch on macOS

Searchidian is **not signed with an Apple Developer certificate** (it's a free community app). On first launch, macOS will block it with:

> "Searchidian" cannot be opened because the developer cannot be verified.

To bypass this once:

1. **Right-click** (or Ctrl-click) on `Searchidian.app` in Applications → **Open** → confirm **Open** in the dialog.

Or via Terminal:

```bash
xattr -cr /Applications/Searchidian.app
```

After that, it launches normally like any other app.

## Build from source

```bash
git clone https://github.com/Walden73/searchidian.git
cd searchidian
npm install
npm start
```

Look at the top of your screen for the Obsidian logo in the menubar. Click it (or press ⌘⇧Space) to open the search.

To produce your own DMG:

```bash
npm run dist
```

Output lands in `dist/`.

## Platform support

| Platform | Status |
|---|---|
| macOS — Apple Silicon (M1/M2/M3/M4) | ✅ Tested |
| macOS — Intel | ⚠️ Built (universal DMG) but **not tested** by the author |
| Windows | ❌ Not built yet — see Roadmap |
| Linux | ❌ Not built yet — see Roadmap |

If you're on Intel Mac and run into issues, please [open an issue](https://github.com/Walden73/searchidian/issues) — feedback welcome.

## How it finds your vaults

Reads `~/Library/Application Support/obsidian/obsidian.json`, which Obsidian maintains automatically. Any vault you've opened at least once will be searched (unless you disable it from the ⚙ panel).

## How search works

Uses **ripgrep** (bundled via `@vscode/ripgrep`) to scan `.md` files across all enabled vault paths. Smart-case, JSON output, results aggregated per file:
- `titleMatch` (filename contains query) → ranks first.
- Body matches counted → ties broken by count desc, then alphabetical.
- Multi-word query: one ripgrep per word in parallel, intersection of files.
- Quoted query: word-boundary regex (`\b…\b`).

Settings (disabled vaults, split width, font scale, highlights visibility) persist to `~/Library/Application Support/Searchidian/settings.json` and per-window in `localStorage`.

## Roadmap

**Platform expansion** (contributions welcome — the author only has macOS Apple Silicon to test on):
- Windows build (via GitHub Actions CI)
- Linux build (AppImage / .deb, via GitHub Actions CI)
- Mobile companion app (iOS / Android) — long-term

**Features (RAG)** — architecture chosen to allow future semantic search:
- Add an embeddings index (e.g. `transformers.js` for local, or call an API).
- Persist vectors in `~/Library/Application Support/Searchidian/`.
- Add a `/ask` mode in the same UI that retrieves top-k notes and queries an LLM.

## Support the project

Searchidian is free and open-source. If it's useful to you, you can [buy me a coffee on Ko-fi](https://ko-fi.com/franckwalden) ☕ — no obligation, much appreciated.
